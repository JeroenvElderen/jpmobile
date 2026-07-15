import { Ionicons } from "@expo/vector-icons";
import { BrandLogo } from "@/components/BrandLogo";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function GalleriesHeader({ onCreate }: { onCreate: () => void }) {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.iconButton} activeOpacity={0.8}>
        <Ionicons name="menu-outline" size={32} color="#141A33" />
      </TouchableOpacity>

      <View style={styles.titleWrap}>
        <Text style={styles.title}>Galleries</Text>
        <BrandLogo variant="mark" />
      </View>

      <TouchableOpacity style={styles.notification} activeOpacity={0.8} onPress={onCreate}>
        <Ionicons name="add-outline" size={30} color="#141A33" />
      </TouchableOpacity>
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
  notification: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  badge: {
    alignItems: "center",
    backgroundColor: "#EF2852",
    borderRadius: 12,
    height: 24,
    justifyContent: "center",
    position: "absolute",
    right: 1,
    top: 0,
    width: 24,
  },
  badgeText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "800",
  },
});
