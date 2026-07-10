"use client";

import { ArrowRight, Bell, CalendarDays, Check, Clock3, Download, ImageIcon, MapPin, PawPrint, Send, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { formatBookingDate, formatBookingTime, mapBookingRow, type CalendarBooking } from "@/utils/bookings";
import { BookingCalendar } from "./booking-calendar";
import { BookingRequestModal } from "./booking-request-modal";
import { usePortalDogImages } from "./use-portal-dog-images";
import { useSupabaseLiveQuery } from "./use-supabase-live-query";

function mapBookingRows(rows: unknown): CalendarBooking[] {
  return Array.isArray(rows) ? rows.map((row) => mapBookingRow(row as never)) : [];
}

function BookingCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`overflow-hidden rounded-xl border border-[#24163f]/10 bg-white shadow-[0_18px_55px_rgba(29,23,40,0.08)] ${className}`}>{children}</section>;
}

function getMonthStart(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), 1);
}

function getCalendarDays(monthStart: Date) {
  const firstDayOffset = (monthStart.getDay() + 6) % 7;
  const gridStart = new Date(monthStart);
  gridStart.setDate(monthStart.getDate() - firstDayOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(gridStart);
    day.setDate(gridStart.getDate() + index);
    return day;
  });
}

function getDateKey(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

type BookingRequestSlot = {
  id: string;
  date: string;
  startTime: string;
};

function createBookingRequestSlot(): BookingRequestSlot {
  return { id: crypto.randomUUID(), date: "", startTime: "" };
}

export function MyBookings({ accessToken }: { accessToken?: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(timer);
  }, []);
  const fallbackBookings = useMemo(() => [] as CalendarBooking[], []);
  const [visibleMonth, setVisibleMonth] = useState(() => getMonthStart(new Date()));
  const [requestServiceName, setRequestServiceName] = useState("Dog walking");
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [requestDogChoice, setRequestDogChoice] = useState("both");
  const [requestSlots, setRequestSlots] = useState<BookingRequestSlot[]>(() => [createBookingRequestSlot()]);
  const [requestDurationMinutes, setRequestDurationMinutes] = useState("60");
  const [requestLocation, setRequestLocation] = useState("");
  const [requestNotes, setRequestNotes] = useState("");
  const [requestStatus, setRequestStatus] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [isRequestingBooking, setIsRequestingBooking] = useState(false);
  const realtimeTables = useMemo(() => ["portal_bookings", "portal_dogs", "portal_session_updates", "portal_gallery_items"], []);
  const { data: bookings, isLoading, error } = useSupabaseLiveQuery({
    accessToken,
    fallback: fallbackBookings,
    path: "/rest/v1/portal_booking_list?select=*&order=starts_at.asc",
    realtimeTables,
    map: mapBookingRows,
  });
  const { data: dogs } = useSupabaseLiveQuery({
  accessToken,
  fallback: [] as { id: string; name: string }[],
  path: "/rest/v1/portal_dogs?select=id,name&status=eq.active&order=name",
  realtimeTables: ["portal_dogs"],
  map: (rows) =>
    Array.isArray(rows)
      ? rows.map((row) => ({
          id: (row as { id: string }).id,
          name: (row as { name: string }).name,
        }))
      : [],
});
  const dogImages = usePortalDogImages(accessToken, 3);

  const upcoming = useMemo(() => bookings.filter((booking) => booking.status !== "cancelled" && new Date(booking.endsAt).getTime() >= now).sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()), [bookings, now]);
  const nextBooking = upcoming[0];
  const dogOptions = dogs;
  const dogCount = dogOptions.length;
  const calendarDays = useMemo(() => getCalendarDays(visibleMonth), [visibleMonth]);
  const bookingsByDay = useMemo(() => bookings.reduce<Record<string, CalendarBooking[]>>((days, booking) => {
    const key = getDateKey(booking.startsAt);
    days[key] = [...(days[key] || []), booking].sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
    return days;
  }, {}), [bookings]);
  const monthLabel = new Intl.DateTimeFormat("en-IE", { month: "long", year: "numeric" }).format(visibleMonth);
  const headerImage = dogImages.getImage(0, nextBooking?.coverImageUrl || "/images/dogs/ace.jpg");
  const bookingImage = dogImages.getImage(1, nextBooking?.coverImageUrl || "/images/dogs/ace.jpg");
  const supportImage = dogImages.getImage(2, "/images/dogs/melakta.jpeg");
  const sessionPassed = nextBooking ? new Date(nextBooking.startsAt).getTime() < now : false;
  const updateRequestSlot = (slotId: string, updates: Partial<Omit<BookingRequestSlot, "id">>) => {
    setRequestSlots((slots) => slots.map((slot) => (slot.id === slotId ? { ...slot, ...updates } : slot)));
  };

  const addRequestSlot = () => {
    setRequestSlots((slots) => [...slots, createBookingRequestSlot()]);
  };

  const removeRequestSlot = (slotId: string) => {
    setRequestSlots((slots) => (slots.length > 1 ? slots.filter((slot) => slot.id !== slotId) : slots));
  };

  const buildRequestDate = (slot: BookingRequestSlot, durationMinutes = 0) => {
    const date = new Date(`${slot.date}T${slot.startTime}`);
    date.setMinutes(date.getMinutes() + durationMinutes);
    return date.toISOString();
  };

  const handleBookingRequest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRequestStatus(null);

    if (!accessToken) {
      setRequestStatus({ tone: "error", message: "Please sign in again before requesting a booking." });
      return;
    }

    setIsRequestingBooking(true);

    try {
      const requestedSlots = requestSlots.map((slot) => ({
        startsAt: buildRequestDate(slot),
        endsAt: buildRequestDate(slot, Number(requestDurationMinutes)),
      }));

      const response = await fetch("/api/portal/booking-request", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dogIds: requestDogChoice === "both" ? dogOptions.map((dog) => dog.id) : [requestDogChoice],
          serviceName: requestServiceName,
          bookings: requestedSlots,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Dublin",
          location: requestLocation,
          notes: requestNotes,
        }),
      });
      const result = (await response.json().catch(() => ({}))) as { error?: string; message?: string };

      if (!response.ok) throw new Error(result.error || "Unable to send this booking request.");

      setRequestStatus({ tone: "success", message: result.message || "Your booking request has been sent for review." });
      setRequestNotes("");
      setRequestSlots([createBookingRequestSlot()]);
      setIsRequestModalOpen(false);
    } catch (error) {
      setRequestStatus({ tone: "error", message: error instanceof Error ? error.message : "Unable to send this booking request." });
    } finally {
      setIsRequestingBooking(false);
    }
  };

  const openBookingRequestModal = (date?: Date) => {
    setRequestStatus(null);
    setRequestSlots([date ? { ...createBookingRequestSlot(), date: getDateKey(date) } : createBookingRequestSlot()]);
    setIsRequestModalOpen(true);
  };

  const handleSelectCalendarDay = (day: Date) => {
    const dayKey = getDateKey(day);
    if (dayKey < getDateKey(new Date(now))) return;
    setSelectedDateKey((current) => (current === dayKey ? null : dayKey));
  };

  const handleRequestBookingFromCalendar = (day: Date) => {
    const dayKey = getDateKey(day);
    if (dayKey < getDateKey(new Date(now))) return;
    setSelectedDateKey(dayKey);
    openBookingRequestModal(day);
  };

  const timeline = nextBooking ? [
    [Check, "Booking", nextBooking.status.replace(/_/g, " "), formatBookingDate(nextBooking.startsAt, { day: "numeric", month: "short", year: "numeric" }), true],
    [Check, "Calendar", nextBooking.syncStatus.replace(/_/g, " "), "Added to your portal", true],
    [CalendarDays, "Session day", sessionPassed ? "Completed" : "Scheduled", formatBookingDate(nextBooking.startsAt, { day: "numeric", month: "long", year: "numeric" }), sessionPassed],
    [ImageIcon, "Gallery", sessionPassed ? "In progress" : "Starts after session", "", sessionPassed],
  ] as const : [];

  return (
    <div className="px-4 py-6 text-[#17132a] sm:px-8 lg:px-10 lg:py-10">
      <header className="mx-auto flex max-w-6xl items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl leading-tight text-[#241f30]">My Bookings</h1>
          <p className="mt-3 text-sm text-[#17132a]">Your portal calendar stays in sync with your confirmed bookings.</p>
        </div>
        <div className="flex items-center gap-5"><button aria-label="Notifications" className="relative text-[#2f1b59]"><Bell className="size-6" /><span className="absolute right-0 top-0 size-2 rounded-full bg-[#8b5cf6]" /></button><div className="relative size-14 overflow-hidden rounded-full ring-2 ring-[#ead9b8]"><Image src={headerImage || "/images/dogs/ace.jpg"} alt={`${nextBooking?.dogName ?? "Client"} profile photo`} fill sizes="56px" className="object-cover" /></div></div>
      </header>

      <div className="mx-auto mt-10 max-w-6xl">
        {(isLoading || error || !nextBooking) && <p className="mb-5 rounded-xl border border-[#24163f]/10 bg-white px-5 py-4 text-sm text-[#665d70]">{isLoading ? "Loading your bookings…" : error ?? "No bookings yet."}</p>}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#24163f]/10 pb-5 text-sm font-medium"><p className="text-[#17132a]">Calendar view shows every booked, completed, review, and cancelled day in one place.</p><div className="flex gap-3"><button type="button" onClick={() => setVisibleMonth(getMonthStart(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1)))} className="rounded border border-[#4d2e91]/20 px-4 py-2 text-[#3f2581]">Previous</button><button type="button" onClick={() => setVisibleMonth(getMonthStart(new Date()))} className="rounded border border-[#4d2e91]/20 px-4 py-2 text-[#3f2581]">Today</button><button type="button" onClick={() => setVisibleMonth(getMonthStart(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1)))} className="rounded border border-[#4d2e91]/20 px-4 py-2 text-[#3f2581]">Next</button></div></div>

        {nextBooking ? <BookingCard className="mt-5">
          <div className="grid lg:grid-cols-[2fr_2.4fr_1.25fr]">
            <div className="relative min-h-80"><Image src={bookingImage || "/images/dogs/ace.jpg"} alt={`${nextBooking.dogName} booking`} fill sizes="380px" className="object-cover" /></div>
            <div className="p-8 lg:p-10">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#3f2581]">Upcoming session</p>
              <h2 className="mt-5 font-serif text-3xl text-[#25203d]">{nextBooking.serviceName}</h2>
              <div className="mt-7 space-y-4 text-sm text-[#342c3f]"><p className="flex items-center gap-4"><CalendarDays className="size-5 text-[#6d4b9b]" /> {formatBookingDate(nextBooking.startsAt)}</p><p className="flex items-center gap-4"><Clock3 className="size-5 text-[#6d4b9b]" /> {formatBookingTime(nextBooking.startsAt)} – {formatBookingTime(nextBooking.endsAt)}</p><p className="flex items-center gap-4"><MapPin className="size-5 text-[#6d4b9b]" /> {nextBooking.location}</p><p className="flex items-center gap-4"><Users className="size-5 text-[#6d4b9b]" /> {dogCount} dog{dogCount === 1 ? "" : "s"}</p></div>
              <div className="mt-9 flex flex-wrap gap-4"><a href={`/api/bookings/${nextBooking.id}`} className="inline-flex items-center gap-2 rounded bg-[#4d2e91] px-7 py-4 text-xs font-black uppercase tracking-[0.16em] text-white"><Download className="size-4" /> Add to calendar</a><a href="#" className="rounded border border-[#4d2e91]/35 px-7 py-4 text-xs font-black uppercase tracking-[0.16em] text-[#3f2581]">Reschedule</a></div>
            </div>
            <aside className="bg-[#f4eef8] p-8 text-center lg:p-10"><p className="mt-5 text-xs font-black uppercase tracking-[0.22em] text-[#3f2581]">Status</p><p className="mt-5 font-serif text-4xl capitalize text-[#2a2140]">{nextBooking.status.replace(/_/g, " ")}</p><div className="my-10 border-t border-[#24163f]/10" /><p className="text-sm leading-6">Want all bookings in your calendar?</p>{nextBooking.calendarFeedToken ? <a href={`/api/calendar/feed?token=${nextBooking.calendarFeedToken}`} className="mt-5 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-[#3f2581]">Open calendar feed <ArrowRight className="size-4" /></a> : <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-[#3f2581]">Calendar feed appears once your account is ready.</p>}</aside>
          </div>

          <div className="border-t border-[#24163f]/10 p-8 lg:p-10"><h3 className="font-serif text-xl">Session Timeline</h3><div className="mt-8 grid gap-8 md:grid-cols-4">{timeline.map(([Icon, title, status, date, active]) => <div key={title} className="relative text-center before:absolute before:left-0 before:top-8 before:hidden before:h-px before:w-full before:bg-[#24163f]/15 md:before:block"><div className={`relative z-10 mx-auto grid size-16 place-items-center rounded-full ${active ? "bg-[#28206e] text-white" : "bg-[#f0eaee] text-[#6a6170]"}`}><Icon className="size-7" /></div><p className="mt-4 text-xs font-black uppercase tracking-[0.14em]">{title}</p><p className="mt-1 text-sm capitalize text-[#665d70]">{status}</p>{date ? <p className="mt-2 text-xs text-[#665d70]">{date}</p> : null}</div>)}</div></div>
        </BookingCard> : null}

        <section className="mt-9 overflow-hidden rounded-xl border border-[#24163f]/10 bg-white p-8 shadow-[0_18px_55px_rgba(29,23,40,0.08)] lg:p-10">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#3f2581]">Request a booking</p>
              <h2 className="mt-3 font-serif text-2xl text-[#241f30]">Need another date?</h2>
              <p className="mt-3 text-sm leading-7 text-[#665d70]">Send one or more booking requests from your portal. Each date will appear as <strong>needs review</strong> until Jeroen confirms availability.</p>
            </div>
            <button type="button" onClick={() => openBookingRequestModal()} className="inline-flex items-center justify-center gap-3 rounded bg-[#4d2e91] px-7 py-4 text-xs font-black uppercase tracking-[0.16em] text-white">
              Request booking <Send className="size-4" />
            </button>
          </div>
          {requestStatus ? <p className={`mt-5 rounded-lg px-4 py-3 text-sm font-semibold ${requestStatus.tone === "success" ? "bg-[#e9f4df] text-[#356d28]" : "bg-[#f8e3df] text-[#8a2f20]"}`}>{requestStatus.message}</p> : null}
        </section>

        <BookingCalendar
          monthLabel={monthLabel}
          calendarDays={calendarDays}
          visibleMonth={visibleMonth}
          bookingsByDay={bookingsByDay}
          selectedDateKey={selectedDateKey}
          now={now}
          getDateKey={getDateKey}
          onSelectDay={handleSelectCalendarDay}
          onRequestBooking={handleRequestBookingFromCalendar}
        />

        <section className="relative mt-9 overflow-hidden rounded-xl bg-[#f4eef8] p-9 sm:p-12"><Image src={supportImage || "/images/dogs/melakta.jpeg"} alt="Your dog care support" fill sizes="720px" className="object-cover object-right opacity-45" /><div className="relative max-w-md"><h2 className="font-serif text-2xl">Need to make a change?</h2><p className="mt-4 text-sm leading-7">Reschedule, ask a question or just say hi. I&apos;m here to help!</p><Link href="/contact" className="mt-7 inline-flex items-center gap-3 rounded bg-[#4d2e91] px-7 py-4 text-xs font-black uppercase tracking-[0.16em] text-white">Send me a message <PawPrint className="size-4" /></Link></div></section>
        
        <BookingRequestModal
          isOpen={isRequestModalOpen}
          dogOptions={dogOptions}
          requestDogChoice={requestDogChoice}
          requestServiceName={requestServiceName}
          requestSlots={requestSlots}
          requestDurationMinutes={requestDurationMinutes}
          requestLocation={requestLocation}
          requestNotes={requestNotes}
          isRequestingBooking={isRequestingBooking}
          onClose={() => setIsRequestModalOpen(false)}
          onSubmit={handleBookingRequest}
          onDogChoiceChange={setRequestDogChoice}
          onServiceNameChange={setRequestServiceName}
          onSlotChange={updateRequestSlot}
          onAddSlot={addRequestSlot}
          onRemoveSlot={removeRequestSlot}
          onDurationChange={setRequestDurationMinutes}
          onLocationChange={setRequestLocation}
          onNotesChange={setRequestNotes}
        />
      </div>
    </div>
  );
}