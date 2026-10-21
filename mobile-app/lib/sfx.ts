import { createAudioPlayer, type AudioPlayer } from "expo-audio";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type SfxName = "key" | "txOn" | "txOff" | "rx" | "pin" | "unlock" | "safety";

const SOURCES: Record<SfxName, number> = {
  key: require("@/assets/sounds/key.wav"),
  txOn: require("@/assets/sounds/tx-on.wav"),
  txOff: require("@/assets/sounds/tx-off.wav"),
  rx: require("@/assets/sounds/rx.wav"),
  pin: require("@/assets/sounds/pin.wav"),
  unlock: require("@/assets/sounds/unlock.wav"),
  safety: require("@/assets/sounds/safety.wav"),
};

let enabled = true;
let ready = false;
const players = new Map<SfxName, AudioPlayer>();

export function sfxEnabled() {
  return enabled;
}

export async function loadSfx() {
  if (ready) return;
  ready = true;
  try {
    const stored = await AsyncStorage.getItem("rubberducky_sfx");
    enabled = stored !== "0";
    (Object.keys(SOURCES) as SfxName[]).forEach((name) => {
      const player = createAudioPlayer(SOURCES[name]);
      player.volume = name === "key" ? 0.35 : 0.55;
      players.set(name, player);
    });
  } catch {
    ready = false;
  }
}

export async function setSfxEnabled(on: boolean) {
  enabled = on;
  await AsyncStorage.setItem("rubberducky_sfx", on ? "1" : "0");
  if (on) playSfx("key");
}

export function playSfx(name: SfxName) {
  if (!enabled) return;
  const player = players.get(name);
  if (!player) return;
  player.seekTo(0).then(() => player.play()).catch(() => {});
}
