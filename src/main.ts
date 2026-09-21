import "./style.css";
import { canMove, createInitialTiles, move, spawnRandomTile } from "./game/engine";
import {
  GATES_PER_LEVEL,
  TOTAL_GATES,
  awardsJoker,
  buildHouseStates,
  buildVillageOverview,
  gateForHouse,
  hueForLevel,
  isFinalLevel,
  levelForGate,
  pathVariantForLevel,
  targetForGate,
  villageIconForLevel,
  villageNameForLevel,
} from "./game/levels";
import { loadProgress, saveProgress, type Progress } from "./game/storage";
import type { Direction, Tile } from "./game/types";
import { computeMetrics, renderGridBackground, renderTiles } from "./ui/render";
import { attachInput } from "./ui/input";
import { renderVillageMap, renderVillageOverview } from "./ui/map";

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
const gateLabelEl = document.getElementById("gate-label") as HTMLElement;
const gateScoreLabelEl = document.getElementById("gate-score-label") as HTMLElement;
const progressFillEl = document.getElementById("progress-fill") as HTMLElement;
const newGameBtn = document.getElementById("new-game") as HTMLButtonElement;
const overlayEl = document.getElementById("overlay") as HTMLElement;
const overlayMessageEl = document.getElementById("overlay-message") as HTMLElement;
const overlayPrimaryBtn = document.getElementById("overlay-primary") as HTMLButtonElement;
const toastContainerEl = document.getElementById("toast-container") as HTMLElement;

interface State {
  tiles: Tile[];
  gateScore: number;
  over: boolean;
  progress: Progress;
}

const state: State = {
  tiles: [],
  gateScore: 0,
  over: false,
  progress: loadProgress(),
};

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
  gateLabelEl.textContent = `Kapı ${gate} / ${TOTAL_GATES}`;
  gateScoreLabelEl.textContent = `${state.gateScore} / ${target}`;
  progressFillEl.style.width = `${Math.min(100, (state.gateScore / target) * 100)}%`;
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

  const houses = buildHouseStates(level, state.progress.currentGate);
  const activeEl = renderVillageMap(
    mapForestEl,
    mapPathEl,
    mapSvgEl,
    houses,
    level,
    pathVariantForLevel(level),
    isFinal,
    (house) => {
      if (house.status === "active") showBoardScreen();
    },
  );
  if (activeEl) {
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
    saveProgress(state.progress);
    updateHeaderInfo();
    showFinalVictory();
    return;
  }

  state.progress.currentGate = finishedGate + 1;
  saveProgress(state.progress);
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
    saveProgress(state.progress);
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

function handleDirection(direction: Direction): void {
  if (state.over) return;

  const result = move(state.tiles, direction);
  if (!result.moved) return;

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

window.addEventListener("resize", () => {
  if (!boardScreenEl.hidden) render();
});

newGameBtn.addEventListener("click", startGate);
backToMapBtn.addEventListener("click", showMapScreen);
openOverviewBtn.addEventListener("click", showOverviewScreen);
closeOverviewBtn.addEventListener("click", showMapScreen);

overlayPrimaryBtn.addEventListener("click", () => {
  if (state.progress.currentGate >= TOTAL_GATES && state.over) {
    state.progress = { currentGate: 1, jokerCount: 0 };
    saveProgress(state.progress);
    showMapScreen();
    return;
  }
  startGate();
});

attachInput(boardEl, handleDirection);

renderGridBackground(gridBgEl);
showMapScreen();
