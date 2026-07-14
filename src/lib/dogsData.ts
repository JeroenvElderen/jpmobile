import type { Ionicons } from "@expo/vector-icons";

import { supabase } from "@/lib/supabase";

export type DogStatus = "Active" | "Inactive";

export type Dog = {
  id: string;
  name: string;
  breed: string;
  owner: string;
  bookings: number;
  age: string;
  status: DogStatus;
  avatar: string;
  notes: string;
};

export type DogStat = {
  title: string;
  value: string;
  change: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBackground: string;
};

export type DogsData = {
  clientId?: string;
  stats: DogStat[];
  dogs: Dog[];
};

type PortalDogRow = {
  id: string;
  client_id: string;
  name: string;
  breed: string | null;
  age: string | null;
  status: string | null;
  profile_photo_url: string | null;
  notes: string | null;
  portal_clients?: { full_name: string | null } | { full_name: string | null }[] | null;
};

type PortalBookingDogRow = {
  dog_id: string | null;
  dog_ids: string[] | null;
};

type PortalClient = {
  id: string;
};

const fallbackDogImage = "https://placedog.net/220/220?id=11";

export async function updateClientDog({ dogId, clientId, name, breed, age, notes }: { dogId: string; clientId: string; name: string; breed: string; age: string; notes: string }) {
  const { error } = await supabase
    .from("portal_dogs")
    .update({ name: name.trim(), breed: breed.trim() || null, age: age.trim() || null, notes: notes.trim() || null })
    .eq("id", dogId)
    .eq("client_id", clientId);

  if (error) throw error;
}

export async function deactivateClientDog(dogId: string, clientId: string) {
  const { error } = await supabase.from("portal_dogs").update({ status: "inactive" }).eq("id", dogId).eq("client_id", clientId);
  if (error) throw error;
}

export async function deleteClientDog(dogId: string, clientId: string) {
  const { error } = await supabase.from("portal_dogs").delete().eq("id", dogId).eq("client_id", clientId);
  if (error) throw error;
}

export async function fetchAdminDogsData(): Promise<DogsData> {
  const { data: dogs, error: dogsError } = await supabase
    .from("portal_dogs")
    .select("id, client_id, name, breed, age, status, profile_photo_url, notes, portal_clients(full_name)")
    .order("name", { ascending: true })
    .returns<PortalDogRow[]>();

  if (dogsError) {
    throw dogsError;
  }

  const bookingCounts = await fetchBookingCounts();
  const mappedDogs = dogs.map((dog) => mapDogRow(dog, bookingCounts));

  return {
    stats: buildDogStats(mappedDogs),
    dogs: mappedDogs,
  };
}

export async function fetchClientDogsData(): Promise<DogsData> {
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  const user = userData.user;

  if (!user) {
    throw new Error("Log in to view your pets.");
  }

  const { data: client, error: clientError } = await supabase
    .from("portal_clients")
    .select("id")
    .eq("auth_user_id", user.id)
    .single<PortalClient>();

  if (clientError) {
    throw clientError;
  }

  const { data: dogs, error: dogsError } = await supabase
    .from("portal_dogs")
    .select("id, client_id, name, breed, age, status, profile_photo_url, notes, portal_clients(full_name)")
    .eq("client_id", client.id)
    .order("name", { ascending: true })
    .returns<PortalDogRow[]>();

  if (dogsError) {
    throw dogsError;
  }

  const bookingCounts = await fetchBookingCounts(client.id);
  const mappedDogs = dogs.map((dog) => mapDogRow(dog, bookingCounts));

  return {
    clientId: client.id,
    stats: buildDogStats(mappedDogs),
    dogs: mappedDogs,
  };
}

async function fetchBookingCounts(clientId?: string) {
  let query = supabase.from("portal_bookings").select("dog_id, dog_ids");

  if (clientId) {
    query = query.eq("client_id", clientId);
  }

  const { data, error } = await query.returns<PortalBookingDogRow[]>();

  if (error) {
    throw error;
  }

  return data.reduce<Record<string, number>>((counts, booking) => {
    const dogIds = booking.dog_ids?.length ? booking.dog_ids : booking.dog_id ? [booking.dog_id] : [];

    dogIds.forEach((dogId) => {
      counts[dogId] = (counts[dogId] || 0) + 1;
    });

    return counts;
  }, {});
}

function mapDogRow(row: PortalDogRow, bookingCounts: Record<string, number>): Dog {
  const client = Array.isArray(row.portal_clients) ? row.portal_clients[0] : row.portal_clients;

  return {
    id: row.id,
    name: row.name,
    breed: row.breed || "Breed not set",
    owner: client?.full_name || "Owner TBC",
    bookings: bookingCounts[row.id] || 0,
    age: row.age || "Age not set",
    status: normalizeDogStatus(row.status),
    avatar: row.profile_photo_url || fallbackDogImage,
    notes: row.notes?.trim() || "",
  };
}

function buildDogStats(dogs: Dog[]): DogStat[] {
  const total = dogs.length;
  const active = dogs.filter((dog) => dog.status === "Active").length;
  const regulars = dogs.filter((dog) => dog.bookings >= 3).length;
  const newOrNeedsReview = dogs.filter((dog) => dog.bookings === 0 || dog.status === "Inactive").length;

  return [
    { title: "Total Dogs", value: String(total), change: "Live", icon: "paw-outline", iconColor: "#5B3DF5", iconBackground: "#F3EEFF" },
    { title: "Active", value: String(active), change: "Live", icon: "heart-outline", iconColor: "#F97316", iconBackground: "#FFF5EB" },
    { title: "Regulars", value: String(regulars), change: "Live", icon: "shield-checkmark-outline", iconColor: "#16A34A", iconBackground: "#ECFDF3" },
    { title: "Needs Review", value: String(newOrNeedsReview), change: "Live", icon: "star-outline", iconColor: "#EF476F", iconBackground: "#FDECF1" },
  ];
}

function normalizeDogStatus(status: string | null): DogStatus {
  return status?.toLowerCase() === "inactive" ? "Inactive" : "Active";
}
