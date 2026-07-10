"use client";

import { ArrowRight, CalendarDays, Camera, Check, Heart, MapPin, MessageCircle, PawPrint } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { emptyPortalDashboardData, mapPortalDashboardRows } from "./portal-data";
import { usePortalDogImages } from "./use-portal-dog-images";
import { useSupabaseLiveQuery } from "./use-supabase-live-query";

const dashboardRealtimeTables = ["portal_clients", "portal_dogs", "portal_bookings", "portal_session_updates", "portal_gallery_items"];

function isSupabaseStorageUrl(src: string | null | undefined) {
  return Boolean(src?.includes("/storage/v1/object/"));
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-IE", { dateStyle: "full" }).format(new Date(date));
}

function formatShortDate(date: string) {
  return new Intl.DateTimeFormat("en-IE", { day: "numeric", month: "long", year: "numeric" }).format(new Date(date));
}

function formatTime(date: string) {
  return new Intl.DateTimeFormat("en-IE", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(date));
}

function PortalCard({
  children,
  className = "",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`rounded-[1.4rem] border border-[#24163f]/10 bg-white shadow-[0_20px_60px_rgba(29,23,40,0.08)] ${className}`}>
      {children}
    </section>
  );
}

function SupabaseImage({ alt, children, className, imageClassName = "object-cover", priority = false, sizes, src }: { alt: string; children?: React.ReactNode; className: string; imageClassName?: string; priority?: boolean; sizes: string; src: string | null }) {
  return (
    <div className={`${className} ${src ? "" : "grid place-items-center bg-[#f0e8f8] text-[#5b2aa0]"}`}>
      {src ? <Image src={src} alt={alt} fill priority={priority} loading={priority ? "eager" : undefined} sizes={sizes} unoptimized={isSupabaseStorageUrl(src)} className={imageClassName} /> : <PawPrint aria-hidden="true" className="size-10" />}
      {children}
    </div>
  );
}

export function Dashboard({ accessToken }: { accessToken?: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(timer);
  }, []);
  const { data, isLoading, error } = useSupabaseLiveQuery({
    accessToken,
    fallback: emptyPortalDashboardData,
    path: "/rest/v1/portal_dashboard?select=*&limit=1",
    realtimeTables: dashboardRealtimeTables,
    map: mapPortalDashboardRows,
  });
  const dogImages = usePortalDogImages(accessToken, 4);
  const elapsed = useMemo(() => getElapsedParts(data.clientSince, now), [data.clientSince, now]);
  const dogPossessive = `${data.dogNames}${data.dogNames.includes(",") || data.dogNames.includes(" and ") ? "’" : "’s"}`;
  const booking = data.upcomingBooking;
  
  const displayedImages = {
    heroPhotoUrl: dogImages.getImage(0, data.heroPhotoUrl),
    bookingPhotoUrl: dogImages.getImage(1, booking?.imageUrl ?? data.dogPhotoUrl),
    countdownPhotoUrl: dogImages.getImage(2, data.dogPhotoUrl),
    latestSessionPhotoUrl: dogImages.getImage(3, data.latestSession?.imageUrl ?? data.dogPhotoUrl),
  };

  const journey = [
    [Check, "Booking", booking?.status ?? "No bookings yet", true],
    [Heart, "Care plan", "Shared with Jeroen", true],
    [Camera, "Session day", booking ? formatDate(booking.startsAt) : "No session scheduled", false],
    [MessageCircle, "Care updates", "Shared during care", false],
  ] as const;

  const nextSteps = [
    [CalendarDays, booking?.serviceName ?? "No booking yet", booking ? `Jeroen arrives for ${formatTime(booking.startsAt)} – ${formatTime(booking.endsAt)}.` : "Your next booking details will appear here once confirmed."],
    [Camera, "Photo update", "Session photos and notes appear here as soon as they are shared."],
  ] as const;

  return (
    <div className="px-4 py-5 sm:px-8 lg:px-10 lg:py-8">
      {(isLoading || error) && (
        <div className="mx-auto mb-5 max-w-6xl rounded-xl border border-[#24163f]/10 bg-white px-5 py-4 text-sm text-[#665d70] shadow-[0_12px_30px_rgba(29,23,40,0.06)]">
          {isLoading ? "Loading your portal…" : `${error} Your portal details could not be loaded.`}
        </div>
      )}
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <div>
          <Link href="/" className="mb-3 inline-flex lg:hidden">
            <Image src="/logo4.svg" alt="Jeroen & Paws" width={140} height={82} className="h-12 w-auto" />
          </Link>
          <p className="text-lg font-semibold text-[#2d2140]">Welcome back, {data.clientFirstName} <PawPrint aria-hidden="true" className="ml-1 inline size-4 text-[#8b5cf6]" /></p>
          <p className="mt-1 text-sm text-[#665d70]">Everything for {data.dogNames} is kept up to date here</p>
        </div>
        <div className="relative size-12 overflow-hidden rounded-full ring-2 ring-[#ead9b8]">
          {data.avatarUrl ? <Image src={data.avatarUrl} alt={`${data.clientName} profile photo`} fill sizes="48px" unoptimized={isSupabaseStorageUrl(data.avatarUrl)} className="object-cover" /> : <span className="grid size-full place-items-center bg-[#f0e8f8] text-[#5b2aa0]"><PawPrint className="size-5" /></span>}
        </div>
      </header>

      <div className="mx-auto mt-7 max-w-6xl space-y-6">
        <SupabaseImage src={displayedImages.heroPhotoUrl} alt={`${data.dogNames} enjoying a Jeroen & Paws session`} priority sizes="(min-width: 1024px) 1120px, 100vw" className="relative overflow-hidden rounded-[1.6rem] bg-[#080b10] px-6 py-12 text-white shadow-2xl shadow-[#1d1728]/15 sm:px-12 lg:min-h-[24rem]" imageClassName="object-cover object-center opacity-60">
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,11,16,.92),rgba(8,11,16,.62),rgba(8,11,16,.18))]" />
          <div className="relative max-w-xl">
            <p className="text-xs font-black uppercase tracking-[0.32em] text-[#c4b5fd]">Your dog&apos;s care, beautifully organised.</p>
            <h1 className="mt-5 text-4xl font-semibold leading-tight text-[#fff7e8] sm:text-6xl">Everything for {data.dogNames} is right here.</h1>
            <p className="mt-5 max-w-md leading-8 text-[#f5e9d5]">Bookings, care notes, photo updates, and invoices — all styled to feel as warm and premium as the Jeroen & Paws experience.</p>
            <Link href="#photos" className="mt-8 inline-flex items-center gap-3 rounded-md bg-[#6d4b9b] px-6 py-4 text-xs font-black uppercase tracking-[0.18em] text-white shadow-xl shadow-[#000]/20">
              View {data.dogNames} photos <PawPrint aria-hidden="true" className="size-4" />
            </Link>
          </div>
        </SupabaseImage>

        <div className="grid gap-6 lg:grid-cols-[1.7fr_1fr]">
          <PortalCard className="p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-2xl font-semibold">Upcoming booking <PawPrint aria-hidden="true" className="inline size-4 text-[#8b5cf6]" /></h2>
              <a href="#" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-[#6d4b9b]">View details <ArrowRight className="size-4" /></a>
            </div>
            <div className="mt-7 grid gap-6 sm:grid-cols-[13rem_1fr] sm:items-center">
              <SupabaseImage src={displayedImages.bookingPhotoUrl} alt={`${data.dogNames} booking photo`} sizes="210px" className="relative h-44 overflow-hidden rounded-lg sm:h-36" />
              <div>
                <h3 className="text-xl font-semibold">{booking?.serviceName ?? "No bookings yet"}</h3>
                <p className="mt-3 text-sm leading-7 text-[#30283c]">{booking ? formatDate(booking.startsAt) : "No bookings yet"}<br />{booking ? `${formatTime(booking.startsAt)} – ${formatTime(booking.endsAt)}` : "Book a service to see it here"}</p>
                <p className="mt-2 flex items-center gap-2 text-sm text-[#665d70]"><MapPin className="size-4 text-[#6d4b9b]" /> {booking?.location ?? "No location yet"}</p>
              </div>
            </div>
            <div className="mt-7 flex flex-col gap-4 rounded-xl bg-[#f0e8f8] p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white text-[#6d4b9b]"><CalendarDays className="size-5" /></span>
                <div><p className="font-bold">Need to adjust it?</p><p className="mt-1 text-sm text-[#665d70]">Reschedule up to 48 hours before your booking.</p></div>
              </div>
              <a href="#" className="text-xs font-black uppercase tracking-[0.16em] text-[#6d4b9b]">Reschedule</a>
            </div>
          </PortalCard>

          <PortalCard className="relative min-h-[22rem] overflow-hidden p-8 text-center text-white">
            <SupabaseImage src={displayedImages.countdownPhotoUrl} alt={`${data.dogNames} countdown photo`} sizes="400px" className="absolute inset-0" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(29,23,40,.90),rgba(29,23,40,.55),rgba(29,23,40,.20))]" />
            <div className="relative">
              <h2 className="text-2xl font-semibold text-[#fff7e8]">Our time together <Heart className="inline size-4 text-[#c4b5fd]" /></h2>
              <p className="mt-5 text-xs font-black uppercase tracking-[0.24em] text-[#c4b5fd]">Client since</p>
              <div className="mt-7 grid grid-cols-3 gap-3 text-[#fff7e8]"><strong className="text-4xl">{elapsed.years}</strong><strong className="text-4xl">{elapsed.days}</strong><strong className="text-4xl">{elapsed.hours}</strong></div><p className="mt-3 text-xs font-black uppercase tracking-[0.18em]">years : days : hours</p>
            </div>
          </PortalCard>
        </div>

        <PortalCard className="p-6 sm:p-8">
          <h2 className="text-2xl font-semibold">{dogPossessive} booking progress <PawPrint aria-hidden="true" className="inline size-4 text-[#8b5cf6]" /></h2>
          <div className="mt-8 grid gap-6 md:grid-cols-4">
            {journey.map(([Icon, title, status, active]) => (
              <div key={title} className="relative text-center">
                <div className={`mx-auto grid size-16 place-items-center rounded-full ${active ? "bg-[#3a205f] text-white" : "bg-[#efe8e5] text-[#665d70]"}`}><Icon className="size-7" /></div>
                <p className="mt-4 text-xs font-black uppercase tracking-[0.16em]">{title}</p>
                <p className="mt-1 text-sm text-[#665d70]">{status}</p>
              </div>
            ))}
          </div>
        </PortalCard>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <PortalCard id="photos" className="p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4"><h2 className="text-2xl font-semibold">Latest from your session</h2><a href="#" className="text-xs font-black uppercase tracking-[0.16em] text-[#6d4b9b]">View all</a></div>
            <SupabaseImage src={displayedImages.latestSessionPhotoUrl} alt={`${data.dogNames} latest session photo`} sizes="650px" className="relative mt-6 h-64 overflow-hidden rounded-xl" />
            <div className="mt-5 flex items-center justify-between"><div><p className="font-semibold">{data.latestSession?.serviceName ?? "No session photos yet"}</p><p className="mt-1 text-sm text-[#665d70]">{data.latestSession ? formatShortDate(data.latestSession.sessionDate) : "Jeroen will share one from the gallery"}</p></div><p className="text-xs font-black uppercase tracking-[0.16em] text-green-700">{data.latestSession?.status ?? "Waiting for gallery"}</p></div>
          </PortalCard>

          <PortalCard className="p-6 sm:p-8">
            <h2 className="text-2xl font-semibold">What&apos;s next?</h2>
            <div className="mt-7 space-y-6">
              {nextSteps.map(([Icon, title, text]) => (<div key={title} className="flex gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#f0e8f8] text-[#6d4b9b]"><Icon className="size-5" /></span><div><p className="font-semibold">{title}</p><p className="mt-1 text-sm leading-6 text-[#665d70]">{text}</p></div></div>))}
            </div>
            <Link href="#photos" className="mt-8 inline-flex rounded-md bg-[#6d4b9b] px-6 py-4 text-xs font-black uppercase tracking-[0.18em] text-white">View my photos</Link>
          </PortalCard>
        </div>
      </div>
    </div>
  );
}
function getElapsedParts(value: string, now: number) {
  const diff = Math.max(0, now - new Date(value).getTime());
  const hours = Math.floor(diff / 36e5) % 24;
  const daysTotal = Math.floor(diff / 864e5);
  return { years: Math.floor(daysTotal / 365), days: daysTotal % 365, hours };
}
