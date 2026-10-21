import { useEffect, useRef, useState } from "react";
import { Alert, Animated, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { CartoonVehicle } from "@/components/CartoonVehicle";
import { useApp } from "@/contexts/AppContext";
import { useRadio } from "@/contexts/RadioContext";
import {
  ACCESSORIES,
  BODIES,
  MILESTONES,
  PAINTS,
  WHEELS,
  milestoneLeft,
  milestoneMet,
  normaliseStats,
  type CarBody,
  type WheelStyle,
} from "@/constants/garage";
import { PACKAGE_TIERS } from "@/constants/vehicle-customization";
import { playSfx } from "@/lib/sfx";

type AccessoryRarity = "rare" | "legendary";
const ACCESSORY_RARITY: Record<string, AccessoryRarity> = {
  lightbar: "rare",
  canopy: "rare",
  roofpod: "rare",
  rack: "rare",
  flags: "rare",
  beacon: "legendary",
  winch: "legendary",
};

const PARTICLES = [
  { x: -92, y: -68, size: 7 }, { x: -64, y: -102, size: 5 }, { x: -24, y: -82, size: 9 },
  { x: 22, y: -108, size: 6 }, { x: 64, y: -76, size: 8 }, { x: 96, y: -34, size: 5 },
  { x: -104, y: 8, size: 5 }, { x: 104, y: 12, size: 7 }, { x: -76, y: 54, size: 8 },
  { x: -28, y: 82, size: 5 }, { x: 38, y: 76, size: 7 }, { x: 82, y: 48, size: 5 },
];

function EquipParticleBurst({ progress, color }: { progress: Animated.Value; color: string }) {
  return (
    <View pointerEvents="none" style={styles.particleLayer}>
      {PARTICLES.map((particle, index) => {
        const direction = index % 2 === 0 ? 1 : 0.82;
        return (
          <Animated.View
            key={`${particle.x}-${particle.y}`}
            style={[
              styles.particle,
              { width: particle.size, height: particle.size, borderRadius: particle.size / 2, backgroundColor: color },
              {
                opacity: progress.interpolate({ inputRange: [0, 0.12, 0.72, 1], outputRange: [0, 1, 1, 0] }),
                transform: [
                  { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, particle.x * direction] }) },
                  { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, particle.y * direction] }) },
                  { scale: progress.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0.3, 1.25, 0.65] }) },
                ],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

export default function GarageScreen() {
  const { user, updateUser } = useApp();
  const radio = useRadio();
  const [busy, setBusy] = useState(false);
  const { width } = useWindowDimensions();
  const artWidth = Math.max(220, Math.min(340, width - 32));
  const stage = useRef(new Animated.Value(1)).current;
  const equipPulse = useRef(new Animated.Value(1)).current;
  const particleProgress = useRef(new Animated.Value(0)).current;
  const [particleColor, setParticleColor] = useState("#32E6D3");
  const signature = user ? `${user.car.body}|${user.car.paint}|${user.car.wheel}|${user.car.accessories.join(",")}` : "";
  useEffect(() => {
    stage.setValue(0.92);
    Animated.spring(stage, { toValue: 1, friction: 6, useNativeDriver: true }).start();
  }, [signature, stage]);
  if (!user) return null;
  const car = user.car;
  const stats = normaliseStats(user.stats);

  const setCar = (partial: Partial<typeof car>) => {
    updateUser({ car: { ...car, ...partial } });
    setTimeout(() => radio.pushProfile(), 50);
  };

  const locked = (id: string | null) => !milestoneMet(id, stats);

  const explain = (id: string | null) => {
    if (!id) return;
    const milestone = MILESTONES.find((item) => item.id === id);
    if (!milestone) return;
    Alert.alert(milestone.label, `${milestone.detail}. Progress ${milestoneLeft(id, stats)}.`);
  };

  const toggleAcc = (id: string, milestone: string | null) => {
    if (locked(milestone) && !car.accessories.includes(id)) {
      explain(milestone);
      return;
    }
    const has = car.accessories.includes(id);
    if (!has) {
      playSfx("unlock");
      const rarity = ACCESSORY_RARITY[id];
      if (rarity) {
        const color = rarity === "legendary" ? "#FFD447" : "#FF4FD8";
        setParticleColor(color);
        particleProgress.setValue(0);
        Animated.timing(particleProgress, { toValue: 1, duration: rarity === "legendary" ? 820 : 620, useNativeDriver: true }).start();
        if (Platform.OS !== "web") {
          if (rarity === "legendary") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } else {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }
        }
      } else if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      Animated.sequence([
        Animated.spring(equipPulse, { toValue: 1.07, friction: 4, tension: 120, useNativeDriver: true }),
        Animated.spring(equipPulse, { toValue: 1, friction: 5, tension: 90, useNativeDriver: true }),
      ]).start();
    }
    setCar({ accessories: has ? car.accessories.filter((item) => item !== id) : [...car.accessories, id] });
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
      if (!result.canceled && result.assets[0]) updateUser({ photoUri: result.assets[0].uri });
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenContainer className="px-4">
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.kicker}>GARAGE</Text>
        <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit>{user.displayName}</Text>
        <Text style={styles.lead}>The vehicle below is the one on your profile. Packages further down are a preview. Nothing on this screen charges you.</Text>

        <Animated.View style={[styles.hero, { transform: [{ scale: stage }, { scale: equipPulse }] }]}>
          <CartoonVehicle car={car} width={artWidth} />
          <EquipParticleBurst progress={particleProgress} color={particleColor} />
          <Text style={styles.heroMeta}>
            {BODIES.find((item) => item.id === car.body)?.label} · {car.accessories.length} fitted
          </Text>
        </Animated.View>

        <View style={styles.profile}>
          {user.photoUri ? (
            <Image source={{ uri: user.photoUri }} style={styles.photo} />
          ) : (
            <View style={styles.photoFallback}>
              <Text style={styles.photoLetter}>{user.displayName.slice(0, 1).toUpperCase()}</Text>
            </View>
          )}
          <View style={{ flex: 1, gap: 8 }}>
            <Text style={styles.profileLabel}>Driver photo</Text>
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

        <Text style={styles.section}>Milestones</Text>
        <ScrollView horizontal nestedScrollEnabled showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mileRow}>
          {MILESTONES.map((item) => {
            const done = milestoneMet(item.id, stats);
            return (
              <View key={item.id} style={[styles.mile, done && styles.mileDone]}>
                <Text style={styles.mileLabel}>{item.label}</Text>
                <Text style={styles.mileDetail}>{done ? "Unlocked" : milestoneLeft(item.id, stats)}</Text>
              </View>
            );
          })}
        </ScrollView>

        <Text style={styles.section}>Body</Text>
        <View style={styles.wrap}>
          {BODIES.map((item) => {
            const on = car.body === item.id;
            const shut = locked(item.milestone) && !on;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.chip, on && styles.chipOn, shut && styles.chipShut]}
                onPress={() => (shut ? explain(item.milestone) : setCar({ body: item.id as CarBody }))}
              >
                <Text style={[styles.chipText, on && styles.chipTextOn]}>{shut ? `${item.label}  ·  lock` : item.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.section}>Paint</Text>
        <View style={styles.wrap}>
          {PAINTS.map((item) => {
            const on = car.paint.toLowerCase() === item.hex.toLowerCase();
            const shut = locked(item.milestone) && !on;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.swatch, { backgroundColor: item.hex }, on && styles.swatchOn, shut && styles.swatchShut]}
                onPress={() => (shut ? explain(item.milestone) : setCar({ paint: item.hex }))}
              />
            );
          })}
        </View>

        <Text style={styles.section}>Wheels</Text>
        <View style={styles.wrap}>
          {WHEELS.map((item) => {
            const on = car.wheel === item.id;
            const shut = locked(item.milestone) && !on;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.chip, on && styles.chipOn, shut && styles.chipShut]}
                onPress={() => (shut ? explain(item.milestone) : setCar({ wheel: item.id as WheelStyle }))}
              >
                <Text style={[styles.chipText, on && styles.chipTextOn]}>{shut ? `${item.label}  ·  lock` : item.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.section}>Accessories</Text>
        {ACCESSORIES.map((item) => {
          const on = car.accessories.includes(item.id);
          const shut = locked(item.milestone) && !on;
          return (
            <TouchableOpacity key={item.id} style={[styles.acc, on && styles.accOn]} onPress={() => toggleAcc(item.id, item.milestone)}>
              <View style={{ flex: 1 }}>
                <Text style={styles.accTitle}>{item.label}</Text>
                <Text style={styles.accBlurb}>{shut ? MILESTONES.find((m) => m.id === item.milestone)?.detail : item.blurb}</Text>
              </View>
              <Text style={styles.accState}>{on ? "Fitted" : shut ? "Locked" : "Off"}</Text>
            </TouchableOpacity>
          );
        })}

        <Text style={styles.section}>Garage packages</Text>
        <Text style={styles.lead}>A preview of later collections. These cards do not take payment.</Text>
        {PACKAGE_TIERS.map((tier) => {
          const price = tier.billing === "free" ? "Free" : tier.billing === "monthly" ? `$${(tier.priceCents / 100).toFixed(2)}/mo` : `$${(tier.priceCents / 100).toFixed(2)}`;
          return (
            <View key={tier.id} style={styles.packageCard}>
              <View style={styles.packageTopline}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.packageName}>{tier.name}</Text>
                  <Text style={styles.packageTagline}>{tier.tagline}</Text>
                </View>
                <Text style={styles.packagePrice} numberOfLines={1}>{price}</Text>
              </View>
              <Text style={styles.packageUnlocks}>Lists {tier.unlocks.length} items. Not sold in the app yet.</Text>
            </View>
          );
        })}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 36 },
  kicker: { color: "#E4B15A", letterSpacing: 2.4, fontSize: 12, fontWeight: "700", marginTop: 8 },
  title: { color: "#F4F0E6", fontSize: 34, fontWeight: "700", marginTop: 4 },
  lead: { color: "#9AA3B2", marginTop: 6, lineHeight: 20 },
  packageCard: { marginTop: 8, backgroundColor: "#12151C", borderRadius: 16, padding: 14, borderWidth: 1, borderColor: "#2A3140" },
  packageTopline: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  packageName: { color: "#F4F0E6", fontWeight: "700", fontSize: 16 },
  packageTagline: { color: "#9AA3B2", fontSize: 12, lineHeight: 17, marginTop: 4 },
  packagePrice: { flexShrink: 0, color: "#E4B15A", fontWeight: "800", fontSize: 15 },
  packageUnlocks: { color: "#9AA3B2", fontSize: 12, fontWeight: "600", marginTop: 10 },
  hero: { marginTop: 16, backgroundColor: "#12151C", borderRadius: 28, borderWidth: 1, borderColor: "#2A3140", alignItems: "center", paddingTop: 8, paddingBottom: 4, overflow: "hidden", position: "relative" },
  particleLayer: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", zIndex: 4 },
  particle: { position: "absolute", left: "50%", top: "44%", marginLeft: -4, marginTop: -4, shadowColor: "#FFFFFF", shadowOpacity: 0.85, shadowRadius: 6, shadowOffset: { width: 0, height: 0 }, elevation: 5 },
  heroMeta: { color: "#9AA3B2", fontWeight: "600", marginBottom: 8 },
  profile: { marginTop: 14, flexDirection: "row", gap: 14, alignItems: "center", backgroundColor: "#12151C", borderRadius: 20, padding: 14, borderWidth: 1, borderColor: "#2A3140" },
  photo: { width: 64, height: 64, borderRadius: 32 },
  photoFallback: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#090B10", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#E4B15A" },
  photoLetter: { color: "#E4B15A", fontSize: 26, fontWeight: "700" },
  profileLabel: { color: "#F4F0E6", fontWeight: "700" },
  row: { flexDirection: "row", gap: 8 },
  smallBtn: { backgroundColor: "#090B10", borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: "#2A3140" },
  smallBtnText: { color: "#F4F0E6", fontWeight: "700" },
  section: { color: "#F4F0E6", fontWeight: "700", fontSize: 18, marginTop: 22, marginBottom: 10 },
  mileRow: { gap: 8, paddingRight: 8 },
  mile: { width: 148, backgroundColor: "#12151C", borderRadius: 16, padding: 12, borderWidth: 1, borderColor: "#2A3140" },
  mileDone: { borderColor: "#E4B15A" },
  mileLabel: { color: "#F4F0E6", fontWeight: "700" },
  mileDetail: { color: "#9AA3B2", marginTop: 4, fontSize: 12 },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, backgroundColor: "#12151C", borderWidth: 1, borderColor: "#2A3140" },
  chipOn: { backgroundColor: "#E4B15A", borderColor: "#E4B15A" },
  chipShut: { opacity: 0.55 },
  chipText: { color: "#F4F0E6", fontWeight: "700" },
  chipTextOn: { color: "#1A140C" },
  swatch: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: "#2A3140" },
  swatchOn: { borderColor: "#E4B15A", borderWidth: 3 },
  swatchShut: { opacity: 0.4 },
  acc: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#12151C", borderRadius: 16, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: "#2A3140" },
  accOn: { borderColor: "#E4B15A" },
  accTitle: { color: "#F4F0E6", fontWeight: "700" },
  accBlurb: { color: "#9AA3B2", fontSize: 12, marginTop: 2 },
  accState: { color: "#E4B15A", fontWeight: "700" },
});
