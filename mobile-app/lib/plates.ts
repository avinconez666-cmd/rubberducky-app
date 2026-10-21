const ROAD_WORD = /^(LANE|ROAD|HWY|EXIT|LEFT|RIGHT|NORTH|SOUTH|EAST|WEST|KM|KMH)$/;

/** True when a note looks like it contains a registration or asks for one. */
export function noteHasPlate(text: string) {
  if (/\b(rego|number\s*plate|num\s*plate|license\s*plate|licence\s*plate|plate\s*number)\b/i.test(text)) {
    return true;
  }
  return text
    .toUpperCase()
    .split(/[^A-Z0-9]+/)
    .some((token) => {
      if (token.length < 5 || token.length > 7) return false;
      if (!/[A-Z]/.test(token) || !/\d/.test(token)) return false;
      if (ROAD_WORD.test(token)) return false;
      return true;
    });
}
