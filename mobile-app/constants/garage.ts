export type CarBody = "sedan" | "ute" | "suv" | "truck" | "bike" | "van";
export type WheelStyle = "steel" | "alloy" | "black" | "gold";

export interface CarStyle {
  body: CarBody;
  paint: string;
  wheel: WheelStyle;
  accessories: string[];
}

export const DEFAULT_CAR: CarStyle = {
  body: "sedan",
  paint: "#F59E0B",
  wheel: "alloy",
  accessories: ["antenna"],
};

export const BODIES: { id: CarBody; label: string }[] = [
  { id: "sedan", label: "Sedan" },
  { id: "ute", label: "Ute" },
  { id: "suv", label: "SUV" },
  { id: "truck", label: "Truck" },
  { id: "van", label: "Van" },
  { id: "bike", label: "Bike" },
];

export const PAINTS = [
  { id: "amber", hex: "#F59E0B", label: "Amber" },
  { id: "white", hex: "#F8FAFC", label: "White" },
  { id: "navy", hex: "#1E3A8A", label: "Navy" },
  { id: "red", hex: "#DC2626", label: "Red" },
  { id: "green", hex: "#15803D", label: "Green" },
  { id: "black", hex: "#0F172A", label: "Black" },
  { id: "silver", hex: "#CBD5E1", label: "Silver" },
  { id: "bronze", hex: "#B45309", label: "Bronze" },
];

export const WHEELS: { id: WheelStyle; label: string }[] = [
  { id: "steel", label: "Steel" },
  { id: "alloy", label: "Alloy" },
  { id: "black", label: "Black" },
  { id: "gold", label: "Gold" },
];

export const ACCESSORIES: { id: string; label: string; blurb: string }[] = [
  { id: "antenna", label: "CB antenna", blurb: "The whip that says you are on the radio" },
  { id: "bullbar", label: "Bull bar", blurb: "Country-road front bar" },
  { id: "lightbar", label: "Light bar", blurb: "Roof lamp for the night haul" },
  { id: "snorkel", label: "Snorkel", blurb: "High intake, looks the part" },
  { id: "canopy", label: "Canopy", blurb: "Covered tray" },
  { id: "roofpod", label: "Roof pod", blurb: "Low cargo box" },
  { id: "spots", label: "Spot lights", blurb: "Twin lamps on the bar" },
  { id: "checker", label: "Bonnet stripe", blurb: "A single racing stripe" },
];

export function normaliseCar(input: Partial<CarStyle> | undefined): CarStyle {
  const acc = Array.isArray(input?.accessories) ? input.accessories.filter((id) => ACCESSORIES.some((a) => a.id === id)) : DEFAULT_CAR.accessories;
  const body = BODIES.some((b) => b.id === input?.body) ? (input!.body as CarBody) : DEFAULT_CAR.body;
  const wheel = WHEELS.some((w) => w.id === input?.wheel) ? (input!.wheel as WheelStyle) : DEFAULT_CAR.wheel;
  const paint = typeof input?.paint === "string" && /^#[0-9A-Fa-f]{6}$/.test(input.paint) ? input.paint : DEFAULT_CAR.paint;
  return { body, paint, wheel, accessories: acc };
}
