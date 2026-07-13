import { useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { createAdminBooking, createAdminClient, createAdminDog, type AdminDashboardData } from "@/lib/adminDashboardData";

type Action = "booking" | "client" | "dog" | null;

type Props = {
  action: Action;
  options?: AdminDashboardData["formOptions"];
  onClose: () => void;
  onSaved: () => void;
};

type SelectOption = { label: string; value: string };

const titles = {
  booking: "New booking",
  client: "Add client",
  dog: "Add dog",
};

export default function QuickActionForms({ action, options, onClose, onSaved }: Props) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [selectedDogIds, setSelectedDogIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateValue = (key: string, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
    if (key === "clientId") setSelectedDogIds([]);
  };

  const clientOptions = options?.clients.map((client) => ({ label: client.name, value: client.id })) ?? [];
  const dogOptions = values.clientId ? options?.dogsByClient[values.clientId] ?? [] : [];
  const serviceOptions = options?.services.map((service) => ({ label: service, value: service })) ?? [];

  const toggleDog = (dogId: string) => {
    setSelectedDogIds((current) => (current.includes(dogId) ? current.filter((id) => id !== dogId) : [...current, dogId]));
  };

  const handleClose = () => {
    setValues({});
    setSelectedDogIds([]);
    setError(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (!action) return;
    setIsSubmitting(true);
    setError(null);

    try {
      if (action === "client") {
        if (!values.fullName?.trim() || !values.email?.trim()) throw new Error("Client name and email are required.");
        await createAdminClient({ fullName: values.fullName, email: values.email, phone: values.phone });
      }

      if (action === "dog") {
        if (!values.clientId?.trim() || !values.name?.trim()) throw new Error("Client ID and dog name are required.");
        await createAdminDog({ clientId: values.clientId, name: values.name, breed: values.breed, age: values.age, notes: values.notes });
      }

      if (action === "booking") {
        if (!values.clientId?.trim() || selectedDogIds.length === 0 || !values.serviceName?.trim() || !values.startsAt?.trim()) {
          throw new Error("Client, dog, service, and start time are required.");
        }
        await createAdminBooking({ clientId: values.clientId, dogIds: selectedDogIds, serviceName: values.serviceName, startsAt: values.startsAt, location: values.location, notes: values.notes });
      }

      setValues({});
      setSelectedDogIds([]);
      onSaved();
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={Boolean(action)} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose} />
      <View style={styles.sheet}>
        <View style={styles.header}>
          <Text style={styles.title}>{action ? titles[action] : "Quick action"}</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#1D2238" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          {action === "client" ? (
            <>
              <Field label="Full name" value={values.fullName} onChangeText={(value) => updateValue("fullName", value)} />
              <Field label="Email" value={values.email} onChangeText={(value) => updateValue("email", value)} keyboardType="email-address" autoCapitalize="none" />
              <Field label="Phone" value={values.phone} onChangeText={(value) => updateValue("phone", value)} keyboardType="phone-pad" />
            </>
          ) : null}

          {action === "dog" ? (
            <>
              <SelectField label="Client" value={values.clientId} options={clientOptions} placeholder="Select a client" onSelect={(value) => updateValue("clientId", value)} />
              <Field label="Dog name" value={values.name} onChangeText={(value) => updateValue("name", value)} />
              <Field label="Breed" value={values.breed} onChangeText={(value) => updateValue("breed", value)} />
              <Field label="Age" value={values.age} onChangeText={(value) => updateValue("age", value)} />
              <Field label="Care notes" value={values.notes} onChangeText={(value) => updateValue("notes", value)} multiline />
            </>
          ) : null}

          {action === "booking" ? (
            <>
              <SelectField label="Client" value={values.clientId} options={clientOptions} placeholder="Select a client" onSelect={(value) => updateValue("clientId", value)} />
              <MultiSelectField label="Dog" values={selectedDogIds} options={dogOptions.map((dog) => ({ label: dog.name, value: dog.id }))} placeholder={values.clientId ? "Select dog(s)" : "Select a client first"} onToggle={toggleDog} />
              <SelectField label="Service" value={values.serviceName} options={serviceOptions} placeholder="Select a service" onSelect={(value) => updateValue("serviceName", value)} />
              <Field label="Starts at" placeholder="2026-07-11 10:00" value={values.startsAt} onChangeText={(value) => updateValue("startsAt", value)} />
              <Field label="Location" value={values.location} onChangeText={(value) => updateValue("location", value)} />
              <Field label="Notes" value={values.notes} onChangeText={(value) => updateValue("notes", value)} multiline />
            </>
          ) : null}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity style={styles.submitButton} activeOpacity={0.86} onPress={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitText}>Save</Text>}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

function SelectField({ label, value, options, placeholder, onSelect }: { label: string; value?: string; options: SelectOption[]; placeholder: string; onSelect: (value: string) => void }) {
  const selected = options.find((option) => option.value === value);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.optionGrid}>
        {options.length ? options.map((option) => (
          <TouchableOpacity key={option.value} style={[styles.optionPill, option.value === value && styles.optionPillSelected]} activeOpacity={0.82} onPress={() => onSelect(option.value)}>
            <Text style={[styles.optionText, option.value === value && styles.optionTextSelected]}>{option.label}</Text>
          </TouchableOpacity>
        )) : <Text style={styles.emptyOption}>{placeholder}</Text>}
      </View>
      {selected ? <Text style={styles.selectedHint}>Selected: {selected.label}</Text> : null}
    </View>
  );
}

function MultiSelectField({ label, values, options, placeholder, onToggle }: { label: string; values: string[]; options: SelectOption[]; placeholder: string; onToggle: (value: string) => void }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.optionGrid}>
        {options.length ? options.map((option) => {
          const selected = values.includes(option.value);
          return (
            <TouchableOpacity key={option.value} style={[styles.optionPill, selected && styles.optionPillSelected]} activeOpacity={0.82} onPress={() => onToggle(option.value)}>
              <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{option.label}</Text>
            </TouchableOpacity>
          );
        }) : <Text style={styles.emptyOption}>{placeholder}</Text>}
      </View>
    </View>
  );
}

function Field({ label, ...props }: { label: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput placeholderTextColor="#A0A4B8" style={[styles.input, props.multiline && styles.multiline]} {...props} />
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(29, 34, 56, 0.36)" },
  sheet: { backgroundColor: "#FFF", borderTopLeftRadius: 28, borderTopRightRadius: 28, bottom: 0, left: 0, maxHeight: "82%", padding: 22, position: "absolute", right: 0 },
  header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 18 },
  title: { color: "#1D2238", fontSize: 24, fontWeight: "700" },
  closeButton: { alignItems: "center", height: 42, justifyContent: "center", width: 42 },
  form: { gap: 14, paddingBottom: 24 },
  field: { gap: 8 },
  label: { color: "#374151", fontWeight: "700" },
  input: { backgroundColor: "#F8F9FD", borderColor: "#ECECF5", borderRadius: 16, borderWidth: 1, color: "#1D2238", fontSize: 16, paddingHorizontal: 16, paddingVertical: 14 },
  multiline: { minHeight: 96, textAlignVertical: "top" },
  optionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  optionPill: { backgroundColor: "#F8F9FD", borderColor: "#ECECF5", borderRadius: 999, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10 },
  optionPillSelected: { backgroundColor: "#F3EEFF", borderColor: "#5B3DF5" },
  optionText: { color: "#4B5563", fontWeight: "700" },
  optionTextSelected: { color: "#5B3DF5" },
  emptyOption: { color: "#A0A4B8", fontWeight: "600", paddingVertical: 10 },
  selectedHint: { color: "#70758E", fontSize: 12, fontWeight: "600" },
  error: { color: "#E11D48", fontWeight: "600" },
  submitButton: { alignItems: "center", backgroundColor: "#5B3DF5", borderRadius: 16, paddingVertical: 16 },
  submitText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
});