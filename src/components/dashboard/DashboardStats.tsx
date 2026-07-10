import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import StatCard from "./StatCard";

type Stat = {
  title: string;
  value: string;
  change: string;
  positive: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBackground: string;
};

const stats: Stat[] = [
  {
    title: "Total Bookings",
    value: "32",
    change: "12%",
    positive: true,
    icon: "calendar-outline",
    iconColor: "#5B3DF5",
    iconBackground: "#F3EEFF",
  },
  {
    title: "Pending",
    value: "5",
    change: "8%",
    positive: false,
    icon: "time-outline",
    iconColor: "#F97316",
    iconBackground: "#FFF5EB",
  },
  {
    title: "Completed",
    value: "23",
    change: "15%",
    positive: true,
    icon: "checkmark-circle-outline",
    iconColor: "#16A34A",
    iconBackground: "#ECFDF3",
  },
  {
    title: "Total Earnings",
    value: "€1,250",
    change: "18%",
    positive: true,
    icon: "cash-outline",
    iconColor: "#5B3DF5",
    iconBackground: "#F3EEFF",
  },
];

export default function DashboardStats() {
  return (
    <View style={styles.container}>
      {stats.map((item) => (
        <StatCard
          key={item.title}
          {...item}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 24,
  },
});