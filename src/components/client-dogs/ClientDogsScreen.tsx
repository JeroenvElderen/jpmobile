import { ScrollView, StyleSheet, View } from "react-native";

import ClientFloatingTabBar from "@/components/client-dashboard/ClientFloatingTabBar";
import ClientDogList from "./ClientDogList";
import ClientDogsHeader from "./ClientDogsHeader";

export default function ClientDogsScreen() {
  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <ClientDogsHeader />
        <ClientDogList />
      </ScrollView>

      <ClientFloatingTabBar activeRoute="pets" />
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