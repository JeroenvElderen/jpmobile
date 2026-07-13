import { createClient } from "https://esm.sh/@supabase/supabase-js@2.110.2";

const ADMIN_EMAIL = "jeroen@jeroenandpaws.com";
const fallbackDogImage = "https://placedog.net/220/220?id=301";
const trendMonths = 6;
const defaultServices = ["Dog Walk", "Training Session", "Drop-in Visit", "Daycare", "Overnight Stay"];

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type AdminAction =
  | { type: "fetch" }
  | { type: "create-client"; payload: { fullName: string; email: string; phone?: string } }
  | { type: "update-client"; payload: { clientId: string; fullName: string; email: string } }
  | { type: "delete-client"; payload: { clientId: string } }
  | { type: "create-dog"; payload: { clientId: string; name: string; breed?: string; age?: string; notes?: string } }
  | { type: "update-dog"; payload: { dogId: string; breed?: string; age?: string; notes?: string } }
  | { type: "delete-dog"; payload: { dogId: string } }
  | { type: "create-booking"; payload: { clientId: string; dogId?: string; dogIds?: string[]; serviceName: string; startsAt: string; location?: string; notes?: string } }
  | { type: "update-booking"; payload: { bookingId: string; clientId?: string; dogId?: string; dogIds?: string[]; serviceName?: string; startsAt?: string; location?: string; notes?: string; status?: string } }
  | { type: "cancel-booking"; payload: { bookingId: string } }
  | { type: "confirm-booking"; payload: { bookingId: string } }
  | { type: "reschedule-booking"; payload: { bookingId: string; startsAt: string } }
  | { type: "set-dog-status"; payload: { dogId: string; active: boolean } }
  | { type: "set-client-status"; payload: { clientId: string; active: boolean } };

type PortalBooking = {
  id: string;
  client_id?: string | null;
  dog_name: string | null;
  service_name: string | null;
  starts_at: string | null;
  location: string | null;
  status: string | null;
  cover_image_url: string | null;
  price_cents?: number | null;
  total_cents?: number | null;
};

type PortalClientOption = {
  id: string;
  full_name: string;
  address: string | null;
};

type PortalDogOption = {
  id: string;
  client_id: string;
  name: string;
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

    if (action.type === "update-client") {
      await updateClientRecord(adminClient, action.payload);
      return json({ data: await fetchDashboard(adminClient) });
    }

    if (action.type === "delete-client") {
      await deleteClientRecord(adminClient, action.payload.clientId);
      return json({ data: await fetchDashboard(adminClient) });
    }

    if (action.type === "create-dog") {
      await createDogRecord(adminClient, action.payload);
      return json({ data: await fetchDashboard(adminClient) });
    }

    if (action.type === "update-dog") {
      await updateDogRecord(adminClient, action.payload);
      return json({ data: await fetchDashboard(adminClient) });
    }

    if (action.type === "delete-dog") {
      await deleteDogRecord(adminClient, action.payload.dogId);
      return json({ data: await fetchDashboard(adminClient) });
    }

    if (action.type === "create-booking") {
      await createBookingRecord(adminClient, action.payload);
      return json({ data: await fetchDashboard(adminClient) });
    }

    if (action.type === "update-booking") {
      await updateBookingRecord(adminClient, action.payload);
      return json({ data: await fetchDashboard(adminClient) });
    }

    if (action.type === "cancel-booking") {
      await setBookingStatus(adminClient, action.payload.bookingId, "cancelled");
      return json({ data: await fetchDashboard(adminClient) });
    }

    if (action.type === "confirm-booking") {
      await setBookingStatus(adminClient, action.payload.bookingId, "confirmed");
      return json({ data: await fetchDashboard(adminClient) });
    }

    if (action.type === "reschedule-booking") {
      await rescheduleBooking(adminClient, action.payload);
      return json({ data: await fetchDashboard(adminClient) });
    }

    if (action.type === "set-dog-status") {
      await setDogStatus(adminClient, action.payload);
      return json({ data: await fetchDashboard(adminClient) });
    }

    if (action.type === "set-client-status") {
      await setClientStatus(adminClient, action.payload);
      return json({ data: await fetchDashboard(adminClient) });
    }

    return json({ error: "Unsupported admin action." }, 400);
  } catch (error) {
    return json({ error: getErrorMessage(error) }, 500);
  }
});

async function fetchDashboard(supabase: ReturnType<typeof createClient>) {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const previousMonthStart = addMonths(monthStart, -1);
  const nextMonthStart = addMonths(monthStart, 1);
  const trendStart = addMonths(monthStart, -(trendMonths - 1));

  const [monthBookings, previousMonthBookings, pendingBookings, completedBookings, scheduleResult, trendResult, activitiesResult, clientsResult, dogsResult, servicesResult] = await Promise.all([
    countRows(supabase, "portal_bookings", "starts_at", monthStart, nextMonthStart),
    countRows(supabase, "portal_bookings", "starts_at", previousMonthStart, monthStart),
    countRows(supabase, "portal_bookings", undefined, undefined, undefined, "status", "pending"),
    countRows(supabase, "portal_bookings", undefined, undefined, undefined, "status", "completed"),
    supabase
      .from("admin_booking_calendar")
      .select("id, dog_name, service_name, starts_at, location, status, cover_image_url")
      .gte("starts_at", monthStart.toISOString())
      .lt("starts_at", nextMonthStart.toISOString())
      .order("starts_at", { ascending: true })
      .limit(10),
    supabase
      .from("admin_booking_calendar")
      .select("id, starts_at, status")
      .gte("starts_at", trendStart.toISOString())
      .order("starts_at", { ascending: true }),
    supabase
      .from("portal_client_activity")
      .select("id, activity_type, title, body, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase.from("portal_clients").select("id, full_name, address").order("full_name", { ascending: true }),
    supabase.from("portal_dogs").select("id, client_id, name").order("name", { ascending: true }),
    supabase.from("portal_bookings").select("service_name").not("service_name", "is", null),
  ]);

  for (const result of [monthBookings, previousMonthBookings, pendingBookings, completedBookings, scheduleResult, trendResult, activitiesResult, clientsResult, dogsResult, servicesResult]) {
    if (result.error) throw result.error;
  }

  const monthCount = monthBookings.count ?? 0;
  const previousMonthCount = previousMonthBookings.count ?? 0;
  const trendBookings = (trendResult.data ?? []) as PortalBooking[];

  return {
    stats: [
      makeStat("This Month", monthCount, getPercentChange(monthCount, previousMonthCount), true, "calendar-outline", "#5B3DF5", "#F3EEFF"),
      makeStat("Pending", pendingBookings.count ?? 0, "Live", false, "time-outline", "#F97316", "#FFF5EB"),
      makeStat("Completed", completedBookings.count ?? 0, "Live", true, "checkmark-circle-outline", "#16A34A", "#ECFDF3"),
      makeStat("Total Earnings", "€0", "Invoices later", true, "cash-outline", "#5B3DF5", "#F3EEFF"),
    ],
    schedule: ((scheduleResult.data ?? []) as PortalBooking[]).map(mapScheduleItem),
    bookingTrend: buildTrend(trendBookings, () => 1),
    revenueTrend: Array.from({ length: trendMonths }, () => 0),
    activities: ((activitiesResult.data ?? []) as PortalActivity[]).map(mapActivity),
    notificationCount: (pendingBookings.count ?? 0) + monthCount,
    monthLabel: new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(monthStart),
    formOptions: buildFormOptions((clientsResult.data ?? []) as PortalClientOption[], (dogsResult.data ?? []) as PortalDogOption[], servicesResult.data ?? []),
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

async function updateClientRecord(supabase: ReturnType<typeof createClient>, input: { clientId: string; fullName: string; email: string }) {
  const fullName = required(input.fullName, "Client name");
  const [firstName] = fullName.split(/\s+/);
  const { error } = await supabase
    .from("portal_clients")
    .update({
      full_name: fullName,
      first_name: firstName,
      email: required(input.email, "Client email"),
    })
    .eq("id", required(input.clientId, "Client ID"));
  if (error) throw error;
}

async function deleteClientRecord(supabase: ReturnType<typeof createClient>, clientId: string) {
  const { error } = await supabase.from("portal_clients").delete().eq("id", required(clientId, "Client ID"));
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

async function updateDogRecord(supabase: ReturnType<typeof createClient>, input: { dogId: string; breed?: string; age?: string; notes?: string }) {
  const update = {
    breed: input.breed?.trim() || null,
    age: input.age?.trim() || null,
    notes: input.notes?.trim() || null,
  };
  const { error } = await supabase.from("portal_dogs").update(update).eq("id", required(input.dogId, "Dog ID"));
  if (error) throw error;
}

async function deleteDogRecord(supabase: ReturnType<typeof createClient>, dogId: string) {
  const { error } = await supabase.from("portal_dogs").delete().eq("id", required(dogId, "Dog ID"));
  if (error) throw error;
}

async function createBookingRecord(supabase: ReturnType<typeof createClient>, input: { clientId: string; dogId?: string; dogIds?: string[]; serviceName: string; startsAt: string; location?: string; notes?: string }) {
  const startsAt = new Date(required(input.startsAt, "Start time"));
  if (Number.isNaN(startsAt.getTime())) throw new Error("Enter a valid start time.");

  const endsAt = new Date(startsAt);
  endsAt.setHours(endsAt.getHours() + 1);

  const clientId = required(input.clientId, "Client");
  const dogIds = normalizeDogIds(input);
  const location = input.location?.trim() || (await fetchClientAddress(supabase, clientId));

  const { error } = await supabase.from("portal_bookings").insert({
    client_id: clientId,
    dog_id: dogIds[0],
    dog_ids: dogIds,
    service_name: required(input.serviceName, "Service"),
    starts_at: startsAt.toISOString(),
    ends_at: endsAt.toISOString(),
    timezone: "Europe/Dublin",
    location,
    notes: input.notes?.trim() || null,
    status: "pending",
    source: "manual",
    sync_status: "pending",
  });
  if (error) throw error;
}

async function updateBookingRecord(supabase: ReturnType<typeof createClient>, input: { bookingId: string; clientId?: string; dogId?: string; dogIds?: string[]; serviceName?: string; startsAt?: string; location?: string; notes?: string; status?: string }) {
  const update: Record<string, unknown> = {};
  if (input.clientId) update.client_id = input.clientId.trim();
  if (input.dogId || input.dogIds?.length) {
    const dogIds = normalizeDogIds(input);
    update.dog_id = dogIds[0];
    update.dog_ids = dogIds;
  }
  if (input.serviceName?.trim()) update.service_name = input.serviceName.trim();
  if (input.startsAt?.trim()) {
    const startsAt = parseDate(input.startsAt, "start time");
    const endsAt = new Date(startsAt);
    endsAt.setHours(endsAt.getHours() + 1);
    update.starts_at = startsAt.toISOString();
    update.ends_at = endsAt.toISOString();
  }
  if (input.location !== undefined) update.location = input.location.trim() || null;
  if (input.notes !== undefined) update.notes = input.notes.trim() || null;
  if (input.status?.trim()) update.status = normalizeBookingStatus(input.status);
  if (!Object.keys(update).length) return;

  const { error } = await supabase.from("portal_bookings").update(update).eq("id", required(input.bookingId, "Booking ID"));
  if (error) throw error;
}

async function setBookingStatus(supabase: ReturnType<typeof createClient>, bookingId: string, status: string) {
  const { error } = await supabase.from("portal_bookings").update({ status, cancelled_at: status === "cancelled" ? new Date().toISOString() : null }).eq("id", required(bookingId, "Booking ID"));
  if (error) throw error;
}

async function rescheduleBooking(supabase: ReturnType<typeof createClient>, input: { bookingId: string; startsAt: string }) {
  await updateBookingRecord(supabase, { bookingId: input.bookingId, startsAt: input.startsAt, status: "reschedule_requested" });
}

async function setDogStatus(supabase: ReturnType<typeof createClient>, input: { dogId: string; active: boolean }) {
  const { error } = await supabase.from("portal_dogs").update({ status: input.active ? "Active" : "Inactive" }).eq("id", required(input.dogId, "Dog ID"));
  if (error) throw error;
}

async function setClientStatus(supabase: ReturnType<typeof createClient>, input: { clientId: string; active: boolean }) {
  const { error } = await supabase.from("portal_clients").update({ status: input.active ? "active" : "inactive" }).eq("id", required(input.clientId, "Client ID"));
  if (error) throw error;
}

async function fetchClientAddress(supabase: ReturnType<typeof createClient>, clientId: string) {
  const { data, error } = await supabase.from("portal_clients").select("address").eq("id", clientId).maybeSingle<{ address: string | null }>();
  if (error) throw error;
  return data?.address?.trim() || null;
}

function buildFormOptions(clients: PortalClientOption[], dogs: PortalDogOption[], serviceRows: { service_name?: string | null }[]) {
  const dogsByClient = dogs.reduce<Record<string, PortalDogOption[]>>((groups, dog) => {
    groups[dog.client_id] = [...(groups[dog.client_id] || []), dog];
    return groups;
  }, {});

  return {
    clients: clients.map((client) => ({ id: client.id, name: client.full_name, address: client.address || "" })),
    dogsByClient: Object.fromEntries(
      Object.entries(dogsByClient).map(([clientId, clientDogs]) => [
        clientId,
        [
          ...clientDogs.map((dog) => ({ id: dog.id, ids: [dog.id], name: dog.name })),
          ...(clientDogs.length > 1 ? [{ id: "all", ids: clientDogs.map((dog) => dog.id), name: "All dogs" }] : []),
        ],
      ]),
    ),
    services: Array.from(new Set([...defaultServices, ...serviceRows.map((row) => row.service_name?.trim()).filter(Boolean) as string[]])).sort((a, b) => a.localeCompare(b)),
  };
}

function normalizeDogIds(input: { dogId?: string; dogIds?: string[] }) {
  const dogIds = (input.dogIds?.length ? input.dogIds : input.dogId ? [input.dogId] : []).map((dogId) => dogId.trim()).filter(Boolean);
  if (!dogIds.length) throw new Error("Dog is required.");
  return Array.from(new Set(dogIds));
}

function parseDate(value: string, label: string) {
  const date = new Date(required(value, label));
  if (Number.isNaN(date.getTime())) throw new Error(`Enter a valid ${label}.`);
  return date;
}

function normalizeBookingStatus(status: string) {
  const normalized = status.trim().toLowerCase().replace(/\s+/g, "_");
  if (!["pending", "confirmed", "cancelled", "reschedule_requested", "completed"].includes(normalized)) throw new Error("Unsupported booking status.");
  return normalized;
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
  const thisMonth = startOfMonth(new Date());
  return Array.from({ length: trendMonths }, (_, index) => {
    const month = addMonths(thisMonth, index - (trendMonths - 1));
    return bookings.filter((booking) => booking.starts_at && startOfMonth(new Date(booking.starts_at)).getTime() === month.getTime()).reduce((sum, booking) => sum + valueForBooking(booking), 0);
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

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
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

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  if (typeof error === "string" && error.trim()) return error;
  return "Admin dashboard failed.";
}