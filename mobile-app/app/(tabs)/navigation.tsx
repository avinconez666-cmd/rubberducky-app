import { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity, TextInput, Linking, Alert, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useApp } from "@/contexts/AppContext";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { formatDistance, haversineMeters } from "@/lib/geo";

const SHORTCUTS = [
  { name: "Perth CBD", lat: -31.9523, lng: 115.8613 },
  { name: "Mandurah", lat: -32.5361, lng: 115.7424 },
  { name: "Fremantle", lat: -32.0569, lng: 115.7439 },
  { name: "Sydney Opera House", lat: -33.8568, lng: 151.2153 },
];

type Hit = { name: string; lat: number; lng: number };

export default function NavigationScreen() {
  const colors = useColors();
  const { navigation, setDestination, stopNavigation, userLocation, currentSpeed } = useApp();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [searching, setSearching] = useState(false);

  const distance = (lat: number, lng: number) => {
    if (!userLocation) return null;
    return formatDistance(haversineMeters(userLocation.latitude, userLocation.longitude, lat, lng));
  };

  const search = async () => {
    const q = query.trim();
    if (q.length < 2) return;
    setSearching(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&q=${encodeURIComponent(q)}`;
      const res = await fetch(url, {
        headers: { Accept: "application/json", "User-Agent": "Rubberducky/1.0 (Android driver radio)" },
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { display_name: string; lat: string; lon: string }[];
      setHits(
        data.map((d) => ({
          name: d.display_name.split(",").slice(0, 2).join(","),
          lat: Number(d.lat),
          lng: Number(d.lon),
        })),
      );
    } catch {
      Alert.alert("Search failed", "Check your connection and try the place name again.");
    } finally {
      setSearching(false);
    }
  };

  const openMaps = () => {
    if (navigation.destinationLat == null || navigation.destinationLng == null) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${navigation.destinationLat},${navigation.destinationLng}&travelmode=driving`;
    Linking.openURL(url).catch(() => Alert.alert("Maps", "Could not open Google Maps."));
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="gap-4">
          <Text className="text-2xl font-bold text-foreground">Navigation</Text>
          <Text className="text-muted text-sm">
            Search a place, then hand off to Google Maps for turn-by-turn. This app does not invent speed limits or spoken directions.
          </Text>

          <View className="flex-row gap-2">
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Suburb, street, or place"
              placeholderTextColor={colors.muted}
              onSubmitEditing={search}
              returnKeyType="search"
              className="flex-1 bg-surface border border-border rounded-lg p-3 text-foreground"
            />
            <TouchableOpacity onPress={search} className="bg-primary px-4 rounded-lg items-center justify-center">
              {searching ? <ActivityIndicator color={colors.background} /> : <Text className="text-background font-bold">Go</Text>}
            </TouchableOpacity>
          </View>

          {navigation.destination && navigation.destinationLat != null && navigation.destinationLng != null && (
            <View className="bg-surface border border-border rounded-lg p-4 gap-3">
              <Text className="text-foreground font-bold text-lg">{navigation.destination}</Text>
              <Text className="text-muted text-sm">
                {distance(navigation.destinationLat, navigation.destinationLng) ?? "Waiting for GPS"} away
                {userLocation ? ` · you are doing ${currentSpeed} km/h` : ""}
              </Text>
              <TouchableOpacity onPress={openMaps} className="bg-primary py-3 rounded-lg items-center">
                <Text className="text-background font-bold">Open turn-by-turn in Maps</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={stopNavigation} className="py-2 items-center">
                <Text className="text-muted font-semibold">Clear destination</Text>
              </TouchableOpacity>
            </View>
          )}

          {hits.length > 0 && (
            <View className="gap-2">
              <Text className="text-foreground font-semibold">Results</Text>
              {hits.map((hit) => (
                <TouchableOpacity
                  key={`${hit.lat},${hit.lng}`}
                  onPress={() => setDestination(hit.name, hit.lat, hit.lng)}
                  className="bg-surface border border-border rounded-lg p-3"
                >
                  <Text className="text-foreground font-medium">{hit.name}</Text>
                  <Text className="text-muted text-xs mt-1">{distance(hit.lat, hit.lng) ?? "Distance after GPS lock"}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View className="gap-2">
            <Text className="text-foreground font-semibold">Shortcuts</Text>
            {SHORTCUTS.map((dest) => (
              <TouchableOpacity
                key={dest.name}
                onPress={() => setDestination(dest.name, dest.lat, dest.lng)}
                className="bg-surface border border-border rounded-lg p-3 flex-row items-center gap-2"
              >
                <IconSymbol name="location.fill" size={18} color={colors.primary} />
                <Text className="text-foreground font-medium flex-1">{dest.name}</Text>
                <Text className="text-muted text-xs">{distance(dest.lat, dest.lng) ?? ""}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
