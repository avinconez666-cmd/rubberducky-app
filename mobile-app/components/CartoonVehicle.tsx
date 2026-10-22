import React from "react";
import { SvgXml } from "react-native-svg";
import type { CarStyle } from "@/constants/garage";
import { carSvg } from "@/lib/carSvg";

export function CartoonVehicle({ car, width = 340 }: { car: CarStyle; width?: number }) {
  const height = Math.round(width * (168 / 360));
  return <SvgXml xml={carSvg(car, "garage")} width={width} height={height} />;
}
