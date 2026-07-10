import { StyleSheet, Text, View } from "react-native";
import ActivityItem from "./ActivityItem";

export default function RecentActivity() {
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Recent Activity</Text>

      <ActivityItem
        icon="paw-outline"
        color="#5B3DF5"
        title="New booking created"
        subtitle="Dog Walk for Milo"
        time="10:30"
      />

      <ActivityItem
        icon="checkmark-circle-outline"
        color="#16A34A"
        title="Booking completed"
        subtitle="Training Session"
        time="09:10"
      />

      <ActivityItem
        icon="cash-outline"
        color="#F97316"
        title="Invoice paid"
        subtitle="€75 received"
        time="Yesterday"
      />
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

  heading: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 10,
    color: "#1D2238",
  },
});