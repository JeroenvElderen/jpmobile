import { Ionicons } from "@expo/vector-icons";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Booking, BookingStatus } from "@/lib/bookingData";

const statusStyles: Record<BookingStatus, { bg: string; color: string }> = {
  Confirmed: { bg: "#F1EAFE", color: "#3B16E8" },
  Pending: { bg: "#FFF1E7", color: "#F05A24" },
  Cancelled: { bg: "#FFECEE", color: "#E53935" },
};

export default function ClientBookingListScreen({ bookings }: { bookings: Booking[] }) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.segmentedControl}>
        <TouchableOpacity style={styles.activeSegment} activeOpacity={0.86}><Text style={styles.activeSegmentText}>Upcoming</Text></TouchableOpacity>
        <TouchableOpacity style={styles.segment} activeOpacity={0.86}><Text style={styles.segmentText}>Past</Text></TouchableOpacity>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Your Upcoming Bookings</Text>
        <TouchableOpacity style={styles.calendarLink} activeOpacity={0.86}>
          <Text style={styles.calendarText}>View calendar</Text>
          <Ionicons name="calendar" size={21} color="#3B16E8" />
        </TouchableOpacity>
      </View>

      {bookings.slice(0, 4).map((booking) => <ClientBookingCard key={booking.id} booking={booking} />)}

      <InfoCard icon="calendar-outline" title="Need to make a change?" copy="You can reschedule or cancel your booking." tinted />
      <InfoCard icon="shield-checkmark-outline" title="Peace of mind" copy="Your pet's safety and happiness are our top priorities. Learn more about our care guarantee." />
    </View>
  );
}

function ClientBookingCard({ booking }: { booking: Booking }) {
  const startsAt = booking.startsAtIso ? new Date(booking.startsAtIso) : null;
  const badge = statusStyles[booking.status];

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.9}>
      <View style={styles.dateTile}>
        <Text style={styles.month}>{startsAt ? new Intl.DateTimeFormat("en-US", { month: "short" }).format(startsAt).toUpperCase() : "TBC"}</Text>
        <Text style={styles.day}>{startsAt ? startsAt.getDate() : "--"}</Text>
        <Text style={styles.weekday}>{startsAt ? new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(startsAt).toUpperCase() : ""}</Text>
      </View>

      <Image source={{ uri: booking.dogImage }} style={styles.avatar} />

      <View style={styles.details}>
        <Text style={styles.petName}>{booking.dog}</Text>
        <View style={styles.inlineRow}><Ionicons name={booking.serviceIcon} size={18} color="#4B22C8" /><Text style={styles.serviceText}>{booking.service}</Text></View>
        <View style={styles.inlineRow}><Ionicons name="time-outline" size={18} color="#334064" /><Text style={styles.metaText}>{formatTimeRange(booking)}</Text></View>
        <View style={styles.inlineRow}><Ionicons name="location-outline" size={18} color="#334064" /><Text style={styles.metaText}>{booking.breed || "At your home"}</Text></View>
      </View>

      <View style={styles.trailing}>
        <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}><Text style={[styles.statusText, { color: badge.color }]}>{booking.status}</Text></View>
        <Ionicons name="chevron-forward" size={24} color="#26325E" />
      </View>
    </TouchableOpacity>
  );
}

function InfoCard({ icon, title, copy, tinted = false }: { icon: keyof typeof Ionicons.glyphMap; title: string; copy: string; tinted?: boolean }) {
  return (
    <TouchableOpacity style={[styles.infoCard, tinted && styles.tintedInfo]} activeOpacity={0.9}>
      <View style={styles.infoIcon}><Ionicons name={icon} size={28} color="#3B16E8" /></View>
      <View style={styles.infoTextWrap}>
        <Text style={styles.infoTitle}>{title}</Text>
        <Text style={styles.infoCopy}>{copy}</Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#26325E" />
    </TouchableOpacity>
  );
}

function formatTimeRange(booking: Booking) {
  if (!booking.endsAtIso) return booking.time;
  const end = new Date(booking.endsAtIso);
  return `${booking.time} – ${new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(end)}`;
}

const styles = StyleSheet.create({
  wrapper: { gap: 20 },
  segmentedControl: { backgroundColor: "#FFF", borderColor: "#E1E4F0", borderRadius: 14, borderWidth: 1, flexDirection: "row", paddingTop: 6 },
  segment: { alignItems: "center", flex: 1, paddingBottom: 15, paddingTop: 14 },
  activeSegment: { alignItems: "center", borderBottomColor: "#3B16E8", borderBottomWidth: 3, flex: 1, paddingBottom: 15, paddingTop: 14 },
  segmentText: { color: "#26325E", fontSize: 18, fontWeight: "800" },
  activeSegmentText: { color: "#3B16E8", fontSize: 18, fontWeight: "900" },
  sectionHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginTop: 26 },
  sectionTitle: { color: "#080D20", fontSize: 21, fontWeight: "900" },
  calendarLink: { alignItems: "center", flexDirection: "row", gap: 8 },
  calendarText: { color: "#3B16E8", fontSize: 15, fontWeight: "900" },
  card: { alignItems: "center", backgroundColor: "#FFF", borderColor: "#EFF0F6", borderRadius: 16, borderWidth: 1, flexDirection: "row", gap: 14, padding: 16, shadowColor: "#756BBD", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.06, shadowRadius: 18 },
  dateTile: { alignItems: "center", backgroundColor: "#F3F0FC", borderRadius: 8, paddingVertical: 14, width: 72 },
  month: { color: "#285DBE", fontSize: 14, fontWeight: "900" },
  day: { color: "#080D20", fontSize: 34, fontWeight: "900", lineHeight: 42 },
  weekday: { color: "#334064", fontSize: 14, fontWeight: "900" },
  avatar: { borderRadius: 34, height: 68, width: 68 },
  details: { flex: 1, gap: 7 },
  petName: { color: "#080D20", fontSize: 22, fontWeight: "900", marginBottom: 2 },
  inlineRow: { alignItems: "center", flexDirection: "row", gap: 10 },
  serviceText: { color: "#334064", fontSize: 15, fontWeight: "800" },
  metaText: { color: "#334064", flex: 1, fontSize: 14, fontWeight: "700" },
  trailing: { alignItems: "center", alignSelf: "stretch", justifyContent: "space-between" },
  statusBadge: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 9 },
  statusText: { fontSize: 14, fontWeight: "900" },
  infoCard: { alignItems: "center", backgroundColor: "#FFF", borderColor: "#E7E9F4", borderRadius: 16, borderWidth: 1, flexDirection: "row", gap: 16, padding: 20 },
  tintedInfo: { backgroundColor: "#F7F1FF" },
  infoIcon: { alignItems: "center", backgroundColor: "#F1EAFE", borderRadius: 28, height: 56, justifyContent: "center", width: 56 },
  infoTextWrap: { flex: 1 },
  infoTitle: { color: "#17203E", fontSize: 16, fontWeight: "900", marginBottom: 6 },
  infoCopy: { color: "#334064", fontSize: 14, fontWeight: "700", lineHeight: 22 },
});