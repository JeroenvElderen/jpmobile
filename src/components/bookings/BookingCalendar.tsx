import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

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

type BookingCalendarProps = {
  bookings: Booking[];
  stats?: BookingStat[];
  showStats?: boolean;
};

export default function BookingCalendar({ bookings, stats = [], showStats = false }: BookingCalendarProps) {
  const initialDate = useMemo(() => getInitialDate(bookings), [bookings]);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const selectedDayStart = startOfDay(selectedDate);
  const visibleDays = useMemo(() => buildWeekDays(selectedDate), [selectedDate]);
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

        <TouchableOpacity style={styles.monthButton} activeOpacity={0.84}>
          <Text style={styles.monthText}>{formatMonth(selectedDate)}</Text>
          <Ionicons name="chevron-down" size={18} color="#5B668D" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.todayButton} activeOpacity={0.84} onPress={() => setSelectedDate(new Date())}>
          <Text style={styles.todayText}>Today</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.weekStrip}>
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
            <TouchableOpacity key={label} style={[styles.segmentButton, label === "Day" && styles.activeSegment]} activeOpacity={0.84}>
              <Text style={[styles.segmentText, label === "Day" && styles.activeSegmentText]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.filterButton} activeOpacity={0.84}>
          <Ionicons name="filter-outline" size={20} color="#1F2756" />
          <Text style={styles.filterText}>Filters</Text>
        </TouchableOpacity>
      </View>

      {showStats ? <StatsRail stats={stats} /> : null}

      <Text style={styles.dateHeading}>{formatDateHeading(selectedDate)}</Text>

      <View style={styles.timelineShell}>
        <View style={styles.timeColumn}>
          {timelineHours.map((hour) => (
            <View key={hour} style={styles.timeSlot}>
              <Text style={styles.timeText}>{formatHour(hour)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.scheduleColumn}>
          {timelineHours.map((hour) => (
            <View key={hour} style={styles.gridLine} />
          ))}

          {dayBookings.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="calendar-clear-outline" size={24} color="#5B3DF5" />
              <Text style={styles.emptyTitle}>No bookings scheduled</Text>
              <Text style={styles.emptyCopy}>Use another day or create a new booking.</Text>
            </View>
          ) : null}

          {dayBookings.map((booking, index) => (
            <TimelineBookingCard key={booking.id} booking={booking} index={index} />
          ))}
        </View>
      </View>

      <TouchableOpacity style={styles.floatingAdd} activeOpacity={0.9}>
        <Ionicons name="add" size={32} color="#FFF" />
      </TouchableOpacity>
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

function formatMonth(date: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(date);
}

function formatDateHeading(date: Date) {
  return new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(date);
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
  monthButton: { alignItems: "center", flexDirection: "row", gap: 8 },
  monthText: { color: "#10162F", fontSize: 20, fontWeight: "800" },
  todayButton: { alignItems: "center", backgroundColor: "#FFF", borderColor: "#E8EAF7", borderRadius: 12, borderWidth: 1, height: 46, justifyContent: "center", paddingHorizontal: 20 },
  todayText: { color: "#4B22C8", fontSize: 16, fontWeight: "800" },
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
  controlRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  segmentedControl: { backgroundColor: "#FFF", borderColor: "#E7E9F2", borderRadius: 14, borderWidth: 1, flexDirection: "row", overflow: "hidden", width: "55%" },
  segmentButton: { alignItems: "center", flex: 1, height: 54, justifyContent: "center" },
  activeSegment: { backgroundColor: "#F2EAFE" },
  segmentText: { color: "#364063", fontSize: 15, fontWeight: "700" },
  activeSegmentText: { color: "#4B22C8" },
  filterButton: { alignItems: "center", backgroundColor: "#FFF", borderColor: "#E7E9F2", borderRadius: 14, borderWidth: 1, flexDirection: "row", gap: 8, height: 54, justifyContent: "center", paddingHorizontal: 18 },
  filterText: { color: "#10162F", fontSize: 15, fontWeight: "700" },
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
  emptyCard: { alignItems: "center", backgroundColor: "#FFF", borderColor: "#E7E9F2", borderRadius: 18, borderStyle: "dashed", borderWidth: 1, left: 18, padding: 22, position: "absolute", right: 0, top: 28 },
  emptyTitle: { color: "#10162F", fontSize: 16, fontWeight: "900", marginTop: 8 },
  emptyCopy: { color: "#64708F", fontSize: 13, marginTop: 4, textAlign: "center" },
  floatingAdd: { alignItems: "center", backgroundColor: "#4B22C8", borderRadius: 29, bottom: 24, elevation: 12, height: 58, justifyContent: "center", position: "absolute", right: 0, shadowColor: "#4B22C8", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.26, shadowRadius: 18, width: 58 },
});