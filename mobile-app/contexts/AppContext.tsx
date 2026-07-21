import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Types ───────────────────────────────────────────────────────────────────

export type VehicleType = "car" | "truck" | "motorcycle" | "rv";

export type ChannelType = "public" | "emergency" | "custom";

export interface Channel {
  id: string;
  name: string;
  type: ChannelType;
  description: string;
  memberCount: number;
  radius: number; // meters
  isJoined: boolean;
  color: string;
}

export interface NearbyDriver {
  id: string;
  displayName: string;
  vehicleType: VehicleType;
  latitude: number;
  longitude: number;
  channelId: string;
  lastSeen: number; // timestamp
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  channelId: string;
  type: "text" | "voice";
  content: string; // text content or voice duration label
  timestamp: number;
  isOwn: boolean;
}

export interface UserProfile {
  id: string;
  displayName: string;
  vehicleType: VehicleType;
  isVisible: boolean;
  proximityRadius: number; // meters
  safetySpeedThreshold: number; // km/h
  sessionStartTime: number;
  messagesSent: number;
}

interface AppContextValue {
  // User
  user: UserProfile | null;
  isOnboarded: boolean;
  isHydrated: boolean;
  setUser: (user: UserProfile) => void;
  updateUser: (partial: Partial<UserProfile>) => void;
  completeOnboarding: (name: string, vehicle: VehicleType) => void;
  // Channels
  channels: Channel[];
  activeChannel: Channel | null;
  setActiveChannel: (channel: Channel) => void;
  createChannel: (name: string, description: string, radius: number) => void;
  joinChannel: (channelId: string) => void;
  leaveChannel: (channelId: string) => void;
  // Messages
  messages: Message[];
  sendTextMessage: (content: string) => void;
  addVoiceMessage: (durationLabel: string) => void;
  // Nearby drivers
  nearbyDrivers: NearbyDriver[];
  // Safety mode
  isSafetyMode: boolean;
  currentSpeed: number;
  // Connection
  isConnected: boolean;
}

// ─── Default channels ─────────────────────────────────────────────────────────

const DEFAULT_CHANNELS: Channel[] = [
  {
    id: "public",
    name: "Public Nearby",
    type: "public",
    description: "Open communication with all drivers in range",
    memberCount: 0,
    radius: 2000,
    isJoined: true,
    color: "#22C55E",
  },
  {
    id: "emergency",
    name: "Emergency",
    type: "emergency",
    description: "Priority channel for hazards and emergencies",
    memberCount: 0,
    radius: 10000,
    isJoined: true,
    color: "#EF4444",
  },
];

// ─── Simulated nearby drivers ─────────────────────────────────────────────────

function generateNearbyDrivers(baseLat: number, baseLng: number): NearbyDriver[] {
  const vehicles: VehicleType[] = ["car", "truck", "motorcycle", "rv"];
  const names = ["DustDevil", "RoadRunner", "NightOwl", "TruckerMike", "SunsetRider", "HighwayHank"];
  return Array.from({ length: 4 }, (_, i) => ({
    id: `driver-${i}`,
    displayName: names[i % names.length],
    vehicleType: vehicles[i % vehicles.length],
    latitude: baseLat + (Math.random() - 0.5) * 0.02,
    longitude: baseLng + (Math.random() - 0.5) * 0.02,
    channelId: "public",
    lastSeen: Date.now() - Math.random() * 60000,
  }));
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<UserProfile | null>(null);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [channels, setChannels] = useState<Channel[]>(DEFAULT_CHANNELS);
  const [activeChannel, setActiveChannelState] = useState<Channel>(DEFAULT_CHANNELS[0]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [nearbyDrivers, setNearbyDrivers] = useState<NearbyDriver[]>([]);
  const [isSafetyMode, setIsSafetyMode] = useState(false);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [isConnected, setIsConnected] = useState(true);
  const speedSimRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load persisted state on mount
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem("rubberducky_user");
        if (stored) {
          const parsed: UserProfile = JSON.parse(stored);
          setUserState(parsed);
          setIsOnboarded(true);
          // Simulate nearby drivers around a default location
          setNearbyDrivers(generateNearbyDrivers(-33.8688, 151.2093));
        }
        const storedChannels = await AsyncStorage.getItem("rubberducky_channels");
        if (storedChannels) {
          const parsed: Channel[] = JSON.parse(storedChannels);
          setChannels(parsed);
        }
      } catch (_) {
        // ignore
      } finally {
        setIsHydrated(true);
      }
    })();
  }, []);

  // Simulate speed changes (for safety mode demo)
  useEffect(() => {
    if (!isOnboarded) return;
    speedSimRef.current = setInterval(() => {
      // Simulate occasional speed changes
      const newSpeed = Math.random() > 0.7 ? Math.floor(Math.random() * 80) : 0;
      setCurrentSpeed(newSpeed);
      setIsSafetyMode(newSpeed > (user?.safetySpeedThreshold ?? 10));
    }, 15000);
    return () => {
      if (speedSimRef.current) clearInterval(speedSimRef.current);
    };
  }, [isOnboarded, user?.safetySpeedThreshold]);

  // Simulate incoming messages
  useEffect(() => {
    if (!isOnboarded) return;
    const timer = setInterval(() => {
      if (Math.random() > 0.6) {
        const senders = ["DustDevil", "RoadRunner", "NightOwl", "TruckerMike"];
        const texts = [
          "Kangaroo on the road at the 50km marker, watch out!",
          "Traffic jam ahead, take the bypass.",
          "Anyone know a good servo near the highway?",
          "10-4, copy that. Over.",
          "Speed trap 2km ahead, slow down.",
          "Beautiful sunset out here tonight!",
          "Road works on the main highway, expect delays.",
        ];
        const incoming: Message = {
          id: `msg-${Date.now()}`,
          senderId: `driver-${Math.floor(Math.random() * 4)}`,
          senderName: senders[Math.floor(Math.random() * senders.length)],
          channelId: activeChannel.id,
          type: "text",
          content: texts[Math.floor(Math.random() * texts.length)],
          timestamp: Date.now(),
          isOwn: false,
        };
        setMessages((prev) => [...prev.slice(-49), incoming]);
      }
    }, 20000);
    return () => clearInterval(timer);
  }, [isOnboarded, activeChannel.id]);

  const setUser = useCallback((u: UserProfile) => {
    setUserState(u);
    AsyncStorage.setItem("rubberducky_user", JSON.stringify(u)).catch(() => {});
  }, []);

  const updateUser = useCallback((partial: Partial<UserProfile>) => {
    setUserState((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...partial };
      AsyncStorage.setItem("rubberducky_user", JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }, []);

  const completeOnboarding = useCallback((name: string, vehicle: VehicleType) => {
    const newUser: UserProfile = {
      id: `user-${Date.now()}`,
      displayName: name,
      vehicleType: vehicle,
      isVisible: true,
      proximityRadius: 2000,
      safetySpeedThreshold: 10,
      sessionStartTime: Date.now(),
      messagesSent: 0,
    };
    setUser(newUser);
    setIsOnboarded(true);
    setNearbyDrivers(generateNearbyDrivers(-33.8688, 151.2093));
  }, [setUser]);

  const setActiveChannel = useCallback((channel: Channel) => {
    setActiveChannelState(channel);
  }, []);

  const createChannel = useCallback((name: string, description: string, radius: number) => {
    const newChannel: Channel = {
      id: `custom-${Date.now()}`,
      name,
      type: "custom",
      description,
      memberCount: 1,
      radius,
      isJoined: true,
      color: "#3B82F6",
    };
    setChannels((prev) => {
      const updated = [...prev, newChannel];
      AsyncStorage.setItem("rubberducky_channels", JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }, []);

  const joinChannel = useCallback((channelId: string) => {
    setChannels((prev) => {
      const updated = prev.map((c) => c.id === channelId ? { ...c, isJoined: true, memberCount: c.memberCount + 1 } : c);
      AsyncStorage.setItem("rubberducky_channels", JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }, []);

  const leaveChannel = useCallback((channelId: string) => {
    setChannels((prev) => {
      const updated = prev.map((c) =>
        c.id === channelId && c.type !== "public" && c.type !== "emergency"
          ? { ...c, isJoined: false, memberCount: Math.max(0, c.memberCount - 1) }
          : c
      );
      AsyncStorage.setItem("rubberducky_channels", JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }, []);

  const sendTextMessage = useCallback((content: string) => {
    if (!user) return;
    const msg: Message = {
      id: `msg-${Date.now()}`,
      senderId: user.id,
      senderName: user.displayName,
      channelId: activeChannel.id,
      type: "text",
      content,
      timestamp: Date.now(),
      isOwn: true,
    };
    setMessages((prev) => [...prev.slice(-49), msg]);
    updateUser({ messagesSent: (user.messagesSent ?? 0) + 1 });
  }, [user, activeChannel.id, updateUser]);

  const addVoiceMessage = useCallback((durationLabel: string) => {
    if (!user) return;
    const msg: Message = {
      id: `msg-${Date.now()}`,
      senderId: user.id,
      senderName: user.displayName,
      channelId: activeChannel.id,
      type: "voice",
      content: durationLabel,
      timestamp: Date.now(),
      isOwn: true,
    };
    setMessages((prev) => [...prev.slice(-49), msg]);
    updateUser({ messagesSent: (user.messagesSent ?? 0) + 1 });
  }, [user, activeChannel.id, updateUser]);

  return (
    <AppContext.Provider
      value={{
        user,
        isOnboarded,
        isHydrated,
        setUser,
        updateUser,
        completeOnboarding,
        channels,
        activeChannel,
        setActiveChannel,
        createChannel,
        joinChannel,
        leaveChannel,
        messages,
        sendTextMessage,
        addVoiceMessage,
        nearbyDrivers,
        isSafetyMode,
        currentSpeed,
        isConnected,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
