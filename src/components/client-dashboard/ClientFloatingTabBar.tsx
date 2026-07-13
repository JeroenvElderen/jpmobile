import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { supabase } from "@/lib/supabase";

type RouteKey = "home" | "bookings" | "pets" | "activity" | "profile" | "galleries";
type QuickAction = "booking" | "dog" | "message" | null;
type DogOption = { id: string; name: string };
type BookingSlot = { id: string; date: string; startTime: string };
type DogAvatarFile = { uri: string; name: string; type: string };
type DogDraft = { id: string; name: string; breed: string; age: string; notes: string; avatar: DogAvatarFile | null };

type Props = {
  activeRoute?: RouteKey;
};

const serviceOptions = ["Dog walking", "Drop-in visit", "Dog sitting", "Other"];
const durationOptions = ["30 minutes", "45 minutes", "1 hour", "1 hour 30 minutes", "2 hours", "Half day", "Full day", "Overnight / 24 hours"];
const businessWhatsappNumber = process.env.EXPO_PUBLIC_BUSINESS_WHATSAPP_NUMBER || "31600000000";
const createEmptyDogDraft = (id = String(Date.now())): DogDraft => ({ id, name: "", breed: "", age: "", notes: "", avatar: null });

export default function ClientFloatingTabBar({ activeRoute = "home" }: Props) {
  const router = useRouter();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [quickAction, setQuickAction] = useState<QuickAction>(null);
  const moreActive = activeRoute === "activity" || activeRoute === "profile" || activeRoute === "galleries";

  const navigate = (href: Parameters<typeof router.replace>[0]) => {
    setIsMoreOpen(false);
    setQuickAction(null);
    router.replace(href);
  };

  return (
    <SafeAreaView pointerEvents="box-none" style={styles.safeArea}>
      <ClientQuickActionModal action={quickAction} onClose={() => setQuickAction(null)} />
      <View style={styles.container}>
        <TabButton icon="home-outline" active={activeRoute === "home"} onPress={() => navigate("/client")} />
        <TabButton icon="calendar-outline" active={activeRoute === "bookings"} onPress={() => navigate("/client/bookings")} />

        <TouchableOpacity style={styles.fab} activeOpacity={0.9} onPress={() => setQuickAction("booking")}>
          <Ionicons name="add" size={34} color="#FFF" />
        </TouchableOpacity>

        <TabButton icon="paw-outline" active={activeRoute === "pets"} onPress={() => navigate("/client/dogs")} />

        <View style={styles.moreGroup}>
          {isMoreOpen && (
            <View style={styles.moreMenu}>
              <MoreButton icon="add-circle-outline" label="Request booking" active={quickAction === "booking"} onPress={() => { setIsMoreOpen(false); setQuickAction("booking"); }} />
              <MoreButton icon="paw-outline" label="Add dog" active={quickAction === "dog"} onPress={() => { setIsMoreOpen(false); setQuickAction("dog"); }} />
              <MoreButton icon="logo-whatsapp" label="Send message" active={quickAction === "message"} onPress={() => { setIsMoreOpen(false); setQuickAction("message"); }} />
              <View style={styles.moreDivider} />
              <MoreButton icon="images-outline" label="Galleries" active={activeRoute === "galleries"} onPress={() => navigate("/client/galleries")} />
              <MoreButton icon="person-outline" label="Profile" active={activeRoute === "profile"} onPress={() => navigate("/client/profile")} />
            </View>
          )}
          <TabButton icon="ellipsis-horizontal" active={moreActive || isMoreOpen} onPress={() => setIsMoreOpen((isOpen) => !isOpen)} />
        </View>
      </View>
    </SafeAreaView>
  );
}

function ClientQuickActionModal({ action, onClose }: { action: QuickAction; onClose: () => void }) {
  const [clientName, setClientName] = useState("there");
  const [clientId, setClientId] = useState<string | null>(null);
  const [dogs, setDogs] = useState<DogOption[]>([]);
  const [selectedDogIds, setSelectedDogIds] = useState<string[]>([]);
  const [service, setService] = useState(serviceOptions[0]);
  const [duration, setDuration] = useState("1 hour");
  const [slots, setSlots] = useState<BookingSlot[]>([{ id: "1", date: "", startTime: "" }]);
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [dogDrafts, setDogDrafts] = useState<DogDraft[]>([createEmptyDogDraft("1")]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const title = action === "booking" ? "Request Booking" : action === "dog" ? "Add dog" : "Send message";

  useEffect(() => {
    if (!action) return;
    let cancelled = false;
    setIsLoading(true);
    supabase.auth.getUser().then(async ({ data, error }) => {
      if (error) throw error;
      if (!data.user) throw new Error("Log in to continue.");
      const { data: client, error: clientError } = await supabase.from("portal_clients").select("id, full_name, first_name").eq("auth_user_id", data.user.id).single();
      if (clientError) throw clientError;
      const { data: dogRows, error: dogsError } = await supabase.from("portal_dogs").select("id, name").eq("client_id", client.id).order("created_at", { ascending: true });
      if (dogsError) throw dogsError;
      if (!cancelled) {
        setClientId(client.id);
        setClientName(client.first_name || client.full_name || "there");
        setDogs((dogRows ?? []).map((dog) => ({ id: dog.id, name: dog.name || "Unnamed dog" })));
      }
    }).catch((error) => Alert.alert("Unable to load details", error instanceof Error ? error.message : "Please try again.")).finally(() => !cancelled && setIsLoading(false));
    return () => { cancelled = true; };
  }, [action]);

  const selectedDogNames = useMemo(() => dogs.filter((dog) => selectedDogIds.includes(dog.id)).map((dog) => dog.name), [dogs, selectedDogIds]);

  const resetAndClose = () => {
    setSelectedDogIds([]); setService(serviceOptions[0]); setDuration("1 hour"); setSlots([{ id: "1", date: "", startTime: "" }]); setLocation(""); setNotes(""); setDogDrafts([createEmptyDogDraft("1")]); setMessage(""); onClose();
  };

  const openWhatsapp = async (body: string) => {
    const encoded = encodeURIComponent(body);
    const appUrl = `whatsapp://send?phone=${businessWhatsappNumber}&text=${encoded}`;
    const webUrl = `https://wa.me/${businessWhatsappNumber}?text=${encoded}`;
    const supported = await Linking.canOpenURL(appUrl);
    await Linking.openURL(supported ? appUrl : webUrl);
  };

  const updateDogDraft = (id: string, key: keyof Omit<DogDraft, "id">, value: string | DogAvatarFile | null) => setDogDrafts((current) => current.map((draft) => draft.id === id ? { ...draft, [key]: value } : draft));
  const addSecondDogDraft = () => setDogDrafts((current) => current.length >= 2 ? current : [...current, createEmptyDogDraft("2")]);
  const removeDogDraft = (id: string) => setDogDrafts((current) => current.length === 1 ? current : current.filter((draft) => draft.id !== id));

  const pickDogAvatar = async (draftId: string) => {
    const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, multiple: false, type: "*/*" });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (!asset?.uri) throw new Error("Selected file is missing a local URI.");

    try {
      const converted = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 900 } }],
        { compress: 0.88, format: ImageManipulator.SaveFormat.JPEG },
      );
      updateDogDraft(draftId, "avatar", { uri: converted.uri, name: toJpegFileName(asset.name || "dog-avatar"), type: "image/jpeg" });
    } catch {
      throw new Error("That file could not be converted into an avatar image. Please choose a photo or image document.");
    }
  };

  const uploadDogAvatar = async (dogId: string, avatar: DogAvatarFile) => {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    const token = sessionData.session?.access_token;
    if (!token) throw new Error("You must be signed in to upload a dog avatar.");

    const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/dog-avatar-upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ dogId, fileName: avatar.name, contentType: avatar.type }),
    });
    const upload = await response.json();
    if (!response.ok) throw new Error(upload.error || "Unable to prepare avatar upload.");

    const uploadBody = await fetch(avatar.uri).then((fileResponse) => fileResponse.blob());
    const { error: uploadError } = await supabase.storage.from(upload.bucket).uploadToSignedUrl(upload.path, upload.token, uploadBody, { contentType: upload.contentType });
    if (uploadError) throw uploadError;

    const { error: updateError } = await supabase.from("portal_dogs").update({ profile_photo_url: upload.publicUrl }).eq("id", dogId).eq("client_id", clientId);
    if (updateError) throw updateError;
  };

  const submit = async () => {
    setIsSubmitting(true);
    try {
      if (action === "booking") {
        if (!selectedDogIds.length) throw new Error("Please choose who the booking is for.");
        const filledSlots = slots.filter((slot) => slot.date.trim() && slot.startTime.trim());
        if (!filledSlots.length) throw new Error("Please add at least one date and start time.");
        await openWhatsapp(`Request booking\n\nClient: ${clientName}\nDog(s): ${selectedDogNames.join(", ")}\nService: ${service}\nWhen: ${filledSlots.map((slot, index) => `${index + 1}. ${slot.date} at ${slot.startTime}`).join("; ")}\nHow long: ${duration}\nLocation: ${location || "To be confirmed"}\nNotes: ${notes || "None"}`);
      }
      if (action === "dog") {
        if (!clientId) throw new Error("Unable to find your client profile.");
        const dogsToCreate = dogDrafts.filter((draft) => draft.name.trim() || draft.breed.trim() || draft.age.trim() || draft.notes.trim() || draft.avatar);
        if (!dogsToCreate.length || !dogsToCreate[0].name.trim()) throw new Error("Please enter at least one dog name.");
        const unnamedDog = dogsToCreate.find((draft) => !draft.name.trim());
        if (unnamedDog) throw new Error("Please enter a name for each dog you add.");

        for (const draft of dogsToCreate) {
          const { data: dog, error } = await supabase.from("portal_dogs").insert({ client_id: clientId, name: draft.name.trim(), breed: draft.breed.trim() || null, age: draft.age.trim() || null, notes: draft.notes.trim() || null, status: "active" }).select("id").single();
          if (error) throw error;
          if (draft.avatar) await uploadDogAvatar(dog.id, draft.avatar);
        }
        Alert.alert("Dog added", `${dogsToCreate.length === 1 ? dogsToCreate[0].name.trim() : `${dogsToCreate.length} dogs`} ${dogsToCreate.length === 1 ? "has" : "have"} been added to your portal.`);
      }
      if (action === "message") {
        if (!message.trim()) throw new Error("Please type a message first.");
        await openWhatsapp(`Message from ${clientName}\n\n${message.trim()}`);
      }
      resetAndClose();
    } catch (error) {
      Alert.alert("Unable to continue", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateSlot = (id: string, key: "date" | "startTime", value: string) => setSlots((current) => current.map((slot) => slot.id === id ? { ...slot, [key]: value } : slot));
  const addSlot = () => setSlots((current) => current.length >= 20 ? current : [...current, { id: String(Date.now()), date: "", startTime: "" }]);
  const removeSlot = (id: string) => setSlots((current) => current.length === 1 ? current : current.filter((slot) => slot.id !== id));

  return (
    <Modal visible={Boolean(action)} transparent animationType="slide" onRequestClose={resetAndClose}>
      <Pressable style={styles.backdrop} onPress={resetAndClose} />
      <View style={styles.sheet}>
        <View style={styles.sheetHeader}><View><Text style={styles.eyebrow}>{title}</Text><Text style={styles.sheetTitle}>{title}</Text></View><TouchableOpacity onPress={resetAndClose} style={styles.closeButton}><Ionicons name="close" size={25} color="#3B198F" /></TouchableOpacity></View>
        {isLoading ? <View style={styles.loadingState}><ActivityIndicator color="#5B3DF5" /><Text style={styles.mutedText}>Loading your details...</Text></View> : (
          <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
            {action === "booking" ? <>
              <Text style={styles.label}>Who is this booking for?</Text>
              {dogs.length ? <View style={styles.optionGrid}>{dogs.map((dog) => <TouchableOpacity key={dog.id} style={[styles.optionPill, selectedDogIds.includes(dog.id) && styles.optionPillSelected]} onPress={() => setSelectedDogIds((current) => current.includes(dog.id) ? current.filter((id) => id !== dog.id) : [...current, dog.id])}><Text style={[styles.optionText, selectedDogIds.includes(dog.id) && styles.optionTextSelected]}>{dog.name}</Text></TouchableOpacity>)}</View> : <Text style={styles.emptyText}>No dogs found yet.</Text>}
              <Dropdown label="Service" value={service} options={serviceOptions} onSelect={setService} />
              <View style={styles.rowBetween}><View><Text style={styles.label}>Dates and start times</Text><Text style={styles.helpText}>Request up to 20 booking slots.</Text></View><TouchableOpacity style={styles.outlineButton} onPress={addSlot} disabled={slots.length >= 20}><Text style={styles.outlineText}>Add another date</Text></TouchableOpacity></View>
              {slots.map((slot, index) => <View key={slot.id} style={styles.slotCard}><Field label={`Date ${index + 1}`} placeholder="dd/mm/yyyy" value={slot.date} onChangeText={(value) => updateSlot(slot.id, "date", value)} /><Field label="Start time" placeholder="--:--" value={slot.startTime} onChangeText={(value) => updateSlot(slot.id, "startTime", value)} /><TouchableOpacity style={styles.removeButton} onPress={() => removeSlot(slot.id)} disabled={slots.length === 1}><Text style={styles.removeText}>Remove</Text></TouchableOpacity></View>)}
              <Dropdown label="How long?" value={duration} options={durationOptions} onSelect={setDuration} />
              <Field label="Location" placeholder="Home address, usual pick-up point, or to be confirmed" value={location} onChangeText={setLocation} />
              <Field label="Notes" placeholder="Add preferred times, care notes, or anything Jeroen should know." value={notes} onChangeText={setNotes} multiline />
            </> : null}
            {action === "dog" ? <DogDraftFields drafts={dogDrafts} onUpdate={updateDogDraft} onPickAvatar={(draftId) => pickDogAvatar(draftId).catch((error) => Alert.alert("Unable to use file", error instanceof Error ? error.message : "Please try another file."))} onAddSecondDog={addSecondDogDraft} onRemove={removeDogDraft} /> : null}
            {action === "message" ? <Field label="Message" placeholder="Type your WhatsApp message..." value={message} onChangeText={setMessage} multiline /> : null}
          </ScrollView>
        )}
        <View style={styles.footer}><TouchableOpacity style={styles.cancelButton} onPress={resetAndClose}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity><TouchableOpacity style={styles.submitButton} onPress={submit} disabled={isSubmitting || isLoading}>{isSubmitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitText}>{action === "booking" ? `Send ${slots.length} booking request${slots.length === 1 ? "" : "s"}` : action === "message" ? "Send to WhatsApp" : "Save dog"} <Ionicons name="paper-plane-outline" size={15} /></Text>}</TouchableOpacity></View>
      </View>
    </Modal>
  );
}

function DogDraftFields({ drafts, onUpdate, onPickAvatar, onAddSecondDog, onRemove }: { drafts: DogDraft[]; onUpdate: (id: string, key: keyof Omit<DogDraft, "id">, value: string | DogAvatarFile | null) => void; onPickAvatar: (id: string) => void; onAddSecondDog: () => void; onRemove: (id: string) => void }) {
  const canAddSecondDog = drafts.length === 1 && drafts[0].name.trim().length > 0;

  return <>
    {drafts.map((draft, index) => (
      <View key={draft.id} style={styles.dogDraftCard}>
        <View style={styles.dogDraftHeader}>
          <View>
            <Text style={styles.label}>Dog {index + 1}</Text>
            <Text style={styles.helpText}>{index === 0 ? "Required" : "Optional second dog"}</Text>
          </View>
          {index > 0 ? <TouchableOpacity onPress={() => onRemove(draft.id)}><Text style={styles.removeAvatarText}>Remove</Text></TouchableOpacity> : null}
        </View>
        <Field label="Dog name" value={draft.name} onChangeText={(value) => onUpdate(draft.id, "name", value)} />
        <AvatarPicker avatar={draft.avatar} onPick={() => onPickAvatar(draft.id)} onClear={() => onUpdate(draft.id, "avatar", null)} />
        <Field label="Breed" value={draft.breed} onChangeText={(value) => onUpdate(draft.id, "breed", value)} />
        <Field label="Age" value={draft.age} onChangeText={(value) => onUpdate(draft.id, "age", value)} />
        <Field label="Care notes" value={draft.notes} onChangeText={(value) => onUpdate(draft.id, "notes", value)} multiline />
      </View>
    ))}
    {canAddSecondDog ? <TouchableOpacity style={styles.addDogButton} onPress={onAddSecondDog}><Ionicons name="add-circle-outline" size={18} color="#3B198F" /><Text style={styles.addDogText}>Add a second dog</Text></TouchableOpacity> : null}
  </>;
}

function toJpegFileName(fileName: string) {
  const withoutExtension = fileName.replace(/\.[^/.]+$/, "") || "dog-avatar";
  return `${withoutExtension}.jpg`;
}

function AvatarPicker({ avatar, onPick, onClear }: { avatar: DogAvatarFile | null; onPick: () => void; onClear: () => void }) {
  return <View style={styles.field}><Text style={styles.label}>Profile avatar</Text><TouchableOpacity style={styles.avatarPicker} onPress={onPick}><Ionicons name="cloud-upload-outline" size={20} color="#3B198F" /><View style={styles.avatarPickerCopy}><Text style={styles.avatarPickerTitle}>{avatar ? avatar.name : "Upload any file type"}</Text><Text style={styles.helpText}>{avatar ? "Converted to a JPEG avatar." : "We will convert supported files to a profile image."}</Text></View></TouchableOpacity>{avatar ? <TouchableOpacity onPress={onClear}><Text style={styles.removeAvatarText}>Remove selected avatar</Text></TouchableOpacity> : null}</View>;
}

function Field({ label, ...props }: { label: string } & React.ComponentProps<typeof TextInput>) { return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput placeholderTextColor="#8F8EA0" style={[styles.input, props.multiline && styles.multiline]} {...props} /></View>; }
function Dropdown({ label, value, options, onSelect }: { label: string; value: string; options: string[]; onSelect: (value: string) => void }) { const [open, setOpen] = useState(false); return <View style={styles.field}><Text style={styles.label}>{label}</Text><TouchableOpacity style={styles.selectInput} onPress={() => setOpen((current) => !current)}><Text style={styles.selectText}>{value}</Text><Ionicons name={open ? "chevron-up" : "chevron-down"} size={18} color="#1D2238" /></TouchableOpacity>{open ? <View style={styles.selectMenu}>{options.map((option) => <TouchableOpacity key={option} style={[styles.selectOption, option === value && styles.selectOptionActive]} onPress={() => { onSelect(option); setOpen(false); }}><Text style={styles.selectText}>{option}</Text></TouchableOpacity>)}</View> : null}</View>; }

type TabButtonProps = { icon: keyof typeof Ionicons.glyphMap; active?: boolean; onPress: () => void; };
function TabButton({ icon, active, onPress }: TabButtonProps) { return <TouchableOpacity onPress={onPress} style={[styles.tab, active && styles.activeTab]} activeOpacity={1}><Ionicons name={icon} size={25} color={active ? "#5B3DF5" : "#9CA3AF"} /></TouchableOpacity>; }
function MoreButton({ icon, label, active, onPress }: TabButtonProps & { label: string }) { return <TouchableOpacity onPress={onPress} style={[styles.moreButton, active && styles.activeMoreButton]} activeOpacity={1}><Ionicons name={icon} size={18} color={active ? "#5B3DF5" : "#5B668D"} /><Text style={[styles.moreLabel, active && styles.activeMoreLabel]}>{label}</Text></TouchableOpacity>; }

const styles = StyleSheet.create({
  safeArea: { position: "absolute", left: 0, right: 0, bottom: 0 },
  container: { marginHorizontal: 18, marginBottom: 10, height: 82, backgroundColor: "#FFF", borderRadius: 50, flexDirection: "row", justifyContent: "space-evenly", alignItems: "center", shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 24, shadowOffset: { width: 0, height: 10 }, elevation: 15 },
  tab: { width: 48, height: 48, justifyContent: "center", alignItems: "center", borderRadius: 24 },
  activeTab: { backgroundColor: "#F3EEFF" },
  moreGroup: { alignItems: "center", justifyContent: "center" },
  moreMenu: { position: "absolute", bottom: 62, right: 0, width: 210, backgroundColor: "#FFF", borderRadius: 22, padding: 8, shadowColor: "#000", shadowOpacity: 0.14, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 18 },
  moreButton: { alignItems: "center", borderRadius: 16, flexDirection: "row", gap: 8, paddingHorizontal: 12, paddingVertical: 11 },
  activeMoreButton: { backgroundColor: "#F3EEFF" },
  moreLabel: { color: "#5B668D", fontSize: 13, fontWeight: "700" },
  activeMoreLabel: { color: "#5B3DF5" },
  moreDivider: { backgroundColor: "#ECECF5", height: 1, marginVertical: 6 },
  fab: { width: 68, height: 68, borderRadius: 34, backgroundColor: "#5B3DF5", justifyContent: "center", alignItems: "center", marginTop: -35, shadowColor: "#5B3DF5", shadowOpacity: 0.35, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 20 },
  backdrop: { flex: 1, backgroundColor: "rgba(29, 34, 56, 0.42)" },
  sheet: { backgroundColor: "#FFF", borderTopLeftRadius: 28, borderTopRightRadius: 28, bottom: 0, left: 0, maxHeight: "90%", position: "absolute", right: 0 },
  sheetHeader: { alignItems: "center", borderBottomColor: "#ECECF5", borderBottomWidth: 1, flexDirection: "row", justifyContent: "space-between", padding: 22 },
  eyebrow: { color: "#3B198F", fontSize: 12, fontWeight: "900", letterSpacing: 2, textTransform: "uppercase" },
  sheetTitle: { color: "#1D2238", fontSize: 28, fontWeight: "700", marginTop: 6 },
  closeButton: { alignItems: "center", height: 42, justifyContent: "center", width: 42 },
  loadingState: { alignItems: "center", gap: 10, padding: 32 },
  form: { gap: 16, padding: 22, paddingBottom: 30 },
  field: { flex: 1, gap: 8 },
  label: { color: "#2E2A3D", fontWeight: "800" },
  helpText: { color: "#6E7191", fontSize: 12, marginTop: 5 },
  mutedText: { color: "#6E7191", fontWeight: "600" },
  emptyText: { color: "#9A3412", fontWeight: "600" },
  dogDraftCard: { backgroundColor: "#FAF8FF", borderColor: "#E4DFEE", borderRadius: 16, borderWidth: 1, gap: 14, padding: 14 },
  dogDraftHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  addDogButton: { alignItems: "center", alignSelf: "flex-start", borderColor: "#B5A7DF", borderRadius: 999, borderWidth: 1, flexDirection: "row", gap: 8, paddingHorizontal: 14, paddingVertical: 12 },
  addDogText: { color: "#3B198F", fontSize: 12, fontWeight: "900", letterSpacing: 1.2, textTransform: "uppercase" },
  avatarPicker: { alignItems: "center", borderColor: "#DAD7E6", borderRadius: 13, borderWidth: 1, flexDirection: "row", gap: 12, paddingHorizontal: 16, paddingVertical: 13 },
  avatarPickerCopy: { flex: 1 },
  avatarPickerTitle: { color: "#171326", fontSize: 15, fontWeight: "800" },
  removeAvatarText: { color: "#9A3412", fontSize: 12, fontWeight: "900", letterSpacing: 1.2, textTransform: "uppercase" },
  input: { borderColor: "#DAD7E6", borderRadius: 13, borderWidth: 1, color: "#171326", fontSize: 15, paddingHorizontal: 16, paddingVertical: 13 },
  multiline: { minHeight: 96, textAlignVertical: "top" },
  selectInput: { alignItems: "center", borderColor: "#DAD7E6", borderRadius: 13, borderWidth: 1, flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 13 },
  selectText: { color: "#171326", fontSize: 15 },
  selectMenu: { borderColor: "#DAD7E6", borderRadius: 13, borderWidth: 1, overflow: "hidden" },
  selectOption: { paddingHorizontal: 16, paddingVertical: 12 },
  selectOptionActive: { backgroundColor: "#BBDDFF" },
  optionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  optionPill: { backgroundColor: "#FFF", borderColor: "#DAD7E6", borderRadius: 999, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10 },
  optionPillSelected: { backgroundColor: "#F3EEFF", borderColor: "#5B3DF5" },
  optionText: { color: "#4B5563", fontWeight: "700" },
  optionTextSelected: { color: "#5B3DF5" },
  rowBetween: { alignItems: "center", flexDirection: "row", gap: 14, justifyContent: "space-between" },
  outlineButton: { borderColor: "#B5A7DF", borderRadius: 4, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12 },
  outlineText: { color: "#3B198F", fontSize: 12, fontWeight: "900", letterSpacing: 1.4, textTransform: "uppercase" },
  slotCard: { backgroundColor: "#FAF8FF", borderColor: "#E4DFEE", borderRadius: 13, borderWidth: 1, gap: 12, padding: 14 },
  removeButton: { alignItems: "center", borderColor: "#E4DFEE", borderRadius: 8, borderWidth: 1, paddingVertical: 12 },
  removeText: { color: "#A99BCE", fontSize: 12, fontWeight: "900", letterSpacing: 1.2, textTransform: "uppercase" },
  footer: { alignItems: "center", borderTopColor: "#ECECF5", borderTopWidth: 1, flexDirection: "row", gap: 12, justifyContent: "flex-end", padding: 18 },
  cancelButton: { borderColor: "#B5A7DF", borderRadius: 4, borderWidth: 1, paddingHorizontal: 22, paddingVertical: 14 },
  cancelText: { color: "#3B198F", fontSize: 12, fontWeight: "900", letterSpacing: 1.5, textTransform: "uppercase" },
  submitButton: { alignItems: "center", backgroundColor: "#9478BF", borderRadius: 4, minWidth: 150, paddingHorizontal: 18, paddingVertical: 15 },
  submitText: { color: "#FFF", fontSize: 12, fontWeight: "900", letterSpacing: 1.2, textTransform: "uppercase" },
});