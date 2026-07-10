import FloatingTabBar from "@/components/dashboard/FloatingTabBar";
import { dogs, dogStats, type Dog } from "@/lib/dogsData";
import { Ionicons } from "@expo/vector-icons";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function DogsScreen() {
  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <DogsHeader />

        <View style={styles.statsGrid}>
          {dogStats.map((stat) => (
            <View key={stat.title} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: stat.iconBackground }]}>
                <Ionicons name={stat.icon} size={26} color={stat.iconColor} />
              </View>
              <Text style={styles.statTitle}>{stat.title}</Text>
              <Text style={styles.statValue}>{stat.value}</Text>
              <View style={styles.statChangeRow}>
                <Ionicons name="arrow-up" size={15} color="#20C842" />
                <Text style={styles.statChange}>{stat.change}</Text>
              </View>
              <Text style={styles.statSubtitle}>from last month</Text>
            </View>
          ))}
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={26} color="#59607E" />
            <Text style={styles.searchText}>Search by dog name, breed, or owner...</Text>
          </View>
          <TouchableOpacity style={styles.filterButton} activeOpacity={0.85}>
            <Ionicons name="filter-outline" size={24} color="#1D2238" />
            <Text style={styles.filterText}>Filters</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.chipsRow}>
          <FilterChip label="All Dogs" />
          <FilterChip label="All Owners" />
          <FilterChip label="All Status" />
          <FilterChip label="Newest First" icon="swap-vertical-outline" wide />
        </View>

        <View style={styles.list}>
          {dogs.map((dog) => (
            <DogCard key={dog.id} dog={dog} />
          ))}
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.floatingAdd} activeOpacity={0.9}>
        <Ionicons name="add" size={42} color="#FFFFFF" />
      </TouchableOpacity>

      <FloatingTabBar />
    </View>
  );
}

function DogsHeader() {
  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.headerIcon} activeOpacity={0.8}>
        <Ionicons name="menu-outline" size={34} color="#111831" />
      </TouchableOpacity>

      <View style={styles.titleRow}>
        <Text style={styles.title}>Dogs</Text>
        <Ionicons name="paw-outline" size={34} color="#4B21B8" />
      </View>

      <TouchableOpacity style={styles.notification} activeOpacity={0.8}>
        <Ionicons name="notifications-outline" size={30} color="#111831" />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>2</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

type FilterChipProps = {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  wide?: boolean;
};

function FilterChip({ label, icon, wide }: FilterChipProps) {
  return (
    <TouchableOpacity style={[styles.chip, wide && styles.wideChip]} activeOpacity={0.85}>
      {icon ? <Ionicons name={icon} size={18} color="#1D2544" /> : null}
      <Text style={styles.chipText}>{label}</Text>
      <Ionicons name="chevron-down" size={18} color="#1D2544" />
    </TouchableOpacity>
  );
}

function DogCard({ dog }: { dog: Dog }) {
  const active = dog.status === "Active";

  return (
    <TouchableOpacity style={styles.dogCard} activeOpacity={0.86}>
      <Image source={{ uri: dog.avatar }} style={styles.avatar} />

      <View style={styles.dogDetails}>
        <Text style={styles.dogName}>{dog.name}</Text>
        <Text style={styles.breed}>{dog.breed}</Text>
        <View style={styles.ownerRow}>
          <Ionicons name="paw-outline" size={20} color="#4B21B8" />
          <Text style={styles.owner}>{dog.owner}</Text>
        </View>
      </View>

      <View style={styles.metaColumn}>
        <View style={[styles.statusBadge, { backgroundColor: active ? "#E7F8E8" : "#FFF0E6" }]}>
          <Text style={[styles.statusText, { color: active ? "#0F8F24" : "#E45A00" }]}>{dog.status}</Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={18} color="#59607E" />
          <Text style={styles.metaText}>{dog.bookings} Bookings</Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="calendar-clear-outline" size={18} color="#59607E" />
          <Text style={styles.metaText}>{dog.age}</Text>
        </View>
      </View>

      <Ionicons name="ellipsis-vertical" size={26} color="#3A1399" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 72,
    paddingBottom: 145,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 34,
  },
  headerIcon: {
    alignItems: "center",
    height: 46,
    justifyContent: "center",
    width: 46,
  },
  titleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  title: {
    color: "#060B1F",
    fontSize: 31,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  notification: {
    alignItems: "center",
    height: 46,
    justifyContent: "center",
    width: 46,
  },
  badge: {
    alignItems: "center",
    backgroundColor: "#EF2D55",
    borderRadius: 11,
    height: 22,
    justifyContent: "center",
    position: "absolute",
    right: 2,
    top: 1,
    width: 22,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  statsGrid: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 26,
  },
  statCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E8EAF4",
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    minHeight: 136,
    paddingHorizontal: 6,
    paddingVertical: 16,
    shadowColor: "#16213A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
  },
  statIcon: {
    alignItems: "center",
    borderRadius: 33,
    height: 66,
    justifyContent: "center",
    marginBottom: 10,
    width: 66,
  },
  statTitle: {
    color: "#2D345C",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
    textAlign: "center",
  },
  statValue: {
    color: "#030713",
    fontSize: 34,
    fontWeight: "500",
    lineHeight: 38,
  },
  statChangeRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
    marginTop: 8,
  },
  statChange: {
    color: "#16BC34",
    fontSize: 15,
    fontWeight: "800",
  },
  statSubtitle: {
    color: "#59607E",
    fontSize: 11,
    marginTop: 4,
    textAlign: "center",
  },
  searchRow: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 14,
  },
  searchBox: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E5F0",
    borderRadius: 11,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: 14,
    height: 62,
    paddingHorizontal: 20,
  },
  searchText: {
    color: "#687092",
    flex: 1,
    fontSize: 18,
    fontWeight: "500",
  },
  filterButton: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E5F0",
    borderRadius: 11,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    height: 62,
    justifyContent: "center",
    minWidth: 172,
  },
  filterText: {
    color: "#10162D",
    fontSize: 19,
    fontWeight: "700",
  },
  chipsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  chip: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E5F0",
    borderRadius: 9,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: 8,
    height: 56,
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  wideChip: {
    flex: 1.25,
  },
  chipText: {
    color: "#111831",
    fontSize: 16,
    fontWeight: "600",
  },
  list: {
    gap: 0,
  },
  dogCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E3E6F0",
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: "row",
    marginBottom: 2,
    minHeight: 145,
    paddingHorizontal: 28,
    paddingVertical: 20,
  },
  avatar: {
    borderRadius: 46,
    height: 92,
    marginRight: 28,
    width: 92,
  },
  dogDetails: {
    flex: 1.15,
  },
  dogName: {
    color: "#060B1F",
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 6,
  },
  breed: {
    color: "#3E456B",
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 12,
  },
  ownerRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  owner: {
    color: "#3E456B",
    fontSize: 16,
    fontWeight: "600",
  },
  metaColumn: {
    flex: 0.78,
    gap: 12,
  },
  statusBadge: {
    alignSelf: "flex-start",
    borderRadius: 7,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusText: {
    fontSize: 16,
    fontWeight: "700",
  },
  metaRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  metaText: {
    color: "#3E456B",
    fontSize: 16,
    fontWeight: "500",
  },
  floatingAdd: {
    alignItems: "center",
    backgroundColor: "#4B21B8",
    borderRadius: 46,
    bottom: 205,
    height: 92,
    justifyContent: "center",
    position: "absolute",
    right: 36,
    shadowColor: "#3A1399",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.32,
    shadowRadius: 22,
    width: 92,
    zIndex: 2,
    elevation: 22,
  },
});