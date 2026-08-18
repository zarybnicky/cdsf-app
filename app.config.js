const IS_DEVELOPMENT = process.env.APP_VARIANT === "development";

export default {
  name: IS_DEVELOPMENT ? "ČSTS Dev" : "ČSTS",
  slug: "cdsf-app",
  version: "1.0.0",
  description: "Mobile app for ČSTS members.",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "cdsfapp",
  userInterfaceStyle: "light",
  ios: {
    supportsTablet: false,
    buildNumber: "1",
    bundleIdentifier: "org.cdsf.athlete.app",
    associatedDomains: ["webcredentials:www.csts.cz"],
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#F4F7FB",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    blockedPermissions: [
      "android.permission.READ_EXTERNAL_STORAGE",
      "android.permission.SYSTEM_ALERT_WINDOW",
      "android.permission.WRITE_EXTERNAL_STORAGE",
    ],
    predictiveBackGestureEnabled: false,
    package: IS_DEVELOPMENT
      ? "org.cdsf.athlete.app.dev"
      : "org.cdsf.athlete.app",
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    [
      "expo-dev-client",
      {
        addGeneratedScheme: IS_DEVELOPMENT,
      },
    ],
    [
      "expo-notifications",
      {
        icon: "./assets/images/notification-icon.png",
        color: "#2457b3",
      },
    ],
    "expo-background-task",
    "expo-secure-store",
    "react-native-enriched-markdown",
    "expo-font",
    "expo-web-browser",
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        resizeMode: "contain",
        backgroundColor: "#ffffff",
      },
    ],
    "expo-status-bar",
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    router: {},
    eas: {
      projectId: "f0a4c264-e3aa-430d-b721-2f185219d82d",
    },
  },
};
