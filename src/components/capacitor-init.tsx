"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Initializes Capacitor native features (push notifications, deep links).
 * On web, this component does nothing.
 * Must be rendered as a client component in the root layout.
 */
export function CapacitorInit() {
  const router = useRouter();

  useEffect(() => {
    async function init() {
      try {
        const { Capacitor } = await import("@capacitor/core");
        if (!Capacitor.isNativePlatform()) return;

        // Initialize deep links
        const { initDeepLinks } = await import("@/lib/capacitor/deep-link");
        initDeepLinks(router);

        // Initialize push notifications
        const { initPushNotifications, setupPushListeners } = await import(
          "@/lib/capacitor/push"
        );

        const token = await initPushNotifications();
        if (token) {
          // Store push token to Supabase (fire and forget)
          await savePushToken(token);
        }

        setupPushListeners((url) => {
          router.push(url);
        });
      } catch {
        // Capacitor not available (web environment), silently skip
      }
    }

    init();
  }, [router]);

  return null;
}

async function savePushToken(token: string): Promise<void> {
  try {
    const { Capacitor } = await import("@capacitor/core");
    const platform = Capacitor.getPlatform();

    await fetch("/api/push-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, platform }),
    });
  } catch {
    // Silent fail - token save is best-effort
  }
}
