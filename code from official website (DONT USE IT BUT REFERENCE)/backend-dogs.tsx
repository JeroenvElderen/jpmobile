"use client";

import { Cake, CalendarDays, CheckCircle2, ChevronDown, Dog, Edit3, Filter, Mail, Mars, MoreVertical, PawPrint, Phone, Plus, Search, StickyNote, UserRound, Venus, Weight, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import Image from "next/image";

import { Card } from "./card";

const statCards = [
  ["total", "Total Dogs", Dog, "purple"],
  ["active", "Active Dogs", CheckCircle2, "green"],
  ["bookings", "With Recent Bookings", CalendarDays, "orange"],
  ["birthdays", "Live Rows", Cake, "violet"],
] as const;

const toneClasses = {
  purple: "bg-[#f0e9fb] text-[#5b2aa0]",
  green: "bg-green-100 text-green-700",
  orange: "bg-orange-100 text-orange-600",
  violet: "bg-[#f2eafd] text-[#5b2aa0]",
} as const;

type BackendDog = {
  id: string;
  name: string;
  gender: "male" | "female" | "unknown";
  owner: string;
  phone: string;
  email: string;
  breed: string;
  age: string;
  dateOfBirth: string | null;
  status: string;
  lastDate: string | null;
  lastService: string;
  notes: number;
  notesText: string;
  image: string | null;
};

const fallbackDogRows: BackendDog[] = [];

type DogsApiResponse = {
  dogs?: BackendDog[];
  isFallback?: boolean;
};

type DogClientOption = { id: string; name: string };

function getSupabaseRealtimeConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return url && key ? { url, key } : null;
}

function formatDisplayDate(value: string | null) {
  if (!value) return "No date yet";

  return new Intl.DateTimeFormat("en-IE", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

function DogProfilePlaceholder({ alt, className }: { alt: string; className: string }) {
  return (
    <span aria-label={`${alt} has no Supabase image`} className={`${className} grid place-items-center bg-[#f0e8f8] text-[#5b2aa0]`}>
      <PawPrint className="size-5" />
    </span>
  );
}

function DogProfileImage({ alt, className, height, src, width }: { alt: string; className: string; height: number; src: string | null; width: number }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const cleanSrc = src?.trim();

  if (!cleanSrc || failedSrc === cleanSrc) {
    return <DogProfilePlaceholder alt={alt} className={className} />;
  }

  return <Image src={cleanSrc} alt={alt} width={width} height={height} className={className} onError={() => setFailedSrc(cleanSrc)} />;
}

export function BackendDogs({ accessToken }: { accessToken: string }) {
  const [dogRows, setDogRows] = useState<BackendDog[]>(fallbackDogRows);
  const [selectedDogId, setSelectedDogId] = useState(fallbackDogRows[0]?.id ?? "");
  const [isLoadingDogs, setIsLoadingDogs] = useState(true);
  const [dogError, setDogError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"Overview" | "Info" | "History" | "Notes">("Overview");
  const [isEditingDog, setIsEditingDog] = useState(false);
  const [showNewDog, setShowNewDog] = useState(false);
  const [clientOptions, setClientOptions] = useState<DogClientOption[]>([]);
  const [newDog, setNewDog] = useState({ clientId: "", name: "", breed: "", age: "", notes: "" });
  const [isSavingDog, setIsSavingDog] = useState(false);
  const [openActionId, setOpenActionId] = useState<string | null>(null);
  const [actionMenuPosition, setActionMenuPosition] = useState<{ top: number; left: number } | null>(null);

  const loadDogs = useCallback(async () => {
    try {
      const response = await fetch("/api/dogs", { cache: "no-store", headers: { Authorization: `Bearer ${accessToken}` } });
      if (!response.ok) throw new Error(`Dogs API returned ${response.status}`);
      const payload = (await response.json()) as DogsApiResponse;
      const nextDogs = payload.dogs ?? [];
      setDogRows(nextDogs);
      setSelectedDogId((current) => nextDogs.some((dog) => dog.id === current) ? current : nextDogs[0]?.id ?? "");
      setDogError(payload.isFallback ? "Supabase returned fallback mode, but placeholder dogs are disabled." : null);
    } catch (error) {
      setDogError(error instanceof Error ? error.message : "Unable to load dogs.");
    } finally {
      setIsLoadingDogs(false);
    }
  }, [accessToken]);


  const loadClientOptions = useCallback(async () => {
    const response = await fetch("/api/clients", { cache: "no-store", headers: { Authorization: `Bearer ${accessToken}` } });
    if (!response.ok) return;
    const payload = (await response.json()) as { clients?: Array<{ id: string; name: string }> };
    const clients = payload.clients ?? [];
    setClientOptions(clients.map((client) => ({ id: client.id, name: client.name })));
    setNewDog((current) => ({ ...current, clientId: current.clientId || clients[0]?.id || "" }));
  }, [accessToken]);

  async function saveDogUpdates(dogId: string, updates: Partial<Pick<BackendDog, "name" | "breed" | "age" | "dateOfBirth" | "notesText" | "status">>) {
    setDogRows((rows) => rows.map((dog) => dog.id === dogId ? { ...dog, ...updates } : dog));
    const response = await fetch("/api/dogs", { method: "PATCH", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ id: dogId, ...updates, age: updates.dateOfBirth ?? updates.age, notes: updates.notesText }) });
    if (!response.ok) {
      setDogError("Supabase did not save the dog update. Please retry.");
      return;
    }
    await loadDogs();
  }

  function updateDogStatus(dog: BackendDog, status: string) {
    setOpenActionId(null);
    setActionMenuPosition(null);
    void saveDogUpdates(dog.id, { status });
  }

  async function createDog(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSavingDog(true);
    const response = await fetch("/api/dogs", { method: "POST", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify(newDog) });
    setIsSavingDog(false);
    if (!response.ok) { setDogError("Supabase did not create the dog. Please check the details and retry."); return; }
    setNewDog({ clientId: clientOptions[0]?.id || "", name: "", breed: "", age: "", notes: "" });
    setShowNewDog(false);
    await loadDogs();
  }

  useEffect(() => {
    queueMicrotask(() => { void loadDogs(); void loadClientOptions(); });
  }, [loadClientOptions, loadDogs]);

  useEffect(() => {
    const config = getSupabaseRealtimeConfig();
    if (!config || !accessToken) return;

    let isActive = true;
    let heartbeat: ReturnType<typeof setInterval> | null = null;
    const socket = new WebSocket(`${config.url.replace(/^http/, "ws")}/realtime/v1/websocket?apikey=${encodeURIComponent(config.key)}&vsn=1.0.0`);
    socket.addEventListener("open", () => {
      if (!isActive || socket.readyState !== WebSocket.OPEN) {
        socket.close();
        return;
      }

      socket.send(JSON.stringify({ topic: "realtime:backend-dogs", event: "phx_join", payload: { config: { postgres_changes: ["portal_dogs", "portal_clients", "portal_bookings", "portal_session_updates"].map((table) => ({ event: "*", schema: "public", table })) }, access_token: accessToken }, ref: "1" }));
      heartbeat = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ topic: "phoenix", event: "heartbeat", payload: {}, ref: String(Date.now()) }));
        }
      }, 25000);
    });
    socket.addEventListener("message", (event) => {
      try {
        const message = JSON.parse(event.data as string) as { event?: string };
        if (message.event === "postgres_changes") void loadDogs();
      } catch {
        // Ignore non-JSON realtime frames.
      }
    });

    return () => {
      isActive = false;
      if (heartbeat) clearInterval(heartbeat);
      if (socket.readyState === WebSocket.OPEN) socket.close();
    };
  }, [accessToken, loadDogs]);

  const selectedDog = useMemo(() => dogRows.find((dog) => dog.id === selectedDogId) ?? dogRows[0] ?? null, [dogRows, selectedDogId]);
  const activeDogs = dogRows.filter((dog) => dog.status === "Active").length;
  const dogStats = {
    total: { value: String(dogRows.length), detail: "Synced from Supabase" },
    active: { value: String(activeDogs), detail: `${dogRows.length ? Math.round((activeDogs / dogRows.length) * 100) : 0}% of total` },
    bookings: { value: String(dogRows.filter((dog) => dog.lastService !== "No bookings yet").length), detail: "Dogs with booking history" },
    birthdays: { value: String(dogRows.length), detail: "Live table rows" },
  };

  return (
    <div className="p-5 md:p-10">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div><h1 className="font-serif text-3xl">Dogs <PawPrint className="inline size-6 text-[#6c38c2]" /></h1><p className="mt-1 text-sm text-[#6d667a]">View and manage all dogs in your care.</p></div>
        <button onClick={() => setShowNewDog(true)} className="rounded-lg bg-[#4f2c91] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#4f2c91]/25"><Plus className="mr-2 inline size-4" />Add New Dog</button>
      </div>

      {showNewDog && <div className="fixed inset-0 z-50 grid place-items-center bg-[#151124]/45 p-4 backdrop-blur-sm"><form onSubmit={createDog} className="w-full max-w-xl rounded-[1.5rem] bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-[#6c38c2]">New dog</p><h2 className="mt-2 font-serif text-3xl">Save dog to Supabase</h2></div><button type="button" onClick={() => setShowNewDog(false)} className="rounded-lg border border-[#151124]/10 p-2"><X className="size-5" /></button></div><div className="mt-6 grid gap-3"><select required value={newDog.clientId} onChange={(e) => setNewDog((v) => ({ ...v, clientId: e.target.value }))} className="rounded-lg border px-3 py-2"><option value="" disabled>Select owner</option>{clientOptions.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select><input required value={newDog.name} onChange={(e) => setNewDog((v) => ({ ...v, name: e.target.value }))} placeholder="Dog name" className="rounded-lg border px-3 py-2" /><input value={newDog.breed} onChange={(e) => setNewDog((v) => ({ ...v, breed: e.target.value }))} placeholder="Breed" className="rounded-lg border px-3 py-2" /><label className="grid gap-1 text-sm font-semibold text-[#17132a]">Date of birth<input value={newDog.age} onChange={(e) => setNewDog((v) => ({ ...v, age: e.target.value }))} type="date" aria-label="Dog date of birth" className="rounded-lg border px-3 py-2 font-normal" /></label><textarea value={newDog.notes} onChange={(e) => setNewDog((v) => ({ ...v, notes: e.target.value }))} placeholder="Notes" className="rounded-lg border px-3 py-2" /></div><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setShowNewDog(false)} className="rounded-lg border px-5 py-3 text-sm font-bold">Cancel</button><button disabled={isSavingDog || !newDog.clientId} className="rounded-lg bg-[#4f2c91] px-5 py-3 text-sm font-bold text-white disabled:opacity-60">{isSavingDog ? "Saving…" : "Save to Supabase"}</button></div></form></div>}

      <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map(([key, label, Icon, tone]) => (
          <Card key={label} className="p-6"><div className="flex items-center gap-6"><span className={`grid size-14 place-items-center rounded-full ${toneClasses[tone]}`}><Icon className="size-7" /></span><div><p className="text-sm text-[#6d667a]">{label}</p><p className="mt-1 font-serif text-3xl">{dogStats[key].value}</p><p className="mt-2 text-sm text-[#6d667a]">{dogStats[key].detail}</p></div></div></Card>
        ))}
      </div>

      <div className="mt-6 grid gap-5 2xl:grid-cols-[1fr_23rem]">
        <Card className="overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-[#151124]/10 p-5 lg:flex-row lg:items-center lg:justify-between">
            <label className="flex min-w-0 flex-1 items-center gap-3 rounded-lg border border-[#151124]/10 px-4 py-3 text-sm text-[#858093] lg:max-w-lg"><Search className="size-5" /><input className="min-w-0 flex-1 bg-transparent outline-none" placeholder="Search dogs by name, breed, or owner..." /></label>
            <div className="flex flex-wrap gap-3"><button className="rounded-lg border border-[#151124]/10 px-5 py-3 text-sm">All Statuses <ChevronDown className="ml-6 inline size-4" /></button><button className="rounded-lg border border-[#151124]/10 px-5 py-3 text-sm">All Breeds <ChevronDown className="ml-6 inline size-4" /></button><button className="rounded-lg border border-[#151124]/10 px-5 py-3 text-sm"><Filter className="mr-2 inline size-4" />Filters</button></div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="bg-[#fbf9fd] text-xs font-semibold text-[#4f2c91]"><tr>{["Dog", "Owner", "Breed", "Age", "Status", "Last Service", "Notes", ""].map((h)=><th key={h} className="px-5 py-4">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-[#151124]/10">
                {dogRows.map((dog) => (
                  <tr key={dog.id} onClick={() => setSelectedDogId(dog.id)} className={`cursor-pointer align-middle transition ${selectedDog?.id === dog.id ? "bg-[#f6f0ff]" : "bg-white hover:bg-[#fbf9fd]"}`}>
                    <td className="px-5 py-4"><div className="flex items-center gap-4"><DogProfileImage key={dog.image ?? dog.id} src={dog.image} alt={`${dog.name} profile`} width={44} height={44} className="size-11 rounded-full object-cover" /><p className="font-semibold">{dog.name} {dog.gender === "male" ? <Mars className="inline size-4 text-blue-500" /> : dog.gender === "female" ? <Venus className="inline size-4 text-pink-500" /> : null}</p></div></td>
                    <td className="px-5 py-4"><p className="font-semibold">{dog.owner}</p><p className="mt-1 text-[#6d667a]">{dog.phone}</p></td>
                    <td className="px-5 py-4">{dog.breed}</td><td className="px-5 py-4">{dog.age}</td>
                    <td className="px-5 py-4"><span className={`rounded-md px-3 py-1 text-xs font-medium ${dog.status === "Active" ? "bg-green-100 text-green-700" : "bg-zinc-200 text-zinc-600"}`}>{dog.status}</span></td>
                    <td className="px-5 py-4"><p>{formatDisplayDate(dog.lastDate)}</p><p className="mt-1 text-[#6d667a]">{dog.lastService}</p></td>
                    <td className="px-5 py-4"><StickyNote className="mr-1 inline size-4 text-[#4f4863]" />{dog.notes}</td>
                    <td className="px-5 py-4"><button aria-label={`Actions for ${dog.name}`} onClick={(event) => { event.stopPropagation(); const rect = event.currentTarget.getBoundingClientRect(); setActionMenuPosition({ top: Math.max(12, Math.min(rect.bottom + 8, window.innerHeight - 116)), left: Math.max(12, Math.min(rect.right - 176, window.innerWidth - 188)) }); setOpenActionId((current) => current === dog.id ? null : dog.id); }} className="rounded-lg border border-[#151124]/10 p-2 text-[#4f4863]"><MoreVertical className="size-5" /></button>{openActionId === dog.id && actionMenuPosition && <div style={{ top: actionMenuPosition.top, left: actionMenuPosition.left }} className="fixed z-50 w-44 rounded-xl border border-[#151124]/10 bg-white p-2 shadow-2xl"><button onClick={(event) => { event.stopPropagation(); updateDogStatus(dog, "Active"); }} className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-[#fbf9fd]">Set active</button><button onClick={(event) => { event.stopPropagation(); updateDogStatus(dog, "Inactive"); }} className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-[#fbf9fd]">Set inactive</button></div>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-4 border-t border-[#151124]/10 p-5 text-sm text-[#6d667a] sm:flex-row sm:items-center sm:justify-between"><p>{isLoadingDogs ? "Loading live dogs…" : `Showing 1 to ${dogRows.length} of ${dogRows.length} dogs`}{dogError ? ` · ${dogError}` : ""}</p><div className="flex gap-2">{["←", "1", "2", "3", "...", "6", "→"].map((p)=><button key={p} className={`grid size-9 place-items-center rounded-md border border-[#151124]/10 ${p === "1" ? "border-[#5b2aa0] text-[#5b2aa0]" : "text-[#4f4863]"}`}>{p}</button>)}</div></div>
        </Card>

        <Card className="overflow-hidden p-5">
          {selectedDog ? (
            <>
              <div className="flex justify-end"><X className="size-5 text-[#4f4863]" /></div>
              <div className="flex items-center gap-4"><DogProfileImage key={selectedDog.image ?? selectedDog.id} src={selectedDog.image} alt={`${selectedDog.name} profile`} width={74} height={74} className="size-[74px] rounded-full object-cover" /><div><h2 className="font-serif text-2xl">{selectedDog.name} {selectedDog.gender === "male" ? <Mars className="inline size-4 text-blue-500" /> : selectedDog.gender === "female" ? <Venus className="inline size-4 text-pink-500" /> : null}</h2><p className="text-sm text-[#6d667a]">{selectedDog.breed}</p><span className={`mt-2 inline-block rounded-md px-3 py-1 text-xs font-medium ${selectedDog.status === "Active" ? "bg-green-100 text-green-700" : "bg-zinc-200 text-zinc-600"}`}>{selectedDog.status}</span></div></div>
              <div className="mt-8 flex border-b border-[#151124]/10 text-sm font-semibold text-[#4f4863]">{(["Overview", "Info", "History", "Notes"] as const).map((tab) => <button key={tab} onClick={() => setActiveTab(tab)} className={`${activeTab === tab ? "border-b-2 border-[#5b2aa0] text-[#5b2aa0]" : ""} px-4 pb-3`}>{tab}</button>)}</div>
              <div className="mt-5 space-y-5 text-sm">
                {(activeTab === "Overview" ? [[UserRound, "Owner", selectedDog.owner], [CalendarDays, "Last Service", `${formatDisplayDate(selectedDog.lastDate)}\n${selectedDog.lastService}`], [CalendarDays, "Live Status", isLoadingDogs ? "Refreshing from Supabase…" : "Synced from Supabase realtime"]] : activeTab === "Info" ? [[Phone, "Phone", selectedDog.phone], [Mail, "Email", selectedDog.email], [Cake, "Age", selectedDog.age], [Weight, "Breed", selectedDog.breed]] : activeTab === "History" ? [[CalendarDays, "Last Service", `${formatDisplayDate(selectedDog.lastDate)}\n${selectedDog.lastService}`], [StickyNote, "Updates", `${selectedDog.notes} saved update(s)`]] : [[StickyNote, "Notes", selectedDog.notesText]]).map(([Icon, label, value]) => <div key={String(label)} className="grid grid-cols-[1.2rem_5rem_1fr] gap-3 text-[#4f4863]"><Icon className="size-4 text-[#6c38c2]" /><span>{label as string}</span><span className="whitespace-pre-line text-[#4f4863]">{value as string}</span></div>)}
              </div>
              {isEditingDog && <div className="mt-5 rounded-xl border border-[#151124]/10 bg-[#fbf9fd] p-4 text-sm"><p className="font-semibold">Edit dog info</p><input defaultValue={selectedDog.name} onBlur={(event) => void saveDogUpdates(selectedDog.id, { name: event.target.value })} className="mt-3 w-full rounded-lg border px-3 py-2" /><input defaultValue={selectedDog.breed} onBlur={(event) => void saveDogUpdates(selectedDog.id, { breed: event.target.value })} className="mt-3 w-full rounded-lg border px-3 py-2" /><label className="mt-3 grid gap-1 text-sm font-semibold text-[#17132a]">Date of birth<input defaultValue={selectedDog.dateOfBirth ?? ""} onBlur={(event) => void saveDogUpdates(selectedDog.id, { dateOfBirth: event.target.value })} type="date" aria-label="Dog date of birth" className="w-full rounded-lg border px-3 py-2 font-normal" /></label><textarea defaultValue={selectedDog.notesText} onBlur={(event) => void saveDogUpdates(selectedDog.id, { notesText: event.target.value })} className="mt-3 w-full rounded-lg border px-3 py-2" /></div>}
              <button onClick={() => setIsEditingDog((value) => !value)} className="mt-3 w-full rounded-lg border border-[#151124]/10 px-5 py-3 text-sm font-semibold text-[#4f4863]"><Edit3 className="mr-2 inline size-4" />Edit Dog Info</button>
            </>
          ) : (
            <div className="grid min-h-80 place-items-center rounded-xl bg-[#fbf9fd] p-8 text-center text-sm text-[#6d667a]">No live dogs found in Supabase yet.</div>
          )}
        </Card>
      </div>
    </div>
  );
}