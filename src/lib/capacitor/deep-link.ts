import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

/**
 * Initialize deep link listener on native platforms.
 * Routes incoming URLs to the Next.js router.
 */
export function initDeepLinks(router: AppRouterInstance): void {
  if (!Capacitor.isNativePlatform()) return;

  App.addListener("appUrlOpen", (event) => {
    try {
      const url = new URL(event.url);
      const path = url.pathname + url.search;
      router.push(path);
    } catch {
      // Invalid URL, ignore
    }
  });
}
