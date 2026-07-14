import type { Ionicons } from "@expo/vector-icons";

import { supabase } from "@/lib/supabase";

export type ClientBooking = {
  id: string;
  date: string;
  time: string;
  pet: string;
  service: string;
  status: "Confirmed" | "Pending";
  location: string;
  avatar: string;
  startsAtIso?: string;
  endsAtIso?: string;
};

export type ClientPet = {
  id: string;
  name: string;
  breed: string;
  age: string;
  carePlan: string;
  status: "Active" | "Needs review";
  avatar: string;
};

export type ClientActivity = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  title: string;
  subtitle: string;
  time: string;
};

export type ClientDashboardData = {
  clientId: string;
  clientName: string;
  notificationCount: number;
  bookings: ClientBooking[];
  pets: ClientPet[];
  activities: ClientActivity[];
};

type PortalClient = {
  id: string;
  full_name: string | null;
  first_name: string | null;
};

type PortalDog = {
  id: string;
  name: string;
  breed: string | null;
  age: string | null;
  status: string | null;
  profile_photo_url: string | null;
};

type PortalBooking = {
  id: string;
  dog_name: string | null;
  service_name: string | null;
  starts_at: string | null;
  ends_at: string | null;
  location: string | null;
  status: string | null;
  cover_image_url: string | null;
};

type PortalActivity = {
  id: string;
  activity_type: string | null;
  title: string;
  body: string | null;
  created_at: string;
};

const fallbackDogImage = "https://placedog.net/220/220?id=101";

const activityIconMap: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  booking: { icon: "calendar-outline", color: "#5B3DF5" },
  gallery: { icon: "images-outline", color: "#F97316" },
  update: { icon: "checkmark-circle-outline", color: "#16A34A" },
};

export async function cancelClientDashboardBooking(bookingId: string) {
  const { error } = await supabase.from("portal_bookings").update({ status: "cancelled", sync_status: "needs_review", needs_review: true }).eq("id", bookingId);
  if (error) throw error;
}

export async function deactivateClientDashboardPet(petId: string, clientId: string) {
  const { error } = await supabase.from("portal_dogs").update({ status: "inactive" }).eq("id", petId).eq("client_id", clientId);
  if (error) throw error;
}

export async function deleteClientDashboardPet(petId: string, clientId: string) {
  const { error } = await supabase.from("portal_dogs").delete().eq("id", petId).eq("client_id", clientId);
  if (error) throw error;
}

export async function fetchClientDashboardData(): Promise<ClientDashboardData> {
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  const user = userData.user;

  if (!user) {
    throw new Error("Log in to view your dashboard.");
  }

  const { data: client, error: clientError } = await supabase
    .from("portal_clients")
    .select("id, full_name, first_name")
    .eq("auth_user_id", user.id)
    .single<PortalClient>();

  if (clientError) {
    throw clientError;
  }

  const now = new Date().toISOString();

  const [dogsResult, bookingsResult, activitiesResult] = await Promise.all([
    supabase
      .from("portal_dogs")
      .select("id, name, breed, age, status, profile_photo_url")
      .eq("client_id", client.id)
      .order("created_at", { ascending: true })
      .limit(3)
      .returns<PortalDog[]>(),
    supabase
      .from("portal_booking_list")
      .select("id, dog_name, service_name, starts_at, ends_at, location, status, cover_image_url")
      .gte("starts_at", now)
      .order("starts_at", { ascending: true })
      .limit(3)
      .returns<PortalBooking[]>(),
    supabase
      .from("portal_client_activity")
      .select("id, activity_type, title, body, created_at")
      .eq("client_id", client.id)
      .order("created_at", { ascending: false })
      .limit(3)
      .returns<PortalActivity[]>(),
  ]);

  if (dogsResult.error) {
    throw dogsResult.error;
  }

  if (bookingsResult.error) {
    throw bookingsResult.error;
  }

  if (activitiesResult.error) {
    throw activitiesResult.error;
  }

  return {
    clientId: client.id,
    clientName: client.first_name || getFirstName(client.full_name) || user.user_metadata?.name || "there",
    notificationCount: activitiesResult.data.length,
    bookings: bookingsResult.data.map(mapBooking),
    pets: dogsResult.data.map(mapPet),
    activities: activitiesResult.data.map(mapActivity),
  };
}

function mapBooking(booking: PortalBooking): ClientBooking {
  const startsAt = booking.starts_at ? new Date(booking.starts_at) : null;
  return {
    id: booking.id,
    date: startsAt ? formatBookingDate(startsAt) : "Date TBC",
    time: startsAt ? formatTime(startsAt) : "Time TBC",
    pet: booking.dog_name || "Your pet",
    service: booking.service_name || "Pet care",
    status: normalizeBookingStatus(booking.status),
    location: booking.location || "Location TBC",
    avatar: booking.cover_image_url || fallbackDogImage,
    startsAtIso: booking.starts_at || undefined,
    endsAtIso: booking.ends_at || undefined,
  };
}

function mapPet(pet: PortalDog): ClientPet {
  return {
    id: pet.id,
    name: pet.name,
    breed: pet.breed || "Breed not set",
    age: pet.age || "Age not set",
    carePlan: "Personal care plan",
    status: pet.status?.toLowerCase() === "active" ? "Active" : "Needs review",
    avatar: pet.profile_photo_url || fallbackDogImage,
  };
}

function mapActivity(activity: PortalActivity): ClientActivity {
  const style = activityIconMap[activity.activity_type || "update"] || activityIconMap.update;

  return {
    id: activity.id,
    icon: style.icon,
    color: style.color,
    title: activity.title,
    subtitle: activity.body || "Account update",
    time: formatRelativeDate(new Date(activity.created_at)),
  };
}

function normalizeBookingStatus(status: string | null): ClientBooking["status"] {
  return status === "confirmed" || status === "completed" ? "Confirmed" : "Pending";
}

function getFirstName(name: string | null) {
  return name?.trim().split(/\s+/)[0];
}

function formatBookingDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" }).format(date);
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(date);
}

function formatRelativeDate(date: Date) {
  const today = new Date();
  const diffDays = Math.floor((startOfDay(today).getTime() - startOfDay(date).getTime()) / 86_400_000);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";

  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}