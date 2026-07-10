"use client";

import { Bone, CalendarDays, Clock3, Download, Eye, PawPrint, ReceiptText, RefreshCw, Users } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Card } from "./card";

type Overview = {
  stats: { bookings: { value: number; trend: string }; clients: { value: number; trend: string }; dogs: { value: number; trend: string }; revenue: { value: string; trend: string } };
  pageTracker: Array<{ path: string; title: string; activeVisitors: number; views24h: number; lastSeenAt: string | null }>;
  topServices: Array<[string, number]>;
  revenueByService: Array<[string, number]>;
  upcomingBookings: Array<{ id: string; dog: string; service: string; length: string; time: string | null; status: string; image: string | null }>;
};

const emptyOverview: Overview = { stats: { bookings: { value: 0, trend: "0%" }, clients: { value: 0, trend: "live" }, dogs: { value: 0, trend: "live" }, revenue: { value: "€0.00", trend: "0%" } }, pageTracker: [], topServices: [], revenueByService: [], upcomingBookings: [] };

function formatDate(value: string | null) {
  if (!value) return "No date yet";
  return new Intl.DateTimeFormat("en-IE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function formatRelative(value: string | null) {
  if (!value) return "No heartbeat yet";
  const seconds = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.round(minutes / 60)}h ago`;
}

function formatCents(cents: number) {
  return new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" }).format(cents / 100);
}

export function BackendDashboardOverview({ accessToken }: { accessToken: string }) {
  const [overview, setOverview] = useState<Overview>(emptyOverview);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOverview = useCallback(async () => {
    try {
      const response = await fetch("/api/dashboard/overview", { cache: "no-store", headers: { Authorization: `Bearer ${accessToken}` } });
      if (!response.ok) throw new Error(`Dashboard API returned ${response.status}`);
      setOverview((await response.json()) as Overview);
      setError(null);
    } catch (overviewError) {
      setError(overviewError instanceof Error ? overviewError.message : "Unable to load dashboard overview.");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    queueMicrotask(() => void loadOverview());
    const interval = window.setInterval(() => void loadOverview(), 5000);
    return () => window.clearInterval(interval);
  }, [loadOverview]);

  const statCards = useMemo(() => [
    { label: "Total Bookings", value: String(overview.stats.bookings.value), trend: overview.stats.bookings.trend, icon: CalendarDays, note: "from last week" },
    { label: "Total Clients", value: String(overview.stats.clients.value), trend: overview.stats.clients.trend, icon: Users, note: "from Supabase" },
    { label: "Total Dogs", value: String(overview.stats.dogs.value), trend: overview.stats.dogs.trend, icon: PawPrint, note: "from Supabase" },
    { label: "Revolut Revenue", value: overview.stats.revenue.value, trend: overview.stats.revenue.trend, icon: ReceiptText, note: "paid invoices this week" },
  ], [overview]);

  const maxViews = Math.max(1, ...overview.pageTracker.map((page) => page.views24h));
  const totalActiveVisitors = overview.pageTracker.reduce((sum, page) => sum + page.activeVisitors, 0);
  const totalViews = overview.pageTracker.reduce((sum, page) => sum + page.views24h, 0);
  const revenueTotal = overview.revenueByService.reduce((sum, [, cents]) => sum + cents, 0);

  return (
    <div className="p-5 md:p-10">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div><h1 className="font-serif text-3xl">Dashboard <PawPrint className="inline size-6 text-[#6c38c2]" /></h1><p className="mt-1 text-sm text-[#6d667a]">Live business data from Supabase, page activity, and Revolut-paid invoices.</p></div>
        <div className="flex flex-wrap gap-4"><button onClick={() => void loadOverview()} className="rounded-lg border border-[#151124]/10 bg-white px-6 py-3 text-sm font-medium shadow-sm"><RefreshCw className="mr-3 inline size-4" />Refresh</button><button className="rounded-lg border border-[#151124]/10 bg-white px-6 py-3 text-sm font-semibold shadow-sm"><Download className="mr-3 inline size-4 text-[#5b2aa0]" />Export</button></div>
      </div>
      {error && <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}
      {isLoading && <div className="mt-5 rounded-xl border border-[#151124]/10 bg-white p-4 text-sm text-[#6d667a]">Loading live overview…</div>}

      <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">{statCards.map(({ label, value, trend, icon: Icon, note }) => <Card key={label} className="p-5"><div className="flex items-center gap-5"><span className="grid size-14 place-items-center rounded-full bg-[#f0e9fb] text-[#5b2aa0]"><Icon className="size-7" /></span><div><p className="text-sm text-[#6d667a]">{label}</p><p className="mt-1 font-serif text-3xl">{value}</p></div></div><p className="mt-3 text-sm text-[#6d667a]"><span className="text-emerald-600">{trend}</span> {note}</p></Card>)}</div>
          <Card className="p-6"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h2 className="font-serif text-xl">Live Page Tracker</h2><p className="mt-1 text-sm text-[#6d667a]">Replaces bookings overview with currently active website pages.</p></div><span className="rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-700"><Eye className="mr-2 inline size-4" />{totalActiveVisitors} active · {totalViews} views today</span></div><div className="mt-6 space-y-4">{overview.pageTracker.length ? overview.pageTracker.map((page) => <div key={page.path} className="grid gap-2 rounded-2xl border border-[#151124]/10 p-4 sm:grid-cols-[1fr_auto] sm:items-center"><div><p className="font-semibold">{page.title}</p><p className="mt-1 text-sm text-[#6d667a]">{page.path} · last seen {formatRelative(page.lastSeenAt)}</p><div className="mt-3 h-2 rounded-full bg-[#eeeaf3]"><div className="h-full rounded-full bg-[#5630a2]" style={{ width: `${Math.max(6, (page.views24h / maxViews) * 100)}%` }} /></div></div><div className="text-right text-sm text-[#6d667a]"><p className="font-serif text-2xl text-[#151124]">{page.activeVisitors}</p><p>active now</p><p className="mt-1">{page.views24h} views / 24h</p></div></div>) : <p className="rounded-2xl bg-[#fbf9fd] p-5 text-sm text-[#6d667a]">No page activity yet. Visit the public website after deploying the tracking table migration.</p>}</div></Card>

          <div className="grid gap-5 lg:grid-cols-[1fr_1.05fr]"><Card className="p-6"><h2 className="font-serif text-xl">Top Services</h2><div className="mt-6 space-y-5">{overview.topServices.length ? overview.topServices.map(([name, count]) => <div key={name} className="grid grid-cols-[2.5rem_1fr_4rem] items-center gap-3"><span className="grid size-10 place-items-center rounded-full bg-[#f0e9fb] text-[#5b2aa0]"><Bone className="size-4"/></span><div><p className="font-medium">{name}</p><p className="text-sm text-[#6d667a]">{count} bookings this week</p></div><div className="text-right text-sm text-[#6d667a]">{count}</div></div>) : <p className="text-sm text-[#6d667a]">No bookings this week yet.</p>}</div></Card><Card className="p-6"><h2 className="font-serif text-xl">Revenue from Revolut</h2><p className="mt-5 font-serif text-3xl">{overview.stats.revenue.value} <span className="text-sm font-sans text-emerald-600">{overview.stats.revenue.trend} from last week</span></p><div className="mt-6 space-y-4 text-sm">{overview.revenueByService.length ? overview.revenueByService.map(([name, cents], i) => <p key={name} className="flex justify-between gap-4 text-[#6d667a]"><span><span className={`mr-3 inline-block size-3 rounded-full ${["bg-[#4b2393]","bg-[#8f70d6]","bg-[#b9a2ee]","bg-[#ded2f8]"][i]}`}/>{name}</span><span>{formatCents(cents)} ({revenueTotal ? Math.round((cents / revenueTotal) * 100) : 0}%)</span></p>) : <p className="text-[#6d667a]">No paid Revolut invoices yet.</p>}</div></Card></div>
        </div>
        <aside className="space-y-5"><Card className="p-5"><h2 className="font-serif text-xl">Upcoming Bookings</h2><div className="mt-5 space-y-5">{overview.upcomingBookings.length ? overview.upcomingBookings.map((booking) => <div key={booking.id} className="grid grid-cols-[3rem_1fr_auto] gap-3"><Image src={booking.image || "/images/placeholder.jpg"} alt={booking.dog} width={48} height={48} className="size-12 rounded-full object-cover"/><div><p className="font-semibold">{booking.dog}</p><p className="text-sm text-[#6d667a]">{booking.service} · {booking.length}</p><p className="mt-1 text-xs text-[#6d667a]"><Clock3 className="mr-1 inline size-3" />{formatDate(booking.time)}</p></div><span className="h-fit rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">{booking.status}</span></div>) : <p className="text-sm text-[#6d667a]">No upcoming bookings.</p>}</div></Card><Card className="p-5"><h2 className="font-serif text-xl">Data Sources</h2><div className="mt-5 space-y-4 text-sm text-[#6d667a]"><p>Clients, dogs, services, bookings, and invoices are read from Supabase.</p><p>Revenue only counts paid invoices linked to Revolut transaction IDs.</p><p>Page tracker rows refresh every 5 seconds and your logged-in backend browser is ignored.</p></div></Card></aside>
      </div>
    </div>
  );
}