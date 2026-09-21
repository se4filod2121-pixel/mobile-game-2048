import { GRID_SIZE, type Direction, type MoveResult, type Tile } from "./types";

let nextId = 1;
export function resetIds(): void {
  nextId = 1;
}
function newId(): number {
  return nextId++;
}

function cellKey(row: number, col: number): string {
  return `${row},${col}`;
}

function tileGrid(tiles: Tile[]): Map<string, Tile> {
  const grid = new Map<string, Tile>();
  for (const tile of tiles) grid.set(cellKey(tile.row, tile.col), tile);
  return grid;
}

export function emptyCells(tiles: Tile[]): Array<{ row: number; col: number }> {
  const occupied = tileGrid(tiles);
  const cells: Array<{ row: number; col: number }> = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (!occupied.has(cellKey(row, col))) cells.push({ row, col });
    }
  }
  return cells;
}

/** Spawns a random tile (90% a 2, 10% a 4) in a random empty cell. Returns a new tiles array. */
export function spawnRandomTile(tiles: Tile[]): Tile[] {
  const free = emptyCells(tiles);
  if (free.length === 0) return tiles;
  const spot = free[Math.floor(Math.random() * free.length)];
  const value = Math.random() < 0.9 ? 2 : 4;
  const tile: Tile = { id: newId(), value, row: spot.row, col: spot.col, isNew: true };
  return [...tiles, tile];
}

/** Ordered (row,col) coordinates of each of the 4 lines for a move in `direction`, traversed far-edge-first. */
function linesForDirection(
  direction: Direction,
): Array<Array<{ row: number; col: number }>> {
  const lines: Array<Array<{ row: number; col: number }>> = [];
  for (let i = 0; i < GRID_SIZE; i++) {
    const line: Array<{ row: number; col: number }> = [];
    for (let j = 0; j < GRID_SIZE; j++) {
      switch (direction) {
        case "left":
          line.push({ row: i, col: j });
          break;
        case "right":
          line.push({ row: i, col: GRID_SIZE - 1 - j });
          break;
        case "up":
          line.push({ row: j, col: i });
          break;
        case "down":
          line.push({ row: GRID_SIZE - 1 - j, col: i });
          break;
      }
    }
    lines.push(line);
  }
  return lines;
}

export function move(tiles: Tile[], direction: Direction): MoveResult {
  const grid = tileGrid(tiles);
  const lines = linesForDirection(direction);
  const resultTiles: Tile[] = [];
  let scoreGained = 0;
  let moved = false;

  for (const coords of lines) {
    const lineTiles = coords
      .map((c) => grid.get(cellKey(c.row, c.col)))
      .filter((t): t is Tile => t !== undefined);

    const merged: Tile[] = [];
    let skipNext = false;
    for (let j = 0; j < lineTiles.length; j++) {
      if (skipNext) {
        skipNext = false;
        continue;
      }
      const current = lineTiles[j];
      const next = lineTiles[j + 1];
      if (next && next.value === current.value) {
        const value = current.value * 2;
        merged.push({
          id: newId(),
          value,
          row: current.row,
          col: current.col,
          mergedFrom: [current.id, next.id],
        });
        scoreGained += value;
        skipNext = true;
      } else {
        merged.push({ ...current });
      }
    }

    for (let k = 0; k < merged.length; k++) {
      const target = coords[k];
      const tile = merged[k];
      if (tile.row !== target.row || tile.col !== target.col) moved = true;
      tile.row = target.row;
      tile.col = target.col;
      resultTiles.push(tile);
    }
    if (merged.length !== lineTiles.length) moved = true;
  }

  return { tiles: resultTiles, scoreGained, moved };
}

export function hasWinningTile(tiles: Tile[]): boolean {
  return tiles.some((t) => t.value >= 2048);
}

export function canMove(tiles: Tile[]): boolean {
  if (emptyCells(tiles).length > 0) return true;
  const grid = tileGrid(tiles);
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const value = grid.get(cellKey(row, col))?.value;
      if (value === undefined) continue;
      const right = grid.get(cellKey(row, col + 1))?.value;
      const down = grid.get(cellKey(row + 1, col))?.value;
      if (value === right || value === down) return true;
    }
  }
  return false;
}

export function createInitialTiles(): Tile[] {
  resetIds();
  let tiles: Tile[] = [];
  tiles = spawnRandomTile(tiles);
  tiles = spawnRandomTile(tiles);
  return tiles;
}
