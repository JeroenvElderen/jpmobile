import { StyleSheet, Text, View } from "react-native";

import { BrandLogo } from "@/components/BrandLogo";

export function PageHeader({ title }: { title: string }) {
  return (
    <View style={styles.container}>
      <BrandLogo style={styles.logo} />
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: 10,
    marginBottom: 28,
    marginTop: 12,
  },
  logo: {
    width: 156,
  },
  title: {
    color: "#080D20",
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
});
