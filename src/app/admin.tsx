import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import DashboardHeader from "@/components/dashboard/DashBoardHeader";
import DashboardStats from "@/components/dashboard/DashboardStats";
import PerformanceCard from "@/components/dashboard/PerformanceCard";
import QuickActions from "@/components/dashboard/QuickActions";
import QuickActionForms from "@/components/dashboard/QuickActionForms";
import RecentActivity from "@/components/dashboard/RecentActivity";
import ScheduleCard from "@/components/dashboard/ScheduleCard";
import FloatingTabBar from "@/components/dashboard/FloatingTabBar";
import { fetchAdminDashboardData, type AdminDashboardData } from "@/lib/adminDashboardData";
import { supabase } from "@/lib/supabase";

type QuickAction = "booking" | "client" | "dog" | null;

export default function AdminScreen() {
  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeAction, setActiveAction] = useState<QuickAction>(null);
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadDashboard = useCallback(async ({ showLoading = true }: { showLoading?: boolean } = {}) => {
    if (showLoading) setIsLoading(true);
    setError(null);

    try {
      setDashboardData(await fetchAdminDashboardData());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load the admin dashboard.");
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    const refreshDashboard = () => {
      if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = setTimeout(() => loadDashboard({ showLoading: false }), 300);
    };

    const channel = supabase
      .channel("admin-dashboard")
      .on("postgres_changes", { event: "*", schema: "public", table: "portal_bookings" }, refreshDashboard)
      .on("postgres_changes", { event: "*", schema: "public", table: "portal_clients" }, refreshDashboard)
      .on("postgres_changes", { event: "*", schema: "public", table: "portal_dogs" }, refreshDashboard)
      .on("postgres_changes", { event: "*", schema: "public", table: "portal_client_activity" }, refreshDashboard)
      .subscribe();

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
      supabase.removeChannel(channel);
    };
  }, [loadDashboard]);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator color="#5B3DF5" size="large" />
        <Text style={styles.loadingText}>Loading admin dashboard...</Text>
      </View>
    );
  }

  if (error || !dashboardData) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorTitle}>Dashboard unavailable</Text>
        <Text style={styles.errorMessage}>{error || "Unable to load the admin dashboard."}</Text>
        <TouchableOpacity style={styles.retryButton} activeOpacity={0.86} onPress={() => loadDashboard()}>
          <Text style={styles.retryText}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <DashboardHeader notificationCount={dashboardData.notificationCount} />
        <QuickActions onNewBooking={() => setActiveAction("booking")} onAddClient={() => setActiveAction("client")} onAddDog={() => setActiveAction("dog")} />
        <DashboardStats stats={dashboardData.stats} />
        <ScheduleCard schedule={dashboardData.schedule} />
        <PerformanceCard bookingTrend={dashboardData.bookingTrend} revenueTrend={dashboardData.revenueTrend} />
        <RecentActivity activities={dashboardData.activities} />
      </ScrollView>

      <FloatingTabBar activeRoute="home" />
      <QuickActionForms action={activeAction} options={dashboardData.formOptions} onClose={() => setActiveAction(null)} onSaved={() => loadDashboard({ showLoading: false })} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FD" },
  content: { paddingHorizontal: 22, paddingTop: 60, paddingBottom: 130 },
  centered: { alignItems: "center", justifyContent: "center", padding: 24 },
  loadingText: { color: "#70758E", fontWeight: "600", marginTop: 14 },
  errorTitle: { color: "#1D2238", fontSize: 22, fontWeight: "700", marginBottom: 8 },
  errorMessage: { color: "#70758E", lineHeight: 22, marginBottom: 18, textAlign: "center" },
  retryButton: { backgroundColor: "#5B3DF5", borderRadius: 16, paddingHorizontal: 22, paddingVertical: 14 },
  retryText: { color: "#FFF", fontWeight: "700" },
});
