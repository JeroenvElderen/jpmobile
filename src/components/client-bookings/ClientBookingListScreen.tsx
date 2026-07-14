import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Alert, Image, Modal, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

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
  const [busyAction, setBusyAction] = useState<"Reschedule" | "Cancel" | null>(null);
  const visibleBookings = useMemo(() => bookings.slice(0, 8), [bookings]);

  const openBooking = (booking: Booking) => { setSelectedBooking(booking); setRescheduleValue(toDateTimeLocalValue(booking.startsAtIso)); };
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
    if (!startsAt || Number.isNaN(startsAt.getTime())) { Alert.alert("Invalid date", "Enter a valid date and time before saving."); return; }
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
      <Modal transparent animationType="fade" visible={Boolean(selectedBooking)} onRequestClose={closeSheet}><Pressable style={styles.modalBackdrop} onPress={closeSheet}><Pressable style={styles.actionSheet}><View style={styles.sheetHandle} /><Text style={styles.sheetTitle}>{selectedBooking?.dog}</Text><Text style={styles.sheetSubtitle}>{selectedBooking?.service} · {selectedBooking?.scheduleDay} at {selectedBooking?.time}</Text><TextInput style={styles.editInput} value={rescheduleValue} onChangeText={setRescheduleValue} placeholder="YYYY-MM-DDTHH:mm" placeholderTextColor="#8D93AA" autoCapitalize="none" /><TouchableOpacity style={styles.actionRow} activeOpacity={0.86} disabled={Boolean(busyAction)} onPress={handleReschedule}><Ionicons name="calendar-outline" size={22} color="#4B22C8" /><Text style={[styles.actionText, { color: "#4B22C8" }]}>{busyAction === "Reschedule" ? "Rescheduling..." : "Reschedule"}</Text></TouchableOpacity><TouchableOpacity style={styles.actionRow} activeOpacity={0.86} disabled={Boolean(busyAction)} onPress={handleCancel}><Ionicons name="ban-outline" size={22} color="#F97316" /><Text style={[styles.actionText, { color: "#F97316" }]}>{busyAction === "Cancel" ? "Cancelling..." : "Cancel"}</Text></TouchableOpacity></Pressable></Pressable></Modal>
    </View>
  );
}

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
  editInput: { backgroundColor: "#F8F9FD", borderColor: "#E5E7F1", borderRadius: 12, borderWidth: 1, color: "#11162B", fontSize: 14, fontWeight: "700", marginBottom: 10, paddingHorizontal: 14, paddingVertical: 12 },
  notesInput: { minHeight: 86, textAlignVertical: "top" },
  saveButton: { alignItems: "center", backgroundColor: "#4B22C8", borderRadius: 14, paddingVertical: 15 },
  saveButtonText: { color: "#FFF", fontSize: 15, fontWeight: "900" },
});