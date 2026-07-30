import * as Linking from "expo-linking";
import { router, useSegments } from "expo-router";
import { useEffect, useRef } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useAuth } from "@/hooks/useAuth";
import { extractInvite, isRegistrationLink } from "@/lib/authValidation";
import { isAdminUser } from "@/lib/authRouting";
import { supabase } from "@/lib/supabase";
import { theme } from "@/lib/theme";

function queryValue(url: string, name: string): string | null {
  const match = url.match(new RegExp(`[?#&]${name}=([^&#]+)`));
  if (!match) return null;
  try { return decodeURIComponent(match[1]); } catch { return null; }
}

export function AuthGate({ children }: React.PropsWithChildren) {
  const { isAuthenticated, isInitializing, user } = useAuth();
  const segments = useSegments();
  const handled = useRef<string | null>(null);
  useEffect(() => {
    if (isInitializing) return;
    const inAuth = segments[0] === "(auth)";
    if (!isAuthenticated && !inAuth) router.replace("/(auth)/login");
    if (isAuthenticated && inAuth) router.replace("/");
    if (isAuthenticated && segments[0] === "admin" && !isAdminUser(user)) router.replace("/");
  }, [isAuthenticated, isInitializing, segments, user]);
  useEffect(() => {
    const processUrl = async (url: string | null) => {
      if (!url || handled.current === url) return;
      handled.current = url;
      const invite = extractInvite(url);
      if (invite && isRegistrationLink(url)) { router.navigate({ pathname: "/(auth)/register", params: { invite } }); return; }
      const code = queryValue(url, "code");
      const access = queryValue(url, "access_token");
      const refresh = queryValue(url, "refresh_token");
      if (!code && !(access && refresh)) return;
      const result = code
        ? await supabase.auth.exchangeCodeForSession(code)
        : await supabase.auth.setSession({ access_token: access!, refresh_token: refresh! });
      if (result.error) {
        router.replace({ pathname: "/(auth)/login", params: { message: "This confirmation link is invalid or has expired. Please request a new one." } });
      } else if (!result.data.session) {
        router.replace({ pathname: "/(auth)/login", params: { message: "Email confirmed. Log in to continue." } });
      }
    };
    void Linking.getInitialURL().then(processUrl);
    const subscription = Linking.addEventListener("url", ({ url }) => { void processUrl(url); });
    return () => subscription.remove();
  }, []);
  if (isInitializing) return <View style={styles.loading}><ActivityIndicator color={theme.colors.primaryDark} size="large" /><Text>Restoring your secure session…</Text></View>;
  return children;
}
const styles = StyleSheet.create({ loading: { alignItems: "center", backgroundColor: theme.colors.background, flex: 1, gap: 14, justifyContent: "center" } });
