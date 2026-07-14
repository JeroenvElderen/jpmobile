import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import { Booking, BookingStat, BookingStatus, cancelClientBooking, rescheduleClientBooking } from "@/lib/bookingData";

const statusStyles: Record<BookingStatus, { bg: string; color: string; icon: keyof typeof Ionicons.glyphMap }> = {
  Confirmed: { bg: "#EAF8EF", color: "#178A3B", icon: "checkmark-circle-outline" },
  Pending: { bg: "#FFF1E7", color: "#F97316", icon: "time-outline" },
  Cancelled: { bg: "#FFECEE", color: "#E53935", icon: "close-circle-outline" },
};

type ClientBookingListScreenProps = { bookings: Booking[]; stats: BookingStat[]; onBookingChanged?: () => void; };

export default function ClientBookingListScreen({ bookings, stats, onBookingChanged }: ClientBookingListScreenProps) {
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [rescheduleValue, setRescheduleValue] = useState("");
  const [calendarMonth, setCalendarMonth] = useState(() => startOfMonth(new Date()));
  const [busyAction, setBusyAction] = useState<"Reschedule" | "Cancel" | null>(null);
  const visibleBookings = useMemo(() => bookings.slice(0, 8), [bookings]);

  const openBooking = (booking: Booking) => { const value = toDateTimeLocalValue(booking.startsAtIso); setSelectedBooking(booking); setRescheduleValue(value); setCalendarMonth(startOfMonth(value ? new Date(value) : new Date())); };
  const closeSheet = () => { if (!busyAction) setSelectedBooking(null); };
  const refreshAfterChange = () => { setSelectedBooking(null); onBookingChanged?.(); };

  const handleCancel = () => {
    if (!selectedBooking || busyAction) return;
    Alert.alert("Cancel booking", "Cancel this booking? It will be marked for review.", [
      { text: "No", style: "cancel" },
      { text: "Cancel booking", style: "destructive", onPress: async () => {
        setBusyAction("Cancel");
        try { await cancelClientBooking(selectedBooking.rawId); refreshAfterChange(); }
        catch (error) { Alert.alert("Cancel failed", error instanceof Error ? error.message : "Unable to cancel booking."); }
        finally { setBusyAction(null); }
      } },
    ]);
  };

  const handleReschedule = async () => {
    if (!selectedBooking || busyAction) return;
    const startsAt = rescheduleValue.trim() ? new Date(rescheduleValue.trim()) : null;
    if (!startsAt || Number.isNaN(startsAt.getTime())) { Alert.alert("Invalid date", "Choose a valid date and time before saving."); return; }
    if (!isAllowedBookingDate(startsAt)) { Alert.alert("Invalid date", "Please choose a date in the current year or next year."); return; }
    const oldStart = selectedBooking.startsAtIso ? new Date(selectedBooking.startsAtIso) : null;
    const oldEnd = selectedBooking.endsAtIso ? new Date(selectedBooking.endsAtIso) : null;
    const endsAt = oldStart && oldEnd ? new Date(startsAt.getTime() + Math.max(0, oldEnd.getTime() - oldStart.getTime())).toISOString() : undefined;
    setBusyAction("Reschedule");
    try { await rescheduleClientBooking({ bookingId: selectedBooking.rawId, startsAt: startsAt.toISOString(), endsAt }); refreshAfterChange(); }
    catch (error) { Alert.alert("Reschedule failed", error instanceof Error ? error.message : "Unable to reschedule booking."); }
    finally { setBusyAction(null); }
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.tabsRow}><TouchableOpacity style={styles.activeTab} activeOpacity={0.86}><Text style={styles.activeTabText}>All Bookings</Text></TouchableOpacity><TouchableOpacity style={styles.tab} activeOpacity={0.86}><Text style={styles.tabText}>Calendar View</Text></TouchableOpacity></View>
      <View style={styles.searchRow}><View style={styles.searchBox}><Ionicons name="search-outline" size={20} color="#687092" /><TextInput placeholder="Search bookings..." placeholderTextColor="#8D93AA" style={styles.searchInput} /></View><TouchableOpacity style={styles.filterButton} activeOpacity={0.86}><Ionicons name="filter-outline" size={19} color="#1F2756" /><Text style={styles.filterText}>Filter</Text></TouchableOpacity></View>
      <View style={styles.statsGrid}>{stats.map((stat) => <View key={stat.id} style={styles.statCard}><View style={[styles.statIcon, { backgroundColor: stat.bg }]}><Ionicons name={stat.icon} size={24} color={stat.color} /></View><View><Text style={styles.statTitle}>{stat.title.replace("Total Bookings", "Today")}</Text><Text style={styles.statValue}>{stat.value}</Text><Text style={styles.statCaption}>Bookings</Text></View></View>)}</View>
      <View style={styles.tableCard}><View style={styles.tableHeaderRow}><Text style={styles.tableTitle}>All Bookings</Text><TouchableOpacity style={styles.sortButton} activeOpacity={0.86}><Text style={styles.sortText}>Sort by: Date</Text><Ionicons name="chevron-down" size={16} color="#1F2756" /></TouchableOpacity></View>
      {visibleBookings.map((booking) => { const status = statusStyles[booking.status]; return <TouchableOpacity key={booking.id} style={styles.bookingRow} activeOpacity={0.9} onPress={() => openBooking(booking)}><View style={styles.bookingTopRow}><Image source={{ uri: booking.dogImage }} style={styles.avatar} /><View style={styles.petColumn}><Text style={styles.petName}>{booking.dog}</Text><Text style={styles.clientName}>{booking.client}</Text><Text style={styles.muted} numberOfLines={1}>{booking.breed}</Text></View><View style={[styles.statusBadge, { backgroundColor: status.bg }]}><Ionicons name={status.icon} size={14} color={status.color} /><Text style={[styles.statusText, { color: status.color }]}>{booking.status}</Text></View><View style={styles.moreButton}><Ionicons name="ellipsis-horizontal" size={22} color="#162044" /></View></View><View style={styles.bookingDetailsGrid}><View style={styles.detailTile}><Text style={styles.detailLabel}>Booking</Text><Text style={styles.bookingId}>{booking.id}</Text><Text style={styles.muted}>{booking.createdAt}</Text></View><View style={styles.detailTile}><Text style={styles.detailLabel}>Service</Text><View style={styles.inlineRow}><Ionicons name={booking.serviceIcon} size={18} color="#5B3DF5" /><Text style={styles.serviceText}>{booking.service}</Text></View><Text style={styles.muted}>{booking.duration}</Text></View><View style={styles.detailTileWide}><Text style={styles.detailLabel}>Date & time</Text><Text style={styles.dateText}>{booking.scheduleDay}</Text><Text style={styles.dateText}>{booking.time}</Text></View></View></TouchableOpacity>; })}</View>
      <Modal transparent animationType="fade" visible={Boolean(selectedBooking)} onRequestClose={closeSheet}><Pressable style={styles.modalBackdrop} onPress={closeSheet}><Pressable style={styles.actionSheet}><View style={styles.sheetHandle} /><Text style={styles.sheetTitle}>{selectedBooking?.dog}</Text><Text style={styles.sheetSubtitle}>{selectedBooking?.service} · {selectedBooking?.scheduleDay} at {selectedBooking?.time}</Text><DateTimeChooser value={rescheduleValue} calendarMonth={calendarMonth} onMonthChange={setCalendarMonth} onChange={setRescheduleValue} /><TouchableOpacity style={styles.actionRow} activeOpacity={0.86} disabled={Boolean(busyAction)} onPress={handleReschedule}><Ionicons name="calendar-outline" size={22} color="#4B22C8" /><Text style={[styles.actionText, { color: "#4B22C8" }]}>{busyAction === "Reschedule" ? "Rescheduling..." : "Reschedule"}</Text></TouchableOpacity><TouchableOpacity style={styles.actionRow} activeOpacity={0.86} disabled={Boolean(busyAction)} onPress={handleCancel}><Ionicons name="ban-outline" size={22} color="#F97316" /><Text style={[styles.actionText, { color: "#F97316" }]}>{busyAction === "Cancel" ? "Cancelling..." : "Cancel"}</Text></TouchableOpacity></Pressable></Pressable></Modal>
    </View>
  );
}

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const timeOptions = Array.from({ length: 96 }, (_, index) => { const hours = Math.floor(index / 4); const minutes = (index % 4) * 15; return { hours, minutes, label: formatTimeLabel(hours, minutes) }; });

function DateTimeChooser({ value, calendarMonth, onMonthChange, onChange }: { value: string; calendarMonth: Date; onMonthChange: (date: Date) => void; onChange: (value: string) => void }) {
  const selected = value ? new Date(value) : new Date();
  const selectedDate = Number.isNaN(selected.getTime()) ? new Date() : selected;
  const days = buildCalendarDays(calendarMonth);
  const canGoPrevious = calendarMonth.getFullYear() > new Date().getFullYear() || calendarMonth.getMonth() > 0;
  const canGoNext = calendarMonth.getFullYear() < new Date().getFullYear() + 1 || calendarMonth.getMonth() < 11;
  const selectedTime = selectedDate.getHours() * 60 + selectedDate.getMinutes();

  const updateDate = (date: Date) => onChange(toDateTimeLocalValue(new Date(date.getFullYear(), date.getMonth(), date.getDate(), selectedDate.getHours(), selectedDate.getMinutes()).toISOString()));
  const updateTime = (hours: number, minutes: number) => onChange(toDateTimeLocalValue(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), hours, minutes).toISOString()));

  return <View style={styles.pickerCard}><View style={styles.calendarHeader}><TouchableOpacity style={[styles.monthButton, !canGoPrevious && styles.monthButtonDisabled]} disabled={!canGoPrevious} onPress={() => onMonthChange(addMonths(calendarMonth, -1))}><Ionicons name="chevron-back" size={18} color={canGoPrevious ? "#3B16E8" : "#B7BCD0"} /></TouchableOpacity><Text style={styles.monthTitle}>{monthNames[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}</Text><TouchableOpacity style={[styles.monthButton, !canGoNext && styles.monthButtonDisabled]} disabled={!canGoNext} onPress={() => onMonthChange(addMonths(calendarMonth, 1))}><Ionicons name="chevron-forward" size={18} color={canGoNext ? "#3B16E8" : "#B7BCD0"} /></TouchableOpacity></View><View style={styles.weekRow}>{weekdayNames.map((day) => <Text key={day} style={styles.weekday}>{day}</Text>)}</View><View style={styles.dayGrid}>{days.map((date, index) => { const active = sameDay(date, selectedDate); const available = isAllowedBookingDate(date) && date.getMonth() === calendarMonth.getMonth(); return <TouchableOpacity key={`${date.toISOString()}-${index}`} style={[styles.dayCell, active && styles.dayCellActive, !available && styles.dayCellDisabled]} disabled={!available} onPress={() => updateDate(date)}><Text style={[styles.dayText, active && styles.dayTextActive, !available && styles.dayTextDisabled]}>{date.getDate()}</Text></TouchableOpacity>; })}</View><Text style={styles.timePickerLabel}>Start time</Text><View style={styles.timeWheel}><View style={styles.timeWheelHighlight} /><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.timeScroller}>{timeOptions.map((option) => { const active = option.hours * 60 + option.minutes === selectedTime; return <TouchableOpacity key={option.label} style={styles.timeWheelRow} onPress={() => updateTime(option.hours, option.minutes)}><Text style={[styles.timeWheelText, active && styles.timeWheelTextActive]}>{option.label}</Text></TouchableOpacity>; })}</ScrollView></View></View>;
}

function buildCalendarDays(month: Date) { const first = startOfMonth(month); const start = new Date(first); start.setDate(first.getDate() - first.getDay()); return Array.from({ length: 42 }, (_, index) => { const day = new Date(start); day.setDate(start.getDate() + index); return day; }); }
function startOfMonth(date: Date) { return new Date(date.getFullYear(), date.getMonth(), 1); }
function addMonths(date: Date, amount: number) { return new Date(date.getFullYear(), date.getMonth() + amount, 1); }
function sameDay(a: Date, b: Date) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
function isAllowedBookingDate(date: Date) { const year = new Date().getFullYear(); return date.getFullYear() === year || date.getFullYear() === year + 1; }
function formatTimeLabel(hours: number, minutes: number) { const suffix = hours >= 12 ? "PM" : "AM"; const displayHour = hours % 12 || 12; return `${displayHour}:${String(minutes).padStart(2, "0")} ${suffix}`; }

function toDateTimeLocalValue(value?: string) { if (!value) return ""; const date = new Date(value); if (Number.isNaN(date.getTime())) return ""; const pad = (part: number) => String(part).padStart(2, "0"); return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`; }

const styles = StyleSheet.create({
  wrapper: { gap: 18 },
  tabsRow: { flexDirection: "row", gap: 26 },
  tab: { paddingHorizontal: 8, paddingVertical: 12 },
  activeTab: { borderBottomColor: "#4B22C8", borderBottomWidth: 2, paddingHorizontal: 8, paddingVertical: 12 },
  tabText: { color: "#334064", fontWeight: "700" },
  activeTabText: { color: "#3B16E8", fontWeight: "800" },
  searchRow: { flexDirection: "row", gap: 12 },
  searchBox: { alignItems: "center", backgroundColor: "#FFF", borderColor: "#E5E7F1", borderRadius: 12, borderWidth: 1, flex: 1, flexDirection: "row", gap: 10, paddingHorizontal: 14 },
  searchInput: { color: "#11162B", flex: 1, fontSize: 14, paddingVertical: 12 },
  filterButton: { alignItems: "center", backgroundColor: "#FFF", borderColor: "#E5E7F1", borderRadius: 12, borderWidth: 1, flexDirection: "row", gap: 8, paddingHorizontal: 14 },
  filterText: { color: "#1F2756", fontWeight: "800" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  statCard: { alignItems: "center", backgroundColor: "#FFF", borderColor: "#ECECF5", borderRadius: 16, borderWidth: 1, flexDirection: "row", gap: 12, padding: 16, width: "48%" },
  statIcon: { alignItems: "center", borderRadius: 18, height: 50, justifyContent: "center", width: 50 },
  statTitle: { color: "#3B4263", fontSize: 12, fontWeight: "700" },
  statValue: { color: "#11162B", fontSize: 24, fontWeight: "900" },
  statCaption: { color: "#3B4263", fontSize: 12, fontWeight: "600" },
  tableCard: { backgroundColor: "#FFF", borderColor: "#ECECF5", borderRadius: 18, borderWidth: 1, paddingBottom: 6 },
  tableHeaderRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", padding: 18 },
  tableTitle: { color: "#11162B", fontSize: 19, fontWeight: "900" },
  sortButton: { alignItems: "center", borderColor: "#E5E7F1", borderRadius: 10, borderWidth: 1, flexDirection: "row", gap: 6, paddingHorizontal: 10, paddingVertical: 9 },
  sortText: { color: "#38405F", fontSize: 12, fontWeight: "700" },
  bookingRow: { borderTopColor: "#ECECF5", borderTopWidth: 1, gap: 16, padding: 16 },
  bookingTopRow: { alignItems: "center", flexDirection: "row", gap: 12 },
  bookingDetailsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  detailTile: { backgroundColor: "#F8F9FD", borderRadius: 14, flex: 1, minWidth: 132, padding: 12 },
  detailTileWide: { backgroundColor: "#F8F9FD", borderRadius: 14, padding: 12, width: "100%" },
  detailLabel: { color: "#8A90A8", fontSize: 11, fontWeight: "900", letterSpacing: 0.5, marginBottom: 6, textTransform: "uppercase" },
  bookingId: { color: "#11162B", fontSize: 12, fontWeight: "900", marginBottom: 5 },
  muted: { color: "#59617F", fontSize: 12, lineHeight: 18 },
  avatar: { borderRadius: 30, height: 60, width: 60 },
  petColumn: { flex: 1 },
  petName: { color: "#11162B", fontSize: 18, fontWeight: "900", marginBottom: 3 },
  clientName: { color: "#273057", fontSize: 13, fontWeight: "800", marginBottom: 2 },
  inlineRow: { alignItems: "center", flexDirection: "row", gap: 6, marginBottom: 5 },
  serviceText: { color: "#11162B", flex: 1, fontSize: 12, fontWeight: "800" },
  dateText: { color: "#273057", fontSize: 14, fontWeight: "800", lineHeight: 21 },
  statusBadge: { alignItems: "center", borderRadius: 10, flexDirection: "row", gap: 5, paddingHorizontal: 10, paddingVertical: 8 },
  statusText: { fontSize: 11, fontWeight: "900" },
  moreButton: { alignItems: "center", borderColor: "#E1E4EF", borderRadius: 10, borderWidth: 1, height: 40, justifyContent: "center", width: 40 },
  modalBackdrop: { backgroundColor: "rgba(10, 14, 32, 0.34)", flex: 1, justifyContent: "flex-end" },
  actionSheet: { backgroundColor: "#FFF", borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingBottom: 30, paddingHorizontal: 24, paddingTop: 12 },
  sheetHandle: { alignSelf: "center", backgroundColor: "#D8DBE8", borderRadius: 4, height: 5, marginBottom: 18, width: 46 },
  sheetTitle: { color: "#11162B", fontSize: 22, fontWeight: "900", textAlign: "center" },
  sheetSubtitle: { color: "#59617F", fontSize: 13, fontWeight: "600", marginBottom: 16, marginTop: 6, textAlign: "center" },
  actionRow: { alignItems: "center", borderTopColor: "#F0F1F7", borderTopWidth: 1, flexDirection: "row", gap: 14, paddingVertical: 16 },
  actionText: { fontSize: 16, fontWeight: "900" },
  pickerCard: { backgroundColor: "#F8F9FD", borderColor: "#E5E7F1", borderRadius: 18, borderWidth: 1, marginBottom: 10, padding: 14 },
  calendarHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  monthButton: { alignItems: "center", backgroundColor: "#FFF", borderColor: "#E5E7F1", borderRadius: 12, borderWidth: 1, height: 36, justifyContent: "center", width: 36 },
  monthButtonDisabled: { backgroundColor: "#F0F1F7" },
  monthTitle: { color: "#11162B", fontSize: 16, fontWeight: "900" },
  weekRow: { flexDirection: "row", marginBottom: 6 },
  weekday: { color: "#8A90A8", flex: 1, fontSize: 11, fontWeight: "900", textAlign: "center" },
  dayGrid: { flexDirection: "row", flexWrap: "wrap" },
  dayCell: { alignItems: "center", borderRadius: 10, height: 34, justifyContent: "center", width: "14.285%" },
  dayCellActive: { backgroundColor: "#4B22C8" },
  dayCellDisabled: { opacity: 0.32 },
  dayText: { color: "#273057", fontSize: 13, fontWeight: "800" },
  dayTextActive: { color: "#FFF" },
  dayTextDisabled: { color: "#8A90A8" },
  timePickerLabel: { color: "#2E2A3D", fontSize: 12, fontWeight: "900", letterSpacing: 0.5, marginTop: 14, textTransform: "uppercase" },
  timeWheel: { height: 138, marginTop: 10, overflow: "hidden", position: "relative" },
  timeWheelHighlight: { backgroundColor: "rgba(75, 34, 200, 0.08)", borderRadius: 16, height: 42, left: 0, position: "absolute", right: 0, top: 48 },
  timeScroller: { paddingVertical: 48 },
  timeWheelRow: { alignItems: "center", height: 42, justifyContent: "center" },
  timeWheelText: { color: "#B7BCD0", fontSize: 18, fontWeight: "800" },
  timeWheelTextActive: { color: "#273057", fontSize: 20 },
  editInput: { backgroundColor: "#F8F9FD", borderColor: "#E5E7F1", borderRadius: 12, borderWidth: 1, color: "#11162B", fontSize: 14, fontWeight: "700", marginBottom: 10, paddingHorizontal: 14, paddingVertical: 12 },
  notesInput: { minHeight: 86, textAlignVertical: "top" },
  saveButton: { alignItems: "center", backgroundColor: "#4B22C8", borderRadius: 14, paddingVertical: 15 },
  saveButtonText: { color: "#FFF", fontSize: 15, fontWeight: "900" },
});