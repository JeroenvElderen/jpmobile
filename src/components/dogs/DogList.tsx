import { Ionicons } from "@expo/vector-icons";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { dogs, type Dog } from "@/lib/dogsData";

const statusStyles = {
  Active: { bg: "#DDF6DC", color: "#178A22" },
  Inactive: { bg: "#FFF0D8", color: "#F97316" },
} as const;

export default function DogList() {
  return (
    <View style={styles.container}>
      {dogs.map((dog) => (
        <DogCard key={dog.id} dog={dog} />
      ))}
    </View>
  );
}

function DogCard({ dog }: { dog: Dog }) {
  const badge = statusStyles[dog.status];

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.86}>
      <View style={styles.clientRow}>
        <Image source={{ uri: dog.avatar }} style={styles.avatar} />
        <View style={styles.clientText}>
          <Text style={styles.name}>{dog.name}</Text>
          <Text style={styles.muted}>{dog.breed}</Text>
          <View style={styles.ownerRow}>
            <Ionicons name="paw-outline" size={18} color="#5B3DF5" />
            <Text style={styles.owner}>{dog.owner}</Text>
          </View>
        </View>
        <Ionicons name="ellipsis-vertical" size={21} color="#3A1399" />
      </View>

      <View style={styles.detailRow}>
        <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
          <Text style={[styles.statusText, { color: badge.color }]}>{dog.status}</Text>
        </View>
        <View style={styles.metaColumn}>
          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={18} color="#5D6485" />
            <Text style={styles.metaText}>{dog.bookings} Bookings</Text>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="calendar-clear-outline" size={18} color="#5D6485" />
            <Text style={styles.metaText}>{dog.age}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  card: {
    backgroundColor: "#FFF",
    borderColor: "#ECECF5",
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 14,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
  },
  clientRow: {
    alignItems: "center",
    flexDirection: "row",
    marginBottom: 18,
  },
  avatar: {
    borderRadius: 30,
    height: 60,
    width: 60,
  },
  clientText: {
    flex: 1,
    marginLeft: 14,
  },
  name: {
    color: "#11162B",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 5,
  },
  muted: {
    color: "#5D6485",
    fontSize: 14,
    lineHeight: 20,
  },
  ownerRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 7,
    marginTop: 5,
  },
  owner: {
    color: "#4C5578",
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
  },
  detailRow: {
    alignItems: "center",
    borderTopColor: "#ECECF5",
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 16,
  },
  statusBadge: {
    alignItems: "center",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "700",
  },
  metaColumn: {
    gap: 8,
  },
  metaRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  metaText: {
    color: "#5D6485",
    fontSize: 13,
    lineHeight: 20,
  },
});