import { createClient } from "https://esm.sh/@supabase/supabase-js@2.110.2";

const ADMIN_EMAIL = "jeroen@jeroenandpaws.com";
const fallbackDogImage = "https://placedog.net/220/220?id=301";
const trendDays = 7;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type AdminAction =
  | { type: "fetch" }
  | { type: "create-client"; payload: { fullName: string; email: string; phone?: string } }
  | { type: "create-dog"; payload: { clientId: string; name: string; breed?: string; age?: string; notes?: string } }
  | { type: "create-booking"; payload: { clientId: string; dogId: string; serviceName: string; startsAt: string; location?: string; notes?: string } };

type PortalBooking = {
  id: string;
  dog_name: string | null;
  service_name: string | null;
  starts_at: string | null;
  location: string | null;
  status: string | null;
  cover_image_url: string | null;
  price_cents?: number | null;
  total_cents?: number | null;
};

type PortalActivity = {
  id: string;
  activity_type: string | null;
  title: string;
  body: string | null;
  created_at: string;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = requireEnv("SUPABASE_URL");
    const anonKey = requireEnv("SUPABASE_ANON_KEY");
    const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
    const authorization = req.headers.get("Authorization");

    if (!authorization) {
      return json({ error: "Missing authorization header." }, 401);
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();

    if (userError || !userData.user) {
      return json({ error: userError?.message || "Not authenticated." }, 401);
    }

    const email = userData.user.email?.toLowerCase();
    if (email !== ADMIN_EMAIL) {
      return json({ error: "Admin access is required." }, 403);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const action = (await req.json().catch(() => ({ type: "fetch" }))) as AdminAction;

    if (!action.type || action.type === "fetch") {
      return json({ data: await fetchDashboard(adminClient) });
    }

    if (action.type === "create-client") {
      await createClientRecord(adminClient, action.payload);
      return json({ data: await fetchDashboard(adminClient) });
    }

    if (action.type === "create-dog") {
      await createDogRecord(adminClient, action.payload);
      return json({ data: await fetchDashboard(adminClient) });
    }

    if (action.type === "create-booking") {
      await createBookingRecord(adminClient, action.payload);
      return json({ data: await fetchDashboard(adminClient) });
    }

    return json({ error: "Unsupported admin action." }, 400);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Admin dashboard failed." }, 500);
  }
});

async function fetchDashboard(supabase: ReturnType<typeof createClient>) {
  const now = new Date();
  const todayStart = startOfDay(now);
  const tomorrowStart = addDays(todayStart, 1);
  const weekStart = addDays(todayStart, -(trendDays - 1));

  const [todayBookings, yesterdayBookings, pendingBookings, completedBookings, scheduleResult, trendResult, activitiesResult] = await Promise.all([
    countRows(supabase, "portal_bookings", "starts_at", todayStart, tomorrowStart),
    countRows(supabase, "portal_bookings", "starts_at", addDays(todayStart, -1), todayStart),
    countRows(supabase, "portal_bookings", undefined, undefined, undefined, "status", "pending"),
    countRows(supabase, "portal_bookings", undefined, undefined, undefined, "status", "completed"),
    supabase
      .from("admin_booking_calendar")
      .select("id, dog_name, service_name, starts_at, location, status, cover_image_url")
      .gte("starts_at", todayStart.toISOString())
      .lt("starts_at", tomorrowStart.toISOString())
      .order("starts_at", { ascending: true })
      .limit(5),
    supabase
      .from("admin_booking_calendar")
      .select("id, starts_at, status")
      .gte("starts_at", weekStart.toISOString())
      .order("starts_at", { ascending: true }),
    supabase
      .from("portal_client_activity")
      .select("id, activity_type, title, body, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  for (const result of [todayBookings, yesterdayBookings, pendingBookings, completedBookings, scheduleResult, trendResult, activitiesResult]) {
    if (result.error) throw result.error;
  }

  const todayCount = todayBookings.count ?? 0;
  const yesterdayCount = yesterdayBookings.count ?? 0;
  const trendBookings = (trendResult.data ?? []) as PortalBooking[];

  return {
    stats: [
      makeStat("Today's Bookings", todayCount, getPercentChange(todayCount, yesterdayCount), true, "calendar-outline", "#5B3DF5", "#F3EEFF"),
      makeStat("Pending", pendingBookings.count ?? 0, "Live", false, "time-outline", "#F97316", "#FFF5EB"),
      makeStat("Completed", completedBookings.count ?? 0, "Live", true, "checkmark-circle-outline", "#16A34A", "#ECFDF3"),
      makeStat("Total Earnings", "€0", "Invoices later", true, "cash-outline", "#5B3DF5", "#F3EEFF"),
    ],
    schedule: ((scheduleResult.data ?? []) as PortalBooking[]).map(mapScheduleItem),
    bookingTrend: buildTrend(trendBookings, () => 1),
    revenueTrend: Array.from({ length: trendDays }, () => 0),
    activities: ((activitiesResult.data ?? []) as PortalActivity[]).map(mapActivity),
    notificationCount: (pendingBookings.count ?? 0) + todayCount,
  };
}

async function countRows(supabase: ReturnType<typeof createClient>, table: string, dateColumn?: string, from?: Date, to?: Date, eqColumn?: string, eqValue?: string) {
  let query = supabase.from(table).select("id", { count: "exact", head: true });
  if (dateColumn && from) query = query.gte(dateColumn, from.toISOString());
  if (dateColumn && to) query = query.lt(dateColumn, to.toISOString());
  if (eqColumn && eqValue) query = query.eq(eqColumn, eqValue);
  return query;
}

async function createClientRecord(supabase: ReturnType<typeof createClient>, input: { fullName: string; email: string; phone?: string }) {
  const fullName = required(input.fullName, "Client name");
  const [firstName] = fullName.split(/\s+/);
  const { error } = await supabase.from("portal_clients").insert({
    full_name: fullName,
    first_name: firstName,
    email: required(input.email, "Client email"),
    phone: input.phone?.trim() || null,
    status: "active",
  });
  if (error) throw error;
}

async function createDogRecord(supabase: ReturnType<typeof createClient>, input: { clientId: string; name: string; breed?: string; age?: string; notes?: string }) {
  const { error } = await supabase.from("portal_dogs").insert({
    client_id: required(input.clientId, "Client ID"),
    name: required(input.name, "Dog name"),
    breed: input.breed?.trim() || null,
    age: input.age?.trim() || null,
    notes: input.notes?.trim() || null,
    status: "Active",
  });
  if (error) throw error;
}

async function createBookingRecord(supabase: ReturnType<typeof createClient>, input: { clientId: string; dogId: string; serviceName: string; startsAt: string; location?: string; notes?: string }) {
  const startsAt = new Date(required(input.startsAt, "Start time"));
  if (Number.isNaN(startsAt.getTime())) throw new Error("Enter a valid start time.");

  const endsAt = new Date(startsAt);
  endsAt.setHours(endsAt.getHours() + 1);

  const { error } = await supabase.from("portal_bookings").insert({
    client_id: required(input.clientId, "Client ID"),
    dog_id: required(input.dogId, "Dog ID"),
    dog_ids: [input.dogId],
    service_name: required(input.serviceName, "Service"),
    starts_at: startsAt.toISOString(),
    ends_at: endsAt.toISOString(),
    timezone: "Europe/Dublin",
    location: input.location?.trim() || null,
    notes: input.notes?.trim() || null,
    status: "pending",
    source: "manual",
    sync_status: "pending",
  });
  if (error) throw error;
}

function makeStat(title: string, value: number | string, change: string, positive: boolean, icon: string, iconColor: string, iconBackground: string) {
  return { title, value: String(value), change, positive, icon, iconColor, iconBackground };
}

function mapScheduleItem(booking: PortalBooking) {
  const startsAt = booking.starts_at ? new Date(booking.starts_at) : null;
  return {
    id: booking.id,
    time: startsAt ? new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", hour12: false }).format(startsAt) : "TBC",
    period: startsAt ? new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: true }).format(startsAt).split(" ")[1] : "",
    dog: booking.dog_name || "Dog TBC",
    service: booking.service_name || "Pet care",
    status: toTitleCase(booking.status || "pending"),
    location: booking.location || "Location TBC",
    avatar: booking.cover_image_url || fallbackDogImage,
  };
}

function mapActivity(activity: PortalActivity) {
  const style = activityStyle(activity.activity_type || "update");
  return { id: activity.id, icon: style.icon, color: style.color, title: activity.title, subtitle: activity.body || "Business update", time: formatRelativeDate(new Date(activity.created_at)) };
}

function activityStyle(type: string) {
  if (type === "booking") return { icon: "calendar-outline", color: "#5B3DF5" };
  if (type === "client") return { icon: "person-add-outline", color: "#0EA5E9" };
  if (type === "dog") return { icon: "paw-outline", color: "#16A34A" };
  if (type === "invoice") return { icon: "cash-outline", color: "#F97316" };
  return { icon: "checkmark-circle-outline", color: "#16A34A" };
}

function buildTrend(bookings: PortalBooking[], valueForBooking: (booking: PortalBooking) => number) {
  const today = startOfDay(new Date());
  return Array.from({ length: trendDays }, (_, index) => {
    const day = addDays(today, index - (trendDays - 1));
    return bookings.filter((booking) => booking.starts_at && startOfDay(new Date(booking.starts_at)).getTime() === day.getTime()).reduce((sum, booking) => sum + valueForBooking(booking), 0);
  });
}

function required(value: string | undefined, label: string) {
  const trimmed = value?.trim();
  if (!trimmed) throw new Error(`${label} is required.`);
  return trimmed;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function getPercentChange(current: number, previous: number) {
  if (previous === 0) return current > 0 ? "100%" : "0%";
  return `${Math.round(((current - previous) / previous) * 100)}%`;
}

function toTitleCase(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatRelativeDate(date: Date) {
  const diffDays = Math.floor((startOfDay(new Date()).getTime() - startOfDay(date).getTime()) / 86_400_000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
}

function requireEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}