// Persists the player's progress (current gate, currencies, one-time rewards already
// claimed) across sessions. `main.ts` reads this on boot to decide which house is "active",
// to auto-scroll the map to it, and to know which chests/wheel-spins are already used up —
// the map and wheel themselves have no memory of their own.
const PROGRESS_KEY = "mobile-game-2048-progress-v2";

export interface Progress {
  currentGate: number;
  jokerCount: number;
  gold: number;
  undoCount: number;
  /** Gates of already-opened treasure chests, so a chest can only ever pay out once. */
  openedChests: number[];
  /** ISO date (YYYY-MM-DD) of the last free Lucky Wheel spin, or null if never spun. */
  lastWheelSpinDate: string | null;
}

const DEFAULT_PROGRESS: Progress = {
  currentGate: 1,
  jokerCount: 0,
  gold: 0,
  undoCount: 0,
  openedChests: [],
  lastWheelSpinDate: null,
};

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return { ...DEFAULT_PROGRESS, openedChests: [] };
    const parsed = JSON.parse(raw) as Partial<Progress>;
    const currentGate = Number(parsed.currentGate);
    const jokerCount = Number(parsed.jokerCount);
    const gold = Number(parsed.gold);
    const undoCount = Number(parsed.undoCount);
    const openedChests = Array.isArray(parsed.openedChests)
      ? parsed.openedChests.filter((g) => Number.isFinite(g))
      : [];
    const lastWheelSpinDate = typeof parsed.lastWheelSpinDate === "string" ? parsed.lastWheelSpinDate : null;
    return {
      currentGate: Number.isFinite(currentGate) && currentGate >= 1 ? currentGate : 1,
      jokerCount: Number.isFinite(jokerCount) && jokerCount >= 0 ? jokerCount : 0,
      gold: Number.isFinite(gold) && gold >= 0 ? gold : 0,
      undoCount: Number.isFinite(undoCount) && undoCount >= 0 ? undoCount : 0,
      openedChests,
      lastWheelSpinDate,
    };
  } catch {
    return { ...DEFAULT_PROGRESS, openedChests: [] };
  }
}

export function saveProgress(progress: Progress): void {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    // ignore (private browsing / storage disabled)
  }
}

/** Today as a YYYY-MM-DD string in the player's local timezone — the Lucky Wheel's "once a day" unit. */
export function todayKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
