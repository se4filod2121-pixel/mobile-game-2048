const PROGRESS_KEY = "mobile-game-2048-progress-v2";

export interface Progress {
  currentGate: number;
  jokerCount: number;
}

const DEFAULT_PROGRESS: Progress = { currentGate: 1, jokerCount: 0 };

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return { ...DEFAULT_PROGRESS };
    const parsed = JSON.parse(raw) as Partial<Progress>;
    const currentGate = Number(parsed.currentGate);
    const jokerCount = Number(parsed.jokerCount);
    return {
      currentGate: Number.isFinite(currentGate) && currentGate >= 1 ? currentGate : 1,
      jokerCount: Number.isFinite(jokerCount) && jokerCount >= 0 ? jokerCount : 0,
    };
  } catch {
    return { ...DEFAULT_PROGRESS };
  }
}

export function saveProgress(progress: Progress): void {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    // ignore (private browsing / storage disabled)
  }
}
