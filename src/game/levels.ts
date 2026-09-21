export const GATES_PER_LEVEL = 20;
export const TOTAL_GATES = 1000;
export const TOTAL_LEVELS = TOTAL_GATES / GATES_PER_LEVEL;
export const JOKER_EVERY_N_GATES = 5;

export function levelForGate(gate: number): number {
  return Math.floor((gate - 1) / GATES_PER_LEVEL) + 1;
}

export function gateInLevel(gate: number): number {
  return ((gate - 1) % GATES_PER_LEVEL) + 1;
}

/** Score needed to clear a gate. Grows smoothly from easy (~160) to a long-haul grind by gate 1000. */
export function targetForGate(gate: number): number {
  const base = 120;
  const linear = gate * 35;
  const curve = Math.pow(gate, 1.35) * 3;
  return Math.round((base + linear + curve) / 10) * 10;
}

/** A distinct-feeling background hue per level, spread evenly around the color wheel. */
export function hueForLevel(level: number): number {
  return (level * 47) % 360;
}

export function awardsJoker(clearedGate: number): boolean {
  return clearedGate % JOKER_EVERY_N_GATES === 0;
}
