import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type RouteKey = "home" | "bookings" | "dogs" | "profile";

type Props = {
  activeRoute?: RouteKey;
};

export default function FloatingTabBar({ activeRoute = "home" }: Props) {
  const router = useRouter();

  return (
    <SafeAreaView pointerEvents="box-none" style={styles.safeArea}>
      <View style={styles.container}>
        <TabButton
          icon="home-outline"
          active={activeRoute === "home"}
          onPress={() => router.push("/admin")}
        />

        <TabButton 
            icon="calendar-outline"
            active={activeRoute === "bookings"}
            onPress={() => router.push("/admin/bookings")}
        />

        <TouchableOpacity style={styles.fab}>
          <Ionicons name="add" size={34} color="#FFF" />
        </TouchableOpacity>

        <TabButton icon="paw-outline" active={false} onPress={() => {}} />

        <TabButton icon="person-outline" active={false} onPress={() => {}} />
      </View>
    </SafeAreaView>
  );
}

type TabButtonProps = {
  icon: keyof typeof Ionicons.glyphMap;
  active?: boolean;
  onPress: () => void;
};

function TabButton({ icon, active, onPress }: TabButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.tab, active && styles.activeTab]}
      activeOpacity={0.8}
    >
      <Ionicons name={icon} size={25} color={active ? "#5B3DF5" : "#9CA3AF"} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },

  container: {
    marginHorizontal: 18,
    marginBottom: 10,

    height: 82,

    backgroundColor: "#FFF",

    borderRadius: 50,

    flexDirection: "row",

    justifyContent: "space-evenly",

    alignItems: "center",

    shadowColor: "#000",

    shadowOpacity: 0.12,

    shadowRadius: 24,

    shadowOffset: {
      width: 0,
      height: 10,
    },

    elevation: 15,
  },

  tab: {
    width: 48,
    height: 48,

    justifyContent: "center",
    alignItems: "center",

    borderRadius: 24,
  },

  activeTab: {
    backgroundColor: "#F3EEFF",
  },

  fab: {
    width: 68,
    height: 68,

    borderRadius: 34,

    backgroundColor: "#5B3DF5",

    justifyContent: "center",
    alignItems: "center",

    marginTop: -35,

    shadowColor: "#5B3DF5",

    shadowOpacity: 0.35,

    shadowRadius: 18,

    shadowOffset: {
      width: 0,
      height: 8,
    },

    elevation: 20,
  },
});
