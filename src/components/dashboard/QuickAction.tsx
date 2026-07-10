import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  background: string;
  onPress?: () => void;
};

export default function QuickAction({
  title,
  icon,
  color,
  background,
  onPress,
}: Props) {
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <View style={[styles.icon, { backgroundColor: background }]}>
        <Ionicons name={icon} size={28} color={color} />
      </View>

      <Text style={styles.title}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "48%",
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#ECECF5",
    marginBottom: 14,
    alignItems: "center",

    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },

  icon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },

  title: {
    fontWeight: "700",
    color: "#1D2238",
    textAlign: "center",
  },
});