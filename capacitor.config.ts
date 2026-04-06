import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "ai.sajang.app",
  appName: "사장.ai",
  // Server-Rendered WebView: load the production URL directly.
  // For local development, override url to http://localhost:2000
  server: {
    url: "https://sajang.ai",
    cleartext: false,
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 2000,
      backgroundColor: "#ffffff",
    },
  },
  android: {
    allowMixedContent: false,
  },
  ios: {
    contentInset: "always",
    preferredContentMode: "mobile",
  },
};

export default config;
