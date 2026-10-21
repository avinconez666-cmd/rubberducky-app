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
import { LiveMap } from "@/components/LiveMap";

const { height: SCREEN_H } = Dimensions.get("window");

// ─── Message bubble ───────────────────────────────────────────────────────────
function MessageBubble({ msg }: { msg: Message }) {
  return (
    <View style={[styles.msgBubble, msg.isOwn && styles.msgBubbleOwn]}>
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
    </View>
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
  return (
    <View style={styles.channelSheet}>
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
    </View>
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
  const recordingTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const secondsRef = useRef(0);
  const recordingRef = useRef(false);
  const pttAnim = useRef(new Animated.Value(1)).current;
  const listRef = useRef<FlatList>(null);
  const endRef = useRef<() => void>(() => {});

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
            <View style={[styles.statusPill, { backgroundColor: isConnected ? "#14532D" : practiceMode ? "#78350F" : "#1E293B" }]}>
              <View style={[styles.statusDot, { backgroundColor: isConnected ? "#22C55E" : practiceMode ? "#F59E0B" : "#94A3B8" }]} />
              <Text style={styles.statusText}>{isConnected ? "Live room" : practiceMode ? "Practice" : "Relay off"}</Text>
            </View>
            <View style={styles.statusPill}>
              <Text style={styles.statusText}>{currentSpeed} km/h</Text>
            </View>
          </View>
        </View>
      </SafeAreaView>

      {alertLive && (
        <View style={styles.safetyBanner}>
          <Text style={styles.safetyIcon}>⚠️</Text>
          <Text style={styles.safetyText}>{alertLive.title} — {alertLive.body}</Text>
        </View>
      )}

      {radio.onAir && (
        <View style={[styles.safetyBanner, { top: alertLive ? 132 : 80, backgroundColor: "#7F1D1D" }]}>
          <Text style={styles.safetyIcon}>🎙️</Text>
          <Text style={styles.safetyText}>{radio.onAir} is on the mic</Text>
        </View>
      )}

      {isSafetyMode && (
        <View style={styles.safetyBanner}>
          <Text style={styles.safetyIcon}>🛡️</Text>
          <Text style={styles.safetyText}>Safety Mode — {currentSpeed} km/h · Text disabled</Text>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.bottomOverlay}
      >
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
          <Animated.View style={{ transform: [{ scale: pttAnim }] }}>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A" },
  mapBg: { ...StyleSheet.absoluteFillObject, backgroundColor: "#0D1B2A", overflow: "hidden" },
  roadH: { position: "absolute", left: 0, right: 0, height: 1, backgroundColor: "#1E3A5F" },
  roadV: { position: "absolute", top: 0, bottom: 0, width: 1, backgroundColor: "#1E3A5F" },
  mainRoad: { height: 3, backgroundColor: "#1E4080" },
  centerDot: { position: "absolute", top: "50%", left: "50%", transform: [{ translateX: -20 }, { translateY: -36 }], alignItems: "center" },
  centerDotText: { fontSize: 28 },
  centerDotLabel: { fontSize: 11, color: "#F59E0B", fontWeight: "700", marginTop: 2 },
  driverMarker: { position: "absolute", alignItems: "center" },
  driverBubble: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#1E293B", borderWidth: 2, borderColor: "#3B82F6", alignItems: "center", justifyContent: "center" },
  driverEmoji: { fontSize: 20 },
  driverLabel: { backgroundColor: "rgba(15,23,42,0.85)", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, marginTop: 3, maxWidth: 80 },
  driverName: { fontSize: 10, color: "#CBD5E1", fontWeight: "600", textAlign: "center" },
  topBar: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 10 },
  topBarInner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 8, backgroundColor: "rgba(15,23,42,0.88)", borderBottomWidth: 1, borderBottomColor: "#1E293B" },
  channelPill: { flexDirection: "row", alignItems: "center", backgroundColor: "#1E293B", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1.5, gap: 6 },
  channelDotSmall: { width: 8, height: 8, borderRadius: 4 },
  channelPillText: { fontSize: 13, fontWeight: "700", color: "#F8FAFC" },
  channelPillChevron: { fontSize: 12, color: "#94A3B8" },
  statusPills: { flexDirection: "row", gap: 6 },
  statusPill: { flexDirection: "row", alignItems: "center", backgroundColor: "#1E293B", borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4, gap: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, color: "#CBD5E1", fontWeight: "600" },
  safetyBanner: { position: "absolute", top: 80, left: 16, right: 16, zIndex: 10, backgroundColor: "#92400E", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: "#F59E0B" },
  safetyIcon: { fontSize: 16 },
  safetyText: { fontSize: 13, color: "#FDE68A", fontWeight: "700", flex: 1 },
  bottomOverlay: { position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 10 },
  messageFeed: { maxHeight: SCREEN_H * 0.28, backgroundColor: "rgba(15,23,42,0.82)", borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingTop: 8 },
  messageList: { paddingHorizontal: 12, paddingBottom: 4 },
  emptyMsg: { color: "#475569", fontSize: 13, textAlign: "center", paddingVertical: 16, lineHeight: 20 },
  msgBubble: { backgroundColor: "#1E293B", borderRadius: 10, padding: 8, marginBottom: 6, maxWidth: "85%", alignSelf: "flex-start" },
  msgBubbleOwn: { backgroundColor: "#1C3A2A", alignSelf: "flex-end", borderWidth: 1, borderColor: "#22C55E" },
  msgSender: { fontSize: 11, color: "#F59E0B", fontWeight: "700", marginBottom: 2 },
  msgText: { fontSize: 13, color: "#E2E8F0", lineHeight: 18 },
  msgTextOwn: { color: "#BBF7D0" },
  msgTime: { fontSize: 10, color: "#475569", marginTop: 3, alignSelf: "flex-end" },
  voiceMsg: { flexDirection: "row", alignItems: "center", gap: 6 },
  voiceIcon: { fontSize: 16 },
  voiceLabel: { fontSize: 13, color: "#94A3B8", fontStyle: "italic" },
  inputRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingTop: 10, gap: 10, backgroundColor: "rgba(15,23,42,0.95)", borderTopWidth: 1, borderTopColor: "#1E293B" },
  textInputWrapper: { flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: "#1E293B", borderRadius: 22, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: "#334155" },
  textInput: { flex: 1, fontSize: 14, color: "#F8FAFC", maxHeight: 80 },
  textInputDisabled: { opacity: 0.4 },
  sendBtn: { marginLeft: 8, width: 32, height: 32, borderRadius: 16, backgroundColor: "#22C55E", alignItems: "center", justifyContent: "center" },
  sendBtnText: { fontSize: 14, color: "#0F172A", fontWeight: "800" },
  pttButton: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#1E3A5F", borderWidth: 3, borderColor: "#3B82F6", alignItems: "center", justifyContent: "center", gap: 2 },
  pttButtonActive: { backgroundColor: "#7F1D1D", borderColor: "#EF4444" },
  pttButtonPressed: { opacity: 0.85 },
  pttIcon: { fontSize: 22 },
  pttLabel: { fontSize: 10, color: "#94A3B8", fontWeight: "700" },
  sheetOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 50, justifyContent: "flex-end" },
  channelSheet: { backgroundColor: "#1E293B", borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 20, paddingBottom: 32, paddingTop: 12 },
  channelSheetHandle: { width: 40, height: 4, backgroundColor: "#334155", borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  channelSheetTitle: { fontSize: 17, fontWeight: "800", color: "#F8FAFC", marginBottom: 16 },
  channelItem: { flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#334155", gap: 12 },
  channelItemActive: { backgroundColor: "rgba(245,158,11,0.08)", borderRadius: 10, paddingHorizontal: 8 },
  channelDot: { width: 12, height: 12, borderRadius: 6 },
  channelInfo: { flex: 1 },
  channelName: { fontSize: 15, fontWeight: "700", color: "#F8FAFC" },
  channelDesc: { fontSize: 12, color: "#64748B", marginTop: 2 },
  channelCheck: { fontSize: 18, color: "#F59E0B", fontWeight: "800" },
  channelCloseBtn: { marginTop: 16, backgroundColor: "#334155", borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  channelCloseTxt: { fontSize: 15, color: "#94A3B8", fontWeight: "700" },
  hazardMarker: { position: "absolute", alignItems: "center", justifyContent: "center", zIndex: 8 },
  hazardEmoji: { fontSize: 24 },
});
