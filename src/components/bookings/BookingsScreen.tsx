import { ScrollView, StyleSheet, View } from "react-native";

import FloatingTabBar from "@/components/dashboard/FloatingTabBar";
import BookingFilters from "./BookingFilters";
import BookingList from "./BookingList";
import BookingPagination from "./BookingPagination";
import BookingsHeader from "./BookingsHeader";
import BookingStatsGrid from "./BookingStatsGrid";

export default function BookingsScreen() {
  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <BookingsHeader />
        <BookingStatsGrid />
        <BookingFilters />
        <BookingList />
        <BookingPagination />
      </ScrollView>

      <FloatingTabBar activeRoute="bookings" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FD",
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 60,
    paddingBottom: 142,
  },
});
