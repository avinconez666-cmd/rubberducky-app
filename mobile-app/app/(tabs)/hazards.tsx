import { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity, Modal, TextInput, FlatList, Alert } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useApp } from "@/contexts/AppContext";
import { useRadio } from "@/contexts/RadioContext";
import { CAMERA_COUNT, CAMERA_SOURCE } from "@/lib/cameras";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import type { HazardType } from "@/contexts/AppContext";

const HAZARD_TYPES: { type: HazardType; label: string; emoji: string }[] = [
  { type: "accident", label: "Accident", emoji: "💥" },
  { type: "debris", label: "Debris", emoji: "🪨" },
  { type: "breakdown", label: "Breakdown", emoji: "🛠️" },
  { type: "animal", label: "Animal", emoji: "🦘" },
  { type: "roadworks", label: "Roadworks", emoji: "🚧" },
  { type: "weather", label: "Weather", emoji: "🌧️" },
  { type: "speed_camera", label: "Camera", emoji: "📷" },
  { type: "police", label: "Traffic stop", emoji: "🚔" },
];

export default function HazardsScreen() {
  const colors = useColors();
  const { hazards, reportHazard, upvoteHazard, userLocation } = useApp();
  const radio = useRadio();
  const [showModal, setShowModal] = useState(false);
  const [selectedType, setSelectedType] = useState<HazardType>("accident");
  const [description, setDescription] = useState("");

  const handleReport = () => {
    if (!userLocation) {
      Alert.alert("Location needed", "Turn on location so the pin is dropped where you actually are.");
      return;
    }
    if (!description.trim()) {
      Alert.alert("Add a note", "Say what other drivers should look for.");
      return;
    }
    reportHazard(selectedType, description.trim(), userLocation.latitude, userLocation.longitude);
    const id = `hazard-${Date.now()}`;
    radio.publishHazard(selectedType, description.trim(), userLocation.latitude, userLocation.longitude, id);
    setDescription("");
    setSelectedType("accident");
    setShowModal(false);
  };

  const activeHazards = hazards.filter((h) => h.expiresAt > Date.now());

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="gap-4">
          {/* Header */}
          <View className="flex-row items-center justify-between">
            <Text className="text-2xl font-bold text-foreground">Hazard Reports</Text>
            <TouchableOpacity
              onPress={() => setShowModal(true)}
              className="bg-primary px-4 py-2 rounded-full"
            >
              <Text className="text-background font-semibold">+ Report</Text>
            </TouchableOpacity>
          </View>

          <Text className="text-muted text-sm">
            Pins stay on this phone for an hour. A traffic-stop pin lasts 45 minutes. {CAMERA_COUNT} signposted NSW cameras are already on the map. {CAMERA_SOURCE}
          </Text>
          {activeHazards.length === 0 ? (
            <View className="flex-1 items-center justify-center gap-2">
              <Text className="text-muted text-lg">No active hazard reports</Text>
              <Text className="text-muted text-sm">Reports expire after 1 hour</Text>
            </View>
          ) : (
            <FlatList
              scrollEnabled={false}
              data={activeHazards}
              keyExtractor={(h) => h.id}
              renderItem={({ item }) => {
                const hazardInfo = HAZARD_TYPES.find((ht) => ht.type === item.type);
                return (
                  <View className="bg-surface rounded-lg p-4 mb-3 border border-border">
                    <View className="flex-row items-start justify-between gap-2">
                      <View className="flex-1 gap-1">
                        <View className="flex-row items-center gap-2">
                          <Text className="text-2xl">{hazardInfo?.emoji}</Text>
                          <Text className="text-foreground font-semibold">{hazardInfo?.label}</Text>
                        </View>
                        <Text className="text-muted text-sm">{item.description}</Text>
                        <Text className="text-muted text-xs mt-1">
                          Reported by {item.reportedBy}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => upvoteHazard(item.id)}
                        className="items-center gap-1"
                      >
                        <IconSymbol name="star.fill" size={20} color={colors.primary} />
                        <Text className="text-primary text-xs font-semibold">{item.upvotes}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              }}
            />
          )}
        </View>
      </ScrollView>

      {/* Report Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-background rounded-t-2xl p-6 gap-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-xl font-bold text-foreground">Report Hazard</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <IconSymbol name="xmark" size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            {/* Hazard Type Selector */}
            <View className="gap-2">
              <Text className="text-foreground font-semibold">Type</Text>
              <View className="flex-row flex-wrap gap-2">
                {HAZARD_TYPES.map((ht) => (
                  <TouchableOpacity
                    key={ht.type}
                    onPress={() => setSelectedType(ht.type)}
                    className={`flex-1 min-w-[45%] py-3 px-2 rounded-lg border-2 items-center ${
                      selectedType === ht.type
                        ? "bg-primary border-primary"
                        : "bg-surface border-border"
                    }`}
                  >
                    <Text className="text-2xl mb-1">{ht.emoji}</Text>
                    <Text
                      className={`text-xs font-semibold ${
                        selectedType === ht.type ? "text-background" : "text-foreground"
                      }`}
                    >
                      {ht.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Description */}
            <View className="gap-2">
              <Text className="text-foreground font-semibold">Description</Text>
              <TextInput
                placeholder="e.g., Lane blocked, debris on road..."
                placeholderTextColor={colors.muted}
                value={description}
                onChangeText={setDescription}
                className="bg-surface border border-border rounded-lg p-3 text-foreground"
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Buttons */}
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                className="flex-1 bg-surface border border-border py-3 rounded-lg"
              >
                <Text className="text-foreground font-semibold text-center">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleReport}
                className="flex-1 bg-primary py-3 rounded-lg"
              >
                <Text className="text-background font-semibold text-center">Report</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
