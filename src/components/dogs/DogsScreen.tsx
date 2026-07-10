import { ScrollView, StyleSheet, View } from "react-native";

import FloatingTabBar from "@/components/dashboard/FloatingTabBar";
import DogFilters from "./DogFilters";
import DogList from "./DogList";
import DogStatsGrid from "./DogStatsGrid";
import DogsHeader from "./DogsHeader";

export default function DogsScreen() {
  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <DogsHeader />
        <DogStatsGrid />
        <DogFilters />
        <DogList />
      </ScrollView>

      <FloatingTabBar activeRoute="dogs" />
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