import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";

import ClientFloatingTabBar from "@/components/client-dashboard/ClientFloatingTabBar";
import { fetchClientGalleries, type Gallery } from "@/lib/galleriesData";
import { supabase } from "@/lib/supabase";
import GalleryList from "./GalleryList";
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
        <View style={styles.introCard}>
          <View style={styles.introIcon}><Text style={styles.introEmoji}>📸</Text></View>
          <View style={styles.introCopy}><Text style={styles.introTitle}>Your favourite moments</Text><Text style={styles.introText}>Open a gallery to view, share, or download your edited photos.</Text></View>
        </View>
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
  introCard: { alignItems: "center", backgroundColor: "#F3EEFF", borderRadius: 20, flexDirection: "row", gap: 14, marginBottom: 20, padding: 16 },
  introIcon: { alignItems: "center", backgroundColor: "#FFF", borderRadius: 22, height: 44, justifyContent: "center", width: 44 },
  introEmoji: { fontSize: 21 },
  introCopy: { flex: 1 },
  introTitle: { color: "#2F167D", fontSize: 16, fontWeight: "900", marginBottom: 3 },
  introText: { color: "#665A83", fontSize: 13, lineHeight: 18 },
});
