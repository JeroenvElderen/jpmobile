import { ScrollView, StyleSheet, View } from "react-native";

import FloatingTabBar from "@/components/dashboard/FloatingTabBar";
import ClientFilters from "./ClientFilters";
import ClientList from "./ClientList";
import ClientStatsGrid from "./ClientStatsGrid";
import ClientsHeader from "./ClientsHeader";

export default function ClientsScreen() {
  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <ClientsHeader />
        <ClientStatsGrid />
        <ClientFilters />
        <ClientList />
      </ScrollView>

      <FloatingTabBar activeRoute="clients" />
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