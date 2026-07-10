import { CalendarPlus } from "lucide-react";

import { formatBookingTime, type CalendarBooking } from "@/utils/bookings";

type BookingDayProps = {
  day: Date;
  bookings: CalendarBooking[];
  isCurrentMonth: boolean;
  isToday: boolean;
  isPast: boolean;
  isSelected: boolean;
  onSelect: (day: Date) => void;
  onRequestBooking: (day: Date) => void;
};

function getStatusTone(status: CalendarBooking["status"]) {
  if (status === "cancelled" || status === "no_show") return "bg-[#f8e3df] text-[#8a2f20]";
  if (status === "needs_review" || status === "reschedule_requested") return "bg-[#fff0cf] text-[#806013]";
  if (status === "completed") return "bg-[#eee9e1] text-[#5f4d35]";
  return "bg-[#e9f4df] text-[#356d28]";
}

export function BookingDay({ day, bookings, isCurrentMonth, isToday, isPast, isSelected, onSelect, onRequestBooking }: BookingDayProps) {
  const buttonLabel = bookings.length ? "Request another booking" : "Request booking";

  return (
    <article
      className={`border-b border-r border-[#24163f]/10 p-2 transition-all duration-300 ease-out sm:p-3 ${
        isCurrentMonth ? "bg-white" : "bg-[#fbf9fd] text-[#858093]"
      } ${isSelected ? "min-h-64 shadow-[inset_0_0_0_2px_rgba(77,46,145,0.45)]" : "min-h-32 sm:min-h-36"}`}
    >
      <button
        type="button"
        onClick={() => onSelect(day)}
        disabled={isPast}
        className={`group flex w-full items-center justify-between rounded-xl px-2 py-2 text-left transition-all duration-200 ${
          isPast
            ? "cursor-not-allowed opacity-40"
            : "cursor-pointer hover:bg-[#f4eef8] focus:outline-none focus:ring-2 focus:ring-[#8b5cf6]/50"
        } ${isSelected ? "bg-[#4d2e91] text-white hover:bg-[#4d2e91]" : ""}`}
        aria-expanded={isSelected}
      >
        <span
          className={`grid size-8 place-items-center rounded-full text-sm font-bold transition-colors ${
            isToday && !isSelected ? "bg-[#4d2e91] text-white" : ""
          } ${isSelected ? "bg-white text-[#4d2e91]" : ""}`}
        >
          {day.getDate()}
        </span>
        {bookings.length ? (
          <span className={`text-xs font-bold ${isSelected ? "text-white" : "text-[#3f2581]"}`}>{bookings.length}</span>
        ) : null}
      </button>

      <div className={`grid transition-all duration-300 ease-out ${isSelected ? "mt-3 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
        <div className="overflow-hidden">
          {bookings.length ? (
            <div className="space-y-2">
              {bookings.map((booking) => (
                <a key={booking.id} href={`/api/bookings/${booking.id}`} className={`block rounded-lg px-3 py-2 text-xs leading-5 ${getStatusTone(booking.status)}`}>
                  <span className="font-black uppercase tracking-[0.08em]">{formatBookingTime(booking.startsAt)}</span>
                  <span className="ml-2 font-semibold">{booking.serviceName}</span>
                </a>
              ))}
            </div>
          ) : (
            <p className="rounded-lg bg-[#fbf9fd] px-3 py-4 text-sm font-semibold text-[#665d70]">No bookings</p>
          )}
          <button
            type="button"
            onClick={() => onRequestBooking(day)}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#4d2e91] px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-white transition hover:bg-[#3f2581]"
          >
            {buttonLabel} <CalendarPlus className="size-4" />
          </button>
        </div>
      </div>
    </article>
  );
}