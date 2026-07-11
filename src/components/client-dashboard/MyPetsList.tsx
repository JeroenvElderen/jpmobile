import { Ionicons } from "@expo/vector-icons";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { clientPets, type ClientPet } from "@/lib/clientDashboardData";

const statusStyles = {
  Active: { bg: "#DDF6DC", color: "#178A22" },
  "Needs review": { bg: "#FFF0D8", color: "#F97316" },
} as const;

export default function MyPetsList() {
  return (
    <View>
      {clientPets.map((pet) => (
        <PetCard key={pet.id} pet={pet} />
      ))}
    </View>
  );
}

function PetCard({ pet }: { pet: ClientPet }) {
  const badge = statusStyles[pet.status];

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.86}>
      <View style={styles.petRow}>
        <Image source={{ uri: pet.avatar }} style={styles.avatar} />
        <View style={styles.petText}>
          <Text style={styles.name}>{pet.name}</Text>
          <Text style={styles.muted}>{pet.breed}</Text>
          <View style={styles.planRow}>
            <Ionicons name="heart-outline" size={18} color="#5B3DF5" />
            <Text style={styles.plan}>{pet.carePlan}</Text>
          </View>
        </View>
        <Ionicons name="ellipsis-vertical" size={21} color="#3A1399" />
      </View>

      <View style={styles.detailRow}>
        <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
          <Text style={[styles.statusText, { color: badge.color }]}>{pet.status}</Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="calendar-clear-outline" size={18} color="#5D6485" />
          <Text style={styles.metaText}>{pet.age}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFF",
    borderColor: "#ECECF5",
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 14,
    padding: 18,
  },
  petRow: {
    alignItems: "center",
    flexDirection: "row",
    marginBottom: 18,
  },
  avatar: {
    borderRadius: 30,
    height: 60,
    width: 60,
  },
  petText: {
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
  planRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 7,
    marginTop: 5,
  },
  plan: {
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