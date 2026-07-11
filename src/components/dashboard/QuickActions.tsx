import { StyleSheet, Text, View } from "react-native";
import QuickAction from "./QuickAction";

export default function QuickActions({ onNewBooking, onAddClient, onAddDog }: { onNewBooking?: () => void; onAddClient?: () => void; onAddDog?: () => void }) {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Quick Actions</Text>

      <View style={styles.grid}>
        <QuickAction
          title="New Booking"
          icon="calendar-outline"
          color="#5B3DF5"
          background="#F3EEFF"
          onPress={onNewBooking}
        />

        <QuickAction
          title="Add Client"
          icon="person-add-outline"
          color="#0EA5E9"
          background="#EAF7FF"
          onPress={onAddClient}
        />

        <QuickAction
          title="Add Dog"
          icon="paw-outline"
          color="#16A34A"
          background="#ECFDF3"
          onPress={onAddDog}
        />

        <QuickAction
          title="Create Invoice"
          icon="document-text-outline"
          color="#F97316"
          background="#FFF5EB"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 26,
  },

  heading: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1D2238",
    marginBottom: 18,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
});