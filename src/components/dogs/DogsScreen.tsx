import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import FloatingTabBar from "@/components/dashboard/FloatingTabBar";
import { fetchAdminDogsData, type DogsData } from "@/lib/dogsData";
import { supabase } from "@/lib/supabase";
import DogFilters from "./DogFilters";
import DogList from "./DogList";
import DogStatsGrid from "./DogStatsGrid";
import DogsHeader from "./DogsHeader";

export default function DogsScreen() {
  const [dogsData, setDogsData] = useState<DogsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadDogs = useCallback(async ({ showLoading = true }: { showLoading?: boolean } = {}) => {
    if (showLoading) setIsLoading(true);
    setError(null);

    try {
      setDogsData(await fetchAdminDogsData());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load dogs.");
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDogs();
  }, [loadDogs]);

  useEffect(() => {
    const refreshDogs = () => {
      if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = setTimeout(() => loadDogs({ showLoading: false }), 300);
    };

    const channel = supabase
      .channel("admin-dogs")
      .on("postgres_changes", { event: "*", schema: "public", table: "portal_dogs" }, refreshDogs)
      .on("postgres_changes", { event: "*", schema: "public", table: "portal_clients" }, refreshDogs)
      .on("postgres_changes", { event: "*", schema: "public", table: "portal_bookings" }, refreshDogs)
      .subscribe();

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
      supabase.removeChannel(channel);
    };
  }, [loadDogs]);

  if (isLoading) {
    return <CenteredState message="Loading dogs..." />;
  }

  if (error || !dogsData) {
    return <CenteredState error={error || "Unable to load dogs."} onRetry={() => loadDogs()} />;
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <DogsHeader />
        <DogStatsGrid stats={dogsData.stats} />
        <DogFilters />
        <DogList dogs={dogsData.dogs} />
      </ScrollView>

      <FloatingTabBar activeRoute="dogs" />
    </View>
  );
}

function CenteredState({ message, error, onRetry }: { message?: string; error?: string; onRetry?: () => void }) {
  return (
    <View style={[styles.container, styles.centered]}>
      {message ? <ActivityIndicator color="#5B3DF5" size="large" /> : null}
      <Text style={error ? styles.errorTitle : styles.loadingText}>{error ? "Dogs unavailable" : message}</Text>
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
