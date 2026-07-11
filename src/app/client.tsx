import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import ClientDashboardHeader from "@/components/client-dashboard/ClientDashboardHeader";
import ClientRecentActivityList from "@/components/client-dashboard/ClientRecentActivityList";
import ClientSectionCard from "@/components/client-dashboard/ClientSectionCard";
import MyPetsList from "@/components/client-dashboard/MyPetsList";
import UpcomingBookingsList from "@/components/client-dashboard/UpcomingBookingsList";
import ClientFloatingTabBar from "@/components/client-dashboard/ClientFloatingTabBar";
import { fetchClientDashboardData, type ClientDashboardData } from "@/lib/clientDashboardData";
import { supabase } from "@/lib/supabase";

export default function ClientScreen() {
  const [dashboardData, setDashboardData] = useState<ClientDashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadDashboard = useCallback(async ({ showLoading = true }: { showLoading?: boolean } = {}) => {
    if (showLoading) {
      setIsLoading(true);
    }

    setError(null);

    try {
      const data = await fetchClientDashboardData();
      setDashboardData(data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load your dashboard.");
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    if (!dashboardData?.clientId) {
      return undefined;
    }

    const refreshDashboard = () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }

      refreshTimeoutRef.current = setTimeout(() => {
        loadDashboard({ showLoading: false });
      }, 300);
    };

    const channel = supabase
      .channel(`client-dashboard-${dashboardData.clientId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "portal_clients",
          filter: `id=eq.${dashboardData.clientId}`,
        },
        refreshDashboard,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "portal_dogs",
          filter: `client_id=eq.${dashboardData.clientId}`,
        },
        refreshDashboard,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "portal_bookings",
          filter: `client_id=eq.${dashboardData.clientId}`,
        },
        refreshDashboard,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "portal_client_activity",
          filter: `client_id=eq.${dashboardData.clientId}`,
        },
        refreshDashboard,
      )
      .subscribe();

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }

      supabase.removeChannel(channel);
    };
  }, [dashboardData?.clientId, loadDashboard]);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator color="#5B3DF5" size="large" />
        <Text style={styles.loadingText}>Loading your dashboard...</Text>
      </View>
    );
  }

  if (error || !dashboardData) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorTitle}>Dashboard unavailable</Text>
        <Text style={styles.errorMessage}>{error || "Unable to load your dashboard."}</Text>
        <TouchableOpacity style={styles.retryButton} activeOpacity={0.86} onPress={() => loadDashboard()}>
          <Text style={styles.retryText}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <ClientDashboardHeader
          clientName={dashboardData.clientName}
          notificationCount={dashboardData.notificationCount}
        />

        <ClientSectionCard title="Upcoming bookings">
          <UpcomingBookingsList bookings={dashboardData.bookings} />
        </ClientSectionCard>

        <ClientSectionCard title="My pets">
          <MyPetsList pets={dashboardData.pets} />
        </ClientSectionCard>

        <ClientSectionCard title="Recent activity">
          <ClientRecentActivityList activities={dashboardData.activities} />
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
  centered: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  content: {
    paddingBottom: 130,
    paddingHorizontal: 22,
    paddingTop: 60,
  },
  errorMessage: {
    color: "#6E7191",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
    textAlign: "center",
  },
  errorTitle: {
    color: "#1D2238",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 8,
  },
  loadingText: {
    color: "#6E7191",
    fontSize: 15,
    marginTop: 12,
  },
  retryButton: {
    backgroundColor: "#5B3DF5",
    borderRadius: 12,
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  retryText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "800",
  },
});