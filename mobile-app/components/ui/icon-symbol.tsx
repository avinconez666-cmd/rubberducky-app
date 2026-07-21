// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * SF Symbols → Material Icons mapping for 10/4 Rubberducky
 */
const MAPPING = {
  // Navigation tabs
  "house.fill": "home",
  "map.fill": "map",
  "antenna.radiowaves.left.and.right": "cell-tower",
  "gearshape.fill": "settings",
  // Communication
  "paperplane.fill": "send",
  "mic.fill": "mic",
  "mic.slash.fill": "mic-off",
  "speaker.wave.2.fill": "volume-up",
  "waveform": "graphic-eq",
  // Map / Location
  "location.fill": "location-on",
  "location.slash.fill": "location-off",
  "car.fill": "directions-car",
  "truck.box.fill": "local-shipping",
  "bicycle": "directions-bike",
  "rv.car.fill": "rv-hookup",
  // Channels
  "person.3.fill": "group",
  "exclamationmark.triangle.fill": "warning",
  "lock.fill": "lock",
  "lock.open.fill": "lock-open",
  "plus.circle.fill": "add-circle",
  "checkmark.circle.fill": "check-circle",
  // UI
  "chevron.right": "chevron-right",
  "chevron.left": "chevron-left",
  "chevron.down": "expand-more",
  "chevron.up": "expand-less",
  "xmark.circle.fill": "cancel",
  "xmark": "close",
  "info.circle.fill": "info",
  "shield.fill": "shield",
  "eye.fill": "visibility",
  "eye.slash.fill": "visibility-off",
  "slider.horizontal.3": "tune",
  "person.fill": "person",
  "chevron.left.forwardslash.chevron.right": "code",
  "star.fill": "star",
  "bell.fill": "notifications",
  "trash.fill": "delete",
  "square.and.arrow.up": "share",
  "arrow.clockwise": "refresh",
  "speedometer": "speed",
  "radio.fill": "radio",
} as unknown as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
