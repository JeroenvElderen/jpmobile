import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function DashboardHeader({ notificationCount = 0 }: { notificationCount?: number }) {
  const todayLabel = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date());
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons
            name="menu-outline"
            size={30}
            color="#1D2238"
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.notification}>
          <Ionicons
            name="notifications-outline"
            size={26}
            color="#1D2238"
          />

          <View style={styles.badge}>
            <Text style={styles.badgeText}>{notificationCount}</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.greeting}>
        <Text style={styles.title}>
          Good morning, Jeroen 👋
        </Text>

        <Text style={styles.subtitle}>
          Here's what's happening with your business today.
        </Text>
      </View>

      <TouchableOpacity style={styles.dateButton}>
        <Ionicons
          name="calendar-outline"
          size={18}
          color="#5B3DF5"
        />

        <Text style={styles.dateText}>
          Today, {todayLabel}
        </Text>

        <Ionicons
          name="chevron-down"
          size={18}
          color="#6E7191"
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    marginBottom: 22,
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 28,
  },

  iconButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },

  notification: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },

  badge: {
    position: "absolute",
    right: 6,
    top: 6,

    width: 18,
    height: 18,

    borderRadius: 9,

    backgroundColor: "#EF4444",

    justifyContent: "center",
    alignItems: "center",
  },

  badgeText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 10,
  },

  greeting: {
    marginBottom: 22,
  },

  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#1D2238",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 16,
    color: "#6E7191",
    lineHeight: 24,
  },

  dateButton: {
    alignSelf: "flex-end",

    flexDirection: "row",
    alignItems: "center",

    backgroundColor: "#FFF",

    borderRadius: 16,

    paddingHorizontal: 18,
    paddingVertical: 14,

    borderWidth: 1,
    borderColor: "#ECECF5",
  },

  dateText: {
    marginHorizontal: 10,
    color: "#374151",
    fontWeight: "600",
    fontSize: 15,
  },
});