import { Ionicons } from "@expo/vector-icons";
import { BrandLogo } from "@/components/BrandLogo";
import { StyleSheet, Text, View } from "react-native";

export default function GalleriesHeader() {
  return (
    <View style={styles.container}>
      <View style={styles.iconButton}>
        <BrandLogo variant="mark" />
      </View>

      <View style={styles.titleWrap}>
        <Text style={styles.title}>Galleries</Text>
        <Ionicons name="images-outline" size={27} color="#4B22C8" />
      </View>

      <View style={styles.iconButton} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 28,
    marginTop: 12,
  },
  iconButton: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  titleWrap: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  title: {
    color: "#080D20",
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
});