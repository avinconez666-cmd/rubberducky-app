import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useApp, VehicleType } from "@/contexts/AppContext";

const VEHICLES: { type: VehicleType; label: string; emoji: string; description: string }[] = [
  { type: "car", label: "Car", emoji: "🚗", description: "Sedan, SUV, Hatchback" },
  { type: "truck", label: "Truck", emoji: "🚛", description: "Semi, Freight, Delivery" },
  { type: "motorcycle", label: "Moto", emoji: "🏍️", description: "Bike, Scooter" },
  { type: "rv", label: "RV / Van", emoji: "🚐", description: "Camper, Motorhome" },
];

export default function OnboardingScreen() {
  const { completeOnboarding, isOnboarded } = useApp();
  const [name, setName] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType>("car");
  const [error, setError] = useState("");

  // If already onboarded, redirect to main app
  React.useEffect(() => {
    if (isOnboarded) {
      router.replace("/(tabs)");
    }
  }, [isOnboarded]);

  const handleStart = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Please enter a display name to continue.");
      return;
    }
    if (trimmed.length < 2) {
      setError("Display name must be at least 2 characters.");
      return;
    }
    setError("");
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    completeOnboarding(trimmed, selectedVehicle);
    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoEmoji}>📻</Text>
            </View>
            <Text style={styles.title}>10/4 Rubberducky</Text>
            <Text style={styles.subtitle}>Keep the rubber side down</Text>
          </View>

          {/* Feature highlights */}
          <View style={styles.features}>
            {[
              { icon: "📍", text: "Your GPS pin and speed stay on this phone" },
              { icon: "🎙️", text: "Push-to-talk clips you can play back" },
              { icon: "🛡️", text: "Text locks itself once you are moving" },
              { icon: "🔒", text: "No account and no subscription" },
            ].map((f, i) => (
              <View key={i} style={styles.featureRow}>
                <Text style={styles.featureIcon}>{f.icon}</Text>
                <Text style={styles.featureText}>{f.text}</Text>
              </View>
            ))}
          </View>

          {/* Name input */}
          <View style={styles.section}>
            <Text style={styles.label}>Your Handle</Text>
            <Text style={styles.labelHint}>Shown on your clips and hazard pins. Not sent anywhere in this release.</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={(t) => { setName(t); setError(""); }}
              placeholder="e.g. DustDevil, RoadRunner..."
              placeholderTextColor="#7E8796"
              maxLength={20}
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={handleStart}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>

          {/* Vehicle selector */}
          <View style={styles.section}>
            <Text style={styles.label}>Your Vehicle</Text>
            <View style={styles.vehicleGrid}>
              {VEHICLES.map((v) => (
                <TouchableOpacity
                  key={v.type}
                  style={[
                    styles.vehicleCard,
                    selectedVehicle === v.type && styles.vehicleCardActive,
                  ]}
                  onPress={() => {
                    setSelectedVehicle(v.type);
                    if (Platform.OS !== "web") {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.vehicleEmoji}>{v.emoji}</Text>
                  <Text style={[styles.vehicleLabel, selectedVehicle === v.type && styles.vehicleLabelActive]}>
                    {v.label}
                  </Text>
                  <Text style={styles.vehicleDesc}>{v.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* CTA */}
          <TouchableOpacity
            style={[styles.ctaButton, !name.trim() && styles.ctaButtonDisabled]}
            onPress={handleStart}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaText}>🚀  Hit the Road</Text>
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            By continuing you agree to use this app responsibly.{"\n"}
            Always prioritise road safety. 🛡️
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#090B10",
  },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    paddingTop: 32,
    paddingBottom: 24,
  },
  logoContainer: {
    width: 88,
    height: 88,
    borderRadius: 22,
    backgroundColor: "#12151C",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#E4B15A",
  },
  logoEmoji: {
    fontSize: 44,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#F4F0E6",
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: "#E4B15A",
    marginTop: 4,
    fontStyle: "italic",
    letterSpacing: 0.3,
  },
  features: {
    backgroundColor: "#12151C",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featureIcon: {
    fontSize: 20,
    width: 28,
    textAlign: "center",
  },
  featureText: {
    fontSize: 14,
    color: "#CBD5E1",
    flex: 1,
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F4F0E6",
    marginBottom: 4,
  },
  labelHint: {
    fontSize: 12,
    color: "#9AA3B2",
    marginBottom: 10,
  },
  input: {
    backgroundColor: "#12151C",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#F4F0E6",
    borderWidth: 1.5,
    borderColor: "#2A3140",
  },
  error: {
    color: "#EF4444",
    fontSize: 13,
    marginTop: 6,
  },
  vehicleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  vehicleCard: {
    width: "47%",
    backgroundColor: "#12151C",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#2A3140",
  },
  vehicleCardActive: {
    borderColor: "#E4B15A",
    backgroundColor: "#1C2A1A",
  },
  vehicleEmoji: {
    fontSize: 28,
    marginBottom: 6,
  },
  vehicleLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#9AA3B2",
    marginBottom: 2,
  },
  vehicleLabelActive: {
    color: "#E4B15A",
  },
  vehicleDesc: {
    fontSize: 11,
    color: "#7E8796",
    textAlign: "center",
  },
  ctaButton: {
    backgroundColor: "#E4B15A",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  ctaButtonDisabled: {
    opacity: 0.5,
  },
  ctaText: {
    fontSize: 17,
    fontWeight: "800",
    color: "#090B10",
    letterSpacing: 0.3,
  },
  disclaimer: {
    fontSize: 11,
    color: "#475569",
    textAlign: "center",
    lineHeight: 16,
  },
});
