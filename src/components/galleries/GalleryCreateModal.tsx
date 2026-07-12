import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { ActivityIndicator, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import { createGalleryWithOriginals, type GalleryClient, type GalleryDog } from "@/lib/galleriesData";

type Props = {
  clients: GalleryClient[];
  dogs: GalleryDog[];
  onClose: () => void;
  onCreated: () => void;
  visible: boolean;
};

export default function GalleryCreateModal({ clients, dogs, onClose, onCreated, visible }: Props) {
  const [title, setTitle] = useState("");
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [dogId, setDogId] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clientDogs = useMemo(() => dogs.filter((dog) => dog.clientId === clientId), [clientId, dogs]);
  const selectedDogId = dogId || clientDogs[0]?.id || "";

  async function handleCreate() {
    setError(null);
    if (!clientId || !selectedDogId) {
      setError("Choose a client and dog before creating the gallery.");
      return;
    }

    try {
      setSaving(true);
      await createGalleryWithOriginals({ title, clientId, dogId: selectedDogId, files });
      setTitle("");
      setFiles([]);
      setDogId("");
      onCreated();
      onClose();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Unable to create gallery.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.heading}>Create New Gallery</Text>
            <TouchableOpacity onPress={onClose} disabled={saving}>
              <Ionicons name="close-outline" size={30} color="#11162B" />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Title</Text>
          <TextInput style={styles.input} value={title} onChangeText={setTitle} />

          <View style={styles.row}>
            <View style={styles.field}>
              <Text style={styles.label}>Client</Text>
              <ScrollView style={styles.select} horizontal showsHorizontalScrollIndicator={false}>
                {clients.map((client) => (
                  <TouchableOpacity key={client.id} style={[styles.option, client.id === clientId && styles.optionActive]} onPress={() => { setClientId(client.id); setDogId(""); }}>
                    <Text style={styles.optionText}>{client.fullName}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Dog</Text>
              <ScrollView style={styles.select} horizontal showsHorizontalScrollIndicator={false}>
                {clientDogs.map((dog) => (
                  <TouchableOpacity key={dog.id} style={[styles.option, dog.id === selectedDogId && styles.optionActive]} onPress={() => setDogId(dog.id)}>
                    <Text style={styles.optionText}>{dog.name}</Text>
                  </TouchableOpacity>
                ))}
                {clientDogs.length === 0 ? <Text style={styles.emptySelect}>Choose dog</Text> : null}
              </ScrollView>
            </View>
          </View>

          <Text style={styles.label}>Original photos</Text>
          {Platform.OS === "web" ? (
            <input style={webFileInputStyle} type="file" accept="image/*" multiple onChange={(event) => setFiles(Array.from(event.currentTarget.files ?? []))} />
          ) : (
            <View style={styles.nativeUploadNotice}><Text style={styles.helpText}>Photo picking is available from the web admin. Uploads keep originals with no app-enforced count or size limit.</Text></View>
          )}
          <Text style={styles.helpText}>Photos upload directly to Supabase as original files with no app-enforced count or size limit; no WebP conversion or resizing is done.</Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}
          <TouchableOpacity style={[styles.createButton, saving && styles.disabled]} disabled={saving} onPress={handleCreate}>
            {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.createText}>Create draft gallery</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const webFileInputStyle = { border: "1px solid #E4E4EA", borderRadius: 12, marginBottom: 12, padding: 14, width: "100%" };

const styles = StyleSheet.create({
  backdrop: { alignItems: "center", backgroundColor: "rgba(15, 15, 24, 0.42)", flex: 1, justifyContent: "center", padding: 18 },
  modal: { backgroundColor: "#FFF", borderRadius: 20, maxWidth: 672, padding: 24, width: "100%" },
  header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  heading: { color: "#11162B", fontSize: 26, fontWeight: "600" },
  label: { color: "#16162A", fontSize: 14, fontWeight: "800", marginBottom: 9 },
  input: { borderColor: "#E4E4EA", borderRadius: 12, borderWidth: 1, color: "#11162B", fontSize: 15, marginBottom: 16, minHeight: 46, paddingHorizontal: 14 },
  row: { flexDirection: "row", gap: 16, marginBottom: 16 },
  field: { flex: 1 },
  select: { borderColor: "#E4E4EA", borderRadius: 12, borderWidth: 1, maxHeight: 48, minHeight: 44, paddingHorizontal: 8 },
  option: { borderRadius: 9, justifyContent: "center", marginRight: 8, marginVertical: 6, paddingHorizontal: 12 },
  optionActive: { backgroundColor: "#F0EAFF" },
  optionText: { color: "#16162A", fontWeight: "800" },
  emptySelect: { color: "#16162A", fontWeight: "700", padding: 13 },
  nativeUploadNotice: { borderColor: "#E4E4EA", borderRadius: 12, borderWidth: 1, marginBottom: 12, padding: 14 },
  helpText: { color: "#56576C", fontSize: 12, lineHeight: 18, marginBottom: 20 },
  error: { color: "#B42318", fontSize: 13, fontWeight: "700", marginBottom: 12 },
  createButton: { alignItems: "center", backgroundColor: "#5B2FA8", borderRadius: 12, minHeight: 44, justifyContent: "center" },
  disabled: { opacity: 0.7 },
  createText: { color: "#FFF", fontSize: 14, fontWeight: "900" },
});
