import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { getAccountSetupRouteForUser } from "@/lib/accountSetup";
import { supabase } from "@/lib/supabase";
import { theme } from "@/lib/theme";

const ADMIN_EMAIL = "jeroen@jeroenandpaws.com";

type InitialRoute = "/(auth)/login" | "/admin" | "/client" | "/complete-account";

export default function Index() {
  const [initialRoute, setInitialRoute] = useState<InitialRoute>();

  useEffect(() => {
    let isMounted = true;

    async function resolveInitialRoute() {
      const { data, error } = await supabase.auth.getUser();

      if (!isMounted) return;

      if (error || !data.user) {
        setInitialRoute("/(auth)/login");
        return;
      }

      const email = data.user.email?.trim().toLowerCase();

      if (email === ADMIN_EMAIL) {
        setInitialRoute("/admin");
        return;
      }

      try {
        setInitialRoute((await getAccountSetupRouteForUser(data.user)) as InitialRoute);
      } catch {
        setInitialRoute("/(auth)/login");
      }
    }

    resolveInitialRoute();

    return () => {
      isMounted = false;
    };
  }, []);

  if (initialRoute) {
    return <Redirect href={initialRoute} />;
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator color={theme.colors.primary} size="large" />
      <Text style={styles.message}>Loading your account...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: theme.colors.background,
    flex: 1,
    gap: 16,
    justifyContent: "center",
    padding: 24,
  },
  message: {
    color: theme.colors.textMuted,
    fontSize: 15,
    fontWeight: "600",
  },
});