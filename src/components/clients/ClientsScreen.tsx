import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import FloatingTabBar from "@/components/dashboard/FloatingTabBar";
import { fetchAdminClientsData, type ClientsData } from "@/lib/clientsData";
import { supabase } from "@/lib/supabase";
import ClientFilters from "./ClientFilters";
import ClientList from "./ClientList";
import ClientStatsGrid from "./ClientStatsGrid";
import ClientsHeader from "./ClientsHeader";

export default function ClientsScreen() {
  const [clientsData, setClientsData] = useState<ClientsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadClients = useCallback(async ({ showLoading = true }: { showLoading?: boolean } = {}) => {
    if (showLoading) setIsLoading(true);
    setError(null);

    try {
      setClientsData(await fetchAdminClientsData());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load clients.");
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  useEffect(() => {
    const refreshClients = () => {
      if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = setTimeout(() => loadClients({ showLoading: false }), 300);
    };

    const channel = supabase
      .channel("admin-clients")
      .on("postgres_changes", { event: "*", schema: "public", table: "portal_clients" }, refreshClients)
      .on("postgres_changes", { event: "*", schema: "public", table: "portal_dogs" }, refreshClients)
      .on("postgres_changes", { event: "*", schema: "public", table: "portal_bookings" }, refreshClients)
      .subscribe();

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
      supabase.removeChannel(channel);
    };
  }, [loadClients]);

  if (isLoading) {
    return <CenteredState message="Loading clients..." />;
  }

  if (error || !clientsData) {
    return <CenteredState error={error || "Unable to load clients."} onRetry={() => loadClients()} />;
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <ClientsHeader />
        <ClientStatsGrid stats={clientsData.stats} />
        <ClientFilters />
        <ClientList clients={clientsData.clients} />
      </ScrollView>

      <FloatingTabBar activeRoute="clients" />
    </View>
  );
}

function CenteredState({ message, error, onRetry }: { message?: string; error?: string; onRetry?: () => void }) {
  return (
    <View style={[styles.container, styles.centered]}>
      {message ? <ActivityIndicator color="#5B3DF5" size="large" /> : null}
      <Text style={error ? styles.errorTitle : styles.loadingText}>{error ? "Clients unavailable" : message}</Text>
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