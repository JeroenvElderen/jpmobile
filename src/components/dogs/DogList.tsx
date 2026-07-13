import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { ActivityIndicator, Alert, Image, Modal, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import { deleteAdminDog, setAdminDogStatus, updateAdminDogInfo } from "@/lib/adminDashboardData";
import type { Dog } from "@/lib/dogsData";

const statusStyles = {
  Active: { bg: "#DDF6DC", color: "#178A22" },
  Inactive: { bg: "#FFF0D8", color: "#F97316" },
} as const;

type Props = {
  dogs: Dog[];
  onChanged?: () => void;
};

export default function DogList({ dogs, onChanged }: Props) {
  const [selectedDog, setSelectedDog] = useState<Dog | null>(null);

  return (
    <View style={styles.container}>
      {dogs.map((dog) => (
        <DogCard key={dog.id} dog={dog} onOpenActions={() => setSelectedDog(dog)} />
      ))}
      <DogActionsModal dog={selectedDog} onClose={() => setSelectedDog(null)} onChanged={onChanged} />
    </View>
  );
}

function DogCard({ dog, onOpenActions }: { dog: Dog; onOpenActions: () => void }) {
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
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Open actions for ${dog.name}`} hitSlop={12} onPress={onOpenActions}>
          <Ionicons name="ellipsis-vertical" size={21} color="#3A1399" />
        </TouchableOpacity>
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
      {dog.notes ? <Text style={styles.notes} numberOfLines={2}>{dog.notes}</Text> : null}
    </TouchableOpacity>
  );
}

function DogActionsModal({ dog, onClose, onChanged }: { dog: Dog | null; onClose: () => void; onChanged?: () => void }) {
  const [breed, setBreed] = useState("");
  const [age, setAge] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  if (!dog) return null;

  const resetFromDog = () => {
    setBreed(dog.breed === "Breed not set" ? "" : dog.breed);
    setAge(dog.age === "Age not set" ? "" : dog.age);
    setNotes(dog.notes || "");
  };

  const runAction = async (action: () => Promise<void>, closeAfter = true) => {
    setIsSaving(true);
    try {
      await action();
      onChanged?.();
      if (closeAfter) onClose();
    } catch (error) {
      Alert.alert("Dog update failed", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal animationType="fade" transparent visible={Boolean(dog)} onShow={resetFromDog} onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetTitle}>{dog.name}</Text>
              <Text style={styles.sheetSubtitle}>Manage dog status, notes, and info</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={10}><Ionicons name="close" size={24} color="#11162B" /></TouchableOpacity>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionButton} disabled={isSaving} onPress={() => runAction(() => setAdminDogStatus(dog.id, true))}>
              <Ionicons name="checkmark-circle-outline" size={18} color="#178A22" />
              <Text style={styles.actionText}>Activate</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} disabled={isSaving} onPress={() => runAction(() => setAdminDogStatus(dog.id, false))}>
              <Ionicons name="pause-circle-outline" size={18} color="#F97316" />
              <Text style={styles.actionText}>Deactivate</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.inputLabel}>Breed / info</Text>
          <TextInput style={styles.input} value={breed} onChangeText={setBreed} placeholder="Breed or extra info" placeholderTextColor="#9BA1B8" />
          <Text style={styles.inputLabel}>Age</Text>
          <TextInput style={styles.input} value={age} onChangeText={setAge} placeholder="Age" placeholderTextColor="#9BA1B8" />
          <Text style={styles.inputLabel}>Notes</Text>
          <TextInput style={[styles.input, styles.textArea]} value={notes} onChangeText={setNotes} placeholder="Add care notes, temperament, reminders..." placeholderTextColor="#9BA1B8" multiline />

          <TouchableOpacity style={styles.primaryButton} disabled={isSaving} onPress={() => runAction(() => updateAdminDogInfo({ dogId: dog.id, breed, age, notes }))}>
            {isSaving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryText}>Save notes & info</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} disabled={isSaving} onPress={() => Alert.alert("Delete dog?", `This will permanently delete ${dog.name}.`, [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: "destructive", onPress: () => runAction(() => deleteAdminDog(dog.id)) },
          ])}>
            <Text style={styles.deleteText}>Delete dog if needed</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 8 },
  card: { backgroundColor: "#FFF", borderColor: "#ECECF5", borderRadius: 18, borderWidth: 1, marginBottom: 14, padding: 18, shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.04, shadowRadius: 16 },
  clientRow: { alignItems: "center", flexDirection: "row", marginBottom: 18 },
  avatar: { borderRadius: 30, height: 60, width: 60 },
  clientText: { flex: 1, marginLeft: 14 },
  name: { color: "#11162B", fontSize: 18, fontWeight: "800", marginBottom: 5 },
  muted: { color: "#5D6485", fontSize: 14, lineHeight: 20 },
  ownerRow: { alignItems: "center", flexDirection: "row", gap: 7, marginTop: 5 },
  owner: { color: "#4C5578", flex: 1, fontSize: 14, fontWeight: "600" },
  detailRow: { alignItems: "center", borderTopColor: "#ECECF5", borderTopWidth: 1, flexDirection: "row", justifyContent: "space-between", paddingTop: 16 },
  statusBadge: { alignItems: "center", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  statusText: { fontSize: 13, fontWeight: "700" },
  metaColumn: { gap: 8 },
  metaRow: { alignItems: "center", flexDirection: "row", gap: 8 },
  metaText: { color: "#5D6485", fontSize: 13, lineHeight: 20 },
  notes: { backgroundColor: "#F8F7FF", borderRadius: 12, color: "#4C5578", fontSize: 13, lineHeight: 19, marginTop: 14, padding: 12 },
  backdrop: { backgroundColor: "rgba(17, 22, 43, 0.42)", flex: 1, justifyContent: "flex-end" },
  sheet: { backgroundColor: "#FFF", borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 22 },
  sheetHeader: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between", marginBottom: 18 },
  sheetTitle: { color: "#11162B", fontSize: 22, fontWeight: "800" },
  sheetSubtitle: { color: "#70758E", fontSize: 13, fontWeight: "600", marginTop: 4 },
  actionRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  actionButton: { alignItems: "center", backgroundColor: "#F8F9FD", borderColor: "#ECECF5", borderRadius: 14, borderWidth: 1, flex: 1, flexDirection: "row", gap: 8, justifyContent: "center", paddingVertical: 13 },
  actionText: { color: "#11162B", fontWeight: "800" },
  inputLabel: { color: "#4C5578", fontSize: 13, fontWeight: "800", marginBottom: 8, marginTop: 10 },
  input: { backgroundColor: "#F8F9FD", borderColor: "#ECECF5", borderRadius: 14, borderWidth: 1, color: "#11162B", fontSize: 15, paddingHorizontal: 14, paddingVertical: 12 },
  textArea: { minHeight: 96, textAlignVertical: "top" },
  primaryButton: { alignItems: "center", backgroundColor: "#5B3DF5", borderRadius: 16, marginTop: 18, paddingVertical: 15 },
  primaryText: { color: "#FFF", fontWeight: "800" },
  deleteButton: { alignItems: "center", marginTop: 14, paddingVertical: 12 },
  deleteText: { color: "#D92D20", fontWeight: "800" },
});