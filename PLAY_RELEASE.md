# Play Store release — 10/4 Rubberducky

Package: `app.tenfour.rubberducky`  
Version: `1.0.0` (versionCode `1`)  
Target SDK: 36  
Privacy URL: https://avinconez666-cmd.github.io/rubberducky-app/privacy.html

The signed bundle is built on your machine or with Expo. This repository cannot upload it to Play Console for you.

## 1. Build the Android App Bundle

From `mobile-app/`, with an Expo account signed in:

```bash
cd mobile-app
npm install
npx expo install expo-location react-native-webview
npx eas-cli login
npx eas-cli build -p android --profile production
```

Download the `.aab` from the Expo build page.

Store art is already in `store/`:

- `store/icon-512.png` — Play icon, 512×512
- `store/feature-graphic-1024x500.png` — feature graphic

Phone screenshots: take them on a device after install (map, hazards, PTT, settings). Play wants at least two.

## 2. Listing copy

**Title:** 10/4 Rubberducky

**Short description:** Hands-free driver radio. Map, voice clips, and hazard pins stay on your phone.

**Full description:**

10/4 Rubberducky is a driver radio for the road.

Hold the button to record a push-to-talk clip and play it back. Your GPS pin sits on an OpenStreetMap. Safety Mode locks the keyboard once you are moving. Drop a hazard pin for an accident, debris, a breakdown, an animal, roadworks, or weather. Search a place and hand turn-by-turn over to Google Maps. Save convoy handles on the phone.

Version 1.0 keeps location, voice, and notes on the device. There is no account and no subscription. A practice channel can draw sample drivers so you can learn the screen. Those pins are labelled practice. They are not other people.

Not a speed-camera or police alert app.

## 3. Data safety (Play Console)

Answer from what the app actually does:

| Question | Answer |
| --- | --- |
| Data collected and shared with the developer | No |
| Data sold | No |
| Encrypted in transit | Yes (map tiles and place search use HTTPS) |
| Users can request deletion | Uninstall the app, or clear app storage |
| Location | Collected on device for app function, not shared |
| Audio | Collected on device for app function, not shared |
| Personal info / contacts / financial | No |
| Device or other IDs | No advertising ID |

Location and microphone are optional. The app still opens if you deny them. The map and clips need those permissions to work.

## 4. Content rating and policy notes

- No in-app purchases. Do not turn on Play Billing.
- No ads.
- Not directed at children. Do not enrol in Designed for Families.
- Do not declare background location. The app only uses location while it is open.
- Hazard types are road conditions only. There is no police or speed-camera reporting.

## 5. Before you press Roll out

1. Install the release build on your phone.
2. Allow location and microphone.
3. Confirm the map centres on you, a PTT clip plays back, a hazard pin lands on your position, and Safety Mode appears when you are actually moving.
4. Confirm Settings → Practice channel is off unless you want the sample pins.
5. Open the privacy URL in a browser and paste that same URL into Play Console.
