import { StyleSheet, Text, View } from "react-native";
import ActivityItem from "./ActivityItem";
import type { AdminActivityItem } from "@/lib/adminDashboardData";

export default function RecentActivity({ activities }: { activities: AdminActivityItem[] }) {
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Recent Activity</Text>

      {activities.length ? (
        activities.map((activity) => <ActivityItem key={activity.id} {...activity} />)
      ) : (
        <Text style={styles.emptyText}>No recent activity yet.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFF",
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: "#ECECF5",
    marginBottom: 24,
  },

  emptyText: {
    color: "#70758E",
    paddingVertical: 14,
  },
  
  heading: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 10,
    color: "#1D2238",
  },
});