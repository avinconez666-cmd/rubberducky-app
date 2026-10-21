# 10/4 Rubberducky

Driver radio for Android. Version 1.0 runs on the phone: GPS map, push-to-talk clips, Safety Mode, hazard pins, place search, and a convoy list. Nothing in that list is uploaded.

The app is in [`mobile-app/`](mobile-app/).

Older write-ups in this repo (`PROJECT_SUMMARY.md`, `FINAL_DELIVERY.md`, `INSTALLATION.md`) describe a Node and MongoDB backend that was never committed. Do not follow them.

## Release

See [PLAY_RELEASE.md](PLAY_RELEASE.md).

- Package: `app.tenfour.rubberducky`
- Privacy: [docs/privacy.html](docs/privacy.html)
- Store art: [`store/`](store/)

```bash
cd mobile-app
npm install
npx eas-cli build -p android --profile production
```

## What version 1.0 does

- Map tiles from OpenStreetMap, centred on your GPS
- Hold the PTT button to record up to 30 seconds and play it back
- Text locks when GPS speed passes the limit you set
- Hazard pins: accident, debris, breakdown, animal, roadworks, weather. One hour, on device
- Place search, then handoff to Google Maps for turn-by-turn
- Public two-way radio room and a friends-only convoy room, once you point Settings at a relay (`relay/server.mjs`)
- Friend requests by handle
- Profile photo and a car garage (paint, wheels, accessories)
- 347 signposted NSW fixed and red-light cameras from Transport for NSW open data, with an ahead warning
- Community camera, traffic-stop, and driver-behaviour pins. Driver notes cannot include a number plate. Traffic-stop pins expire after 45 minutes, driver pins after 30.

No account. No subscription. No background location. No police or speed-camera alerts.
