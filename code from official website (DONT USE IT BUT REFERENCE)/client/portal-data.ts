export type PortalDashboardData = {
  clientId: string | null;
  clientName: string;
  clientFirstName: string;
  clientSince: string;
  avatarUrl: string | null;
  dogNames: string;
  dogPhotoUrl: string | null;
  heroPhotoUrl: string | null;
  upcomingBooking: null | {
    id: string;
    serviceName: string;
    startsAt: string;
    endsAt: string;
    location: string;
    imageUrl: string | null;
    status: string;
  };
  latestSession: null | {
    serviceName: string;
    sessionDate: string;
    imageUrl: string | null;
    status: string;
  };
  latestUpdate: string;
};

export const emptyPortalDashboardData: PortalDashboardData = {
  clientId: null,
  clientName: "there",
  clientFirstName: "there",
  clientSince: new Date().toISOString(),
  avatarUrl: null,
  dogNames: "your dog",
  dogPhotoUrl: null,
  heroPhotoUrl: null,
  upcomingBooking: null,
  latestSession: null,
  latestUpdate: "Care notes, photos, and arrival updates appear here as soon as Jeroen shares them.",
};

export type PortalDashboardViewRow = {
  client_id: string | null;
  client_name: string | null;
  client_first_name: string | null;
  client_since: string | null;
  avatar_url: string | null;
  dog_names: string | null;
  dog_photo_url: string | null;
  hero_photo_url: string | null;
  upcoming_booking_id: string | null;
  service_name: string | null;
  starts_at: string | null;
  ends_at: string | null;
  location: string | null;
  booking_status: string | null;
  booking_image_url: string | null;
  latest_update_title: string | null;
  latest_update_body: string | null;
  latest_update_image_url: string | null;
  latest_update_shared_at: string | null;
};

export function mapPortalDashboardRows(rows: unknown): PortalDashboardData {
  const row = Array.isArray(rows) ? (rows[0] as PortalDashboardViewRow | undefined) : undefined;
  if (!row) return emptyPortalDashboardData;

  const dogNames = row.dog_names?.trim() || "your dog";
  const imageUrl = row.booking_image_url || row.dog_photo_url || null;

  return {
    clientId: row.client_id,
    clientName: row.client_name?.trim() || "there",
    clientFirstName: row.client_first_name?.trim() || firstName(row.client_name) || "there",
    clientSince: row.client_since || new Date().toISOString(),
    avatarUrl: row.avatar_url || null,
    dogNames,
    dogPhotoUrl: row.dog_photo_url || null,
    heroPhotoUrl: row.hero_photo_url || row.dog_photo_url || null,
    upcomingBooking: row.upcoming_booking_id && row.starts_at && row.ends_at ? {
      id: row.upcoming_booking_id,
      serviceName: row.service_name?.trim() || "Upcoming care",
      startsAt: row.starts_at,
      endsAt: row.ends_at,
      location: row.location?.trim() || "Location to be confirmed",
      imageUrl,
      status: formatStatus(row.booking_status) || "Confirmed",
    } : null,
    latestSession: row.latest_update_shared_at ? {
      serviceName: row.latest_update_title?.trim() || row.service_name?.trim() || "Session update",
      sessionDate: row.latest_update_shared_at,
      imageUrl: row.latest_update_image_url || imageUrl,
      status: row.latest_update_title ? "Update shared ✓" : "Gallery update ✓",
    } : null,
    latestUpdate: row.latest_update_body?.trim() || "Care notes, photos, and arrival updates appear here as soon as Jeroen shares them.",
  };
}

function firstName(value: string | null) {
  return value?.trim().split(/\s+/)[0] ?? "";
}

function formatStatus(value: string | null) {
  if (!value) return "";
  return value.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim().replace(/^./, (letter) => letter.toUpperCase());
}
