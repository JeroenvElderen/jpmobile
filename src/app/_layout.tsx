import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { PushNotificationsProvider } from "@/providers/PushNotificationsProvider";

import { theme } from "@/lib/theme";

export default function RootLayout() {
  return (
    <PushNotificationsProvider>
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
        <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
        <Stack.Screen
          name="(auth)/register"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="complete-account"
          options={{ animation: "none", headerShown: false }}
        />
        <Stack.Screen
          name="admin"
          options={{ animation: "none", headerShown: false }}
        />
        <Stack.Screen
          name="client"
          options={{ animation: "none", headerShown: false }}
        />
        <Stack.Screen
          name="admin/bookings"
          options={{ animation: "none", headerShown: false }}
        />
        <Stack.Screen
          name="client/bookings"
          options={{ animation: "none", headerShown: false }}
        />
        <Stack.Screen
          name="client/dogs"
          options={{ animation: "none", headerShown: false }}
        />
        <Stack.Screen
          name="admin/dogs"
          options={{ animation: "none", headerShown: false }}
        />
        <Stack.Screen
          name="admin/clients"
          options={{ animation: "none", headerShown: false }}
        />
        <Stack.Screen
          name="admin/galleries"
          options={{ animation: "none", headerShown: false }}
        />
        <Stack.Screen
          name="client/galleries"
          options={{ animation: "none", headerShown: false }}
        />
        <Stack.Screen
          name="client/profile"
          options={{ animation: "none", headerShown: false }}
        />
      </Stack>
    </PushNotificationsProvider>
  );
}
