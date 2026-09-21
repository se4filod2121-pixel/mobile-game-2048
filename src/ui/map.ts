import type { HouseStatus, JourneyNode, VillageOverviewEntry } from "../game/levels";
import { BADGE_ICON, CITY_ICONS, SCENERY_ICONS, ensureIconDefs, makeIconUse } from "./icons";

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

function pathVariantForLevel(level: number): number {
  return (level - 1) % PATH_SHAPES.length;
}

/** Small deterministic PRNG so the scenery looks the same on every render, not reshuffled each frame. */
function mulberry32(seed: number): () => number {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A smooth flowing curve through every point, built cheaply with quadratic segments to each midpoint. */
function smoothPathD(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const mx = (points[i].x + points[i + 1].x) / 2;
    const my = (points[i].y + points[i + 1].y) / 2;
    d += ` Q ${points[i].x} ${points[i].y} ${mx} ${my}`;
  }
  const last = points[points.length - 1];
  d += ` L ${last.x} ${last.y}`;
  return d;
}

export function renderJourney(
  forestEl: HTMLElement,
  pathEl: HTMLElement,
  svgEl: SVGSVGElement,
  nodes: JourneyNode[],
  onSelect: (node: JourneyNode) => void,
): HTMLElement | null {
  ensureIconDefs();
  pathEl.innerHTML = "";
  forestEl.innerHTML = "";
  while (svgEl.firstChild) svgEl.removeChild(svgEl.firstChild);

  const count = nodes.length;
  const height = TOP_PAD + (count - 1) * ROW_HEIGHT + BOTTOM_PAD;
  pathEl.style.height = `${height}px`;
  forestEl.style.height = `${height}px`;
  svgEl.setAttribute("viewBox", `0 0 100 ${height}`);
  svgEl.setAttribute("preserveAspectRatio", "none");
  svgEl.style.height = `${height}px`;

  const points = nodes.map((node) => ({
    x: PATH_SHAPES[pathVariantForLevel(node.level)](node.indexInLevel - 1),
    y: TOP_PAD + (node.gate - 1) * ROW_HEIGHT,
  }));

  // Groove (dark base) + bead overlay (round dashes) — a coin-chain trail without one DOM node per bead.
  const d = smoothPathD(points);
  const groove = document.createElementNS(SVG_NS, "path");
  groove.setAttribute("d", d);
  groove.setAttribute("fill", "none");
  groove.setAttribute("stroke", "#7a5a26");
  groove.setAttribute("stroke-width", "2.6");
  groove.setAttribute("stroke-linecap", "round");
  groove.setAttribute("opacity", "0.55");
  groove.setAttribute("vector-effect", "non-scaling-stroke");
  svgEl.appendChild(groove);

  const beads = document.createElementNS(SVG_NS, "path");
  beads.setAttribute("d", d);
  beads.setAttribute("fill", "none");
  beads.setAttribute("stroke", "#ffd76b");
  beads.setAttribute("stroke-width", "2.6");
  beads.setAttribute("stroke-linecap", "round");
  beads.setAttribute("stroke-dasharray", "0.6 3.2");
  beads.setAttribute("vector-effect", "non-scaling-stroke");
  svgEl.appendChild(beads);

  // Sparse flanking scenery: bushes/props sit beside the road, biased to the open side.
  const rand = mulberry32(42);
  for (let i = 0; i < count; i++) {
    if (rand() > 0.4) continue;
    const node = nodes[i];
    const { x, y } = points[i];
    const onRight = x < 50;
    const pool = node.isFinalLevel ? CITY_ICONS : SCENERY_ICONS;
    const iconId = pool[Math.floor(rand() * pool.length)];
    const size = Math.round(34 + rand() * 24);
    const el = makeIconUse(iconId, size, "scenery-item");
    el.style.left = `${onRight ? 68 + rand() * 24 : 8 + rand() * 24}%`;
    el.style.top = `${y + (rand() - 0.5) * ROW_HEIGHT * 0.7}px`;
    el.style.transform = `translate(-50%, -85%) rotate(${(rand() - 0.5) * 14}deg)`;
    forestEl.appendChild(el);
  }

  let activeEl: HTMLElement | null = null;

  nodes.forEach((node, i) => {
    const { x, y } = points[i];

    if (node.isFirstOfLevel) {
      const banner = document.createElement("div");
      banner.className = `village-banner-marker${node.isFinalLevel ? " village-banner-marker-final" : ""}`;
      banner.style.top = `${y - 46}px`;
      const icon = document.createElement("span");
      icon.textContent = node.villageIcon;
      banner.appendChild(icon);
      const name = document.createElement("span");
      name.textContent = node.villageName;
      banner.appendChild(name);
      pathEl.appendChild(banner);
    }

    const house = document.createElement("button");
    house.type = "button";
    house.className = `house house-${node.status}`;
    house.style.left = `${x}%`;
    house.style.top = `${y}px`;
    house.disabled = node.status !== "active";

    const icon = document.createElement("span");
    icon.className = "house-icon";
    const badgeId =
      node.isLastGate && node.status !== "locked" ? BADGE_ICON.final : BADGE_ICON[node.status];
    icon.appendChild(makeIconUse(badgeId, 54, "house-badge"));
    house.appendChild(icon);

    const label = document.createElement("span");
    label.className = "house-label";
    label.textContent = String(node.gate);
    house.appendChild(label);

    if (node.status === "active") {
      const target = document.createElement("span");
      target.className = "house-target";
      target.textContent = `🎯 ${node.target}`;
      house.appendChild(target);
      activeEl = house;
    }

    house.addEventListener("click", () => onSelect(node));
    pathEl.appendChild(house);
  });

  return activeEl;
}

const VILLAGE_ROW_STATUS_BADGE: Record<HouseStatus, string> = {
  cleared: "⭐",
  active: "▶️",
  locked: "🔒",
};

/** The full 50-village journey list, so a player can see how far the road goes. */
export function renderVillageOverview(
  listEl: HTMLElement,
  entries: VillageOverviewEntry[],
  onSelectActive: () => void,
): HTMLElement | null {
  listEl.innerHTML = "";
  let activeEl: HTMLElement | null = null;

  entries.forEach((entry) => {
    const isActive = entry.status === "active";
    const row = document.createElement(isActive ? "button" : "div") as HTMLElement;
    if (isActive) (row as HTMLButtonElement).type = "button";
    row.className = `village-row village-row-${entry.status}${entry.isFinal ? " village-row-final" : ""}`;

    const icon = document.createElement("span");
    icon.className = "village-row-icon";
    icon.textContent = entry.icon;
    row.appendChild(icon);

    const text = document.createElement("span");
    text.className = "village-row-text";

    const name = document.createElement("span");
    name.className = "village-row-name";
    name.textContent = `${entry.level}. ${entry.name}`;
    text.appendChild(name);

    const range = document.createElement("span");
    range.className = "village-row-range";
    range.textContent = `Kapı ${entry.firstGate}-${entry.lastGate}`;
    text.appendChild(range);

    row.appendChild(text);

    const status = document.createElement("span");
    status.className = "village-row-status";
    status.textContent = VILLAGE_ROW_STATUS_BADGE[entry.status];
    row.appendChild(status);

    if (isActive) {
      row.addEventListener("click", onSelectActive);
      activeEl = row;
    }

    listEl.appendChild(row);
  });

  return activeEl;
}
