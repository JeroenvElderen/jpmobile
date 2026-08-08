import { StyleSheet, Text, View } from "react-native";

import { PageHeader } from "@/components/ui/PageHeader";

type Props = {
  clientName: string;
};

export default function ClientDashboardHeader({ clientName }: Props) {
  return (
    <View style={styles.container}>
      <PageHeader title="Home" />

      <View style={styles.greeting}>
        <Text style={styles.title}>Good morning, {clientName} 👋</Text>
        <Text style={styles.subtitle}>
          Here&apos;s what&apos;s coming up for your pets.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 22,
    marginTop: 12,
  },
  greeting: {
    marginBottom: 2,
  },
  title: {
    color: "#1D2238",
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    color: "#6E7191",
    fontSize: 16,
    lineHeight: 24,
  },
});