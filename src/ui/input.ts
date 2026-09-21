import type { Direction } from "../game/types";

const SWIPE_THRESHOLD_PX = 24;

const KEY_DIRECTIONS: Record<string, Direction> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  w: "up",
  s: "down",
  a: "left",
  d: "right",
  W: "up",
  S: "down",
  A: "left",
  D: "right",
};

export function attachInput(target: HTMLElement, onDirection: (dir: Direction) => void): void {
  window.addEventListener("keydown", (event) => {
    const direction = KEY_DIRECTIONS[event.key];
    if (!direction) return;
    event.preventDefault();
    onDirection(direction);
  });

  let startX = 0;
  let startY = 0;
  let tracking = false;

  target.addEventListener(
    "touchstart",
    (event) => {
      if (event.touches.length !== 1) return;
      tracking = true;
      startX = event.touches[0].clientX;
      startY = event.touches[0].clientY;
    },
    { passive: true },
  );

  target.addEventListener(
    "touchmove",
    (event) => {
      if (tracking) event.preventDefault();
    },
    { passive: false },
  );

  target.addEventListener("touchend", (event) => {
    if (!tracking) return;
    tracking = false;
    const touch = event.changedTouches[0];
    if (!touch) return;
    const dx = touch.clientX - startX;
    const dy = touch.clientY - startY;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_THRESHOLD_PX) return;
    if (Math.abs(dx) > Math.abs(dy)) {
      onDirection(dx > 0 ? "right" : "left");
    } else {
      onDirection(dy > 0 ? "down" : "up");
    }
  });
}
