"use client";

import { createClient } from "@supabase/supabase-js";
import { CalendarDays, ChevronDown, Download, Eye, Filter, ImageIcon, MoreVertical, PawPrint, Pencil, Plus, Search, Trash2, Upload, Users, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Card } from "./card";

type ClientOption = { id: string; full_name: string | null; email: string | null };
type DogOption = { id: string; name: string | null; client_id: string | null };
type GalleryPhoto = { id: string; imageUrl: string; altText: string | null; createdAt: string };
type BackendGallery = {
  id: string; clientId: string; dogId: string; title: string; status: string; createdAt: string; updatedAt: string | null; publishedAt: string | null;
  client: { name: string; email: string; phone: string; avatarUrl: string | null };
  dog: { name: string; breed: string; age: string; photoUrl: string | null };
  photos: GalleryPhoto[];
};
type GalleryActivity = { id: string; gallery_id: string | null; action: string; body: string | null; created_at: string };
type GalleriesApiResponse = { id?: string; galleries?: BackendGallery[]; clients?: ClientOption[]; dogs?: DogOption[]; activities?: GalleryActivity[]; error?: string };
type SignedUploadResponse = { bucket?: string; path?: string; token?: string; publicUrl?: string; contentType?: string; error?: string };

type GalleryFormState = { id?: string; title: string; clientId: string; dogId: string; files: File[] };

function getImageContentType(file: File) {
  if (file.type?.startsWith("image/")) return file.type;

  const extension = file.name.split(".").pop()?.toLowerCase();
  const extensionTypes: Record<string, string> = {
    avif: "image/avif",
    bmp: "image/bmp",
    gif: "image/gif",
    heic: "image/heic",
    heif: "image/heif",
    jpeg: "image/jpeg",
    jpg: "image/jpeg",
    png: "image/png",
    tif: "image/tiff",
    tiff: "image/tiff",
    webp: "image/webp",
  };

  return extension ? extensionTypes[extension] : undefined;
}

function getSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && key ? createClient(url, key) : null;
}

function getSupabaseRealtimeConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && key ? { url, key } : null;
}

function isSupabaseStorageUrl(src: string | null | undefined) {
  return Boolean(src?.includes("/storage/v1/object/"));
}

function StatusBadge({ status }: { status: string }) {
  const classes = status === "Draft" ? "bg-orange-100 text-orange-700" : status === "Archived" ? "bg-slate-200 text-slate-600" : "bg-green-100 text-green-700";
  return <span className={`rounded-md px-3 py-1 text-xs font-medium ${classes}`}>{status}</span>;
}

function formatDateTime(value: string | null) {
  if (!value) return { date: "No date", time: "" };
  const date = new Date(value);
  return { date: new Intl.DateTimeFormat("en-IE", { day: "numeric", month: "short", year: "numeric" }).format(date), time: new Intl.DateTimeFormat("en-IE", { hour: "numeric", minute: "2-digit" }).format(date) };
}

function EmptyAvatar({ label, src }: { label: string; src: string | null }) {
  return src ? <Image src={src} alt={label} width={52} height={52} unoptimized={isSupabaseStorageUrl(src)} className="size-13 rounded-full object-cover" /> : <span className="grid size-13 place-items-center rounded-full bg-[#f0e8f8] text-[#5b2aa0]"><PawPrint className="size-5" /></span>;
}

function PhotoStrip({ photos }: { photos: GalleryPhoto[] }) {
  const preview = photos.slice(0, 4);
  if (!preview.length) return <div className="grid h-14 w-72 place-items-center rounded-md border border-dashed border-[#151124]/20 text-xs text-[#6d667a]">No photos yet</div>;
  return <div className="flex w-72 gap-1">{preview.map((photo, index) => <div key={photo.id} className="relative h-14 flex-1 overflow-hidden rounded-md"><Image src={photo.imageUrl} alt={photo.altText || "Gallery preview"} fill sizes="80px" unoptimized={isSupabaseStorageUrl(photo.imageUrl)} className="object-cover" />{index === 3 && photos.length > 4 ? <span className="absolute inset-0 grid place-items-center bg-[#151124]/55 text-xs font-bold text-white">+{photos.length - 4}</span> : null}</div>)}</div>;
}

export function BackendPhotoUpdates({ accessToken }: { accessToken: string }) {
  const [galleries, setGalleries] = useState<BackendGallery[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [dogs, setDogs] = useState<DogOption[]>([]);
  const [activities, setActivities] = useState<GalleryActivity[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [query, setQuery] = useState("");
  const [clientFilter, setClientFilter] = useState("all");
  const [dogFilter, setDogFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [openActionId, setOpenActionId] = useState<string | null>(null);
  const [actionMenuPosition, setActionMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [form, setForm] = useState<GalleryFormState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const loadGalleries = useCallback(async () => {
    const params = new URLSearchParams({ clientId: clientFilter, dogId: dogFilter, status: statusFilter });
    const response = await fetch(`/api/galleries?${params}`, { cache: "no-store", headers: { Authorization: `Bearer ${accessToken}` } });
    const payload = (await response.json().catch(() => ({}))) as GalleriesApiResponse;
    if (!response.ok) throw new Error(payload.error || `Galleries API returned ${response.status}`);
    setGalleries(payload.galleries ?? []); setClients(payload.clients ?? []); setDogs(payload.dogs ?? []); setActivities(payload.activities ?? []);
    setSelectedId((current) => (payload.galleries ?? []).some((gallery) => gallery.id === current) ? current : payload.galleries?.[0]?.id ?? "");
  }, [accessToken, clientFilter, dogFilter, statusFilter]);

  useEffect(() => { queueMicrotask(() => void loadGalleries().catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Unable to load galleries."))); }, [loadGalleries]);

  useEffect(() => {
    const config = getSupabaseRealtimeConfig();
    if (!config || !accessToken) return;
    const socket = new WebSocket(`${config.url.replace(/^http/, "ws")}/realtime/v1/websocket?apikey=${encodeURIComponent(config.key)}&vsn=1.0.0`);
    const heartbeat = window.setInterval(() => socket.readyState === WebSocket.OPEN && socket.send(JSON.stringify({ topic: "phoenix", event: "heartbeat", payload: {}, ref: String(Date.now()) })), 30000);
    socket.addEventListener("open", () => socket.send(JSON.stringify({ topic: "realtime:backend-galleries", event: "phx_join", payload: { config: { postgres_changes: ["portal_galleries", "portal_gallery_items", "portal_gallery_activity", "portal_clients", "portal_dogs"].map((table) => ({ event: "*", schema: "public", table })) }, access_token: accessToken }, ref: "1" })));
    socket.addEventListener("message", (event) => { if (String(event.data).includes('"postgres_changes"')) void loadGalleries(); });
    return () => { window.clearInterval(heartbeat); socket.close(); };
  }, [accessToken, loadGalleries]);

  const filtered = useMemo(() => galleries.filter((gallery) => `${gallery.title} ${gallery.client.name} ${gallery.dog.name}`.toLowerCase().includes(query.toLowerCase())), [galleries, query]);
  const totalPages = Math.ceil(filtered.length / 10);
  const paged = totalPages > 1 ? filtered.slice((page - 1) * 10, page * 10) : filtered;
  const selected = galleries.find((gallery) => gallery.id === selectedId) ?? galleries[0];
  const filteredDogs = form?.clientId ? dogs.filter((dog) => dog.client_id === form.clientId) : dogs;
  const stats = [
    { label: "Total Galleries", value: galleries.length, icon: ImageIcon, color: "bg-[#f0e9fb] text-[#4f2c91]" },
    { label: "Clients with Galleries", value: new Set(galleries.map((gallery) => gallery.clientId)).size, icon: Users, color: "bg-emerald-100 text-emerald-700" },
    { label: "Total Photos", value: galleries.reduce((sum, gallery) => sum + gallery.photos.length, 0), icon: ImageIcon, color: "bg-orange-100 text-orange-600" },
    { label: "Draft Galleries", value: galleries.filter((gallery) => gallery.status === "Draft").length, icon: CalendarDays, color: "bg-[#f0e9fb] text-[#4f2c91]" },
  ];

  async function uploadFilesDirectly(galleryId: string, files: File[]) {
    if (!files.length) return [];
    const supabase = getSupabaseBrowserClient();
    if (!supabase) throw new Error("Connect Supabase before uploading gallery photos.");

    const uploadedUrls: string[] = [];
    for (const file of files) {
      const contentType = getImageContentType(file);
      if (!contentType) throw new Error(`Unsupported image type for ${file.name}. Please upload a standard image file.`);

      const signedResponse = await fetch("/api/galleries/uploads", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ galleryId, fileName: file.name, contentType }),
      });
      const signedPayload = (await signedResponse.json().catch(() => ({}))) as SignedUploadResponse;
      if (!signedResponse.ok || !signedPayload.bucket || !signedPayload.path || !signedPayload.token || !signedPayload.publicUrl) {
        throw new Error(signedPayload.error || `Unable to prepare upload for ${file.name}.`);
      }

      const { error: uploadError } = await supabase.storage.from(signedPayload.bucket).uploadToSignedUrl(signedPayload.path, signedPayload.token, file, { contentType });
      if (uploadError) throw new Error(uploadError.message);
      uploadedUrls.push(signedPayload.publicUrl);
    }

    return uploadedUrls;
  }

  async function submitGallery(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form) return;
    setIsSaving(true);
    setError(null);

    try {
      const body = new FormData();
      if (form.id) body.set("id", form.id);
      body.set("title", form.title);
      body.set("clientId", form.clientId);
      body.set("dogId", form.dogId);

      const response = await fetch("/api/galleries", { method: form.id ? "PATCH" : "POST", headers: { Authorization: `Bearer ${accessToken}` }, body });
      const payload = (await response.json().catch(() => ({}))) as GalleriesApiResponse;
      if (!response.ok) throw new Error(payload.error || "Unable to save gallery.");

      const galleryId = form.id || payload.id;
      if (!galleryId) throw new Error("The gallery was saved, but its id was not returned.");

      const uploadedUrls = await uploadFilesDirectly(galleryId, form.files);
      if (uploadedUrls.length) {
        const photosBody = new FormData();
        photosBody.set("id", galleryId);
        photosBody.set("title", form.title);
        uploadedUrls.forEach((url) => photosBody.append("imageUrls", url));
        const photosResponse = await fetch("/api/galleries", { method: "PATCH", headers: { Authorization: `Bearer ${accessToken}` }, body: photosBody });
        const photosPayload = (await photosResponse.json().catch(() => ({}))) as GalleriesApiResponse;
        if (!photosResponse.ok) throw new Error(photosPayload.error || "Photos uploaded, but gallery records could not be saved.");
      }

      setForm(null);
      await loadGalleries();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save gallery.");
    } finally {
      setIsSaving(false);
    }
  }

  async function runAction(gallery: BackendGallery, action: "edit" | "publish" | "delete") {
    setOpenActionId(null);
    if (action === "edit") { setForm({ id: gallery.id, title: gallery.title, clientId: gallery.clientId, dogId: gallery.dogId, files: [] }); return; }
    const body = new FormData(); body.set("id", gallery.id); body.set("action", action);
    const response = await fetch(action === "delete" ? `/api/galleries?id=${gallery.id}` : "/api/galleries", { method: action === "delete" ? "DELETE" : "PATCH", headers: { Authorization: `Bearer ${accessToken}` }, body: action === "delete" ? undefined : body });
    if (!response.ok) setError(action === "delete" ? "Unable to delete gallery." : "Unable to publish gallery.");
    await loadGalleries();
  }

  return <div className="p-5 md:p-10">
    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center"><div><h1 className="font-serif text-3xl">Photo Updates <PawPrint className="inline size-6 text-[#6c38c2]" /></h1><p className="mt-1 text-sm text-[#6d667a]">Create draft galleries, add original files, and publish them to the client portal.</p></div><button onClick={() => setForm({ title: "", clientId: clients[0]?.id ?? "", dogId: dogs.find((dog) => dog.client_id === clients[0]?.id)?.id ?? "", files: [] })} className="rounded-lg bg-[#4f2c91] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#4f2c91]/25"><Plus className="mr-2 inline size-4" />Create New Gallery <ChevronDown className="ml-6 inline size-4" /></button></div>
    {error ? <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
    <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">{stats.map(({ label, value, icon: Icon, color }) => <Card key={label} className="p-6"><div className="flex items-center gap-6"><span className={`grid size-14 place-items-center rounded-full ${color}`}><Icon className="size-7" /></span><div><p className="text-sm text-[#6d667a]">{label}</p><p className="mt-1 font-serif text-3xl">{value}</p><p className="mt-2 text-sm text-[#6d667a]">Realtime Supabase data</p></div></div></Card>)}</div>
    <div className="mt-6 grid gap-6 2xl:grid-cols-[1fr_20rem]"><Card className="overflow-visible"><div className="flex flex-col gap-4 border-b border-[#151124]/10 p-5 xl:flex-row xl:items-center xl:justify-between"><label className="flex min-w-0 flex-1 items-center gap-3 rounded-lg border border-[#151124]/10 px-4 py-3 text-sm text-[#858093] xl:max-w-md"><Search className="size-5" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent outline-none" placeholder="Search galleries by client or dog name..." /></label><div className="flex flex-wrap gap-3"><select value={clientFilter} onChange={(event) => { setPage(1); setClientFilter(event.target.value); }} className="rounded-lg border border-[#151124]/10 px-5 py-3 text-sm"><option value="all">All Clients</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.full_name || client.email}</option>)}</select><select value={dogFilter} onChange={(event) => { setPage(1); setDogFilter(event.target.value); }} className="rounded-lg border border-[#151124]/10 px-5 py-3 text-sm"><option value="all">All Dogs</option>{dogs.map((dog) => <option key={dog.id} value={dog.id}>{dog.name || "Unnamed dog"}</option>)}</select><select value={statusFilter} onChange={(event) => { setPage(1); setStatusFilter(event.target.value); }} className="rounded-lg border border-[#151124]/10 px-5 py-3 text-sm"><option value="all">All Statuses</option><option value="draft">Draft</option><option value="published">Published</option></select><button className="rounded-lg border border-[#151124]/10 px-5 py-3 text-sm"><Filter className="mr-2 inline size-4" />Filters</button></div></div>
    <div className="overflow-x-auto"><table className="w-full min-w-[960px] text-left text-sm"><thead className="bg-[#fbf9fd] text-xs font-semibold text-[#4f2c91]"><tr>{["Gallery", "Client & Dog", "Date Created", "Photos", "Status", "Actions"].map((h) => <th key={h} className="px-6 py-4">{h}</th>)}</tr></thead><tbody className="divide-y divide-[#151124]/10">{paged.map((gallery) => { const created = formatDateTime(gallery.createdAt); return <tr key={gallery.id} onClick={() => setSelectedId(gallery.id)} className="cursor-pointer hover:bg-[#fbf9fd]"><td className="px-6 py-4"><PhotoStrip photos={gallery.photos} /></td><td className="px-6 py-4"><div className="flex items-center gap-4"><EmptyAvatar label={gallery.client.name} src={gallery.client.avatarUrl || gallery.dog.photoUrl} /><div><p className="font-semibold">{gallery.client.name}</p><p className="mt-1 text-[#6d667a]">{gallery.dog.name}</p></div></div></td><td className="px-6 py-4"><p>{created.date}</p><p className="mt-1 text-[#4f4863]">{created.time}</p></td><td className="px-6 py-4">{gallery.photos.length}</td><td className="px-6 py-4"><StatusBadge status={gallery.status} /></td><td className="relative px-6 py-4" onClick={(event) => event.stopPropagation()}><div className="flex gap-3"><button onClick={() => setSelectedId(gallery.id)} className="rounded-lg border border-[#151124]/10 p-2 text-[#4f2c91]" aria-label={`View ${gallery.title}`}><Eye className="size-4" /></button><button onClick={(event) => { const rect = event.currentTarget.getBoundingClientRect(); setActionMenuPosition({ top: Math.max(12, Math.min(rect.bottom + 8, window.innerHeight - 148)), left: Math.max(12, Math.min(rect.right - 176, window.innerWidth - 188)) }); setOpenActionId((current) => current === gallery.id ? null : gallery.id); }} className="rounded-lg border border-[#151124]/10 p-2 text-[#4f4863]" aria-label={`More actions for ${gallery.title}`}><MoreVertical className="size-4" /></button></div>{openActionId === gallery.id && actionMenuPosition ? <div style={{ top: actionMenuPosition.top, left: actionMenuPosition.left }} className="fixed z-50 w-44 rounded-xl border border-[#151124]/10 bg-white p-2 shadow-2xl"><button onClick={() => void runAction(gallery, "edit")} className="flex w-full items-center gap-2 rounded px-3 py-2 text-left hover:bg-[#fbf9fd]"><Pencil className="size-4" />Edit</button><button onClick={() => void runAction(gallery, "publish")} className="flex w-full items-center gap-2 rounded px-3 py-2 text-left hover:bg-[#fbf9fd]"><Upload className="size-4" />Publish</button><button onClick={() => void runAction(gallery, "delete")} className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-red-600 hover:bg-red-50"><Trash2 className="size-4" />Delete</button></div> : null}</td></tr>; })}</tbody></table></div>{totalPages > 1 ? <div className="flex flex-col gap-4 border-t border-[#151124]/10 p-5 text-sm text-[#6d667a] sm:flex-row sm:items-center sm:justify-between"><p>Showing {(page - 1) * 10 + 1} to {Math.min(page * 10, filtered.length)} of {filtered.length} galleries</p><div className="flex gap-2">{Array.from({ length: totalPages }, (_, index) => index + 1).map((number) => <button key={number} onClick={() => setPage(number)} className={`grid size-9 place-items-center rounded-md border border-[#151124]/10 ${number === page ? "border-[#5b2aa0] text-[#5b2aa0]" : "text-[#4f4863]"}`}>{number}</button>)}</div></div> : null}</Card>
    <aside className="space-y-5">{selected ? <><Card className="p-5"><h2 className="font-serif text-xl">Gallery Overview</h2><div className="relative mt-4 h-36 overflow-hidden rounded-lg">{selected.photos[0] ? <Image src={selected.photos[0].imageUrl} alt={selected.title} fill sizes="320px" unoptimized={isSupabaseStorageUrl(selected.photos[0].imageUrl)} className="object-cover" /> : <span className="grid size-full place-items-center bg-[#f0e8f8] text-[#5b2aa0]"><ImageIcon /></span>}<span className="absolute bottom-3 right-3 rounded-full bg-white px-3 py-2 text-xs font-bold">{selected.photos.length} photos</span></div><div className="mt-4 flex items-start justify-between gap-3"><div><p className="font-semibold">{selected.title}</p><p className="mt-1 text-xs text-[#6d667a]">Created on {formatDateTime(selected.createdAt).date} at {formatDateTime(selected.createdAt).time}</p></div><StatusBadge status={selected.status} /></div><div className="mt-4 flex gap-6 text-sm text-[#6d667a]"><span><ImageIcon className="mr-2 inline size-4" />{selected.photos.length} Photos</span><span><Download className="mr-2 inline size-4" />Original files</span></div><a href={selected.photos[0]?.imageUrl || "#"} target="_blank" className="mt-5 block w-full rounded-lg bg-[#4f2c91] py-3 text-center text-sm font-semibold text-white">View Gallery</a></Card><Card className="p-5"><h2 className="font-serif text-xl">Client & Dog</h2><div className="mt-5 space-y-4"><div className="flex items-center gap-4"><EmptyAvatar label={selected.client.name} src={selected.client.avatarUrl} /><div><p className="font-semibold">{selected.client.name}</p><p className="text-sm text-[#6d667a]">{selected.client.email}</p><p className="text-sm text-[#6d667a]">{selected.client.phone}</p></div></div><div className="flex items-center gap-4"><EmptyAvatar label={selected.dog.name} src={selected.dog.photoUrl} /><div><p className="font-semibold">{selected.dog.name}</p><p className="text-sm text-[#6d667a]">{selected.dog.breed}</p><p className="text-sm text-[#6d667a]">{selected.dog.age}</p></div></div></div></Card></> : null}<Card className="p-5"><h2 className="font-serif text-xl">Recent Activity</h2><div className="mt-5 space-y-4 text-sm">{activities.map((activity) => <p key={activity.id}><span className="mr-3 rounded-full bg-[#f0e9fb] p-2 text-[#4f2c91]">✓</span>{activity.body || activity.action}<br /><span className="ml-11 text-xs text-[#6d667a]">{formatDateTime(activity.created_at).date} at {formatDateTime(activity.created_at).time}</span></p>)}</div></Card></aside></div>
    {form ? <div className="fixed inset-0 z-50 grid place-items-center bg-[#151124]/45 p-4"><form onSubmit={(event) => void submitGallery(event)} className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-center justify-between"><h2 className="font-serif text-2xl">{form.id ? "Edit gallery" : "Create New Gallery"}</h2><button type="button" onClick={() => setForm(null)}><X /></button></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="sm:col-span-2 text-sm font-semibold">Title<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="mt-2 w-full rounded-lg border border-[#151124]/10 px-4 py-3" required /></label><label className="text-sm font-semibold">Client<select value={form.clientId} onChange={(event) => { const nextClient = event.target.value; setForm({ ...form, clientId: nextClient, dogId: dogs.find((dog) => dog.client_id === nextClient)?.id ?? "" }); }} className="mt-2 w-full rounded-lg border border-[#151124]/10 px-4 py-3" required><option value="">Choose client</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.full_name || client.email}</option>)}</select></label><label className="text-sm font-semibold">Dog<select value={form.dogId} onChange={(event) => setForm({ ...form, dogId: event.target.value })} className="mt-2 w-full rounded-lg border border-[#151124]/10 px-4 py-3" required><option value="">Choose dog</option>{filteredDogs.map((dog) => <option key={dog.id} value={dog.id}>{dog.name || "Unnamed dog"}</option>)}</select></label><label className="sm:col-span-2 text-sm font-semibold">Original photos<input type="file" accept="image/*" multiple onChange={(event) => setForm({ ...form, files: Array.from(event.target.files ?? []) })} className="mt-2 w-full rounded-lg border border-[#151124]/10 px-4 py-3" /></label></div><p className="mt-3 text-xs text-[#6d667a]">Photos upload directly to Supabase as original files with no app-enforced count or size limit; no WebP conversion or resizing is done.</p><button disabled={isSaving} className="mt-6 w-full rounded-lg bg-[#4f2c91] py-3 text-sm font-semibold text-white disabled:opacity-60">{isSaving ? "Saving…" : form.id ? "Save gallery" : "Create draft gallery"}</button></form></div> : null}
  </div>;
}