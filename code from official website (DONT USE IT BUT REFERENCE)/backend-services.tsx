"use client";

import {
  CheckCircle2,
  ChevronDown,
  Clock3,
  Filter,
  GraduationCap,
  Heart,
  Home,
  MoreVertical,
  Package,
  PawPrint,
  Plus,
  Search,
  Sparkles,
  Tag,
  Users,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useMemo, useState } from "react";

import { useSupabaseLiveQuery } from "@/components/portal/use-supabase-live-query";
import { Card } from "./card";

type BackendService = {
  id: string;
  name: string;
  description: string;
  category: string;
  duration: string;
  price: string;
  bookingsThisMonth: number;
  totalBookings: number;
  status: "Active" | "Draft";
  planCount: number;
  planNames: string[];
};

type ServicesResponse = {
  services: BackendService[];
  isFallback: boolean;
};

const categoryStyles: Record<string, string> = {
  Walks: "bg-[#eee7fb] text-[#5b2aa0]",
  Training: "bg-emerald-100 text-emerald-700",
  Care: "bg-orange-100 text-orange-600",
  Custom: "bg-sky-100 text-sky-700",
};

const categoryIcons = {
  Walks: PawPrint,
  Training: GraduationCap,
  Care: Heart,
  Custom: Sparkles,
} as const;

function getServiceIcon(service: BackendService) {
  const value = `${service.name} ${service.category}`.toLowerCase();
  if (value.includes("train")) return GraduationCap;
  if (value.includes("group")) return Users;
  if (value.includes("home") || value.includes("overnight") || value.includes("daytime")) return Home;
  if (value.includes("custom")) return Sparkles;
  return PawPrint;
}

function getCategoryStyle(category: string) {
  return categoryStyles[category] ?? "bg-[#f0e9fb] text-[#5b2aa0]";
}

function formatPercent(part: number, total: number) {
  if (!total) return "0%";
  return `${Math.round((part / total) * 100)}%`;
}

export function BackendServices({ accessToken }: { accessToken?: string }) {
  const [isFallback, setIsFallback] = useState(true);
  const fallback = useMemo<BackendService[]>(() => [], []);
  const realtimeTables = useMemo(() => ["portal_bookings"], []);
  const noopMap = useCallback(() => [], []);
  const loadServices = useCallback(async () => {
    const response = await fetch("/api/services", { cache: "no-store" });
    const payload = (await response.json()) as ServicesResponse;
    setIsFallback(payload.isFallback);
    return payload.services;
  }, []);
  const { data: services, isLoading, error } = useSupabaseLiveQuery({
    accessToken,
    fallback,
    path: "/api/services",
    realtimeTables,
    map: noopMap,
    load: loadServices,
  });

  const totalBookings = services.reduce((sum, service) => sum + service.bookingsThisMonth, 0);
  const activeServices = services.filter((service) => service.status === "Active").length;
  const popularService = services.reduce<BackendService | null>((winner, service) => !winner || service.bookingsThisMonth > winner.bookingsThisMonth ? service : winner, null);
  const categories = Array.from(services.reduce((map, service) => map.set(service.category, (map.get(service.category) ?? 0) + 1), new Map<string, number>()).entries());
  const averageDuration = services.length ? `${Math.round(services.reduce((sum, service) => sum + (Number.parseInt(service.duration, 10) || 0), 0) / services.length)} min` : "—";
  const serviceStats = [
    { label: "Total Services", value: services.length.toString(), detail: `${activeServices} active services`, icon: Package },
    { label: "Active Services", value: activeServices.toString(), detail: formatPercent(activeServices, services.length), icon: CheckCircle2 },
    { label: "Popular Service", value: popularService?.name ?? "—", detail: `${formatPercent(popularService?.bookingsThisMonth ?? 0, totalBookings)} of bookings`, icon: Tag },
    { label: "Avg. Duration", value: averageDuration, detail: "Across service plans", icon: Clock3 },
  ];

  return (
    <div className="p-5 md:p-10">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h1 className="font-serif text-3xl">Services <PawPrint className="inline size-6 text-[#6c38c2]" /></h1>
          <p className="mt-1 text-sm text-[#6d667a]">Live Supabase booking totals combined with every service shown on your public service page.</p>
        </div>
        <button className="rounded-lg bg-[#4f2c91] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#4f2c91]/25"><Plus className="mr-2 inline size-4" />New Service</button>
      </div>

      {(isLoading || isFallback || error) && <p className="mt-5 rounded-xl border border-[#151124]/10 bg-white px-5 py-4 text-sm text-[#6d667a]">{isLoading ? "Loading live services…" : error || "Showing website services without Supabase booking totals."}</p>}

      <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {serviceStats.map(({ label, value, detail, icon: Icon }) => (
          <Card key={label} className="p-6"><div className="flex items-center gap-6"><span className="grid size-14 place-items-center rounded-full bg-[#f0e9fb] text-[#5b2aa0]"><Icon className="size-7" /></span><div><p className="text-sm text-[#6d667a]">{label}</p><p className="mt-1 font-serif text-3xl">{value}</p><p className="mt-2 text-sm text-[#6d667a]">{detail}</p></div></div></Card>
        ))}
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[1fr_18rem]">
        <Card className="overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-[#151124]/10 p-5 lg:flex-row lg:items-center lg:justify-between">
            <label className="flex min-w-0 flex-1 items-center gap-3 rounded-lg border border-[#151124]/10 px-4 py-3 text-sm text-[#858093] lg:max-w-xl"><Search className="size-5" /><input className="min-w-0 flex-1 bg-transparent outline-none" placeholder="Search services by name or description..." /></label>
            <div className="flex flex-wrap gap-3"><button className="rounded-lg border border-[#151124]/10 px-5 py-3 text-sm">All Categories <ChevronDown className="ml-6 inline size-4" /></button><button className="rounded-lg border border-[#151124]/10 px-5 py-3 text-sm">All Statuses <ChevronDown className="ml-6 inline size-4" /></button><button className="rounded-lg border border-[#151124]/10 px-5 py-3 text-sm"><Filter className="mr-2 inline size-4" />Filters</button></div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead className="bg-[#fbf9fd] text-xs font-semibold text-[#4f2c91]"><tr>{["Service", "Category", "Duration", "Price", "Bookings", "Status", "↕", ""].map((h)=><th key={h} className="px-7 py-4">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-[#151124]/10">
                {services.map((service) => {
                  const Icon = getServiceIcon(service);
                  return (
                    <tr key={service.id} className="bg-white align-middle">
                      <td className="px-7 py-4"><div className="flex items-center gap-4"><span className="grid size-12 place-items-center rounded-full bg-[#f0e9fb] text-[#5b2aa0]"><Icon className="size-6" /></span><div><p className="font-semibold">{service.name}</p><p className="mt-1 max-w-64 text-[#6d667a]">{service.description}</p><p className="mt-2 text-xs font-semibold text-[#5b2aa0]">{service.planCount} combined price option{service.planCount === 1 ? "" : "s"}</p></div></div></td>
                      <td className="px-7 py-4"><span className={`rounded-md px-3 py-1 text-xs font-medium ${getCategoryStyle(service.category)}`}>{service.category}</span></td>
                      <td className="px-7 py-4">{service.duration}</td>
                      <td className="px-7 py-4 font-semibold">{service.price}</td>
                      <td className="px-7 py-4 text-center"><p>{service.bookingsThisMonth}</p><p className="text-[#6d667a]">(This month)</p></td>
                      <td className="px-7 py-4"><span className="inline-flex items-center gap-2"><span className="relative inline-flex h-5 w-9 items-center rounded-full bg-[#4f2c91]"><span className="absolute right-1 size-3 rounded-full bg-white" /></span>{service.status}</span></td>
                      <td className="px-7 py-4" />
                      <td className="px-7 py-4"><button aria-label={`Actions for ${service.name}`} className="rounded-lg border border-[#151124]/10 p-2 text-[#4f4863]"><MoreVertical className="size-5" /></button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <aside className="space-y-5">
          <Card className="p-6"><div className="mb-6 flex items-center justify-between"><h2 className="font-serif text-xl">Categories</h2><button className="text-sm font-semibold text-[#5b2aa0]">Manage</button></div><div className="space-y-5">{categories.map(([name, count]) => { const Icon = categoryIcons[name as keyof typeof categoryIcons] ?? Package; return <div key={name} className="flex items-center gap-4"><span className={`grid size-12 place-items-center rounded-full ${getCategoryStyle(name)}`}><Icon className="size-6" /></span><div><p className="font-semibold">{name}</p><p className="mt-1 text-sm text-[#6d667a]">{count} service{count === 1 ? "" : "s"}</p></div></div>; })}</div></Card>
          <Card className="overflow-hidden bg-gradient-to-b from-[#f0e9fb] to-[#fff8df] p-6"><h2 className="font-serif text-xl">Realtime services 🚀</h2><p className="mt-4 text-sm leading-6 text-[#6d667a]">Booking counts update when Supabase booking rows change, while service names, descriptions, and pricing stay aligned with the public service page.</p><button className="mt-5 rounded-lg bg-[#4f2c91] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#4f2c91]/25">Promote Services</button><div className="relative mt-4 h-36"><Image src="/images/dogs/kaiser.jpg" alt="Happy dog promotion" fill sizes="(min-width: 1280px) 288px, (min-width: 768px) 40vw, 90vw" className="rounded-xl object-cover object-center opacity-90" /></div></Card>
        </aside>
      </div>
    </div>
  );
}