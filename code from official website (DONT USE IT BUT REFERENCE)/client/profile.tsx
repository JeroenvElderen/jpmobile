"use client";

import {
  CalendarDays,
  ChevronRight,
  Edit3,
  Trash2,
  FileText,
  ImageIcon,
  LockKeyhole,
  Mail,
  MapPin,
  MoreVertical,
  PawPrint,
  Phone,
  Plus,
  Save,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { formatDogAge } from "@/utils/dog-age";

import { useSupabaseLiveQuery } from "./use-supabase-live-query";

type DogRow = {
  id: string;
  name: string;
  breed: string | null;
  age: string | null;
  status: string | null;
  profile_photo_url: string | null;
  notes: string | null;
};
type ProfileRow = {
  client_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  address: string | null;
  avatar_url: string | null;
  created_at: string;
  dog_names: string | null;
  dog_photo_url: string | null;
  dogs: DogRow[] | null;
};
type ActivityRow = { id: string; activity_type: string; title: string; body: string | null; created_at: string };
type ProfileData = { profile: ProfileRow | null; activity: ActivityRow[] };

const profileFallback: ProfileData = { profile: null, activity: [] };
const profileRealtimeTables = ["portal_clients", "portal_dogs", "portal_client_activity"];
const dogFallback: DogRow[] = [];
const dogRealtimeTables = ["portal_dogs"];

function mapProfileRows(rows: unknown): ProfileData {
  const list = Array.isArray(rows) ? (rows as (ProfileRow & { recent_activity: ActivityRow[] | null })[]) : [];
  const row = list[0];
  return { profile: row ?? null, activity: row?.recent_activity ?? [] };
}

function mapDogRows(rows: unknown): DogRow[] {
  return Array.isArray(rows) ? (rows as DogRow[]) : [];
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-[1.1rem] border border-[#24163f]/8 bg-white shadow-[0_18px_55px_rgba(29,23,40,0.07)] ${className}`}>{children}</section>;
}

function SectionTitle({ children, action = "Edit", onAction, showIcon = true }: { children: React.ReactNode; action?: string; onAction?: () => void; showIcon?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <h2 className="font-serif text-2xl text-[#241f30]">{children}</h2>
      {onAction ? (
        <button type="button" onClick={onAction} className="inline-flex items-center gap-2 text-sm font-semibold text-[#5b2aa0]">
          {showIcon ? <Edit3 className="size-4" /> : null}
          {action}
        </button>
      ) : null}
    </div>
  );
}

function formatSince(value?: string) {
  return value ? new Intl.DateTimeFormat("en-IE", { month: "long", year: "numeric" }).format(new Date(value)) : "your first booking";
}

function formatActivityTime(value: string) {
  const days = Math.max(1, Math.round((Date.now() - new Date(value).getTime()) / 86_400_000));
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  const weeks = Math.round(days / 7);
  return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-[#24163f]/10 pb-4 last:border-0">
      <p className="text-sm font-semibold text-[#17132a]">{label}</p>
      <p className="mt-2 text-sm text-[#2f2938]">{value}</p>
    </div>
  );
}

function isSupabaseStorageUrl(src: string | null | undefined) {
  return Boolean(src?.includes("/storage/v1/object/"));
}

function DogImagePlaceholder({ alt, className }: { alt: string; className: string }) {
  return (
    <span aria-label={`${alt} has no Supabase image`} className={`${className} grid place-items-center bg-[#f0e8f8] text-[#5b2aa0]`}>
      <PawPrint className="size-6" />
    </span>
  );
}

function DogImage({ alt, className, src, sizes }: { alt: string; className: string; src: string | null; sizes: string }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const cleanSrc = src?.trim();

  if (!cleanSrc || failedSrc === cleanSrc) {
    return <DogImagePlaceholder alt={alt} className={className} />;
  }

  return <Image src={cleanSrc} alt={alt} fill sizes={sizes} unoptimized={isSupabaseStorageUrl(cleanSrc)} className={className} onError={() => setFailedSrc(cleanSrc)} />;
}

export function Profile({ accessToken, onBackToDashboard }: { accessToken?: string; onBackToDashboard: () => void }) {
  const { data, isLoading, error } = useSupabaseLiveQuery({
    accessToken,
    fallback: profileFallback,
    path: "/rest/v1/portal_profile?select=*&limit=1",
    realtimeTables: profileRealtimeTables,
    map: mapProfileRows,
  });
  const { data: dogRows, error: dogError } = useSupabaseLiveQuery({
    accessToken,
    fallback: dogFallback,
    path: "/rest/v1/portal_dogs?select=id,name,breed,age,status,profile_photo_url,notes&order=created_at.asc",
    realtimeTables: dogRealtimeTables,
    map: mapDogRows,
  });
  const [message, setMessage] = useState<string | null>(null);
  const [isDogFormOpen, setIsDogFormOpen] = useState(false);
  const [isProfileFormOpen, setIsProfileFormOpen] = useState(false);
  const [isPasswordFormOpen, setIsPasswordFormOpen] = useState(false);
  const [editingDogId, setEditingDogId] = useState<string | null>(null);
  const [openDogActionId, setOpenDogActionId] = useState<string | null>(null);
  const [dogActionMenuPosition, setDogActionMenuPosition] = useState<{ top: number; left: number } | null>(null);

  function getSupabaseWriteConfig() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key || !accessToken) {
      setMessage("Please log in before saving changes.");
      return null;
    }

    return { url, key, accessToken };
  }

  async function getSupabaseWriteError(response: Response) {
    await response.json().catch(() => null);
    return `Your changes could not be saved (${response.status}). Please try again or contact Jeroen.`;
  }

  async function uploadPortalImage(config: { url: string; key: string; accessToken: string }, file: File, folder: "avatars" | "dogs") {
    if (!file.size) return null;
    if (!file.type.startsWith("image/")) {
      throw new Error("Please choose an image file.");
    }

    const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const objectPath = `${folder}/${crypto.randomUUID()}.${extension}`;
    const response = await fetch(`${config.url}/storage/v1/object/portal-images/${objectPath}`, {
      method: "POST",
      headers: {
        apikey: config.key,
        Authorization: `Bearer ${config.accessToken}`,
        "Content-Type": file.type || "application/octet-stream",
        "x-upsert": "true",
      },
      body: file,
    });

    if (!response.ok) {
      throw new Error("Unable to upload image. Please try again.");
    }

    return `${config.url}/storage/v1/object/public/portal-images/${objectPath}`;
  }

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!data.profile) return;
    const config = getSupabaseWriteConfig();
    if (!config) return;
    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const avatarFile = formData.get("avatar_file");
      const uploadedAvatarUrl = avatarFile instanceof File ? await uploadPortalImage(config, avatarFile, "avatars") : null;
      const response = await fetch(`${config.url}/rest/v1/portal_clients?id=eq.${data.profile.client_id}`, {
        method: "PATCH",
        headers: { apikey: config.key, Authorization: `Bearer ${config.accessToken}`, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({
          full_name: String(formData.get("full_name") ?? "").trim(),
          email: String(formData.get("email") ?? "").trim(),
          phone: String(formData.get("phone") ?? "").trim() || null,
          address: String(formData.get("address") ?? "").trim() || null,
          avatar_url: uploadedAvatarUrl ?? data.profile.avatar_url,
        }),
      });
      if (response.ok) {
        setMessage("Profile saved. Realtime will refresh this page automatically.");
        setIsProfileFormOpen(false);
      } else {
        setMessage(await getSupabaseWriteError(response));
      }
    } catch (uploadError) {
      setMessage(uploadError instanceof Error ? uploadError.message : "Unable to upload image.");
    }
  }

  async function savePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const config = getSupabaseWriteConfig();
    if (!config) return;
    const { url, key, accessToken } = config;
    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirm_password") ?? "");

    if (password.length < 6) {
      setMessage("Choose a password with at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    const response = await fetch(`${url}/auth/v1/user`, {
      method: "PUT",
      headers: { apikey: key, Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (response.ok) {
      event.currentTarget.reset();
      setIsPasswordFormOpen(false);
      setMessage("Password updated successfully.");
    } else {
      setMessage(await getSupabaseWriteError(response));
    }
  }

  async function saveDog(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!data.profile) return;
    const config = getSupabaseWriteConfig();
    if (!config) return;
    const { url, key, accessToken } = config;
    const form = event.currentTarget;
    const formData = new FormData(form);
    const dogName = String(formData.get("name") ?? "").trim();

    if (!dogName) {
      setMessage("Add your dog’s name before saving.");
      return;
    }

    try {
      const photoFile = formData.get("profile_photo_file");
      const uploadedPhotoUrl = photoFile instanceof File ? await uploadPortalImage(config, photoFile, "dogs") : null;
      const response = await fetch(`${url}/rest/v1/portal_dogs`, {
        method: "POST",
        headers: { apikey: key, Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({
          client_id: data.profile.client_id,
          name: dogName,
          breed: String(formData.get("breed") ?? "").trim() || null,
          age: String(formData.get("age") ?? "").trim() || null,
          profile_photo_url: uploadedPhotoUrl,
          notes: String(formData.get("notes") ?? "").trim() || null,
          status: "active",
        }),
      });

      if (response.ok) {
        form.reset();
        setIsDogFormOpen(false);
        setMessage("Dog saved. Realtime will refresh this page automatically.");
      } else {
        setMessage(await getSupabaseWriteError(response));
      }
    } catch (uploadError) {
      setMessage(uploadError instanceof Error ? uploadError.message : "Unable to upload dog photo.");
    }
  }

  async function updateDog(dogId: string, updates: Partial<Pick<DogRow, "name" | "breed" | "age" | "status" | "profile_photo_url" | "notes">>) {
    const config = getSupabaseWriteConfig();
    if (!config) return false;
    const response = await fetch(`${config.url}/rest/v1/portal_dogs?id=eq.${dogId}`, {
      method: "PATCH",
      headers: { apikey: config.key, Authorization: `Bearer ${config.accessToken}`, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      setMessage(await getSupabaseWriteError(response));
      return false;
    }

    setMessage("Dog updated. Realtime will refresh this page automatically.");
    return true;
  }

  async function saveDogEdit(event: React.FormEvent<HTMLFormElement>, dog: DogRow) {
    event.preventDefault();
    const config = getSupabaseWriteConfig();
    if (!config) return;
    const formData = new FormData(event.currentTarget);
    const dogName = String(formData.get("name") ?? "").trim();

    if (!dogName) {
      setMessage("Add your dog’s name before saving.");
      return;
    }

    try {
      const photoFile = formData.get("profile_photo_file");
      const uploadedPhotoUrl = photoFile instanceof File ? await uploadPortalImage(config, photoFile, "dogs") : null;
      const saved = await updateDog(dog.id, {
        name: dogName,
        breed: String(formData.get("breed") ?? "").trim() || null,
        age: String(formData.get("age") ?? "").trim() || null,
        profile_photo_url: uploadedPhotoUrl ?? dog.profile_photo_url,
        notes: String(formData.get("notes") ?? "").trim() || null,
      });
      if (saved) {
        setEditingDogId(null);
        setOpenDogActionId(null);
        setDogActionMenuPosition(null);
      }
    } catch (uploadError) {
      setMessage(uploadError instanceof Error ? uploadError.message : "Unable to upload dog photo.");
    }
  }

  async function deactivateDog(dog: DogRow) {
    setOpenDogActionId(null);
    setDogActionMenuPosition(null);
    await updateDog(dog.id, { status: dog.status === "inactive" ? "active" : "inactive" });
  }

  async function deleteDog(dog: DogRow) {
    const config = getSupabaseWriteConfig();
    if (!config) return;
    const response = await fetch(`${config.url}/rest/v1/portal_dogs?id=eq.${dog.id}`, {
      method: "DELETE",
      headers: { apikey: config.key, Authorization: `Bearer ${config.accessToken}`, Prefer: "return=minimal" },
    });

    if (response.ok) {
      setOpenDogActionId(null);
      setDogActionMenuPosition(null);
      setMessage("Dog deleted. Realtime will refresh this page automatically.");
    } else {
      setMessage(await getSupabaseWriteError(response));
    }
  }

  const profile = data.profile;
  const dogs = dogRows.length ? dogRows : profile?.dogs?.length ? profile.dogs : [];
  const profileError = error ?? dogError;
  
  return (
    <div className="px-4 py-6 text-[#17132a] sm:px-8 lg:px-10 lg:py-10">
      <div className="mx-auto mt-8 max-w-6xl space-y-6">
        <button type="button" onClick={onBackToDashboard} className="text-sm font-semibold text-[#5b2aa0]">
          ← Back to dashboard
        </button>
        {isLoading || profileError || !profile ? (
          <p className="rounded-xl border border-[#24163f]/10 bg-white px-5 py-4 text-sm text-[#665d70]">{isLoading ? "Loading your profile…" : profileError ?? "No profile data yet."}</p>
        ) : null}
        {profile ? (
          <>
            <Panel className="overflow-hidden p-6 sm:p-8">
              <div className="grid gap-8 lg:grid-cols-[14rem_1fr_18rem] lg:items-center">
                <button type="button" onClick={() => setIsProfileFormOpen(true)} className="relative mx-auto size-44 lg:mx-0" aria-label="Edit profile picture and details">
                  <DogImage src={profile.avatar_url || profile.dog_photo_url} alt={`${profile.full_name} profile`} sizes="176px" className="rounded-full object-cover ring-4 ring-[#ead9b8]" />
                  <span className="absolute bottom-3 right-0 grid size-12 place-items-center rounded-full bg-white text-[#4d2e91] shadow-[0_12px_28px_rgba(29,23,40,0.18)]">
                    <Edit3 className="size-5" />
                  </span>
                </button>
                <div>
                  <h2 className="font-serif text-3xl text-[#241f30]">{profile.full_name}</h2>
                  <div className="mt-6 space-y-4 text-sm text-[#2f2938]">
                    <p className="flex items-center gap-3"><Mail className="size-4 text-[#4d2e91]" />{profile.email}</p>
                    <p className="flex items-center gap-3"><Phone className="size-4 text-[#4d2e91]" />{profile.phone || "Add a phone number"}</p>
                    <p className="flex items-center gap-3"><MapPin className="size-4 text-[#4d2e91]" />{profile.address || "Add an address"}</p>
                  </div>
                  <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#f0e8f8] px-5 py-2 text-sm font-semibold text-[#4d2e91]"><PawPrint className="size-4" />Member since {formatSince(profile.created_at)}</span>
                </div>
                <div className="relative rounded-xl bg-[#faf7fb] p-6">
                  <div className="absolute right-3 top-3 text-6xl leading-none text-[#d8c7ef]">♡</div>
                  <p className="relative text-lg leading-8">“Making tails wag<br />and lives better,<br />one walk at a time.”</p>
                  <p className="mt-5 font-serif text-2xl text-[#4d2e91]">Jeroen <PawPrint className="inline size-4" /></p>
                </div>
              </div>
            </Panel>

            <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
              <div className="space-y-6">
                <Panel className="p-6 sm:p-7">
                  <SectionTitle action={isProfileFormOpen ? "Close" : "Edit"} onAction={() => setIsProfileFormOpen((isOpen) => !isOpen)}>{"Personal Information"}</SectionTitle>
                  {isProfileFormOpen ? (
                    <form onSubmit={saveProfile} className="mt-6 grid gap-4 rounded-xl bg-[#fbf8ff] p-4">
                      <label className="grid gap-1 text-sm font-semibold text-[#17132a]">Full Name<input className="rounded border border-[#24163f]/15 px-4 py-3 font-normal" name="full_name" defaultValue={profile.full_name} placeholder="Full name" /></label>
                      <label className="grid gap-1 text-sm font-semibold text-[#17132a]">Email Address<input className="rounded border border-[#24163f]/15 px-4 py-3 font-normal" name="email" type="email" defaultValue={profile.email} placeholder="Email address" /></label>
                      <label className="grid gap-1 text-sm font-semibold text-[#17132a]">Phone Number<input className="rounded border border-[#24163f]/15 px-4 py-3 font-normal" name="phone" defaultValue={profile.phone ?? ""} placeholder="Phone" /></label>
                      <label className="grid gap-1 text-sm font-semibold text-[#17132a]">Address<input className="rounded border border-[#24163f]/15 px-4 py-3 font-normal" name="address" defaultValue={profile.address ?? ""} placeholder="Address" /></label>
                      <label className="grid gap-1 text-sm font-semibold text-[#17132a]">Profile picture<input className="rounded border border-[#24163f]/15 bg-white px-4 py-3 font-normal" name="avatar_file" type="file" accept="image/*" /></label>
                      <div className="flex flex-wrap gap-3">
                        <button className="inline-flex w-fit items-center gap-2 rounded bg-[#4d2e91] px-6 py-3 text-xs font-black uppercase tracking-[0.14em] text-white"><Save className="size-4" />Save profile</button>
                        <button type="button" onClick={() => setIsProfileFormOpen(false)} className="inline-flex w-fit items-center gap-2 rounded border border-[#5b2aa0]/30 px-6 py-3 text-xs font-black uppercase tracking-[0.14em] text-[#5b2aa0]"><X className="size-4" />Cancel</button>
                      </div>
                    </form>
                  ) : (
                    <div className="mt-6 grid gap-4">
                      <InfoLine label="Full Name" value={profile.full_name} />
                      <InfoLine label="Email Address" value={profile.email} />
                      <InfoLine label="Phone Number" value={profile.phone || "Add a phone number"} />
                      <InfoLine label="Address" value={profile.address || "Add an address"} />
                    </div>
                  )}
                  {message ? <p className="mt-4 rounded-lg border border-[#5b2aa0]/20 bg-[#fbf8ff] px-4 py-3 text-sm text-[#4a3d58]">{message}</p> : null}
                </Panel>
              </div>

              <div className="space-y-6">
                <Panel className="p-6 sm:p-7">
                  <SectionTitle showIcon={false}>Security</SectionTitle>
                  <div className="mt-6 divide-y divide-[#24163f]/10">
                    <button type="button" onClick={() => setIsPasswordFormOpen((isOpen) => !isOpen)} className="flex w-full items-center justify-between py-4 text-left first:pt-0">
                      <span className="flex items-center gap-4"><span className="grid size-12 place-items-center rounded-full bg-[#f4eef8] text-[#5b2aa0]"><LockKeyhole className="size-5" /></span><span><span className="block font-semibold">Password</span><span className="text-sm text-[#665d70]">************</span></span></span>
                      <ChevronRight className={`size-4 text-[#5b2aa0] transition-transform ${isPasswordFormOpen ? "rotate-90" : ""}`} />
                    </button>
                  </div>
                  {isPasswordFormOpen ? (
                    <form onSubmit={savePassword} className="mt-4 grid gap-3 rounded-xl bg-[#fbf8ff] p-4">
                      <input className="rounded border border-[#24163f]/15 px-4 py-3" name="password" type="password" placeholder="New password" minLength={6} required />
                      <input className="rounded border border-[#24163f]/15 px-4 py-3" name="confirm_password" type="password" placeholder="Confirm new password" minLength={6} required />
                      <button className="inline-flex w-fit items-center gap-2 rounded bg-[#4d2e91] px-6 py-3 text-xs font-black uppercase tracking-[0.14em] text-white"><Save className="size-4" />Save password</button>
                    </form>
                  ) : null}
                </Panel>

                <Panel className="p-6 sm:p-7">
                  <SectionTitle>My Dogs</SectionTitle>
                  <div className="mt-6 divide-y divide-[#24163f]/10">
                    {dogs.map((dog) => (
                      <article key={dog.id} className="py-5 first:pt-0">
                        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                          <span className="flex items-center gap-4"><span className="relative size-16 overflow-hidden rounded-full"><DogImage src={dog.profile_photo_url} alt={dog.name} sizes="64px" className="object-cover" /></span><span><span className="font-serif text-2xl text-[#241f30]">{dog.name}</span><span className="mt-1 block text-sm text-[#665d70]">{dog.breed || "Dog"}{dog.age ? ` • ${formatDogAge(dog.age)}` : ""}</span></span></span>
                          <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-[#f0e8f8] px-4 py-1 text-xs font-semibold text-[#5b2aa0]">{dog.status || "Active"}</span><button type="button" aria-label={`Actions for ${dog.name}`} onClick={(event) => { const rect = event.currentTarget.getBoundingClientRect(); setDogActionMenuPosition({ top: Math.max(12, Math.min(rect.bottom + 8, window.innerHeight - 168)), left: Math.max(12, Math.min(rect.right - 176, window.innerWidth - 188)) }); setOpenDogActionId((current) => current === dog.id ? null : dog.id); }} className="rounded-lg border border-[#24163f]/10 p-2 text-[#4f4863]"><MoreVertical className="size-5" /></button>{openDogActionId === dog.id && dogActionMenuPosition ? <div style={{ top: dogActionMenuPosition.top, left: dogActionMenuPosition.left }} className="fixed z-50 w-44 rounded-xl border border-[#24163f]/10 bg-white p-2 text-[#17132a] shadow-2xl"><button type="button" onClick={() => { setEditingDogId((current) => current === dog.id ? null : dog.id); setOpenDogActionId(null); setDogActionMenuPosition(null); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-[#fbf9fd]"><Edit3 className="size-4" />Edit</button><button type="button" onClick={() => deactivateDog(dog)} className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-[#fbf9fd]">{dog.status === "inactive" ? "Reactivate" : "Deactivate"}</button><button type="button" onClick={() => deleteDog(dog)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"><Trash2 className="size-4" />Delete</button></div> : null}</div>
                        </div>
                        {editingDogId === dog.id ? (
                          <form onSubmit={(event) => saveDogEdit(event, dog)} className="mt-4 grid gap-3 rounded-xl bg-[#fbf8ff] p-4">
                            <input className="rounded border border-[#24163f]/15 px-4 py-3" name="name" defaultValue={dog.name} placeholder="Dog name" required />
                            <input className="rounded border border-[#24163f]/15 px-4 py-3" name="breed" defaultValue={dog.breed ?? ""} placeholder="Breed" />
                            <label className="grid gap-1 text-sm font-semibold text-[#17132a]">Date of birth<input className="rounded border border-[#24163f]/15 px-4 py-3 font-normal" name="age" type="date" defaultValue={dog.age ?? ""} aria-label="Dog date of birth" /></label>
                            <label className="grid gap-1 text-sm font-semibold text-[#17132a]">Replace dog photo<input className="rounded border border-[#24163f]/15 bg-white px-4 py-3 font-normal" name="profile_photo_file" type="file" accept="image/*" /></label>
                            <textarea className="min-h-24 rounded border border-[#24163f]/15 px-4 py-3" name="notes" defaultValue={dog.notes ?? ""} placeholder="Notes, routines, behaviour, or care instructions" />
                            <div className="flex flex-wrap gap-3"><button className="inline-flex w-fit items-center gap-2 rounded bg-[#4d2e91] px-6 py-3 text-xs font-black uppercase tracking-[0.14em] text-white"><Save className="size-4" />Save dog</button><button type="button" onClick={() => setEditingDogId(null)} className="inline-flex w-fit items-center gap-2 rounded border border-[#5b2aa0]/30 px-6 py-3 text-xs font-black uppercase tracking-[0.14em] text-[#5b2aa0]"><X className="size-4" />Cancel</button></div>
                          </form>
                        ) : null}
                      </article>
                    ))}
                    {!dogs.length ? <p className="py-5 text-sm text-[#665d70]">Add your dog here and it will be saved to your profile.</p> : null}
                  </div>
                  <button type="button" onClick={() => setIsDogFormOpen((isOpen) => !isOpen)} className="mt-4 inline-flex w-full items-center justify-center gap-3 rounded-md border border-[#5b2aa0]/40 px-5 py-3 text-sm font-semibold text-[#5b2aa0]"><Plus className="size-4" />{isDogFormOpen ? "Close Dog Form" : "Add a Dog"}</button>
                  {isDogFormOpen ? (
                    <form onSubmit={saveDog} className="mt-4 grid gap-3 rounded-xl bg-[#fbf8ff] p-4">
                      <input className="rounded border border-[#24163f]/15 px-4 py-3" name="name" placeholder="Dog name" required />
                      <input className="rounded border border-[#24163f]/15 px-4 py-3" name="breed" placeholder="Breed" />
                      <label className="grid gap-1 text-sm font-semibold text-[#17132a]">Date of birth<input className="rounded border border-[#24163f]/15 px-4 py-3 font-normal" name="age" type="date" aria-label="Dog date of birth" /></label>
                      <label className="grid gap-1 text-sm font-semibold text-[#17132a]">Dog photo<input className="rounded border border-[#24163f]/15 bg-white px-4 py-3 font-normal" name="profile_photo_file" type="file" accept="image/*" /></label>
                      <textarea className="min-h-24 rounded border border-[#24163f]/15 px-4 py-3" name="notes" placeholder="Notes, routines, behaviour, or care instructions" />
                      <button className="inline-flex w-fit items-center gap-2 rounded bg-[#4d2e91] px-6 py-3 text-xs font-black uppercase tracking-[0.14em] text-white"><Save className="size-4" />Save dog</button>
                    </form>
                  ) : null}
                </Panel>
              </div>
            </div>

            <Panel className="p-6 sm:p-7">
              <div className="flex items-start justify-between"><h2 className="font-serif text-2xl text-[#241f30]">Recent Activity</h2><button type="button" className="text-sm font-semibold text-[#5b2aa0]">View all activity →</button></div>
              <div className="mt-6 divide-y divide-[#24163f]/10">
                {data.activity.length ? data.activity.map((item) => <article key={item.id} className="grid gap-3 py-3 first:pt-0 last:pb-0 sm:grid-cols-[2.5rem_1fr_auto] sm:items-center"><span className="grid size-10 place-items-center rounded-full bg-[#f4eef8] text-[#4d2e91]">{item.activity_type === "gallery" ? <ImageIcon className="size-5" /> : item.activity_type === "invoice" ? <FileText className="size-5" /> : <CalendarDays className="size-5" />}</span><div><h3 className="font-semibold text-[#241f30]">{item.title}</h3><p className="mt-1 text-sm text-[#665d70]">{item.body}</p></div><p className="text-sm text-[#665d70]">{formatActivityTime(item.created_at)}</p></article>) : <p className="text-sm text-[#665d70]">No recent activity yet.</p>}
              </div>
            </Panel>
            <section className="flex flex-col gap-4 rounded-[1.1rem] bg-[#f5effb] p-6 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-5"><span className="grid size-16 place-items-center rounded-full bg-[#5b2aa0] text-white"><PawPrint className="size-9" /></span><div><h2 className="font-serif text-2xl text-[#241f30]">We’re here for you and your pup!</h2><p className="text-sm text-[#2f2938]">Need anything? Our team is just a message away.</p></div></div><Link href="/contact" className="inline-flex items-center justify-center gap-3 rounded-md bg-[#5b2aa0] px-8 py-4 text-xs font-black uppercase tracking-[0.16em] text-white">Send a message <PawPrint className="size-4" /></Link></section>
          </>
        ) : null}
      </div>
    </div>
  );
}
