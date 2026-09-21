import { GRID_SIZE, type Tile } from "../game/types";

export interface CellMetrics {
  cellSize: number;
  gap: number;
}

/** Board padding/gap is a fraction of the board's pixel size, so it scales on any screen. */
export function computeMetrics(boardEl: HTMLElement): CellMetrics {
  const size = boardEl.clientWidth;
  const gap = Math.round(size * 0.03);
  const cellSize = (size - gap * (GRID_SIZE + 1)) / GRID_SIZE;
  return { cellSize, gap };
}

export function renderGridBackground(gridEl: HTMLElement): void {
  gridEl.innerHTML = "";
  for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
    const cell = document.createElement("div");
    cell.className = "grid-cell";
    gridEl.appendChild(cell);
  }
}

function tileValueClass(value: number): string {
  return value <= 2048 ? `tile-${value}` : "tile-super";
}

function tilePosition(row: number, col: number, metrics: CellMetrics): { x: number; y: number } {
  const { cellSize, gap } = metrics;
  return {
    x: gap + col * (cellSize + gap),
    y: gap + row * (cellSize + gap),
  };
}

export function renderTiles(container: HTMLElement, tiles: Tile[], metrics: CellMetrics): void {
  const existing = new Map<number, HTMLElement>();
  for (const el of Array.from(container.children)) {
    const id = Number((el as HTMLElement).dataset.id);
    existing.set(id, el as HTMLElement);
  }

  const seen = new Set<number>();
  for (const tile of tiles) {
    seen.add(tile.id);
    const { x, y } = tilePosition(tile.row, tile.col, metrics);
    let el = existing.get(tile.id);
    const shouldPop = !el || Boolean(tile.mergedFrom);
    if (!el) {
      el = document.createElement("div");
      el.dataset.id = String(tile.id);
      el.className = "tile";
      container.appendChild(el);
    }
    if (shouldPop) {
      el.classList.add("tile-pop");
      const currentEl = el;
      currentEl.addEventListener(
        "animationend",
        () => currentEl.classList.remove("tile-pop"),
        { once: true },
      );
    }

    el.className = `tile ${tileValueClass(tile.value)}${shouldPop ? " tile-pop" : ""}`;
    el.textContent = String(tile.value);
    el.style.width = `${metrics.cellSize}px`;
    el.style.height = `${metrics.cellSize}px`;
    el.style.transform = `translate(${x}px, ${y}px)`;
    el.style.fontSize = `${Math.max(16, metrics.cellSize * (tile.value < 100 ? 0.5 : tile.value < 1000 ? 0.42 : 0.32))}px`;
  }

  for (const [id, el] of existing) {
    if (!seen.has(id)) el.remove();
  }
}

export function repositionTiles(container: HTMLElement, tiles: Tile[], metrics: CellMetrics): void {
  for (const tile of tiles) {
    const el = container.querySelector<HTMLElement>(`[data-id="${tile.id}"]`);
    if (!el) continue;
    const { x, y } = tilePosition(tile.row, tile.col, metrics);
    el.style.width = `${metrics.cellSize}px`;
    el.style.height = `${metrics.cellSize}px`;
    el.style.transform = `translate(${x}px, ${y}px)`;
  }
}
