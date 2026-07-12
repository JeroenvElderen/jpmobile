import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import ClientFloatingTabBar from "@/components/client-dashboard/ClientFloatingTabBar";
import { fetchClientDogsData, type DogsData } from "@/lib/dogsData";
import { supabase } from "@/lib/supabase";
import ClientDogList from "./ClientDogList";
import ClientDogsHeader from "./ClientDogsHeader";

export default function ClientDogsScreen() {
  const [dogsData, setDogsData] = useState<DogsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadDogs = useCallback(async ({ showLoading = true }: { showLoading?: boolean } = {}) => {
    if (showLoading) setIsLoading(true);
    setError(null);

    try {
      setDogsData(await fetchClientDogsData());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load your pets.");
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDogs();
  }, [loadDogs]);

  useEffect(() => {
    if (!dogsData?.clientId) return undefined;

    const refreshDogs = () => {
      if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = setTimeout(() => loadDogs({ showLoading: false }), 300);
    };

    const channel = supabase
      .channel(`client-dogs-${dogsData.clientId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "portal_dogs", filter: `client_id=eq.${dogsData.clientId}` }, refreshDogs)
      .on("postgres_changes", { event: "*", schema: "public", table: "portal_clients", filter: `id=eq.${dogsData.clientId}` }, refreshDogs)
      .on("postgres_changes", { event: "*", schema: "public", table: "portal_bookings", filter: `client_id=eq.${dogsData.clientId}` }, refreshDogs)
      .subscribe();

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
      supabase.removeChannel(channel);
    };
  }, [dogsData?.clientId, loadDogs]);

  if (isLoading) {
    return <CenteredState message="Loading your pets..." />;
  }

  if (error || !dogsData) {
    return <CenteredState error={error || "Unable to load your pets."} onRetry={() => loadDogs()} />;
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <ClientDogsHeader />
        <ClientDogList dogs={dogsData.dogs} />
      </ScrollView>

      <ClientFloatingTabBar activeRoute="pets" />
    </View>
  );
}

function CenteredState({ message, error, onRetry }: { message?: string; error?: string; onRetry?: () => void }) {
  return (
    <View style={[styles.container, styles.centered]}>
      {message ? <ActivityIndicator color="#5B3DF5" size="large" /> : null}
      <Text style={error ? styles.errorTitle : styles.loadingText}>{error ? "Pets unavailable" : message}</Text>
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
