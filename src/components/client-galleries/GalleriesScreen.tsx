import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";

import ClientFloatingTabBar from "@/components/client-dashboard/ClientFloatingTabBar";
import { buildGalleryStats, fetchClientGalleries, type Gallery } from "@/lib/galleriesData";
import { supabase } from "@/lib/supabase";
import GalleryFilters from "./GalleryFilters";
import GalleryList from "./GalleryList";
import GalleryStatsGrid from "./GalleryStatsGrid";
import GalleriesHeader from "./GalleriesHeader";

export default function GalleriesScreen() {
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setGalleries(await fetchClientGalleries());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load galleries.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const channel = supabase
      .channel("client-galleries-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "portal_galleries" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "portal_gallery_items" }, load)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <GalleriesHeader />
        <GalleryStatsGrid stats={buildGalleryStats(galleries)} />
        <GalleryFilters />
        {loading ? <ActivityIndicator color="#4B22C8" /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <GalleryList galleries={galleries} />
      </ScrollView>
      <ClientFloatingTabBar activeRoute="galleries" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FD" },
  content: { paddingHorizontal: 22, paddingTop: 60, paddingBottom: 142 },
  error: { color: "#B42318", fontWeight: "700", marginBottom: 12 },
});
