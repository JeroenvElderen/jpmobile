import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  children: ReactNode;
  title: string;
};

export default function ClientSectionCard({ children, title }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFF",
    borderColor: "#ECECF5",
    borderRadius: 22,
    borderWidth: 1,
    marginBottom: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
  },
  heading: {
    color: "#1D2238",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 10,
  },
});