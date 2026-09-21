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

const VILLAGE_PREFIXES = [
  "Ay",
  "Gün",
  "Yıldız",
  "Bulut",
  "Ejderha",
  "Kristal",
  "Gümüş",
  "Altın",
  "Rüzgar",
  "Orman",
];

const VILLAGE_SUFFIXES = [
  { word: "Köyü", icon: "🏘️" },
  { word: "Vadisi", icon: "🏞️" },
  { word: "Tepesi", icon: "⛰️" },
  { word: "Adası", icon: "🏝️" },
  { word: "Diyarı", icon: "🗺️" },
  { word: "Ormanı", icon: "🌲" },
  { word: "Kalesi", icon: "🏰" },
  { word: "Limanı", icon: "⚓" },
  { word: "Bahçesi", icon: "🌷" },
  { word: "Mağarası", icon: "💎" },
];

export function isFinalLevel(level: number): boolean {
  return level >= TOTAL_LEVELS;
}

/** A fantastical village name for each level, built from a prefix/suffix combinator (100 unique combos).
 *  The very last level is the journey's destination: the City Gate. */
export function villageNameForLevel(level: number): string {
  if (isFinalLevel(level)) return "Şehir Kapısı";
  const idx = level - 1;
  const prefix = VILLAGE_PREFIXES[idx % VILLAGE_PREFIXES.length];
  const suffix = VILLAGE_SUFFIXES[Math.floor(idx / VILLAGE_PREFIXES.length) % VILLAGE_SUFFIXES.length];
  return `${prefix} ${suffix.word}`;
}

export function villageIconForLevel(level: number): string {
  if (isFinalLevel(level)) return "🏛️";
  const idx = level - 1;
  return VILLAGE_SUFFIXES[Math.floor(idx / VILLAGE_PREFIXES.length) % VILLAGE_SUFFIXES.length].icon;
}

/** How many distinct path shapes the village map can draw — each level cycles to the next one. */
export const PATH_VARIANT_COUNT = 6;

export function pathVariantForLevel(level: number): number {
  return (level - 1) % PATH_VARIANT_COUNT;
}

/** Global gate number for the Nth house (1-based) of a village/level. */
export function gateForHouse(level: number, houseIndex: number): number {
  return (level - 1) * GATES_PER_LEVEL + houseIndex;
}

export type HouseStatus = "cleared" | "active" | "locked";

export interface HouseState {
  index: number;
  gate: number;
  status: HouseStatus;
  target: number;
}

/** The 20 houses of a village, derived from how far the player has progressed. */
export function buildHouseStates(level: number, currentGate: number): HouseState[] {
  const houses: HouseState[] = [];
  for (let i = 1; i <= GATES_PER_LEVEL; i++) {
    const gate = gateForHouse(level, i);
    const status: HouseStatus = gate < currentGate ? "cleared" : gate === currentGate ? "active" : "locked";
    houses.push({ index: i, gate, status, target: targetForGate(gate) });
  }
  return houses;
}

export interface VillageOverviewEntry {
  level: number;
  name: string;
  icon: string;
  firstGate: number;
  lastGate: number;
  status: HouseStatus;
  isFinal: boolean;
}

/** All 50 villages of the journey, with how far the player has gotten through them. */
export function buildVillageOverview(currentGate: number): VillageOverviewEntry[] {
  const currentLevel = levelForGate(currentGate);
  const entries: VillageOverviewEntry[] = [];
  for (let level = 1; level <= TOTAL_LEVELS; level++) {
    const status: HouseStatus = level < currentLevel ? "cleared" : level === currentLevel ? "active" : "locked";
    entries.push({
      level,
      name: villageNameForLevel(level),
      icon: villageIconForLevel(level),
      firstGate: gateForHouse(level, 1),
      lastGate: gateForHouse(level, GATES_PER_LEVEL),
      status,
      isFinal: isFinalLevel(level),
    });
  }
  return entries;
}
