import DashboardHeader from "@/components/dashboard/DashBoardHeader";
import DashboardStats from "@/components/dashboard/DashboardStats";
import PerformanceCard from "@/components/dashboard/PerformanceCard";
import QuickActions from "@/components/dashboard/QuickActions";
import RecentActivity from "@/components/dashboard/RecentActivity";
import ScheduleCard from "@/components/dashboard/ScheduleCard";
import FloatingTabBar from "@/components/dashboard/FloatingTabBar";
import { View, ScrollView, StyleSheet } from "react-native";

export default function AdminScreen() {
  return (
     <View style={{ flex: 1, backgroundColor: "#F8F9FD" }}>
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: 22,
        paddingTop: 60,
        paddingBottom: 130,
      }}
    >
      <DashboardHeader />
      <DashboardStats />
      <ScheduleCard />
      <PerformanceCard />
      <QuickActions />
      <RecentActivity />
    </ScrollView>

    <FloatingTabBar />
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
    paddingBottom: 40,
  },
});
