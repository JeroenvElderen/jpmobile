import { ScrollView, StyleSheet, View } from "react-native";

import FloatingTabBar from "@/components/dashboard/FloatingTabBar";
import GalleryFilters from "./GalleryFilters";
import GalleryList from "./GalleryList";
import GalleryStatsGrid from "./GalleryStatsGrid";
import GalleriesHeader from "./GalleriesHeader";

export default function GalleriesScreen() {
  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <GalleriesHeader />
        <GalleryStatsGrid />
        <GalleryFilters />
        <GalleryList />
      </ScrollView>

      <FloatingTabBar activeRoute="galleries" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FD",
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 60,
    paddingBottom: 142,
  },
});
