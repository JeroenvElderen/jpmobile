import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";

import FloatingTabBar from "@/components/dashboard/FloatingTabBar";
import { supabase } from "@/lib/supabase";
import { buildGalleryStats, fetchAdminGalleries, fetchGalleryFormOptions, type Gallery, type GalleryClient, type GalleryDog } from "@/lib/galleriesData";
import GalleryCreateModal from "./GalleryCreateModal";
import GalleryFilters from "./GalleryFilters";
import GalleryList from "./GalleryList";
import GalleryStatsGrid from "./GalleryStatsGrid";
import GalleriesHeader from "./GalleriesHeader";

export default function GalleriesScreen() {
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [clients, setClients] = useState<GalleryClient[]>([]);
  const [dogs, setDogs] = useState<GalleryDog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [galleryData, options] = await Promise.all([fetchAdminGalleries(), fetchGalleryFormOptions()]);
      setGalleries(galleryData);
      setClients(options.clients);
      setDogs(options.dogs);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load galleries.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const channel = supabase
      .channel("admin-galleries-realtime")
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
        <GalleriesHeader onCreate={() => setCreateOpen(true)} />
        <GalleryStatsGrid stats={buildGalleryStats(galleries)} />
        <GalleryFilters />
        {loading ? <ActivityIndicator color="#4B22C8" /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <GalleryList galleries={galleries} />
      </ScrollView>
      <GalleryCreateModal clients={clients} dogs={dogs} visible={createOpen} onClose={() => setCreateOpen(false)} onCreated={load} />
      <FloatingTabBar activeRoute="galleries" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FD" },
  content: { paddingHorizontal: 22, paddingTop: 60, paddingBottom: 142 },
  error: { color: "#B42318", fontWeight: "700", marginBottom: 12 },
});
