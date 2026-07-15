import * as Notifications from "expo-notifications";
import { Href, router } from "expo-router";
import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { registerForPushNotificationsAsync, scheduleTestNotificationAsync, type PushRegistrationResult } from "@/lib/notifications";

type PushNotificationsContextValue = {
  expoPushToken: string | null;
  isRegistering: boolean;
  lastRegistrationStatus: PushRegistrationResult["status"] | null;
  lastNotification: Notifications.Notification | null;
  registerForPushNotifications: () => Promise<PushRegistrationResult>;
  scheduleTestNotification: () => Promise<void>;
};

const PushNotificationsContext = createContext<PushNotificationsContextValue | null>(null);

export function PushNotificationsProvider({ children }: PropsWithChildren) {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [lastRegistrationStatus, setLastRegistrationStatus] = useState<PushRegistrationResult["status"] | null>(null);
  const [lastNotification, setLastNotification] = useState<Notifications.Notification | null>(null);

  const registerForPushNotifications = useCallback(async () => {
    setIsRegistering(true);

    try {
      const result = await registerForPushNotificationsAsync();
      setExpoPushToken(result.expoPushToken);
      setLastRegistrationStatus(result.status);
      return result;
    } finally {
      setIsRegistering(false);
    }
  }, []);

  useEffect(() => {
    registerForPushNotifications();

    const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
      setLastNotification(notification);
    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const url = response.notification.request.content.data?.url;

      if (typeof url === "string") {
        router.push(url as Href);
        }
    });

    const lastResponse = Notifications.getLastNotificationResponse();
    const initialUrl = lastResponse?.notification.request.content.data?.url;

    if (typeof initialUrl === "string") {
        router.push(initialUrl as Href);
        }

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, [registerForPushNotifications]);

  const value = useMemo(
    () => ({
      expoPushToken,
      isRegistering,
      lastRegistrationStatus,
      lastNotification,
      registerForPushNotifications,
      scheduleTestNotification: scheduleTestNotificationAsync,
    }),
    [expoPushToken, isRegistering, lastNotification, lastRegistrationStatus, registerForPushNotifications],
  );

  return <PushNotificationsContext.Provider value={value}>{children}</PushNotificationsContext.Provider>;
}

export function usePushNotifications() {
  const context = useContext(PushNotificationsContext);

  if (!context) {
    throw new Error("usePushNotifications must be used within PushNotificationsProvider");
  }

  return context;
}