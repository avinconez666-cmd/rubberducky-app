import React from "react";
import { Image, StyleSheet, View } from "react-native";
import Svg, { Circle, Ellipse, G, Line, Path, Rect } from "react-native-svg";
import type { CarBody, CarStyle, WheelStyle } from "@/constants/garage";

function shade(hex: string, amount: number) {
  const raw = hex.replace("#", "");
  const n = Number.parseInt(raw.length === 3 ? raw.split("").map((c) => c + c).join("") : raw, 16);
  if (Number.isNaN(n)) return hex;
  const mix = (channel: number) => Math.max(0, Math.min(255, channel + amount));
  const r = mix((n >> 16) & 255);
  const g = mix((n >> 8) & 255);
  const b = mix(n & 255);
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

const RENDERED_VEHICLES: Partial<Record<CarBody, number>> = {
  sedan: require("@/assets/garage/renders/cartoon_compact_car.png"),
  ute: require("@/assets/garage/renders/cartoon_adventure_van.png"),
  suv: require("@/assets/garage/renders/cartoon_monster_truck.png"),
  wagon: require("@/assets/garage/renders/cartoon_adventure_van.png"),
  coupe: require("@/assets/garage/renders/cartoon_compact_car.png"),
  van: require("@/assets/garage/renders/cartoon_adventure_van.png"),
  truck: require("@/assets/garage/renders/cartoon_monster_truck.png"),
  rig: require("@/assets/garage/renders/cartoon_monster_truck.png"),
  bike: require("@/assets/garage/renders/cartoon_scooter.png"),
};

const RENDERED_ACCESSORIES: Record<string, number> = {
  roofpod: require("@/assets/garage/renders/accessory_roof_cargo_pod.png"),
  spoiler: require("@/assets/garage/renders/accessory_holo_spoiler.png"),
  bullbar: require("@/assets/garage/renders/accessory_plasma_bumper.png"),
  lightbar: require("@/assets/garage/renders/accessory_neon_underglow.png"),
  antenna: require("@/assets/garage/renders/accessory_sensor_antenna.png"),
  drone: require("@/assets/garage/renders/accessory_drone_dock.png"),
};

const renderedStyles = StyleSheet.create({
  stage: { position: "relative", alignItems: "center", justifyContent: "center" },
  vehicle: { width: "100%", height: "100%" },
  accessory: { position: "absolute" },
});

function RenderedVehicle({ body, accessories, width }: { body: CarBody; accessories: string[]; width: number }) {
  const vehicleSource = RENDERED_VEHICLES[body];
  if (!vehicleSource) return null;
  const renderedAccessories = accessories.filter((id) => RENDERED_ACCESSORIES[id]);
  return (
    <View style={[renderedStyles.stage, { width, height: width * 0.58 }]}>
      <Image source={vehicleSource} style={renderedStyles.vehicle} resizeMode="contain" />
      {renderedAccessories.map((id, index) => (
        <Image
          key={`${id}-${index}`}
          source={RENDERED_ACCESSORIES[id]}
          style={[renderedStyles.accessory, { width: width * 0.26, height: width * 0.26, left: width * (0.37 + index * 0.035), top: width * (0.04 + (index % 2) * 0.035) }]}
          resizeMode="contain"
        />
      ))}
    </View>
  );
}

function Wheel({ x, y, r, style }: { x: number; y: number; r: number; style: WheelStyle }) {
  const rim =
    style === "gold" ? "#E4B15A" :
    style === "black" ? "#232833" :
    style === "bronze" ? "#A86B3C" :
    style === "whitewall" ? "#D5DCE6" :
    style === "steel" ? "#A9B4C2" : "#F2F5F8";
  return (
    <G>
      <Circle cx={x} cy={y} r={r} fill="#171A21" />
      {style === "whitewall" && <Circle cx={x} cy={y} r={r * 0.82} fill="none" stroke="#F4F0E6" strokeWidth={3} />}
      <Circle cx={x} cy={y} r={r * 0.58} fill={rim} />
      <Circle cx={x} cy={y} r={r * 0.16} fill="#2C3340" />
      {[0, 45, 90, 135].map((deg) => {
        const a = (deg * Math.PI) / 180;
        return (
          <Line
            key={deg}
            x1={x + Math.cos(a) * r * 0.2}
            y1={y + Math.sin(a) * r * 0.2}
            x2={x + Math.cos(a) * r * 0.5}
            y2={y + Math.sin(a) * r * 0.5}
            stroke="#2C3340"
            strokeWidth={2}
          />
        );
      })}
    </G>
  );
}

function Body({ body, paint }: { body: CarBody; paint: string }) {
  const dark = shade(paint, -48);
  const deep = shade(paint, -28);
  const glass = "#B7DCEA";
  if (body === "ute") {
    return (
      <G>
        <Rect x="34" y="78" width="112" height="52" rx="14" fill={paint} />
        <Path d="M86 78 L108 46 Q128 34 146 40 L146 78 Z" fill={paint} />
        <Path d="M98 74 L114 50 Q128 42 140 48 L142 74 Z" fill={glass} />
        <Rect x="146" y="90" width="176" height="38" rx="7" fill={deep} />
        <Rect x="152" y="84" width="164" height="8" rx="3" fill={dark} />
        <Rect x="300" y="98" width="14" height="10" rx="2" fill="#F4F0E6" />
        <Rect x="40" y="100" width="10" height="8" rx="2" fill="#C4453C" />
      </G>
    );
  }
  if (body === "suv") {
    return (
      <G>
        <Rect x="40" y="86" width="276" height="46" rx="18" fill={paint} />
        <Rect x="72" y="42" width="196" height="54" rx="16" fill={paint} />
        <Rect x="92" y="52" width="72" height="32" rx="6" fill={glass} />
        <Rect x="176" y="52" width="72" height="32" rx="6" fill={glass} />
        <Rect x="292" y="98" width="16" height="12" rx="3" fill="#F4F0E6" />
        <Rect x="48" y="100" width="12" height="10" rx="2" fill="#C4453C" />
      </G>
    );
  }
  if (body === "wagon") {
    return (
      <G>
        <Rect x="42" y="92" width="270" height="40" rx="16" fill={paint} />
        <Path d="M64 92 L86 50 Q108 36 250 42 L286 92 Z" fill={paint} />
        <Rect x="100" y="54" width="64" height="30" rx="5" fill={glass} />
        <Rect x="174" y="54" width="78" height="30" rx="5" fill={glass} />
        <Rect x="292" y="102" width="14" height="10" rx="2" fill="#F4F0E6" />
        <Rect x="50" y="104" width="10" height="8" rx="2" fill="#C4453C" />
      </G>
    );
  }
  if (body === "coupe") {
    return (
      <G>
        <Rect x="36" y="102" width="286" height="30" rx="15" fill={paint} />
        <Path d="M64 102 L108 68 Q142 46 184 54 L214 102 Z" fill={paint} />
        <Path d="M96 98 L122 72 Q148 56 176 64 L196 98 Z" fill={glass} />
        <Rect x="300" y="108" width="16" height="8" rx="2" fill="#F4F0E6" />
        <Rect x="44" y="108" width="10" height="8" rx="2" fill="#C4453C" />
      </G>
    );
  }
  if (body === "van") {
    return (
      <G>
        <Rect x="36" y="40" width="286" height="92" rx="18" fill={paint} />
        <Path d="M250 52 L310 78 L310 118 L250 118 Z" fill={glass} />
        <Rect x="56" y="56" width="46" height="30" rx="4" fill={glass} />
        <Rect x="114" y="56" width="46" height="30" rx="4" fill={glass} />
        <Rect x="172" y="56" width="46" height="30" rx="4" fill={glass} />
        <Rect x="56" y="100" width="150" height="6" rx="2" fill={dark} opacity={0.45} />
      </G>
    );
  }
  if (body === "truck") {
    return (
      <G>
        <Rect x="24" y="58" width="112" height="74" rx="12" fill={paint} />
        <Path d="M88 58 L116 30 Q138 18 150 36 L140 58 Z" fill={paint} />
        <Path d="M100 56 L120 36 Q136 26 146 40 L138 56 Z" fill={glass} />
        <Rect x="146" y="34" width="186" height="96" rx="8" fill={deep} />
        <Rect x="162" y="48" width="70" height="26" rx="3" fill={shade(paint, 36)} opacity={0.55} />
        <Rect x="246" y="48" width="70" height="26" rx="3" fill={shade(paint, 36)} opacity={0.35} />
      </G>
    );
  }
  if (body === "rig") {
    return (
      <G>
        <Rect x="36" y="74" width="108" height="46" rx="8" fill={paint} />
        <Rect x="46" y="44" width="84" height="38" rx="8" fill={paint} />
        <Rect x="58" y="52" width="40" height="22" rx="3" fill={glass} />
        <Rect x="154" y="82" width="168" height="36" rx="5" fill={deep} />
        <Rect x="160" y="76" width="156" height="8" rx="2" fill={dark} />
        <Rect x="300" y="90" width="14" height="10" rx="2" fill="#F4F0E6" />
      </G>
    );
  }
  if (body === "bike") {
    return (
      <G>
        <Path d="M96 124 L150 78 L214 124" fill="none" stroke={deep} strokeWidth={7} strokeLinecap="round" />
        <Path d="M150 78 L196 78 L230 108" fill="none" stroke={deep} strokeWidth={6} strokeLinecap="round" />
        <Ellipse cx="168" cy="74" rx="30" ry="14" fill={paint} />
        <Rect x="146" y="86" width="40" height="8" rx="3" fill="#242933" />
        <Path d="M206 74 L236 50" stroke="#E6EBF2" strokeWidth={4} strokeLinecap="round" />
        <Circle cx="238" cy="48" r="5" fill="#F4F0E6" />
        <Path d="M118 124 L92 124" stroke="#8C93A1" strokeWidth={4} strokeLinecap="round" />
      </G>
    );
  }
  return (
    <G>
      <Rect x="46" y="96" width="250" height="36" rx="16" fill={paint} />
      <Path d="M118 96 L150 58 Q172 44 210 48 L248 78 Q258 96 258 96 Z" fill={paint} />
      <Path d="M132 92 L156 62 Q174 50 206 54 L232 82 Z" fill={glass} />
      <Rect x="274" y="104" width="16" height="10" rx="3" fill="#F4F0E6" />
      <Rect x="54" y="106" width="12" height="8" rx="2" fill="#C4453C" />
    </G>
  );
}

const WHEELS: Record<CarBody, { x: number; y: number; r: number }[]> = {
  sedan: [{ x: 96, y: 128, r: 20 }, { x: 250, y: 128, r: 20 }],
  ute: [{ x: 78, y: 128, r: 22 }, { x: 268, y: 128, r: 22 }],
  suv: [{ x: 92, y: 128, r: 24 }, { x: 262, y: 128, r: 24 }],
  wagon: [{ x: 96, y: 128, r: 20 }, { x: 258, y: 128, r: 20 }],
  coupe: [{ x: 96, y: 128, r: 20 }, { x: 262, y: 128, r: 20 }],
  van: [{ x: 96, y: 130, r: 20 }, { x: 270, y: 130, r: 20 }],
  truck: [{ x: 78, y: 132, r: 24 }, { x: 230, y: 132, r: 24 }, { x: 286, y: 132, r: 24 }],
  rig: [{ x: 78, y: 124, r: 28 }, { x: 250, y: 124, r: 28 }],
  bike: [{ x: 96, y: 124, r: 28 }, { x: 250, y: 124, r: 28 }],
};

export function CartoonVehicle({ car, width = 340 }: { car: CarStyle; width?: number }) {
  const rendered = RenderedVehicle({ body: car.body, accessories: car.accessories, width });
  if (rendered) return rendered;
  const height = Math.round(width * 0.5);
  const on = new Set(car.accessories);
  const front = car.body === "bike" ? 236 : car.body === "truck" ? 300 : 312;
  const roofY = car.body === "coupe" ? 58 : car.body === "van" ? 48 : car.body === "truck" ? 40 : car.body === "rig" ? 50 : car.body === "suv" ? 48 : car.body === "bike" ? 52 : 52;
  const whip = Math.max(14, roofY - 22);
  return (
    <Svg width={width} height={height} viewBox="0 0 360 180">
      <Ellipse cx="180" cy="158" rx="130" ry="8" fill="#000" opacity={0.28} />
      <Body body={car.body} paint={car.paint} />
      {on.has("stripe") && car.body !== "bike" && (
        <Path d="M70 112 H250" stroke="#F4F0E6" strokeWidth={4} strokeLinecap="round" opacity={0.9} />
      )}
      {on.has("canopy") && (car.body === "ute" || car.body === "rig") && (
        <Path d="M150 90 L168 62 H300 L312 90 Z" fill={shade(car.paint, -36)} />
      )}
      {on.has("sunstrip") && car.body !== "bike" && (
        <Rect x={car.body === "van" ? 250 : 156} y={car.body === "van" ? 56 : roofY + 8} width={car.body === "van" ? 48 : 54} height={8} rx={2} fill="#1C2430" opacity={0.55} />
      )}
      {on.has("rack") && car.body !== "bike" && (
        <G>
          <Line x1="120" y1={roofY + 6} x2="230" y2={roofY + 6} stroke="#C5CDD6" strokeWidth={3} />
          <Line x1="140" y1={roofY - 2} x2="140" y2={roofY + 10} stroke="#C5CDD6" strokeWidth={3} />
          <Line x1="200" y1={roofY - 2} x2="200" y2={roofY + 10} stroke="#C5CDD6" strokeWidth={3} />
        </G>
      )}
      {on.has("roofpod") && car.body !== "bike" && (
        <Rect x="150" y={roofY - 16} width="70" height="16" rx="7" fill="#3A4250" />
      )}
      {on.has("lightbar") && (
        <G>
          <Rect x="138" y={roofY - 12} width="78" height="8" rx="3" fill="#F2C14E" />
          <Rect x="146" y={roofY - 10} width="16" height="4" rx="1" fill="#FFF6D0" />
        </G>
      )}
      {on.has("beacon") && <Circle cx="168" cy={roofY - 8} r="7" fill="#E4B15A" />}
      {on.has("antenna") && (
        <Line x1="124" y1={roofY} x2="112" y2={whip} stroke="#E6EBF2" strokeWidth={2} />
      )}
      {on.has("snorkel") && car.body !== "bike" && (
        <Path d={`M96 ${roofY + 28} V${roofY - 8} Q96 ${roofY - 18} 108 ${roofY - 18}`} fill="none" stroke="#2C3340" strokeWidth={5} strokeLinecap="round" />
      )}
      {on.has("bullbar") && car.body !== "bike" && (
        <G>
          <Rect x={front - 8} y="92" width="8" height="32" rx="2" fill="#C5CDD6" />
          <Rect x={front - 16} y="98" width="18" height="4" rx="1" fill="#C5CDD6" />
          <Rect x={front - 16} y="112" width="18" height="4" rx="1" fill="#C5CDD6" />
        </G>
      )}
      {on.has("spots") && (
        <G>
          <Circle cx={front - 18} cy="96" r="5" fill="#F4F0E6" />
          <Circle cx={front - 18} cy="112" r="5" fill="#F4F0E6" />
        </G>
      )}
      {on.has("winch") && <Circle cx={front - 4} cy="108" r="6" fill="#5C6B7A" />}
      {on.has("spoiler") && car.body !== "bike" && car.body !== "truck" && (
        <Path d="M40 86 H78 L70 96 H48 Z" fill="#1C2430" />
      )}
      {on.has("exhaust") && <Rect x="40" y="124" width="22" height="6" rx="3" fill="#8C93A1" />}
      {on.has("mudflaps") && car.body !== "bike" && (
        <G>
          <Rect x="112" y="132" width="8" height="16" rx="1" fill="#1C2430" />
          <Rect x="268" y="132" width="8" height="16" rx="1" fill="#1C2430" />
        </G>
      )}
      {on.has("flags") && (
        <G>
          <Line x1="48" y1="70" x2="48" y2="40" stroke="#E6EBF2" strokeWidth={2} />
          <Path d="M48 40 H66 L60 46 H48 Z" fill="#C4453C" />
          <Line x1="62" y1="78" x2="62" y2="48" stroke="#E6EBF2" strokeWidth={2} />
          <Path d="M62 48 H78 L72 54 H62 Z" fill="#E4B15A" />
        </G>
      )}
      {WHEELS[car.body].map((wheel) => (
        <Wheel key={`${wheel.x}-${wheel.y}`} x={wheel.x} y={wheel.y} r={wheel.r} style={car.wheel} />
      ))}
    </Svg>
  );
}
