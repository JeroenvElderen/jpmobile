"use client";

import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Clock3, ExternalLink, GraduationCap, Heart, Home, PawPrint, Plus, RefreshCw } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { fallbackBookings, formatBookingDate, formatBookingTime, type CalendarBooking } from "@/utils/bookings";
import { useSupabaseLiveQuery } from "@/components/portal/use-supabase-live-query";
import { Card } from "./card";

const serviceStyles = {
  walk: { icon: PawPrint, bg: "bg-[#eee7fb]", text: "text-[#44208b]", label: "Dog Walk" },
  training: { icon: GraduationCap, bg: "bg-[#eaf7ec]", text: "text-[#176333]", label: "Training" },
  puppy: { icon: Heart, bg: "bg-[#fff1d9]", text: "text-[#9a5a00]", label: "Puppy Visit" },
  other: { icon: Home, bg: "bg-[#fde9e7]", text: "text-[#8d332b]", label: "Care" },
} as const;

type BookingResponse = { bookings: CalendarBooking[]; isFallback: boolean };

type CalendarView = "week" | "month";

function startOfWeek(date: Date) {
  const value = new Date(date);
  const day = value.getDay() || 7;
  value.setDate(value.getDate() - day + 1);
  value.setHours(0, 0, 0, 0);
  return value;
}

function startOfMonth(date: Date) {
  const value = new Date(date);
  value.setDate(1);
  value.setHours(0, 0, 0, 0);
  return value;
}

function addDays(date: Date, amount: number) {
  const value = new Date(date);
  value.setDate(value.getDate() + amount);
  return value;
}

function addMonths(date: Date, amount: number) {
  const value = new Date(date);
  value.setMonth(value.getMonth() + amount, 1);
  return value;
}

function getDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getWeekLabel(weekStart: Date) {
  const weekEnd = addDays(weekStart, 6);
  return `${formatBookingDate(weekStart.toISOString(), { day: "numeric", month: "short" })} - ${formatBookingDate(weekEnd.toISOString(), { day: "numeric", month: "short", year: "numeric" })}`;
}

function getServiceStyle(serviceName: string) {
  const value = serviceName.toLowerCase();
  if (value.includes("train")) return serviceStyles.training;
  if (value.includes("puppy")) return serviceStyles.puppy;
  if (value.includes("walk")) return serviceStyles.walk;
  return serviceStyles.other;
}

function EventCard({ booking }: { booking: CalendarBooking }) {
  const style = getServiceStyle(booking.serviceName);
  const Icon = style.icon;

  return (
    <article className={`m-1 rounded-lg p-3 text-xs shadow-sm ${style.bg} ${style.text}`}>
      <div className="flex items-center gap-2 font-bold"><Icon className="size-4" />{booking.dogName}</div>
      <p className="mt-2 font-medium text-[#151124]">{booking.serviceName} · {booking.clientName}</p>
      <p className="mt-1 text-[#151124]">{formatBookingTime(booking.startsAt)} – {formatBookingTime(booking.endsAt)}</p>
      <p className="mt-2 inline-flex rounded-full bg-white/70 px-2 py-1 font-semibold capitalize text-[#151124]">{booking.syncStatus.replace(/_/g, " ")}</p>
    </article>
  );
}

export function BackendCalendar({ accessToken }: { accessToken?: string }) {
  const [isFallback, setIsFallback] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [visibleDate, setVisibleDate] = useState(() => startOfWeek(new Date()));
  const [calendarView, setCalendarView] = useState<CalendarView>("week");
  const realtimeTables = useMemo(() => ["portal_bookings", "portal_outlook_imports", "portal_clients", "portal_dogs"], []);
  const fallback = useMemo(() => fallbackBookings, []);
  const mapFallbackBookings = useCallback(() => fallbackBookings, []);
  const loadBookings = useCallback(async () => {
    const response = await fetch("/api/bookings?scope=admin", { cache: "no-store", headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined });
    const payload = (await response.json()) as BookingResponse;
    setIsFallback(payload.isFallback || payload.bookings.length === 0);
    return payload.bookings.length ? payload.bookings : fallbackBookings;
  }, [accessToken]);
  const { data: bookings, isLoading, error } = useSupabaseLiveQuery({
    fallback,
    path: "/api/bookings?scope=admin",
    realtimeTables,
    map: mapFallbackBookings,
    load: loadBookings,
  });

  const weekStart = useMemo(() => startOfWeek(visibleDate), [visibleDate]);
  const monthStart = useMemo(() => startOfMonth(visibleDate), [visibleDate]);
  const monthGridStart = useMemo(() => startOfWeek(monthStart), [monthStart]);

  const days = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)), [weekStart]);
  const monthDays = useMemo(() => Array.from({ length: 42 }, (_, index) => addDays(monthGridStart, index)), [monthGridStart]);

  const weekOptions = useMemo(() => {
    const weekKeys = new Map<string, Date>();
    const todayWeek = startOfWeek(new Date());
    for (let offset = -8; offset <= 12; offset += 1) {
      const week = addDays(todayWeek, offset * 7);
      weekKeys.set(getDateKey(week), week);
    }
    for (const booking of bookings) {
      const week = startOfWeek(new Date(booking.startsAt));
      weekKeys.set(getDateKey(week), week);
    }
    weekKeys.set(getDateKey(weekStart), weekStart);
    return Array.from(weekKeys.values()).sort((left, right) => left.getTime() - right.getTime());
  }, [bookings, weekStart]);

  const bookingByDate = useMemo(() => {
    const groups = new Map<string, CalendarBooking[]>();
    for (const booking of bookings) {
      const key = getDateKey(new Date(booking.startsAt));
      groups.set(key, [...(groups.get(key) ?? []), booking]);
    }
    return groups;
  }, [bookings]);

  const goToToday = () => setVisibleDate(calendarView === "month" ? startOfMonth(new Date()) : startOfWeek(new Date()));
  const goToPrevious = () => setVisibleDate((date) => calendarView === "month" ? addMonths(date, -1) : addDays(date, -7));
  const goToNext = () => setVisibleDate((date) => calendarView === "month" ? addMonths(date, 1) : addDays(date, 7));

  const stats = [
    { label: "Total Bookings", value: bookings.length.toString(), icon: CalendarDays },
    { label: "Confirmed", value: bookings.filter((booking) => booking.status === "confirmed").length.toString(), icon: PawPrint },
    { label: "Needs Review", value: bookings.filter((booking) => booking.needsReview || booking.syncStatus === "needs_review").length.toString(), icon: GraduationCap },
    { label: "Sync Issues", value: bookings.filter((booking) => ["failed", "conflict", "pending"].includes(booking.syncStatus)).length.toString(), icon: Home },
  ];

  async function syncFromOutlook() {
    setMessage("Checking Outlook for [JP] booking events…");
    
    try {
      const response = await fetch("/api/outlook/sync", { method: "POST" });
      const payload = await response.json().catch(() => ({ message: "Outlook sync failed without a response body." }));
      setMessage(response.ok ? `Outlook sync scanned ${payload.scanned} events and matched ${payload.matched}.` : payload.message || "Outlook sync failed.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Outlook sync failed.");
    }
  }

  return (
    <div className="p-5 md:p-10">
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
        <div><h1 className="font-serif text-3xl">Calendar <PawPrint className="inline size-6 text-[#6c38c2]" /></h1><p className="mt-1 text-sm text-[#6d667a]">Live Supabase bookings and Outlook imports refresh as soon as calendar data changes.</p></div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <button onClick={goToToday} className="rounded-lg border border-[#151124]/10 bg-white px-5 py-3 font-semibold">Today</button>
          <button onClick={goToPrevious} aria-label={`Previous ${calendarView}`} className="grid size-11 place-items-center rounded-lg border border-[#151124]/10 bg-white"><ChevronLeft className="size-4" /></button>
          <button onClick={goToNext} aria-label={`Next ${calendarView}`} className="grid size-11 place-items-center rounded-lg border border-[#151124]/10 bg-white"><ChevronRight className="size-4" /></button>
          {calendarView === "week" ? (
            <label className="relative">
              <span className="sr-only">Choose week</span>
              <select
                value={getDateKey(weekStart)}
                onChange={(event) => setVisibleDate(startOfWeek(new Date(`${event.target.value}T00:00:00`)))}
                className="appearance-none rounded-lg border border-[#151124]/10 bg-white px-5 py-3 pr-10 font-semibold"
              >
                {weekOptions.map((week) => <option key={getDateKey(week)} value={getDateKey(week)}>{getWeekLabel(week)}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2" />
            </label>
          ) : (
            <p className="rounded-lg border border-[#151124]/10 bg-white px-5 py-3 font-semibold">{formatBookingDate(monthStart.toISOString(), { month: "long", year: "numeric" })}</p>
          )}
          <label className="relative">
            <span className="sr-only">Calendar view</span>
            <select
              value={calendarView}
              onChange={(event) => setCalendarView(event.target.value as CalendarView)}
              className="appearance-none rounded-lg border border-[#151124]/10 bg-white px-5 py-3 pr-10 font-semibold"
            >
              <option value="week">Weekly view</option>
              <option value="month">Monthly view</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2" />
          </label>
          <button onClick={syncFromOutlook} className="rounded-lg border border-[#151124]/10 bg-white px-5 py-3 font-semibold"><RefreshCw className="mr-2 inline size-4" />Sync Outlook</button>
          <a href="https://outlook.office.com/calendar/" target="_blank" rel="noreferrer" className="rounded-lg bg-[#4f2c91] px-6 py-3 font-semibold text-white shadow-lg shadow-[#4f2c91]/25"><Plus className="mr-2 inline size-4" />Book in Outlook</a>
        </div>
      </div>

      {(isLoading || isFallback || message || error) && <p className="mt-5 rounded-xl border border-[#151124]/10 bg-white px-5 py-4 text-sm text-[#6d667a]">{isLoading ? "Loading live bookings…" : message || error || "Showing fallback preview until Supabase/service-role access is configured."}</p>}

      <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => <Card key={label} className="p-6"><div className="flex items-center gap-6"><span className="grid size-14 place-items-center rounded-full bg-[#f0e9fb] text-[#5b2aa0]"><Icon className="size-7" /></span><div><p className="text-sm text-[#6d667a]">{label}</p><p className="mt-1 font-serif text-3xl">{value}</p></div></div></Card>)}
      </div>

      <div className="mt-6 grid gap-6 2xl:grid-cols-[1fr_20rem]">
        <Card className="overflow-x-auto">
          {calendarView === "week" ? (
            <>
              <div className="grid min-w-[980px] grid-cols-7 border-b border-[#151124]/10 text-sm font-semibold">
                {days.map((day) => <div key={day.toISOString()} className="border-r border-[#151124]/10 p-4 text-center last:border-r-0">{formatBookingDate(day.toISOString(), { weekday: "short", day: "numeric" })}</div>)}
              </div>
              <div className="grid min-h-[38rem] min-w-[980px] grid-cols-7">
                {days.map((day) => (
                  <div key={day.toISOString()} className="border-r border-[#151124]/10 p-2 last:border-r-0">
                    {(bookingByDate.get(getDateKey(day)) ?? []).map((booking) => <EventCard key={booking.id} booking={booking} />)}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="grid min-w-[980px] grid-cols-7 border-b border-[#151124]/10 text-sm font-semibold">
                {days.map((day) => <div key={day.toISOString()} className="border-r border-[#151124]/10 p-4 text-center last:border-r-0">{formatBookingDate(day.toISOString(), { weekday: "short" })}</div>)}
              </div>
              <div className="grid min-h-[44rem] min-w-[980px] grid-cols-7">
                {monthDays.map((day) => {
                  const dayBookings = bookingByDate.get(getDateKey(day)) ?? [];
                  const isOutsideMonth = day.getMonth() !== monthStart.getMonth();

                  return (
                    <div key={day.toISOString()} className={`min-h-32 border-r border-t border-[#151124]/10 p-2 last:border-r-0 ${isOutsideMonth ? "bg-[#f7f4fb] text-[#9c94aa]" : "bg-white"}`}>
                      <p className="mb-2 text-xs font-bold">{formatBookingDate(day.toISOString(), { day: "numeric" })}</p>
                      {dayBookings.slice(0, 3).map((booking) => <EventCard key={booking.id} booking={booking} />)}
                      {dayBookings.length > 3 && <p className="m-1 rounded-lg bg-[#f0e9fb] px-3 py-2 text-xs font-semibold text-[#4f2c91]">+{dayBookings.length - 3} more</p>}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </Card>

        <aside className="space-y-5">
          <Card className="p-5"><h2 className="font-serif text-lg">Booking source rules</h2><p className="mt-3 text-sm leading-6 text-[#6d667a]">Create confirmed bookings only in this backend or in Outlook with <strong>[JP]</strong> in the title. Client requests stay as enquiries until you turn them into backend or Outlook bookings.</p></Card>
          <Card className="overflow-hidden"><div className="flex items-center justify-between p-5"><h2 className="font-serif text-lg">Upcoming</h2><Clock3 className="size-4 text-[#4f2c91]" /></div>{bookings.slice(0, 5).map((booking) => <div key={booking.id} className="border-t border-[#151124]/10 px-5 py-3"><p className="text-sm font-semibold">{booking.serviceName}</p><p className="text-xs text-[#6d667a]">{booking.dogName} · {formatBookingDate(booking.startsAt, { day: "numeric", month: "short" })} {formatBookingTime(booking.startsAt)}</p>{booking.outlookWebLink && <a href={booking.outlookWebLink} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#4f2c91]">Open in Outlook <ExternalLink className="size-3" /></a>}</div>)}</Card>
        </aside>
      </div>
    </div>
  );
}