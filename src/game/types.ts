export const GRID_SIZE = 4;

export type Direction = "up" | "down" | "left" | "right";

export interface Tile {
  id: number;
  value: number;
  row: number;
  col: number;
  /** ids of the two tiles that merged into this one this turn, if any */
  mergedFrom?: [number, number];
  /** true if this tile was just spawned this turn */
  isNew?: boolean;
}

export interface MoveResult {
  tiles: Tile[];
  scoreGained: number;
  moved: boolean;
}
