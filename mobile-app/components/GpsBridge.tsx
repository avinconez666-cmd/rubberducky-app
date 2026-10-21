import { useEffect } from "react";
import * as Location from "expo-location";
import { useApp } from "@/contexts/AppContext";

/** Foreground GPS only. No background tracking. */
export function GpsBridge() {
  const { isOnboarded, setGpsSample } = useApp();

  useEffect(() => {
    if (!isOnboarded) return;
    let sub: Location.LocationSubscription | null = null;
    let cancelled = false;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted" || cancelled) return;
      sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 4000,
          distanceInterval: 8,
        },
        (loc) => {
          const raw = loc.coords.speed;
          const speedKmh = raw == null || raw < 0 ? 0 : raw * 3.6;
          const heading = loc.coords.heading != null && loc.coords.heading >= 0 ? loc.coords.heading : null;
          setGpsSample({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            speedKmh,
            heading,
          });
        },
      );
    })();

    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, [isOnboarded, setGpsSample]);

  return null;
}
