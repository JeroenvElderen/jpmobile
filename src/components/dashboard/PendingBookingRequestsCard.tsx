import { StyleSheet, Text, View } from "react-native";
import ScheduleItem from "./ScheduleItem";
import type { AdminScheduleItem } from "@/lib/adminDashboardData";

export default function PendingBookingRequestsCard({ requests }: { requests: AdminScheduleItem[] }) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>
          Pending Booking Requests
        </Text>
      </View>

      {requests.length ? (
        requests.map((item) => (
          <ScheduleItem
            key={item.id}
            item={item}
          />
        ))
      ) : (
        <Text style={styles.emptyText}>No pending booking requests.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFF",
    borderRadius: 22,
    padding: 22,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#ECECF5",

    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 16,
    shadowOffset: {
      width: 0,
      height: 6,
    },

    elevation: 3,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1D2238",
  },

  emptyText: {
    color: "#70758E",
    paddingVertical: 18,
  },
});