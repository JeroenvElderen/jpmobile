import { type CalendarBooking } from "@/utils/bookings";

import { BookingDay } from "./booking-day";

type BookingCalendarProps = {
  monthLabel: string;
  calendarDays: Date[];
  visibleMonth: Date;
  bookingsByDay: Record<string, CalendarBooking[]>;
  selectedDateKey: string | null;
  now: number;
  getDateKey: (value: Date | string) => string;
  onSelectDay: (day: Date) => void;
  onRequestBooking: (day: Date) => void;
};

export function BookingCalendar({ monthLabel, calendarDays, visibleMonth, bookingsByDay, selectedDateKey, now, getDateKey, onSelectDay, onRequestBooking }: BookingCalendarProps) {
  const todayKey = getDateKey(new Date(now));

  return (
    <section id="booking-calendar" className="mt-9 overflow-hidden rounded-xl border border-[#24163f]/10 bg-white shadow-[0_18px_55px_rgba(29,23,40,0.08)]">
      <div className="flex flex-col gap-4 border-b border-[#24163f]/10 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#3f2581]">Booking calendar</p>
          <h2 className="mt-2 font-serif text-2xl text-[#241f30]">{monthLabel}</h2>
        </div>
        <div className="flex flex-wrap gap-3 text-xs font-bold uppercase tracking-[0.12em] text-[#665d70]"><span className="inline-flex items-center gap-2"><span className="size-3 rounded-full bg-[#e9f4df]" />Booked</span><span className="inline-flex items-center gap-2"><span className="size-3 rounded-full bg-[#fff0cf]" />Review</span><span className="inline-flex items-center gap-2"><span className="size-3 rounded-full bg-[#f8e3df]" />Cancelled</span></div>
      </div>
      <div className="grid grid-cols-7 border-b border-[#24163f]/10 bg-[#fbf9fd] text-center text-xs font-black uppercase tracking-[0.14em] text-[#3f2581]">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => <div key={day} className="px-2 py-4">{day}</div>)}</div>
      <div className="grid grid-cols-1 sm:grid-cols-7">
        {calendarDays.map((day) => {
          const dayKey = getDateKey(day);
          return (
            <BookingDay
              key={day.toISOString()}
              day={day}
              bookings={bookingsByDay[dayKey] || []}
              isCurrentMonth={day.getMonth() === visibleMonth.getMonth()}
              isToday={dayKey === todayKey}
              isPast={dayKey < todayKey}
              isSelected={selectedDateKey === dayKey}
              onSelect={onSelectDay}
              onRequestBooking={onRequestBooking}
            />
          );
        })}
      </div>
    </section>
  );
}