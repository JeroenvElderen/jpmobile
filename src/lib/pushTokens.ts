import { Platform } from "react-native";

import { getFunctionErrorMessage } from "@/lib/functionErrors";
import { supabase } from "@/lib/supabase";

export async function registerExpoPushToken(expoPushToken: string) {
  const { error, response } = await supabase.functions.invoke("push-notifications", {
    body: {
      action: "register-token",
      token: expoPushToken,
      platform: Platform.OS,
    },
  });

  if (error) {
    throw new Error(await getFunctionErrorMessage(error, "Could not register this device for push notifications.", response));
  }
}

export async function sendAdminPushNotification(input: { title: string; body: string; url?: string; type?: string }) {
  const { error, response } = await supabase.functions.invoke("push-notifications", {
    body: {
      action: "notify-admins",
      title: input.title,
      body: input.body,
      url: input.url ?? "/admin",
      type: input.type ?? "admin_update",
    },
  });

  if (error) {
    throw new Error(await getFunctionErrorMessage(error, "Could not send the push notification.", response));
  }
}