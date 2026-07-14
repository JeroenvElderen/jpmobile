import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Alert, Image, Modal, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import { cancelClientDashboardBooking, type ClientBooking } from "@/lib/clientDashboardData";
import { rescheduleClientBooking } from "@/lib/bookingData";

const statusStyles = {
  Confirmed: { bg: "#ECFDF3", color: "#16A34A" },
  Pending: { bg: "#FFF4EB", color: "#F97316" },
} as const;

type Props = { bookings: ClientBooking[]; onBookingChanged?: () => void };

export default function UpcomingBookingsList({ bookings, onBookingChanged }: Props) {
  const [selectedBooking, setSelectedBooking] = useState<ClientBooking | null>(null);
  const [rescheduleValue, setRescheduleValue] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  const openBooking = (booking: ClientBooking) => {
    setSelectedBooking(booking);
    setRescheduleValue(toDateTimeInputValue(booking.startsAtIso));
  };

  const close = () => {
    if (isBusy) return;
    setSelectedBooking(null);
    setRescheduleValue("");
  };

  const cancelBooking = () => {
    if (!selectedBooking) return;
    Alert.alert("Cancel booking", "Are you sure you want to cancel this booking?", [
      { text: "No", style: "cancel" },
      { text: "Cancel booking", style: "destructive", onPress: async () => {
        setIsBusy(true);
        try { await cancelClientDashboardBooking(selectedBooking.id); close(); onBookingChanged?.(); }
        catch (error) { Alert.alert("Cancel failed", error instanceof Error ? error.message : "Unable to cancel booking."); }
        finally { setIsBusy(false); }
      } },
    ]);
  };

  const reschedule = async () => {
    if (!selectedBooking) return;
    const startsAt = new Date(rescheduleValue.trim());
    if (!rescheduleValue.trim() || Number.isNaN(startsAt.getTime())) {
      Alert.alert("Invalid date", "Enter a valid date and time, for example 2026-07-20T14:30.");
      return;
    }
    const previousStart = selectedBooking.startsAtIso ? new Date(selectedBooking.startsAtIso) : null;
    const previousEnd = selectedBooking.endsAtIso ? new Date(selectedBooking.endsAtIso) : null;
    const endsAt = previousStart && previousEnd ? new Date(startsAt.getTime() + Math.max(0, previousEnd.getTime() - previousStart.getTime())).toISOString() : undefined;
    setIsBusy(true);
    try { await rescheduleClientBooking({ bookingId: selectedBooking.id, startsAt: startsAt.toISOString(), endsAt }); close(); onBookingChanged?.(); }
    catch (error) { Alert.alert("Reschedule failed", error instanceof Error ? error.message : "Unable to reschedule booking."); }
    finally { setIsBusy(false); }
  };

  if (bookings.length === 0) return <Text style={styles.emptyText}>No upcoming bookings yet.</Text>;

  return <View>{bookings.map((booking) => <BookingRow key={booking.id} booking={booking} onPress={() => openBooking(booking)} />)}<Modal transparent animationType="fade" visible={Boolean(selectedBooking)} onRequestClose={close}><Pressable style={styles.modalBackdrop} onPress={close}><Pressable style={styles.sheet}><View style={styles.sheetHandle} /><Text style={styles.sheetTitle}>{selectedBooking?.pet}</Text><Text style={styles.sheetSubtitle}>{selectedBooking?.service} · {selectedBooking?.date} at {selectedBooking?.time}</Text><Text style={styles.label}>New date and time</Text><TextInput style={styles.input} value={rescheduleValue} onChangeText={setRescheduleValue} placeholder="YYYY-MM-DDTHH:mm" placeholderTextColor="#8D93AA" autoCapitalize="none" /><TouchableOpacity style={styles.actionRow} disabled={isBusy} onPress={reschedule}><Ionicons name="calendar-outline" size={22} color="#4B22C8" /><Text style={[styles.actionText, { color: "#4B22C8" }]}>{isBusy ? "Saving..." : "Reschedule booking"}</Text></TouchableOpacity><TouchableOpacity style={styles.actionRow} disabled={isBusy} onPress={cancelBooking}><Ionicons name="ban-outline" size={22} color="#E53935" /><Text style={[styles.actionText, { color: "#E53935" }]}>Cancel booking</Text></TouchableOpacity></Pressable></Pressable></Modal></View>;
}

function BookingRow({ booking, onPress }: { booking: ClientBooking; onPress: () => void }) {
  const badge = statusStyles[booking.status];
  return <TouchableOpacity style={styles.row} activeOpacity={0.86} onPress={onPress}><Image source={{ uri: booking.avatar }} style={styles.avatar} /><View style={styles.content}><Text style={styles.title}>{booking.pet}</Text><Text style={styles.subtitle}>{booking.service}</Text><View style={styles.metaRow}><Ionicons name="calendar-outline" size={14} color="#8A8FA3" /><Text style={styles.meta}>{booking.date} • {booking.time}</Text></View><View style={styles.metaRow}><Ionicons name="location-outline" size={14} color="#8A8FA3" /><Text style={styles.meta}>{booking.location}</Text></View></View><View style={[styles.badge, { backgroundColor: badge.bg }]}><Text style={[styles.badgeText, { color: badge.color }]}>{booking.status}</Text></View></TouchableOpacity>;
}

function toDateTimeInputValue(value?: string) { if (!value) return ""; const date = new Date(value); if (Number.isNaN(date.getTime())) return ""; const pad = (part: number) => String(part).padStart(2, "0"); return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`; }

const styles = StyleSheet.create({
  emptyText: { color: "#70758E", fontSize: 14, lineHeight: 20, paddingVertical: 14 }, row: { alignItems: "center", borderBottomColor: "#F0F2F7", borderBottomWidth: 1, flexDirection: "row", paddingVertical: 16 }, avatar: { borderRadius: 27, height: 54, marginRight: 14, width: 54 }, content: { flex: 1 }, title: { color: "#1D2238", fontSize: 17, fontWeight: "700" }, subtitle: { color: "#70758E", marginBottom: 8, marginTop: 2 }, metaRow: { alignItems: "center", flexDirection: "row", gap: 5, marginTop: 4 }, meta: { color: "#8A8FA3", fontSize: 13 }, badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 }, badgeText: { fontSize: 12, fontWeight: "700" }, modalBackdrop: { backgroundColor: "rgba(10, 14, 32, 0.34)", flex: 1, justifyContent: "flex-end" }, sheet: { backgroundColor: "#FFF", borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingBottom: 30, paddingHorizontal: 24, paddingTop: 12 }, sheetHandle: { alignSelf: "center", backgroundColor: "#D8DBE8", borderRadius: 4, height: 5, marginBottom: 18, width: 46 }, sheetTitle: { color: "#11162B", fontSize: 22, fontWeight: "900", textAlign: "center" }, sheetSubtitle: { color: "#59617F", fontSize: 13, fontWeight: "600", marginBottom: 16, marginTop: 6, textAlign: "center" }, label: { color: "#2E2A3D", fontWeight: "800", marginBottom: 8 }, input: { backgroundColor: "#F8F9FD", borderColor: "#E5E7F1", borderRadius: 12, borderWidth: 1, color: "#11162B", fontSize: 14, fontWeight: "700", marginBottom: 10, paddingHorizontal: 14, paddingVertical: 12 }, actionRow: { alignItems: "center", borderTopColor: "#F0F1F7", borderTopWidth: 1, flexDirection: "row", gap: 14, paddingVertical: 16 }, actionText: { fontSize: 16, fontWeight: "900" },
});