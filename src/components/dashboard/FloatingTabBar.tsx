import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type RouteKey = "home" | "bookings" | "dogs" | "clients" | "galleries";
type AdminQuickAction = "booking" | "client" | "dog";

type Props = {
  activeRoute?: RouteKey;
  onQuickAction?: (action: AdminQuickAction) => void;
};

const quickActions: { action: AdminQuickAction; icon: keyof typeof Ionicons.glyphMap; title: string; helper: string }[] = [
  { action: "booking", icon: "calendar-outline", title: "New booking", helper: "Schedule care for a client." },
  { action: "client", icon: "person-add-outline", title: "Add client", helper: "Create a private client profile." },
  { action: "dog", icon: "paw-outline", title: "Add dog", helper: "Attach a pet to a client." },
];

export default function FloatingTabBar({ activeRoute = "home", onQuickAction }: Props) {
  const router = useRouter();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isActionOpen, setIsActionOpen] = useState(false);
  const moreActive = activeRoute === "clients" || activeRoute === "galleries";

  const navigate = (href: Parameters<typeof router.replace>[0]) => {
    setIsMoreOpen(false);
    setIsActionOpen(false);
    router.replace(href);
  };

  const triggerQuickAction = (action: AdminQuickAction) => {
    setIsActionOpen(false);
    setIsMoreOpen(false);
    onQuickAction?.(action);
  };

  return (
    <SafeAreaView pointerEvents="box-none" style={styles.safeArea}>
      <View style={styles.container}>
        <TabButton
          icon="home-outline"
          active={activeRoute === "home"}
          onPress={() => navigate("/admin")}
        />

        <TabButton
          icon="calendar-outline"
          active={activeRoute === "bookings"}
          onPress={() => navigate("/admin/bookings")}
        />

        <View style={styles.actionGroup}>
          {isActionOpen && (
            <View style={styles.actionMenu}>
              <Text style={styles.actionEyebrow}>Admin tools</Text>
              {quickActions.map((item) => (
                <TouchableOpacity key={item.action} style={styles.actionRow} activeOpacity={0.86} onPress={() => triggerQuickAction(item.action)}>
                  <View style={styles.actionIcon}>
                    <Ionicons name={item.icon} size={20} color="#5B3DF5" />
                  </View>
                  <View style={styles.actionCopy}>
                    <Text style={styles.actionTitle}>{item.title}</Text>
                    <Text style={styles.actionHelper}>{item.helper}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        <TouchableOpacity style={[styles.fab, isActionOpen && styles.fabActive]} onPress={() => { setIsMoreOpen(false); setIsActionOpen((current) => !current); }} activeOpacity={0.9}>
          <Ionicons name="add" size={34} color="#FFF" />
        </TouchableOpacity>
        </View>

        <TabButton
          icon="paw-outline"
          active={activeRoute === "dogs"}
          onPress={() => navigate("/admin/dogs")}
        />

        <View style={styles.moreGroup}>
          {isMoreOpen && (
            <View style={styles.moreMenu}>
              <MoreButton
                icon="person-outline"
                label="Clients"
                active={activeRoute === "clients"}
                onPress={() => navigate("/admin/clients")}
              />
              <MoreButton
                icon="images-outline"
                label="Galleries"
                active={activeRoute === "galleries"}
                onPress={() => navigate("/admin/galleries")}
              />
            </View>
          )}
          <TabButton
            icon="ellipsis-horizontal"
            active={moreActive || isMoreOpen}
            onPress={() => { setIsActionOpen(false); setIsMoreOpen((isOpen) => !isOpen); }}
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

  actionGroup: {
    alignItems: "center",
    justifyContent: "center",
  },

  actionMenu: {
    backgroundColor: "#FFF",
    borderColor: "#ECECF5",
    borderRadius: 24,
    borderWidth: 1,
    bottom: 82,
    padding: 12,
    position: "absolute",
    width: 276,
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 20,
  },

  actionEyebrow: {
    color: "#5B3DF5",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.4,
    marginBottom: 8,
    paddingHorizontal: 8,
    textTransform: "uppercase",
  },

  actionRow: {
    alignItems: "center",
    borderRadius: 18,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 10,
    paddingVertical: 12,
  },

  actionIcon: {
    alignItems: "center",
    backgroundColor: "#F3EEFF",
    borderRadius: 18,
    height: 42,
    justifyContent: "center",
    width: 42,
  },

  actionCopy: {
    flex: 1,
    gap: 3,
  },

  actionTitle: {
    color: "#1D2238",
    fontSize: 15,
    fontWeight: "800",
  },

  actionHelper: {
    color: "#70758E",
    fontSize: 12,
    fontWeight: "600",
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
  
  fabActive: {
    transform: [{ rotate: "45deg" }],
  },
});
