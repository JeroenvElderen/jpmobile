"use client";

import { CalendarDays, CheckCircle2, ChevronDown, Clock3, Filter, GraduationCap, MoreVertical, PawPrint, Plus, Search, X, XCircle } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";

import { formatBookingDate, formatBookingTime, type BookingStatus, type CalendarBooking } from "@/utils/bookings";
import { Card } from "./card";

type BookingOptionDog = {
  id: string;
  name: string;
  clientId: string;
  clientName: string;
  image: string | null;
};

type BookingOptionClient = {
  id: string;
  name: string;
  dogs: BookingOptionDog[];
};

type BookingsApiResponse = {
  bookings?: CalendarBooking[];
  dogs?: BookingOptionDog[];
  isFallback?: boolean;
};

const fallbackImage = "/images/dogs/kaiser.jpg";
const statusLabels: Record<BookingStatus, string> = {
  requested: "Requested",
  pending_confirmation: "Pending",
  confirmed: "Confirmed",
  reschedule_requested: "Reschedule",
  cancelled: "Cancelled",
  completed: "Completed",
  no_show: "No show",
  needs_review: "Needs review",
  busy: "Busy",
};

const serviceOptions = ["Dog Walk", "Training Session", "Group Walk", "Home check-in", "Daytime care", "Overnight stay", "Custom Care"];

function getSupabaseRealtimeConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return url && key ? { url, key } : null;
}

function toDateTimeLocalValue(value: Date) {
  const offset = value.getTimezoneOffset();
  const local = new Date(value.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

function getDurationMinutes(booking: CalendarBooking) {
  return Math.max(0, Math.round((new Date(booking.endsAt).getTime() - new Date(booking.startsAt).getTime()) / 60000));
}

function getStatusClass(status: BookingStatus) {
  if (["requested", "pending_confirmation", "needs_review", "reschedule_requested"].includes(status)) return "bg-amber-100 text-amber-700";
  if (["cancelled", "no_show"].includes(status)) return "bg-rose-100 text-rose-700";
  if (status === "completed") return "bg-blue-100 text-blue-700";
  return "bg-green-100 text-green-700";
}

function NewBookingModal({ accessToken, dogs, onClose, onCreated }: { accessToken: string; dogs: BookingOptionDog[]; onClose: () => void; onCreated: () => void }) {
  const defaultStart = useMemo(() => {
    const value = new Date();
    value.setDate(value.getDate() + 1);
    value.setHours(10, 0, 0, 0);
    return toDateTimeLocalValue(value);
  }, []);
  const clients = useMemo<BookingOptionClient[]>(() => {
    const grouped = new Map<string, BookingOptionClient>();

    dogs.forEach((dog) => {
      const existing = grouped.get(dog.clientId);

      if (existing) {
        existing.dogs.push(dog);
        return;
      }

      grouped.set(dog.clientId, { id: dog.clientId, name: dog.clientName, dogs: [dog] });
    });

    return Array.from(grouped.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [dogs]);
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [selectedDogIds, setSelectedDogIds] = useState<string[]>(clients[0]?.dogs[0]?.id ? [clients[0].dogs[0].id] : []);
  const [serviceName, setServiceName] = useState(serviceOptions[0]);
  const [startsAt, setStartsAt] = useState(defaultStart);
  const [durationMinutes, setDurationMinutes] = useState("60");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<BookingStatus>("confirmed");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      const start = new Date(startsAt);
      const end = new Date(start.getTime() + Number(durationMinutes) * 60000);
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, dogIds: selectedDogIds, serviceName, startsAt: start.toISOString(), endsAt: end.toISOString(), location, notes, status }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(payload.error || `Bookings API returned ${response.status}`);
      onCreated();
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to create booking.");
    } finally {
      setIsSaving(false);
    }
  }

  const clientDogs = clients.find((client) => client.id === clientId)?.dogs ?? [];

  function handleClientChange(nextClientId: string) {
    const nextClient = clients.find((client) => client.id === nextClientId);

    setClientId(nextClientId);
    setSelectedDogIds(nextClient?.dogs[0]?.id ? [nextClient.dogs[0].id] : []);
  }

  function handleDogSelection(dogId: string, checked: boolean) {
    setSelectedDogIds((current) => {
      if (checked) return current.includes(dogId) ? current : [...current, dogId];

      return current.filter((id) => id !== dogId);
    });
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#151124]/45 p-4 backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="w-full max-w-2xl rounded-[1.5rem] bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-[#6c38c2]">New booking</p><h2 className="mt-2 font-serif text-3xl">Book a care session</h2></div><button type="button" onClick={onClose} className="rounded-lg border border-[#151124]/10 p-2"><X className="size-5" /></button></div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="text-sm font-bold">Client<select required value={clientId} onChange={(event) => handleClientChange(event.target.value)} className="mt-2 w-full rounded-xl border border-[#151124]/12 px-4 py-3 font-semibold outline-none"><option value="" disabled>Select a client</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select></label>
          <label className="text-sm font-bold">Service<select required value={serviceName} onChange={(event) => setServiceName(event.target.value)} className="mt-2 w-full rounded-xl border border-[#151124]/12 px-4 py-3 font-semibold outline-none">{serviceOptions.map((service) => <option key={service} value={service}>{service}</option>)}</select></label>
          <fieldset className="md:col-span-2 rounded-xl border border-[#151124]/12 px-4 py-3">
            <legend className="px-1 text-sm font-bold">Dogs for selected client</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {clientDogs.map((dog) => (
                <label key={dog.id} className="flex items-center gap-3 rounded-lg bg-[#fbf9fd] px-3 py-2 text-sm font-semibold">
                  <input type="checkbox" checked={selectedDogIds.includes(dog.id)} onChange={(event) => handleDogSelection(dog.id, event.target.checked)} className="size-4 accent-[#4f2c91]" />
                  {dog.name}
                </label>
              ))}
            </div>
            {!clientDogs.length && <p className="mt-2 text-sm text-[#6d667a]">No dogs are linked to this client yet.</p>}
          </fieldset>
          <label className="text-sm font-bold">Starts at<input required type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} className="mt-2 w-full rounded-xl border border-[#151124]/12 px-4 py-3 font-semibold outline-none" /></label>
          <label className="text-sm font-bold">Duration<select value={durationMinutes} onChange={(event) => setDurationMinutes(event.target.value)} className="mt-2 w-full rounded-xl border border-[#151124]/12 px-4 py-3 font-semibold outline-none"><option value="30">30 minutes</option><option value="60">60 minutes</option><option value="90">90 minutes</option><option value="120">2 hours</option><option value="240">Half day</option><option value="480">Full day</option></select></label>
          <label className="text-sm font-bold">Status<select value={status} onChange={(event) => setStatus(event.target.value as BookingStatus)} className="mt-2 w-full rounded-xl border border-[#151124]/12 px-4 py-3 font-semibold outline-none"><option value="confirmed">Confirmed</option><option value="pending_confirmation">Pending confirmation</option><option value="requested">Requested</option><option value="needs_review">Needs review</option></select></label>
          <label className="text-sm font-bold">Location<input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Greystones, County Wicklow" className="mt-2 w-full rounded-xl border border-[#151124]/12 px-4 py-3 font-semibold outline-none" /></label>
          <label className="md:col-span-2 text-sm font-bold">Notes<textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} className="mt-2 w-full rounded-xl border border-[#151124]/12 px-4 py-3 font-semibold outline-none" /></label>
        </div>
        {error && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}
        <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-lg border border-[#151124]/10 px-5 py-3 text-sm font-bold">Cancel</button><button disabled={isSaving || !clientId || selectedDogIds.length === 0} className="rounded-lg bg-[#4f2c91] px-5 py-3 text-sm font-bold text-white disabled:opacity-60">{isSaving ? "Creating…" : "Create booking"}</button></div>
      </form>
    </div>
  );
}

export function BackendBookings({ accessToken }: { accessToken: string }) {
  const [bookings, setBookings] = useState<CalendarBooking[]>([]);
  const [dogs, setDogs] = useState<BookingOptionDog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "all">("all");
  const [openActionId, setOpenActionId] = useState<string | null>(null);
  const [actionMenuPosition, setActionMenuPosition] = useState<{ top: number; left: number } | null>(null);

  const loadBookings = useCallback(async () => {
    try {
      const response = await fetch("/api/bookings?scope=admin", { cache: "no-store", headers: { Authorization: `Bearer ${accessToken}` } });
      if (!response.ok) throw new Error(`Bookings API returned ${response.status}`);
      const payload = (await response.json()) as BookingsApiResponse;
      setBookings(payload.bookings ?? []);
      setDogs(payload.dogs ?? []);
      setError(payload.isFallback ? "Showing placeholder bookings until Supabase data is available." : null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load bookings.");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => { queueMicrotask(() => void loadBookings()); }, [loadBookings]);

  useEffect(() => {
    const config = getSupabaseRealtimeConfig();
    if (!config || !accessToken) return;
    let heartbeat: ReturnType<typeof setInterval> | null = null;
    const socket = new WebSocket(`${config.url.replace(/^http/, "ws")}/realtime/v1/websocket?apikey=${encodeURIComponent(config.key)}&vsn=1.0.0`);
    socket.addEventListener("open", () => {
      socket.send(JSON.stringify({ topic: "realtime:backend-bookings", event: "phx_join", payload: { config: { postgres_changes: ["portal_bookings", "portal_dogs", "portal_clients"].map((table) => ({ event: "*", schema: "public", table })) }, access_token: accessToken }, ref: "1" }));
      heartbeat = setInterval(() => { if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ topic: "phoenix", event: "heartbeat", payload: {}, ref: String(Date.now()) })); }, 25000);
    });
    socket.addEventListener("message", (event) => {
      try { if ((JSON.parse(event.data as string) as { event?: string }).event === "postgres_changes") void loadBookings(); } catch {}
    });
    return () => { if (heartbeat) clearInterval(heartbeat); if (socket.readyState === WebSocket.OPEN) socket.close(); };
  }, [accessToken, loadBookings]);

  const filteredBookings = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return bookings.filter((booking) => {
      const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
      const matchesSearch = !needle || [booking.clientName, booking.dogName, booking.serviceName, booking.location, booking.status].some((value) => value?.toLowerCase().includes(needle));
      return matchesStatus && matchesSearch;
    });
  }, [bookings, query, statusFilter]);

  async function updateBookingStatus(booking: CalendarBooking, status: BookingStatus) {
    const nextStart = status === "reschedule_requested" ? new Date(new Date(booking.startsAt).getTime() + 24 * 60 * 60 * 1000).toISOString() : booking.startsAt;
    const nextEnd = status === "reschedule_requested" ? new Date(new Date(booking.endsAt).getTime() + 24 * 60 * 60 * 1000).toISOString() : booking.endsAt;
    setBookings((rows) => rows.map((row) => row.id === booking.id ? { ...row, status, startsAt: nextStart, endsAt: nextEnd } : row));
    setOpenActionId(null);
    await fetch(`/api/bookings/${booking.id}`, { method: "PATCH", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ status, startsAt: nextStart, endsAt: nextEnd }) });
    await loadBookings();
  }

  async function deleteBooking(id: string) {
    setBookings((rows) => rows.filter((row) => row.id !== id));
    setOpenActionId(null);
    await fetch(`/api/bookings/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${accessToken}` } });
    await loadBookings();
  }
  const stats = [
    { label: "Total Bookings", value: bookings.length, detail: "Live rows", icon: CalendarDays },
    { label: "Pending", value: bookings.filter((booking) => ["requested", "pending_confirmation", "needs_review"].includes(booking.status)).length, detail: "Need attention", icon: Clock3 },
    { label: "Confirmed", value: bookings.filter((booking) => booking.status === "confirmed").length, detail: "Ready to go", icon: CheckCircle2 },
    { label: "Cancelled", value: bookings.filter((booking) => booking.status === "cancelled").length, detail: "Cancelled", icon: XCircle },
  ];

  return (
    <div className="p-5 md:p-10">
      {showModal && <NewBookingModal accessToken={accessToken} dogs={dogs} onClose={() => setShowModal(false)} onCreated={loadBookings} />}
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center"><div><h1 className="font-serif text-3xl">Bookings <PawPrint className="inline size-6 text-[#6c38c2]" /></h1><p className="mt-1 text-sm text-[#6d667a]">View, create, and manage live Supabase bookings.</p></div><button onClick={() => setShowModal(true)} className="rounded-lg bg-[#4f2c91] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#4f2c91]/25"><Plus className="mr-2 inline size-4" />New Booking</button></div>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">{stats.map(({ label, value, detail, icon: Icon }) => <Card key={label} className="p-6"><div className="flex items-center gap-6"><span className="grid size-14 place-items-center rounded-full bg-[#f0e9fb] text-[#5b2aa0]"><Icon className="size-7" /></span><div><p className="text-sm text-[#6d667a]">{label}</p><p className="mt-1 font-serif text-3xl">{value}</p><p className="mt-2 text-sm text-[#6d667a]">{detail}</p></div></div></Card>)}</div>
      <Card className="mt-6 overflow-hidden"><div className="flex flex-col gap-4 border-b border-[#151124]/10 p-5 lg:flex-row lg:items-center lg:justify-between"><label className="flex min-w-0 flex-1 items-center gap-3 rounded-lg border border-[#151124]/10 px-4 py-3 text-sm text-[#858093] lg:max-w-md"><Search className="size-5" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent outline-none" placeholder="Search by client, dog name, or service..." /></label><div className="flex flex-wrap gap-3"><label className="relative"><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as BookingStatus | "all")} className="appearance-none rounded-lg border border-[#151124]/10 bg-white px-5 py-3 pr-10 text-sm"><option value="all">All Status</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2" /></label><button onClick={() => { setQuery(""); setStatusFilter("all"); }} className="rounded-lg border border-[#151124]/10 px-5 py-3 text-sm"><Filter className="mr-2 inline size-4" />Reset filters</button></div></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[980px] text-left text-sm"><thead className="bg-[#fbf9fd] text-xs font-semibold text-[#4f2c91]"><tr>{["Booking ↕", "Client & Dog", "Service", "Date & Time", "Duration", "Status", "Amount", ""].map((h)=><th key={h} className="px-7 py-4">{h}</th>)}</tr></thead><tbody className="divide-y divide-[#151124]/10">{filteredBookings.map((booking) => <tr key={booking.id} className="bg-white align-middle"><td className="px-7 py-4"><p className="font-semibold">#{booking.id.slice(0, 8)}</p><p className="mt-1 text-[#6d667a]">{booking.source}</p></td><td className="px-7 py-4"><div className="flex items-center gap-4"><Image src={booking.coverImageUrl || fallbackImage} alt={`${booking.dogName} profile`} width={42} height={42} className="size-11 rounded-full object-cover" /><div><p className="font-semibold">{booking.clientName}</p><p className="mt-1 text-[#6d667a]">{booking.dogName}</p></div></div></td><td className="px-7 py-4"><div className="flex items-center gap-4"><span className="text-[#5b2aa0]">{booking.serviceName.toLowerCase().includes("training") ? <GraduationCap className="size-5" /> : <PawPrint className="size-5" />}</span><div><p className="font-semibold">{booking.serviceName}</p><p className="mt-1 text-[#6d667a]">{booking.location}</p></div></div></td><td className="px-7 py-4"><p>{formatBookingDate(booking.startsAt, { day: "numeric", month: "short", year: "numeric" })}</p><p className="mt-1 text-[#4f4863]">{formatBookingTime(booking.startsAt)}</p></td><td className="px-7 py-4">{getDurationMinutes(booking)} min</td><td className="px-7 py-4"><span className={`rounded-md px-3 py-1 text-xs font-medium ${getStatusClass(booking.status)}`}>{statusLabels[booking.status]}</span></td><td className="px-7 py-4 text-[#6d667a]">—</td><td className="px-7 py-4"><button aria-label={`Actions for ${booking.id}`} onClick={(event) => { event.stopPropagation(); const rect = event.currentTarget.getBoundingClientRect(); setActionMenuPosition({ top: Math.max(12, Math.min(rect.bottom + 8, window.innerHeight - 184)), left: Math.max(12, Math.min(rect.right - 176, window.innerWidth - 188)) }); setOpenActionId((current) => current === booking.id ? null : booking.id); }} className="rounded-lg border border-[#151124]/10 p-2 text-[#4f4863]"><MoreVertical className="size-5" /></button>{openActionId === booking.id && actionMenuPosition && <div style={{ top: actionMenuPosition.top, left: actionMenuPosition.left }} className="fixed z-50 w-44 rounded-xl border border-[#151124]/10 bg-white p-2 shadow-2xl"><button onClick={(event) => { event.stopPropagation(); updateBookingStatus(booking, "cancelled"); }} className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-[#fbf9fd]">Cancel</button><button onClick={(event) => { event.stopPropagation(); updateBookingStatus(booking, "reschedule_requested"); }} className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-[#fbf9fd]">Reschedule +1 day</button><button onClick={(event) => { event.stopPropagation(); updateBookingStatus(booking, "confirmed"); }} className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-[#fbf9fd]">Approve</button><button onClick={(event) => { event.stopPropagation(); deleteBooking(booking.id); }} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50">Delete</button></div>}</td></tr>)}</tbody></table></div>
        <div className="flex flex-col gap-4 border-t border-[#151124]/10 p-5 text-sm text-[#6d667a] sm:flex-row sm:items-center sm:justify-between"><p>{isLoading ? "Loading live bookings…" : `Showing ${filteredBookings.length} of ${bookings.length} bookings`}{error ? ` · ${error}` : ""}</p><p>Realtime enabled for Supabase booking changes.</p></div>
      </Card>
    </div>
  );
}