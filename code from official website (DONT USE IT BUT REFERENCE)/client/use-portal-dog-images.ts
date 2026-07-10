"use client";

import { useEffect, useMemo, useState } from "react";

import { useSupabaseLiveQuery } from "./use-supabase-live-query";

const imageStorageKey = "jeroen-and-paws-client-dog-image-pool";
const emptyPhotos: PortalDogImage[] = [];
const realtimeTables = ["portal_dogs", "portal_gallery_items"];

type PortalDogImage = {
  id: string;
  imageUrl: string;
};

type PortalDogRow = {
  id: string;
  profile_photo_url: string | null;
  hero_photo_url: string | null;
};

type GalleryRow = {
  id: string;
  image_url: string | null;
};

type ImagePoolPayload = {
  dogs: PortalDogRow[];
  gallery: GalleryRow[];
};

function cleanUrl(value: string | null | undefined) {
  return value?.trim() || "";
}

function uniqueImages(images: PortalDogImage[]) {
  const seen = new Set<string>();
  return images.filter((image) => {
    if (!image.imageUrl || seen.has(image.imageUrl)) return false;
    seen.add(image.imageUrl);
    return true;
  });
}

function mapDogRows(rows: unknown): PortalDogImage[] {
  if (!Array.isArray(rows)) return [];

  return uniqueImages((rows as PortalDogRow[]).flatMap((dog) => [
    ...(cleanUrl(dog.hero_photo_url) ? [{ id: `${dog.id}-hero`, imageUrl: cleanUrl(dog.hero_photo_url) }] : []),
    ...(cleanUrl(dog.profile_photo_url) ? [{ id: `${dog.id}-profile`, imageUrl: cleanUrl(dog.profile_photo_url) }] : []),
  ]));
}

function mapGalleryRows(rows: unknown): PortalDogImage[] {
  if (!Array.isArray(rows)) return [];

  return uniqueImages((rows as GalleryRow[]).map((photo) => ({ id: photo.id, imageUrl: cleanUrl(photo.image_url) })));
}

async function loadClientDogImages(token?: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const bearer = token ?? key;

  if (!url || !key || !bearer) return emptyPhotos;

  const headers = { apikey: key, Authorization: `Bearer ${bearer}` };
  const [dogsResponse, galleryResponse] = await Promise.all([
    fetch(`${url}/rest/v1/portal_dogs?select=id,profile_photo_url,hero_photo_url&status=eq.active&order=created_at.desc`, { cache: "no-store", headers }),
    fetch(`${url}/rest/v1/portal_gallery?select=id,image_url&order=created_at.desc`, { cache: "no-store", headers }),
  ]);

  if (!dogsResponse.ok || !galleryResponse.ok) return emptyPhotos;

  const payload: ImagePoolPayload = {
    dogs: await dogsResponse.json().catch(() => []),
    gallery: await galleryResponse.json().catch(() => []),
  };

  return uniqueImages([...mapDogRows(payload.dogs), ...mapGalleryRows(payload.gallery)]);
}

function randomIndex(max: number) {
  return Math.floor(Math.random() * max);
}

function shuffle<T>(items: T[]) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = randomIndex(index + 1);
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function storedUrls() {
  try {
    const stored = window.localStorage.getItem(imageStorageKey);
    return stored ? (JSON.parse(stored) as string[]) : [];
  } catch {
    return [];
  }
}

function chooseImages(photos: PortalDogImage[], count: number) {
  const pool = uniqueImages(photos).map((photo) => photo.imageUrl);
  if (!pool.length) return [];

  const previous = storedUrls();
  const fresh = pool.filter((url) => !previous.includes(url));
  const ordered = [...shuffle(fresh), ...shuffle(pool.filter((url) => !fresh.includes(url)))];
  const chosen = Array.from({ length: count }, (_, index) => ordered[index] || pool[index % pool.length]);
  window.localStorage.setItem(imageStorageKey, JSON.stringify(chosen));
  return chosen;
}

export function usePortalDogImages(accessToken?: string, slotCount = 8) {
  const [images, setImages] = useState<string[]>([]);
  const fallback = useMemo(() => emptyPhotos, []);
  const { data: photos } = useSupabaseLiveQuery({
    accessToken,
    fallback,
    path: "/rest/v1/portal_dogs?select=id,profile_photo_url,hero_photo_url&status=eq.active&order=created_at.desc",
    realtimeTables,
    map: mapDogRows,
    load: loadClientDogImages,
  });

  useEffect(() => {
    queueMicrotask(() => setImages(chooseImages(photos, slotCount)));
  }, [photos, slotCount]);

  return {
    images,
    getImage(index: number, fallbackImage?: string | null) {
      return images[index % Math.max(images.length, 1)] || fallbackImage || null;
    },
  };
}