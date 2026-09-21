import "./style.css";
import { canMove, createInitialTiles, hasWinningTile, move, spawnRandomTile } from "./game/engine";
import { loadBestScore, saveBestScore } from "./game/storage";
import type { Direction, Tile } from "./game/types";
import { computeMetrics, renderGridBackground, renderTiles } from "./ui/render";
import { attachInput } from "./ui/input";

const boardEl = document.getElementById("board") as HTMLElement;
const gridBgEl = document.getElementById("grid-bg") as HTMLElement;
const tilesEl = document.getElementById("tiles") as HTMLElement;
const scoreEl = document.getElementById("score") as HTMLElement;
const bestEl = document.getElementById("best") as HTMLElement;
const newGameBtn = document.getElementById("new-game") as HTMLButtonElement;
const overlayEl = document.getElementById("overlay") as HTMLElement;
const overlayMessageEl = document.getElementById("overlay-message") as HTMLElement;
const overlayPrimaryBtn = document.getElementById("overlay-primary") as HTMLButtonElement;
const overlaySecondaryBtn = document.getElementById("overlay-secondary") as HTMLButtonElement;

interface State {
  tiles: Tile[];
  score: number;
  best: number;
  won: boolean;
  keepPlaying: boolean;
  over: boolean;
}

const state: State = {
  tiles: [],
  score: 0,
  best: loadBestScore(),
  won: false,
  keepPlaying: false,
  over: false,
};

function hideOverlay(): void {
  overlayEl.hidden = true;
}

function showOverlay(message: string, primaryLabel: string, secondaryLabel?: string): void {
  overlayMessageEl.textContent = message;
  overlayPrimaryBtn.textContent = primaryLabel;
  if (secondaryLabel) {
    overlaySecondaryBtn.textContent = secondaryLabel;
    overlaySecondaryBtn.hidden = false;
  } else {
    overlaySecondaryBtn.hidden = true;
  }
  overlayEl.hidden = false;
}

function render(): void {
  scoreEl.textContent = String(state.score);
  bestEl.textContent = String(state.best);
  const metrics = computeMetrics(boardEl);
  renderTiles(tilesEl, state.tiles, metrics);
}

function startNewGame(): void {
  state.tiles = createInitialTiles();
  state.score = 0;
  state.won = false;
  state.keepPlaying = false;
  state.over = false;
  hideOverlay();
  render();
}

function handleDirection(direction: Direction): void {
  if (state.over) return;
  if (state.won && !state.keepPlaying) return;

  const result = move(state.tiles, direction);
  if (!result.moved) return;

  state.tiles = result.tiles;
  state.score += result.scoreGained;
  if (state.score > state.best) {
    state.best = state.score;
    saveBestScore(state.best);
  }

  state.tiles = spawnRandomTile(state.tiles);
  render();

  if (!state.won && hasWinningTile(state.tiles)) {
    state.won = true;
    showOverlay("2048'e ulaştın!", "Devam Et", "Yeni Oyun");
    return;
  }

  if (!canMove(state.tiles)) {
    state.over = true;
    showOverlay("Oyun bitti", "Tekrar Oyna");
  }
}

window.addEventListener("resize", render);

newGameBtn.addEventListener("click", startNewGame);

overlayPrimaryBtn.addEventListener("click", () => {
  if (state.won && !state.over) {
    state.keepPlaying = true;
    hideOverlay();
  } else {
    startNewGame();
  }
});

overlaySecondaryBtn.addEventListener("click", () => {
  startNewGame();
});

attachInput(boardEl, handleDirection);

renderGridBackground(gridBgEl);
startNewGame();
