import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Image, Linking, Modal, Pressable, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import type { Gallery, GalleryItem } from "@/lib/galleriesData";

export default function GalleryList({ galleries }: { galleries: Gallery[] }) {
  const [selectedGallery, setSelectedGallery] = useState<Gallery | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryItem | null>(null);

  if (galleries.length === 0) {
    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIcon}><Ionicons name="images-outline" size={30} color="#5B3DF5" /></View>
        <Text style={styles.emptyTitle}>No galleries yet</Text>
        <Text style={styles.emptyText}>Your edited session photos will appear here as soon as they are ready.</Text>
      </View>
    );
  }

  return (
    <>
      <View style={styles.container}>
        {galleries.map((gallery) => (
          <TouchableOpacity accessibilityRole="button" accessibilityLabel={`View ${gallery.title}`} key={gallery.id} style={styles.card} activeOpacity={0.86} onPress={() => setSelectedGallery(gallery)}>
            <View style={styles.coverWrap}>
              <Image source={{ uri: gallery.cover }} style={styles.cover} />
              <View style={styles.photoBadge}>
                <Ionicons name="images-outline" size={15} color="#FFF" />
                <Text style={styles.photoCount}>{gallery.photoCount}</Text>
              </View>
            </View>
            <View style={styles.galleryText}>
              <Text style={styles.title} numberOfLines={2}>{gallery.title}</Text>
              <View style={styles.metaRow}><Ionicons name="paw-outline" size={17} color="#5B3DF5" /><Text style={styles.petName}>{gallery.dog}</Text></View>
              <View style={styles.metaRow}><Ionicons name="calendar-outline" size={17} color="#5D6485" /><Text style={styles.metaText}>{gallery.date}</Text></View>
              <Text style={styles.viewText}>View gallery <Ionicons name="arrow-forward" size={14} /></Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <Modal animationType="slide" presentationStyle="fullScreen" visible={Boolean(selectedGallery)} onRequestClose={() => setSelectedGallery(null)}>
        <View style={styles.detailPage}>
          <View style={styles.detailHeader}>
            <TouchableOpacity accessibilityLabel="Close gallery" style={styles.iconButton} onPress={() => setSelectedGallery(null)}><Ionicons name="close" size={26} color="#151A2D" /></TouchableOpacity>
            <View style={styles.detailHeading}><Text numberOfLines={1} style={styles.detailTitle}>{selectedGallery?.title}</Text><Text style={styles.detailSubtitle}>{selectedGallery?.dog} · {selectedGallery?.date}</Text></View>
            <View style={styles.iconButton} />
          </View>
          <ScrollView contentContainerStyle={styles.photoGrid} showsVerticalScrollIndicator={false}>
            {selectedGallery?.items.map((item) => (
              <TouchableOpacity accessibilityRole="imagebutton" accessibilityLabel={item.altText || "Open gallery photo"} activeOpacity={0.9} key={item.id} style={styles.thumbnailButton} onPress={() => setSelectedPhoto(item)}>
                <Image source={{ uri: item.imageUrl }} style={styles.thumbnail} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      <Modal animationType="fade" transparent visible={Boolean(selectedPhoto)} onRequestClose={() => setSelectedPhoto(null)}>
        <View style={styles.viewer}>
          <Pressable accessibilityLabel="Close photo" style={styles.viewerBackdrop} onPress={() => setSelectedPhoto(null)} />
          <TouchableOpacity accessibilityLabel="Close photo" style={styles.viewerClose} onPress={() => setSelectedPhoto(null)}><Ionicons name="close" size={28} color="#FFF" /></TouchableOpacity>
          {selectedPhoto ? <Image resizeMode="contain" source={{ uri: selectedPhoto.imageUrl }} style={styles.fullPhoto} /> : null}
          <View style={styles.viewerActions}>
            <TouchableOpacity style={styles.secondaryAction} onPress={() => selectedPhoto && Share.share({ message: selectedPhoto.imageUrl, url: selectedPhoto.imageUrl })}><Ionicons name="share-outline" size={21} color="#FFF" /><Text style={styles.secondaryActionText}>Share</Text></TouchableOpacity>
            <TouchableOpacity style={styles.primaryAction} onPress={() => selectedPhoto && Linking.openURL(selectedPhoto.imageUrl)}><Ionicons name="download-outline" size={21} color="#3A1399" /><Text style={styles.primaryActionText}>Open original</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 8 },
  card: { backgroundColor: "#FFF", borderColor: "#ECECF5", borderRadius: 20, borderWidth: 1, flexDirection: "row", marginBottom: 14, padding: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.04, shadowRadius: 16 },
  coverWrap: { borderRadius: 16, height: 126, overflow: "hidden", width: 126 },
  cover: { height: "100%", width: "100%" },
  photoBadge: { alignItems: "center", backgroundColor: "rgba(17, 24, 39, 0.78)", borderRadius: 10, bottom: 8, flexDirection: "row", gap: 4, paddingHorizontal: 8, paddingVertical: 5, position: "absolute", right: 8 },
  photoCount: { color: "#FFF", fontSize: 13, fontWeight: "800" },
  galleryText: { flex: 1, gap: 8, justifyContent: "center", marginLeft: 14 },
  title: { color: "#11162B", fontSize: 18, fontWeight: "900", lineHeight: 23 },
  metaRow: { alignItems: "center", flexDirection: "row", gap: 7 },
  petName: { color: "#4B22C8", flex: 1, fontSize: 14, fontWeight: "800" },
  metaText: { color: "#5D6485", fontSize: 13, fontWeight: "600" },
  viewText: { color: "#3A1399", fontSize: 13, fontWeight: "900", marginTop: 2 },
  emptyState: { alignItems: "center", backgroundColor: "#FFF", borderColor: "#E7E9F2", borderRadius: 22, borderWidth: 1, padding: 30 },
  emptyIcon: { alignItems: "center", backgroundColor: "#F3EEFF", borderRadius: 28, height: 56, justifyContent: "center", marginBottom: 14, width: 56 },
  emptyTitle: { color: "#11162B", fontSize: 20, fontWeight: "900" },
  emptyText: { color: "#69708A", lineHeight: 21, marginTop: 8, textAlign: "center" },
  detailPage: { backgroundColor: "#F8F9FD", flex: 1 },
  detailHeader: { alignItems: "center", backgroundColor: "#FFF", borderBottomColor: "#E7E9F2", borderBottomWidth: 1, flexDirection: "row", paddingHorizontal: 12, paddingTop: 16, paddingBottom: 12 },
  iconButton: { alignItems: "center", height: 44, justifyContent: "center", width: 44 },
  detailHeading: { alignItems: "center", flex: 1 },
  detailTitle: { color: "#11162B", fontSize: 18, fontWeight: "900", maxWidth: "100%" },
  detailSubtitle: { color: "#69708A", fontSize: 12, fontWeight: "600", marginTop: 3 },
  photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 4, padding: 4, paddingBottom: 36 },
  thumbnailButton: { aspectRatio: 1, width: "32.6%" },
  thumbnail: { height: "100%", width: "100%" },
  viewer: { alignItems: "center", backgroundColor: "#070914", flex: 1, justifyContent: "center" },
  viewerBackdrop: { bottom: 0, left: 0, position: "absolute", right: 0, top: 0 },
  viewerClose: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.14)", borderRadius: 22, height: 44, justifyContent: "center", position: "absolute", right: 18, top: 52, width: 44, zIndex: 2 },
  fullPhoto: { height: "75%", width: "100%" },
  viewerActions: { bottom: 42, flexDirection: "row", gap: 12, left: 20, position: "absolute", right: 20 },
  secondaryAction: { alignItems: "center", borderColor: "rgba(255,255,255,0.55)", borderRadius: 14, borderWidth: 1, flex: 1, flexDirection: "row", gap: 8, justifyContent: "center", minHeight: 52 },
  secondaryActionText: { color: "#FFF", fontWeight: "900" },
  primaryAction: { alignItems: "center", backgroundColor: "#FFF", borderRadius: 14, flex: 1.4, flexDirection: "row", gap: 8, justifyContent: "center", minHeight: 52 },
  primaryActionText: { color: "#3A1399", fontWeight: "900" },
});