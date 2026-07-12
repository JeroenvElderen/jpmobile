import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { BookingStat } from "@/lib/bookingData";

type BookingStatsGridProps = {
  stats: BookingStat[];
};

export default function BookingStatsGrid({ stats }: BookingStatsGridProps) {
  return (
    <View style={styles.grid}>
      {stats.map((stat) => (
        <View key={stat.id} style={styles.card}>
          <View style={[styles.iconCircle, { backgroundColor: stat.bg }]}>
            <Ionicons name={stat.icon} size={25} color={stat.color} />
          </View>
          <Text style={styles.title}>{stat.title}</Text>
          <Text style={styles.value}>{stat.value}</Text>
          <View style={styles.changeRow}>
            <Ionicons
              name={stat.positive ? "arrow-up" : "arrow-down"}
              size={14}
              color={stat.positive ? "#1FD32B" : "#FF2D55"}
            />
            <Text
              style={[
                styles.change,
                { color: stat.positive ? "#1FD32B" : stat.color },
              ]}
            >
              {stat.change}
            </Text>
          </View>
          <Text style={styles.caption}>from last week</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  card: {
    alignItems: "center",
    backgroundColor: "#FFF",
    borderColor: "#E7E9F2",
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 18,
    padding: 18,
    shadowColor: "#111827",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.035,
    shadowRadius: 18,
    width: "48%",
  },
  iconCircle: {
    alignItems: "center",
    borderRadius: 26,
    height: 52,
    justifyContent: "center",
    marginBottom: 14,
    width: 52,
  },
  title: {
    color: "#2C3158",
    fontSize: 15,
    marginBottom: 8,
  },
  value: {
    color: "#06091A",
    fontSize: 34,
    fontWeight: "700",
  },
  changeRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
    marginTop: 9,
  },
  change: {
    fontSize: 14,
    fontWeight: "700",
  },
  caption: {
    color: "#5D6485",
    fontSize: 13,
    marginTop: 2,
  },
});