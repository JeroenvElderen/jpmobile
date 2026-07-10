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
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <DashboardHeader />
        <DashboardStats />
        <ScheduleCard />
        <PerformanceCard />
        <QuickActions />
        <RecentActivity />
      </ScrollView>

      <FloatingTabBar activeRoute="home" />
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
    paddingBottom: 130,
  },
});
