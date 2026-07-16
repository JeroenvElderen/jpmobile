import { Ionicons } from "@expo/vector-icons";

import { sendAdminPushNotification } from "@/lib/pushTokens";
import { supabase } from "@/lib/supabase";

export type BookingStatus = "Confirmed" | "Pending" | "Cancelled";

export type BookingStat = {
  id: number;
  title: string;
  value: string;
  change: string;
  positive: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bg: string;
};

export type Booking = {
  id: string;
  rawId: string;
  createdAt: string;
  client: string;
  dog: string;
  breed: string;
  dogImage: string;
  service: string;
  serviceIcon: keyof typeof Ionicons.glyphMap;
  serviceDetail: string;
  scheduleDay: string;
  time: string;
  duration: string;
  status: BookingStatus;
  startsAtIso?: string;
  endsAtIso?: string;
};

export type BookingsData = {
  clientId?: string;
  stats: BookingStat[];
  bookings: Booking[];
};

type PortalBookingRow = {
  id: string;
  client_id: string | null;
  client_name: string | null;
  dog_name: string | null;
  service_name: string | null;
  starts_at: string | null;
  ends_at: string | null;
  location: string | null;
  status: string | null;
  source: string | null;
  sync_status: string | null;
  cover_image_url: string | null;
  notes: string | null;
};

type PortalClient = {
  id: string;
};

const fallbackDogImage = "https://placedog.net/220/220?id=102";

export async function fetchAdminBookingsData(): Promise<BookingsData> {
  const { data, error } = await supabase
    .from("admin_booking_calendar")
    .select("id, client_id, client_name, dog_name, service_name, starts_at, ends_at, location, status, source, sync_status, cover_image_url, notes")
    .order("starts_at", { ascending: true })
    .limit(25)
    .returns<PortalBookingRow[]>();

  if (error) {
    throw error;
  }

  const bookings = data.map(mapBookingRow).sort(sortBookingsForAdmin);

  return {
    stats: buildBookingStats(bookings),
    bookings,
  };
}

export async function cancelClientBooking(bookingId: string) {
  const { error } = await supabase
    .from("portal_bookings")
    .update({ status: "cancelled", sync_status: "needs_review", needs_review: true })
    .eq("id", bookingId);

  if (error) throw error;

await sendAdminPushNotification({
    title: "Booking cancelled",
    body: "A client cancelled a booking and it needs review.",
    url: "/admin?tab=bookings",
    type: "booking_cancelled",
  });
}

export async function rescheduleClientBooking({ bookingId, startsAt, endsAt }: { bookingId: string; startsAt: string; endsAt?: string }) {
  const { error } = await supabase
    .from("portal_bookings")
    .update({ starts_at: startsAt, ends_at: endsAt ?? null, sync_status: "needs_review", needs_review: true, status: "needs_review" })
    .eq("id", bookingId);

  if (error) throw error;

  await sendAdminPushNotification({
    title: "Reschedule requested",
    body: "A client requested a booking time change.",
    url: "/admin?tab=bookings",
    type: "booking_reschedule_requested",
  });
}

export async function fetchClientBookingsData(): Promise<BookingsData> {
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  const user = userData.user;

  if (!user) {
    throw new Error("Log in to view your bookings.");
  }

  const { data: client, error: clientError } = await supabase
    .from("portal_clients")
    .select("id")
    .eq("auth_user_id", user.id)
    .single<PortalClient>();

  if (clientError) {
    throw clientError;
  }

  const { data, error } = await supabase
    .from("portal_booking_list")
    .select("id, client_id, client_name, dog_name, service_name, starts_at, ends_at, location, status, source, sync_status, cover_image_url, notes")
    .order("starts_at", { ascending: true })
    .limit(25)
    .returns<PortalBookingRow[]>();

  if (error) {
    throw error;
  }

  const bookings = data.map(mapBookingRow);

  return {
    clientId: client.id,
    stats: buildBookingStats(bookings),
    bookings,
  };
}

function sortBookingsForAdmin(a: Booking, b: Booking) {
  if (a.status === "Pending" && b.status !== "Pending") return -1;
  if (a.status !== "Pending" && b.status === "Pending") return 1;
  return a.scheduleDay.localeCompare(b.scheduleDay) || a.time.localeCompare(b.time);
}

function mapBookingRow(row: PortalBookingRow): Booking {
  const startsAt = row.starts_at ? new Date(row.starts_at) : null;
  const endsAt = row.ends_at ? new Date(row.ends_at) : null;
  const serviceName = row.service_name || "Dog Walk";

  return {
    id: formatBookingId(row.id),
    rawId: row.id,
    createdAt: startsAt ? formatDate(startsAt) : "Date TBC",
    client: row.client_name || "Client TBC",
    dog: row.dog_name || "Dog TBC",
    breed: row.location || "Location TBC",
    dogImage: row.cover_image_url || fallbackDogImage,
    service: getService(serviceName),
    startsAtIso: row.starts_at || undefined,
    endsAtIso: row.ends_at || undefined,
    serviceIcon: getServiceIcon(serviceName),
    serviceDetail: row.notes || row.sync_status || row.source || "Scheduled service",
    scheduleDay: startsAt ? formatScheduleDay(startsAt) : "Date TBC",
    time: startsAt ? formatTime(startsAt) : "Time TBC",
    duration: formatDuration(startsAt, endsAt),
    status: normalizeBookingStatus(row.status),
  };
}

function buildBookingStats(bookings: Booking[]): BookingStat[] {
  const total = bookings.length;
  const pending = bookings.filter((booking) => booking.status === "Pending").length;
  const confirmed = bookings.filter((booking) => booking.status === "Confirmed").length;
  const cancelled = bookings.filter((booking) => booking.status === "Cancelled").length;

  return [
    { id: 1, title: "Total Bookings", value: String(total), change: "Live", positive: true, icon: "calendar-outline", color: "#5B3DF5", bg: "#F3EEFF" },
    { id: 2, title: "Pending", value: String(pending), change: "Live", positive: pending === 0, icon: "time-outline", color: "#F97316", bg: "#FFF5EB" },
    { id: 3, title: "Confirmed", value: String(confirmed), change: "Live", positive: true, icon: "checkmark-circle-outline", color: "#16A34A", bg: "#ECFDF3" },
    { id: 4, title: "Cancelled", value: String(cancelled), change: "Live", positive: cancelled === 0, icon: "close-circle-outline", color: "#E11D48", bg: "#FFEAF0" },
  ];
}

function normalizeBookingStatus(status: string | null): BookingStatus {
  if (status === "cancelled" || status === "canceled") return "Cancelled";
  if (status === "confirmed" || status === "completed") return "Confirmed";
  return "Pending";
}

function getService(serviceName: string): Booking["service"] {
  return serviceName || "Dog Walk";
}

function getServiceIcon(serviceName: string): keyof typeof Ionicons.glyphMap {
  if (/train/i.test(serviceName)) return "school-outline";
  if (/sit|house|overnight/i.test(serviceName)) return "home-outline";
  if (/drop|visit|check/i.test(serviceName)) return "home-outline";

  return "paw-outline";
}

function formatBookingId(id: string) {
  return `#BKG-${id.slice(0, 8).toUpperCase()}`;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(date);
}

function formatScheduleDay(date: Date) {
  const today = startOfDay(new Date());
  const target = startOfDay(date);
  const diffDays = Math.round((target.getTime() - today.getTime()) / 86_400_000);
  const formatted = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);

  if (diffDays === 0) return `Today, ${formatted}`;
  if (diffDays === 1) return `Tomorrow, ${formatted}`;

  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function formatDuration(startsAt: Date | null, endsAt: Date | null) {
  if (!startsAt || !endsAt) return "Duration TBC";

  const minutes = Math.max(0, Math.round((endsAt.getTime() - startsAt.getTime()) / 60_000));

  return minutes > 0 ? `${minutes} min` : "Duration TBC";
}

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}