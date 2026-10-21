import { useState } from "react";
import { Alert, Modal, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useApp, type HazardType } from "@/contexts/AppContext";
import { useRadio } from "@/contexts/RadioContext";
import { noteHasPlate } from "@/lib/plates";

const ROAD: { type: HazardType; label: string; emoji: string }[] = [
  { type: "accident", label: "Accident", emoji: "💥" },
  { type: "breakdown", label: "Breakdown", emoji: "🛠️" },
  { type: "debris", label: "Debris", emoji: "🪨" },
  { type: "animal", label: "Animal", emoji: "🦘" },
  { type: "roadworks", label: "Roadworks", emoji: "🚧" },
  { type: "weather", label: "Weather", emoji: "🌧️" },
];

export function QuickReport({
  mode,
  onClose,
}: {
  mode: "hazard" | "mobile" | null;
  onClose: () => void;
}) {
  const { userLocation, reportHazard } = useApp();
  const radio = useRadio();
  const [type, setType] = useState<HazardType>("debris");
  const [note, setNote] = useState("");

  const submit = () => {
    if (!userLocation) {
      Alert.alert("No fix yet", "Wait for GPS, then drop the pin.");
      return;
    }
    const text = note.trim();
    if (!text) {
      Alert.alert("Add a note", mode === "mobile" ? "Which road, and which direction." : "Say what is on the road.");
      return;
    }
    if (noteHasPlate(text)) {
      Alert.alert("Leave the rego out", "Describe the road, not a number plate.");
      return;
    }
    const hazardType: HazardType = mode === "mobile" ? "mobile_camera" : type;
    const full = mode === "mobile" ? `Mobile speed camera. ${text}` : text;
    reportHazard(hazardType, full, userLocation.latitude, userLocation.longitude);
    radio.publishHazard(hazardType, full, userLocation.latitude, userLocation.longitude, `hazard-${Date.now()}`);
    setNote("");
    onClose();
  };

  return (
    <Modal visible={mode != null} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-background rounded-t-2xl p-6 gap-3">
          <Text className="text-xl font-bold text-foreground">
            {mode === "mobile" ? "Pin a mobile camera" : "Report a road hazard"}
          </Text>
          <Text className="text-muted text-sm">
            {mode === "mobile"
              ? "Drops a pin on your GPS fix for 4 hours. Mobile cameras move. Obey the posted limit either way."
              : "Drops a pin where you are, for one hour. Pull over before you type."}
          </Text>
          {mode === "hazard" && (
            <View className="flex-row flex-wrap gap-2">
              {ROAD.map((item) => (
                <TouchableOpacity
                  key={item.type}
                  onPress={() => setType(item.type)}
                  className={`px-3 py-2 rounded-full border ${type === item.type ? "bg-primary border-primary" : "bg-surface border-border"}`}
                >
                  <Text className={`text-xs font-semibold ${type === item.type ? "text-background" : "text-foreground"}`}>
                    {item.emoji} {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder={mode === "mobile" ? "e.g. Kwinana Fwy northbound" : "e.g. couch in the left lane"}
            placeholderTextColor="#64748B"
            className="bg-surface border border-border rounded-lg p-3 text-foreground"
          />
          <View className="flex-row gap-2">
            <TouchableOpacity onPress={onClose} className="flex-1 bg-surface border border-border py-3 rounded-lg">
              <Text className="text-foreground font-semibold text-center">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={submit} className="flex-1 bg-primary py-3 rounded-lg">
              <Text className="text-background font-semibold text-center">Drop pin</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
