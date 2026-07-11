import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

export default function BookingFilters() {
  return (
    <View style={styles.container}>
      <View style={[styles.input, styles.search]}>
        <Ionicons name="search-outline" size={22} color="#65708F" />
        <Text style={styles.placeholder} numberOfLines={1}>
          Search bookings...
        </Text>
      </View>

      <View style={[styles.input, styles.filterButton]}>
        <Ionicons name="filter-outline" size={22} color="#10162F" />
        <Text style={styles.filterText}>Filters</Text>
      </View>

      <View style={[styles.input, styles.select]}>
        <Text style={styles.selectText}>All Status</Text>
        <Ionicons name="chevron-down" size={18} color="#6E7191" />
      </View>

      <View style={[styles.input, styles.select]}>
        <Ionicons name="calendar-outline" size={18} color="#5B3DF5" />
        <Text style={styles.selectText}>20 May - 26 May</Text>
      </View>

      <View style={[styles.input, styles.select]}>
        <Text style={styles.selectText}>All Services</Text>
        <Ionicons name="chevron-down" size={18} color="#6E7191" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  input: {
    alignItems: "center",
    backgroundColor: "#FFF",
    borderColor: "#ECECF5",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    height: 54,
    marginBottom: 14,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.03,
    shadowRadius: 14,
  },
  search: {
    width: "65%",
  },
  placeholder: {
    color: "#737B9A",
    flex: 1,
    fontSize: 15,
    marginLeft: 10,
  },
  filterButton: {
    gap: 8,
    justifyContent: "center",
    width: "31%",
  },
  filterText: {
    color: "#10162F",
    fontSize: 15,
    fontWeight: "600",
  },
  select: {
    gap: 8,
    justifyContent: "space-between",
    width: "48%",
  },
  selectText: {
    color: "#374151",
    flexShrink: 1,
    fontSize: 14,
    fontWeight: "600",
  },
});