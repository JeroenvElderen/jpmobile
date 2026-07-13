import type { Ionicons } from "@expo/vector-icons";

import { supabase } from "@/lib/supabase";

export type ClientStatus = "Active" | "Inactive";

export type Client = {
  id: string;
  name: string;
  email: string;
  dogs: string;
  bookings: number;
  memberSince: string;
  status: ClientStatus;
  avatar: string;
};

export type ClientStat = {
  title: string;
  value: string;
  change: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBackground: string;
};

export type ClientsData = {
  stats: ClientStat[];
  clients: Client[];
};

type PortalClientRow = {
  id: string;
  full_name: string;
  email: string;
  created_at: string | null;
  avatar_url: string | null;
  status: string | null;
  portal_dogs?: { name: string | null; breed: string | null; profile_photo_url: string | null }[] | null;
};

type PortalBookingClientRow = {
  client_id: string | null;
};

const fallbackClientImage = "https://placehold.co/220x220/F3EEFF/5B3DF5.png?text=JP";

export async function fetchAdminClientsData(): Promise<ClientsData> {
  const { data: clients, error: clientsError } = await supabase
    .from("portal_clients")
    .select("id, full_name, email, created_at, avatar_url, status, portal_dogs(name, breed, profile_photo_url)")
    .order("full_name", { ascending: true })
    .returns<PortalClientRow[]>();

  if (clientsError) {
    throw clientsError;
  }

  const bookingCounts = await fetchClientBookingCounts();
  const mappedClients = clients.map((client) => mapClientRow(client, bookingCounts));

  return {
    stats: buildClientStats(mappedClients, clients),
    clients: mappedClients,
  };
}

async function fetchClientBookingCounts() {
  const { data, error } = await supabase
    .from("portal_bookings")
    .select("client_id")
    .returns<PortalBookingClientRow[]>();

  if (error) {
    throw error;
  }

  return data.reduce<Record<string, number>>((counts, booking) => {
    if (booking.client_id) {
      counts[booking.client_id] = (counts[booking.client_id] || 0) + 1;
    }

    return counts;
  }, {});
}

function mapClientRow(row: PortalClientRow, bookingCounts: Record<string, number>): Client {
  return {
    id: row.id,
    name: row.full_name,
    email: row.email,
    dogs: formatDogs(row.portal_dogs),
    bookings: bookingCounts[row.id] || 0,
    memberSince: formatMemberSince(row.created_at),
    status: normalizeClientStatus(row.status),
    avatar: row.avatar_url || firstDogPhoto(row.portal_dogs) || fallbackClientImage,
  };
}

function firstDogPhoto(dogs?: PortalClientRow["portal_dogs"]) {
  return dogs?.find((dog) => dog.profile_photo_url?.trim())?.profile_photo_url || null;
}

function formatDogs(dogs?: PortalClientRow["portal_dogs"]) {
  if (!dogs?.length) return "No dogs linked";

  return dogs
    .map((dog) => [dog.name || "Dog TBC", dog.breed].filter(Boolean).join(" • "))
    .join("\n");
}

function formatMemberSince(createdAt: string | null) {
  if (!createdAt) return "Member since TBC";

  const createdDate = new Date(createdAt);

  if (Number.isNaN(createdDate.getTime())) return "Member since TBC";

  return `Member since ${createdDate.getFullYear()}`;
}

function buildClientStats(clients: Client[], rawClients: PortalClientRow[]): ClientStat[] {
  const total = clients.length;
  const active = clients.filter((client) => client.status === "Active").length;
  const regulars = clients.filter((client) => client.bookings >= 3).length;
  const newThisMonth = rawClients.filter((client) => isCurrentMonth(client.created_at)).length;

  return [
    { title: "Total Clients", value: String(total), change: "Live", icon: "people-outline", iconColor: "#5B3DF5", iconBackground: "#F3EEFF" },
    { title: "Active", value: String(active), change: "Live", icon: "heart-outline", iconColor: "#F97316", iconBackground: "#FFF5EB" },
    { title: "Regulars", value: String(regulars), change: "Live", icon: "shield-checkmark-outline", iconColor: "#16A34A", iconBackground: "#ECFDF3" },
    { title: "New This Month", value: String(newThisMonth), change: "Live", icon: "star-outline", iconColor: "#EF476F", iconBackground: "#FDECF1" },
  ];
}

function isCurrentMonth(createdAt: string | null) {
  if (!createdAt) return false;

  const createdDate = new Date(createdAt);
  const now = new Date();

  return (
    !Number.isNaN(createdDate.getTime()) &&
    createdDate.getFullYear() === now.getFullYear() &&
    createdDate.getMonth() === now.getMonth()
  );
}

function normalizeClientStatus(status: string | null): ClientStatus {
  return status?.toLowerCase() === "inactive" ? "Inactive" : "Active";
}