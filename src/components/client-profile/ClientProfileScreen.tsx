import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import ClientFloatingTabBar from "@/components/client-dashboard/ClientFloatingTabBar";
import { fetchClientProfileData, type ClientProfile } from "@/lib/clientProfileData";
import { supabase } from "@/lib/supabase";

type ProfileItem = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
};

type ProfileSection = {
  title: string;
  items: ProfileItem[];
};

const profileSections: ProfileSection[] = [
  {
    title: "Account",
    items: [
      { icon: "person-outline", title: "Personal Information", subtitle: "Review your saved contact details" },
      { icon: "lock-closed-outline", title: "Change Password", subtitle: "Update your password" },
      { icon: "notifications-outline", title: "Notifications", subtitle: "Manage your notification preferences" },
      { icon: "card-outline", title: "Payment Methods", subtitle: "Manage your saved payment methods" },
    ],
  },
  {
    title: "Preferences",
    items: [
      { icon: "paw-outline", title: "Pet Preferences", subtitle: "View the pets linked to your account" },
      { icon: "calendar-outline", title: "Booking Preferences", subtitle: "Set your booking and service preferences" },
      { icon: "location-outline", title: "Address", subtitle: "Confirm your saved care address" },
    ],
  },
  {
    title: "Support",
    items: [
      { icon: "help-circle-outline", title: "Help Center", subtitle: "Find answers to common questions" },
      { icon: "chatbox-ellipses-outline", title: "Contact Us", subtitle: "Get in touch with our support team" },
      { icon: "shield-checkmark-outline", title: "Privacy Policy", subtitle: "Learn how we protect your data" },
      { icon: "document-text-outline", title: "Terms of Service", subtitle: "Read our terms and conditions" },
    ],
  },
];

export default function ClientProfileScreen() {
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [activePopup, setActivePopup] = useState<"personal" | "password" | null>(null);
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  const loadProfile = useCallback(async ({ showLoading = true }: { showLoading?: boolean } = {}) => {
    if (showLoading) setIsLoading(true);
    setError(null);

    try {
      setProfile(await fetchClientProfileData());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load your profile.");
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (!profile?.clientId) return undefined;

    const refreshProfile = () => {
      if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = setTimeout(() => loadProfile({ showLoading: false }), 300);
    };

    const channel = supabase
      .channel(`client-profile-${profile.clientId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "portal_clients", filter: `id=eq.${profile.clientId}` }, refreshProfile)
      .on("postgres_changes", { event: "*", schema: "public", table: "portal_dogs", filter: `client_id=eq.${profile.clientId}` }, refreshProfile)
      .on("postgres_changes", { event: "*", schema: "public", table: "portal_client_activity", filter: `client_id=eq.${profile.clientId}` }, refreshProfile)
      .subscribe();

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
      supabase.removeChannel(channel);
    };
  }, [profile?.clientId, loadProfile]);

  const handleLogout = useCallback(async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      setIsLoggingOut(false);
      Alert.alert("Logout failed", signOutError.message);
      return;
    }

    setProfile(null);
    router.replace("/(auth)/login");
  }, [isLoggingOut, router]);

  if (isLoading) {
    return <CenteredState message="Loading your profile..." />;
  }

  if (error || !profile) {
    return <CenteredState error={error || "Unable to load your profile."} onRetry={() => loadProfile()} />;
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <ProfileHeader activityCount={profile.recentActivityCount} />
        <ProfileSummary profile={profile} />
        {profileSections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionCard}>
              {section.items.map((item, index) => (
                <ProfileRow key={item.title} item={item} isLast={index === section.items.length - 1} onPress={() => {
                  if (item.title === "Personal Information") setActivePopup("personal");
                  if (item.title === "Change Password") setActivePopup("password");
                }} />
              ))}
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.logoutButton} activeOpacity={0.85} disabled={isLoggingOut} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={21} color="#EF2929" />
          <Text style={styles.logoutText}>{isLoggingOut ? "Logging out..." : "Log Out"}</Text>
        </TouchableOpacity>
      </ScrollView>

      <ProfilePopup mode={activePopup} profile={profile} onClose={() => setActivePopup(null)} onSaved={() => loadProfile({ showLoading: false })} />
      <ClientFloatingTabBar activeRoute="profile" />
    </View>
  );
}

function ProfileHeader({ activityCount }: { activityCount: number }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.headerIcon} activeOpacity={0.8}>
        <Ionicons name="menu-outline" size={32} color="#141A33" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Profile</Text>
      <TouchableOpacity style={styles.headerIcon} activeOpacity={0.8}>
        <Ionicons name="notifications-outline" size={27} color="#141A33" />
        {activityCount ? <View style={styles.badge}><Text style={styles.badgeText}>{Math.min(activityCount, 9)}</Text></View> : null}
      </TouchableOpacity>
    </View>
  );
}

function ProfileSummary({ profile }: { profile: ClientProfile }) {
  return (
    <View style={styles.summaryCard}>
      <View style={styles.avatarWrap}>
        <Image source={profile.avatarUrl} style={styles.avatar} contentFit="cover" />
      </View>

      <View style={styles.summaryDetails}>
        <Text style={styles.name}>{profile.fullName}</Text>
        <ContactLine icon="paw-outline" text={profile.dogNames} />
        <ContactLine icon="location-outline" text={profile.address} />
        <ContactLine icon="mail-outline" text={profile.email} />
        <ContactLine icon="call-outline" text={profile.phone} />
        <Text style={styles.memberSince}>{profile.memberSince}</Text>
      </View>
    </View>
  );
}

function ContactLine({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.contactLine}>
      <Ionicons name={icon} size={19} color="#53608F" />
      <Text style={styles.contactText}>{text}</Text>
    </View>
  );
}

function ProfileRow({ item, isLast, onPress }: { item: ProfileItem; isLast: boolean; onPress?: () => void }) {
  return (
    <TouchableOpacity style={styles.row} activeOpacity={0.82} onPress={onPress}>
      <View style={styles.rowIconWrap}>
        <Ionicons name={item.icon} size={27} color="#5B3DF5" />
      </View>
      <View style={[styles.rowTextWrap, !isLast && styles.rowDivider]}>
        <View>
          <Text style={styles.rowTitle}>{item.title}</Text>
          <Text style={styles.rowSubtitle}>{item.subtitle}</Text>
        </View>
        <Ionicons name="chevron-forward" size={22} color="#53608F" />
      </View>
    </TouchableOpacity>
  );
}

function ProfilePopup({ mode, profile, onClose, onSaved }: { mode: "personal" | "password" | null; profile: ClientProfile; onClose: () => void; onSaved: () => void }) {
  const [fullName, setFullName] = useState(profile.fullName === "Client" ? "" : profile.fullName);
  const [email, setEmail] = useState(profile.email === "No email on file" ? "" : profile.email);
  const [phone, setPhone] = useState(profile.phone === "No phone on file" ? "" : profile.phone);
  const [address, setAddress] = useState(profile.address === "No address on file" ? "" : profile.address);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!mode) return;
    setFullName(profile.fullName === "Client" ? "" : profile.fullName);
    setEmail(profile.email === "No email on file" ? "" : profile.email);
    setPhone(profile.phone === "No phone on file" ? "" : profile.phone);
    setAddress(profile.address === "No address on file" ? "" : profile.address);
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setFormError(null);
  }, [mode, profile.address, profile.email, profile.fullName, profile.phone]);

  const handleSavePersonal = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!fullName.trim() || !normalizedEmail) {
      setFormError("Name and email are required.");
      return;
    }

    setIsSaving(true);
    setFormError(null);
    try {
      const { error: profileError } = await supabase
        .from("portal_clients")
        .update({ full_name: fullName.trim(), email: normalizedEmail, phone: phone.trim() || null, address: address.trim() || null })
        .eq("id", profile.clientId);

      if (profileError) throw profileError;

      const { error: authError } = await supabase.auth.updateUser({ email: normalizedEmail });
      if (authError) throw authError;

      onSaved();
      onClose();
      Alert.alert("Profile updated", "Your personal information has been saved.");
    } catch (saveError) {
      setFormError(saveError instanceof Error ? saveError.message : "Unable to save your personal information.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      setFormError("Old password, new password, and confirmation are required.");
      return;
    }
    if (newPassword.length < 8) {
      setFormError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setFormError("New passwords do not match.");
      return;
    }

    setIsSaving(true);
    setFormError(null);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: profile.email, password: oldPassword });
      if (signInError) throw signInError;

      const { error: passwordError } = await supabase.auth.updateUser({ password: newPassword });
      if (passwordError) throw passwordError;

      onClose();
      Alert.alert("Password updated", "Your password has been changed.");
    } catch (saveError) {
      setFormError(saveError instanceof Error ? saveError.message : "Unable to change your password.");
    } finally {
      setIsSaving(false);
    }
  };

  const isPersonal = mode === "personal";

  return (
    <Modal visible={Boolean(mode)} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.popupContainer} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.popupHeader}>
          <TouchableOpacity style={styles.popupClose} activeOpacity={0.8} onPress={onClose}>
            <Ionicons name="close" size={28} color="#141A33" />
          </TouchableOpacity>
          <Text style={styles.popupTitle}>{isPersonal ? "Personal Information" : "Change Password"}</Text>
          <View style={styles.popupClose} />
        </View>

        <ScrollView contentContainerStyle={styles.popupContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={styles.popupIntro}>{isPersonal ? "Update the contact details saved to your client profile." : "Enter your old password and choose a new secure password."}</Text>
          {formError ? <Text style={styles.formError}>{formError}</Text> : null}

          {isPersonal ? (
            <>
              <ProfileField label="Full name" value={fullName} onChangeText={setFullName} autoComplete="name" />
              <ProfileField label="Email" value={email} onChangeText={setEmail} autoComplete="email" keyboardType="email-address" autoCapitalize="none" />
              <ProfileField label="Phone" value={phone} onChangeText={setPhone} autoComplete="tel" keyboardType="phone-pad" />
              <ProfileField label="Address" value={address} onChangeText={setAddress} autoComplete="street-address" multiline />
            </>
          ) : (
            <>
              <ProfileField label="Old password" value={oldPassword} onChangeText={setOldPassword} secureTextEntry autoComplete="current-password" />
              <ProfileField label="New password" value={newPassword} onChangeText={setNewPassword} secureTextEntry autoComplete="new-password" />
              <ProfileField label="Confirm new password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry autoComplete="new-password" />
            </>
          )}

          <TouchableOpacity style={[styles.saveButton, isSaving && styles.saveButtonDisabled]} activeOpacity={0.86} disabled={isSaving} onPress={isPersonal ? handleSavePersonal : handleSavePassword}>
            <Text style={styles.saveButtonText}>{isSaving ? "Saving..." : "Save changes"}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function ProfileField(props: { label: string; value: string; onChangeText: (value: string) => void; secureTextEntry?: boolean; autoComplete?: "name" | "email" | "tel" | "street-address" | "current-password" | "new-password"; keyboardType?: "default" | "email-address" | "phone-pad"; autoCapitalize?: "none" | "sentences" | "words" | "characters"; multiline?: boolean }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{props.label}</Text>
      <TextInput
        style={[styles.fieldInput, props.multiline && styles.fieldInputMultiline]}
        value={props.value}
        onChangeText={props.onChangeText}
        secureTextEntry={props.secureTextEntry}
        autoComplete={props.autoComplete}
        keyboardType={props.keyboardType}
        autoCapitalize={props.autoCapitalize}
        multiline={props.multiline}
        placeholderTextColor="#9AA1BA"
      />
    </View>
  );
}

function CenteredState({ message, error, onRetry }: { message?: string; error?: string; onRetry?: () => void }) {
  return (
    <View style={[styles.container, styles.centered]}>
      {message ? <ActivityIndicator color="#5B3DF5" size="large" /> : null}
      <Text style={error ? styles.errorTitle : styles.loadingText}>{error ? "Profile unavailable" : message}</Text>
      {error ? <Text style={styles.errorMessage}>{error}</Text> : null}
      {onRetry ? <TouchableOpacity style={styles.retryButton} activeOpacity={0.86} onPress={onRetry}><Text style={styles.retryText}>Try again</Text></TouchableOpacity> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#F8F9FD", flex: 1 },
  content: { paddingBottom: 142, paddingHorizontal: 22, paddingTop: 60 },
  centered: { alignItems: "center", justifyContent: "center", padding: 24 },
  loadingText: { color: "#70758E", fontWeight: "600", marginTop: 14 },
  errorTitle: { color: "#1D2238", fontSize: 22, fontWeight: "700", marginBottom: 8 },
  errorMessage: { color: "#70758E", lineHeight: 22, marginBottom: 18, textAlign: "center" },
  retryButton: { backgroundColor: "#5B3DF5", borderRadius: 16, paddingHorizontal: 22, paddingVertical: 14 },
  retryText: { color: "#FFF", fontWeight: "700" },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    marginTop: 12,
  },
  headerIcon: { alignItems: "center", height: 44, justifyContent: "center", width: 44 },
  headerTitle: { color: "#080D20", fontSize: 28, fontWeight: "800" },
  badge: {
    alignItems: "center",
    backgroundColor: "#EF2852",
    borderRadius: 12,
    height: 24,
    justifyContent: "center",
    position: "absolute",
    right: 1,
    top: 0,
    width: 24,
  },
  badgeText: { color: "#FFF", fontSize: 12, fontWeight: "800" },
  summaryCard: {
    alignItems: "flex-start",
    backgroundColor: "#FBF9FF",
    borderColor: "#ECE7FF",
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    gap: 16,
    marginBottom: 22,
    padding: 18,
    shadowColor: "#5B3DF5",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
  },
  avatarWrap: { height: 92, width: 92 },
  avatar: { borderRadius: 46, height: 92, width: 92 },
  summaryDetails: { flex: 1, gap: 8, paddingTop: 2 },
  name: { color: "#080D20", fontSize: 23, fontWeight: "800", marginBottom: 2 },
  contactLine: { alignItems: "center", flexDirection: "row", gap: 11 },
  contactText: { color: "#53608F", flex: 1, fontSize: 15, fontWeight: "600", lineHeight: 20 },
  memberSince: { color: "#7A6AF8", fontSize: 14, fontWeight: "800", marginTop: 2 },
  section: { marginBottom: 22 },
  sectionTitle: { color: "#080D20", fontSize: 22, fontWeight: "800", marginBottom: 12 },
  sectionCard: {
    backgroundColor: "#FFF",
    borderColor: "#E6EAF5",
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  row: { alignItems: "center", flexDirection: "row", paddingLeft: 16 },
  rowIconWrap: {
    alignItems: "center",
    backgroundColor: "#F3EEFF",
    borderRadius: 24,
    height: 48,
    justifyContent: "center",
    marginRight: 16,
    width: 48,
  },
  rowTextWrap: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 82,
    paddingRight: 18,
  },
  rowDivider: { borderBottomColor: "#E6EAF5", borderBottomWidth: 1 },
  rowTitle: { color: "#10162C", fontSize: 17, fontWeight: "800", marginBottom: 5 },
  rowSubtitle: { color: "#53608F", fontSize: 15, fontWeight: "600" },
  logoutButton: {
    alignItems: "center",
    backgroundColor: "#FFF0F0",
    borderColor: "#FFE0E0",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    marginBottom: 12,
    paddingVertical: 19,
  },
  logoutText: { color: "#EF2929", fontSize: 17, fontWeight: "800" },
  popupContainer: { backgroundColor: "#F8F9FD", flex: 1 },
  popupHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 18, paddingTop: 56, paddingBottom: 18 },
  popupClose: { alignItems: "center", height: 44, justifyContent: "center", width: 44 },
  popupTitle: { color: "#080D20", fontSize: 23, fontWeight: "800" },
  popupContent: { padding: 22, paddingBottom: 44 },
  popupIntro: { color: "#53608F", fontSize: 16, fontWeight: "600", lineHeight: 24, marginBottom: 18 },
  formError: { backgroundColor: "#FFF0F0", borderColor: "#FFD8D8", borderRadius: 14, borderWidth: 1, color: "#C42121", fontWeight: "700", lineHeight: 21, marginBottom: 16, padding: 14 },
  fieldWrap: { marginBottom: 16 },
  fieldLabel: { color: "#10162C", fontSize: 15, fontWeight: "800", marginBottom: 8 },
  fieldInput: { backgroundColor: "#FFF", borderColor: "#E0E5F2", borderRadius: 14, borderWidth: 1, color: "#10162C", fontSize: 16, fontWeight: "600", minHeight: 56, paddingHorizontal: 16 },
  fieldInputMultiline: { minHeight: 104, paddingTop: 16, textAlignVertical: "top" },
  saveButton: { alignItems: "center", backgroundColor: "#5B3DF5", borderRadius: 16, justifyContent: "center", marginTop: 10, paddingVertical: 18 },
  saveButtonDisabled: { opacity: 0.65 },
  saveButtonText: { color: "#FFF", fontSize: 17, fontWeight: "800" },
});