import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { PageHeader } from "@/components/ui/PageHeader";

export default function GalleriesHeader({ onCreate }: { onCreate: () => void }) {
  return (
    <View>
      <PageHeader title="Galleries" />
      <TouchableOpacity style={styles.createButton} activeOpacity={0.84} onPress={onCreate}>
        <Ionicons name="add-outline" size={20} color="#FFFFFF" />
        <Text style={styles.createText}>Create gallery</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  createButton: {
    alignItems: "center",
    alignSelf: "flex-end",
    backgroundColor: "#4B22C8",
    borderRadius: 12,
    flexDirection: "row",
    gap: 6,
    marginBottom: 18,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  createText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
});
