import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

export default function BookingPagination() {
  return (
    <View style={styles.container}>
      <Text style={styles.summary}>Showing 1 to 7 of 32 bookings</Text>
      <View style={styles.pages}>
        <Page icon="arrow-back" />
        <Page label="1" active />
        <Page label="2" />
        <Page label="3" />
        <Page icon="arrow-forward" />
      </View>
    </View>
  );
}

type PageProps = {
  label?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  active?: boolean;
};

function Page({ label, icon, active }: PageProps) {
  return (
    <View style={[styles.page, active && styles.activePage]}>
      {icon ? (
        <Ionicons name={icon} size={18} color="#617092" />
      ) : (
        <Text style={[styles.pageText, active && styles.activePageText]}>{label}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
    marginTop: 4,
  },
  summary: {
    color: "#5D6485",
    fontSize: 13,
    fontWeight: "500",
  },
  pages: {
    flexDirection: "row",
    gap: 10,
  },
  page: {
    alignItems: "center",
    backgroundColor: "#FFF",
    borderColor: "#ECECF5",
    borderRadius: 12,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  activePage: {
    borderColor: "#5B3DF5",
  },
  pageText: {
    color: "#243052",
    fontSize: 15,
    fontWeight: "700",
  },
  activePageText: {
    color: "#5B3DF5",
  },
});