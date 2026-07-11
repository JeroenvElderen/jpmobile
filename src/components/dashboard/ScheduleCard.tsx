import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ScheduleItem from "./ScheduleItem";
import type { AdminScheduleItem } from "@/lib/adminDashboardData";

export default function ScheduleCard({ schedule }: { schedule: AdminScheduleItem[] }) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>
          Today's Schedule
        </Text>

        <TouchableOpacity>
          <Text style={styles.viewAll}>
            View All
          </Text>
        </TouchableOpacity>
      </View>

      {schedule.length ? (
        schedule.map((item) => (
          <ScheduleItem
            key={item.id}
            item={item}
          />
        ))
      ) : (
        <Text style={styles.emptyText}>No bookings scheduled for today.</Text>
      )}

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>
          View Full Schedule
        </Text>
      </TouchableOpacity>
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

  viewAll: {
    color: "#5B3DF5",
    fontWeight: "600",
  },

  emptyText: {
    color: "#70758E",
    paddingVertical: 18,
  },
  
  button: {
    marginTop: 20,
    backgroundColor: "#5B3DF5",
    borderRadius: 16,
    alignItems: "center",
    paddingVertical: 16,
  },

  buttonText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 16,
  },
});