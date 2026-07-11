import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function ClientDashboardHeader() {
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <TouchableOpacity style={styles.iconButton} activeOpacity={0.8}>
          <Ionicons name="menu-outline" size={30} color="#1D2238" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.notification} activeOpacity={0.8}>
          <Ionicons name="notifications-outline" size={26} color="#1D2238" />
          <View style={styles.badge}>
            <Text style={styles.badgeText}>2</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.greeting}>
        <Text style={styles.title}>Good morning, Sarah 👋</Text>
        <Text style={styles.subtitle}>
          Here&apos;s what&apos;s coming up for your pets.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 22,
    marginTop: 12,
  },
  topRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 28,
  },
  iconButton: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  notification: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  badge: {
    alignItems: "center",
    backgroundColor: "#EF4444",
    borderRadius: 9,
    height: 18,
    justifyContent: "center",
    position: "absolute",
    right: 6,
    top: 6,
    width: 18,
  },
  badgeText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "700",
  },
  greeting: {
    marginBottom: 2,
  },
  title: {
    color: "#1D2238",
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    color: "#6E7191",
    fontSize: 16,
    lineHeight: 24,
  },
});