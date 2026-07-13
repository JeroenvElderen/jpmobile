import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { PanResponder, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Booking, BookingStat, BookingStatus } from "@/lib/bookingData";

const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const timelineHours = Array.from({ length: 13 }, (_, index) => index + 8);
const hourHeight = 88;
const timelineStartHour = 8;

const statusStyles: Record<BookingStatus, { bg: string; border: string; color: string; iconBg: string }> = {
  Confirmed: { bg: "#F0F8FF", border: "#CDE3FF", color: "#1261C3", iconBg: "#E1F0FF" },
  Pending: { bg: "#FFF7ED", border: "#FED7AA", color: "#EA580C", iconBg: "#FFEDD5" },
  Cancelled: { bg: "#FFF1F4", border: "#FDA4AF", color: "#E11D48", iconBg: "#FFE4E6" },
};

const serviceAccents = ["#4B22C8", "#0EA5E9", "#16A34A", "#F97316", "#7C3AED"];
type CalendarView = "Day" | "Week" | "Month";

type BookingCalendarProps = {
  bookings: Booking[];
  stats?: BookingStat[];
  showStats?: boolean;
};

export default function BookingCalendar({ bookings, stats = [], showStats = false }: BookingCalendarProps) {
  const initialDate = useMemo(() => getInitialDate(bookings), [bookings]);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [calendarView, setCalendarView] = useState<CalendarView>("Day");
  const selectedDayStart = startOfDay(selectedDate);
  const visibleDays = useMemo(() => buildWeekDays(selectedDate), [selectedDate]);
  const monthDays = useMemo(() => buildMonthGrid(selectedDate), [selectedDate]);
  const weekBookings = useMemo(() => bookings.filter((booking) => booking.startsAtIso && visibleDays.some((day) => isSameDay(new Date(booking.startsAtIso!), day))), [bookings, visibleDays]);
  const monthBookings = useMemo(() => bookings.filter((booking) => booking.startsAtIso && isSameMonth(new Date(booking.startsAtIso), selectedDate)), [bookings, selectedDate]);
  const swipeResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 18 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
    onPanResponderRelease: (_, gesture) => {
      if (gesture.dx < -40) setSelectedDate((date) => addDays(date, 7));
      if (gesture.dx > 40) setSelectedDate((date) => addDays(date, -7));
    },
  }), []);
  const dayBookings = useMemo(
    () => bookings.filter((booking) => booking.startsAtIso && isSameDay(new Date(booking.startsAtIso), selectedDayStart)),
    [bookings, selectedDayStart],
  );

  return (
    <View style={styles.container}>
      <View style={styles.monthRow}>
        <TouchableOpacity style={styles.squareButton} activeOpacity={0.84} onPress={() => setSelectedDate(addDays(selectedDate, -7))}>
          <Ionicons name="chevron-back" size={22} color="#1F2756" />
        </TouchableOpacity>

        <View style={styles.monthButton}>
          <Text style={styles.monthText}>{formatMonth(selectedDate)}</Text>
        </View>

        <TouchableOpacity style={styles.squareButton} activeOpacity={0.84} onPress={() => setSelectedDate(addDays(selectedDate, 7))}>
          <Ionicons name="chevron-forward" size={22} color="#1F2756" />
        </TouchableOpacity>
      </View>

      <View style={styles.weekStrip} {...swipeResponder.panHandlers}>
        {visibleDays.map((day) => {
          const active = isSameDay(day, selectedDayStart);
          const hasBooking = bookings.some((booking) => booking.startsAtIso && isSameDay(new Date(booking.startsAtIso), day));

          return (
            <TouchableOpacity key={day.toISOString()} style={styles.dayCell} activeOpacity={0.86} onPress={() => setSelectedDate(day)}>
              <Text style={[styles.dayLabel, active && styles.activeDayLabel]}>{dayLabels[day.getDay()]}</Text>
              <View style={[styles.dayNumberWrap, active && styles.activeDayNumberWrap]}>
                <Text style={[styles.dayNumber, active && styles.activeDayNumber]}>{day.getDate()}</Text>
              </View>
              <View style={[styles.dayDot, hasBooking && styles.dayDotFilled]} />
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.controlRow}>
        <View style={styles.segmentedControl}>
          {(["Day", "Week", "Month"] as const).map((label) => (
            <TouchableOpacity key={label} style={[styles.segmentButton, label === calendarView && styles.activeSegment]} activeOpacity={0.84} onPress={() => setCalendarView(label)}>
              <Text style={[styles.segmentText, label === calendarView && styles.activeSegmentText]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

      </View>

      {showStats ? <StatsRail stats={stats} /> : null}

      {calendarView === "Day" ? <DaySchedule selectedDate={selectedDate} dayBookings={dayBookings} /> : null}
      {calendarView === "Week" ? <WeekSchedule visibleDays={visibleDays} bookings={weekBookings} onSelectDate={setSelectedDate} /> : null}
      {calendarView === "Month" ? <MonthSchedule selectedDate={selectedDate} monthDays={monthDays} bookings={monthBookings} onSelectDate={setSelectedDate} /> : null}
    </View>
  );
}

function DaySchedule({ selectedDate, dayBookings }: { selectedDate: Date; dayBookings: Booking[] }) {
  return (
    <>
      <Text style={styles.dateHeading}>{formatDateHeading(selectedDate)}</Text>
      <View style={styles.timelineShell}>
        <View style={styles.timeColumn}>
          {timelineHours.map((hour) => (
            <View key={hour} style={styles.timeSlot}><Text style={styles.timeText}>{formatHour(hour)}</Text></View>
          ))}
        </View>
        <View style={styles.scheduleColumn}>
          {timelineHours.map((hour) => <View key={hour} style={styles.gridLine} />)}
          {dayBookings.length === 0 ? <EmptyCalendarCard copy="Use another day to find bookings." floating /> : null}
          {dayBookings.map((booking, index) => <TimelineBookingCard key={booking.id} booking={booking} index={index} />)}
        </View>
      </View>
    </>
  );
}

function WeekSchedule({ visibleDays, bookings, onSelectDate }: { visibleDays: Date[]; bookings: Booking[]; onSelectDate: (date: Date) => void }) {
  return (
    <View style={styles.calendarCard}>
      <Text style={styles.dateHeading}>{formatWeekRange(visibleDays)}</Text>
      <View style={styles.weekCalendarGrid}>
        {visibleDays.map((day) => {
          const dayItems = bookings.filter((booking) => booking.startsAtIso && isSameDay(new Date(booking.startsAtIso), day));
          return (
            <TouchableOpacity key={day.toISOString()} style={styles.weekDayColumn} activeOpacity={0.84} onPress={() => onSelectDate(day)}>
              <Text style={styles.weekDayLabel}>{dayLabels[day.getDay()]}</Text>
              <Text style={styles.weekDayNumber}>{day.getDate()}</Text>
              {dayItems.slice(0, 3).map((booking) => <Text key={booking.id} style={styles.miniBooking} numberOfLines={1}>{booking.time} {booking.dog}</Text>)}
              {dayItems.length > 3 ? <Text style={styles.moreText}>+{dayItems.length - 3} more</Text> : null}
            </TouchableOpacity>
          );
        })}
      </View>
      {bookings.length === 0 ? <EmptyCalendarCard copy="No bookings are scheduled for this week." /> : null}
    </View>
  );
}

function MonthSchedule({ selectedDate, monthDays, bookings, onSelectDate }: { selectedDate: Date; monthDays: Date[]; bookings: Booking[]; onSelectDate: (date: Date) => void }) {
  return (
    <View style={styles.calendarCard}>
      <Text style={styles.dateHeading}>{formatMonth(selectedDate)}</Text>
      <View style={styles.monthWeekHeader}>{dayLabels.map((label) => <Text key={label} style={styles.monthWeekLabel}>{label}</Text>)}</View>
      <View style={styles.monthGrid}>
        {monthDays.map((day) => {
          const dayItems = bookings.filter((booking) => booking.startsAtIso && isSameDay(new Date(booking.startsAtIso), day));
          const muted = !isSameMonth(day, selectedDate);
          return (
            <TouchableOpacity key={day.toISOString()} style={[styles.monthDayCell, muted && styles.mutedMonthDay]} activeOpacity={0.84} onPress={() => onSelectDate(day)}>
              <Text style={[styles.monthDayNumber, muted && styles.mutedMonthText]}>{day.getDate()}</Text>
              {dayItems.slice(0, 2).map((booking) => <View key={booking.id} style={styles.monthDot} />)}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function EmptyCalendarCard({ copy, floating = false }: { copy: string; floating?: boolean }) {
  return (
    <View style={[styles.emptyCard, floating && styles.floatingEmptyCard]}>
      <Ionicons name="calendar-clear-outline" size={24} color="#5B3DF5" />
      <Text style={styles.emptyTitle}>No bookings scheduled</Text>
      <Text style={styles.emptyCopy}>{copy}</Text>
    </View>
  );
}

function StatsRail({ stats }: { stats: BookingStat[] }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsRail}>
      {stats.map((stat) => (
        <View key={stat.id} style={styles.statPill}>
          <View style={[styles.statIcon, { backgroundColor: stat.bg }]}>
            <Ionicons name={stat.icon} size={18} color={stat.color} />
          </View>
          <View>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statTitle}>{stat.title}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

function TimelineBookingCard({ booking, index }: { booking: Booking; index: number }) {
  const start = booking.startsAtIso ? new Date(booking.startsAtIso) : null;
  const end = booking.endsAtIso ? new Date(booking.endsAtIso) : null;
  const durationMinutes = start && end ? Math.max(30, (end.getTime() - start.getTime()) / 60_000) : 60;
  const minutesFromStart = start ? (start.getHours() - timelineStartHour) * 60 + start.getMinutes() : index * 80;
  const top = Math.max(6, (minutesFromStart / 60) * hourHeight + 8);
  const height = Math.max(76, (durationMinutes / 60) * hourHeight - 14);
  const status = statusStyles[booking.status];
  const accent = serviceAccents[index % serviceAccents.length];

  return (
    <View style={[styles.bookingCard, { top, minHeight: height, backgroundColor: status.bg, borderColor: status.border }]}>
      <View style={[styles.serviceIcon, { backgroundColor: status.iconBg }]}> 
        <Ionicons name={booking.serviceIcon} size={24} color={accent} />
      </View>

      <View style={styles.bookingCopy}>
        <Text style={styles.bookingName} numberOfLines={1}>{booking.dog}</Text>
        <Text style={styles.bookingService} numberOfLines={1}>{booking.service}</Text>
        <Text style={styles.bookingTime} numberOfLines={1}>{booking.time} – {formatEndTime(booking.endsAtIso)}</Text>
      </View>

      <View style={[styles.statusBadge, { backgroundColor: status.iconBg }]}> 
        <Text style={[styles.statusText, { color: status.color }]}>{booking.status}</Text>
      </View>
    </View>
  );
}

function getInitialDate(bookings: Booking[]) {
  const firstDatedBooking = bookings.find((booking) => booking.startsAtIso);
  return firstDatedBooking?.startsAtIso ? new Date(firstDatedBooking.startsAtIso) : new Date();
}

function buildWeekDays(date: Date) {
  const start = startOfDay(addDays(date, -((date.getDay() + 6) % 7)));
  return Array.from({ length: 7 }, (_, index) => addDays(start, index));
}

function buildMonthGrid(date: Date) {
  const firstOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const gridStart = startOfDay(addDays(firstOfMonth, -firstOfMonth.getDay()));
  return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function isSameDay(left: Date, right: Date) {
  return startOfDay(left).getTime() === startOfDay(right).getTime();
}

function isSameMonth(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth();
}

function formatMonth(date: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(date);
}

function formatDateHeading(date: Date) {
  return new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(date);
}

function formatWeekRange(days: Date[]) {
  const first = days[0];
  const last = days[days.length - 1];
  return `${new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(first)} – ${new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(last)}`;
}

function formatHour(hour: number) {
  const date = new Date();
  date.setHours(hour, 0, 0, 0);
  return new Intl.DateTimeFormat("en-US", { hour: "numeric" }).format(date);
}

function formatEndTime(endsAtIso?: string) {
  if (!endsAtIso) return "Time TBC";
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(new Date(endsAtIso));
}

const styles = StyleSheet.create({
  container: { position: "relative" },
  monthRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 22 },
  squareButton: { alignItems: "center", backgroundColor: "#FFF", borderColor: "#E8EAF7", borderRadius: 12, borderWidth: 1, height: 46, justifyContent: "center", width: 46 },
  monthButton: { alignItems: "center", flex: 1, flexDirection: "row", gap: 8, justifyContent: "center" },
  monthText: { color: "#10162F", fontSize: 20, fontWeight: "800" },
  weekStrip: { flexDirection: "row", justifyContent: "space-between", marginBottom: 28 },
  dayCell: { alignItems: "center", gap: 7, minWidth: 42 },
  dayLabel: { color: "#445078", fontSize: 14, fontWeight: "700" },
  activeDayLabel: { color: "#1D1466" },
  dayNumberWrap: { alignItems: "center", borderRadius: 22, height: 44, justifyContent: "center", width: 44 },
  activeDayNumberWrap: { backgroundColor: "#4B22C8" },
  dayNumber: { color: "#06091A", fontSize: 22, fontWeight: "800" },
  activeDayNumber: { color: "#FFF" },
  dayDot: { backgroundColor: "transparent", borderRadius: 4, height: 7, width: 7 },
  dayDotFilled: { backgroundColor: "#4B22C8" },
  controlRow: { alignItems: "center", flexDirection: "row", justifyContent: "center", marginBottom: 20 },
  segmentedControl: { backgroundColor: "#FFF", borderColor: "#E7E9F2", borderRadius: 14, borderWidth: 1, flexDirection: "row", overflow: "hidden", width: "100%" },
  segmentButton: { alignItems: "center", flex: 1, height: 54, justifyContent: "center" },
  activeSegment: { backgroundColor: "#F2EAFE" },
  segmentText: { color: "#364063", fontSize: 15, fontWeight: "700" },
  activeSegmentText: { color: "#4B22C8" },
  statsRail: { gap: 10, paddingBottom: 18 },
  statPill: { alignItems: "center", backgroundColor: "#FFF", borderColor: "#ECECF5", borderRadius: 18, borderWidth: 1, flexDirection: "row", gap: 10, paddingHorizontal: 14, paddingVertical: 12 },
  statIcon: { alignItems: "center", borderRadius: 18, height: 36, justifyContent: "center", width: 36 },
  statValue: { color: "#0D1329", fontSize: 18, fontWeight: "900" },
  statTitle: { color: "#64708F", fontSize: 12, fontWeight: "700" },
  dateHeading: { color: "#0D1329", fontSize: 21, fontWeight: "900", marginBottom: 14 },
  timelineShell: { flexDirection: "row", minHeight: timelineHours.length * hourHeight },
  timeColumn: { paddingRight: 14, width: 82 },
  timeSlot: { height: hourHeight },
  timeText: { color: "#42507B", fontSize: 14, fontWeight: "700" },
  scheduleColumn: { borderLeftColor: "#DDE2F1", borderLeftWidth: 1, flex: 1, minHeight: timelineHours.length * hourHeight, position: "relative" },
  gridLine: { borderTopColor: "#E9EDF7", borderTopWidth: 1, height: hourHeight },
  bookingCard: { alignItems: "center", borderRadius: 14, borderWidth: 1, flexDirection: "row", gap: 12, left: 18, padding: 14, position: "absolute", right: 0, shadowColor: "#19213D", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 18 },
  serviceIcon: { alignItems: "center", borderRadius: 26, height: 52, justifyContent: "center", width: 52 },
  bookingCopy: { flex: 1 },
  bookingName: { color: "#0C1024", fontSize: 17, fontWeight: "900", marginBottom: 4 },
  bookingService: { color: "#2F375E", fontSize: 14, fontWeight: "700", marginBottom: 3 },
  bookingTime: { color: "#273154", fontSize: 14, fontWeight: "800" },
  statusBadge: { borderRadius: 8, paddingHorizontal: 9, paddingVertical: 6, position: "absolute", right: 12, top: 12 },
  statusText: { fontSize: 12, fontWeight: "900" },
  emptyCard: { alignItems: "center", backgroundColor: "#FFF", borderColor: "#E7E9F2", borderRadius: 18, borderStyle: "dashed", borderWidth: 1, marginTop: 8, padding: 22 },
  floatingEmptyCard: { left: 18, position: "absolute", right: 0, top: 28 },
  emptyTitle: { color: "#10162F", fontSize: 16, fontWeight: "900", marginTop: 8 },
  emptyCopy: { color: "#64708F", fontSize: 13, marginTop: 4, textAlign: "center" },
  calendarCard: { backgroundColor: "#FFF", borderColor: "#E7E9F2", borderRadius: 22, borderWidth: 1, padding: 16 },
  weekCalendarGrid: { flexDirection: "row", gap: 6 },
  weekDayColumn: { backgroundColor: "#F8F9FD", borderRadius: 16, flex: 1, minHeight: 150, padding: 7 },
  weekDayLabel: { color: "#64708F", fontSize: 11, fontWeight: "800", textAlign: "center" },
  weekDayNumber: { color: "#10162F", fontSize: 18, fontWeight: "900", marginBottom: 8, textAlign: "center" },
  miniBooking: { backgroundColor: "#F2EAFE", borderRadius: 7, color: "#4B22C8", fontSize: 10, fontWeight: "800", marginBottom: 5, paddingHorizontal: 4, paddingVertical: 4 },
  moreText: { color: "#64708F", fontSize: 10, fontWeight: "800", textAlign: "center" },
  monthWeekHeader: { flexDirection: "row", marginBottom: 8 },
  monthWeekLabel: { color: "#64708F", flex: 1, fontSize: 12, fontWeight: "900", textAlign: "center" },
  monthGrid: { flexDirection: "row", flexWrap: "wrap" },
  monthDayCell: { alignItems: "center", aspectRatio: 1, borderColor: "#EEF0F7", borderRadius: 14, borderWidth: 1, justifyContent: "flex-start", margin: "0.7%", paddingTop: 8, width: "12.85%" },
  mutedMonthDay: { backgroundColor: "#FAFBFE" },
  monthDayNumber: { color: "#10162F", fontSize: 14, fontWeight: "900" },
  mutedMonthText: { color: "#B5BBD0" },
  monthDot: { backgroundColor: "#4B22C8", borderRadius: 3, height: 6, marginTop: 4, width: 6 },
});