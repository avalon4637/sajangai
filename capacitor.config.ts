import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "kr.sajang.ai",
  appName: "sajang.ai",
  // Server-Rendered WebView: load the production URL directly
  // For development, change to http://localhost:2000
  server: {
    url: "https://sajang.ai",
    cleartext: false,
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
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
