import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";

/**
 * Initialize push notifications on native platforms.
 * Returns the device token for FCM (Android) or APNs (iOS), or null on web.
 */
export async function initPushNotifications(): Promise<string | null> {
  if (!Capacitor.isNativePlatform()) return null;

  const permission = await PushNotifications.requestPermissions();
  if (permission.receive !== "granted") return null;

  await PushNotifications.register();

  return new Promise((resolve) => {
    PushNotifications.addListener("registration", (token) => {
      resolve(token.value);
    });
    PushNotifications.addListener("registrationError", () => {
      resolve(null);
    });
  });
}

/**
 * Set up push notification received/tapped listeners.
 */
export function setupPushListeners(
  onNotificationTap: (url: string) => void
): void {
  if (!Capacitor.isNativePlatform()) return;

  PushNotifications.addListener(
    "pushNotificationActionPerformed",
    (notification) => {
      const url = notification.notification.data?.url as string | undefined;
      if (url) {
        onNotificationTap(url);
      }
    }
  );
}
