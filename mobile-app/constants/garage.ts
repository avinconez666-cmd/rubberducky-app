export type CarBody = "holden" | "falcon" | "hilux" | "landcruiser" | "holdenute" | "patrol";
export type WheelStyle = "steel" | "alloy" | "mags" | "black" | "gold" | "bronze";

export interface CarStyle {
  body: CarBody;
  paint: string;
  wheel: WheelStyle;
  accessories: string[];
}

export interface DriverStats {
  voiceClips: number;
  texts: number;
  hazards: number;
  metres: number;
  friends: number;
}

export const EMPTY_STATS: DriverStats = { voiceClips: 0, texts: 0, hazards: 0, metres: 0, friends: 0 };

export function normaliseStats(input: Partial<DriverStats> | undefined | null): DriverStats {
  const n = (value: unknown) => (typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : 0);
  return {
    voiceClips: n(input?.voiceClips),
    texts: n(input?.texts),
    hazards: n(input?.hazards),
    metres: n(input?.metres),
    friends: n(input?.friends),
  };
}

export interface Milestone {
  id: string;
  label: string;
  detail: string;
  goal: number;
  read: (stats: DriverStats) => number;
}

export const MILESTONES: Milestone[] = [
  { id: "air", label: "On the air", detail: "Send 1 voice clip", goal: 1, read: (s) => s.voiceClips },
  { id: "regular", label: "Regular", detail: "Send 8 voice clips", goal: 8, read: (s) => s.voiceClips },
  { id: "night", label: "Night shift", detail: "Send 20 voice clips", goal: 20, read: (s) => s.voiceClips },
  { id: "chatter", label: "Chatter", detail: "Send 15 texts", goal: 15, read: (s) => s.texts },
  { id: "spotter", label: "Spotter", detail: "Drop 3 pins", goal: 3, read: (s) => s.hazards },
  { id: "lookout", label: "Lookout", detail: "Drop 8 pins", goal: 8, read: (s) => s.hazards },
  { id: "mate", label: "Convoy", detail: "1 accepted friend", goal: 1, read: (s) => s.friends },
  { id: "ten", label: "Ten kilometres", detail: "10 km with the app open", goal: 10_000, read: (s) => s.metres },
  { id: "fifty", label: "Long haul", detail: "50 km with the app open", goal: 50_000, read: (s) => s.metres },
];

export function milestoneMet(id: string | null, stats: DriverStats) {
  if (!id) return true;
  const milestone = MILESTONES.find((item) => item.id === id);
  if (!milestone) return false;
  return milestone.read(stats) >= milestone.goal;
}

export function milestoneLeft(id: string, stats: DriverStats) {
  const milestone = MILESTONES.find((item) => item.id === id);
  if (!milestone) return "";
  const current = Math.min(milestone.read(stats), milestone.goal);
  const unit = milestone.goal >= 1000 ? "km" : "";
  if (unit === "km") {
    return `${(current / 1000).toFixed(1)} / ${(milestone.goal / 1000).toFixed(0)} km`;
  }
  return `${Math.floor(current)} / ${milestone.goal}`;
}

export const DEFAULT_CAR: CarStyle = {
  body: "holden",
  paint: "#C4453C",
  wheel: "alloy",
  accessories: [],
};

const LEGACY_BODY: Record<string, CarBody> = {
  sedan: "holden",
  ute: "hilux",
  suv: "landcruiser",
  wagon: "falcon",
  coupe: "falcon",
  van: "patrol",
  truck: "hilux",
  rig: "landcruiser",
  bike: "holden",
};

export const BODIES: { id: CarBody; label: string; milestone: string | null }[] = [
  { id: "holden", label: "Holden sedan", milestone: null },
  { id: "falcon", label: "Falcon sedan", milestone: null },
  { id: "hilux", label: "Hilux", milestone: "spotter" },
  { id: "holdenute", label: "Holden ute", milestone: "chatter" },
  { id: "landcruiser", label: "LandCruiser", milestone: "ten" },
  { id: "patrol", label: "Patrol", milestone: "lookout" },
];

export const PAINTS: { id: string; hex: string; label: string; milestone: string | null }[] = [
  { id: "sand", hex: "#E4B15A", label: "Sand", milestone: null },
  { id: "ivory", hex: "#F4F0E6", label: "Ivory", milestone: null },
  { id: "red", hex: "#C4453C", label: "Signal", milestone: null },
  { id: "ink", hex: "#1C2430", label: "Ink", milestone: null },
  { id: "silver", hex: "#C5CDD6", label: "Silver", milestone: null },
  { id: "yellow", hex: "#F2C14E", label: "Hi-vis", milestone: "air" },
  { id: "forest", hex: "#2F6B4F", label: "Forest", milestone: "spotter" },
  { id: "midnight", hex: "#1E3A5F", label: "Midnight", milestone: "ten" },
  { id: "pearl", hex: "#D7E2EA", label: "Pearl", milestone: "regular" },
  { id: "bronze", hex: "#8C5A3C", label: "Bronze", milestone: "chatter" },
  { id: "slate", hex: "#5C6B7A", label: "Slate", milestone: "mate" },
  { id: "racing", hex: "#1F7A4D", label: "Racing", milestone: "fifty" },
  { id: "copper", hex: "#B5694A", label: "Copper", milestone: "night" },
];

export const WHEELS: { id: WheelStyle; label: string; milestone: string | null }[] = [
  { id: "steel", label: "Steel", milestone: null },
  { id: "alloy", label: "Alloy", milestone: null },
  { id: "mags", label: "Mags", milestone: "air" },
  { id: "black", label: "Black", milestone: "ten" },
  { id: "bronze", label: "Bronze", milestone: "lookout" },
  { id: "gold", label: "Gold", milestone: "fifty" },
];

export const ACCESSORIES: { id: string; label: string; blurb: string; milestone: string | null }[] = [
  { id: "tint", label: "Tint", blurb: "Dark glass", milestone: null },
  { id: "sunstrip", label: "Sun strip", blurb: "Band across the top of the screen", milestone: null },
  { id: "mags", label: "Mags", blurb: "Deep-dish wheels", milestone: "air" },
  { id: "bodykit", label: "Body kit", blurb: "Skirts, lip and flares", milestone: "regular" },
  { id: "spoiler", label: "Boot spoiler", blurb: "Lip on the rear", milestone: "chatter" },
  { id: "turbo", label: "Exposed turbo", blurb: "Scoop, cooler and dump pipe", milestone: "night" },
  { id: "bullbar", label: "Bull bar", blurb: "Steel bar on the nose", milestone: "spotter" },
  { id: "lightbar", label: "Light bar", blurb: "Lamp across the roof", milestone: "regular" },
  { id: "snorkel", label: "Snorkel", blurb: "Raised intake", milestone: "ten" },
  { id: "canopy", label: "Canopy", blurb: "Hard lid on the tray", milestone: "lookout" },
  { id: "antenna", label: "CB antenna", blurb: "Whip on the roof", milestone: null },
];

export function normaliseCar(input: Partial<CarStyle> | undefined): CarStyle {
  const knownAcc = new Set(ACCESSORIES.map((item) => item.id));
  const acc = Array.isArray(input?.accessories) ? input.accessories.filter((id) => knownAcc.has(id)) : DEFAULT_CAR.accessories;
  const rawBody = typeof input?.body === "string" ? input.body : "";
  const body = (BODIES.some((item) => item.id === rawBody) ? rawBody : LEGACY_BODY[rawBody] ?? DEFAULT_CAR.body) as CarBody;
  const wheel = WHEELS.some((item) => item.id === input?.wheel) ? (input!.wheel as WheelStyle) : DEFAULT_CAR.wheel;
  const paint = typeof input?.paint === "string" && /^#[0-9A-Fa-f]{6}$/.test(input.paint) ? input.paint : DEFAULT_CAR.paint;
  return { body, paint, wheel, accessories: acc };
}
