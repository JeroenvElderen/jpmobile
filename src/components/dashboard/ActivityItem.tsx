import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  title: string;
  subtitle: string;
  time: string;
};

export default function ActivityItem({
  icon,
  color,
  title,
  subtitle,
  time,
}: Props) {
  return (
    <View style={styles.row}>
      <View style={[styles.icon, { backgroundColor: color + "20" }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      <Text style={styles.time}>{time}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F7",
  },

  icon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },

  title: {
    fontWeight: "700",
    color: "#1D2238",
  },

  subtitle: {
    color: "#70758E",
    marginTop: 3,
  },

  time: {
    color: "#9CA3AF",
    fontSize: 12,
  },
});