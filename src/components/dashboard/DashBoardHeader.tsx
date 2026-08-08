import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { PageHeader } from "@/components/ui/PageHeader";

export default function DashboardHeader() {
  const todayLabel = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date());
  return (
    <View style={styles.container}>
      <PageHeader title="Dashboard" />

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