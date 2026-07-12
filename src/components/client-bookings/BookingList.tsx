import { Ionicons } from "@expo/vector-icons";
import { Image, StyleSheet, Text, View } from "react-native";

import { Booking, BookingStatus } from "@/lib/bookingData";

const statusStyles: Record<BookingStatus, { bg: string; color: string }> = {
  Confirmed: { bg: "#DDF6DC", color: "#178A22" },
  Pending: { bg: "#FFF0D8", color: "#F97316" },
  Cancelled: { bg: "#FFE5EC", color: "#E11D48" },
};

type BookingListProps = {
  bookings: Booking[];
};

export default function BookingList({ bookings }: BookingListProps) {
  return (
    <View style={styles.container}>
      {bookings.map((booking) => {
        const badge = statusStyles[booking.status];

        return (
          <View key={booking.id} style={styles.card}>
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.id}>{booking.id}</Text>
                <Text style={styles.muted}>{booking.createdAt}</Text>
              </View>

              <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                <Text style={[styles.statusText, { color: badge.color }]}>{booking.status}</Text>
              </View>
            </View>

            <View style={styles.clientRow}>
              <Image source={{ uri: booking.dogImage }} style={styles.avatar} />
              <View style={styles.clientText}>
                <Text style={styles.name}>{booking.client}</Text>
                <Text style={styles.muted}>{booking.dog} ({booking.breed})</Text>
              </View>
              <Ionicons name="ellipsis-vertical" size={21} color="#13204A" />
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailBlock}>
                <View style={styles.detailTitleRow}>
                  <Ionicons name={booking.serviceIcon} size={21} color="#5B3DF5" />
                  <Text style={styles.detailTitle}>{booking.service}</Text>
                </View>
                <Text style={styles.muted}>{booking.serviceDetail}</Text>
              </View>

              <View style={styles.detailBlock}>
                <View style={styles.detailTitleRow}>
                  <Ionicons name="time-outline" size={21} color="#5B3DF5" />
                  <Text style={styles.detailTitle}>{booking.time}</Text>
                </View>
                <Text style={styles.muted}>{booking.scheduleDay}</Text>
                <Text style={styles.muted}>{booking.duration}</Text>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  card: {
    backgroundColor: "#FFF",
    borderColor: "#ECECF5",
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 14,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  id: {
    color: "#10162F",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 4,
  },
  muted: {
    color: "#5D6485",
    fontSize: 13,
    lineHeight: 20,
  },
  statusBadge: {
    alignItems: "center",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "700",
  },
  clientRow: {
    alignItems: "center",
    flexDirection: "row",
    marginBottom: 18,
  },
  avatar: {
    borderRadius: 26,
    height: 52,
    width: 52,
  },
  clientText: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    color: "#11162B",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 5,
  },
  detailRow: {
    borderTopColor: "#ECECF5",
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 16,
  },
  detailBlock: {
    width: "48%",
  },
  detailTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  detailTitle: {
    color: "#10162F",
    flex: 1,
    fontSize: 15,
    fontWeight: "800",
  },
});