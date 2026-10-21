import { useEffect, useMemo, useState } from "react";
import { Alert, Linking, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "@/contexts/AppContext";
import { useRadio } from "@/contexts/RadioContext";
import { AU_STATES, clubFor, guessState, type AuState } from "@/lib/services";

function dial(phone: string) {
  Linking.openURL(`tel:${phone}`).catch(() => {
    Alert.alert("Could not open the phone", `Dial ${phone} yourself.`);
  });
}

export default function HelpScreen() {
  const { userLocation, reportHazard } = useApp();
  const radio = useRadio();
  const guessed = userLocation ? guessState(userLocation.latitude, userLocation.longitude) : "WA";
  const [state, setState] = useState<AuState>(guessed);
  const [picked, setPicked] = useState(false);
  useEffect(() => {
    if (!picked && userLocation) setState(guessState(userLocation.latitude, userLocation.longitude));
  }, [picked, userLocation]);
  const club = useMemo(() => clubFor(state), [state]);

  const maps = (query: string) => {
    const lat = userLocation?.latitude;
    const lng = userLocation?.longitude;
    const url = lat == null || lng == null
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
      : `https://www.google.com/maps/search/${encodeURIComponent(query)}/@${lat},${lng},13z`;
    Linking.openURL(url).catch(() => Alert.alert("Could not open maps"));
  };

  const textLocation = () => {
    if (!userLocation) {
      Alert.alert("No fix yet", "Wait until the GPS has a position, then try again.");
      return;
    }
    const link = `https://maps.google.com/?q=${userLocation.latitude},${userLocation.longitude}`;
    const body = encodeURIComponent(`I need help on the road. My location: ${link}`);
    Linking.openURL(`sms:?body=${body}`).catch(() => Alert.alert("Could not open messages", link));
  };

  const dropPin = (kind: "breakdown" | "accident") => {
    if (!userLocation) {
      Alert.alert("No fix yet", "The pin needs your GPS position.");
      return;
    }
    const note = kind === "breakdown" ? "Vehicle broken down. Driver is getting help." : "Accident. Driver is getting help.";
    reportHazard(kind, note, userLocation.latitude, userLocation.longitude);
    radio.publishHazard(kind, note, userLocation.latitude, userLocation.longitude, `hazard-${Date.now()}`);
    Alert.alert("Pin dropped", "Other drivers on your relay can see it. It expires in an hour.");
  };

  const accuracy = userLocation?.accuracyM;
  const where = userLocation
    ? `${userLocation.latitude.toFixed(5)}, ${userLocation.longitude.toFixed(5)}${accuracy != null ? ` · ±${Math.round(accuracy)} m` : ""}`
    : "Waiting for GPS";

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>‹ Back to the map</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Roadside help</Text>
        <Text style={styles.lead}>
          Pull over, hazards on, out of the lane if you can. These buttons open your phone or maps. The app does not book a truck or call anyone by itself.
        </Text>

        <View style={styles.where}>
          <Text style={styles.whereLabel}>Your position</Text>
          <Text style={styles.whereValue}>{where}</Text>
        </View>

        <TouchableOpacity
          style={styles.emergency}
          onPress={() =>
            Alert.alert("Call 000?", "Use this if someone is hurt, there is a fire, or you are in danger.", [
              { text: "Not now", style: "cancel" },
              { text: "Call 000", style: "destructive", onPress: () => dial("000") },
            ])
          }
        >
          <Text style={styles.emergencyTitle}>Call 000</Text>
          <Text style={styles.emergencySub}>Ambulance, fire, police. Emergencies only.</Text>
        </TouchableOpacity>

        <Text style={styles.section}>Which state are you in?</Text>
        <Text style={styles.hint}>Guessed from the GPS fix. Change it if the border is wrong.</Text>
        <View style={styles.states}>
          {AU_STATES.map((code) => (
            <TouchableOpacity key={code} style={[styles.stateChip, state === code && styles.stateChipOn]} onPress={() => { setPicked(true); setState(code); }}>
              <Text style={[styles.stateText, state === code && styles.stateTextOn]}>{code}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.row} onPress={() => dial(club.phone)}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Call {club.club} roadside</Text>
            <Text style={styles.rowSub}>{club.region} · {club.phoneLabel}. A membership or a call-out fee can apply.</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.row} onPress={() => maps("tow truck")}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Tow trucks nearby</Text>
            <Text style={styles.rowSub}>Opens maps around your fix. You call them yourself.</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.row} onPress={() => maps("mobile mechanic")}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Mobile mechanics nearby</Text>
            <Text style={styles.rowSub}>Opens maps. This is not a booking.</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.row} onPress={() => dial("131444")}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Police assistance 131 444</Text>
            <Text style={styles.rowSub}>Non-urgent. If it is an emergency, use 000.</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.row} onPress={() => dial("132500")}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>SES 132 500</Text>
            <Text style={styles.rowSub}>Flood, storm, or a tree down. Not a substitute for 000.</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.row} onPress={textLocation}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Text someone my location</Text>
            <Text style={styles.rowSub}>Opens a message with a maps link. You choose who.</Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.section}>Tell other drivers</Text>
        <View style={styles.pair}>
          <TouchableOpacity style={styles.pin} onPress={() => dropPin("breakdown")}>
            <Text style={styles.pinText}>Breakdown pin</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pin} onPress={() => dropPin("accident")}>
            <Text style={styles.pinText}>Accident pin</Text>
          </TouchableOpacity>
        </View>
        {Platform.OS === "web" && <Text style={styles.hint}>Phone links need the Android app. Maps still opens here.</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#090B10" },
  content: { padding: 16, paddingBottom: 40 },
  back: { marginBottom: 8 },
  backText: { color: "#E4B15A", fontWeight: "700" },
  title: { color: "#F4F0E6", fontSize: 28, fontWeight: "800" },
  lead: { color: "#9AA3B2", marginTop: 6, lineHeight: 20 },
  where: { marginTop: 14, backgroundColor: "#12151C", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#2A3140" },
  whereLabel: { color: "#9AA3B2", fontSize: 12, fontWeight: "700" },
  whereValue: { color: "#F4F0E6", marginTop: 4, fontWeight: "700" },
  emergency: { marginTop: 14, backgroundColor: "#991B1B", borderRadius: 14, padding: 16 },
  emergencyTitle: { color: "#FFF", fontSize: 22, fontWeight: "800" },
  emergencySub: { color: "#FECACA", marginTop: 4 },
  section: { color: "#F4F0E6", fontWeight: "800", marginTop: 18, marginBottom: 4 },
  hint: { color: "#9AA3B2", fontSize: 12, marginBottom: 8 },
  states: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  stateChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: "#12151C", borderWidth: 1, borderColor: "#2A3140" },
  stateChipOn: { backgroundColor: "#E4B15A", borderColor: "#E4B15A" },
  stateText: { color: "#E2E8F0", fontWeight: "800" },
  stateTextOn: { color: "#090B10" },
  row: { marginTop: 10, backgroundColor: "#12151C", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#2A3140" },
  rowTitle: { color: "#F4F0E6", fontWeight: "800", fontSize: 16 },
  rowSub: { color: "#9AA3B2", marginTop: 4, lineHeight: 18 },
  pair: { flexDirection: "row", gap: 8 },
  pin: { flex: 1, backgroundColor: "#090B10", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#E4B15A", alignItems: "center" },
  pinText: { color: "#E4B15A", fontWeight: "800" },
});
