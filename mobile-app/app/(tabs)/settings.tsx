import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useApp, VehicleType } from "@/contexts/AppContext";

const VEHICLES: { type: VehicleType; emoji: string; label: string }[] = [
  { type: "car", emoji: "🚗", label: "Car" },
  { type: "truck", emoji: "🚛", label: "Truck" },
  { type: "motorcycle", emoji: "🏍️", label: "Moto" },
  { type: "rv", emoji: "🚐", label: "RV" },
];

const RADIUS_OPTIONS = [
  { label: "500 m", value: 500 },
  { label: "1 km", value: 1000 },
  { label: "2 km", value: 2000 },
  { label: "5 km", value: 5000 },
];

const SPEED_OPTIONS = [
  { label: "5 km/h", value: 5 },
  { label: "10 km/h", value: 10 },
  { label: "20 km/h", value: 20 },
  { label: "Off", value: 999 },
];

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

function SettingRow({
  label,
  sublabel,
  right,
}: {
  label: string;
  sublabel?: string;
  right: React.ReactNode;
}) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingLeft}>
        <Text style={styles.settingLabel}>{label}</Text>
        {sublabel ? <Text style={styles.settingSubLabel}>{sublabel}</Text> : null}
      </View>
      <View style={styles.settingRight}>{right}</View>
    </View>
  );
}

export default function SettingsScreen() {
  const { user, updateUser, isSafetyMode, currentSpeed, nearbyDrivers, messages } = useApp();
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(user?.displayName ?? "");

  if (!user) return null;

  const handleSaveName = () => {
    const trimmed = nameInput.trim();
    if (trimmed.length >= 2) {
      updateUser({ displayName: trimmed });
      setEditingName(false);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const sessionDuration = Math.floor((Date.now() - user.sessionStartTime) / 60000);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Profile header */}
        <View style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarEmoji}>
              {VEHICLES.find((v) => v.type === user.vehicleType)?.emoji ?? "🚗"}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            {editingName ? (
              <View style={styles.nameEditRow}>
                <TextInput
                  style={styles.nameInput}
                  value={nameInput}
                  onChangeText={setNameInput}
                  autoFocus
                  maxLength={20}
                  returnKeyType="done"
                  onSubmitEditing={handleSaveName}
                />
                <TouchableOpacity onPress={handleSaveName} activeOpacity={0.7} style={styles.nameSaveBtn}>
                  <Text style={styles.nameSaveTxt}>Save</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={() => { setEditingName(true); setNameInput(user.displayName); }} activeOpacity={0.7}>
                <Text style={styles.profileName}>{user.displayName} ✏️</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.profileId}>Session ID: {user.id.slice(-8)}</Text>
          </View>
        </View>

        {/* Status card */}
        <View style={styles.statusCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user.messagesSent}</Text>
            <Text style={styles.statLabel}>Messages</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{nearbyDrivers.length}</Text>
            <Text style={styles.statLabel}>Nearby</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{sessionDuration}m</Text>
            <Text style={styles.statLabel}>Session</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, isSafetyMode && { color: "#F59E0B" }]}>
              {isSafetyMode ? `${currentSpeed}` : "0"}
            </Text>
            <Text style={styles.statLabel}>km/h</Text>
          </View>
        </View>

        {/* Vehicle */}
        <SectionHeader title="Vehicle Type" />
        <View style={styles.vehicleRow}>
          {VEHICLES.map((v) => (
            <TouchableOpacity
              key={v.type}
              style={[styles.vehicleChip, user.vehicleType === v.type && styles.vehicleChipActive]}
              onPress={() => {
                updateUser({ vehicleType: v.type });
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.vehicleChipEmoji}>{v.emoji}</Text>
              <Text style={[styles.vehicleChipLabel, user.vehicleType === v.type && styles.vehicleChipLabelActive]}>
                {v.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Privacy */}
        <SectionHeader title="Privacy" />
        <View style={styles.card}>
          <SettingRow
            label="Show on Map"
            sublabel="Other drivers can see your location"
            right={
              <Switch
                value={user.isVisible}
                onValueChange={(v) => {
                  updateUser({ isVisible: v });
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                trackColor={{ false: "#334155", true: "#22C55E" }}
                thumbColor="#F8FAFC"
              />
            }
          />
        </View>

        {/* Proximity radius */}
        <SectionHeader title="Proximity Radius" />
        <View style={styles.card}>
          <Text style={styles.cardSubLabel}>Discover drivers within this range</Text>
          <View style={styles.optionRow}>
            {RADIUS_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.optionChip, user.proximityRadius === opt.value && styles.optionChipActive]}
                onPress={() => {
                  updateUser({ proximityRadius: opt.value });
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.optionChipText, user.proximityRadius === opt.value && styles.optionChipTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Safety mode */}
        <SectionHeader title="Safety Mode" />
        <View style={styles.card}>
          <Text style={styles.cardSubLabel}>Disable text input above this speed</Text>
          <View style={styles.optionRow}>
            {SPEED_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.optionChip, user.safetySpeedThreshold === opt.value && styles.optionChipActive]}
                onPress={() => {
                  updateUser({ safetySpeedThreshold: opt.value });
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.optionChipText, user.safetySpeedThreshold === opt.value && styles.optionChipTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.safetyNote}>
            <Text style={styles.safetyNoteIcon}>🛡️</Text>
            <Text style={styles.safetyNoteText}>
              Emergency channel is always accessible regardless of safety mode.
            </Text>
          </View>
        </View>

        {/* About */}
        <SectionHeader title="About" />
        <View style={styles.card}>
          <SettingRow label="Version" right={<Text style={styles.valueText}>1.0.0</Text>} />
          <View style={styles.rowDivider} />
          <SettingRow label="Session ID" sublabel="Rotates each session for privacy" right={<Text style={styles.valueText}>{user.id.slice(-8)}</Text>} />
          <View style={styles.rowDivider} />
          <SettingRow label="Privacy" sublabel="No location stored beyond session" right={<Text style={styles.valueText}>🔒 On</Text>} />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: "#334155",
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#0F172A",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#F59E0B",
  },
  profileAvatarEmoji: {
    fontSize: 28,
  },
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#F8FAFC",
  },
  profileId: {
    fontSize: 11,
    color: "#475569",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  nameEditRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  nameInput: {
    flex: 1,
    backgroundColor: "#0F172A",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 16,
    color: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#F59E0B",
  },
  nameSaveBtn: {
    backgroundColor: "#F59E0B",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  nameSaveTxt: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },
  statusCard: {
    flexDirection: "row",
    backgroundColor: "#1E293B",
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#334155",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "800",
    color: "#F8FAFC",
  },
  statLabel: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "600",
  },
  statDivider: {
    width: 1,
    backgroundColor: "#334155",
    marginVertical: 4,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 4,
  },
  vehicleRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  vehicleChip: {
    flex: 1,
    backgroundColor: "#1E293B",
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#334155",
    gap: 4,
  },
  vehicleChipActive: {
    borderColor: "#F59E0B",
    backgroundColor: "#1C2A1A",
  },
  vehicleChipEmoji: {
    fontSize: 20,
  },
  vehicleChipLabel: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "600",
  },
  vehicleChipLabelActive: {
    color: "#F59E0B",
  },
  card: {
    backgroundColor: "#1E293B",
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#334155",
    gap: 4,
  },
  cardSubLabel: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 10,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  settingLeft: {
    flex: 1,
    gap: 2,
  },
  settingLabel: {
    fontSize: 15,
    color: "#F8FAFC",
    fontWeight: "600",
  },
  settingSubLabel: {
    fontSize: 12,
    color: "#64748B",
    lineHeight: 16,
  },
  settingRight: {
    marginLeft: 12,
  },
  valueText: {
    fontSize: 14,
    color: "#94A3B8",
    fontWeight: "600",
  },
  rowDivider: {
    height: 1,
    backgroundColor: "#334155",
    marginVertical: 6,
  },
  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  optionChip: {
    backgroundColor: "#0F172A",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: "#334155",
  },
  optionChipActive: {
    borderColor: "#F59E0B",
    backgroundColor: "#1C2A1A",
  },
  optionChipText: {
    fontSize: 13,
    color: "#94A3B8",
    fontWeight: "600",
  },
  optionChipTextActive: {
    color: "#F59E0B",
  },
  safetyNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 12,
    backgroundColor: "#0F172A",
    borderRadius: 8,
    padding: 10,
  },
  safetyNoteIcon: {
    fontSize: 14,
  },
  safetyNoteText: {
    fontSize: 12,
    color: "#64748B",
    flex: 1,
    lineHeight: 17,
  },
});

