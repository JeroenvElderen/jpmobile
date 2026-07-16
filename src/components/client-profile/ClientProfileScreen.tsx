import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import ClientFloatingTabBar from "@/components/client-dashboard/ClientFloatingTabBar";
import { usePushNotifications } from "@/providers/PushNotificationsProvider";
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
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();
  const { expoPushToken, isRegistering, lastRegistrationStatus, registerForPushNotifications, scheduleTestNotification } = usePushNotifications();

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

  const handleEnableNotifications = useCallback(async () => {
    try {
      const result = await registerForPushNotifications();

      if (result.expoPushToken) {
        Alert.alert("Notifications enabled", "Push notifications are enabled for this device.");
        return;
      }

      if (result.status === "missing-project-id") {
        Alert.alert("Project ID needed", "Add your EAS project ID to the Expo app config before requesting a push token.");
        return;
      }

      if (result.status === "unavailable") {
        Alert.alert("Physical device needed", "Push notifications require a physical device or supported simulator.");
        return;
      }

      Alert.alert("Notifications disabled", "Enable notifications in your device settings to receive updates.");
    } catch (registrationError) {
      Alert.alert("Notification setup failed", registrationError instanceof Error ? registrationError.message : "Unable to enable notifications.");
    }
  }, [registerForPushNotifications]);

  const handleSendTestNotification = useCallback(async () => {
    try {
      await scheduleTestNotification();
    } catch (scheduleError) {
      Alert.alert("Test notification failed", scheduleError instanceof Error ? scheduleError.message : "Unable to schedule a test notification.");
    }
  }, [scheduleTestNotification]);

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
        <NotificationSettingsCard
          expoPushToken={expoPushToken}
          isRegistering={isRegistering}
          lastRegistrationStatus={lastRegistrationStatus}
          onEnable={handleEnableNotifications}
          onSendTest={handleSendTestNotification}
        />

        {profileSections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionCard}>
              {section.items.map((item, index) => (
                <ProfileRow key={item.title} item={item} isLast={index === section.items.length - 1} />
              ))}
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.logoutButton} activeOpacity={0.85} disabled={isLoggingOut} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={21} color="#EF2929" />
          <Text style={styles.logoutText}>{isLoggingOut ? "Logging out..." : "Log Out"}</Text>
        </TouchableOpacity>
      </ScrollView>

      <ClientFloatingTabBar activeRoute="profile" />
    </View>
  );
}

function NotificationSettingsCard({
  expoPushToken,
  isRegistering,
  lastRegistrationStatus,
  onEnable,
  onSendTest,
}: {
  expoPushToken: string | null;
  isRegistering: boolean;
  lastRegistrationStatus: string | null;
  onEnable: () => void;
  onSendTest: () => void;
}) {
  const isEnabled = Boolean(expoPushToken);
  const statusText = isEnabled
    ? "Push notifications are enabled on this device."
    : lastRegistrationStatus === "missing-project-id"
      ? "Add an EAS project ID to create Expo push tokens."
      : "Enable updates about bookings, galleries, and account activity.";

  return (
    <View style={styles.notificationCard}>
      <View style={styles.notificationCardHeader}>
        <View style={styles.notificationIconWrap}>
          <Ionicons name={isEnabled ? "notifications" : "notifications-outline"} size={26} color="#5B3DF5" />
        </View>
        <View style={styles.notificationCopy}>
          <Text style={styles.notificationTitle}>Push notifications</Text>
          <Text style={styles.notificationDescription}>{statusText}</Text>
        </View>
      </View>

      {expoPushToken ? <Text style={styles.pushTokenText} numberOfLines={1}>{expoPushToken}</Text> : null}

      <View style={styles.notificationActions}>
        <TouchableOpacity style={styles.enableNotificationsButton} activeOpacity={0.86} onPress={onEnable} disabled={isRegistering}>
          <Text style={styles.enableNotificationsText}>{isRegistering ? "Enabling..." : isEnabled ? "Refresh token" : "Enable notifications"}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.testNotificationButton} activeOpacity={0.86} onPress={onSendTest}>
          <Text style={styles.testNotificationText}>Send test</Text>
        </TouchableOpacity>
      </View>
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
    <TouchableOpacity style={styles.summaryCard} activeOpacity={0.88}>
      <View style={styles.avatarWrap}>
        <Image source={profile.avatarUrl} style={styles.avatar} contentFit="cover" />
        <View style={styles.editAvatarButton}>
          <Ionicons name="sync" size={18} color="#5B3DF5" />
        </View>
      </View>

      <View style={styles.summaryDetails}>
        <Text style={styles.name}>{profile.fullName}</Text>
        <ContactLine icon="paw-outline" text={profile.dogNames} />
        <ContactLine icon="location-outline" text={profile.address} />
        <ContactLine icon="mail-outline" text={profile.email} />
        <ContactLine icon="call-outline" text={profile.phone} />
        <Text style={styles.memberSince}>{profile.memberSince}</Text>
      </View>

      <Ionicons name="chevron-forward" size={24} color="#24315F" />
    </TouchableOpacity>
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

function ProfileRow({ item, isLast }: { item: ProfileItem; isLast: boolean }) {
  return (
    <TouchableOpacity style={styles.row} activeOpacity={0.82}>
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
    alignItems: "center",
    backgroundColor: "#FBF9FF",
    borderColor: "#ECE7FF",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 18,
    marginBottom: 22,
    padding: 20,
    shadowColor: "#5B3DF5",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
  },
  avatarWrap: { height: 112, width: 112 },
  avatar: { borderRadius: 56, height: 112, width: 112 },
  editAvatarButton: {
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 20,
    bottom: 0,
    height: 40,
    justifyContent: "center",
    position: "absolute",
    right: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    width: 40,
  },
  notificationCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E6EAF5",
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 22,
    padding: 18,
  },
  notificationCardHeader: { alignItems: "center", flexDirection: "row", gap: 14 },
  notificationIconWrap: {
    alignItems: "center",
    backgroundColor: "#F3EEFF",
    borderRadius: 24,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  notificationCopy: { flex: 1 },
  notificationTitle: { color: "#10162C", fontSize: 18, fontWeight: "800", marginBottom: 4 },
  notificationDescription: { color: "#53608F", fontSize: 14, fontWeight: "600", lineHeight: 20 },
  pushTokenText: { color: "#70758E", fontSize: 12, fontWeight: "600", marginTop: 14 },
  notificationActions: { flexDirection: "row", gap: 10, marginTop: 16 },
  enableNotificationsButton: { backgroundColor: "#5B3DF5", borderRadius: 14, flex: 1, paddingVertical: 14 },
  enableNotificationsText: { color: "#FFF", fontSize: 14, fontWeight: "800", textAlign: "center" },
  testNotificationButton: { backgroundColor: "#F3EEFF", borderRadius: 14, paddingHorizontal: 18, paddingVertical: 14 },
  testNotificationText: { color: "#5B3DF5", fontSize: 14, fontWeight: "800", textAlign: "center" },
  summaryDetails: { flex: 1, gap: 10 },
  name: { color: "#080D20", fontSize: 25, fontWeight: "800", marginBottom: 2 },
  contactLine: { alignItems: "center", flexDirection: "row", gap: 11 },
  contactText: { color: "#53608F", flex: 1, fontSize: 16, fontWeight: "600" },
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
});