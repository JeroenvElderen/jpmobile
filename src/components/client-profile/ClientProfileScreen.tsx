import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Linking from "expo-linking";
import * as Notifications from "expo-notifications";
import * as WebBrowser from "expo-web-browser";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";

import ClientFloatingTabBar from "@/components/client-dashboard/ClientFloatingTabBar";
import { fetchClientProfileData, type ClientProfile } from "@/lib/clientProfileData";
import { usePushNotifications } from "@/providers/PushNotificationsProvider";
import { supabase } from "@/lib/supabase";

type ProfilePopupMode = "personal" | "password" | "notifications" | "payments" | "contact";

type ProfileItem = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  popupMode?: ProfilePopupMode;
};

type ProfileSection = {
  title: string;
  items: ProfileItem[];
};

const profileSections: ProfileSection[] = [
  {
    title: "Account",
    items: [
      { icon: "person-outline", title: "Personal Information", subtitle: "Review your saved contact details", popupMode: "personal" },
      { icon: "lock-closed-outline", title: "Change Password", subtitle: "Update your password", popupMode: "password" },
      { icon: "notifications-outline", title: "Notifications", subtitle: "Manage every notification setting", popupMode: "notifications" },
      { icon: "card-outline", title: "Payments & Invoices", subtitle: "Pay securely with Revolut", popupMode: "payments" },
    ],
  },
  {
    title: "Support",
    items: [
      { icon: "chatbox-ellipses-outline", title: "Contact Us", subtitle: "Get in touch by WhatsApp, phone, or email", popupMode: "contact" },
    ],
  },
];

export default function ClientProfileScreen() {
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [activePopup, setActivePopup] = useState<ProfilePopupMode | null>(null);
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
      .on("postgres_changes", { event: "*", schema: "public", table: "portal_invoices", filter: `portal_client_id=eq.${profile.clientId}` }, refreshProfile)
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
                  if (item.popupMode) setActivePopup(item.popupMode);
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

function ProfilePopup({ mode, profile, onClose, onSaved }: { mode: ProfilePopupMode | null; profile: ClientProfile; onClose: () => void; onSaved: () => void }) {
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

  if (mode === "notifications") {
    return <NotificationSettingsPopup visible={Boolean(mode)} onClose={onClose} />;
  }

  if (mode === "payments") {
    return <PaymentsPopup visible={Boolean(mode)} profile={profile} onClose={onClose} />;
  }

  if (mode === "contact") {
    return <ContactSupportPopup visible={Boolean(mode)} profile={profile} onClose={onClose} />;
  }

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

type ToggleSetting = {
  key: string;
  title: string;
  subtitle: string;
};

const notificationSettings: ToggleSetting[] = [
  { key: "booking", title: "Booking updates", subtitle: "New, changed, cancelled, and confirmed bookings." },
  { key: "reminders", title: "Visit reminders", subtitle: "Upcoming walks, visits, daycare, and boarding reminders." },
  { key: "messages", title: "Messages", subtitle: "Direct messages and support replies." },
  { key: "photos", title: "Photos & report cards", subtitle: "New gallery photos, updates, and visit summaries." },
  { key: "billing", title: "Payments & invoices", subtitle: "Receipts, invoices, and payment method notices." },
  { key: "marketing", title: "News & offers", subtitle: "Optional service announcements and promotions." },
];

function NotificationSettingsPopup({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { expoPushToken, isRegistering, lastRegistrationStatus, registerForPushNotifications, scheduleTestNotification } = usePushNotifications();
  const [enabledSettings, setEnabledSettings] = useState<Record<string, boolean>>({});
  const [permissionStatus, setPermissionStatus] = useState<Notifications.PermissionStatus | "unknown">("unknown");

  useEffect(() => {
    if (!visible) return;

    let isMounted = true;
    AsyncStorage.getItem("clientNotificationPreferences").then((stored) => {
      const parsed = stored ? JSON.parse(stored) as Record<string, boolean> : null;
      const defaults = Object.fromEntries(notificationSettings.map((item) => [item.key, item.key !== "marketing"]));
      if (isMounted) setEnabledSettings({ ...defaults, ...parsed });
    }).catch(() => undefined);

    Notifications.getPermissionsAsync().then(({ status }) => {
      if (isMounted) setPermissionStatus(status);
    }).catch(() => {
      if (isMounted) setPermissionStatus("unknown");
    });

    return () => { isMounted = false; };
  }, [visible]);

  const toggleSetting = async (key: string) => {
    const next = { ...enabledSettings, [key]: !enabledSettings[key] };
    setEnabledSettings(next);
    await AsyncStorage.setItem("clientNotificationPreferences", JSON.stringify(next));
  };

  const handleEnablePush = async () => {
    const result = await registerForPushNotifications();
    if (result.status === Notifications.PermissionStatus.GRANTED) {
      setPermissionStatus(result.status);
      Alert.alert("Notifications enabled", "Push notifications are ready for this device.");
    } else {
      setPermissionStatus(result.status === "unavailable" || result.status === "missing-project-id" ? "unknown" : result.status);
      Alert.alert("Notifications unavailable", "Please enable notifications in your device settings to receive alerts.");
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={styles.popupContainer}>
        <PopupHeader title="Notifications" onClose={onClose} />
        <ScrollView contentContainerStyle={styles.popupContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.popupIntro}>Choose every type of notification you want from Jeroen & Paws. Device push permission applies to all push alerts.</Text>
          <View style={styles.statusCard}>
            <Ionicons name={permissionStatus === Notifications.PermissionStatus.GRANTED ? "notifications" : "notifications-off-outline"} size={24} color="#5B3DF5" />
            <View style={styles.statusCopy}>
              <Text style={styles.statusTitle}>{permissionStatus === Notifications.PermissionStatus.GRANTED ? "Push notifications enabled" : "Push notifications not enabled"}</Text>
              <Text style={styles.statusText}>{expoPushToken ? "This device is registered for Expo push notifications." : `Status: ${lastRegistrationStatus ?? permissionStatus}`}</Text>
            </View>
          </View>
          <TouchableOpacity style={[styles.saveButton, isRegistering && styles.saveButtonDisabled]} disabled={isRegistering} activeOpacity={0.86} onPress={handleEnablePush}>
            <Text style={styles.saveButtonText}>{isRegistering ? "Checking permission..." : "Enable push notifications"}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.86} onPress={scheduleTestNotification}>
            <Text style={styles.secondaryButtonText}>Send test notification</Text>
          </TouchableOpacity>
          <PreferenceList settings={notificationSettings} enabledSettings={enabledSettings} onToggle={toggleSetting} />
        </ScrollView>
      </View>
    </Modal>
  );
}

type ClientInvoice = {
  id: string;
  invoice_number: string;
  payment_title: string | null;
  amount_cents: number;
  currency: string;
  status: "draft" | "sent" | "pending" | "paid" | "overdue" | "refunded" | string;
  due_on: string | null;
  issued_on: string | null;
  payment_url: string | null;
  paid_on: string | null;
};

function PaymentsPopup({ visible, profile, onClose }: { visible: boolean; profile: ClientProfile; onClose: () => void }) {
  const [invoices, setInvoices] = useState<ClientInvoice[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [openingInvoiceId, setOpeningInvoiceId] = useState<string | null>(null);

  const loadPayments = useCallback(async () => {
    setIsLoadingPayments(true);
    setPaymentError(null);

    const { data, error } = await supabase
      .from("portal_invoices")
      .select("id, invoice_number, payment_title, amount_cents, currency, status, due_on, issued_on, payment_url, paid_on")
      .eq("portal_client_id", profile.clientId)
      .order("issued_on", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      setPaymentError(error.message);
      setInvoices([]);
    } else {
      setInvoices((data ?? []) as ClientInvoice[]);
    }

    setIsLoadingPayments(false);
  }, [profile.clientId]);

  useEffect(() => {
    if (!visible) return undefined;

    loadPayments();
    const channel = supabase
      .channel(`client-payments-${profile.clientId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "portal_invoices", filter: `portal_client_id=eq.${profile.clientId}` }, () => loadPayments())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [visible, profile.clientId, loadPayments]);

  const openPayment = async (invoice: ClientInvoice) => {
    if (!invoice.payment_url) {
      Alert.alert("Payment link unavailable", "This invoice does not have a Revolut payment link yet. Please contact us and we will resend it.");
      return;
    }

    const returnUrl = Linking.createURL("client/profile", {
      queryParams: {
        invoiceId: invoice.id,
        payment: "revolut",
        status: "complete",
      },
    });

    setOpeningInvoiceId(invoice.id);
    try {
      const result = await WebBrowser.openAuthSessionAsync(invoice.payment_url, returnUrl, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FORM_SHEET,
      });

      await loadPayments();

      if (result.type === "success") {
        Alert.alert("Payment check complete", "Welcome back. We are refreshing your invoice status now.");
      }
    } catch {
      Alert.alert("Unable to open Revolut", "Please try again or contact us if the payment link keeps failing.");
    } finally {
      setOpeningInvoiceId(null);
    }
  };

  const openInvoices = invoices.filter((invoice) => ["sent", "pending", "overdue"].includes(invoice.status));
  const paidInvoices = invoices.filter((invoice) => invoice.status === "paid");
  const otherInvoices = invoices.filter((invoice) => !openInvoices.includes(invoice) && !paidInvoices.includes(invoice));

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={styles.popupContainer}>
        <PopupHeader title="Payments & Invoices" onClose={onClose} />
        <ScrollView contentContainerStyle={styles.popupContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.popupIntro}>Pay securely with Revolut. After checkout, Revolut can return you to the app and we will refresh your invoices while paid status is confirmed through our payment system.</Text>

          {isLoadingPayments ? <PaymentLoadingState /> : null}
          {paymentError ? <PaymentErrorState error={paymentError} onRetry={loadPayments} /> : null}
          {!isLoadingPayments && !paymentError && invoices.length === 0 ? <PaymentEmptyState /> : null}

          {!isLoadingPayments && !paymentError && openInvoices.length > 0 ? (
            <InvoiceSection title="Open payments" invoices={openInvoices} openingInvoiceId={openingInvoiceId} onPay={openPayment} />
          ) : null}

          {!isLoadingPayments && !paymentError && paidInvoices.length > 0 ? (
            <InvoiceSection title="Paid" invoices={paidInvoices} openingInvoiceId={openingInvoiceId} onPay={openPayment} />
          ) : null}

          {!isLoadingPayments && !paymentError && otherInvoices.length > 0 ? (
            <InvoiceSection title="Other invoices" invoices={otherInvoices} openingInvoiceId={openingInvoiceId} onPay={openPayment} />
          ) : null}
        </ScrollView>
      </View>
    </Modal>
  );
}

function InvoiceSection({ title, invoices, openingInvoiceId, onPay }: { title: string; invoices: ClientInvoice[]; openingInvoiceId: string | null; onPay: (invoice: ClientInvoice) => void }) {
  return (
    <View style={styles.invoiceSection}>
      <Text style={styles.invoiceSectionTitle}>{title}</Text>
      {invoices.map((invoice) => (
        <InvoiceCard key={invoice.id} invoice={invoice} isOpening={openingInvoiceId === invoice.id} onPay={() => onPay(invoice)} />
      ))}
    </View>
  );
}

function InvoiceCard({ invoice, isOpening, onPay }: { invoice: ClientInvoice; isOpening: boolean; onPay: () => void }) {
  const canPay = ["sent", "pending", "overdue"].includes(invoice.status);
  const isPaid = invoice.status === "paid";

  return (
    <View style={styles.invoiceCard}>
      <View style={styles.invoiceHeader}>
        <View style={styles.invoiceTitleWrap}>
          <Text style={styles.invoiceTitle}>{invoice.payment_title?.trim() || `Invoice ${invoice.invoice_number}`}</Text>
          <Text style={styles.invoiceSubtitle}>#{invoice.invoice_number}</Text>
        </View>
        <View style={[styles.statusPill, isPaid ? styles.statusPillPaid : invoice.status === "overdue" ? styles.statusPillOverdue : styles.statusPillPending]}>
          <Text style={[styles.statusPillText, isPaid ? styles.statusPillTextPaid : invoice.status === "overdue" ? styles.statusPillTextOverdue : styles.statusPillTextPending]}>{formatInvoiceStatus(invoice.status)}</Text>
        </View>
      </View>

      <View style={styles.invoiceMetaRow}>
        <Text style={styles.invoiceAmount}>{formatInvoiceAmount(invoice.amount_cents, invoice.currency)}</Text>
        <Text style={styles.invoiceDate}>{isPaid ? formatInvoiceDate("Paid", invoice.paid_on) : formatInvoiceDate("Due", invoice.due_on)}</Text>
      </View>

      {canPay ? (
        <TouchableOpacity style={[styles.payButton, isOpening && styles.saveButtonDisabled]} activeOpacity={0.86} disabled={isOpening} onPress={onPay}>
          <Ionicons name="card-outline" size={20} color="#FFF" />
          <Text style={styles.payButtonText}>{isOpening ? "Opening Revolut..." : "Pay securely with Revolut"}</Text>
        </TouchableOpacity>
      ) : (
        <Text style={styles.invoiceNote}>{isPaid ? "Payment received. Thank you!" : "This invoice is not currently payable in the app."}</Text>
      )}
    </View>
  );
}

function PaymentLoadingState() {
  return (
    <View style={styles.paymentStateCard}>
      <ActivityIndicator color="#5B3DF5" />
      <Text style={styles.statusText}>Loading your payment links...</Text>
    </View>
  );
}

function PaymentErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <View style={styles.paymentStateCard}>
      <Text style={styles.formError}>{error}</Text>
      <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.86} onPress={onRetry}>
        <Text style={styles.secondaryButtonText}>Try again</Text>
      </TouchableOpacity>
    </View>
  );
}

function PaymentEmptyState() {
  return (
    <View style={styles.paymentStateCard}>
      <Ionicons name="receipt-outline" size={32} color="#5B3DF5" />
      <Text style={styles.statusTitle}>No payment links yet</Text>
      <Text style={styles.statusText}>Any Revolut payment links for your invoices will appear here.</Text>
    </View>
  );
}

function formatInvoiceAmount(amountCents: number, currency: string) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: currency || "EUR" }).format((amountCents || 0) / 100);
}

function formatInvoiceDate(label: string, value: string | null) {
  if (!value) return `${label} date pending`;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return `${label} date pending`;
  return `${label} ${date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}`;
}

function formatInvoiceStatus(status: string) {
  return status.replace(/_/g, " ").replace(/^./, (char) => char.toUpperCase());
}

const supportPhone = process.env.EXPO_PUBLIC_BUSINESS_PHONE_NUMBER || process.env.EXPO_PUBLIC_BUSINESS_WHATSAPP_NUMBER || "353872473099";
const supportPhoneDigits = supportPhone.replace(/[^+\d]/g, "");
const supportWhatsappNumber = supportPhoneDigits.replace("+", "");
const supportEmail = process.env.EXPO_PUBLIC_SUPPORT_EMAIL || "jeroen@jeroenandpaws.com";

function ContactSupportPopup({ visible, profile, onClose }: { visible: boolean; profile: ClientProfile; onClose: () => void }) {
  const message = `Hi Jeroen & Paws, this is ${profile.fullName}. I need help with my client account.`;

  const openContactMethod = async (url: string, errorMessage: string) => {
    try {
      await Linking.openURL(url);
      onClose();
    } catch {
      Alert.alert("Contact option unavailable", errorMessage);
    }
  };

  const openWhatsapp = () => {
    openContactMethod(`whatsapp://send?phone=${supportWhatsappNumber}&text=${encodeURIComponent(message)}`, "WhatsApp is not installed on this device.");
  };

  const callSupport = () => {
    openContactMethod(`tel:${supportPhoneDigits}`, "Phone calls are not available on this device.");
  };

  const emailSupport = () => {
    openContactMethod(`mailto:${supportEmail}?subject=${encodeURIComponent("Client support request")}&body=${encodeURIComponent(message)}`, "Email is not configured on this device.");
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.contactOverlay}>
        <View style={styles.contactSheet}>
          <PopupHeader title="Contact Us" onClose={onClose} />
          <View style={styles.contactContent}>
            <Text style={styles.popupIntro}>Choose how you would like to get in touch with the Jeroen & Paws support team.</Text>
            <ContactOption icon="logo-whatsapp" title="WhatsApp" subtitle="Open the WhatsApp app" onPress={openWhatsapp} />
            <ContactOption icon="call-outline" title="Call" subtitle={`+${supportWhatsappNumber}`} onPress={callSupport} />
            <ContactOption icon="mail-outline" title="Email" subtitle={supportEmail} onPress={emailSupport} />
          </View>
          </View>
      </View>
    </Modal>
  );
}

function ContactOption({ icon, title, subtitle, onPress }: { icon: keyof typeof Ionicons.glyphMap; title: string; subtitle: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.contactOption} activeOpacity={0.84} onPress={onPress}>
      <View style={styles.rowIconWrap}>
        <Ionicons name={icon} size={27} color="#5B3DF5" />
      </View>
      <View style={styles.contactOptionCopy}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={22} color="#53608F" />
    </TouchableOpacity>
  );
}

function PopupHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <View style={styles.popupHeader}>
      <TouchableOpacity style={styles.popupClose} activeOpacity={0.8} onPress={onClose}>
        <Ionicons name="close" size={28} color="#141A33" />
      </TouchableOpacity>
      <Text style={styles.popupTitle}>{title}</Text>
      <View style={styles.popupClose} />
    </View>
  );
}

function PreferenceList({ settings, enabledSettings, onToggle }: { settings: ToggleSetting[]; enabledSettings: Record<string, boolean>; onToggle: (key: string) => void }) {
  return (
    <View style={styles.preferenceCard}>
      {settings.map((setting, index) => (
        <View key={setting.key} style={[styles.preferenceRow, index < settings.length - 1 && styles.preferenceDivider]}>
          <View style={styles.preferenceCopy}>
            <Text style={styles.preferenceTitle}>{setting.title}</Text>
            <Text style={styles.preferenceSubtitle}>{setting.subtitle}</Text>
          </View>
          <Switch value={Boolean(enabledSettings[setting.key])} onValueChange={() => onToggle(setting.key)} trackColor={{ false: "#D7DDEB", true: "#CFC7FF" }} thumbColor={enabledSettings[setting.key] ? "#5B3DF5" : "#F7F8FC"} />
        </View>
      ))}
    </View>
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
  secondaryButton: { alignItems: "center", backgroundColor: "#F1EEFF", borderColor: "#DED7FF", borderRadius: 16, borderWidth: 1, justifyContent: "center", marginTop: 12, paddingVertical: 17 },
  secondaryButtonText: { color: "#4B32D8", fontSize: 16, fontWeight: "800" },
  statusCard: { alignItems: "center", backgroundColor: "#FFF", borderColor: "#E0E5F2", borderRadius: 18, borderWidth: 1, flexDirection: "row", gap: 14, marginBottom: 16, padding: 16 },
  statusCopy: { flex: 1 },
  statusTitle: { color: "#10162C", fontSize: 16, fontWeight: "900", marginBottom: 5 },
  statusText: { color: "#53608F", fontSize: 14, fontWeight: "600", lineHeight: 20 },
  invoiceSection: { marginBottom: 22 },
  invoiceSectionTitle: { color: "#10162C", fontSize: 18, fontWeight: "900", marginBottom: 12 },
  invoiceCard: { backgroundColor: "#FFF", borderColor: "#E0E5F2", borderRadius: 18, borderWidth: 1, marginBottom: 14, padding: 16 },
  invoiceHeader: { alignItems: "flex-start", flexDirection: "row", gap: 12, justifyContent: "space-between", marginBottom: 14 },
  invoiceTitleWrap: { flex: 1 },
  invoiceTitle: { color: "#10162C", fontSize: 17, fontWeight: "900", lineHeight: 23, marginBottom: 4 },
  invoiceSubtitle: { color: "#53608F", fontSize: 14, fontWeight: "700" },
  statusPill: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6 },
  statusPillPaid: { backgroundColor: "#EFFFF5", borderColor: "#BFE9CD" },
  statusPillOverdue: { backgroundColor: "#FFF0F0", borderColor: "#FFD0D0" },
  statusPillPending: { backgroundColor: "#FFF8E9", borderColor: "#F2D9A6" },
  statusPillText: { fontSize: 12, fontWeight: "900" },
  statusPillTextPaid: { color: "#188C45" },
  statusPillTextOverdue: { color: "#C42121" },
  statusPillTextPending: { color: "#A06B00" },
  invoiceMetaRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 14 },
  invoiceAmount: { color: "#080D20", fontSize: 24, fontWeight: "900" },
  invoiceDate: { color: "#53608F", fontSize: 14, fontWeight: "700" },
  payButton: { alignItems: "center", backgroundColor: "#5B3DF5", borderRadius: 16, flexDirection: "row", gap: 9, justifyContent: "center", paddingVertical: 16 },
  payButtonText: { color: "#FFF", fontSize: 16, fontWeight: "900" },
  invoiceNote: { color: "#53608F", fontSize: 14, fontWeight: "700", lineHeight: 20 },
  paymentStateCard: { alignItems: "center", backgroundColor: "#FFF", borderColor: "#E0E5F2", borderRadius: 18, borderWidth: 1, gap: 10, marginBottom: 18, padding: 18 },
  preferenceCard: { backgroundColor: "#FFF", borderColor: "#E0E5F2", borderRadius: 18, borderWidth: 1, marginTop: 18, overflow: "hidden" },
  preferenceRow: { alignItems: "center", flexDirection: "row", gap: 14, minHeight: 90, paddingHorizontal: 16, paddingVertical: 14 },
  preferenceDivider: { borderBottomColor: "#E8ECF5", borderBottomWidth: 1 },
  preferenceCopy: { flex: 1 },
  preferenceTitle: { color: "#10162C", fontSize: 16, fontWeight: "900", marginBottom: 5 },
  preferenceSubtitle: { color: "#53608F", fontSize: 14, fontWeight: "600", lineHeight: 20 },
  contactOverlay: { backgroundColor: "rgba(8, 13, 32, 0.42)", flex: 1, justifyContent: "flex-end" },
  contactSheet: { backgroundColor: "#F8F9FD", borderTopLeftRadius: 26, borderTopRightRadius: 26, overflow: "hidden", paddingBottom: 28 },
  contactContent: { paddingHorizontal: 22, paddingBottom: 6 },
  contactOption: { alignItems: "center", backgroundColor: "#FFF", borderColor: "#E0E5F2", borderRadius: 18, borderWidth: 1, flexDirection: "row", marginBottom: 12, minHeight: 82, padding: 16 },
  contactOptionCopy: { flex: 1 }, 
});