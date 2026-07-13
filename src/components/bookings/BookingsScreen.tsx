import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import FloatingTabBar from "@/components/dashboard/FloatingTabBar";
import { fetchAdminBookingsData, type BookingsData } from "@/lib/bookingData";
import { supabase } from "@/lib/supabase";
import AdminBookingListScreen from "./AdminBookingListScreen";
import BookingsHeader from "./BookingsHeader";

export default function BookingsScreen() {
  const [bookingsData, setBookingsData] = useState<BookingsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadBookings = useCallback(async ({ showLoading = true }: { showLoading?: boolean } = {}) => {
    if (showLoading) setIsLoading(true);
    setError(null);

    try {
      setBookingsData(await fetchAdminBookingsData());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load bookings.");
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  useEffect(() => {
    const refreshBookings = () => {
      if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = setTimeout(() => loadBookings({ showLoading: false }), 300);
    };

    const channel = supabase
      .channel("admin-bookings")
      .on("postgres_changes", { event: "*", schema: "public", table: "portal_bookings" }, refreshBookings)
      .on("postgres_changes", { event: "*", schema: "public", table: "portal_outlook_imports" }, refreshBookings)
      .on("postgres_changes", { event: "*", schema: "public", table: "portal_clients" }, refreshBookings)
      .on("postgres_changes", { event: "*", schema: "public", table: "portal_dogs" }, refreshBookings)
      .subscribe();

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
      supabase.removeChannel(channel);
    };
  }, [loadBookings]);

  if (isLoading) {
    return <CenteredState message="Loading bookings..." />;
  }

  if (error || !bookingsData) {
    return <CenteredState error={error || "Unable to load bookings."} onRetry={() => loadBookings()} />;
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <BookingsHeader />
        <AdminBookingListScreen bookings={bookingsData.bookings} stats={bookingsData.stats} onBookingChanged={() => loadBookings({ showLoading: false })} />
      </ScrollView>

      <FloatingTabBar activeRoute="bookings" />
    </View>
  );
}

function CenteredState({ message, error, onRetry }: { message?: string; error?: string; onRetry?: () => void }) {
  return (
    <View style={[styles.container, styles.centered]}>
      {message ? <ActivityIndicator color="#5B3DF5" size="large" /> : null}
      <Text style={error ? styles.errorTitle : styles.loadingText}>{error ? "Bookings unavailable" : message}</Text>
      {error ? <Text style={styles.errorMessage}>{error}</Text> : null}
      {onRetry ? <TouchableOpacity style={styles.retryButton} activeOpacity={0.86} onPress={onRetry}><Text style={styles.retryText}>Try again</Text></TouchableOpacity> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FD" },
  content: { paddingHorizontal: 22, paddingTop: 60, paddingBottom: 142 },
  centered: { alignItems: "center", justifyContent: "center", padding: 24 },
  loadingText: { color: "#70758E", fontWeight: "600", marginTop: 14 },
  errorTitle: { color: "#1D2238", fontSize: 22, fontWeight: "700", marginBottom: 8 },
  errorMessage: { color: "#70758E", lineHeight: 22, marginBottom: 18, textAlign: "center" },
  retryButton: { backgroundColor: "#5B3DF5", borderRadius: 16, paddingHorizontal: 22, paddingVertical: 14 },
  retryText: { color: "#FFF", fontWeight: "700" },
});
