export type CarBody = "sedan" | "ute" | "suv" | "wagon" | "coupe" | "van" | "truck" | "rig" | "bike";
export type WheelStyle = "steel" | "alloy" | "black" | "gold" | "bronze" | "whitewall";

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
  body: "sedan",
  paint: "#E4B15A",
  wheel: "alloy",
  accessories: ["antenna"],
};

export const BODIES: { id: CarBody; label: string; milestone: string | null }[] = [
  { id: "sedan", label: "Sedan", milestone: null },
  { id: "ute", label: "Ute", milestone: null },
  { id: "suv", label: "SUV", milestone: null },
  { id: "wagon", label: "Wagon", milestone: "chatter" },
  { id: "coupe", label: "Coupe", milestone: "regular" },
  { id: "van", label: "Van", milestone: "spotter" },
  { id: "truck", label: "Truck", milestone: "lookout" },
  { id: "rig", label: "4x4", milestone: "ten" },
  { id: "bike", label: "Bike", milestone: "air" },
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
  { id: "black", label: "Black", milestone: "ten" },
  { id: "bronze", label: "Bronze", milestone: "lookout" },
  { id: "whitewall", label: "Whitewall", milestone: "chatter" },
  { id: "gold", label: "Gold", milestone: "fifty" },
];

export const ACCESSORIES: { id: string; label: string; blurb: string; milestone: string | null }[] = [
  { id: "antenna", label: "CB antenna", blurb: "The whip on the roof", milestone: null },
  { id: "sunstrip", label: "Sun strip", blurb: "Dark band on the glass", milestone: null },
  { id: "spots", label: "Spot lights", blurb: "Twin lamps on the nose", milestone: "air" },
  { id: "stripe", label: "Side stripe", blurb: "One clean line along the body", milestone: "chatter" },
  { id: "bullbar", label: "Bull bar", blurb: "Country-road front bar", milestone: "spotter" },
  { id: "lightbar", label: "Light bar", blurb: "Lamp across the roof", milestone: "regular" },
  { id: "snorkel", label: "Snorkel", blurb: "High intake up the pillar", milestone: "ten" },
  { id: "canopy", label: "Canopy", blurb: "Hard lid on the tray", milestone: "lookout" },
  { id: "roofpod", label: "Roof pod", blurb: "Low cargo box", milestone: "mate" },
  { id: "spoiler", label: "Spoiler", blurb: "Lip on the rear", milestone: "regular" },
  { id: "exhaust", label: "Side exhaust", blurb: "Tip ahead of the rear wheel", milestone: "fifty" },
  { id: "mudflaps", label: "Mud flaps", blurb: "Flaps behind both wheels", milestone: "ten" },
  { id: "rack", label: "Roof rack", blurb: "Two bars over the cabin", milestone: "lookout" },
  { id: "winch", label: "Winch", blurb: "Drum in the bull bar", milestone: "fifty" },
  { id: "beacon", label: "Beacon", blurb: "Amber lamp on the roof", milestone: "night" },
  { id: "flags", label: "Whip flags", blurb: "Two short flags at the back", milestone: "mate" },
];

export function normaliseCar(input: Partial<CarStyle> | undefined): CarStyle {
  const knownAcc = new Set(ACCESSORIES.map((item) => item.id));
  const acc = Array.isArray(input?.accessories) ? input.accessories.filter((id) => knownAcc.has(id)) : DEFAULT_CAR.accessories;
  const body = BODIES.some((item) => item.id === input?.body) ? (input!.body as CarBody) : DEFAULT_CAR.body;
  const wheel = WHEELS.some((item) => item.id === input?.wheel) ? (input!.wheel as WheelStyle) : DEFAULT_CAR.wheel;
  const paint = typeof input?.paint === "string" && /^#[0-9A-Fa-f]{6}$/.test(input.paint) ? input.paint : DEFAULT_CAR.paint;
  return { body, paint, wheel, accessories: acc };
}
