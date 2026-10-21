/**
 * Rubberducky garage catalog.
 *
 * SVG paths are repository-local and can be consumed by a web renderer, an
 * SVG transformer, or exported to a native asset pipeline. Coordinates use a
 * 1000 x 600 design canvas with the vehicle center at (500, 360).
 */

export type UnlockRule =
  | { kind: "free" }
  | { kind: "milestone"; milestone: string }
  | { kind: "package"; packageId: string }
  | { kind: "tier"; tierId: string };

export type PricingTier = {
  id: string;
  name: string;
  priceCents: number;
  billing: "free" | "one_time" | "monthly";
  tagline: string;
  unlocks: string[];
  criteria: UnlockRule[];
};

export const BODY_PAINT_PALETTE = [
  { id: "ion-cyan", label: "Ion Cyan", hex: "#32E6D3", accent: "#103D59", finish: "gloss" },
  { id: "plasma-coral", label: "Plasma Coral", hex: "#FF6F61", accent: "#5B1F4B", finish: "gloss" },
  { id: "quantum-violet", label: "Quantum Violet", hex: "#8C6CFF", accent: "#21144F", finish: "satin" },
  { id: "solar-yellow", label: "Solar Yellow", hex: "#FFD447", accent: "#6C3B17", finish: "gloss" },
  { id: "neon-lime", label: "Neon Lime", hex: "#B9F227", accent: "#254C3B", finish: "pearl" },
  { id: "orbit-blue", label: "Orbit Blue", hex: "#287BFF", accent: "#10254B", finish: "metallic" },
  { id: "carbon-black", label: "Carbon Black", hex: "#202633", accent: "#6CE8FF", finish: "matte" },
  { id: "moon-silver", label: "Moon Silver", hex: "#C7D1D9", accent: "#526A7A", finish: "metallic" },
  { id: "mars-orange", label: "Mars Orange", hex: "#E97832", accent: "#402538", finish: "satin" },
  { id: "polar-white", label: "Polar White", hex: "#F5F8F5", accent: "#9B59FF", finish: "pearl" },
] as const;

export const VEHICLE_ASSETS = {
  compactCar: { label: "Compact Car", svg: "assets/garage/vehicles/compact-car.svg", dimensions: { width: 430, height: 230, wheelbase: 275 }, unlock: { kind: "free" } as UnlockRule },
  adventureVan: { label: "Adventure Van", svg: "assets/garage/vehicles/adventure-van.svg", dimensions: { width: 520, height: 300, wheelbase: 340 }, unlock: { kind: "milestone", milestone: "spotter" } as UnlockRule },
  scooter: { label: "Electric Scooter", svg: "assets/garage/vehicles/scooter.svg", dimensions: { width: 330, height: 260, wheelbase: 220 }, unlock: { kind: "milestone", milestone: "air" } as UnlockRule },
  monsterTruck: { label: "Monster Truck", svg: "assets/garage/vehicles/monster-truck.svg", dimensions: { width: 560, height: 360, wheelbase: 330 }, unlock: { kind: "milestone", milestone: "lookout" } as UnlockRule },
  sciFiHoverCoupe: { label: "Sci-Fi Hover Coupe", svg: "assets/garage/vehicles/sci-fi-hover-coupe.svg", dimensions: { width: 480, height: 250, wheelbase: 0 }, unlock: { kind: "package", packageId: "sport" } as UnlockRule },
  sciFiReconRover: { label: "Sci-Fi Recon Rover", svg: "assets/garage/vehicles/sci-fi-recon-rover.svg", dimensions: { width: 540, height: 330, wheelbase: 345 }, unlock: { kind: "package", packageId: "explorer" } as UnlockRule },
  sciFiOrbitalBike: { label: "Sci-Fi Orbital Bike", svg: "assets/garage/vehicles/sci-fi-orbital-bike.svg", dimensions: { width: 420, height: 240, wheelbase: 0 }, unlock: { kind: "package", packageId: "explorer" } as UnlockRule },
  sciFiUtilityShuttle: { label: "Sci-Fi Utility Shuttle", svg: "assets/garage/vehicles/sci-fi-utility-shuttle.svg", dimensions: { width: 520, height: 300, wheelbase: 260 }, unlock: { kind: "package", packageId: "off-road" } as UnlockRule },
} as const;

export const ACCESSORY_ASSETS = {
  roofCargoPod: { label: "Roof Cargo Pod", svg: "assets/garage/accessories/roof-cargo-pod.svg", slots: ["roof"], unlock: { kind: "milestone", milestone: "mate" } as UnlockRule },
  holoSpoiler: { label: "Holographic Spoiler", svg: "assets/garage/accessories/holo-spoiler.svg", slots: ["rear"], unlock: { kind: "package", packageId: "sport" } as UnlockRule },
  plasmaBumper: { label: "Plasma Bumper", svg: "assets/garage/accessories/plasma-bumper.svg", slots: ["front"], unlock: { kind: "tier", tierId: "road-crew" } as UnlockRule },
  sideEnergyBlade: { label: "Side Energy Blade", svg: "assets/garage/accessories/side-energy-blade.svg", slots: ["sideLeft", "sideRight"], unlock: { kind: "package", packageId: "explorer" } as UnlockRule },
  neonUnderglow: { label: "Neon Underglow", svg: "assets/garage/accessories/neon-underglow.svg", slots: ["underbody"], unlock: { kind: "milestone", milestone: "regular" } as UnlockRule },
  sensorAntenna: { label: "Sensor Antenna", svg: "assets/garage/accessories/sensor-antenna.svg", slots: ["roof"], unlock: { kind: "package", packageId: "explorer" } as UnlockRule },
  droneDock: { label: "Scouting Drone Dock", svg: "assets/garage/accessories/drone-dock.svg", slots: ["roof", "rear"], unlock: { kind: "tier", tierId: "signal-plus" } as UnlockRule },
  terrainSkidPlate: { label: "Terrain Skid Plate", svg: "assets/garage/accessories/terrain-skid-plate.svg", slots: ["underbody"], unlock: { kind: "package", packageId: "off-road" } as UnlockRule },
} as const;

export const PACKAGE_TIERS: PricingTier[] = [
  {
    id: "starter",
    name: "Starter Garage",
    priceCents: 0,
    billing: "free",
    tagline: "The core Rubberducky garage, earned by driving and joining in.",
    unlocks: ["compactCar", "scooter", "ion-cyan", "polar-white", "roofCargoPod"],
    criteria: [{ kind: "free" }],
  },
  {
    id: "road-crew",
    name: "Road Crew",
    priceCents: 499,
    billing: "one_time",
    tagline: "Sport styling, premium paint finishes, and the first high-tech kit.",
    unlocks: ["sport", "sciFiHoverCoupe", "plasma-coral", "quantum-violet", "plasmaBumper", "holoSpoiler"],
    criteria: [{ kind: "tier", tierId: "road-crew" }],
  },
  {
    id: "trail-pass",
    name: "Trail Pass",
    priceCents: 699,
    billing: "one_time",
    tagline: "Rugged off-road bodies and utility accessories for convoy adventures.",
    unlocks: ["off-road", "monsterTruck", "sciFiUtilityShuttle", "neon-lime", "terrainSkidPlate"],
    criteria: [{ kind: "tier", tierId: "trail-pass" }],
  },
  {
    id: "signal-plus",
    name: "Signal Plus",
    priceCents: 399,
    billing: "monthly",
    tagline: "The complete sci-fi garage, rotating drops, and advanced layering parts.",
    unlocks: ["explorer", "sciFiReconRover", "sciFiOrbitalBike", "orbit-blue", "droneDock", "sideEnergyBlade"],
    criteria: [{ kind: "tier", tierId: "signal-plus" }],
  },
];

export const VEHICLE_PACKAGES = {
  sport: {
    label: "Sport Package",
    tierId: "road-crew",
    vehicles: ["compactCar", "sciFiHoverCoupe"],
    accessories: ["holoSpoiler", "plasmaBumper", "neonUnderglow", "sideEnergyBlade"],
    defaultPaint: "plasma-coral",
    unlockCriteria: "Buy Road Crew or complete the Regular milestone for the free neon accent.",
  },
  "off-road": {
    label: "Off-Road Package",
    tierId: "trail-pass",
    vehicles: ["monsterTruck", "adventureVan", "sciFiUtilityShuttle"],
    accessories: ["roofCargoPod", "terrainSkidPlate", "sensorAntenna", "plasmaBumper"],
    defaultPaint: "neon-lime",
    unlockCriteria: "Buy Trail Pass; Adventure Van and basic cargo parts remain milestone-unlockable.",
  },
  explorer: {
    label: "Space Explorer Package",
    tierId: "signal-plus",
    vehicles: ["sciFiHoverCoupe", "sciFiReconRover", "sciFiOrbitalBike"],
    accessories: ["droneDock", "sensorAntenna", "neonUnderglow", "sideEnergyBlade"],
    defaultPaint: "orbit-blue",
    unlockCriteria: "Subscribe to Signal Plus; players can preview all parts before subscribing.",
  },
  commuter: {
    label: "City Commuter Package",
    tierId: "starter",
    vehicles: ["compactCar", "scooter", "adventureVan"],
    accessories: ["roofCargoPod", "neonUnderglow"],
    defaultPaint: "ion-cyan",
    unlockCriteria: "Free. Earn additional colors and accessories through the existing milestones.",
  },
} as const;

export const ATTACHMENT_OFFSETS = {
  compactCar: { roof: [500, 256], front: [696, 348], rear: [310, 345], sideLeft: [462, 338], sideRight: [542, 338], underbody: [500, 452] },
  adventureVan: { roof: [490, 218], front: [740, 340], rear: [265, 340], sideLeft: [428, 330], sideRight: [576, 330], underbody: [500, 470] },
  sciFiHoverCoupe: { roof: [500, 232], front: [715, 330], rear: [288, 332], sideLeft: [448, 330], sideRight: [552, 330], underbody: [500, 438] },
  sciFiReconRover: { roof: [495, 200], front: [750, 316], rear: [255, 316], sideLeft: [410, 314], sideRight: [590, 314], underbody: [500, 475] },
} as const;

export const RUBBERDUCKY_CUSTOMIZATION_VERSION = "1.1.0";
