import "./style.css";
import { canMove, createInitialTiles, move, spawnRandomTile } from "./game/engine";
import {
  GATES_PER_LEVEL,
  TOTAL_GATES,
  awardsJoker,
  buildJourney,
  buildVillageOverview,
  gateForHouse,
  hueForLevel,
  isFinalLevel,
  levelForGate,
  targetForGate,
  villageIconForLevel,
  villageNameForLevel,
} from "./game/levels";
import { loadProgress, saveProgress, todayKey, type Progress } from "./game/storage";
import type { Direction, Tile } from "./game/types";
import { computeMetrics, renderGridBackground, renderTiles } from "./ui/render";
import { attachInput } from "./ui/input";
import { renderJourney, renderVillageOverview } from "./ui/map";
import { CHEST_ICON_OPEN, makeIconUse } from "./ui/icons";

const mapScreenEl = document.getElementById("map-screen") as HTMLElement;
const overviewScreenEl = document.getElementById("overview-screen") as HTMLElement;
const boardScreenEl = document.getElementById("board-screen") as HTMLElement;
const villageIconEl = document.getElementById("village-icon") as HTMLElement;
const villageNameEl = document.getElementById("village-name") as HTMLElement;
const villageSubEl = document.getElementById("village-sub") as HTMLElement;
const mapForestEl = document.getElementById("map-forest") as HTMLElement;
const mapPathEl = document.getElementById("map-path") as HTMLElement;
const mapSvgEl = document.getElementById("map-svg") as unknown as SVGSVGElement;
const overviewListEl = document.getElementById("overview-list") as HTMLElement;
const openOverviewBtn = document.getElementById("open-overview") as HTMLButtonElement;
const closeOverviewBtn = document.getElementById("close-overview") as HTMLButtonElement;
const backToMapBtn = document.getElementById("back-to-map") as HTMLButtonElement;

const boardEl = document.getElementById("board") as HTMLElement;
const gridBgEl = document.getElementById("grid-bg") as HTMLElement;
const tilesEl = document.getElementById("tiles") as HTMLElement;
const levelChipEl = document.getElementById("level-chip") as HTMLElement;
const jokerChipEl = document.getElementById("joker-chip") as HTMLElement;
const goldChipEl = document.getElementById("gold-chip") as HTMLElement;
const gateLabelEl = document.getElementById("gate-label") as HTMLElement;
const gateScoreLabelEl = document.getElementById("gate-score-label") as HTMLElement;
const progressFillEl = document.getElementById("progress-fill") as HTMLElement;
const newGameBtn = document.getElementById("new-game") as HTMLButtonElement;
const undoBtn = document.getElementById("undo-move") as HTMLButtonElement;
const overlayEl = document.getElementById("overlay") as HTMLElement;
const overlayMessageEl = document.getElementById("overlay-message") as HTMLElement;
const overlayPrimaryBtn = document.getElementById("overlay-primary") as HTMLButtonElement;
const toastContainerEl = document.getElementById("toast-container") as HTMLElement;

const openWheelBtn = document.getElementById("open-wheel") as HTMLButtonElement;
const closeWheelBtn = document.getElementById("close-wheel") as HTMLButtonElement;
const wheelModalEl = document.getElementById("wheel-modal") as HTMLElement;
const wheelDiscEl = document.getElementById("wheel-disc") as HTMLElement;
const wheelStatusEl = document.getElementById("wheel-status") as HTMLElement;
const spinWheelBtn = document.getElementById("spin-wheel") as HTMLButtonElement;

interface State {
  tiles: Tile[];
  gateScore: number;
  over: boolean;
  progress: Progress;
  openedChests: Set<number>;
  /** One-step undo buffer: the board just before the last move, cleared at every new gate
   *  and consumed (not chained) the moment it's used. */
  previousTiles: Tile[] | null;
  previousGateScore: number;
}

const loadedProgress = loadProgress();
const state: State = {
  tiles: [],
  gateScore: 0,
  over: false,
  progress: loadedProgress,
  openedChests: new Set(loadedProgress.openedChests),
  previousTiles: null,
  previousGateScore: 0,
};

function persistProgress(): void {
  state.progress.openedChests = Array.from(state.openedChests);
  saveProgress(state.progress);
}

function vibrate(pattern: number | number[]): void {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // ignore (unsupported or blocked by browser policy)
  }
}

const MAX_VISIBLE_TOASTS = 3;

function showToast(message: string, variant: string): void {
  while (toastContainerEl.children.length >= MAX_VISIBLE_TOASTS) {
    toastContainerEl.firstElementChild?.remove();
  }
  const el = document.createElement("div");
  el.className = `toast toast-${variant}`;
  el.textContent = message;
  toastContainerEl.appendChild(el);
  window.setTimeout(() => {
    el.classList.add("toast-out");
    el.addEventListener("animationend", () => el.remove(), { once: true });
  }, 1400);
}

function showScorePopup(amount: number): void {
  const container = gateScoreLabelEl.parentElement;
  if (!container) return;
  const popup = document.createElement("span");
  popup.className = "score-popup";
  popup.textContent = `+${amount}`;
  container.appendChild(popup);
  popup.addEventListener("animationend", () => popup.remove(), { once: true });
}

function hideOverlay(): void {
  overlayEl.hidden = true;
}

function showOverlay(message: string, primaryLabel: string): void {
  overlayMessageEl.textContent = message;
  overlayPrimaryBtn.textContent = primaryLabel;
  overlayEl.hidden = false;
}

function applyLevelTheme(): void {
  const level = levelForGate(state.progress.currentGate);
  document.documentElement.style.setProperty("--hue", String(hueForLevel(level)));
}

function updateHeaderInfo(): void {
  const gate = state.progress.currentGate;
  const level = levelForGate(gate);
  const target = targetForGate(gate);
  levelChipEl.textContent = `Seviye ${level}`;
  jokerChipEl.textContent = `🃏 ${state.progress.jokerCount}`;
  goldChipEl.textContent = `🪙 ${state.progress.gold}`;
  gateLabelEl.textContent = `Kapı ${gate} / ${TOTAL_GATES}`;
  gateScoreLabelEl.textContent = `${state.gateScore} / ${target}`;
  progressFillEl.style.width = `${Math.min(100, (state.gateScore / target) * 100)}%`;
  undoBtn.textContent = `↩️ Geri Al (${state.progress.undoCount})`;
  undoBtn.disabled = state.progress.undoCount <= 0 || state.previousTiles === null;
}

function render(): void {
  updateHeaderInfo();
  const metrics = computeMetrics(boardEl);
  renderTiles(tilesEl, state.tiles, metrics);
}

function startGate(): void {
  state.tiles = createInitialTiles();
  state.gateScore = 0;
  state.over = false;
  state.previousTiles = null;
  state.previousGateScore = 0;
  hideOverlay();
  applyLevelTheme();
  render();
}

function hideAllScreens(): void {
  mapScreenEl.hidden = true;
  overviewScreenEl.hidden = true;
  boardScreenEl.hidden = true;
}

function showBoardScreen(): void {
  hideAllScreens();
  boardScreenEl.hidden = false;
  startGate();
}

/** Rewards a treasure chest can pay out. Mostly gold, with a smaller chance of a rarer
 *  Undo or Joker charge — those two are the game's scarcer, more powerful currencies. */
function rollChestReward(): { message: string } {
  const roll = Math.random();
  if (roll < 0.12) {
    state.progress.jokerCount += 1;
    return { message: "🃏 Hazineden bir Joker çıktı!" };
  }
  if (roll < 0.32) {
    state.progress.undoCount += 1;
    return { message: "↩️ Hazineden bir Geri Alma hakkı çıktı!" };
  }
  const amount = 40 + Math.floor(Math.random() * 61);
  state.progress.gold += amount;
  return { message: `🪙 Hazineden ${amount} altın çıktı!` };
}

function openChest(gate: number, chestEl: HTMLElement): void {
  if (state.openedChests.has(gate)) return;
  state.openedChests.add(gate);
  const reward = rollChestReward();
  persistProgress();
  updateHeaderInfo();

  chestEl.classList.remove("map-chest-closed");
  chestEl.classList.add("map-chest-open", "chest-just-opened");
  if (chestEl instanceof HTMLButtonElement) chestEl.disabled = true;
  chestEl.replaceChildren(makeIconUse(CHEST_ICON_OPEN, 44, "chest-icon"));
  vibrate([20, 30, 20, 30, 60]);
  showToast(reward.message, "chest");
}

function showMapScreen(): void {
  hideAllScreens();
  mapScreenEl.hidden = false;
  applyLevelTheme();

  const level = levelForGate(state.progress.currentGate);
  const isFinal = isFinalLevel(level);
  villageIconEl.textContent = villageIconForLevel(level);
  villageNameEl.textContent = villageNameForLevel(level);
  const firstGate = gateForHouse(level, 1);
  const lastGate = gateForHouse(level, GATES_PER_LEVEL);
  villageSubEl.textContent = isFinal
    ? `🏁 Son durak • Kapı ${firstGate}-${lastGate}`
    : `Seviye ${level} • Kapı ${firstGate}-${lastGate}`;

  // buildJourney(currentGate) turns the persisted progress (storage.ts) into per-gate
  // locked/active/cleared status for all 1000 nodes; renderJourney's callback here is
  // this project's `startLevel(levelNumber)` — clicking the active house opens its board.
  const journey = buildJourney(state.progress.currentGate);
  const activeEl = renderJourney(
    mapForestEl,
    mapPathEl,
    mapSvgEl,
    journey,
    state.openedChests,
    (node) => {
      if (node.status === "active") showBoardScreen();
    },
    openChest,
  );
  if (activeEl) {
    // Auto-focus on the player's current house every time the map is (re)opened.
    window.requestAnimationFrame(() => {
      activeEl.scrollIntoView({ block: "center", behavior: "auto" });
    });
  }
}

function showOverviewScreen(): void {
  hideAllScreens();
  overviewScreenEl.hidden = false;

  const entries = buildVillageOverview(state.progress.currentGate);
  const activeEl = renderVillageOverview(overviewListEl, entries, showMapScreen);
  if (activeEl) {
    window.requestAnimationFrame(() => {
      activeEl.scrollIntoView({ block: "center", behavior: "auto" });
    });
  }
}

function showFinalVictory(): void {
  vibrate([40, 60, 40, 60, 40, 60, 120]);
  showOverlay("🏆 1000 kapıyı da tamamladın!", "Baştan Oyna");
  state.over = true;
}

function clearGate(): void {
  vibrate([20, 40, 20]);
  const finishedGate = state.progress.currentGate;
  const finishedLevel = levelForGate(finishedGate);
  const earnedJoker = awardsJoker(finishedGate);
  if (earnedJoker) {
    state.progress.jokerCount += 1;
  }

  if (finishedGate >= TOTAL_GATES) {
    persistProgress();
    updateHeaderInfo();
    showFinalVictory();
    return;
  }

  state.progress.currentGate = finishedGate + 1;
  persistProgress();
  const newLevel = levelForGate(state.progress.currentGate);
  const leveledUp = newLevel !== finishedLevel;

  if (leveledUp && earnedJoker) {
    showToast(`🎊 Seviye ${newLevel}! + 🃏 Joker kazandın!`, "level-up");
  } else if (leveledUp) {
    showToast(`🎊 Seviye ${newLevel}!`, "level-up");
  } else if (earnedJoker) {
    showToast("🃏 Joker kazandın!", "joker");
  } else {
    showToast(`✅ Kapı ${finishedGate} tamamlandı!`, "gate");
  }

  window.setTimeout(showMapScreen, leveledUp ? 1100 : 700);
}

function rescueBoardWithJoker(): void {
  const sorted = [...state.tiles].sort((a, b) => a.value - b.value);
  const toRemove = new Set(sorted.slice(0, Math.min(2, sorted.length)).map((t) => t.id));
  state.tiles = state.tiles.filter((t) => !toRemove.has(t.id));
  state.tiles = spawnRandomTile(state.tiles);
}

function handleNoMoves(): void {
  if (state.progress.jokerCount > 0) {
    state.progress.jokerCount -= 1;
    persistProgress();
    rescueBoardWithJoker();
    vibrate([15, 30, 15, 30, 60]);
    showToast("🃏 Joker kullanıldı, oyun devam ediyor!", "joker-used");
    render();
    return;
  }

  state.over = true;
  vibrate(80);
  showOverlay(`Kapı ${state.progress.currentGate} tamamlanamadı`, "Kapıyı Tekrar Dene");
}

function handleUndo(): void {
  if (state.progress.undoCount <= 0 || state.previousTiles === null) return;
  state.tiles = state.previousTiles;
  state.gateScore = state.previousGateScore;
  state.previousTiles = null;
  state.progress.undoCount -= 1;
  state.over = false;
  hideOverlay();
  persistProgress();
  vibrate(25);
  showToast("↩️ Son hamle geri alındı", "undo");
  render();
}

function handleDirection(direction: Direction): void {
  if (state.over) return;

  const result = move(state.tiles, direction);
  if (!result.moved) return;

  state.previousTiles = state.tiles;
  state.previousGateScore = state.gateScore;

  state.tiles = result.tiles;
  state.gateScore += result.scoreGained;
  state.tiles = spawnRandomTile(state.tiles);
  render();

  if (result.scoreGained > 0) {
    showScorePopup(result.scoreGained);
    vibrate(20);
  } else {
    vibrate(10);
  }

  if (state.gateScore >= targetForGate(state.progress.currentGate)) {
    clearGate();
    return;
  }

  if (!canMove(state.tiles)) {
    handleNoMoves();
  }
}

// --- Lucky Wheel -----------------------------------------------------------------------

type WheelPrize = { label: string; apply: () => string };

function goldPrize(label: string, amount: number): WheelPrize {
  return {
    label,
    apply: () => {
      state.progress.gold += amount;
      return `🪙 ${amount} altın kazandın!`;
    },
  };
}

const undoPrize: WheelPrize = {
  label: "↩️ Undo",
  apply: () => {
    state.progress.undoCount += 1;
    return "↩️ 1 Geri Alma hakkı kazandın!";
  },
};

const jokerPrize: WheelPrize = {
  label: "🃏 Joker",
  apply: () => {
    state.progress.jokerCount += 1;
    return "🃏 1 Joker kazandın!";
  },
};

const WHEEL_PRIZES: WheelPrize[] = [
  goldPrize("🪙 20", 20),
  undoPrize,
  goldPrize("🪙 50", 50),
  jokerPrize,
  goldPrize("🪙 30", 30),
  goldPrize("🪙 80", 80),
  undoPrize,
  goldPrize("🪙 150", 150),
];

let wheelRotation = 0;
let wheelSpinning = false;

function buildWheelDisc(): void {
  const segAngle = 360 / WHEEL_PRIZES.length;
  const colors = ["#f9a826", "#f4511e"];
  const stops = WHEEL_PRIZES.map((_, i) => {
    const from = i * segAngle;
    const to = from + segAngle;
    return `${colors[i % 2]} ${from}deg ${to}deg`;
  });
  wheelDiscEl.style.background = `conic-gradient(${stops.join(", ")})`;
  wheelDiscEl.innerHTML = "";
  WHEEL_PRIZES.forEach((prize, i) => {
    const label = document.createElement("span");
    label.className = "wheel-label";
    label.textContent = prize.label;
    const angle = i * segAngle + segAngle / 2;
    label.style.transform = `rotate(${angle}deg) translateY(-98px) rotate(${-angle}deg)`;
    wheelDiscEl.appendChild(label);
  });
}

function refreshWheelStatus(): void {
  const alreadySpunToday = state.progress.lastWheelSpinDate === todayKey();
  spinWheelBtn.disabled = alreadySpunToday || wheelSpinning;
  wheelStatusEl.textContent = alreadySpunToday
    ? "Bugünkü ücretsiz çevirişini kullandın, yarın tekrar gel! 🌙"
    : "Günlük ücretsiz çevirişin hazır! 🎉";
}

function openWheelModal(): void {
  refreshWheelStatus();
  wheelModalEl.hidden = false;
}

function closeWheelModal(): void {
  wheelModalEl.hidden = true;
}

function spinWheel(): void {
  if (wheelSpinning || state.progress.lastWheelSpinDate === todayKey()) return;
  wheelSpinning = true;
  spinWheelBtn.disabled = true;

  const segAngle = 360 / WHEEL_PRIZES.length;
  const targetIndex = Math.floor(Math.random() * WHEEL_PRIZES.length);
  const targetCenter = targetIndex * segAngle + segAngle / 2;
  const extraSpins = 6;
  wheelRotation += extraSpins * 360 + ((360 - targetCenter - (wheelRotation % 360)) % 360);
  wheelDiscEl.style.transform = `rotate(${wheelRotation}deg)`;
  wheelStatusEl.textContent = "Çark dönüyor... 🎡";
  vibrate(15);

  window.setTimeout(() => {
    const prize = WHEEL_PRIZES[targetIndex];
    const message = prize.apply();
    state.progress.lastWheelSpinDate = todayKey();
    persistProgress();
    updateHeaderInfo();
    wheelSpinning = false;
    wheelStatusEl.textContent = message;
    spinWheelBtn.disabled = true;
    vibrate([20, 40, 20, 40, 80]);
    showToast(message, "wheel");
  }, 3300);
}

window.addEventListener("resize", () => {
  if (!boardScreenEl.hidden) render();
});

newGameBtn.addEventListener("click", startGate);
undoBtn.addEventListener("click", handleUndo);
backToMapBtn.addEventListener("click", showMapScreen);
openOverviewBtn.addEventListener("click", showOverviewScreen);
closeOverviewBtn.addEventListener("click", showMapScreen);
openWheelBtn.addEventListener("click", openWheelModal);
closeWheelBtn.addEventListener("click", closeWheelModal);
spinWheelBtn.addEventListener("click", spinWheel);
wheelModalEl.addEventListener("click", (e) => {
  if (e.target === wheelModalEl) closeWheelModal();
});

overlayPrimaryBtn.addEventListener("click", () => {
  if (state.progress.currentGate >= TOTAL_GATES && state.over) {
    state.progress = { ...state.progress, currentGate: 1, jokerCount: 0 };
    persistProgress();
    showMapScreen();
    return;
  }
  startGate();
});

attachInput(boardEl, handleDirection);

renderGridBackground(gridBgEl);
buildWheelDisc();
updateHeaderInfo();
showMapScreen();
