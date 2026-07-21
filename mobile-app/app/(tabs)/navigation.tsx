import { useState, useEffect } from "react";
import { ScrollView, Text, View, TouchableOpacity, TextInput, Modal } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useApp } from "@/contexts/AppContext";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

const DESTINATIONS = [
  { name: "Sydney Opera House", lat: -33.8568, lng: 151.2153 },
  { name: "Bondi Beach", lat: -33.8891, lng: 151.2768 },
  { name: "Blue Mountains", lat: -33.7298, lng: 150.3135 },
  { name: "Newcastle", lat: -32.9271, lng: 151.7802 },
];

export default function NavigationScreen() {
  const colors = useColors();
  const { navigation, setDestination, startNavigation, stopNavigation, subscription } = useApp();
  const [showDestinations, setShowDestinations] = useState(false);
  const [searchText, setSearchText] = useState("");

  const handleSelectDestination = (name: string, lat: number, lng: number) => {
    setDestination(name, lat, lng);
    setShowDestinations(false);
  };

  const filteredDestinations = DESTINATIONS.filter((d) =>
    d.name.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="gap-4">
          {/* Header */}
          <Text className="text-2xl font-bold text-foreground">Navigation</Text>

          {/* Premium Badge */}
          {!subscription.canNavigate && (
            <View className="bg-warning/20 border border-warning rounded-lg p-3 flex-row items-center gap-2">
              <IconSymbol name="info.circle.fill" size={20} color={colors.warning} />
              <Text className="text-warning text-sm flex-1">Upgrade to Premium for navigation</Text>
            </View>
          )}

          {/* Current Navigation State */}
          {navigation.isNavigating ? (
            <View className="bg-primary/20 border border-primary rounded-lg p-4 gap-3">
              {/* Destination */}
              <View className="gap-1">
                <Text className="text-muted text-sm">Destination</Text>
                <Text className="text-foreground text-lg font-bold">{navigation.destination}</Text>
              </View>

              {/* Navigation Info Grid */}
              <View className="flex-row gap-3">
                {/* Current Speed */}
                <View className="flex-1 bg-surface rounded-lg p-3 items-center">
                  <IconSymbol name="speedometer" size={24} color={colors.primary} />
                  <Text className="text-muted text-xs mt-1">Speed</Text>
                  <Text className="text-foreground font-bold text-lg">{navigation.currentSpeed} km/h</Text>
                </View>

                {/* Speed Limit */}
                <View className="flex-1 bg-surface rounded-lg p-3 items-center">
                  <View className="w-10 h-10 bg-white rounded-full items-center justify-center mb-1">
                    <Text className="text-black font-bold text-sm">{navigation.speedLimit}</Text>
                  </View>
                  <Text className="text-muted text-xs">Limit</Text>
                </View>

                {/* ETA */}
                <View className="flex-1 bg-surface rounded-lg p-3 items-center">
                  <IconSymbol name="bell.fill" size={24} color={colors.primary} />
                  <Text className="text-muted text-xs mt-1">ETA</Text>
                  <Text className="text-foreground font-bold text-lg">{navigation.etaMinutes} min</Text>
                </View>
              </View>

              {/* Next Turn */}
              {navigation.nextTurn && (
                <View className="bg-surface rounded-lg p-3">
                  <Text className="text-muted text-xs">Next Turn</Text>
                  <Text className="text-foreground font-semibold">{navigation.nextTurn}</Text>
                  <Text className="text-muted text-sm">in {navigation.distanceToTurn}m</Text>
                </View>
              )}

              {/* Stop Navigation Button */}
              <TouchableOpacity
                onPress={stopNavigation}
                className="bg-error py-3 rounded-lg items-center"
              >
                <Text className="text-background font-semibold">Stop Navigation</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="gap-3">
              {/* Destination Input */}
              <View className="gap-2">
                <Text className="text-foreground font-semibold">Where to?</Text>
                <TouchableOpacity
                  onPress={() => setShowDestinations(true)}
                  disabled={!subscription.canNavigate}
                  className="bg-surface border border-border rounded-lg p-4 flex-row items-center justify-between"
                >
                  <Text className={navigation.destination ? "text-foreground" : "text-muted"}>
                    {navigation.destination || "Select destination..."}
                  </Text>
                  <IconSymbol name="chevron.right" size={20} color={colors.muted} />
                </TouchableOpacity>
              </View>

              {/* Start Button */}
              {navigation.destination && (
                <TouchableOpacity
                  onPress={startNavigation}
                  className="bg-primary py-4 rounded-lg items-center"
                >
                  <View className="flex-row items-center gap-2">
                    <IconSymbol name="location.fill" size={20} color={colors.background} />
                    <Text className="text-background font-bold text-lg">Start Navigation</Text>
                  </View>
                </TouchableOpacity>
              )}

              {/* Suggested Destinations */}
              <View className="gap-2">
                <Text className="text-foreground font-semibold">Popular Destinations</Text>
                {DESTINATIONS.map((dest) => (
                  <TouchableOpacity
                    key={dest.name}
                    onPress={() => handleSelectDestination(dest.name, dest.lat, dest.lng)}
                    disabled={!subscription.canNavigate}
                    className="bg-surface border border-border rounded-lg p-3 flex-row items-center justify-between"
                  >
                    <View className="flex-row items-center gap-2 flex-1">
                      <IconSymbol name="location.fill" size={20} color={colors.primary} />
                      <Text className="text-foreground font-medium flex-1">{dest.name}</Text>
                    </View>
                    <IconSymbol name="chevron.right" size={16} color={colors.muted} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Destination Picker Modal */}
      <Modal visible={showDestinations} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-background rounded-t-2xl p-6 gap-4 max-h-[80%]">
            <View className="flex-row items-center justify-between">
              <Text className="text-xl font-bold text-foreground">Select Destination</Text>
              <TouchableOpacity onPress={() => setShowDestinations(false)}>
                <IconSymbol name="xmark" size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            {/* Search */}
            <TextInput
              placeholder="Search destinations..."
              placeholderTextColor={colors.muted}
              value={searchText}
              onChangeText={setSearchText}
              className="bg-surface border border-border rounded-lg p-3 text-foreground"
            />

            {/* Destinations List */}
            <ScrollView className="gap-2">
              {filteredDestinations.map((dest) => (
                <TouchableOpacity
                  key={dest.name}
                  onPress={() => handleSelectDestination(dest.name, dest.lat, dest.lng)}
                  className="bg-surface border border-border rounded-lg p-4 flex-row items-center gap-3"
                >
                  <IconSymbol name="location.fill" size={20} color={colors.primary} />
                  <View className="flex-1">
                    <Text className="text-foreground font-semibold">{dest.name}</Text>
                    <Text className="text-muted text-xs">{dest.lat.toFixed(4)}, {dest.lng.toFixed(4)}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
