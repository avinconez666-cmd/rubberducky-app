import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import * as FileSystem from "expo-file-system/legacy";
import { useApp, type HazardType, type Message, type NearbyDriver, type VehicleType } from "@/contexts/AppContext";
import { noteHasPlate } from "@/lib/plates";
import { insideHomeBubble } from "@/lib/geo";

interface RadioValue {
  status: "off" | "connecting" | "live" | "error";
  statusDetail: string;
  onAir: string | null;
  online: { handle: string; vehicle: string }[];
  requestFriend: (handle: string) => void;
  respondFriend: (handle: string, accept: boolean) => void;
  broadcastText: (text: string) => void;
  broadcastVoice: (audioBase64: string, seconds: number) => void;
  announceTx: (on: boolean) => void;
  publishHazard: (type: HazardType, description: string, lat: number, lng: number, id: string) => void;
  pushProfile: () => void;
  liveDrivers: NearbyDriver[];
}

const RadioContext = createContext<RadioValue | null>(null);

export function RadioProvider({ children }: { children: React.ReactNode }) {
  const {
    user,
    userLocation,
    relayUrl,
    activeChannel,
    setRelayConnected,
    receiveRadioMessage,
    ingestHazard,
    upsertFriend,
    pushRoadAlert,
  } = useApp();
  const [status, setStatus] = useState<RadioValue["status"]>("off");
  const [statusDetail, setStatusDetail] = useState("No relay set");
  const [onAir, setOnAir] = useState<string | null>(null);
  const [online, setOnline] = useState<{ handle: string; vehicle: string }[]>([]);
  const [liveDrivers, setLiveDrivers] = useState<NearbyDriver[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const userRef = useRef(user);
  const channelRef = useRef(activeChannel);
  const locRef = useRef(userLocation);
  userRef.current = user;
  channelRef.current = activeChannel;
  locRef.current = userLocation;

  const send = useCallback((obj: unknown) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(obj));
  }, []);

  useEffect(() => {
    if (!relayUrl || !user) {
      wsRef.current?.close();
      wsRef.current = null;
      setStatus("off");
      setStatusDetail(user ? "Add a relay URL in Settings" : "Sign on first");
      setRelayConnected(false);
      setOnline([]);
      setLiveDrivers([]);
      return;
    }

    let stopped = false;
    let retry: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      if (stopped) return;
      setStatus("connecting");
      setStatusDetail("Calling the relay…");
      let ws: WebSocket;
      try {
        ws = new WebSocket(relayUrl);
      } catch {
        setStatus("error");
        setStatusDetail("That relay URL is not valid");
        setRelayConnected(false);
        return;
      }
      wsRef.current = ws;
      ws.onopen = () => {
        const me = userRef.current;
        if (!me) return;
        ws.send(JSON.stringify({
          type: "hello",
          handle: me.displayName,
          vehicle: me.vehicleType,
          car: me.car,
        }));
      };
      ws.onmessage = (event) => {
        let msg: Record<string, unknown>;
        try {
          msg = JSON.parse(String(event.data));
        } catch {
          return;
        }
        if (msg.type === "hello_ok" || msg.type === "positions" || msg.type === "presence") {
          if (msg.type !== "positions") {
            const roster = Array.isArray(msg.roster) ? msg.roster : [];
            setOnline(roster.map((r) => ({ handle: String((r as { handle?: string }).handle || ""), vehicle: String((r as { vehicle?: string }).vehicle || "car") })));
          }
          if (msg.type === "hello_ok") {
            setStatus("live");
            setStatusDetail("Public room is open");
            setRelayConnected(true);
          }
          if (msg.type === "hello_ok" || msg.type === "positions") {
            const me = userRef.current?.displayName?.toLowerCase() ?? "";
            const rows = Array.isArray(msg.positions) ? msg.positions : [];
            const drivers: NearbyDriver[] = [];
            rows.forEach((row) => {
              const item = row as { handle?: string; vehicle?: string; lat?: number; lng?: number; heading?: number };
              const handle = String(item.handle || "");
              const lat = Number(item.lat);
              const lng = Number(item.lng);
              if (!handle || handle.toLowerCase() === me || !Number.isFinite(lat) || !Number.isFinite(lng)) return;
              const vehicle = String(item.vehicle || "car");
              const vehicleType: VehicleType = vehicle === "truck" || vehicle === "motorcycle" || vehicle === "rv" ? vehicle : "car";
              drivers.push({
                id: `live-${handle.toLowerCase()}`,
                displayName: handle,
                vehicleType,
                latitude: lat,
                longitude: lng,
                heading: Number.isFinite(Number(item.heading)) ? Number(item.heading) : null,
                channelId: "live",
                lastSeen: Date.now(),
              });
            });
            setLiveDrivers(drivers);
          }
          return;
        }
        if (msg.type === "error") {
          setStatus("error");
          setStatusDetail(String(msg.error || "Relay error"));
          setRelayConnected(false);
          return;
        }
        if (msg.type === "tx") {
          setOnAir(msg.on ? String(msg.handle || "") : null);
          return;
        }
        if (msg.type === "chat") {
          const channel = String(msg.channel || "public");
          const from = String(msg.from || "Driver");
          const id = `radio-${from}-${msg.at}`;
          const audio = typeof msg.audio === "string" ? msg.audio : "";
          const text = String(msg.text || "");
          const apply = (audioUri?: string) => {
            const message: Message = {
              id,
              senderId: from,
              senderName: from,
              channelId: channel === "convoy" ? "convoy" : "public",
              type: audioUri || audio ? "voice" : "text",
              content: audioUri || audio ? `Voice clip (${Number(msg.seconds) || 0}s)` : text,
              audioUri,
              timestamp: Number(msg.at) || Date.now(),
              isOwn: false,
            };
            receiveRadioMessage(message);
          };
          if (audio && FileSystem.cacheDirectory) {
            const path = `${FileSystem.cacheDirectory}radio-${msg.at}.m4a`;
            FileSystem.writeAsStringAsync(path, audio, { encoding: FileSystem.EncodingType.Base64 })
              .then(() => apply(path))
              .catch(() => apply());
          } else {
            apply();
          }
          return;
        }
        if (msg.type === "friend_request") {
          const from = String(msg.from || "");
          upsertFriend({
            id: `friend-${from.toLowerCase()}`,
            displayName: from,
            vehicleType: "car",
            isOnline: true,
            lastSeen: Date.now(),
            latitude: null,
            longitude: null,
            status: "incoming",
          });
          pushRoadAlert("Friend request", `${from} wants to join your convoy.`, 8000);
          return;
        }
        if (msg.type === "friend_result") {
          const handle = String(msg.handle || "");
          if (msg.accept) {
            upsertFriend({
              id: `friend-${handle.toLowerCase()}`,
              displayName: handle,
              vehicleType: "car",
              isOnline: true,
              lastSeen: Date.now(),
              latitude: null,
              longitude: null,
              status: "accepted",
            });
          }
          return;
        }
        if (msg.type === "hazard") {
          const hazardType = String(msg.hazardType || "debris") as HazardType;
          const description = String(msg.description || "");
          if ((hazardType === "driver" || hazardType === "mobile_camera") && noteHasPlate(description)) return;
          ingestHazard({
            id: String(msg.id),
            type: hazardType,
            latitude: Number(msg.lat),
            longitude: Number(msg.lng),
            description,
            reportedBy: String(msg.from || "Driver"),
            reportedAt: Number(msg.at) || Date.now(),
            expiresAt: Number(msg.expiresAt) || Date.now() + 3600000,
            upvotes: 1,
          });
          if (hazardType === "police") {
            pushRoadAlert("Traffic stop reported", `${msg.from}: ${msg.description}. Ease off early.`, 14000);
          }
        }
      };
      ws.onerror = () => {
        setStatus("error");
        setStatusDetail("Relay did not answer");
        setRelayConnected(false);
      };
      ws.onclose = () => {
        setRelayConnected(false);
        setOnAir(null);
        setLiveDrivers([]);
        if (stopped) return;
        setStatus("connecting");
        setStatusDetail("Relay dropped. Redialling…");
        retry = setTimeout(connect, 4000);
      };
    };

    connect();
    return () => {
      stopped = true;
      if (retry) clearTimeout(retry);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [relayUrl, user?.id, user?.displayName, ingestHazard, pushRoadAlert, receiveRadioMessage, setRelayConnected, upsertFriend]);

  useEffect(() => {
    if (status !== "live") return;
    const pushLoc = () => {
      const me = userRef.current;
      const loc = locRef.current;
      const nearHome = me ? insideHomeBubble(loc, me.homeLat, me.homeLng, me.homeHideMeters) : false;
      if (!me?.isVisible || !loc || nearHome) {
        send({ type: "loc", visible: false });
        return;
      }
      send({
        type: "loc",
        visible: true,
        lat: loc.latitude,
        lng: loc.longitude,
        heading: loc.heading,
      });
    };
    pushLoc();
    const timer = setInterval(pushLoc, 3000);
    return () => clearInterval(timer);
  }, [status, user?.isVisible, send]);

  const requestFriend = useCallback((handle: string) => {
    send({ type: "friend_request", handle });
  }, [send]);

  const respondFriend = useCallback((handle: string, accept: boolean) => {
    send({ type: "friend_respond", handle, accept });
    if (accept) {
      upsertFriend({
        id: `friend-${handle.toLowerCase()}`,
        displayName: handle,
        vehicleType: "car",
        isOnline: true,
        lastSeen: Date.now(),
        latitude: null,
        longitude: null,
        status: "accepted",
      });
    }
  }, [send, upsertFriend]);

  const broadcastText = useCallback((text: string) => {
    const channel = channelRef.current?.id === "convoy" ? "convoy" : "public";
    if (channelRef.current?.id !== "public" && channelRef.current?.id !== "convoy") return;
    send({ type: "chat", channel, text });
  }, [send]);

  const broadcastVoice = useCallback((audioBase64: string, seconds: number) => {
    const channel = channelRef.current?.id === "convoy" ? "convoy" : "public";
    if (channelRef.current?.id !== "public" && channelRef.current?.id !== "convoy") return;
    send({ type: "chat", channel, audio: audioBase64, seconds, text: "" });
  }, [send]);

  const announceTx = useCallback((on: boolean) => {
    send({ type: "tx", on });
  }, [send]);

  const publishHazard = useCallback((type: HazardType, description: string, lat: number, lng: number, id: string) => {
    send({ type: "hazard", hazardType: type, description, lat, lng, id });
  }, [send]);

  const pushProfile = useCallback(() => {
    const me = userRef.current;
    if (!me) return;
    send({ type: "profile", vehicle: me.vehicleType, car: me.car });
  }, [send]);

  return (
    <RadioContext.Provider
      value={{
        status,
        statusDetail,
        onAir,
        online,
        requestFriend,
        respondFriend,
        broadcastText,
        broadcastVoice,
        announceTx,
        publishHazard,
        pushProfile,
        liveDrivers,
      }}
    >
      {children}
    </RadioContext.Provider>
  );
}

export function useRadio() {
  const ctx = useContext(RadioContext);
  if (!ctx) throw new Error("useRadio must be used within RadioProvider");
  return ctx;
}
