import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Alert, Image, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { deactivateClientDashboardPet, deleteClientDashboardPet, type ClientPet } from "@/lib/clientDashboardData";

const statusStyles = {
  Active: { bg: "#DDF6DC", color: "#178A22" },
  "Needs review": { bg: "#FFF0D8", color: "#F97316" },
} as const;

type Props = {
  pets: ClientPet[];
  clientId: string;
  onPetChanged?: () => void;
};

export default function MyPetsList({ pets, clientId, onPetChanged }: Props) {
  const [selectedPet, setSelectedPet] = useState<ClientPet | null>(null);

  const runPetAction = (action: "deactivate" | "delete") => {
    if (!selectedPet) return;
    const isDelete = action === "delete";
    Alert.alert(isDelete ? "Delete pet" : "Deactivate pet", isDelete ? `Permanently delete ${selectedPet.name}?` : `Deactivate ${selectedPet.name}?`, [
      { text: "No", style: "cancel" },
      { text: isDelete ? "Delete" : "Deactivate", style: isDelete ? "destructive" : "default", onPress: async () => {
        try {
          if (isDelete) await deleteClientDashboardPet(selectedPet.id, clientId);
          else await deactivateClientDashboardPet(selectedPet.id, clientId);
          setSelectedPet(null);
          onPetChanged?.();
        } catch (error) {
          Alert.alert("Update failed", error instanceof Error ? error.message : "Unable to update this pet.");
        }
      } },
    ]);
  };
  if (pets.length === 0) {
    return <Text style={styles.emptyText}>No pets have been added to your profile yet.</Text>;
  }

  return (
    <View>
      {pets.map((pet) => (
        <PetCard key={pet.id} pet={pet} onPress={() => setSelectedPet(pet)} />
      ))}
      <Modal transparent animationType="fade" visible={Boolean(selectedPet)} onRequestClose={() => setSelectedPet(null)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setSelectedPet(null)}>
          <Pressable style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{selectedPet?.name}</Text>
            <Text style={styles.sheetSubtitle}>{selectedPet?.breed} · {selectedPet?.age}</Text>
            <TouchableOpacity style={styles.actionRow} onPress={() => runPetAction("deactivate")}>
              <Ionicons name="pause-circle-outline" size={22} color="#F97316" />
              <Text style={[styles.actionText, { color: "#F97316" }]}>Deactivate pet</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionRow} onPress={() => runPetAction("delete")}>
              <Ionicons name="trash-outline" size={22} color="#E53935" />
              <Text style={[styles.actionText, { color: "#E53935" }]}>Delete pet permanently</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function PetCard({ pet, onPress }: { pet: ClientPet; onPress: () => void }) {
  const badge = statusStyles[pet.status];

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.86} onPress={onPress}>
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
  emptyText: {
    color: "#70758E",
    fontSize: 14,
    lineHeight: 20,
    paddingVertical: 14,
  },
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
  modalBackdrop: { backgroundColor: "rgba(10, 14, 32, 0.34)", flex: 1, justifyContent: "flex-end" },
  sheet: { backgroundColor: "#FFF", borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingBottom: 30, paddingHorizontal: 24, paddingTop: 12 },
  sheetHandle: { alignSelf: "center", backgroundColor: "#D8DBE8", borderRadius: 4, height: 5, marginBottom: 18, width: 46 },
  sheetTitle: { color: "#11162B", fontSize: 22, fontWeight: "900", textAlign: "center" },
  sheetSubtitle: { color: "#59617F", fontSize: 13, fontWeight: "600", marginBottom: 16, marginTop: 6, textAlign: "center" },
  actionRow: { alignItems: "center", borderTopColor: "#F0F1F7", borderTopWidth: 1, flexDirection: "row", gap: 14, paddingVertical: 16 },
  actionText: { fontSize: 16, fontWeight: "900" },
});