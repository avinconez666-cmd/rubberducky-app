/**
 * 10/4 Rubberducky radio relay.
 * Half-duplex room: public channel, friend requests, convoy, hazard pins.
 * In-memory only. Restart clears presence and pending requests.
 *
 *   node relay/server.mjs
 *   PORT=8787 node relay/server.mjs
 */
import { WebSocketServer } from "ws";

const port = Number(process.env.PORT || 8787);
const wss = new WebSocketServer({ port });

/** @type {Map<import('ws').WebSocket, {handle:string, vehicle:string, car:unknown}>} */
const clients = new Map();
/** @type {Map<string, Set<string>>} */
const friends = new Map();
const MAX_AUDIO = 280_000;

function send(ws, obj) {
  if (ws.readyState === 1) ws.send(JSON.stringify(obj));
}

function key(handle) {
  return String(handle || "").trim().toLowerCase();
}

function roster() {
  return [...clients.values()].map((p) => ({
    handle: p.handle,
    vehicle: p.vehicle,
    car: p.car,
  }));
}

function broadcast(obj, except) {
  for (const ws of clients.keys()) {
    if (ws !== except) send(ws, obj);
  }
}

function socketFor(handle) {
  const want = key(handle);
  for (const [ws, profile] of clients) {
    if (key(profile.handle) === want) return ws;
  }
  return null;
}

function looksLikePlate(text) {
  if (/\b(rego|number\s*plate|licence\s*plate|license\s*plate)\b/i.test(text)) return true;
  return String(text)
    .toUpperCase()
    .split(/[^A-Z0-9]+/)
    .some((token) => token.length >= 5 && token.length <= 7 && /[A-Z]/.test(token) && /\d/.test(token));
}

function areFriends(a, b) {
  return friends.get(key(a))?.has(key(b)) ?? false;
}

function linkFriends(a, b) {
  const ak = key(a);
  const bk = key(b);
  if (!friends.has(ak)) friends.set(ak, new Set());
  if (!friends.has(bk)) friends.set(bk, new Set());
  friends.get(ak).add(bk);
  friends.get(bk).add(ak);
}

wss.on("connection", (ws) => {
  ws.on("message", (raw) => {
    let msg;
    try {
      msg = JSON.parse(String(raw));
    } catch {
      return;
    }
    const me = clients.get(ws);

    if (msg.type === "hello") {
      const handle = String(msg.handle || "").trim().slice(0, 20);
      if (handle.length < 2) {
        send(ws, { type: "error", error: "Handle too short" });
        return;
      }
      if ([...clients.values()].some((p) => key(p.handle) === key(handle))) {
        send(ws, { type: "error", error: "That handle is already on the radio" });
        return;
      }
      clients.set(ws, {
        handle,
        vehicle: String(msg.vehicle || "car"),
        car: msg.car ?? null,
      });
      send(ws, { type: "hello_ok", roster: roster(), friends: [...(friends.get(key(handle)) ?? [])] });
      broadcast({ type: "presence", roster: roster() }, ws);
      return;
    }

    if (!me) return;

    if (msg.type === "profile") {
      me.vehicle = String(msg.vehicle || me.vehicle);
      me.car = msg.car ?? me.car;
      broadcast({ type: "presence", roster: roster() });
      return;
    }

    if (msg.type === "tx") {
      broadcast({ type: "tx", handle: me.handle, on: Boolean(msg.on) }, ws);
      return;
    }

    if (msg.type === "chat") {
      const channel = msg.channel === "convoy" ? "convoy" : "public";
      const text = String(msg.text || "").slice(0, 280);
      let audio = typeof msg.audio === "string" ? msg.audio : "";
      if (audio.length > MAX_AUDIO) audio = "";
      const packet = {
        type: "chat",
        channel,
        from: me.handle,
        vehicle: me.vehicle,
        text,
        audio,
        seconds: Number(msg.seconds) || 0,
        at: Date.now(),
      };
      if (channel === "public") {
        broadcast(packet, ws);
      } else {
        for (const [other, profile] of clients) {
          if (other !== ws && areFriends(me.handle, profile.handle)) send(other, packet);
        }
      }
      return;
    }

    if (msg.type === "friend_request") {
      const to = String(msg.handle || "").trim();
      if (!to || key(to) === key(me.handle)) return;
      const dest = socketFor(to);
      if (!dest) {
        send(ws, { type: "error", error: `${to} is not on the radio right now` });
        return;
      }
      send(dest, { type: "friend_request", from: me.handle, vehicle: me.vehicle });
      send(ws, { type: "friend_sent", handle: to });
      return;
    }

    if (msg.type === "friend_respond") {
      const other = String(msg.handle || "").trim();
      const dest = socketFor(other);
      if (msg.accept) linkFriends(me.handle, other);
      if (dest) send(dest, { type: "friend_result", handle: me.handle, accept: Boolean(msg.accept) });
      send(ws, { type: "friend_result", handle: other, accept: Boolean(msg.accept) });
      return;
    }

    if (msg.type === "hazard") {
      const packet = {
        type: "hazard",
        id: String(msg.id || `h-${Date.now()}`),
        hazardType: String(msg.hazardType || "debris"),
        description: String(msg.description || "").slice(0, 180),
        lat: Number(msg.lat),
        lng: Number(msg.lng),
        from: me.handle,
        at: Date.now(),
        expiresAt: Date.now() + (msg.hazardType === "mobile_camera" ? 240 : msg.hazardType === "driver" ? 30 : msg.hazardType === "police" ? 45 : 60) * 60 * 1000,
      };
      if (!Number.isFinite(packet.lat) || !Number.isFinite(packet.lng)) return;
      if ((packet.hazardType === "driver" || packet.hazardType === "mobile_camera") && looksLikePlate(packet.description)) {
        send(ws, { type: "error", error: "Driver reports cannot include a number plate" });
        return;
      }
      broadcast(packet, ws);
    }
  });

  ws.on("close", () => {
    const me = clients.get(ws);
    clients.delete(ws);
    if (me) broadcast({ type: "presence", roster: roster(), left: me.handle });
  });
});

console.log(`10/4 radio relay on ws://0.0.0.0:${port}`);
