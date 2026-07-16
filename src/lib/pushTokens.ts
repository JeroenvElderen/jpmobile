import { Platform } from "react-native";

import { supabase } from "@/lib/supabase";

export async function registerExpoPushToken(expoPushToken: string) {
  const { error } = await supabase.functions.invoke("push-notifications", {
    body: {
      action: "register-token",
      token: expoPushToken,
      platform: Platform.OS,
    },
  });

  if (error) throw error;
}

export async function sendAdminPushNotification(input: { title: string; body: string; url?: string; type?: string }) {
  const { error } = await supabase.functions.invoke("push-notifications", {
    body: {
      action: "notify-admins",
      title: input.title,
      body: input.body,
      url: input.url ?? "/admin",
      type: input.type ?? "admin_update",
    },
  });

  if (error) throw error;
}