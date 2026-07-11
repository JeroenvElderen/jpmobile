import { Ionicons } from "@expo/vector-icons";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { galleries, type Gallery } from "@/lib/galleriesData";

const statusStyles = {
  Published: { bg: "#DDF6DC", color: "#178A22" },
  Private: { bg: "#FFF0D8", color: "#F97316" },
} as const;

export default function GalleryList() {
  return (
    <View style={styles.container}>
      {galleries.map((gallery) => (
        <GalleryCard key={gallery.id} gallery={gallery} />
      ))}
    </View>
  );
}

function GalleryCard({ gallery }: { gallery: Gallery }) {
  const badge = statusStyles[gallery.status];

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.86}>
      <View style={styles.coverWrap}>
        <Image source={{ uri: gallery.cover }} style={styles.cover} />
        <View style={styles.photoBadge}>
          <Ionicons name="images-outline" size={15} color="#FFF" />
          <Text style={styles.photoCount}>{gallery.photoCount}</Text>
        </View>
      </View>

      <View style={styles.galleryText}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {gallery.title}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.statusText, { color: badge.color }]}>{gallery.status}</Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <Ionicons name="person-outline" size={17} color="#5B3DF5" />
          <Text style={styles.client}>{gallery.client}</Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="paw-outline" size={17} color="#5D6485" />
          <Text style={styles.metaText}>{gallery.dog}</Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={17} color="#5D6485" />
          <Text style={styles.metaText}>{gallery.date}</Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.metaText}>{gallery.time}</Text>
        </View>
      </View>

      <Ionicons name="ellipsis-vertical" size={21} color="#3A1399" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  card: {
    alignItems: "center",
    backgroundColor: "#FFF",
    borderColor: "#ECECF5",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    marginBottom: 14,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
  },
  coverWrap: {
    borderRadius: 14,
    height: 86,
    overflow: "hidden",
    width: 96,
  },
  cover: {
    height: "100%",
    width: "100%",
  },
  photoBadge: {
    alignItems: "center",
    backgroundColor: "rgba(17, 24, 39, 0.74)",
    borderRadius: 10,
    bottom: 8,
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    position: "absolute",
    right: 8,
  },
  photoCount: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "800",
  },
  galleryText: {
    flex: 1,
    gap: 6,
    marginLeft: 14,
  },
  titleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  title: {
    color: "#11162B",
    flex: 1,
    fontSize: 17,
    fontWeight: "800",
  },
  statusBadge: {
    alignItems: "center",
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  metaRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 7,
  },
  client: {
    color: "#4B22C8",
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
  },
  metaText: {
    color: "#5D6485",
    fontSize: 13,
    fontWeight: "600",
  },
  dot: {
    color: "#5D6485",
    fontSize: 13,
    fontWeight: "700",
  },
});