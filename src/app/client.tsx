import { ScrollView, StyleSheet, View } from "react-native";

import ClientDashboardHeader from "@/components/client-dashboard/ClientDashboardHeader";
import ClientRecentActivityList from "@/components/client-dashboard/ClientRecentActivityList";
import ClientSectionCard from "@/components/client-dashboard/ClientSectionCard";
import MyPetsList from "@/components/client-dashboard/MyPetsList";
import UpcomingBookingsList from "@/components/client-dashboard/UpcomingBookingsList";
import ClientFloatingTabBar from "@/components/client-dashboard/ClientFloatingTabBar";

export default function ClientScreen() {
  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <ClientDashboardHeader />

        <ClientSectionCard title="Upcoming bookings">
          <UpcomingBookingsList />
        </ClientSectionCard>

        <ClientSectionCard title="My pets">
          <MyPetsList />
        </ClientSectionCard>

        <ClientSectionCard title="Recent activity">
          <ClientRecentActivityList />
        </ClientSectionCard>
      </ScrollView>

      <ClientFloatingTabBar activeRoute="home" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#F8F9FD",
    flex: 1,
  },
  content: {
    paddingBottom: 130,
    paddingHorizontal: 22,
    paddingTop: 60,
  },
});