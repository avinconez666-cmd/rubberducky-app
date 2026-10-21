import { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity, Image, Alert, StyleSheet } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { ScreenContainer } from "@/components/screen-container";
import { useApp } from "@/contexts/AppContext";
import { useRadio } from "@/contexts/RadioContext";
import { ACCESSORIES, BODIES, PAINTS, WHEELS, type CarBody, type WheelStyle } from "@/constants/garage";

const WHEEL_COLOR: Record<WheelStyle, string> = {
  steel: "#94A3B8",
  alloy: "#E2E8F0",
  black: "#111827",
  gold: "#FBBF24",
};

export default function GarageScreen() {
  const { user, updateUser } = useApp();
  const radio = useRadio();
  const [busy, setBusy] = useState(false);
  if (!user) return null;
  const car = user.car;

  const setCar = (partial: Partial<typeof car>) => {
    updateUser({ car: { ...car, ...partial } });
    setTimeout(() => radio.pushProfile(), 0);
  };

  const toggleAcc = (id: string) => {
    const has = car.accessories.includes(id);
    setCar({ accessories: has ? car.accessories.filter((a) => a !== id) : [...car.accessories, id] });
  };

  const pickPhoto = async (camera: boolean) => {
    setBusy(true);
    try {
      const perm = camera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Photo", camera ? "Camera permission is off." : "Photo library permission is off.");
        return;
      }
      const result = camera
        ? await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.6 })
        : await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.6 });
      if (!result.canceled && result.assets[0]) {
        updateUser({ photoUri: result.assets[0].uri });
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <Text className="text-3xl font-bold text-foreground">Garage</Text>
        <Text className="text-muted text-sm mt-1 mb-4">Your face and your car show on the radio. Every option in this release is included.</Text>

        <View style={styles.card}>
          <View style={styles.photoRow}>
            {user.photoUri ? (
              <Image source={{ uri: user.photoUri }} style={styles.photo} />
            ) : (
              <View style={styles.photoFallback}>
                <Text style={styles.photoLetter}>{user.displayName.slice(0, 1).toUpperCase()}</Text>
              </View>
            )}
            <View style={{ flex: 1, gap: 8 }}>
              <Text style={styles.handle}>{user.displayName}</Text>
              <View style={styles.row}>
                <TouchableOpacity style={styles.smallBtn} onPress={() => pickPhoto(false)} disabled={busy}>
                  <Text style={styles.smallBtnText}>Library</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.smallBtn} onPress={() => pickPhoto(true)} disabled={busy}>
                  <Text style={styles.smallBtnText}>Camera</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.stage, { backgroundColor: "#0B1220" }]}>
          <View style={[styles.body, { backgroundColor: car.paint }, car.body === "bike" && styles.bike]}>
            {car.accessories.includes("checker") && <View style={styles.stripe} />}
            {car.accessories.includes("lightbar") && <View style={styles.lightbar} />}
            {car.accessories.includes("antenna") && <View style={styles.antenna} />}
            {car.accessories.includes("snorkel") && <View style={styles.snorkel} />}
            {car.accessories.includes("canopy") && car.body !== "bike" && <View style={styles.canopy} />}
            {car.accessories.includes("roofpod") && <View style={styles.pod} />}
            {car.accessories.includes("bullbar") && <View style={styles.bullbar} />}
            {car.accessories.includes("spots") && (
              <View style={styles.spots}>
                <View style={styles.spot} />
                <View style={styles.spot} />
              </View>
            )}
          </View>
          {car.body !== "bike" && (
            <View style={styles.wheelRow}>
              <View style={[styles.wheel, { backgroundColor: WHEEL_COLOR[car.wheel] }]} />
              <View style={[styles.wheel, { backgroundColor: WHEEL_COLOR[car.wheel] }]} />
            </View>
          )}
          <Text style={styles.stageLabel}>{BODIES.find((b) => b.id === car.body)?.label} · {car.accessories.length} fitted</Text>
        </View>

        <Text style={styles.section}>Body</Text>
        <View style={styles.wrap}>
          {BODIES.map((b) => (
            <TouchableOpacity key={b.id} style={[styles.chip, car.body === b.id && styles.chipOn]} onPress={() => setCar({ body: b.id as CarBody })}>
              <Text style={[styles.chipText, car.body === b.id && styles.chipTextOn]}>{b.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.section}>Paint</Text>
        <View style={styles.wrap}>
          {PAINTS.map((p) => (
            <TouchableOpacity key={p.id} style={[styles.swatch, { backgroundColor: p.hex }, car.paint === p.hex && styles.swatchOn]} onPress={() => setCar({ paint: p.hex })} />
          ))}
        </View>

        <Text style={styles.section}>Wheels</Text>
        <View style={styles.wrap}>
          {WHEELS.map((w) => (
            <TouchableOpacity key={w.id} style={[styles.chip, car.wheel === w.id && styles.chipOn]} onPress={() => setCar({ wheel: w.id })}>
              <Text style={[styles.chipText, car.wheel === w.id && styles.chipTextOn]}>{w.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.section}>Accessories</Text>
        {ACCESSORIES.map((item) => {
          const on = car.accessories.includes(item.id);
          return (
            <TouchableOpacity key={item.id} style={[styles.acc, on && styles.accOn]} onPress={() => toggleAcc(item.id)}>
              <View style={{ flex: 1 }}>
                <Text style={styles.accTitle}>{item.label}</Text>
                <Text style={styles.accBlurb}>{item.blurb}</Text>
              </View>
              <Text style={styles.accState}>{on ? "Fitted" : "Off"}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#1E293B", borderRadius: 16, padding: 14, borderWidth: 1, borderColor: "#334155" },
  photoRow: { flexDirection: "row", gap: 14, alignItems: "center" },
  photo: { width: 72, height: 72, borderRadius: 36 },
  photoFallback: { width: 72, height: 72, borderRadius: 36, backgroundColor: "#0F172A", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#F59E0B" },
  photoLetter: { color: "#F59E0B", fontSize: 28, fontWeight: "800" },
  handle: { color: "#F8FAFC", fontSize: 20, fontWeight: "800" },
  row: { flexDirection: "row", gap: 8 },
  smallBtn: { backgroundColor: "#0F172A", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: "#334155" },
  smallBtnText: { color: "#F8FAFC", fontWeight: "700" },
  stage: { marginTop: 16, borderRadius: 18, minHeight: 180, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#1E293B" },
  body: { width: 168, height: 64, borderRadius: 16, marginTop: 28, borderWidth: 2, borderColor: "#0F172A" },
  bike: { width: 120, height: 36, borderRadius: 18, marginTop: 40 },
  stripe: { position: "absolute", left: "46%", top: 0, bottom: 0, width: 8, backgroundColor: "#fff" },
  lightbar: { position: "absolute", top: -10, left: 30, right: 30, height: 8, borderRadius: 4, backgroundColor: "#FDE68A" },
  antenna: { position: "absolute", right: 16, top: -36, width: 2, height: 36, backgroundColor: "#E2E8F0" },
  snorkel: { position: "absolute", left: 8, top: -28, width: 6, height: 36, borderRadius: 3, backgroundColor: "#334155" },
  canopy: { position: "absolute", right: 0, top: -18, width: 70, height: 22, backgroundColor: "#0F172A", borderTopRightRadius: 8 },
  pod: { position: "absolute", left: 50, top: -16, width: 46, height: 14, borderRadius: 6, backgroundColor: "#334155" },
  bullbar: { position: "absolute", left: -6, top: 10, bottom: 10, width: 8, borderRadius: 3, backgroundColor: "#CBD5E1" },
  spots: { position: "absolute", left: 6, top: 8, flexDirection: "row", gap: 4 },
  spot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#FEF3C7" },
  wheelRow: { width: 150, flexDirection: "row", justifyContent: "space-between", marginTop: -14 },
  wheel: { width: 28, height: 28, borderRadius: 14, borderWidth: 4, borderColor: "#0F172A" },
  stageLabel: { color: "#94A3B8", marginTop: 16, fontWeight: "700" },
  section: { color: "#F8FAFC", fontWeight: "800", fontSize: 16, marginTop: 18, marginBottom: 8 },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: "#1E293B", borderWidth: 1, borderColor: "#334155" },
  chipOn: { backgroundColor: "#F59E0B", borderColor: "#F59E0B" },
  chipText: { color: "#E2E8F0", fontWeight: "700" },
  chipTextOn: { color: "#0F172A" },
  swatch: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: "#334155" },
  swatchOn: { borderColor: "#F59E0B", borderWidth: 3 },
  acc: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#1E293B", borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: "#334155" },
  accOn: { borderColor: "#F59E0B" },
  accTitle: { color: "#F8FAFC", fontWeight: "700" },
  accBlurb: { color: "#94A3B8", fontSize: 12, marginTop: 2 },
  accState: { color: "#F59E0B", fontWeight: "800" },
});
