import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import type { ClientActivity } from "@/lib/clientDashboardData";

type Props = {
  activities: ClientActivity[];
};

export default function ClientRecentActivityList({ activities }: Props) {
  if (activities.length === 0) {
    return <Text style={styles.emptyText}>No recent activity yet.</Text>;
  }

  return (
    <View>
      {activities.map((activity) => (
        <ActivityRow key={activity.id} activity={activity} />
      ))}
    </View>
  );
}

function ActivityRow({ activity }: { activity: ClientActivity }) {
  return (
    <View style={styles.row}>
      <View style={[styles.icon, { backgroundColor: `${activity.color}20` }]}>
        <Ionicons name={activity.icon} size={22} color={activity.color} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{activity.title}</Text>
        <Text style={styles.subtitle}>{activity.subtitle}</Text>
      </View>
      <Text style={styles.time}>{activity.time}</Text>
    </View>
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
    borderBottomColor: "#F2F2F7",
    borderBottomWidth: 1,
    flexDirection: "row",
    paddingVertical: 14,
  },
  icon: {
    alignItems: "center",
    borderRadius: 23,
    height: 46,
    justifyContent: "center",
    marginRight: 14,
    width: 46,
  },
  content: {
    flex: 1,
  },
  title: {
    color: "#1D2238",
    fontWeight: "700",
  },
  subtitle: {
    color: "#70758E",
    marginTop: 3,
  },
  time: {
    color: "#9CA3AF",
    fontSize: 12,
  },
});