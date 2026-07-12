import { supabase } from "@/lib/supabase";

export type GalleryStatus = "Published" | "Private" | "Draft" | "Archived";

export type GalleryStat = {
  id: string;
  label: string;
  value: string;
  icon: string;
  color: string;
  bg: string;
};

export type GalleryItem = {
  id: string;
  imageUrl: string;
  altText: string | null;
  createdAt: string;
};

export type Gallery = {
  id: string;
  title: string;
  client: string;
  dog: string;
  date: string;
  time: string;
  photoCount: string;
  cover: string;
  status: GalleryStatus;
  items: GalleryItem[];
};

export type GalleryClient = { id: string; fullName: string };
export type GalleryDog = { id: string; name: string; clientId: string };

type GalleryRow = {
  id: string;
  title: string;
  status: string;
  created_at: string;
  published_at: string | null;
  portal_clients: { full_name: string | null } | null;
  portal_dogs: { name: string | null } | null;
  portal_gallery_items: Array<{ id: string; image_url: string; alt_text: string | null; created_at: string }> | null;
};

type ClientGalleryRow = {
  id: string;
  gallery_id: string;
  title: string;
  dog_name: string;
  image_url: string;
  alt_text: string | null;
  delivered_at: string | null;
  created_at: string;
  session_date: string | null;
};

const fallbackCover = "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=1200&auto=format&fit=crop";

function formatDateTime(value?: string | null) {
  if (!value) return { date: "Not scheduled", time: "" };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { date: "Not scheduled", time: "" };
  return {
    date: date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }),
    time: date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
  };
}

function toStatus(status: string): GalleryStatus {
  if (status === "published") return "Published";
  if (status === "archived") return "Archived";
  if (status === "draft") return "Draft";
  return "Private";
}

function mapGalleryRow(row: GalleryRow): Gallery {
  const items = (row.portal_gallery_items ?? []).map((item) => ({
    id: item.id,
    imageUrl: item.image_url,
    altText: item.alt_text,
    createdAt: item.created_at,
  }));
  const { date, time } = formatDateTime(row.published_at ?? row.created_at);

  return {
    id: row.id,
    title: row.title,
    client: row.portal_clients?.full_name ?? "Unknown client",
    dog: row.portal_dogs?.name ?? "Unknown dog",
    date,
    time,
    photoCount: String(items.length),
    cover: items[0]?.imageUrl ?? fallbackCover,
    status: toStatus(row.status),
    items,
  };
}

export function buildGalleryStats(galleries: Gallery[]): GalleryStat[] {
  const published = galleries.filter((gallery) => gallery.status === "Published").length;
  const drafts = galleries.filter((gallery) => gallery.status === "Draft" || gallery.status === "Private").length;
  const photos = galleries.reduce((total, gallery) => total + gallery.items.length, 0);

  return [
    { id: "total", label: "Total galleries", value: String(galleries.length), icon: "images-outline", color: "#4B22C8", bg: "#EEE8FF" },
    { id: "published", label: "Published", value: String(published), icon: "cloud-done-outline", color: "#178A22", bg: "#DDF6DC" },
    { id: "drafts", label: "Drafts", value: String(drafts), icon: "create-outline", color: "#F97316", bg: "#FFF0D8" },
    { id: "photos", label: "Original photos", value: String(photos), icon: "download-outline", color: "#0EA5E9", bg: "#E0F2FE" },
  ];
}

export async function fetchAdminGalleries() {
  const { data, error } = await supabase
    .from("portal_galleries")
    .select("id,title,status,created_at,published_at,portal_clients(full_name),portal_dogs(name),portal_gallery_items(id,image_url,alt_text,created_at)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as unknown as GalleryRow[]).map(mapGalleryRow);
}

export async function fetchGalleryFormOptions() {
  const [{ data: clients, error: clientsError }, { data: dogs, error: dogsError }] = await Promise.all([
    supabase.from("portal_clients").select("id,full_name").order("full_name"),
    supabase.from("portal_dogs").select("id,name,client_id").order("name"),
  ]);
  if (clientsError) throw clientsError;
  if (dogsError) throw dogsError;
  return {
    clients: (clients ?? []).map((client) => ({ id: client.id, fullName: client.full_name ?? "Unnamed client" })),
    dogs: (dogs ?? []).map((dog) => ({ id: dog.id, name: dog.name ?? "Unnamed dog", clientId: dog.client_id })),
  };
}

export async function createGalleryWithOriginals(input: { title: string; clientId: string; dogId: string; files: File[] }) {
  const { data: gallery, error: galleryError } = await supabase
    .from("portal_galleries")
    .insert({ title: input.title.trim() || "New gallery", client_id: input.clientId, dog_id: input.dogId, status: "draft" })
    .select("id")
    .single();
  if (galleryError) throw galleryError;

  if (input.files.length === 0) return gallery.id;

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  const token = sessionData.session?.access_token;
  if (!token) throw new Error("You must be signed in to upload gallery photos.");

  for (const file of input.files) {
    const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/gallery-upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ galleryId: gallery.id, fileName: file.name, contentType: file.type || "image/jpeg" }),
    });
    const upload = await response.json();
    if (!response.ok) throw new Error(upload.error || "Unable to prepare upload.");
    const { error: uploadError } = await supabase.storage.from(upload.bucket).uploadToSignedUrl(upload.path, upload.token, file, { contentType: upload.contentType });
    if (uploadError) throw uploadError;
    const { error: itemError } = await supabase.from("portal_gallery_items").insert({ gallery_id: gallery.id, client_id: input.clientId, dog_id: input.dogId, image_url: upload.publicUrl, alt_text: file.name });
    if (itemError) throw itemError;
  }

  return gallery.id;
}

export async function fetchClientGalleries() {
  const { data, error } = await supabase.from("portal_gallery").select("id,gallery_id,title,dog_name,image_url,alt_text,delivered_at,created_at,session_date").order("session_date", { ascending: false });
  if (error) throw error;
  const grouped = new Map<string, Gallery>();
  for (const row of (data ?? []) as ClientGalleryRow[]) {
    const { date, time } = formatDateTime(row.session_date ?? row.delivered_at ?? row.created_at);
    const existing = grouped.get(row.gallery_id);
    const item = { id: row.id, imageUrl: row.image_url, altText: row.alt_text, createdAt: row.created_at };
    if (existing) {
      existing.items.push(item);
      existing.photoCount = String(existing.items.length);
      continue;
    }
    grouped.set(row.gallery_id, { id: row.gallery_id, title: row.title, client: "Your gallery", dog: row.dog_name, date, time, photoCount: "1", cover: row.image_url, status: "Published", items: [item] });
  }
  return Array.from(grouped.values());
}
