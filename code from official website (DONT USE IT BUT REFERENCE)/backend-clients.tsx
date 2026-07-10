"use client";

import {
  CalendarDays,
  ChevronDown,
  Edit3,
  Filter,
  Mail,
  MapPin,
  MoreVertical,
  PawPrint,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  StickyNote,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Card } from "./card";

const clientStats = [
  ["total", "Total Clients", Users, "bg-[#f0e9fb] text-[#5b2aa0]"],
  ["new", "New Clients", UserPlus, "bg-green-100 text-green-700"],
  ["active", "Active Clients", ShieldCheck, "bg-orange-100 text-orange-600"],
  ["returning", "Live Rows", RefreshCw, "bg-[#f0e9fb] text-[#5b2aa0]"],
] as const;

type BackendClient = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  dogs: string;
  dogNames: string;
  bookings: number;
  spent: string;
  joinedDate: string | null;
  lastBookingDate: string | null;
  service: string;
  status: string;
  notes: string;
  image: string | null;
};

function isSupabaseStorageUrl(src: string | null | undefined) {
  return Boolean(src?.includes("/storage/v1/object/"));
}

const fallbackClients: BackendClient[] = [];

type ClientsApiResponse = {
  clients?: BackendClient[];
  isFallback?: boolean;
};

function getSupabaseRealtimeConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return url && key ? { url, key } : null;
}

function formatDisplayDate(value: string | null) {
  if (!value) return "No date yet";

  return new Intl.DateTimeFormat("en-IE", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

function SupabaseAvatar({ alt, className, height, src, width }: { alt: string; className: string; height: number; src: string | null; width: number }) {
  return src?.trim() ? <Image src={src} alt={alt} width={width} height={height} unoptimized={isSupabaseStorageUrl(src)} className={className} /> : <span aria-label={`${alt} has no Supabase image`} className={`${className} grid place-items-center bg-[#f0e8f8] text-[#5b2aa0]`}><PawPrint className="size-5" /></span>;
}

export function BackendClients({ accessToken }: { accessToken: string }) {
  const [clientRows, setClientRows] = useState<BackendClient[]>(fallbackClients);
  const [selectedClientId, setSelectedClientId] = useState(fallbackClients[0]?.id ?? "");
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [clientError, setClientError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [clientTypeFilter, setClientTypeFilter] = useState("all");
  const [activeTab, setActiveTab] = useState<"Overview" | "Dogs" | "Bookings" | "Notes">("Overview");
  const [isEditingClient, setIsEditingClient] = useState(false);
  const [openActionId, setOpenActionId] = useState<string | null>(null);
  const [actionMenuPosition, setActionMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClient, setNewClient] = useState({ name: "", email: "", phone: "", address: "" });
  const [isSavingClient, setIsSavingClient] = useState(false);

  const loadClients = useCallback(async () => {
    try {
      const response = await fetch("/api/clients", { cache: "no-store", headers: { Authorization: `Bearer ${accessToken}` } });
      if (!response.ok) throw new Error(`Clients API returned ${response.status}`);
      const payload = (await response.json()) as ClientsApiResponse;
      const nextClients = payload.clients ?? [];
      setClientRows(nextClients);
      setSelectedClientId((current) => nextClients.some((client) => client.id === current) ? current : nextClients[0]?.id ?? "");
      setClientError(payload.isFallback ? "Supabase returned fallback mode, but placeholder clients are disabled." : null);
    } catch (error) {
      setClientError(error instanceof Error ? error.message : "Unable to load clients.");
    } finally {
      setIsLoadingClients(false);
    }
  }, [accessToken]);

  useEffect(() => {
    queueMicrotask(() => void loadClients());
  }, [loadClients]);

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

      socket.send(JSON.stringify({ topic: "realtime:backend-clients", event: "phx_join", payload: { config: { postgres_changes: ["portal_clients", "portal_dogs", "portal_bookings", "portal_client_activity"].map((table) => ({ event: "*", schema: "public", table })) }, access_token: accessToken }, ref: "1" }));
      heartbeat = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ topic: "phoenix", event: "heartbeat", payload: {}, ref: String(Date.now()) }));
        }
      }, 25000);
    });
    socket.addEventListener("message", (event) => {
      try {
        const message = JSON.parse(event.data as string) as { event?: string };
        if (message.event === "postgres_changes") void loadClients();
      } catch {
        // Ignore non-JSON realtime frames.
      }
    });

    return () => {
      isActive = false;
      if (heartbeat) clearInterval(heartbeat);
      if (socket.readyState === WebSocket.OPEN) socket.close();
    };
  }, [accessToken, loadClients]);

  const filteredClients = useMemo(() => clientRows.filter((client) => {
    const needle = query.trim().toLowerCase();
    const matchesSearch = !needle || [client.name, client.email, client.phone, client.dogNames].some((value) => value.toLowerCase().includes(needle));
    const matchesStatus = statusFilter === "all" || client.status.toLowerCase() === statusFilter;
    const matchesType = clientTypeFilter === "all" || (clientTypeFilter === "returning" ? client.bookings > 1 : clientTypeFilter === "new" ? Boolean(client.joinedDate && new Date(client.joinedDate).getMonth() === new Date().getMonth()) : true);
    return matchesSearch && matchesStatus && matchesType;
  }), [clientRows, clientTypeFilter, query, statusFilter]);
  const selectedClient = useMemo(() => clientRows.find((client) => client.id === selectedClientId) ?? clientRows[0] ?? null, [clientRows, selectedClientId]);
  async function saveClientUpdates(clientId: string, updates: Partial<Pick<BackendClient, "name" | "email" | "phone" | "address" | "status">>) {
    setClientRows((rows) => rows.map((client) => client.id === clientId ? { ...client, ...updates } : client));
    const response = await fetch("/api/clients", { method: "PATCH", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ id: clientId, ...updates }) });
    if (!response.ok) {
      setClientError("Supabase did not save the client update. Please retry.");
      return;
    }
    await loadClients();
  }

  function updateClientStatus(client: BackendClient, status: string) { setOpenActionId(null); setActionMenuPosition(null); void saveClientUpdates(client.id, { status }); }

  async function createClient(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSavingClient(true);
    const response = await fetch("/api/clients", { method: "POST", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify(newClient) });
    setIsSavingClient(false);
    if (!response.ok) { setClientError("Supabase did not create the client. Please check the details and retry."); return; }
    setNewClient({ name: "", email: "", phone: "", address: "" });
    setShowNewClient(false);
    await loadClients();
  }
  const activeClients = clientRows.filter((client) => client.status === "Active").length;
  const returningClients = clientRows.filter((client) => client.bookings > 1).length;
  const newClients = clientRows.filter((client) => client.joinedDate && new Date(client.joinedDate).getMonth() === new Date().getMonth() && new Date(client.joinedDate).getFullYear() === new Date().getFullYear()).length;
  const stats = {
    total: { value: String(clientRows.length), caption: "Synced from Supabase" },
    new: { value: String(newClients), caption: "Joined this month" },
    active: { value: String(activeClients), caption: "With active bookings" },
    returning: { value: String(returningClients), caption: "Clients with 2+ bookings" },
  };

  return (
    <div className="p-5 md:p-10">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div><h1 className="font-serif text-3xl">Clients <PawPrint className="inline size-6 text-[#6c38c2]" /></h1><p className="mt-1 text-sm text-[#6d667a]">Manage your clients and their furry friends.</p></div>
        <button onClick={() => setShowNewClient(true)} className="rounded-lg bg-[#4f2c91] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#4f2c91]/25"><Plus className="mr-2 inline size-4" />Add New Client</button>
      </div>

      {showNewClient && <div className="fixed inset-0 z-50 grid place-items-center bg-[#151124]/45 p-4 backdrop-blur-sm"><form onSubmit={createClient} className="w-full max-w-xl rounded-[1.5rem] bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-[#6c38c2]">New client</p><h2 className="mt-2 font-serif text-3xl">Save client to Supabase</h2></div><button type="button" onClick={() => setShowNewClient(false)} className="rounded-lg border border-[#151124]/10 p-2"><X className="size-5" /></button></div><div className="mt-6 grid gap-3"><input required value={newClient.name} onChange={(e) => setNewClient((v) => ({ ...v, name: e.target.value }))} placeholder="Full name" className="rounded-lg border px-3 py-2" /><input required type="email" value={newClient.email} onChange={(e) => setNewClient((v) => ({ ...v, email: e.target.value }))} placeholder="Email" className="rounded-lg border px-3 py-2" /><input value={newClient.phone} onChange={(e) => setNewClient((v) => ({ ...v, phone: e.target.value }))} placeholder="Phone" className="rounded-lg border px-3 py-2" /><input value={newClient.address} onChange={(e) => setNewClient((v) => ({ ...v, address: e.target.value }))} placeholder="Address" className="rounded-lg border px-3 py-2" /></div><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setShowNewClient(false)} className="rounded-lg border px-5 py-3 text-sm font-bold">Cancel</button><button disabled={isSavingClient} className="rounded-lg bg-[#4f2c91] px-5 py-3 text-sm font-bold text-white disabled:opacity-60">{isSavingClient ? "Saving…" : "Save to Supabase"}</button></div></form></div>}

      <div className="mt-8 grid gap-5 sm:grid-cols-2 2xl:grid-cols-4">
        {clientStats.map(([key, label, Icon, tone]) => (
          <Card key={label} className="p-6"><div className="flex items-center gap-6"><span className={`grid size-14 place-items-center rounded-full ${tone}`}><Icon className="size-7" /></span><div><p className="text-sm text-[#6d667a]">{label}</p><p className="mt-1 font-serif text-3xl">{stats[key].value}</p><p className="mt-2 text-sm text-[#6d667a]">{stats[key].caption}</p></div></div></Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 2xl:grid-cols-[minmax(0,1fr)_23rem]">
        <Card className="overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-[#151124]/10 p-5 lg:flex-row lg:items-center lg:justify-between">
            <label className="flex min-w-0 flex-1 items-center gap-3 rounded-lg border border-[#151124]/10 px-4 py-3 text-sm text-[#858093] lg:max-w-md"><Search className="size-5" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent outline-none" placeholder="Search clients by name, email, or phone..." /></label>
            <div className="flex flex-wrap gap-3"><label className="relative"><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="appearance-none rounded-lg border border-[#151124]/10 bg-white px-5 py-3 pr-10 text-sm"><option value="all">All Statuses</option><option value="active">Active</option><option value="confirmed">Confirmed</option><option value="inactive">Inactive</option></select><ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2" /></label><label className="relative"><select value={clientTypeFilter} onChange={(event) => setClientTypeFilter(event.target.value)} className="appearance-none rounded-lg border border-[#151124]/10 bg-white px-5 py-3 pr-10 text-sm"><option value="all">All Clients</option><option value="new">New clients</option><option value="returning">Returning clients</option></select><ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2" /></label><button onClick={() => { setQuery(""); setStatusFilter("all"); setClientTypeFilter("all"); }} className="rounded-lg border border-[#151124]/10 px-5 py-3 text-sm"><Filter className="mr-2 inline size-4" />Reset</button></div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="bg-[#fbf9fd] text-xs font-semibold text-[#4f2c91]"><tr>{["Client ↑", "Contact", "Dogs", "Bookings", "Total Spent", "Last Booking", "Status", ""].map((heading) => <th key={heading} className="px-6 py-4">{heading}</th>)}</tr></thead>
              <tbody className="divide-y divide-[#151124]/10">
                {filteredClients.map((client) => (
                  <tr key={client.id} onClick={() => setSelectedClientId(client.id)} className={`cursor-pointer align-middle transition ${selectedClient?.id === client.id ? "bg-[#f6f0ff]" : "bg-white hover:bg-[#fbf9fd]"}`}>
                    <td className="px-6 py-4"><div className="flex items-center gap-4"><SupabaseAvatar src={client.image} alt={`${client.name} avatar`} width={42} height={42} className="size-11 rounded-full object-cover" /><p className="font-semibold">{client.name}</p></div></td>
                    <td className="px-6 py-4 text-[#4f4863]"><p>{client.email}</p><p className="mt-1">{client.phone}</p></td>
                    <td className="px-6 py-4"><span className="inline-flex items-center gap-2"><PawPrint className="size-4 text-[#6c38c2]" />{client.dogs}</span></td>
                    <td className="px-6 py-4">{client.bookings}</td>
                    <td className="px-6 py-4">{client.spent}</td>
                    <td className="px-6 py-4"><p>{formatDisplayDate(client.lastBookingDate)}</p><p className="mt-1 text-[#6d667a]">{client.service}</p></td>
                    <td className="px-6 py-4"><span className={`rounded-md px-3 py-1 text-xs font-medium ${client.status === "Active" ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-600"}`}>{client.status}</span></td>
                    <td className="px-6 py-4"><button aria-label={`Actions for ${client.name}`} onClick={(event) => { event.stopPropagation(); const rect = event.currentTarget.getBoundingClientRect(); setActionMenuPosition({ top: Math.max(12, Math.min(rect.bottom + 8, window.innerHeight - 148)), left: Math.max(12, Math.min(rect.right - 176, window.innerWidth - 188)) }); setOpenActionId((current) => current === client.id ? null : client.id); }} className="rounded-lg border border-[#151124]/10 p-2 text-[#4f4863]"><MoreVertical className="size-5" /></button>{openActionId === client.id && actionMenuPosition && <div style={{ top: actionMenuPosition.top, left: actionMenuPosition.left }} className="fixed z-50 w-44 rounded-xl border border-[#151124]/10 bg-white p-2 shadow-2xl"><button onClick={(event) => { event.stopPropagation(); updateClientStatus(client, "Active"); }} className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-[#fbf9fd]">Set active</button><button onClick={(event) => { event.stopPropagation(); updateClientStatus(client, "Confirmed"); }} className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-[#fbf9fd]">Set confirmed</button><button onClick={(event) => { event.stopPropagation(); updateClientStatus(client, "Inactive"); }} className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-[#fbf9fd]">Set inactive</button></div>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-4 border-t border-[#151124]/10 p-5 text-sm text-[#6d667a] sm:flex-row sm:items-center sm:justify-between">
            <p>{isLoadingClients ? "Loading live clients…" : `Showing ${filteredClients.length ? 1 : 0} to ${filteredClients.length} of ${clientRows.length} clients`}{clientError ? ` · ${clientError}` : ""}</p>{clientRows.length >= 10 && <div className="flex gap-2">{["←", "1", "2", "3", "...", "6", "→"].map((page) => <button key={page} className={`grid size-9 place-items-center rounded-md border border-[#151124]/10 ${page === "1" ? "border-[#5b2aa0] text-[#5b2aa0]" : "text-[#4f4863]"}`}>{page}</button>)}</div>}
          </div>
        </Card>

        <aside className="space-y-5">
          {selectedClient ? (
            <>
              <Card className="overflow-hidden">
                <div className="flex items-start gap-4 p-5"><SupabaseAvatar src={selectedClient.image} alt={`${selectedClient.name} profile`} width={64} height={64} className="size-16 rounded-full object-cover" /><div className="min-w-0 flex-1"><h2 className="font-serif text-xl">{selectedClient.name}</h2><span className="mt-2 inline-block rounded-md bg-green-100 px-3 py-1 text-xs font-medium text-green-700">{selectedClient.status} Client</span><p className="mt-3 text-sm text-[#6d667a]">{selectedClient.email}</p><p className="mt-1 text-sm text-[#6d667a]">{selectedClient.phone}</p></div><button aria-label="Close client details"><X className="size-5 text-[#3c246c]" /></button></div>
                <div className="grid grid-cols-4 border-y border-[#151124]/10 text-center text-xs font-semibold text-[#4f4863]">{(["Overview", "Dogs", "Bookings", "Notes"] as const).map((tab) => <button key={tab} onClick={() => setActiveTab(tab)} className={`${activeTab === tab ? "border-b-2 border-[#5b2aa0] text-[#5b2aa0]" : ""} py-3`}>{tab}</button>)}</div>
                <div className="space-y-6 p-5 text-sm"><div className="flex items-center justify-between"><h3 className="font-semibold">Client Information</h3><button onClick={() => setIsEditingClient((value) => !value)} className="font-semibold text-[#5b2aa0]"><Edit3 className="mr-1 inline size-4" />Edit</button></div>{isEditingClient ? <div className="grid gap-3"><input defaultValue={selectedClient.name} onBlur={(event) => void saveClientUpdates(selectedClient.id, { name: event.target.value })} className="rounded-lg border px-3 py-2" /><input defaultValue={selectedClient.email} onBlur={(event) => void saveClientUpdates(selectedClient.id, { email: event.target.value })} className="rounded-lg border px-3 py-2" /><input defaultValue={selectedClient.phone} onBlur={(event) => void saveClientUpdates(selectedClient.id, { phone: event.target.value })} className="rounded-lg border px-3 py-2" /></div> : activeTab === "Overview" ? <><InfoRow icon={MapPin} label="Address" value={selectedClient.address} /><InfoRow icon={CalendarDays} label="Joined" value={formatDisplayDate(selectedClient.joinedDate)} /><InfoRow icon={Mail} label="Preferred Contact" value="Email" /></> : activeTab === "Dogs" ? <InfoRow icon={PawPrint} label="Dogs" value={selectedClient.dogNames} /> : activeTab === "Bookings" ? <><InfoRow icon={CalendarDays} label="Bookings" value={String(selectedClient.bookings)} /><InfoRow icon={CalendarDays} label="Last Booking" value={`${formatDisplayDate(selectedClient.lastBookingDate)}\n${selectedClient.service}`} /></> : <InfoRow icon={StickyNote} label="Notes" value={selectedClient.notes} />}</div>
              </Card>
              <Card className="p-5"><h3 className="font-semibold">Summary</h3><div className="mt-5 space-y-5 text-sm"><InfoRow icon={CalendarDays} label="Total Bookings" value={String(selectedClient.bookings)} /><InfoRow icon={RefreshCw} label="Total Spent" value={selectedClient.spent} /><InfoRow icon={CalendarDays} label="Last Booking" value={`${formatDisplayDate(selectedClient.lastBookingDate)}\n${selectedClient.service}`} /></div></Card>
            </>
          ) : (
            <Card className="grid min-h-80 place-items-center p-8 text-center text-sm text-[#6d667a]">No live clients found in Supabase yet.</Card>
          )}
        </aside>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return <div className="flex gap-4"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#f0e9fb] text-[#5b2aa0]"><Icon className="size-4" /></span><div><p className="text-[#858093]">{label}</p>{value.split("\n").map((line) => <p key={line} className="mt-1 text-[#2c2542]">{line}</p>)}</div></div>;
}