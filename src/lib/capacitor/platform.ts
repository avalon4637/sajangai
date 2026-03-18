import { Capacitor } from "@capacitor/core";

/**
 * Check if running on a native platform (Android/iOS).
 */
export function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Get the current platform: 'web', 'android', or 'ios'.
 */
export function getPlatform(): "web" | "android" | "ios" {
  return Capacitor.getPlatform() as "web" | "android" | "ios";
}
