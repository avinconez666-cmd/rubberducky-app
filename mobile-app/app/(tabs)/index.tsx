// Re-export from the actual map screen file to avoid duplicate
// The map screen is defined in this file directly
import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import * as FileSystem from "expo-file-system/legacy";
import { useRadio } from "@/contexts/RadioContext";
import { nearestCameras } from "@/lib/cameras";
import { haversineMeters, insideHomeBubble } from "@/lib/geo";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Platform,
  Animated,
  Pressable,
  KeyboardAvoidingView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useAudioPlayer, useAudioRecorder, RecordingPresets, setAudioModeAsync, requestRecordingPermissionsAsync } from "expo-audio";
import { useApp, Message } from "@/contexts/AppContext";
import { router } from "expo-router";
import { LiveMap } from "@/components/LiveMap";
import { QuickReport } from "@/components/QuickReport";
import { playSfx } from "@/lib/sfx";

// ─── Message bubble ───────────────────────────────────────────────────────────
function MessageBubble({ msg }: { msg: Message }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const shift = useRef(new Animated.Value(10)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 240, useNativeDriver: true }),
      Animated.timing(shift, { toValue: 0, duration: 240, useNativeDriver: true }),
    ]).start();
  }, [opacity, shift]);
  return (
    <Animated.View style={[styles.msgBubble, msg.isOwn && styles.msgBubbleOwn, { opacity, transform: [{ translateY: shift }] }]}>
      {!msg.isOwn && (
        <Text style={styles.msgSender}>{msg.senderName}</Text>
      )}
      {msg.type === "voice" ? (
        <VoiceClip label={msg.content} uri={msg.audioUri} />
      ) : (
        <Text style={[styles.msgText, msg.isOwn && styles.msgTextOwn]}>{msg.content}</Text>
      )}
      <Text style={styles.msgTime}>
        {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </Text>
    </Animated.View>
  );
}

function VoiceClip({ label, uri }: { label: string; uri?: string }) {
  const player = useAudioPlayer(uri ? { uri } : null);
  return (
    <TouchableOpacity
      style={styles.voiceMsg}
      disabled={!uri}
      onPress={() => {
        if (!uri) return;
        player.seekTo(0);
        player.play();
      }}
      activeOpacity={0.7}
    >
      <Text style={styles.voiceIcon}>🎙️</Text>
      <Text style={styles.voiceLabel}>{uri ? `${label} · tap to play` : label}</Text>
    </TouchableOpacity>
  );
}

// ─── Channel selector sheet ───────────────────────────────────────────────────
function ChannelSheet({ onClose }: { onClose: () => void }) {
  const { channels, activeChannel, setActiveChannel } = useApp();
  const rise = useRef(new Animated.Value(28)).current;
  useEffect(() => {
    Animated.spring(rise, { toValue: 0, useNativeDriver: true, friction: 8 }).start();
  }, [rise]);
  return (
    <Animated.View style={[styles.channelSheet, { transform: [{ translateY: rise }] }]}>
      <View style={styles.channelSheetHandle} />
      <Text style={styles.channelSheetTitle}>Select Channel</Text>
      {channels.filter((c) => c.isJoined).map((ch) => (
        <TouchableOpacity
          key={ch.id}
          style={[
            styles.channelItem,
            activeChannel?.id === ch.id && styles.channelItemActive,
          ]}
          onPress={() => {
            setActiveChannel(ch);
            playSfx("key");
            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onClose();
          }}
          activeOpacity={0.7}
        >
          <View style={[styles.channelDot, { backgroundColor: ch.color }]} />
          <View style={styles.channelInfo}>
            <Text style={styles.channelName}>{ch.name}</Text>
            <Text style={styles.channelDesc}>{ch.description}</Text>
          </View>
          {activeChannel?.id === ch.id && (
            <Text style={styles.channelCheck}>✓</Text>
          )}
        </TouchableOpacity>
      ))}
      <TouchableOpacity style={styles.channelCloseBtn} onPress={onClose} activeOpacity={0.7}>
        <Text style={styles.channelCloseTxt}>Close</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Main Map Screen ──────────────────────────────────────────────────────────
export default function MapScreen() {
  const {
    user,
    activeChannel,
    messages,
    nearbyDrivers,
    practiceMode,
    isSafetyMode,
    currentSpeed,
    sendTextMessage,
    addVoiceMessage,
    hazards,
    userLocation,
    roadAlert,
    isConnected,
  } = useApp();
  const radio = useRadio();
  const recorder = useAudioRecorder(RecordingPresets.LOW_QUALITY);
  const [textInput, setTextInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [showChannelSheet, setShowChannelSheet] = useState(false);
  const [radioOpen, setRadioOpen] = useState(false);
  const [barHeight, setBarHeight] = useState(88);
  const [reportMode, setReportMode] = useState<"hazard" | "mobile" | null>(null);
  const recordingTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const secondsRef = useRef(0);
  const recordingRef = useRef(false);
  const pttAnim = useRef(new Animated.Value(1)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const listRef = useRef<FlatList>(null);
  const endRef = useRef<() => void>(() => {});
  const heard = useRef<string | null>(null);
  const armedSafety = useRef(false);

  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!last) return;
    if (heard.current && heard.current !== last.id && !last.isOwn) playSfx("rx");
    heard.current = last.id;
  }, [messages]);

  useEffect(() => {
    if (!armedSafety.current) {
      armedSafety.current = true;
      return;
    }
    if (isSafetyMode) playSfx("safety");
  }, [isSafetyMode]);

  useEffect(() => {
    if (!isRecording) {
      pulse.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 650, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.2, duration: 650, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [isRecording, pulse]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const handlePTTEnd = useCallback(async () => {
    if (!recordingRef.current) return;
    recordingRef.current = false;
    if (recordingTimer.current) clearInterval(recordingTimer.current);
    setIsRecording(false);
    Animated.spring(pttAnim, { toValue: 1, useNativeDriver: true }).start();
    try {
      await recorder.stop();
    } catch {
      // already stopped
    }
    const secs = secondsRef.current;
    const uri = recorder.uri ?? undefined;
    radio.announceTx(false);
    if (secs > 0) playSfx("txOff");
    if (secs > 0) {
      addVoiceMessage(`Voice clip (${secs}s)`, uri);
      const room = activeChannel?.id === "public" || activeChannel?.id === "convoy";
      if (uri && room) {
        try {
          const b64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
          if (b64.length > 0 && b64.length < 280000) radio.broadcastVoice(b64, secs);
        } catch {
          // local clip still plays
        }
      }
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setRecordingSeconds(0);
    secondsRef.current = 0;
  }, [addVoiceMessage, pttAnim, recorder, radio, activeChannel?.id]);

  endRef.current = () => {
    void handlePTTEnd();
  };

  const handlePTTStart = useCallback(async () => {
    if (recordingRef.current) return;
    try {
      const perm = await requestRecordingPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Microphone", "Allow the microphone to record a push-to-talk clip. Clips stay on this phone.");
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
    } catch {
      Alert.alert("Microphone", "Could not start recording.");
      return;
    }
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    playSfx("txOn");
    recordingRef.current = true;
    radio.announceTx(true);
    secondsRef.current = 0;
    setIsRecording(true);
    setRecordingSeconds(0);
    Animated.spring(pttAnim, { toValue: 0.88, useNativeDriver: true }).start();
    recordingTimer.current = setInterval(() => {
      secondsRef.current += 1;
      setRecordingSeconds(secondsRef.current);
      if (secondsRef.current >= 30) endRef.current();
    }, 1000);
  }, [pttAnim, recorder, radio]);

  const handleSendText = useCallback(() => {
    const t = textInput.trim();
    if (!t) return;
    sendTextMessage(t);
    playSfx("key");
    if (activeChannel?.id === "public" || activeChannel?.id === "convoy") radio.broadcastText(t);
    setTextInput("");
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [textInput, sendTextMessage, radio, activeChannel?.id]);

  const radius = user?.proximityRadius ?? 2000;
  const liveNearby = radio.liveDrivers.filter((driver) => {
    if (!userLocation || radius <= 0) return true;
    return haversineMeters(userLocation.latitude, userLocation.longitude, driver.latitude, driver.longitude) <= radius;
  });
  const mapDrivers = isConnected ? liveNearby : practiceMode ? nearbyDrivers : [];
  const channelColor = activeChannel?.color ?? "#22C55E";
  const recentMessages = messages.filter((m) => m.channelId === (activeChannel?.id ?? "public")).slice(-20);
  const cameras = useMemo(() => {
    if (!userLocation) return [];
    return nearestCameras(userLocation.latitude, userLocation.longitude, 10, 20000).map((cam) => ({
      lat: cam.lat,
      lng: cam.lng,
      kind: cam.kind,
      label: `${cam.kind === "redlight" ? "Red-light camera" : "Fixed speed camera"} · ${cam.road}, ${cam.suburb}`,
    }));
  }, [userLocation]);
  const alertLive = roadAlert && roadAlert.until > Date.now() ? roadAlert : null;

  return (
    <View style={styles.container}>
      <LiveMap
        latitude={userLocation?.latitude ?? null}
        longitude={userLocation?.longitude ?? null}
        hazards={hazards}
        drivers={mapDrivers}
        cameras={cameras}
        car={user?.car}
        heading={userLocation?.heading ?? null}
        speed={currentSpeed}
      />

      {/* Top status bar */}
      <SafeAreaView edges={["top"]} style={styles.topBar} pointerEvents="box-none" onLayout={(e) => setBarHeight(e.nativeEvent.layout.height)}>
        <View style={styles.topBarInner} pointerEvents="box-none">
          <TouchableOpacity
            style={[styles.channelPill, { borderColor: channelColor }]}
            onPress={() => setShowChannelSheet(true)}
            activeOpacity={0.8}
          >
            <View style={[styles.channelDotSmall, { backgroundColor: channelColor }]} />
            <Text style={styles.channelPillText} numberOfLines={1}>{activeChannel?.name ?? "Public Nearby"}</Text>
            <Text style={styles.channelPillChevron}>▾</Text>
          </TouchableOpacity>
          <View style={styles.statusPills}>
            <View style={[styles.statusPill, { backgroundColor: isConnected ? "#14532D" : practiceMode ? "#3A2A14" : "#12151C" }]}>
              <View style={[styles.statusDot, { backgroundColor: isConnected ? "#22C55E" : practiceMode ? "#E4B15A" : "#9AA3B2" }]} />
              <Text style={styles.statusText} numberOfLines={1}>{isConnected ? "Live" : practiceMode ? "Practice" : "Off"}</Text>
            </View>
            <View style={styles.statusPill}>
              <Text style={styles.statusText} numberOfLines={1}>
                {insideHomeBubble(userLocation, user?.homeLat, user?.homeLng, user?.homeHideMeters)
                  ? "Hidden near home"
                  : `${currentSpeed} km/h${userLocation?.accuracyM != null ? ` ±${Math.round(userLocation.accuracyM)}m` : ""}`}
              </Text>
            </View>
          </View>
        </View>
      </SafeAreaView>

      <View style={[styles.bannerStack, { top: barHeight + 8 }]} pointerEvents="none">
        {isSafetyMode && (
          <SlideBanner color="#3A2A14">
            <Text style={styles.safetyIcon}>🛡️</Text>
            <Text style={styles.safetyText}>Safety Mode — text is off</Text>
          </SlideBanner>
        )}
        {alertLive && (
          <SlideBanner color="#3A2A14">
            <Text style={styles.safetyIcon}>⚠️</Text>
            <Text style={styles.safetyText}>{alertLive.title}</Text>
          </SlideBanner>
        )}
        {radio.onAir && (
          <SlideBanner color="#6B2420">
            <Text style={styles.safetyIcon}>🎙️</Text>
            <Text style={styles.safetyText}>{radio.onAir} is on the mic</Text>
          </SlideBanner>
        )}
      </View>

      {recentMessages.length > 0 && (
        <TouchableOpacity style={styles.lastChip} onPress={() => setRadioOpen(true)} activeOpacity={0.85}>
          <Text style={styles.lastChipText} numberOfLines={1}>
            {recentMessages[recentMessages.length - 1].senderName}: {recentMessages[recentMessages.length - 1].type === "voice" ? "voice clip" : recentMessages[recentMessages.length - 1].content}
          </Text>
        </TouchableOpacity>
      )}

      <View style={styles.fabCol} pointerEvents="box-none">
        <TouchableOpacity style={[styles.fab, styles.fabHelp]} onPress={() => router.push("/help")}>
          <Text style={styles.fabText}>Help</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => (isSafetyMode ? Alert.alert("Pull over", "Stop the vehicle before you report a hazard.") : setReportMode("hazard"))}
        >
          <Text style={styles.fabText}>Pin</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => (isSafetyMode ? Alert.alert("Pull over", "Stop the vehicle before you pin a camera.") : setReportMode("mobile"))}
        >
          <Text style={styles.fabText}>Cam</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.fab} onPress={() => setRadioOpen(true)}>
          <Text style={styles.fabText}>Chat</Text>
        </TouchableOpacity>
        <Animated.View style={[styles.pttWrap, { transform: [{ scale: pttAnim }] }]}>
          {isRecording && (
            <Animated.View
              pointerEvents="none"
              style={[styles.pttRing, { opacity: pulse, transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] }) }] }]}
            />
          )}
          <Pressable
            style={({ pressed }) => [
              styles.pttButton,
              isRecording && styles.pttButtonActive,
              pressed && styles.pttButtonPressed,
            ]}
            onPressIn={handlePTTStart}
            onPressOut={handlePTTEnd}
          >
            <Text style={styles.pttIcon}>{isRecording ? "🔴" : "🎙️"}</Text>
            <Text style={styles.pttLabel}>{isRecording ? `${recordingSeconds}s` : "PTT"}</Text>
          </Pressable>
        </Animated.View>
      </View>

      {radioOpen && (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.sheetOverlay}>
          <Pressable style={{ flex: 1 }} onPress={() => setRadioOpen(false)} />
          <View style={styles.radioSheet}>
            <View style={styles.messageFeed}>
              <FlatList
                ref={listRef}
                data={recentMessages}
                keyExtractor={(m) => m.id}
                renderItem={({ item }) => <MessageBubble msg={item} />}
                contentContainerStyle={styles.messageList}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={<Text style={styles.emptyMsg}>Hold PTT to talk. Text from here when you are stopped.</Text>}
              />
            </View>
            <View style={styles.inputRow}>
              <View style={styles.textInputWrapper}>
                <TextInput
                  style={[styles.textInput, isSafetyMode && styles.textInputDisabled]}
                  value={textInput}
                  onChangeText={setTextInput}
                  placeholder={isSafetyMode ? "Voice only while moving" : "Type a message..."}
                  placeholderTextColor="#475569"
                  editable={!isSafetyMode}
                  returnKeyType="send"
                  onSubmitEditing={handleSendText}
                />
                {!isSafetyMode && textInput.trim().length > 0 && (
                  <TouchableOpacity style={styles.sendBtn} onPress={handleSendText} activeOpacity={0.7}>
                    <Text style={styles.sendBtnText}>➤</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      )}

      <QuickReport mode={reportMode} onClose={() => setReportMode(null)} />

      {showChannelSheet && (
        <Pressable style={styles.sheetOverlay} onPress={() => setShowChannelSheet(false)}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            <ChannelSheet onClose={() => setShowChannelSheet(false)} />
          </Pressable>
        </Pressable>
      )}
    </View>
  );
}

function SlideBanner({ color, children }: { color: string; children: React.ReactNode }) {
  const y = useRef(new Animated.Value(-16)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(y, { toValue: 0, duration: 220, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
  }, [opacity, y]);
  return (
    <Animated.View style={[styles.safetyBanner, { backgroundColor: color, opacity, transform: [{ translateY: y }] }]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#090B10" },
  mapBg: { ...StyleSheet.absoluteFillObject, backgroundColor: "#0D1B2A", overflow: "hidden" },
  roadH: { position: "absolute", left: 0, right: 0, height: 1, backgroundColor: "#1E3A5F" },
  roadV: { position: "absolute", top: 0, bottom: 0, width: 1, backgroundColor: "#1E3A5F" },
  mainRoad: { height: 3, backgroundColor: "#1E4080" },
  centerDot: { position: "absolute", top: "50%", left: "50%", transform: [{ translateX: -20 }, { translateY: -36 }], alignItems: "center" },
  centerDotText: { fontSize: 28 },
  centerDotLabel: { fontSize: 11, color: "#E4B15A", fontWeight: "700", marginTop: 2 },
  driverMarker: { position: "absolute", alignItems: "center" },
  driverBubble: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#12151C", borderWidth: 2, borderColor: "#3B82F6", alignItems: "center", justifyContent: "center" },
  driverEmoji: { fontSize: 20 },
  driverLabel: { backgroundColor: "rgba(9,11,16,0.85)", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, marginTop: 3, maxWidth: 80 },
  driverName: { fontSize: 10, color: "#CBD5E1", fontWeight: "600", textAlign: "center" },
  topBar: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 10 },
  topBarInner: { gap: 8, paddingHorizontal: 12, paddingTop: 8 },
  channelPill: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", maxWidth: "78%", backgroundColor: "rgba(9,11,16,0.88)", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1.5, gap: 6 },
  channelDotSmall: { width: 8, height: 8, borderRadius: 4 },
  channelPillText: { flexShrink: 1, fontSize: 13, fontWeight: "700", color: "#F4F0E6" },
  channelPillChevron: { fontSize: 12, color: "#9AA3B2" },
  statusPills: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  statusPill: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(9,11,16,0.88)", borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4, gap: 4, maxWidth: "100%" },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { flexShrink: 1, fontSize: 11, color: "#CBD5E1", fontWeight: "600" },
  bannerStack: { position: "absolute", left: 12, right: 88, zIndex: 10, gap: 8 },
  lastChip: { position: "absolute", left: 12, bottom: 16, maxWidth: "68%", zIndex: 10, backgroundColor: "rgba(9,11,16,0.88)", borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: "#2A3140" },
  lastChipText: { color: "#F4F0E6", fontSize: 13, fontWeight: "600" },
  fabCol: { position: "absolute", right: 12, bottom: 16, zIndex: 12, alignItems: "center", gap: 8 },
  fab: { minWidth: 52, backgroundColor: "rgba(9,11,16,0.9)", borderRadius: 16, paddingHorizontal: 8, paddingVertical: 8, borderWidth: 1, borderColor: "#2A3140", alignItems: "center" },
  fabHelp: { backgroundColor: "#3A2A14", borderColor: "#E4B15A" },
  fabText: { color: "#F4F0E6", fontWeight: "800", fontSize: 11 },
  radioSheet: { backgroundColor: "#12151C", borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 8 },
  safetyBanner: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: "#E4B15A" },
  safetyIcon: { fontSize: 16 },
  safetyText: { fontSize: 13, color: "#FDE68A", fontWeight: "700", flex: 1 },
  messageFeed: { maxHeight: 280, paddingTop: 8 },
  messageList: { paddingHorizontal: 12, paddingBottom: 4 },
  emptyMsg: { color: "#475569", fontSize: 13, textAlign: "center", paddingVertical: 16, lineHeight: 20 },
  msgBubble: { backgroundColor: "#12151C", borderRadius: 10, padding: 8, marginBottom: 6, maxWidth: "85%", alignSelf: "flex-start" },
  msgBubbleOwn: { backgroundColor: "#1C3A2A", alignSelf: "flex-end", borderWidth: 1, borderColor: "#22C55E" },
  msgSender: { fontSize: 11, color: "#E4B15A", fontWeight: "700", marginBottom: 2 },
  msgText: { fontSize: 13, color: "#E2E8F0", lineHeight: 18 },
  msgTextOwn: { color: "#BBF7D0" },
  msgTime: { fontSize: 10, color: "#475569", marginTop: 3, alignSelf: "flex-end" },
  voiceMsg: { flexDirection: "row", alignItems: "center", gap: 6 },
  voiceIcon: { fontSize: 16 },
  voiceLabel: { flexShrink: 1, fontSize: 13, color: "#9AA3B2", fontStyle: "italic" },
  inputRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingTop: 10, paddingBottom: 10, gap: 10, backgroundColor: "rgba(9,11,16,0.95)", borderTopWidth: 1, borderTopColor: "#12151C" },
  textInputWrapper: { flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: "#12151C", borderRadius: 22, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: "#2A3140" },
  textInput: { flex: 1, fontSize: 14, color: "#F4F0E6", maxHeight: 80 },
  textInputDisabled: { opacity: 0.4 },
  sendBtn: { marginLeft: 8, width: 32, height: 32, borderRadius: 16, backgroundColor: "#22C55E", alignItems: "center", justifyContent: "center" },
  sendBtnText: { fontSize: 14, color: "#090B10", fontWeight: "800" },
  pttButton: { width: 68, height: 68, borderRadius: 34, backgroundColor: "#16120C", borderWidth: 2, borderColor: "#E4B15A", alignItems: "center", justifyContent: "center", gap: 1 },
  pttWrap: { width: 68, height: 68, alignItems: "center", justifyContent: "center" },
  pttRing: { position: "absolute", width: 68, height: 68, borderRadius: 34, borderWidth: 2, borderColor: "#E4B15A" },
  pttButtonActive: { backgroundColor: "#6B2420", borderColor: "#E06A62" },
  pttButtonPressed: { opacity: 0.85 },
  pttIcon: { fontSize: 22 },
  pttLabel: { fontSize: 10, color: "#9AA3B2", fontWeight: "700" },
  sheetOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 50, justifyContent: "flex-end" },
  channelSheet: { backgroundColor: "#12151C", borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 20, paddingBottom: 32, paddingTop: 12 },
  channelSheetHandle: { width: 40, height: 4, backgroundColor: "#2A3140", borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  channelSheetTitle: { fontSize: 17, fontWeight: "800", color: "#F4F0E6", marginBottom: 16 },
  channelItem: { flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#2A3140", gap: 12 },
  channelItemActive: { backgroundColor: "rgba(228,177,90,0.1)", borderRadius: 10, paddingHorizontal: 8 },
  channelDot: { width: 12, height: 12, borderRadius: 6 },
  channelInfo: { flex: 1 },
  channelName: { fontSize: 15, fontWeight: "700", color: "#F4F0E6" },
  channelDesc: { fontSize: 12, color: "#7E8796", marginTop: 2 },
  channelCheck: { fontSize: 18, color: "#E4B15A", fontWeight: "800" },
  channelCloseBtn: { marginTop: 16, backgroundColor: "#2A3140", borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  channelCloseTxt: { fontSize: 15, color: "#9AA3B2", fontWeight: "700" },
  hazardMarker: { position: "absolute", alignItems: "center", justifyContent: "center", zIndex: 8 },
  hazardEmoji: { fontSize: 24 },
});
