"use client";

import { ArrowLeft, Bell, Download, Heart, ImageIcon, PawPrint } from "lucide-react";
import Image from "next/image";

import { useSupabaseLiveQuery } from "./use-supabase-live-query";

type GalleryItem = {
  id: string;
  gallery_id: string | null;
  title: string | null;
  dog_name: string | null;
  image_url: string;
  alt_text: string | null;
  delivered_at: string | null;
  created_at: string;
  session_date: string | null;
};

function isSupabaseStorageUrl(src: string | null | undefined) {
  return Boolean(src?.includes("/storage/v1/object/"));
}

function mapGalleryRows(rows: unknown) {
  return Array.isArray(rows) ? (rows as GalleryItem[]) : [];
}

function GalleryPanel({ children, className = "", id }: { children: React.ReactNode; className?: string; id?: string }) {
  return <section id={id} className={`rounded-xl border border-[#24163f]/10 bg-white shadow-[0_18px_55px_rgba(29,23,40,0.08)] ${className}`}>{children}</section>;
}

function formatDate(value: string | null) {
  if (!value) return "Session date to confirm";
  return new Intl.DateTimeFormat("en-IE", { day: "numeric", month: "long", year: "numeric" }).format(new Date(value));
}

export function SessionGalleries({ accessToken, onBackToDashboard }: { accessToken?: string; onBackToDashboard: () => void }) {
  const { data: photos, isLoading, error } = useSupabaseLiveQuery({
    accessToken,
    fallback: [] as GalleryItem[],
    path: "/rest/v1/portal_gallery?select=*&order=created_at.desc",
    realtimeTables: ["portal_gallery_items", "portal_bookings", "portal_dogs"],
    map: mapGalleryRows,
  });
  const dogNames = Array.from(new Set(photos.map((photo) => photo.dog_name).filter(Boolean))).join(" and ") || "your dog";
  const galleries = Array.from(photos.reduce((map, photo) => {
    const key = photo.gallery_id || photo.id;
    const group = map.get(key) ?? { id: key, title: photo.title, session_date: photo.session_date, created_at: photo.created_at, delivered_at: photo.delivered_at, photos: [] as GalleryItem[] };
    group.photos.push(photo);
    map.set(key, group);
    return map;
  }, new Map<string, { id: string; title: string | null; session_date: string | null; created_at: string; delivered_at: string | null; photos: GalleryItem[] }>()).values());
  const latest = galleries[0];

  return (
    <div className="px-4 py-6 text-[#17132a] sm:px-8 lg:px-10 lg:py-10">
      <header className="mx-auto flex max-w-6xl items-start justify-between gap-4">
        <div>
          <button type="button" onClick={onBackToDashboard} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#4d2e91]"><ArrowLeft className="size-4" /> Back to Dashboard</button>
          <h1 className="font-serif text-4xl leading-tight text-[#241f30]">Session Galleries <PawPrint className="inline size-6 text-[#8b5cf6]" /></h1>
          <p className="mt-3 text-sm text-[#17132a]">Session galleries for {dogNames}, updated as soon as Jeroen adds photos.</p>
        </div>
        <div className="flex items-center gap-5"><Bell className="size-6 text-[#2f1b59]" /><div className="relative size-14 overflow-hidden rounded-full ring-2 ring-[#ead9b8]">{latest?.photos[0]?.image_url ? <Image src={latest.photos[0].image_url} alt={`${dogNames} profile photo`} fill sizes="56px" unoptimized={isSupabaseStorageUrl(latest.photos[0].image_url)} className="object-cover" /> : <span className="grid size-full place-items-center bg-[#f0e8f8] text-[#5b2aa0]"><PawPrint className="size-5" /></span>}</div></div>
      </header>

      <div className="mx-auto mt-8 max-w-6xl space-y-6">
        {(isLoading || error || galleries.length === 0) ? <p className="rounded-xl border border-[#24163f]/10 bg-white px-5 py-4 text-sm text-[#665d70]">{isLoading ? "Loading your galleries…" : error ?? "No session galleries yet."}</p> : null}
        {latest ? <GalleryPanel className="p-5 sm:p-7">
          <div className="flex flex-col gap-5 border-b border-[#24163f]/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div><h2 className="font-serif text-2xl text-[#241f30]">{latest.title || "Latest session"}</h2><p className="mt-2 text-sm text-[#5f5769]">{formatDate(latest.session_date || latest.delivered_at || latest.created_at)} · {latest.photos.length} photos</p></div>
            <button type="button" aria-label="Download gallery" className="grid size-11 place-items-center rounded border border-[#4d2e91]/30 text-[#3f2581]"><Download className="size-5" /></button>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {latest.photos.map((photo) => <figure key={photo.id} className="group relative aspect-[1.22] overflow-hidden rounded-lg bg-[#eee6df]"><Image src={photo.image_url} alt={photo.alt_text || `${photo.dog_name || "Dog"} session photo`} fill sizes="(min-width: 1024px) 250px, (min-width: 640px) 45vw, 92vw" unoptimized={isSupabaseStorageUrl(photo.image_url)} className="object-cover transition duration-500 group-hover:scale-105" /><button type="button" aria-label="Add photo to favourites" className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-white/90 text-[#4d2e91] opacity-0 shadow-lg transition group-hover:opacity-100"><Heart className="size-4" /></button></figure>)}
          </div>
        </GalleryPanel> : null}
        <GalleryPanel className="p-6 sm:p-7"><h2 className="font-serif text-2xl text-[#241f30]">Gallery In Progress</h2><p className="mt-3 text-sm text-[#5f5769]">When a session day is completed, this area updates while Jeroen prepares and shares the selected gallery photos.</p><span className="mt-5 inline-flex items-center gap-2 rounded bg-[#ede6f4] px-4 py-2 text-xs font-bold text-[#4d2e91]"><ImageIcon className="size-4" /> Gallery updates enabled</span></GalleryPanel>
      </div>
    </div>
  );
}
