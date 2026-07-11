import { Ionicons } from "@expo/vector-icons";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import type { ClientBooking } from "@/lib/clientDashboardData";

const statusStyles = {
  Confirmed: { bg: "#ECFDF3", color: "#16A34A" },
  Pending: { bg: "#FFF4EB", color: "#F97316" },
} as const;

type Props = {
  bookings: ClientBooking[];
};

export default function UpcomingBookingsList({ bookings }: Props) {
  if (bookings.length === 0) {
    return <Text style={styles.emptyText}>No upcoming bookings yet.</Text>;
  }

  return (
    <View>
      {bookings.map((booking) => (
        <BookingRow key={booking.id} booking={booking} />
      ))}

      <TouchableOpacity style={styles.viewAllButton} activeOpacity={0.86}>
        <Ionicons name="calendar-outline" size={16} color="#5B3DF5" />
        <Text style={styles.viewAllText}>View All Bookings</Text>
      </TouchableOpacity>
    </View>
  );
}

function BookingRow({ booking }: { booking: ClientBooking }) {
  const badge = statusStyles[booking.status];

  return (
    <TouchableOpacity style={styles.row} activeOpacity={0.86}>
      <Image source={{ uri: booking.avatar }} style={styles.avatar} />
      <View style={styles.content}>
        <Text style={styles.title}>{booking.pet}</Text>
        <Text style={styles.subtitle}>{booking.service}</Text>
        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={14} color="#8A8FA3" />
          <Text style={styles.meta}>{booking.date} • {booking.time}</Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={14} color="#8A8FA3" />
          <Text style={styles.meta}>{booking.location}</Text>
        </View>
      </View>
      <View style={[styles.badge, { backgroundColor: badge.bg }]}>
        <Text style={[styles.badgeText, { color: badge.color }]}>{booking.status}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  emptyText: {
    color: "#70758E",
    fontSize: 14,
    lineHeight: 20,
    paddingVertical: 14,
  },
  row: {
    alignItems: "center",
    borderBottomColor: "#F0F2F7",
    borderBottomWidth: 1,
    flexDirection: "row",
    paddingVertical: 16,
  },
  avatar: {
    borderRadius: 27,
    height: 54,
    marginRight: 14,
    width: 54,
  },
  content: {
    flex: 1,
  },
  title: {
    color: "#1D2238",
    fontSize: 17,
    fontWeight: "700",
  },
  subtitle: {
    color: "#70758E",
    marginBottom: 8,
    marginTop: 2,
  },
  metaRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
    marginTop: 4,
  },
  meta: {
    color: "#8A8FA3",
    fontSize: 13,
  },
  badge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  viewAllButton: {
    alignItems: "center",
    backgroundColor: "#F8F3FF",
    borderRadius: 9,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    marginTop: 18,
    paddingVertical: 12,
  },
  viewAllText: {
    color: "#5B3DF5",
    fontSize: 13,
    fontWeight: "800",
  },
});