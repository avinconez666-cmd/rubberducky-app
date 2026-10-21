import * as Location from "expo-location";

export type GpsAccuracy = "saver" | "standard" | "best";

export const GPS_OPTIONS: { id: GpsAccuracy; label: string; detail: string }[] = [
  { id: "saver", label: "Saver", detail: "Fewer fixes. Easier on the battery." },
  { id: "standard", label: "Standard", detail: "A fix every few seconds." },
  { id: "best", label: "Best", detail: "Tightest fix. Uses more battery." },
];

export function normaliseGpsAccuracy(value: unknown): GpsAccuracy {
  return value === "saver" || value === "best" || value === "standard" ? value : "standard";
}

export function watchOptions(mode: GpsAccuracy): Location.LocationOptions {
  if (mode === "saver") {
    return { accuracy: Location.Accuracy.Balanced, timeInterval: 8000, distanceInterval: 25 };
  }
  if (mode === "best") {
    return { accuracy: Location.Accuracy.BestForNavigation, timeInterval: 2000, distanceInterval: 4 };
  }
  return { accuracy: Location.Accuracy.High, timeInterval: 4000, distanceInterval: 8 };
}
