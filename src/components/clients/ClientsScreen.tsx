import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import FloatingTabBar from "@/components/dashboard/FloatingTabBar";
import { deleteAdminClient, setAdminClientStatus, updateAdminClient } from "@/lib/adminDashboardData";
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
  const [searchQuery, setSearchQuery] = useState("");
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

  const handleSaveClient = async (client: ClientsData["clients"][number], updates: { name: string; email: string }) => {
    const trimmedName = updates.name.trim();
    const trimmedEmail = updates.email.trim();

    if (!trimmedName || !trimmedEmail) {
      Alert.alert("Missing details", "Client name and email are required.");
      return;
    }

    try {
      await updateAdminClient({ clientId: client.id, fullName: trimmedName, email: trimmedEmail });
    } catch (updateError) {
      Alert.alert("Unable to update client", updateError instanceof Error ? updateError.message : "Admin client update failed.");
      return;
    }

    setClientsData((current) => current ? {
      ...current,
      clients: current.clients.map((currentClient) => currentClient.id === client.id ? { ...currentClient, name: trimmedName, email: trimmedEmail } : currentClient),
    } : current);
  };

  const handleToggleStatus = async (client: ClientsData["clients"][number], status: ClientsData["clients"][number]["status"]) => {
    try {
      await setAdminClientStatus(client.id, status.toLowerCase() === "active");
    } catch (updateError) {
      Alert.alert("Unable to update status", updateError instanceof Error ? updateError.message : "Admin status update failed.");
      return;
    }

    setClientsData((current) => current ? {
      ...current,
      clients: current.clients.map((currentClient) => currentClient.id === client.id ? { ...currentClient, status } : currentClient),
    } : current);
  };

  const handleDeleteClient = (client: ClientsData["clients"][number]) => {
    Alert.alert("Delete client", `Delete ${client.name}? This cannot be undone.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteAdminClient(client.id);
          } catch (deleteError) {
            Alert.alert("Unable to delete client", deleteError instanceof Error ? deleteError.message : "Admin client delete failed.");
            return;
          }

          setClientsData((current) => current ? { ...current, clients: current.clients.filter((currentClient) => currentClient.id !== client.id) } : current);
        },
      },
    ]);
  };

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredClients = clientsData?.clients.filter((client) => {
    if (!normalizedSearch) return true;

    return [client.name, client.email, client.dogs].some((value) => value.toLowerCase().includes(normalizedSearch));
  }) ?? [];

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
        <ClientFilters searchQuery={searchQuery} onSearchChange={setSearchQuery} />
        <ClientList clients={filteredClients} onDeleteClient={handleDeleteClient} onSaveClient={handleSaveClient} onToggleStatus={handleToggleStatus} />
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