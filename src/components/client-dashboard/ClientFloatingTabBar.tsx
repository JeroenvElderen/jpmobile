import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type RouteKey =
  | "home"
  | "bookings"
  | "pets"
  | "activity"
  | "profile"
  | "galleries";

type Props = {
  activeRoute?: RouteKey;
};

export default function ClientFloatingTabBar({ activeRoute = "home" }: Props) {
  const router = useRouter();
  const moreActive =
    activeRoute === "activity" ||
    activeRoute === "profile" ||
    activeRoute === "galleries";

  const navigate = (href: Parameters<typeof router.replace>[0]) => {
    router.replace(href);
  };

  return (
    <SafeAreaView pointerEvents="box-none" style={styles.safeArea}>
      <View style={styles.container}>
        <TabButton
          icon="home-outline"
          active={activeRoute === "home"}
          onPress={() => navigate("/client")}
        />

        <TabButton
          icon="calendar-outline"
          active={activeRoute === "bookings"}
          onPress={() => navigate("/client/bookings")}
        />

        <TouchableOpacity style={styles.fab} activeOpacity={0.9}>
          <Ionicons name="add" size={34} color="#FFF" />
        </TouchableOpacity>

        <TabButton
          icon="paw-outline"
          active={activeRoute === "pets"}
          onPress={() => navigate("/client/dogs")}
        />

        <View style={styles.moreGroup}>
          {moreActive && (
            <View style={styles.moreMenu}>
                <MoreButton
                icon="images-outline"
                label="Galleries"
                active={activeRoute === "galleries"}
                onPress={() => navigate("/client/galleries")}
              />
              <MoreButton
                icon="pulse-outline"
                label="Activity"
                active={activeRoute === "activity"}
                onPress={() => navigate("/client")}
              />
              <MoreButton
                icon="person-outline"
                label="Profile"
                active={activeRoute === "profile"}
                onPress={() => navigate("/client")}
              />
            </View>
          )}
          <TabButton
            icon="ellipsis-horizontal"
            active={moreActive}
            onPress={() =>
              navigate(
                activeRoute === "galleries" ? "/client" : "/client/galleries",
              )
            }
          />
        </View>
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
      activeOpacity={1}
    >
      <Ionicons name={icon} size={25} color={active ? "#5B3DF5" : "#9CA3AF"} />
    </TouchableOpacity>
  );
}

function MoreButton({
  icon,
  label,
  active,
  onPress,
}: TabButtonProps & { label: string }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.moreButton, active && styles.activeMoreButton]}
      activeOpacity={1}
    >
      <Ionicons name={icon} size={18} color={active ? "#5B3DF5" : "#5B668D"} />
      <Text style={[styles.moreLabel, active && styles.activeMoreLabel]}>
        {label}
      </Text>
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

  moreGroup: {
    alignItems: "center",
    justifyContent: "center",
  },

  moreMenu: {
    position: "absolute",
    bottom: 62,
    right: 0,
    width: 156,
    backgroundColor: "#FFF",
    borderRadius: 22,
    padding: 8,
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 18,
  },

  moreButton: {
    alignItems: "center",
    borderRadius: 16,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },

  activeMoreButton: {
    backgroundColor: "#F3EEFF",
  },

  moreLabel: {
    color: "#5B668D",
    fontSize: 13,
    fontWeight: "700",
  },

  activeMoreLabel: {
    color: "#5B3DF5",
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