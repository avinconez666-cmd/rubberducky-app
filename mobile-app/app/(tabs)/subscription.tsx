import { ScrollView, Text, View, Linking } from "react-native";
import { ScreenContainer } from "@/components/screen-container";

const INCLUDED = [
  { label: "Live map", description: "OpenStreetMap pin from your GPS. Tiles need a connection. Your position is not uploaded." },
  { label: "Push-to-talk", description: "Hold the mic button for up to 30 seconds. Play the clip back on this phone." },
  { label: "Safety Mode", description: "Text input locks when your GPS speed passes the limit you set." },
  { label: "Hazard pins", description: "Accident, debris, breakdown, animal, roadworks, weather. Stored on this phone for one hour." },
  { label: "Directions handoff", description: "Search a place, then open turn-by-turn in Google Maps." },
  { label: "Convoy list", description: "Save handles on this phone. They are not live locations." },
];

const PRIVACY_URL = "https://avinconez666-cmd.github.io/rubberducky-app/privacy.html";

export default function SubscriptionScreen() {
  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="gap-5">
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">Included</Text>
            <Text className="text-muted">Version 1.0 is free. There is no subscription and no in-app purchase.</Text>
          </View>

          <View className="bg-primary/15 border border-primary rounded-2xl p-4 gap-1">
            <Text className="text-foreground font-bold text-lg">Everything in this build</Text>
            <Text className="text-muted text-sm">Voice clips, pins, and your convoy list stay on the device.</Text>
          </View>

          <View className="gap-3">
            {INCLUDED.map((item) => (
              <View key={item.label} className="bg-surface border border-border rounded-lg p-3 gap-1">
                <Text className="text-foreground font-semibold">{item.label}</Text>
                <Text className="text-muted text-sm">{item.description}</Text>
              </View>
            ))}
          </View>

          <Text
            className="text-primary text-sm"
            onPress={() => Linking.openURL(PRIVACY_URL)}
          >
            Privacy policy
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
