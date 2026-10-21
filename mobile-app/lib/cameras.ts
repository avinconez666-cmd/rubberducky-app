import cameras from "@/data/cameras-nsw.json";
import { haversineMeters } from "@/lib/geo";

export interface OfficialCamera {
  id: string;
  state: string;
  kind: "fixed" | "redlight";
  suburb: string;
  road: string;
  schoolZone: boolean;
  lat: number;
  lng: number;
  source: string;
}

const ALL = cameras as OfficialCamera[];

export const CAMERA_SOURCE =
  "Transport for NSW open data: fixed speed cameras and red-light speed cameras. Published locations, signposted on the road. The list is not live and does not cover every state.";

export function nearestCameras(
  lat: number,
  lng: number,
  limit = 12,
  maxMeters = 25000,
): (OfficialCamera & { meters: number })[] {
  const scored = ALL.map((cam) => ({ ...cam, meters: haversineMeters(lat, lng, cam.lat, cam.lng) }));
  return scored
    .filter((cam) => cam.meters <= maxMeters)
    .sort((a, b) => a.meters - b.meters)
    .slice(0, limit);
}

export function bearingDegrees(fromLat: number, fromLng: number, toLat: number, toLng: number) {
  const φ1 = (fromLat * Math.PI) / 180;
  const φ2 = (toLat * Math.PI) / 180;
  const Δλ = ((toLng - fromLng) * Math.PI) / 180;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (Math.atan2(y, x) * 180) / Math.PI;
}

export function angleDelta(a: number, b: number) {
  const d = Math.abs((((a - b) % 360) + 360) % 360);
  return d > 180 ? 360 - d : d;
}

export const CAMERA_COUNT = ALL.length;
