import type { CapacitorConfig } from "@capacitor/cli";

/**
 * The Android app ships the whole interface inside the APK (webDir below), so it
 * opens instantly and never shows the browser's "no internet" page — offline the
 * app still starts and simply reports "You're offline" inside the UI.
 */
const config: CapacitorConfig = {
  appId: "com.horizon.xchat",
  appName: "XChat",
  webDir: "mobile/www",
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  server: {
    androidScheme: "https",
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: "#0b1017",
      androidSplashResourceName: "splash",
      showSpinner: false,
    },
    LocalNotifications: {
      smallIcon: "ic_stat_icon",
      iconColor: "#2f7cf6",
    },
    Keyboard: {
      resize: "native",
    },
  },
};

export default config;
