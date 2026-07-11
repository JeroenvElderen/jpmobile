import { Ionicons } from "@expo/vector-icons";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Booking = {
  id: string;
  dayLabel: string;
  date: string;
  month: string;
  pet: string;
  service: string;
  time: string;
  duration: string;
  status: "Confirmed" | "Pending";
  icon: keyof typeof Ionicons.glyphMap;
  avatar: string;
};

const bookings: Booking[] = [
  {
    id: "1",
    dayLabel: "Today",
    date: "25",
    month: "May",
    pet: "Max",
    service: "Dog Walk",
    time: "10:00 AM",
    duration: "60 min",
    status: "Confirmed",
    icon: "paw-outline",
    avatar: "https://placedog.net/200/200?id=11",
  },
  {
    id: "2",
    dayLabel: "Tomorrow",
    date: "26",
    month: "May",
    pet: "Luna",
    service: "Training Session",
    time: "1:00 PM",
    duration: "60 min",
    status: "Pending",
    icon: "school-outline",
    avatar: "https://placedog.net/200/200?id=12",
  },
  {
    id: "3",
    dayLabel: "May",
    date: "28",
    month: "Tue",
    pet: "Buddy",
    service: "Drop-in Visit",
    time: "4:00 PM",
    duration: "30 min",
    status: "Confirmed",
    icon: "home-outline",
    avatar: "https://placedog.net/200/200?id=13",
  },
];

const pets = [
  { name: "Max", breed: "Golden Retriever", age: "3 years old", avatar: "https://placedog.net/200/200?id=21" },
  { name: "Luna", breed: "Labrador", age: "2 years old", avatar: "https://placedog.net/200/200?id=22" },
  { name: "Buddy", breed: "Beagle", age: "4 years old", avatar: "https://placedog.net/200/200?id=23" },
];

const activities = [
  { title: "Booking confirmed", detail: "Dog Walk for Max", date: "May 24, 2024", icon: "calendar-outline" as const },
  { title: "Booking requested", detail: "Training Session for Luna", date: "May 23, 2024", icon: "clipboard-outline" as const },
  { title: "Review submitted", detail: "You reviewed a service", date: "May 22, 2024", icon: "heart-outline" as const },
];

export default function ClientDashboardScreen() {
  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Header />
        <BookingsCard />
        <PetsCard />
        <ActivityCard />
        <HelpCard />
      </ScrollView>
      <ClientTabBar />
    </View>
  );
}

function Header() {
  return (
    <View style={styles.header}>
      <View style={styles.topRow}>
        <TouchableOpacity style={styles.headerIcon}>
          <Ionicons name="menu-outline" size={31} color="#1D2238" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerIcon}>
          <Ionicons name="notifications-outline" size={27} color="#1D2238" />
          <View style={styles.badge}><Text style={styles.badgeText}>2</Text></View>
        </TouchableOpacity>
      </View>
      <Text style={styles.title}>Good morning, Sarah <Ionicons name="paw-outline" size={29} color="#5B3DF5" /></Text>
      <Text style={styles.subtitle}>Here's what's happening with your pets.</Text>
    </View>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{title}</Text>
        <TouchableOpacity><Text style={styles.viewAll}>View all</Text></TouchableOpacity>
      </View>
      {children}
    </View>
  );
}

function BookingsCard() {
  return (
    <SectionCard title="Upcoming Bookings">
      {bookings.map((booking, index) => <BookingRow key={booking.id} booking={booking} isLast={index === bookings.length - 1} />)}
      <TouchableOpacity style={styles.primarySoftButton}>
        <Ionicons name="calendar-outline" size={21} color="#4C2FE5" />
        <Text style={styles.primarySoftText}>View All Bookings</Text>
      </TouchableOpacity>
    </SectionCard>
  );
}

function BookingRow({ booking, isLast }: { booking: Booking; isLast: boolean }) {
  const pending = booking.status === "Pending";
  return (
    <View style={[styles.bookingRow, !isLast && styles.divider]}>
      <View style={[styles.dateBox, pending && styles.dateBoxWarm]}>
        <Text style={[styles.dateLabel, pending && styles.dateLabelWarm]}>{booking.dayLabel}</Text>
        <Text style={styles.dateNumber}>{booking.date}</Text>
        <Text style={styles.dateMonth}>{booking.month}</Text>
      </View>
      <Image source={{ uri: booking.avatar }} style={styles.bookingAvatar} />
      <View style={styles.bookingInfo}>
        <Text style={styles.petName}>{booking.pet}</Text>
        <View style={styles.metaRow}><Ionicons name={booking.icon} size={16} color="#4C2FE5" /><Text style={styles.serviceText}>{booking.service}</Text></View>
        <View style={styles.metaRow}><Ionicons name="time-outline" size={16} color="#5B668D" /><Text style={styles.timeText}>{booking.time}  •  {booking.duration}</Text></View>
      </View>
      <View style={[styles.statusPill, pending ? styles.pendingPill : styles.confirmedPill]}><Text style={[styles.statusText, pending ? styles.pendingText : styles.confirmedText]}>{booking.status}</Text></View>
      <Ionicons name="chevron-forward" size={22} color="#2F3864" />
    </View>
  );
}

function PetsCard() {
  return (
    <SectionCard title="My Pets">
      <View style={styles.petRow}>
        {pets.map((pet) => <View key={pet.name} style={styles.petItem}><View><Image source={{ uri: pet.avatar }} style={styles.petAvatar} /><View style={styles.editBadge}><Ionicons name="pencil" size={14} color="#168A31" /></View></View><Text style={styles.petLabel}>{pet.name}</Text><Text style={styles.petDetail}>{pet.breed}</Text><Text style={styles.petDetail}>{pet.age}</Text></View>)}
        <TouchableOpacity style={styles.addPet}><View style={styles.addCircle}><Ionicons name="add" size={34} color="#5B3DF5" /></View><Text style={styles.addPetText}>Add Pet</Text></TouchableOpacity>
      </View>
    </SectionCard>
  );
}

function ActivityCard() {
  return (
    <SectionCard title="Recent Activity">
      {activities.map((activity, index) => <View key={activity.title} style={[styles.activityRow, index !== activities.length - 1 && styles.divider]}><View style={styles.activityIcon}><Ionicons name={activity.icon} size={24} color="#4C2FE5" /></View><View style={styles.activityCopy}><Text style={styles.activityTitle}>{activity.title}</Text><Text style={styles.activityDetail}>{activity.detail}</Text></View><Text style={styles.activityDate}>{activity.date}</Text><Ionicons name="chevron-forward" size={21} color="#2F3864" /></View>)}
    </SectionCard>
  );
}

function HelpCard() {
  return <View style={styles.helpCard}><View style={styles.helpIcon}><Ionicons name="headset-outline" size={31} color="#4C2FE5" /></View><View style={styles.helpCopy}><Text style={styles.helpTitle}>Need Help?</Text><Text style={styles.helpText}>We're here to help you and your pets.</Text></View><TouchableOpacity style={styles.contactButton}><Text style={styles.contactText}>Contact Us</Text></TouchableOpacity></View>;
}

function ClientTabBar() {
  const tabs = [
    { icon: "home-outline", label: "Home", active: true },
    { icon: "calendar-outline", label: "Bookings" },
    { icon: "paw-outline", label: "My Pets" },
    { icon: "person-outline", label: "Profile" },
  ] as const;
  return (
    <SafeAreaView pointerEvents="box-none" style={styles.tabSafeArea}>
      <View style={styles.tabBar}>
        <TabItem {...tabs[0]} />
        <TabItem {...tabs[1]} />
        <TouchableOpacity style={styles.clientFab}><Ionicons name="add" size={35} color="#FFF" /><Text style={styles.fabLabel}>New Booking</Text></TouchableOpacity>
        <TabItem {...tabs[2]} />
        <TabItem {...tabs[3]} />
      </View>
    </SafeAreaView>
  );
}

function TabItem({ icon, label, active = false }: { icon: keyof typeof Ionicons.glyphMap; label: string; active?: boolean }) {
  return <TouchableOpacity style={styles.tabItem}><Ionicons name={icon} size={27} color={active ? "#4C2FE5" : "#5B668D"} /><Text style={[styles.tabLabel, active && styles.activeTabLabel]}>{label}</Text></TouchableOpacity>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FD" },
  content: { paddingHorizontal: 22, paddingTop: 60, paddingBottom: 150 },
  header: { marginTop: 12, marginBottom: 28 },
  topRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 26 },
  headerIcon: { alignItems: "center", height: 44, justifyContent: "center", width: 44 },
  badge: { alignItems: "center", backgroundColor: "#EF4444", borderRadius: 10, height: 20, justifyContent: "center", position: "absolute", right: 4, top: 4, width: 20 },
  badgeText: { color: "#FFF", fontSize: 11, fontWeight: "800" },
  title: { color: "#101426", fontSize: 31, fontWeight: "800", marginBottom: 8 },
  subtitle: { color: "#2F3864", fontSize: 16, lineHeight: 24 },
  card: { backgroundColor: "#FFF", borderColor: "#ECECF5", borderRadius: 18, borderWidth: 1, marginBottom: 16, padding: 22 },
  cardHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 18 },
  cardTitle: { color: "#101426", fontSize: 20, fontWeight: "800" },
  viewAll: { color: "#4C2FE5", fontSize: 16, fontWeight: "800" },
  bookingRow: { alignItems: "center", flexDirection: "row", gap: 14, paddingVertical: 14 },
  divider: { borderBottomColor: "#ECECF5", borderBottomWidth: 1 },
  dateBox: { alignItems: "center", backgroundColor: "#F2EDFF", borderRadius: 12, height: 86, justifyContent: "center", width: 76 },
  dateBoxWarm: { backgroundColor: "#FFF1E8" },
  dateLabel: { color: "#4C2FE5", fontSize: 12, fontWeight: "800", textTransform: "uppercase" },
  dateLabelWarm: { color: "#F97316" },
  dateNumber: { color: "#101426", fontSize: 30, fontWeight: "500" },
  dateMonth: { color: "#2F3864", fontSize: 14, fontWeight: "600" },
  bookingAvatar: { borderRadius: 37, height: 74, width: 74 },
  bookingInfo: { flex: 1, gap: 7 },
  petName: { color: "#101426", fontSize: 21, fontWeight: "800" },
  metaRow: { alignItems: "center", flexDirection: "row", gap: 6 },
  serviceText: { color: "#2F3864", fontSize: 15, fontWeight: "600" },
  timeText: { color: "#4A5480", fontSize: 15, fontWeight: "600" },
  statusPill: { borderRadius: 7, paddingHorizontal: 9, paddingVertical: 6 },
  confirmedPill: { backgroundColor: "#DCFCE7" },
  pendingPill: { backgroundColor: "#FFEDD5" },
  statusText: { fontSize: 13, fontWeight: "800" },
  confirmedText: { color: "#168A31" },
  pendingText: { color: "#EA580C" },
  primarySoftButton: { alignItems: "center", backgroundColor: "#F2EDFF", borderColor: "#E7DDFE", borderRadius: 10, borderWidth: 1, flexDirection: "row", gap: 12, justifyContent: "center", marginTop: 8, paddingVertical: 15 },
  primarySoftText: { color: "#4C2FE5", fontSize: 17, fontWeight: "800" },
  petRow: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between" },
  petItem: { alignItems: "center", flex: 1 },
  petAvatar: { borderRadius: 46, height: 92, width: 92 },
  editBadge: { alignItems: "center", backgroundColor: "#BBF7D0", borderRadius: 14, height: 28, justifyContent: "center", position: "absolute", right: -4, top: 3, width: 28 },
  petLabel: { color: "#101426", fontSize: 16, fontWeight: "800", marginTop: 12 },
  petDetail: { color: "#4A5480", fontSize: 13, fontWeight: "600", marginTop: 3, textAlign: "center" },
  addPet: { alignItems: "center", flex: 1 },
  addCircle: { alignItems: "center", backgroundColor: "#F2EDFF", borderRadius: 46, height: 92, justifyContent: "center", width: 92 },
  addPetText: { color: "#4C2FE5", fontSize: 16, fontWeight: "800", marginTop: 14 },
  activityRow: { alignItems: "center", flexDirection: "row", gap: 14, paddingVertical: 15 },
  activityIcon: { alignItems: "center", backgroundColor: "#F2EDFF", borderRadius: 25, height: 50, justifyContent: "center", width: 50 },
  activityCopy: { flex: 1, gap: 5 },
  activityTitle: { color: "#101426", fontSize: 16, fontWeight: "800" },
  activityDetail: { color: "#3F4975", fontSize: 15, fontWeight: "600" },
  activityDate: { color: "#4A5480", fontSize: 14, fontWeight: "700" },
  helpCard: { alignItems: "center", backgroundColor: "#F2EDFF", borderColor: "#E7DDFE", borderRadius: 18, borderWidth: 1, flexDirection: "row", gap: 16, marginTop: 18, padding: 20 },
  helpIcon: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.75)", borderRadius: 33, height: 66, justifyContent: "center", width: 66 },
  helpCopy: { flex: 1, gap: 4 },
  helpTitle: { color: "#101426", fontSize: 18, fontWeight: "800" },
  helpText: { color: "#3F4975", fontSize: 15, fontWeight: "600" },
  contactButton: { borderColor: "#A78BFA", borderRadius: 10, borderWidth: 1, paddingHorizontal: 20, paddingVertical: 13 },
  contactText: { color: "#4C2FE5", fontSize: 15, fontWeight: "800" },
  tabSafeArea: { bottom: 0, left: 0, position: "absolute", right: 0 },
  tabBar: { alignItems: "center", backgroundColor: "#FFF", borderTopColor: "#ECECF5", borderTopWidth: 1, flexDirection: "row", height: 92, justifyContent: "space-around", paddingHorizontal: 12 },
  tabItem: { alignItems: "center", flex: 1, gap: 5 },
  tabLabel: { color: "#5B668D", fontSize: 12, fontWeight: "700" },
  activeTabLabel: { color: "#4C2FE5" },
  clientFab: { alignItems: "center", flex: 1.15, gap: 5, marginTop: -38 },
  fabLabel: { color: "#2F3864", fontSize: 12, fontWeight: "700" },
});