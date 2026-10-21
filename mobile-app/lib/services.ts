export type AuState = "WA" | "NT" | "SA" | "QLD" | "NSW" | "VIC" | "TAS" | "ACT";

export const AU_STATES: AuState[] = ["WA", "NT", "SA", "QLD", "NSW", "ACT", "VIC", "TAS"];

export interface MotoringClub {
  state: AuState;
  region: string;
  club: string;
  phone: "131111";
  phoneLabel: "13 11 11";
}

const CLUBS: Record<AuState, Omit<MotoringClub, "phone" | "phoneLabel">> = {
  WA: { state: "WA", region: "Western Australia", club: "RAC" },
  NT: { state: "NT", region: "Northern Territory", club: "AANT" },
  SA: { state: "SA", region: "South Australia", club: "RAA" },
  QLD: { state: "QLD", region: "Queensland", club: "RACQ" },
  NSW: { state: "NSW", region: "New South Wales", club: "NRMA" },
  ACT: { state: "ACT", region: "Australian Capital Territory", club: "NRMA" },
  VIC: { state: "VIC", region: "Victoria", club: "RACV" },
  TAS: { state: "TAS", region: "Tasmania", club: "RACT" },
};

/** Rough box from the GPS fix. The help screen lets the driver correct it. */
export function guessState(lat: number, lng: number): AuState {
  if (lat <= -39.15 && lng >= 143.5 && lng <= 148.6) return "TAS";
  if (lat <= -35.12 && lat >= -35.98 && lng >= 148.74 && lng <= 149.42) return "ACT";
  if (lng < 129) return "WA";
  if (lat > -26 && lng < 138) return "NT";
  if (lng < 141) return "SA";
  if (lat > -28.5) return "QLD";
  if (lat < -36.1 && lng < 150.3) return "VIC";
  return "NSW";
}

export function clubFor(state: AuState): MotoringClub {
  return { ...CLUBS[state], phone: "131111", phoneLabel: "13 11 11" };
}
