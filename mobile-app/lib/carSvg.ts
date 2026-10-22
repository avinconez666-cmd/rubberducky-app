import type { CarBody, CarStyle, WheelStyle } from "@/constants/garage";
import { normaliseCar } from "@/constants/garage";

function shade(hex: string, amount: number) {
  const raw = hex.replace("#", "");
  const n = Number.parseInt(raw.length === 3 ? raw.split("").map((c) => c + c).join("") : raw, 16);
  if (Number.isNaN(n)) return hex;
  const mix = (channel: number) => Math.max(0, Math.min(255, channel + amount));
  return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => mix(v).toString(16).padStart(2, "0")).join("")}`;
}

type Spec = {
  body: string;
  glass: string;
  wheels: { x: number; y: number; r: number }[];
  nose: number;
  roof: number;
  hood: number;
  tray?: string;
  cabBack: number;
};

const SPECS: Record<CarBody, Spec> = {
  holden: {
    body: "M46 116 C42 102 58 92 86 88 C108 66 138 48 176 46 L214 46 C246 48 268 66 292 86 C312 98 330 108 338 116 C344 126 332 136 312 136 L68 136 C50 136 42 128 46 116 Z",
    glass: "M124 88 C140 60 166 50 196 50 L214 52 C236 62 254 78 266 90 Z",
    wheels: [{ x: 104, y: 132, r: 18 }, { x: 268, y: 132, r: 18 }],
    nose: 336, roof: 46, hood: 300, cabBack: 120,
  },
  falcon: {
    body: "M38 118 C34 104 54 92 84 88 C102 70 124 54 156 48 L198 46 C240 46 272 64 304 86 C322 98 340 108 348 118 C352 128 340 138 320 138 L62 138 C44 138 36 128 38 118 Z",
    glass: "M112 90 C126 64 148 52 176 50 L196 50 C214 58 228 74 238 92 Z",
    wheels: [{ x: 100, y: 134, r: 18 }, { x: 286, y: 134, r: 18 }],
    nose: 346, roof: 46, hood: 318, cabBack: 108,
  },
  hilux: {
    body: "M36 108 C34 96 46 90 62 90 L158 86 L164 64 C176 44 204 38 236 42 C268 48 290 70 308 92 C322 106 336 114 340 122 C344 132 332 140 314 140 L54 140 C40 140 34 126 36 108 Z",
    glass: "M176 104 C192 72 216 56 248 56 C270 64 288 82 300 104 Z",
    wheels: [{ x: 92, y: 136, r: 20 }, { x: 274, y: 136, r: 20 }],
    nose: 338, roof: 42, hood: 300, cabBack: 168,
    tray: "M48 96 H156 V124 H52 Z",
  },
  holdenute: {
    body: "M32 112 C30 100 42 94 58 94 L148 90 L156 70 C168 48 196 40 228 44 C258 50 280 70 298 92 C312 106 326 116 332 124 C336 134 322 142 304 142 L50 142 C36 142 30 128 32 112 Z",
    glass: "M168 108 C182 76 206 58 234 58 C252 66 268 84 278 108 Z",
    wheels: [{ x: 86, y: 138, r: 20 }, { x: 262, y: 138, r: 20 }],
    nose: 330, roof: 44, hood: 292, cabBack: 150,
    tray: "M42 98 H146 V128 H46 Z",
  },
  landcruiser: {
    body: "M40 118 C36 100 52 88 74 84 L88 58 C96 40 118 32 148 32 L236 32 C268 32 290 46 304 70 C318 92 330 108 336 118 C342 132 326 142 306 142 L64 142 C46 142 38 130 40 118 Z",
    glass: "M104 86 L116 46 H168 L160 86 Z M176 86 L184 46 H230 C250 52 266 68 276 86 Z",
    wheels: [{ x: 102, y: 138, r: 22 }, { x: 270, y: 138, r: 22 }],
    nose: 334, roof: 32, hood: 300, cabBack: 96,
  },
  patrol: {
    body: "M44 120 C40 102 56 90 78 86 L92 52 C100 36 122 28 154 28 L248 30 C278 32 298 48 310 72 C322 94 332 110 336 120 C342 134 326 144 306 144 L68 144 C50 144 42 132 44 120 Z",
    glass: "M108 86 L120 42 H176 L166 86 Z M184 86 L192 42 H240 C258 50 274 66 284 86 Z",
    wheels: [{ x: 108, y: 140, r: 22 }, { x: 276, y: 140, r: 22 }],
    nose: 334, roof: 28, hood: 304, cabBack: 100,
  },
};

function wheel(x: number, y: number, r: number, style: WheelStyle, mags: boolean) {
  const rim = style === "gold" ? "#E4B15A" : style === "bronze" ? "#A86B3C" : style === "black" ? "#2A303C" : style === "steel" && !mags ? "#8E99A8" : "#E7EDF4";
  const spokes = mags || style === "mags" ? [0, 45, 90, 135, 180, 225, 270, 315] : [0, 72, 144, 216, 288];
  const lip = mags || style === "mags" ? `<circle cx="${x}" cy="${y}" r="${r * 0.72}" fill="none" stroke="${rim}" stroke-width="3"/>` : "";
  const lines = spokes.map((deg) => {
    const a = ((deg - 90) * Math.PI) / 180;
    return `<line x1="${x + Math.cos(a) * r * 0.16}" y1="${y + Math.sin(a) * r * 0.16}" x2="${x + Math.cos(a) * r * 0.48}" y2="${y + Math.sin(a) * r * 0.48}" stroke="${shade(rim, -30)}" stroke-width="${mags ? 2.2 : 1.6}" stroke-linecap="round"/>`;
  }).join("");
  return `<g class="wheel" style="transform-box:fill-box;transform-origin:center">
    <circle cx="${x}" cy="${y}" r="${r}" fill="#161A22"/>
    <circle cx="${x}" cy="${y}" r="${r * 0.78}" fill="#2A303A"/>
    ${lip}
    <circle cx="${x}" cy="${y}" r="${r * 0.5}" fill="${rim}"/>
    ${lines}
    <circle cx="${x}" cy="${y}" r="${r * 0.14}" fill="#141820"/>
  </g>`;
}

export function carSvg(input: CarStyle, id = "car") {
  const car = normaliseCar(input);
  const spec = SPECS[car.body];
  const on = new Set(car.accessories);
  const mags = on.has("mags") || car.wheel === "mags";
  const tint = on.has("tint");
  const safe = id.replace(/[^a-z0-9]/gi, "") || "car";
  const light = shade(car.paint, 42);
  const dark = shade(car.paint, -38);
  const kit = on.has("bodykit")
    ? `<path d="M70 128 H300" stroke="${dark}" stroke-width="8" stroke-linecap="round"/>
       <path d="M${spec.nose - 8} 118 h16 l-4 10 h-10 z" fill="${dark}"/>
       <path d="M48 108 h18 l-4 12 H46 z" fill="${dark}"/>`
    : "";
  const turbo = on.has("turbo")
    ? `<path d="M${spec.hood - 28} ${spec.roof + 28} q14 -16 28 0" fill="none" stroke="#C5CDD6" stroke-width="4"/>
       <circle cx="${spec.nose - 16}" cy="112" r="7" fill="#9AA6B5" stroke="#5C6774" stroke-width="2"/>
       <circle cx="${spec.nose - 16}" cy="112" r="3" fill="#2A313C"/>
       <path d="M${spec.cabBack - 10} 126 h22" stroke="#8C93A1" stroke-width="4" stroke-linecap="round"/>`
    : "";
  const canopy = on.has("canopy") && spec.tray
    ? `<path d="M46 96 L62 64 H150 L164 96 Z" fill="${shade(car.paint, -18)}"/>`
    : "";
  const bull = on.has("bullbar")
    ? `<g stroke="#C5CDD6" stroke-width="3" fill="none"><path d="M${spec.nose - 4} 96 v28"/><path d="M${spec.nose - 14} 104 h16"/><path d="M${spec.nose - 14} 116 h16"/></g>`
    : "";
  const snorkel = on.has("snorkel")
    ? `<path d="M${spec.cabBack + 8} 100 V${spec.roof + 6} q0 -12 12 -12" fill="none" stroke="#222833" stroke-width="5" stroke-linecap="round"/>`
    : "";
  const lights = on.has("lightbar")
    ? `<rect x="${spec.cabBack + 20}" y="${spec.roof - 8}" width="70" height="7" rx="2" fill="#F2C14E"/><rect x="${spec.cabBack + 26}" y="${spec.roof - 6}" width="14" height="3" fill="#FFF6D0"/>`
    : "";
  const spoiler = on.has("spoiler") && !spec.tray
    ? `<path d="M36 78 H78 L70 90 H44 Z" fill="#1C2430"/>`
    : "";
  const antenna = on.has("antenna")
    ? `<line x1="${spec.cabBack + 8}" y1="${spec.roof + 4}" x2="${spec.cabBack - 6}" y2="${Math.max(8, spec.roof - 28)}" stroke="#E6EBF2" stroke-width="2"/>`
    : "";
  const strip = on.has("sunstrip")
    ? `<path d="${spec.glass}" fill="#1C2430" opacity="0.45" transform="translate(0 2) scale(1 0.28)"/>`
    : "";
  const glassFill = tint ? "#1A222C" : `url(#${safe}g)`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 168" width="360" height="168">
    <defs>
      <linearGradient id="${safe}p" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${light}"/>
        <stop offset="0.45" stop-color="${car.paint}"/>
        <stop offset="1" stop-color="${dark}"/>
      </linearGradient>
      <linearGradient id="${safe}g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#F4FBFF"/>
        <stop offset="1" stop-color="#7EA9C0"/>
      </linearGradient>
    </defs>
    <ellipse cx="180" cy="156" rx="120" ry="8" fill="#000" opacity="0.22"/>
    <path d="${spec.body}" fill="url(#${safe}p)"/>
    ${spec.tray ? `<path d="${spec.tray}" fill="#000" opacity="0.16"/>` : ""}
    ${kit}
    <path d="${spec.glass}" fill="${glassFill}"/>
    ${strip}
    <ellipse cx="${spec.nose - 8}" cy="112" rx="8" ry="5" fill="#FFF6D0"/>
    <ellipse cx="54" cy="114" rx="6" ry="4" fill="#C4453C"/>
    ${canopy}${turbo}${bull}${snorkel}${lights}${spoiler}${antenna}
    ${spec.wheels.map((w) => wheel(w.x, w.y, w.r, car.wheel, mags)).join("")}
  </svg>`;
}
