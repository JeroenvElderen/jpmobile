import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  title: string;
  value: string;
  change: string;
  positive: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBackground: string;
};

export default function StatCard({
  title,
  value,
  change,
  positive,
  icon,
  iconColor,
  iconBackground,
}: Props) {
  return (
    <View style={styles.card}>
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: iconBackground },
        ]}
      >
        <Ionicons
          name={icon}
          size={24}
          color={iconColor}
        />
      </View>

      <Text style={styles.title}>{title}</Text>

      <Text style={styles.value}>{value}</Text>

      <View style={styles.row}>
        <Ionicons
          name={positive ? "arrow-up" : "arrow-down"}
          size={14}
          color={positive ? "#22C55E" : "#F97316"}
        />

        <Text
          style={[
            styles.change,
            {
              color: positive ? "#22C55E" : "#F97316",
            },
          ]}
        >
          {change}
        </Text>
      </View>

      <Text style={styles.subtitle}>vs yesterday</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "48%",

    backgroundColor: "#FFF",

    borderRadius: 18,

    padding: 18,

    borderWidth: 1,

    borderColor: "#ECECF5",

    marginBottom: 14,

    shadowColor: "#000",

    shadowOpacity: 0.04,

    shadowRadius: 16,

    shadowOffset: {
      width: 0,
      height: 6,
    },

    elevation: 3,
  },

  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,

    justifyContent: "center",
    alignItems: "center",

    marginBottom: 18,
  },

  title: {
    color: "#70758E",
    fontSize: 15,
    marginBottom: 8,
  },

  value: {
    fontSize: 34,
    fontWeight: "700",
    color: "#1D2238",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },

  change: {
    marginLeft: 4,
    fontWeight: "700",
    fontSize: 14,
  },

  subtitle: {
    marginTop: 2,
    color: "#70758E",
    fontSize: 13,
  },
});