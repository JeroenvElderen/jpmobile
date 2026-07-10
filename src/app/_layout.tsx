import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { theme } from "@/lib/theme";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: theme.colors.background },
          headerShadowVisible: false,
          headerStyle: { backgroundColor: theme.colors.background },
          headerTintColor: theme.colors.text,
          headerTitleStyle: { fontWeight: "700" },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/login" options={{ title: "Log In" }} />
        <Stack.Screen
          name="(auth)/register"
          options={{ title: "Create Account" }}
        />
        <Stack.Screen name="admin" options={{ headerShown: false }} />
        <Stack.Screen name="admin/bookings" options={{ headerShown: false }} />
        <Stack.Screen name="admin/dogs" options={{ headerShown: false }} />
        <Stack.Screen name="admin/clients" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
