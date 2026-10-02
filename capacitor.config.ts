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
    // captureInput must stay off: it blocks the Android keyboard's own
    // autocorrect, word prediction and suggestion strip inside the web view.
    captureInput: false,
    webContentsDebuggingEnabled: false,
    backgroundColor: "#f8f9fa",
  },
  server: {
    androidScheme: "https",
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 0,
      launchFadeOutDuration: 0,
      splashImmersive: false,
      splashFullScreen: false,
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
