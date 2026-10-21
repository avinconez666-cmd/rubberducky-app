// Re-export from the actual map screen file to avoid duplicate
// The map screen is defined in this file directly
import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import * as FileSystem from "expo-file-system/legacy";
import { useRadio } from "@/contexts/RadioContext";
import { nearestCameras } from "@/lib/cameras";
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
  Dimensions,
  Alert,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useAudioPlayer, useAudioRecorder, RecordingPresets, setAudioModeAsync, requestRecordingPermissionsAsync } from "expo-audio";
import { useApp, Message } from "@/contexts/AppContext";
import { router } from "expo-router";
import { LiveMap } from "@/components/LiveMap";
import { QuickReport } from "@/components/QuickReport";
import { playSfx } from "@/lib/sfx";

const { height: SCREEN_H } = Dimensions.get("window");

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

  const insets = useSafeAreaInsets();
  const recorder = useAudioRecorder(RecordingPresets.LOW_QUALITY);
  const [textInput, setTextInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [showChannelSheet, setShowChannelSheet] = useState(false);
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
        drivers={practiceMode ? nearbyDrivers : []}
        cameras={cameras}
        paint={user?.car?.paint}
      />

      {/* Top status bar */}
      <SafeAreaView edges={["top"]} style={styles.topBar}>
        <View style={styles.topBarInner}>
          <TouchableOpacity
            style={[styles.channelPill, { borderColor: channelColor }]}
            onPress={() => setShowChannelSheet(true)}
            activeOpacity={0.8}
          >
            <View style={[styles.channelDotSmall, { backgroundColor: channelColor }]} />
            <Text style={styles.channelPillText}>{activeChannel?.name ?? "Public Nearby"}</Text>
            <Text style={styles.channelPillChevron}>▾</Text>
          </TouchableOpacity>
          <View style={styles.statusPills}>
            <View style={[styles.statusPill, { backgroundColor: isConnected ? "#14532D" : practiceMode ? "#3A2A14" : "#12151C" }]}>
              <View style={[styles.statusDot, { backgroundColor: isConnected ? "#22C55E" : practiceMode ? "#E4B15A" : "#9AA3B2" }]} />
              <Text style={styles.statusText}>{isConnected ? "Live room" : practiceMode ? "Practice" : "Relay off"}</Text>
            </View>
            <View style={styles.statusPill}>
              <Text style={styles.statusText}>
                {currentSpeed} km/h{userLocation?.accuracyM != null ? ` · ±${Math.round(userLocation.accuracyM)}m` : ""}
              </Text>
            </View>
          </View>
        </View>
      </SafeAreaView>

      {alertLive && (
        <SlideBanner top={80} color="#3A2A14">
          <Text style={styles.safetyIcon}>⚠️</Text>
          <Text style={styles.safetyText}>{alertLive.title} — {alertLive.body}</Text>
        </SlideBanner>
      )}

      {radio.onAir && (
        <SlideBanner top={alertLive ? 132 : 80} color="#6B2420">
          <Text style={styles.safetyIcon}>🎙️</Text>
          <Text style={styles.safetyText}>{radio.onAir} is on the mic</Text>
        </SlideBanner>
      )}

      {isSafetyMode && (
        <SlideBanner top={80} color="#3A2A14">
          <Text style={styles.safetyIcon}>🛡️</Text>
          <Text style={styles.safetyText}>Safety Mode — {currentSpeed} km/h · Text disabled</Text>
        </SlideBanner>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.bottomOverlay}
      >
        <View style={styles.quickRow}>
          <TouchableOpacity style={[styles.quickBtn, styles.quickBtnHelp]} onPress={() => router.push("/help")}>
            <Text style={styles.quickText}>Help</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickBtn}
            onPress={() => (isSafetyMode ? Alert.alert("Pull over", "Stop the vehicle before you report a hazard.") : setReportMode("hazard"))}
          >
            <Text style={styles.quickText}>Road hazard</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickBtn}
            onPress={() => (isSafetyMode ? Alert.alert("Pull over", "Stop the vehicle before you pin a camera.") : setReportMode("mobile"))}
          >
            <Text style={styles.quickText}>Mobile camera</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.messageFeed}>
          <FlatList
            ref={listRef}
            data={recentMessages}
            keyExtractor={(m) => m.id}
            renderItem={({ item }) => <MessageBubble msg={item} />}
            contentContainerStyle={styles.messageList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <Text style={styles.emptyMsg}>
                {isConnected
                  ? "Public room is live. Hold PTT to talk. One mic at a time."
                  : practiceMode
                  ? "Practice channel is on. Sample lines are not real drivers."
                  : "Hold PTT to record. Add a relay in Settings to open the two-way room."}
              </Text>
            }
          />
        </View>
        <View style={[styles.inputRow, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.textInputWrapper}>
            <TextInput
              style={[styles.textInput, isSafetyMode && styles.textInputDisabled]}
              value={textInput}
              onChangeText={setTextInput}
              placeholder={isSafetyMode ? "Safety Mode — voice only" : "Type a message..."}
              placeholderTextColor="#475569"
              editable={!isSafetyMode}
              returnKeyType="send"
              onSubmitEditing={handleSendText}
              multiline={false}
            />
            {!isSafetyMode && textInput.trim().length > 0 && (
              <TouchableOpacity style={styles.sendBtn} onPress={handleSendText} activeOpacity={0.7}>
                <Text style={styles.sendBtnText}>➤</Text>
              </TouchableOpacity>
            )}
          </View>
          <Animated.View style={[styles.pttWrap, { transform: [{ scale: pttAnim }] }]}>
            {isRecording && (
              <Animated.View
                pointerEvents="none"
                style={[styles.pttRing, { opacity: pulse, transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] }) }] }]}
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
              <Text style={styles.pttLabel}>
                {isRecording ? `${recordingSeconds}s` : "PTT"}
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>

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

function SlideBanner({ top, color, children }: { top: number; color: string; children: React.ReactNode }) {
  const y = useRef(new Animated.Value(-16)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(y, { toValue: 0, duration: 220, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
  }, [opacity, y]);
  return (
    <Animated.View style={[styles.safetyBanner, { top, backgroundColor: color, opacity, transform: [{ translateY: y }] }]}>
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
  topBarInner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 8, backgroundColor: "rgba(9,11,16,0.88)", borderBottomWidth: 1, borderBottomColor: "#12151C" },
  channelPill: { flexDirection: "row", alignItems: "center", backgroundColor: "#12151C", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1.5, gap: 6 },
  channelDotSmall: { width: 8, height: 8, borderRadius: 4 },
  channelPillText: { fontSize: 13, fontWeight: "700", color: "#F4F0E6" },
  channelPillChevron: { fontSize: 12, color: "#9AA3B2" },
  statusPills: { flexDirection: "row", gap: 6 },
  statusPill: { flexDirection: "row", alignItems: "center", backgroundColor: "#12151C", borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4, gap: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, color: "#CBD5E1", fontWeight: "600" },
  safetyBanner: { position: "absolute", top: 80, left: 16, right: 16, zIndex: 10, backgroundColor: "#3A2A14", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: "#E4B15A" },
  safetyIcon: { fontSize: 16 },
  safetyText: { fontSize: 13, color: "#FDE68A", fontWeight: "700", flex: 1 },
  bottomOverlay: { position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 10 },
  quickRow: { flexDirection: "row", gap: 8, paddingHorizontal: 12, paddingBottom: 6 },
  quickBtn: { backgroundColor: "rgba(9,11,16,0.92)", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: "#2A3140" },
  quickBtnHelp: { backgroundColor: "#3A2A14", borderColor: "#E4B15A" },
  quickText: { color: "#F4F0E6", fontWeight: "800", fontSize: 12 },
  messageFeed: { maxHeight: SCREEN_H * 0.28, backgroundColor: "rgba(9,11,16,0.82)", borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingTop: 8 },
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
  voiceLabel: { fontSize: 13, color: "#9AA3B2", fontStyle: "italic" },
  inputRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingTop: 10, gap: 10, backgroundColor: "rgba(9,11,16,0.95)", borderTopWidth: 1, borderTopColor: "#12151C" },
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
