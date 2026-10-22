import React from "react";
import { Image, StyleSheet, View } from "react-native";
import type { CarBody, CarStyle } from "@/constants/garage";

const VEHICLES: Record<CarBody, number> = {
  sedan: require("@/assets/garage/renders/cartoon_compact_car.png"),
  ute: require("@/assets/garage/renders/cartoon_ute.jpg"),
  suv: require("@/assets/garage/renders/cartoon_suv.jpg"),
  wagon: require("@/assets/garage/renders/cartoon_wagon.jpg"),
  coupe: require("@/assets/garage/renders/cartoon_coupe.jpg"),
  van: require("@/assets/garage/renders/cartoon_adventure_van.png"),
  truck: require("@/assets/garage/renders/cartoon_monster_truck.png"),
  rig: require("@/assets/garage/renders/cartoon_rig.jpg"),
  bike: require("@/assets/garage/renders/cartoon_bike.jpg"),
};

const KIT: Record<string, number> = {
  roofpod: require("@/assets/garage/renders/accessory_roof_cargo_pod.png"),
  spoiler: require("@/assets/garage/renders/accessory_holo_spoiler.png"),
  bullbar: require("@/assets/garage/renders/accessory_plasma_bumper.png"),
  lightbar: require("@/assets/garage/renders/accessory_neon_underglow.png"),
  antenna: require("@/assets/garage/renders/accessory_sensor_antenna.png"),
};

export function CartoonVehicle({ car, width = 340 }: { car: CarStyle; width?: number }) {
  const fitted = car.accessories.filter((id) => KIT[id]);
  const height = Math.round(width * 0.72);
  return (
    <View style={{ width, alignItems: "center" }}>
      <View style={[styles.stage, { width, height }]}>
        <View style={[styles.glow, { backgroundColor: car.paint, width: width * 0.62, height: width * 0.16 }]} />
        <Image source={VEHICLES[car.body]} style={styles.vehicle} resizeMode="contain" />
      </View>
      {fitted.length > 0 && (
        <View style={styles.kit}>
          {fitted.map((id) => (
            <Image key={id} source={KIT[id]} style={styles.part} resizeMode="contain" />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { alignItems: "center", justifyContent: "center" },
  glow: { position: "absolute", bottom: 18, borderRadius: 999, opacity: 0.55 },
  vehicle: { width: "100%", height: "100%" },
  kit: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8, marginTop: 4 },
  part: { width: 64, height: 64, borderRadius: 12, backgroundColor: "#090B10" },
});
