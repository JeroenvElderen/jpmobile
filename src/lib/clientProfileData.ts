import { supabase } from "@/lib/supabase";

const fallbackAvatar = "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=300&q=80";

export type ClientProfile = {
  clientId: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  avatarUrl: string;
  dogNames: string;
  memberSince: string;
  recentActivityCount: number;
};

type PortalProfileRow = {
  client_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  avatar_url: string | null;
  created_at: string | null;
  dog_names: string | null;
  dog_photo_url: string | null;
  recent_activity: unknown;
};

export async function fetchClientProfileData(): Promise<ClientProfile> {
  const { data, error } = await supabase
    .from("portal_profile")
    .select("client_id, full_name, email, phone, address, avatar_url, created_at, dog_names, dog_photo_url, recent_activity")
    .maybeSingle<PortalProfileRow>();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("Unable to find your client profile.");
  }

  return mapProfileRow(data);
}

function mapProfileRow(row: PortalProfileRow): ClientProfile {
  return {
    clientId: row.client_id,
    fullName: row.full_name?.trim() || "Client",
    email: row.email?.trim() || "No email on file",
    phone: row.phone?.trim() || "No phone on file",
    address: row.address?.trim() || "No address on file",
    avatarUrl: row.avatar_url?.trim() || row.dog_photo_url?.trim() || fallbackAvatar,
    dogNames: row.dog_names?.trim() || "No pets added yet",
    memberSince: formatMemberSince(row.created_at),
    recentActivityCount: Array.isArray(row.recent_activity) ? row.recent_activity.length : 0,
  };
}

function formatMemberSince(value: string | null) {
  if (!value) return "Member profile";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Member profile";

  return `Member since ${date.toLocaleDateString(undefined, { month: "long", year: "numeric" })}`;
}