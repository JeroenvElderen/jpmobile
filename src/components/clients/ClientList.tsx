import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Image, Modal, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import type { Client, ClientStatus } from "@/lib/clientsData";

const statusStyles = {
  Active: { bg: "#DDF6DC", color: "#178A22" },
  Inactive: { bg: "#FFF0D8", color: "#F97316" },
} as const;

type ClientListProps = {
  clients: Client[];
  onDeleteClient: (client: Client) => void;
  onSaveClient: (client: Client, updates: { name: string; email: string }) => void;
  onToggleStatus: (client: Client, status: ClientStatus) => void;
};

export default function ClientList({ clients, onDeleteClient, onSaveClient, onToggleStatus }: ClientListProps) {
  const [menuClient, setMenuClient] = useState<Client | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");

  const openEditForm = (client: Client) => {
    setMenuClient(null);
    setEditName(client.name);
    setEditEmail(client.email);
    setEditingClient(client);
  };

  const saveEdit = () => {
    if (!editingClient) return;
    onSaveClient(editingClient, { name: editName, email: editEmail });
    setEditingClient(null);
  };

  return (
    <View style={styles.container}>
      {clients.length ? (
        clients.map((client) => <ClientCard key={client.id} client={client} onOpenMenu={setMenuClient} />)
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No clients found</Text>
          <Text style={styles.emptyText}>Try searching for another client name, dog, or email.</Text>
        </View>
      )}

      <Modal transparent visible={Boolean(menuClient)} animationType="fade" onRequestClose={() => setMenuClient(null)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setMenuClient(null)}>
          <Pressable style={styles.actionMenu}>
            <ActionMenuItem
              icon="pause-circle-outline"
              label="Deactive"
              disabled={!menuClient || menuClient.status === "Inactive"}
              onPress={() => {
                if (menuClient) onToggleStatus(menuClient, "Inactive");
                setMenuClient(null);
              }}
            />
            <ActionMenuItem
              icon="checkmark-circle-outline"
              label="Activate"
              disabled={!menuClient || menuClient.status === "Active"}
              onPress={() => {
                if (menuClient) onToggleStatus(menuClient, "Active");
                setMenuClient(null);
              }}
            />
            <ActionMenuItem icon="create-outline" label="Edit" onPress={() => menuClient && openEditForm(menuClient)} />
            <ActionMenuItem
              destructive
              icon="trash-outline"
              label="Delete"
              onPress={() => {
                if (menuClient) onDeleteClient(menuClient);
                setMenuClient(null);
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>

      <Modal transparent visible={Boolean(editingClient)} animationType="slide" onRequestClose={() => setEditingClient(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.editForm}>
            <Text style={styles.formTitle}>Edit client</Text>
            <Text style={styles.label}>Name</Text>
            <TextInput style={styles.formInput} value={editName} onChangeText={setEditName} placeholder="Client name" />
            <Text style={styles.label}>Email</Text>
            <TextInput
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.formInput}
              value={editEmail}
              onChangeText={setEditEmail}
              placeholder="Client email"
            />
            <View style={styles.formActions}>
              <TouchableOpacity style={[styles.formButton, styles.cancelButton]} onPress={() => setEditingClient(null)} activeOpacity={0.85}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.formButton, styles.saveButton]} onPress={saveEdit} activeOpacity={0.85}>
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function ClientCard({ client, onOpenMenu }: { client: Client; onOpenMenu: (client: Client) => void }) {
  const badge = statusStyles[client.status];

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.86}>
      <View style={styles.clientRow}>
        <Image source={{ uri: client.avatar }} style={styles.avatar} />
        <View style={styles.clientText}>
          <Text style={styles.name}>{client.name}</Text>
          <Text style={styles.muted}>{client.email}</Text>
          <View style={styles.ownerRow}>
            <Ionicons name="people-outline" size={18} color="#5B3DF5" />
            <Text style={styles.owner}>{client.dogs}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.menuButton} activeOpacity={0.78} onPress={() => onOpenMenu(client)}>
          <Ionicons name="ellipsis-vertical" size={21} color="#3A1399" />
        </TouchableOpacity>
      </View>

      <View style={styles.detailRow}>
        <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
          <Text style={[styles.statusText, { color: badge.color }]}>{client.status}</Text>
        </View>
        <View style={styles.metaColumn}>
          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={18} color="#5D6485" />
            <Text style={styles.metaText}>{client.bookings} Bookings</Text>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="calendar-clear-outline" size={18} color="#5D6485" />
            <Text style={styles.metaText}>{client.memberSince}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function ActionMenuItem({ disabled, destructive, icon, label, onPress }: { disabled?: boolean; destructive?: boolean; icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity disabled={disabled} style={[styles.actionItem, disabled && styles.disabledAction]} onPress={onPress} activeOpacity={0.82}>
      <Ionicons name={icon} size={20} color={destructive ? "#DC2626" : "#3A1399"} />
      <Text style={[styles.actionText, destructive && styles.destructiveText]}>{label}</Text>
    </TouchableOpacity>
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
  menuButton: { alignItems: "center", borderRadius: 18, height: 36, justifyContent: "center", width: 36 },
  detailRow: { alignItems: "center", borderTopColor: "#ECECF5", borderTopWidth: 1, flexDirection: "row", justifyContent: "space-between", paddingTop: 16 },
  statusBadge: { alignItems: "center", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  statusText: { fontSize: 13, fontWeight: "700" },
  metaColumn: { gap: 8 },
  metaRow: { alignItems: "center", flexDirection: "row", gap: 8 },
  metaText: { color: "#5D6485", fontSize: 13, lineHeight: 20 },
  modalBackdrop: { alignItems: "center", backgroundColor: "rgba(8, 13, 32, 0.42)", flex: 1, justifyContent: "center", padding: 22 },
  actionMenu: { backgroundColor: "#FFF", borderRadius: 18, paddingVertical: 8, width: "100%" },
  actionItem: { alignItems: "center", flexDirection: "row", gap: 12, paddingHorizontal: 18, paddingVertical: 15 },
  disabledAction: { opacity: 0.4 },
  actionText: { color: "#11162B", fontSize: 16, fontWeight: "700" },
  destructiveText: { color: "#DC2626" },
  editForm: { backgroundColor: "#FFF", borderRadius: 22, padding: 20, width: "100%" },
  formTitle: { color: "#080D20", fontSize: 22, fontWeight: "800", marginBottom: 18 },
  label: { color: "#374151", fontSize: 13, fontWeight: "700", marginBottom: 8 },
  formInput: { borderColor: "#ECECF5", borderRadius: 14, borderWidth: 1, color: "#11162B", fontSize: 15, marginBottom: 16, paddingHorizontal: 14, paddingVertical: 13 },
  formActions: { flexDirection: "row", gap: 12, justifyContent: "flex-end", marginTop: 4 },
  formButton: { alignItems: "center", borderRadius: 14, flex: 1, paddingVertical: 14 },
  cancelButton: { backgroundColor: "#F3F4F8" },
  saveButton: { backgroundColor: "#5B3DF5" },
  cancelText: { color: "#11162B", fontWeight: "800" },
  saveText: { color: "#FFF", fontWeight: "800" },
  emptyCard: { alignItems: "center", backgroundColor: "#FFF", borderColor: "#ECECF5", borderRadius: 18, borderWidth: 1, padding: 24 },
  emptyTitle: { color: "#11162B", fontSize: 18, fontWeight: "800", marginBottom: 6 },
  emptyText: { color: "#5D6485", lineHeight: 21, textAlign: "center" },
});