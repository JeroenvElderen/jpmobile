import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";

export type PushRegistrationResult = {
  expoPushToken: string | null;
  status: Notifications.PermissionStatus | "unavailable" | "missing-project-id";
};

const DEFAULT_CHANNEL_ID = "default";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function configureAndroidNotificationChannel() {
  if (Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync(DEFAULT_CHANNEL_ID, {
    name: "Default notifications",
    description: "Booking, gallery, and account updates from Jeroen & Paws.",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#5B3DF5",
  });
}

export async function registerForPushNotificationsAsync(): Promise<PushRegistrationResult> {
  await configureAndroidNotificationChannel();

  if (!Device.isDevice) {
    return { expoPushToken: null, status: "unavailable" };
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== Notifications.PermissionStatus.GRANTED) {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== Notifications.PermissionStatus.GRANTED) {
    return { expoPushToken: null, status: finalStatus };
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

  if (!projectId) {
    return { expoPushToken: null, status: "missing-project-id" };
  }

  const { data } = await Notifications.getExpoPushTokenAsync({ projectId });

  return { expoPushToken: data, status: finalStatus };
}

export async function scheduleTestNotificationAsync() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Jeroen & Paws notifications are ready",
      body: "You will receive updates about bookings, galleries, and your account.",
      data: { url: "/client" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 2,
    },
  });
}