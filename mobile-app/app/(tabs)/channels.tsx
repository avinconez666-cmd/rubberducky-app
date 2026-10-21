import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useApp, Channel } from "@/contexts/AppContext";

// ─── Create Group Modal ───────────────────────────────────────────────────────
function CreateGroupModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { createChannel } = useApp();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [radius, setRadius] = useState(2000);
  const [error, setError] = useState("");

  const RADIUS_OPTIONS = [
    { label: "500 m", value: 500 },
    { label: "1 km", value: 1000 },
    { label: "2 km", value: 2000 },
    { label: "5 km", value: 5000 },
  ];

  const handleCreate = () => {
    if (!name.trim()) {
      setError("Please enter a group name.");
      return;
    }
    createChannel(name.trim(), description.trim() || "Custom group", radius);
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setName("");
    setDescription("");
    setRadius(2000);
    setError("");
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalContainer}
      >
        <SafeAreaView style={styles.modalInner} edges={["top", "bottom"]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create Group Channel</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled">
            <View style={styles.modalBody}>
              <Text style={styles.fieldLabel}>Group Name *</Text>
              <TextInput
                style={styles.fieldInput}
                value={name}
                onChangeText={(t) => { setName(t); setError(""); }}
                placeholder="e.g. Sydney Convoy, Road Trip Crew..."
                placeholderTextColor="#475569"
                maxLength={30}
                autoCapitalize="words"
              />
              {error ? <Text style={styles.fieldError}>{error}</Text> : null}

              <Text style={styles.fieldLabel}>Description</Text>
              <TextInput
                style={[styles.fieldInput, styles.fieldInputMulti]}
                value={description}
                onChangeText={setDescription}
                placeholder="What's this group for?"
                placeholderTextColor="#475569"
                maxLength={100}
                multiline
                numberOfLines={3}
              />

              <Text style={styles.fieldLabel}>Broadcast Radius</Text>
              <View style={styles.radiusRow}>
                {RADIUS_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.radiusChip, radius === opt.value && styles.radiusChipActive]}
                    onPress={() => setRadius(opt.value)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.radiusChipText, radius === opt.value && styles.radiusChipTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.createBtn} onPress={handleCreate} activeOpacity={0.85}>
                <Text style={styles.createBtnText}>📻  Create Channel</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Channel Card ─────────────────────────────────────────────────────────────
function ChannelCard({ channel }: { channel: Channel }) {
  const { activeChannel, setActiveChannel, joinChannel, leaveChannel } = useApp();
  const isActive = activeChannel?.id === channel.id;
  const isSystem = channel.type === "public" || channel.type === "emergency";

  const handleToggle = () => {
    if (!channel.isJoined) {
      joinChannel(channel.id);
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else if (!isSystem) {
      leaveChannel(channel.id);
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleActivate = () => {
    if (channel.isJoined) {
      setActiveChannel(channel);
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const typeLabel = channel.type === "public" ? "Public" : channel.type === "emergency" ? "Emergency" : "Custom";
  const radiusLabel = channel.radius >= 1000 ? `${channel.radius / 1000} km` : `${channel.radius} m`;

  return (
    <TouchableOpacity
      style={[styles.channelCard, isActive && styles.channelCardActive]}
      onPress={handleActivate}
      activeOpacity={0.8}
    >
      <View style={[styles.channelCardAccent, { backgroundColor: channel.color }]} />
      <View style={styles.channelCardBody}>
        <View style={styles.channelCardTop}>
          <View style={styles.channelCardLeft}>
            <Text style={styles.channelCardName}>{channel.name}</Text>
            <View style={styles.channelCardMeta}>
              <View style={[styles.typeBadge, { backgroundColor: channel.color + "33" }]}>
                <Text style={[styles.typeBadgeText, { color: channel.color }]}>{typeLabel}</Text>
              </View>
              <Text style={styles.channelCardRadius}>📡 {radiusLabel}</Text>
            </View>
          </View>
          {isActive && (
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>ACTIVE</Text>
            </View>
          )}
        </View>
        <Text style={styles.channelCardDesc}>{channel.description}</Text>
        <View style={styles.channelCardFooter}>
          <Text style={styles.channelCardMembers}>On this phone</Text>
          {!isSystem && (
            <TouchableOpacity
              style={[styles.joinBtn, channel.isJoined && styles.leaveBtn]}
              onPress={handleToggle}
              activeOpacity={0.7}
            >
              <Text style={[styles.joinBtnText, channel.isJoined && styles.leaveBtnText]}>
                {channel.isJoined ? "Leave" : "Join"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Channels Screen ──────────────────────────────────────────────────────────
export default function ChannelsScreen() {
  const { channels } = useApp();
  const [showCreate, setShowCreate] = useState(false);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Channels</Text>
          <Text style={styles.headerSub}>{channels.length} available</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowCreate(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.addBtnText}>+ New Group</Text>
        </TouchableOpacity>
      </View>

      {/* Channel list */}
      <FlatList
        data={channels}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => <ChannelCard channel={item} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Text style={styles.sectionLabel}>All Channels</Text>
        }
      />

      <CreateGroupModal visible={showCreate} onClose={() => setShowCreate(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#090B10",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#12151C",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#F4F0E6",
  },
  headerSub: {
    fontSize: 12,
    color: "#7E8796",
    marginTop: 2,
  },
  addBtn: {
    backgroundColor: "#E4B15A",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#090B10",
  },
  list: {
    padding: 16,
    gap: 12,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  channelCard: {
    flexDirection: "row",
    backgroundColor: "#12151C",
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#2A3140",
    marginBottom: 10,
  },
  channelCardActive: {
    borderColor: "#E4B15A",
    backgroundColor: "#1C2A1A",
  },
  channelCardAccent: {
    width: 4,
  },
  channelCardBody: {
    flex: 1,
    padding: 14,
    gap: 6,
  },
  channelCardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  channelCardLeft: {
    flex: 1,
    gap: 4,
  },
  channelCardName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F4F0E6",
  },
  channelCardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  typeBadge: {
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  channelCardRadius: {
    fontSize: 11,
    color: "#7E8796",
  },
  activeBadge: {
    backgroundColor: "#E4B15A",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#090B10",
    letterSpacing: 0.5,
  },
  channelCardDesc: {
    fontSize: 13,
    color: "#9AA3B2",
    lineHeight: 18,
  },
  channelCardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  channelCardMembers: {
    fontSize: 12,
    color: "#7E8796",
  },
  joinBtn: {
    backgroundColor: "#1D4ED8",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  leaveBtn: {
    backgroundColor: "#374151",
  },
  joinBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#F4F0E6",
  },
  leaveBtnText: {
    color: "#9AA3B2",
  },
  // ── Modal ──
  modalContainer: {
    flex: 1,
    backgroundColor: "#090B10",
  },
  modalInner: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#12151C",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#F4F0E6",
  },
  modalClose: {
    fontSize: 18,
    color: "#7E8796",
    padding: 4,
  },
  modalBody: {
    padding: 20,
    gap: 6,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#CBD5E1",
    marginBottom: 6,
    marginTop: 12,
  },
  fieldInput: {
    backgroundColor: "#12151C",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#F4F0E6",
    borderWidth: 1,
    borderColor: "#2A3140",
  },
  fieldInputMulti: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  fieldError: {
    color: "#EF4444",
    fontSize: 12,
    marginTop: 4,
  },
  radiusRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    marginTop: 4,
  },
  radiusChip: {
    backgroundColor: "#12151C",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: "#2A3140",
  },
  radiusChipActive: {
    borderColor: "#E4B15A",
    backgroundColor: "#1C2A1A",
  },
  radiusChipText: {
    fontSize: 13,
    color: "#9AA3B2",
    fontWeight: "600",
  },
  radiusChipTextActive: {
    color: "#E4B15A",
  },
  createBtn: {
    backgroundColor: "#E4B15A",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 24,
  },
  createBtnText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#090B10",
  },
});
