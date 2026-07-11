import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import ClientFloatingTabBar from "@/components/client-dashboard/ClientFloatingTabBar";

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
      {
        icon: "person-outline",
        title: "Personal Information",
        subtitle: "Update your personal details",
      },
      {
        icon: "lock-closed-outline",
        title: "Change Password",
        subtitle: "Update your password",
      },
      {
        icon: "notifications-outline",
        title: "Notifications",
        subtitle: "Manage your notification preferences",
      },
      {
        icon: "card-outline",
        title: "Payment Methods",
        subtitle: "Manage your saved payment methods",
      },
    ],
  },
  {
    title: "Preferences",
    items: [
      {
        icon: "paw-outline",
        title: "Pet Preferences",
        subtitle: "Manage your pet care preferences",
      },
      {
        icon: "calendar-outline",
        title: "Booking Preferences",
        subtitle: "Set your booking and service preferences",
      },
      {
        icon: "location-outline",
        title: "Address",
        subtitle: "Manage your saved addresses",
      },
    ],
  },
  {
    title: "Support",
    items: [
      {
        icon: "help-circle-outline",
        title: "Help Center",
        subtitle: "Find answers to common questions",
      },
      {
        icon: "chatbox-ellipses-outline",
        title: "Contact Us",
        subtitle: "Get in touch with our support team",
      },
      {
        icon: "shield-checkmark-outline",
        title: "Privacy Policy",
        subtitle: "Learn how we protect your data",
      },
      {
        icon: "document-text-outline",
        title: "Terms of Service",
        subtitle: "Read our terms and conditions",
      },
    ],
  },
];

export default function ClientProfileScreen() {
  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <ProfileHeader />
        <ProfileSummary />

        {profileSections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionCard}>
              {section.items.map((item, index) => (
                <ProfileRow
                  key={item.title}
                  item={item}
                  isLast={index === section.items.length - 1}
                />
              ))}
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.logoutButton} activeOpacity={0.85}>
          <Ionicons name="log-out-outline" size={21} color="#EF2929" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>

      <ClientFloatingTabBar activeRoute="profile" />
    </View>
  );
}

function ProfileHeader() {
  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.headerIcon} activeOpacity={0.8}>
        <Ionicons name="menu-outline" size={32} color="#141A33" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Profile</Text>
      <TouchableOpacity style={styles.headerIcon} activeOpacity={0.8}>
        <Ionicons name="notifications-outline" size={27} color="#141A33" />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>2</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

function ProfileSummary() {
  return (
    <TouchableOpacity style={styles.summaryCard} activeOpacity={0.88}>
      <View style={styles.avatarWrap}>
        <Image
          source="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=300&q=80"
          style={styles.avatar}
          contentFit="cover"
        />
        <View style={styles.editAvatarButton}>
          <Ionicons name="pencil" size={18} color="#5B3DF5" />
        </View>
      </View>

      <View style={styles.summaryDetails}>
        <Text style={styles.name}>Sarah Johnson</Text>
        <ContactLine icon="location-outline" text="Dublin, Ireland" />
        <ContactLine icon="mail-outline" text="sarah.johnson@email.com" />
        <ContactLine icon="call-outline" text="+353 87 123 4567" />
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

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#F8F9FD",
    flex: 1,
  },
  content: {
    paddingBottom: 142,
    paddingHorizontal: 22,
    paddingTop: 60,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    marginTop: 12,
  },
  headerIcon: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  headerTitle: {
    color: "#080D20",
    fontSize: 28,
    fontWeight: "800",
  },
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
  badgeText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "800",
  },
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
  avatarWrap: {
    height: 112,
    width: 112,
  },
  avatar: {
    borderRadius: 56,
    height: 112,
    width: 112,
  },
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
  summaryDetails: {
    flex: 1,
    gap: 10,
  },
  name: {
    color: "#080D20",
    fontSize: 25,
    fontWeight: "800",
    marginBottom: 2,
  },
  contactLine: {
    alignItems: "center",
    flexDirection: "row",
    gap: 11,
  },
  contactText: {
    color: "#53608F",
    fontSize: 16,
    fontWeight: "600",
  },
  section: {
    marginBottom: 22,
  },
  sectionTitle: {
    color: "#080D20",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 12,
  },
  sectionCard: {
    backgroundColor: "#FFF",
    borderColor: "#E6EAF5",
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    paddingLeft: 16,
  },
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
  rowDivider: {
    borderBottomColor: "#E6EAF5",
    borderBottomWidth: 1,
  },
  rowTitle: {
    color: "#10162C",
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 5,
  },
  rowSubtitle: {
    color: "#53608F",
    fontSize: 15,
    fontWeight: "600",
  },
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
  logoutText: {
    color: "#EF2929",
    fontSize: 17,
    fontWeight: "800",
  },
});