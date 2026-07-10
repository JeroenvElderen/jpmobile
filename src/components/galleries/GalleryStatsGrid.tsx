import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { galleryStats } from "@/lib/galleriesData";

export default function GalleryStatsGrid() {
  return (
    <View style={styles.grid}>
      {galleryStats.map((stat) => (
        <View key={stat.title} style={styles.card}>
          <View style={[styles.iconCircle, { backgroundColor: stat.iconBackground }]}>
            <Ionicons name={stat.icon} size={25} color={stat.iconColor} />
          </View>
          <Text style={styles.title}>{stat.title}</Text>
          <Text style={styles.value}>{stat.value}</Text>
          <View style={styles.changeRow}>
            <Ionicons name="arrow-up" size={14} color="#1FD32B" />
            <Text style={styles.change}>{stat.change}</Text>
          </View>
          <Text style={styles.caption}>from last month</Text>
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
    textAlign: "center",
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
    color: "#1FD32B",
    fontSize: 14,
    fontWeight: "700",
  },
  caption: {
    color: "#5D6485",
    fontSize: 13,
    marginTop: 2,
    textAlign: "center",
  },
});
