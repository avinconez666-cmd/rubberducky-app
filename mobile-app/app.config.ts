import type { ExpoConfig } from "expo/config";

const packageName = "app.tenfour.rubberducky";

const config: ExpoConfig = {
  name: "10/4 Rubberducky",
  slug: "rubberducky-mobile",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "rubberducky",
  userInterfaceStyle: "dark",
  newArchEnabled: true,
  description:
    "Hands-free driver radio. GPS map, push-to-talk clips, and hazard pins stay on your phone.",
  ios: {
    supportsTablet: false,
    bundleIdentifier: packageName,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      NSLocationWhenInUseUsageDescription:
        "10/4 Rubberducky uses your location to place you on the map, measure speed for Safety Mode, and pin hazard reports. Location stays on this phone.",
      NSMicrophoneUsageDescription:
        "10/4 Rubberducky uses the microphone for push-to-talk clips that stay on this phone.",
    },
  },
  android: {
    package: packageName,
    versionCode: 1,
    adaptiveIcon: {
      backgroundColor: "#071428",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    blockedPermissions: [
      "android.permission.ACCESS_BACKGROUND_LOCATION",
      "android.permission.RECORD_AUDIO_HOTWORD",
      "com.google.android.gms.permission.AD_ID",
    ],
    permissions: [
      "android.permission.ACCESS_COARSE_LOCATION",
      "android.permission.ACCESS_FINE_LOCATION",
      "android.permission.RECORD_AUDIO",
      "android.permission.VIBRATE",
    ],
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    [
      "expo-location",
      {
        locationWhenInUsePermission:
          "10/4 Rubberducky uses your location to place you on the map, measure speed for Safety Mode, and pin hazard reports. Location stays on this phone.",
        isAndroidBackgroundLocationEnabled: false,
        isIosBackgroundLocationEnabled: false,
      },
    ],
    [
      "expo-audio",
      {
        microphonePermission:
          "10/4 Rubberducky uses the microphone for push-to-talk clips that stay on this phone.",
      },
    ],
    [
      "expo-image-picker",
      {
        photosPermission: "10/4 Rubberducky uses a photo you pick as your driver profile picture.",
        cameraPermission: "10/4 Rubberducky uses the camera if you take a profile photo.",
      },
    ],
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 220,
        resizeMode: "contain",
        backgroundColor: "#071428",
        dark: { backgroundColor: "#071428" },
      },
    ],
    [
      "expo-build-properties",
      {
        android: {
          compileSdkVersion: 36,
          targetSdkVersion: 36,
          minSdkVersion: 24,
          buildArchs: ["armeabi-v7a", "arm64-v8a"],
        },
      },
    ],
  ],
  extra: {
    privacyPolicyUrl: "https://avinconez666-cmd.github.io/rubberducky-app/privacy.html",
  },
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
};

export default config;
