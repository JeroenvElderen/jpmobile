import { useCallback, useEffect, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import ClientDashboardHeader from "@/components/client-dashboard/ClientDashboardHeader";
import ClientRecentActivityList from "@/components/client-dashboard/ClientRecentActivityList";
import ClientSectionCard from "@/components/client-dashboard/ClientSectionCard";
import MyPetsList from "@/components/client-dashboard/MyPetsList";
import UpcomingBookingsList from "@/components/client-dashboard/UpcomingBookingsList";
import ClientFloatingTabBar from "@/components/client-dashboard/ClientFloatingTabBar";
import { fetchClientDashboardData, type ClientBooking, type ClientDashboardData } from "@/lib/clientDashboardData";
import { supabase } from "@/lib/supabase";

export default function ClientScreen() {
  const [dashboardData, setDashboardData] = useState<ClientDashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const realtimeSubscriptionIdRef = useRef(0);

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

    const subscriptionId = realtimeSubscriptionIdRef.current + 1;
    realtimeSubscriptionIdRef.current = subscriptionId;

    const channel = supabase
      .channel(`client-dashboard-${dashboardData.clientId}-${subscriptionId}`)
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

        <NextBookingHero booking={dashboardData.bookings[0]} />

        <ClientSectionCard title="Upcoming bookings">
          <UpcomingBookingsList bookings={dashboardData.bookings} onBookingChanged={() => loadDashboard({ showLoading: false })} />
        </ClientSectionCard>

        <ClientSectionCard title="My pets">
          <MyPetsList pets={dashboardData.pets} clientId={dashboardData.clientId} onPetChanged={() => loadDashboard({ showLoading: false })} />
        </ClientSectionCard>

        <ClientSectionCard title="Recent activity">
          <ClientRecentActivityList activities={dashboardData.activities} />
        </ClientSectionCard>
      </ScrollView>

      <ClientFloatingTabBar activeRoute="home" />
    </View>
  );
}

function NextBookingHero({ booking }: { booking?: ClientBooking }) {
  if (!booking) {
    return (
      <View style={styles.heroCard}>
        <View style={styles.heroIcon}>
          <Ionicons name="calendar-outline" size={26} color="#5B3DF5" />
        </View>
        <View style={styles.heroCopy}>
          <Text style={styles.heroEyebrow}>Ready when you are</Text>
          <Text style={styles.heroTitle}>No upcoming bookings yet.</Text>
          <Text style={styles.heroMeta}>Tap the center action button to request your next visit.</Text>
        </View>
      </View>
    );
  }

  const pending = booking.status === "Pending";

  return (
    <View style={styles.heroCard}>
      <Image source={{ uri: booking.avatar }} style={styles.heroAvatar} />
      <View style={styles.heroCopy}>
        <Text style={styles.heroEyebrow}>Next booking</Text>
        <Text style={styles.heroTitle}>{booking.pet}</Text>
        <View style={styles.heroMetaRow}>
          <Ionicons name="calendar-outline" size={15} color="#5B668D" />
          <Text style={styles.heroMeta}>{booking.date} at {booking.time}</Text>
        </View>
        <View style={styles.heroMetaRow}>
          <Ionicons name="paw-outline" size={15} color="#5B668D" />
          <Text style={styles.heroMeta}>{booking.service}</Text>
        </View>
      </View>
      <View style={[styles.heroStatus, pending ? styles.heroPending : styles.heroConfirmed]}>
        <Text style={[styles.heroStatusText, pending ? styles.heroPendingText : styles.heroConfirmedText]}>{booking.status}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#F7F4EF",
    flex: 1,
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  content: {
    paddingBottom: 142,
    paddingHorizontal: 22,
    paddingTop: 60,
  },
  heroAvatar: {
    borderColor: "rgba(255,255,255,0.88)",
    borderRadius: 34,
    borderWidth: 3,
    height: 68,
    width: 68,
  },
  heroCard: {
    alignItems: "center",
    backgroundColor: "#FFF",
    borderColor: "rgba(91,61,245,0.14)",
    borderRadius: 26,
    borderWidth: 1,
    flexDirection: "row",
    gap: 14,
    marginBottom: 22,
    padding: 18,
    shadowColor: "#1D1233",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 22,
    elevation: 4,
  },
  heroConfirmed: {
    backgroundColor: "#ECFDF3",
  },
  heroConfirmedText: {
    color: "#168A31",
  },
  heroCopy: {
    flex: 1,
    gap: 5,
  },
  heroEyebrow: {
    color: "#5B3DF5",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  heroIcon: {
    alignItems: "center",
    backgroundColor: "#F3EEFF",
    borderRadius: 28,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  heroMeta: {
    color: "#5B668D",
    fontSize: 13,
    fontWeight: "700",
  },
  heroMetaRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  heroPending: {
    backgroundColor: "#FFF4EB",
  },
  heroPendingText: {
    color: "#F97316",
  },
  heroStatus: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  heroStatusText: {
    fontSize: 12,
    fontWeight: "900",
  },
  heroTitle: {
    color: "#1D2238",
    fontSize: 20,
    fontWeight: "900",
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