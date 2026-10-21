import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DEFAULT_CAR, EMPTY_STATS, MILESTONES, normaliseCar, normaliseStats, type CarStyle, type DriverStats } from "@/constants/garage";
import { haversineMeters } from "@/lib/geo";
import { playSfx } from "@/lib/sfx";
import { normaliseGpsAccuracy, type GpsAccuracy } from "@/lib/gps";

// ─── Types ───────────────────────────────────────────────────────────────────

export type VehicleType = "car" | "truck" | "motorcycle" | "rv";

export type ChannelType = "public" | "emergency" | "custom";

// ─── Hazard Report ────────────────────────────────────────────────────────────
export type HazardType = "accident" | "debris" | "breakdown" | "animal" | "roadworks" | "weather" | "speed_camera" | "mobile_camera" | "police" | "driver";

export interface HazardReport {
  id: string;
  type: HazardType;
  latitude: number;
  longitude: number;
  description: string;
  reportedBy: string;
  reportedAt: number;
  expiresAt: number;
  upvotes: number;
}

// ─── Navigation ───────────────────────────────────────────────────────────────
export interface NavigationState {
  destination: string | null;
  destinationLat: number | null;
  destinationLng: number | null;
  isNavigating: boolean;
  currentSpeed: number;
  speedLimit: number;
  nextTurn: string | null;
  distanceToTurn: number;
  etaMinutes: number;
}

// ─── Friend ───────────────────────────────────────────────────────────────────
export interface Friend {
  id: string;
  displayName: string;
  vehicleType: VehicleType;
  isOnline: boolean;
  lastSeen: number;
  latitude: number | null;
  longitude: number | null;
  status: "accepted" | "incoming" | "outgoing";
}

// ─── Subscription ─────────────────────────────────────────────────────────────
export type SubscriptionTier = "free" | "premium";

export interface Subscription {
  tier: SubscriptionTier;
  expiresAt: number | null;
  canReportHazards: boolean;
  canNavigate: boolean;
  canAddFriends: boolean;
}

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
  heading?: number | null;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  channelId: string;
  type: "text" | "voice";
  content: string; // text content or voice duration label
  audioUri?: string;
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
  photoUri: string | null;
  car: CarStyle;
  gpsAccuracy: GpsAccuracy;
  stats: DriverStats;
  homeLat: number | null;
  homeLng: number | null;
  homeHideMeters: number;
}

export interface RoadAlert {
  title: string;
  body: string;
  until: number;
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
  addVoiceMessage: (durationLabel: string, audioUri?: string) => void;
  receiveRadioMessage: (message: Message) => void;
  // Nearby drivers (practice channel only — not live people)
  nearbyDrivers: NearbyDriver[];
  practiceMode: boolean;
  setPracticeMode: (on: boolean) => void;
  // GPS
  userLocation: { latitude: number; longitude: number; heading: number | null; accuracyM: number | null } | null;
  setGpsSample: (sample: { latitude: number; longitude: number; speedKmh: number; heading: number | null; accuracyM: number | null }) => void;
  roadAlert: RoadAlert | null;
  pushRoadAlert: (title: string, body: string, ms?: number) => void;
  // Safety mode
  isSafetyMode: boolean;
  currentSpeed: number;
  // Connection
  isConnected: boolean;
  setRelayConnected: (on: boolean) => void;
  relayUrl: string;
  setRelayUrl: (url: string) => void;
  // Hazards
  hazards: HazardReport[];
  reportHazard: (type: HazardType, description: string, lat: number, lng: number) => void;
  ingestHazard: (hazard: HazardReport) => void;
  upvoteHazard: (hazardId: string) => void;
  // Navigation
  navigation: NavigationState;
  setDestination: (name: string, lat: number, lng: number) => void;
  startNavigation: () => void;
  stopNavigation: () => void;
  // Friends
  friends: Friend[];
  addFriend: (displayName: string) => void;
  upsertFriend: (friend: Friend) => void;
  removeFriend: (friendId: string) => void;
  // Subscription
  subscription: Subscription;
  upgradeToPremium: () => void;
}

// ─── Default channels ─────────────────────────────────────────────────────────

const DEFAULT_CHANNELS: Channel[] = [
  {
    id: "public",
    name: "Public Nearby",
    type: "public",
    description: "Open two-way radio. Everyone on the relay can hear this room.",
    memberCount: 0,
    radius: 2000,
    isJoined: true,
    color: "#22C55E",
  },
  {
    id: "emergency",
    name: "Emergency",
    type: "emergency",
    description: "Local priority channel for hazards",
    memberCount: 0,
    radius: 10000,
    isJoined: true,
    color: "#EF4444",
  },
  {
    id: "convoy",
    name: "Convoy",
    type: "custom",
    description: "Accepted friends only",
    memberCount: 0,
    radius: 0,
    isJoined: true,
    color: "#3B82F6",
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
  const [practiceMode, setPracticeModeState] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number; heading: number | null; accuracyM: number | null } | null>(null);
  const [roadAlert, setRoadAlert] = useState<RoadAlert | null>(null);
  const [isSafetyMode, setIsSafetyMode] = useState(false);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [relayUrl, setRelayUrlState] = useState("");
  const thresholdRef = useRef(10);
  const lastFix = useRef<{ lat: number; lng: number } | null>(null);
  const [hazards, setHazards] = useState<HazardReport[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [subscription, setSubscription] = useState<Subscription>({
    tier: "free",
    expiresAt: null,
    canReportHazards: true,
    canNavigate: true,
    canAddFriends: true,
  });
  const [navigation, setNavigationState] = useState<NavigationState>({
    destination: null,
    destinationLat: null,
    destinationLng: null,
    isNavigating: false,
    currentSpeed: 0,
    speedLimit: 50,
    nextTurn: null,
    distanceToTurn: 0,
    etaMinutes: 0,
  });

  // Load persisted state on mount
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem("rubberducky_user");
        if (stored) {
          const parsed = JSON.parse(stored) as UserProfile;
          const withCar: UserProfile = {
            ...parsed,
            photoUri: parsed.photoUri ?? null,
            car: normaliseCar(parsed.car),
            gpsAccuracy: normaliseGpsAccuracy(parsed.gpsAccuracy),
            stats: normaliseStats(parsed.stats),
            homeLat: typeof parsed.homeLat === "number" ? parsed.homeLat : null,
            homeLng: typeof parsed.homeLng === "number" ? parsed.homeLng : null,
            homeHideMeters: typeof parsed.homeHideMeters === "number" ? parsed.homeHideMeters : 500,
          };
          setUserState(withCar);
          setIsOnboarded(true);
          thresholdRef.current = parsed.safetySpeedThreshold ?? 10;
        }
        const storedChannels = await AsyncStorage.getItem("rubberducky_channels");
        if (storedChannels) {
          const parsed: Channel[] = JSON.parse(storedChannels);
          const hasConvoy = parsed.some((c) => c.id === "convoy");
          setChannels(hasConvoy ? parsed : [...parsed, DEFAULT_CHANNELS[2]]);
        }
        const storedRelay = await AsyncStorage.getItem("rubberducky_relay");
        if (storedRelay) setRelayUrlState(storedRelay);
        const storedHazards = await AsyncStorage.getItem("rubberducky_hazards");
        if (storedHazards) {
          const parsed: HazardReport[] = JSON.parse(storedHazards);
          setHazards(parsed.filter((h) => h.expiresAt > Date.now()));
        }
        const storedFriends = await AsyncStorage.getItem("rubberducky_friends");
        if (storedFriends) {
          const parsed: Friend[] = JSON.parse(storedFriends);
          setFriends(parsed.map((f) => ({ ...f, isOnline: false, status: f.status ?? "accepted" })));
        }
        const storedPractice = await AsyncStorage.getItem("rubberducky_practice");
        if (storedPractice === "1") {
          setPracticeModeState(true);
          setNearbyDrivers(generateNearbyDrivers(-31.9523, 115.8613));
        }
      } catch (_) {
        // ignore
      } finally {
        setIsHydrated(true);
      }
    })();
  }, []);

  useEffect(() => {
    thresholdRef.current = user?.safetySpeedThreshold ?? 10;
    setIsSafetyMode(currentSpeed > thresholdRef.current && thresholdRef.current < 900);
  }, [user?.safetySpeedThreshold, currentSpeed]);

  // Practice channel only: sample lines so the radio UI can be learned.
  // These are not other people, and they never mention enforcement.
  useEffect(() => {
    if (!isOnboarded || !practiceMode) return;
    const timer = setInterval(() => {
      const senders = ["DustDevil", "RoadRunner", "NightOwl", "TruckerMike"];
      const texts = [
        "Practice clip: roadworks ahead, expect delays.",
        "Practice clip: debris in the left lane.",
        "Practice clip: anyone know a servo off the next exit?",
        "10-4, practice copy. Over.",
        "Practice clip: breakdown on the shoulder, give them room.",
      ];
      const incoming: Message = {
        id: `practice-${Date.now()}`,
        senderId: `practice-${Math.floor(Math.random() * 4)}`,
        senderName: `${senders[Math.floor(Math.random() * senders.length)]} (practice)`,
        channelId: activeChannel.id,
        type: "text",
        content: texts[Math.floor(Math.random() * texts.length)],
        timestamp: Date.now(),
        isOwn: false,
      };
      setMessages((prev) => [...prev.slice(-49), incoming]);
    }, 25000);
    return () => clearInterval(timer);
  }, [isOnboarded, practiceMode, activeChannel.id]);

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
      photoUri: null,
      car: { ...DEFAULT_CAR, body: vehicle === "truck" ? "truck" : vehicle === "rv" ? "van" : vehicle === "motorcycle" ? "bike" : "sedan" },
      gpsAccuracy: "standard",
      stats: { ...EMPTY_STATS },
      homeLat: null,
      homeLng: null,
      homeHideMeters: 500,
    };
    setUser(newUser);
    setIsOnboarded(true);
  }, [setUser]);

  const setPracticeMode = useCallback((on: boolean) => {
    setPracticeModeState(on);
    AsyncStorage.setItem("rubberducky_practice", on ? "1" : "0").catch(() => {});
    if (on) {
      const lat = userLocation?.latitude ?? -31.9523;
      const lng = userLocation?.longitude ?? 115.8613;
      setNearbyDrivers(generateNearbyDrivers(lat, lng));
    } else {
      setNearbyDrivers([]);
    }
  }, [userLocation]);

  const bumpStats = useCallback((partial: Partial<DriverStats>) => {
    setUserState((prev) => {
      if (!prev) return prev;
      const stats = normaliseStats(prev.stats);
      const next: DriverStats = { ...stats };
      (Object.keys(partial) as (keyof DriverStats)[]).forEach((key) => {
        next[key] = stats[key] + (partial[key] ?? 0);
      });
      const before = MILESTONES.filter((item) => item.read(stats) >= item.goal).length;
      const after = MILESTONES.filter((item) => item.read(next) >= item.goal).length;
      if (after > before) playSfx("unlock");
      const updated = { ...prev, stats: next };
      AsyncStorage.setItem("rubberducky_user", JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }, []);

  const setGpsSample = useCallback((sample: { latitude: number; longitude: number; speedKmh: number; heading: number | null; accuracyM: number | null }) => {
    setUserLocation({ latitude: sample.latitude, longitude: sample.longitude, heading: sample.heading, accuracyM: sample.accuracyM });
    const speed = Math.max(0, Math.round(sample.speedKmh));
    setCurrentSpeed(speed);
    const threshold = thresholdRef.current;
    setIsSafetyMode(speed > threshold && threshold < 900);
    setNavigationState((prev) => ({ ...prev, currentSpeed: speed }));
    if (lastFix.current) {
      const delta = haversineMeters(lastFix.current.lat, lastFix.current.lng, sample.latitude, sample.longitude);
      if (delta >= 12 && delta < 400 && speed < 180) bumpStats({ metres: delta });
    }
    lastFix.current = { lat: sample.latitude, lng: sample.longitude };
  }, [bumpStats]);

  const pushRoadAlert = useCallback((title: string, body: string, ms = 12000) => {
    setRoadAlert({ title, body, until: Date.now() + ms });
  }, []);

  const setRelayConnected = useCallback((on: boolean) => {
    setIsConnected(on);
  }, []);

  const setRelayUrl = useCallback((url: string) => {
    const next = url.trim();
    setRelayUrlState(next);
    AsyncStorage.setItem("rubberducky_relay", next).catch(() => {});
  }, []);

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
    bumpStats({ texts: 1 });
  }, [user, activeChannel.id, updateUser, bumpStats]);

  const receiveRadioMessage = useCallback((message: Message) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === message.id)) return prev;
      return [...prev.slice(-49), message];
    });
  }, []);

  const addVoiceMessage = useCallback((durationLabel: string, audioUri?: string) => {
    if (!user) return;
    const msg: Message = {
      id: `msg-${Date.now()}`,
      senderId: user.id,
      senderName: user.displayName,
      channelId: activeChannel.id,
      type: "voice",
      content: durationLabel,
      audioUri,
      timestamp: Date.now(),
      isOwn: true,
    };
    setMessages((prev) => [...prev.slice(-49), msg]);
    updateUser({ messagesSent: (user.messagesSent ?? 0) + 1 });
    bumpStats({ voiceClips: 1 });
  }, [user, activeChannel.id, updateUser, bumpStats]);

  const reportHazard = useCallback((type: HazardType, description: string, lat: number, lng: number) => {
    const hazard: HazardReport = {
      id: `hazard-${Date.now()}`,
      type,
      latitude: lat,
      longitude: lng,
      description,
      reportedBy: user?.displayName ?? "Anonymous",
      reportedAt: Date.now(),
      expiresAt: Date.now() + (type === "mobile_camera" ? 240 : type === "driver" ? 30 : type === "police" ? 45 : 60) * 60 * 1000,
      upvotes: 1,
    };
    setHazards((prev) => {
      const updated = [...prev, hazard];
      AsyncStorage.setItem("rubberducky_hazards", JSON.stringify(updated)).catch(() => {});
      return updated;
    });
    bumpStats({ hazards: 1 });
    playSfx("pin");
  }, [user, bumpStats]);

  const ingestHazard = useCallback((hazard: HazardReport) => {
    setHazards((prev) => {
      if (prev.some((h) => h.id === hazard.id)) return prev;
      const updated = [...prev, hazard];
      AsyncStorage.setItem("rubberducky_hazards", JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }, []);

  const upvoteHazard = useCallback((hazardId: string) => {
    setHazards((prev) =>
      prev.map((h) => (h.id === hazardId ? { ...h, upvotes: h.upvotes + 1 } : h))
    );
  }, []);

  const setDestination = useCallback((name: string, lat: number, lng: number) => {
    setNavigationState((prev) => ({
      ...prev,
      destination: name,
      destinationLat: lat,
      destinationLng: lng,
      isNavigating: false,
    }));
  }, []);

  const startNavigation = useCallback(() => {
    setNavigationState((prev) => ({ ...prev, isNavigating: true }));
  }, []);

  const stopNavigation = useCallback(() => {
    setNavigationState((prev) => ({
      ...prev,
      isNavigating: false,
      destination: null,
      destinationLat: null,
      destinationLng: null,
    }));
  }, []);

  const addFriend = useCallback((displayName: string) => {
    const friend: Friend = {
      id: `friend-${Date.now()}`,
      displayName: displayName.trim(),
      vehicleType: "car",
      isOnline: false,
      lastSeen: Date.now(),
      latitude: null,
      longitude: null,
      status: "outgoing",
    };
    setFriends((prev) => {
      const updated = [...prev, friend];
      AsyncStorage.setItem("rubberducky_friends", JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }, []);

  const upsertFriend = useCallback((friend: Friend) => {
    let grant = false;
    setFriends((prev) => {
      const idx = prev.findIndex((f) => f.displayName.toLowerCase() === friend.displayName.toLowerCase());
      const wasAccepted = idx >= 0 && prev[idx].status === "accepted";
      grant = friend.status === "accepted" && !wasAccepted;
      const updated = idx >= 0 ? prev.map((f, i) => (i === idx ? { ...f, ...friend, id: f.id } : f)) : [...prev, friend];
      AsyncStorage.setItem("rubberducky_friends", JSON.stringify(updated)).catch(() => {});
      return updated;
    });
    if (grant) bumpStats({ friends: 1 });
  }, [bumpStats]);

  const removeFriend = useCallback((friendId: string) => {
    setFriends((prev) => {
      const updated = prev.filter((f) => f.id !== friendId);
      AsyncStorage.setItem("rubberducky_friends", JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }, []);

  const upgradeToPremium = useCallback(() => {
    // v1.0 has no in-app purchase. Every feature ships free.
    setSubscription((prev) => ({
      ...prev,
      canReportHazards: true,
      canNavigate: true,
      canAddFriends: true,
    }));
  }, []);

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
        receiveRadioMessage,
        nearbyDrivers,
        practiceMode,
        setPracticeMode,
        userLocation,
        setGpsSample,
        roadAlert,
        pushRoadAlert,
        isSafetyMode,
        currentSpeed,
        isConnected,
        setRelayConnected,
        relayUrl,
        setRelayUrl,
        hazards,
        reportHazard,
        ingestHazard,
        upvoteHazard,
        navigation,
        setDestination,
        startNavigation,
        stopNavigation,
        friends,
        addFriend,
        upsertFriend,
        removeFriend,
        subscription,
        upgradeToPremium,
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
