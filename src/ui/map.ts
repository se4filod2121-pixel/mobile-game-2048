import type { HouseState } from "../game/levels";

const ROW_HEIGHT = 84;
const TOP_PAD = 50;
const BOTTOM_PAD = 60;
const SVG_NS = "http://www.w3.org/2000/svg";

/** Six distinct path silhouettes, cycled per level so no two consecutive villages look alike. */
const PATH_SHAPES: Array<(i: number) => number> = [
  (i) => 50 + 27 * Math.sin(i * 0.5), // gentle S-curve
  (i) => 50 + 30 * Math.sin(i * 1.05), // sharp zigzag switchbacks
  (i) => 50 + 32 * Math.sin(i * 0.3), // wide, slow loops
  (i) => 50 + 18 * Math.sin(i * 0.85), // tight wiggle
  (i) => 50 + 22 * Math.sin(i * 0.4) + 9 * Math.sin(i * 1.3), // organic drift
  (i) => 50 + 29 * Math.sin(i * 0.7 + 0.6), // phase-shifted weave
];

const STATUS_ICON: Record<HouseState["status"], string> = {
  cleared: "⭐",
  active: "🏠",
  locked: "🔒",
};

const FOREST_EMOJI = ["🌲", "🌳", "🌿", "🍃"];
const CITY_EMOJI = ["🏛️", "🚪", "✨", "🏙️"];

/** Small deterministic PRNG so a village's decoration looks the same every time it's rendered. */
function mulberry32(seed: number): () => number {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function renderScenery(container: HTMLElement, height: number, level: number, isFinal: boolean): void {
  container.innerHTML = "";
  const rand = mulberry32(level * 7919 + 13);
  const pool = isFinal ? CITY_EMOJI : FOREST_EMOJI;
  const count = Math.max(8, Math.round(height / 70));
  for (let i = 0; i < count; i++) {
    const el = document.createElement("span");
    el.className = "scenery-item";
    el.textContent = pool[Math.floor(rand() * pool.length)];
    el.style.left = `${4 + rand() * 92}%`;
    el.style.top = `${rand() * height}px`;
    el.style.fontSize = `${1.1 + rand() * 1.1}rem`;
    el.style.opacity = String(0.16 + rand() * 0.2);
    el.style.transform = `rotate(${(rand() - 0.5) * 30}deg)`;
    container.appendChild(el);
  }
}

export function renderVillageMap(
  forestEl: HTMLElement,
  pathEl: HTMLElement,
  svgEl: SVGSVGElement,
  houses: HouseState[],
  level: number,
  pathVariant: number,
  isFinal: boolean,
  onSelect: (house: HouseState) => void,
): HTMLElement | null {
  pathEl.innerHTML = "";
  while (svgEl.firstChild) svgEl.removeChild(svgEl.firstChild);

  const count = houses.length;
  const height = TOP_PAD + (count - 1) * ROW_HEIGHT + BOTTOM_PAD;
  pathEl.style.height = `${height}px`;
  svgEl.setAttribute("viewBox", `0 0 100 ${height}`);
  svgEl.setAttribute("preserveAspectRatio", "none");
  svgEl.style.height = `${height}px`;

  renderScenery(forestEl, height, level, isFinal);

  const shapeFn = PATH_SHAPES[pathVariant] ?? PATH_SHAPES[0];
  const points = houses.map((_, i) => ({ x: shapeFn(i), y: TOP_PAD + i * ROW_HEIGHT }));

  const path = document.createElementNS(SVG_NS, "path");
  const d = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  path.setAttribute("d", d);
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", "rgba(255,255,255,0.32)");
  path.setAttribute("stroke-width", "1.4");
  path.setAttribute("stroke-dasharray", "4 6");
  path.setAttribute("stroke-linecap", "round");
  path.setAttribute("vector-effect", "non-scaling-stroke");
  svgEl.appendChild(path);

  let activeEl: HTMLElement | null = null;

  houses.forEach((house, i) => {
    const { x, y } = points[i];
    const node = document.createElement("button");
    node.type = "button";
    node.className = `house house-${house.status}`;
    node.style.left = `${x}%`;
    node.style.top = `${y}px`;
    node.disabled = house.status !== "active";

    const icon = document.createElement("span");
    icon.className = "house-icon";
    icon.textContent =
      isFinal && house.index === houses.length && house.status !== "locked" ? "🏛️" : STATUS_ICON[house.status];
    node.appendChild(icon);

    const label = document.createElement("span");
    label.className = "house-label";
    label.textContent = String(house.index);
    node.appendChild(label);

    if (house.status === "active") {
      const target = document.createElement("span");
      target.className = "house-target";
      target.textContent = `🎯 ${house.target}`;
      node.appendChild(target);
      activeEl = node;
    }

    node.addEventListener("click", () => onSelect(house));
    pathEl.appendChild(node);
  });

  return activeEl;
}
