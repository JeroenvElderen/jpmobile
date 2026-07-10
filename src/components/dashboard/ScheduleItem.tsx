import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  item: {
    time: string;
    period: string;
    dog: string;
    service: string;
    status: string;
    location: string;
    avatar: string;
  };
};

export default function ScheduleItem({ item }: Props) {
  const confirmed = item.status === "Confirmed";

  return (
    <TouchableOpacity style={styles.container} activeOpacity={0.8}>
      <View style={styles.left}>
        <Text style={styles.time}>
          {item.time}
        </Text>

        <Text style={styles.period}>
          {item.period}
        </Text>
      </View>

      <Image
        source={{ uri: item.avatar }}
        style={styles.avatar}
      />

      <View style={styles.content}>
        <Text style={styles.name}>{item.dog}</Text>

        <Text style={styles.service}>{item.service}</Text>

        <View
          style={[
            styles.badge,
            {
              backgroundColor: confirmed ? "#ECFDF3" : "#FFF4EB",
            },
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              {
                color: confirmed ? "#16A34A" : "#F97316",
              },
            ]}
          >
            {item.status}
          </Text>
        </View>

        <View style={styles.locationRow}>
          <Ionicons
            name="location-outline"
            size={14}
            color="#8A8FA3"
          />

          <Text style={styles.location}>
            {item.location}
          </Text>
        </View>
      </View>

      <Ionicons
        name="chevron-forward"
        size={22}
        color="#B2B5C4"
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F2F7",
  },

  left: {
    width: 56,
  },

  time: {
    fontWeight: "700",
    fontSize: 15,
    color: "#1D2238",
  },

  period: {
    color: "#8A8FA3",
    fontSize: 12,
  },

  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    marginHorizontal: 14,
  },

  content: {
    flex: 1,
  },

  name: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1D2238",
  },

  service: {
    color: "#70758E",
    marginTop: 2,
    marginBottom: 8,
  },

  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },

  badgeText: {
    fontWeight: "700",
    fontSize: 12,
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },

  location: {
    marginLeft: 4,
    color: "#8A8FA3",
    fontSize: 13,
  },
});