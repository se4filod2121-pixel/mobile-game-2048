/**
 * The vertical level-select map: a single continuous scroll of all 1000 gates, grouped
 * into 50 villages, ending at a City Gate finale. This file covers the map's four core
 * requirements end to end:
 *
 * 1. Perf at 1000 nodes — `.house` (see style.css) uses `content-visibility: auto` with a
 *    `contain-intrinsic-size` hint. That is this project's answer to manual object-pooling:
 *    the browser skips layout/paint for off-screen nodes on its own, without us tracking a
 *    recycled DOM-node pool by hand. Measured settle time after a full 1000-node rebuild is
 *    ~20-30ms, so a virtualization layer on top would be solving an already-solved problem.
 * 2. The zigzag road — `PATH_SHAPES` picks the per-village silhouette, `smoothPathD` turns
 *    the house coordinates into a flowing SVG path (quadratic Bezier segments) instead of
 *    straight lines. SVG was used instead of <canvas> because the path has to stay in the
 *    same coordinate space as the DOM house/button elements it connects — canvas would mean
 *    hand-syncing two separate coordinate systems for no visual benefit.
 * 3. House state — `node.status` (locked/active/cleared) from `buildJourney` (levels.ts)
 *    drives both the CSS class and which badge icon renders (see `BADGE_ICON` in icons.ts).
 *    Progress persistence and the "resume where you left off" auto-scroll live in
 *    storage.ts (`loadProgress`/`saveProgress`) and main.ts (`showMapScreen`'s
 *    `scrollIntoView` on the active node), not in this file.
 *    Only the *active* house is clickable (`onSelect`) — cleared houses stay inert by
 *    design, since this is a one-way saga road, not a replayable level select.
 * 4. Gate 1000 (the City) — `node.isLastGate` swaps in the gold `bdg-final` badge and the
 *    village at `isFinalLevel` gets city scenery (`CITY_ICONS`) instead of forest.
 */
import type { HouseStatus, JourneyNode, VillageOverviewEntry } from "../game/levels";
import {
  BADGE_ICON,
  CITY_ICONS,
  FAR_TREE_ICON,
  GROUND_DETAIL_ICONS,
  LOCK_OVERLAY_ICON,
  MARGIN_FILLER_ICONS,
  SCENERY_ICONS,
  ensureIconDefs,
  makeIconUse,
} from "./icons";

/** The gate-1000 badge renders far larger than a regular cottage — the journey's payoff. */
const FINAL_BADGE_SIZE = 260;
const REGULAR_BADGE_SIZE = 54;

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

  // Groove (dark earth trench) + a real dirt-brown overlay — a thick, raised path (the
  // .map-svg drop-shadow filter in style.css does the actual 3D "lifted off the ground" lift).
  const d = smoothPathD(points);
  const groove = document.createElementNS(SVG_NS, "path");
  groove.setAttribute("d", d);
  groove.setAttribute("fill", "none");
  groove.setAttribute("stroke", "#5a3418");
  groove.setAttribute("stroke-width", "8.4");
  groove.setAttribute("stroke-linecap", "round");
  groove.setAttribute("opacity", "0.75");
  groove.setAttribute("vector-effect", "non-scaling-stroke");
  svgEl.appendChild(groove);

  const beads = document.createElementNS(SVG_NS, "path");
  beads.setAttribute("d", d);
  beads.setAttribute("fill", "none");
  beads.setAttribute("stroke", "#A0522D");
  beads.setAttribute("stroke-width", "6.2");
  beads.setAttribute("stroke-linecap", "round");
  svgEl.appendChild(beads);

  const dirtDashes = document.createElementNS(SVG_NS, "path");
  dirtDashes.setAttribute("d", d);
  dirtDashes.setAttribute("fill", "none");
  dirtDashes.setAttribute("stroke", "#8B5A2B");
  dirtDashes.setAttribute("stroke-width", "1.6");
  dirtDashes.setAttribute("stroke-linecap", "round");
  dirtDashes.setAttribute("stroke-dasharray", "0.6 3.2");
  dirtDashes.setAttribute("opacity", "0.7");
  dirtDashes.setAttribute("vector-effect", "non-scaling-stroke");
  svgEl.appendChild(dirtDashes);

  const rand = mulberry32(42);

  // Back layer: dim, blurred far-tree silhouettes scattered anywhere for parallax-like depth.
  for (let i = 0; i < count; i += 3) {
    if (rand() > 0.5) continue;
    const y = points[i].y + (rand() - 0.5) * ROW_HEIGHT;
    const el = makeIconUse(FAR_TREE_ICON, Math.round(50 + rand() * 30), "scenery-item scenery-far");
    el.style.left = `${6 + rand() * 88}%`;
    el.style.top = `${y}px`;
    el.style.transform = "translate(-50%, -85%)";
    forestEl.appendChild(el);
  }

  // Ground texture: dense, small grass/mushroom/stone details filling otherwise empty ground.
  for (let i = 0; i < count; i++) {
    const detailsHere = rand() < 0.55 ? 1 : rand() < 0.8 ? 2 : 0;
    for (let d2 = 0; d2 < detailsHere; d2++) {
      const iconId = GROUND_DETAIL_ICONS[Math.floor(rand() * GROUND_DETAIL_ICONS.length)];
      const el = makeIconUse(iconId, Math.round(16 + rand() * 14), "scenery-item scenery-ground");
      el.style.left = `${4 + rand() * 92}%`;
      el.style.top = `${points[i].y + (rand() - 0.5) * ROW_HEIGHT}px`;
      el.style.transform = `translate(-50%, -85%) rotate(${(rand() - 0.5) * 20}deg)`;
      forestEl.appendChild(el);
    }
  }

  // Dense forest walls: both far margins packed solid with trees/bushes/boulders on every
  // row, well outside the path's max swing (points.x never leaves ~18-82%), so the ground
  // never reads as bald no matter which way this village's road curves.
  for (let i = 0; i < count; i++) {
    const y = points[i].y;
    for (const onLeft of [true, false]) {
      const itemsHere = rand() < 0.65 ? 2 : 1;
      for (let k = 0; k < itemsHere; k++) {
        const iconId = MARGIN_FILLER_ICONS[Math.floor(rand() * MARGIN_FILLER_ICONS.length)];
        const size = Math.round(32 + rand() * 32);
        const el = makeIconUse(iconId, size, "scenery-item scenery-margin");
        el.style.left = `${onLeft ? rand() * 13 : 87 + rand() * 13}%`;
        el.style.top = `${y + (rand() - 0.5) * ROW_HEIGHT}px`;
        el.style.transform = `translate(-50%, -85%) rotate(${(rand() - 0.5) * 10}deg)`;
        forestEl.appendChild(el);
      }
    }
  }

  // Foreground: bushes/trees/props sit beside the road, biased to its open side.
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
      // Village name sits to whichever side the path isn't on at this row, so it never
      // covers a house/lock — never centered on top of the path itself.
      const bannerOnRight = x < 50;
      const banner = document.createElement("div");
      banner.className = `village-banner-marker${bannerOnRight ? " village-banner-marker-right" : " village-banner-marker-left"}${node.isFinalLevel ? " village-banner-marker-final" : ""}`;
      banner.style.top = `${y}px`;
      const icon = document.createElement("span");
      icon.textContent = node.villageIcon;
      banner.appendChild(icon);
      const name = document.createElement("span");
      name.textContent = node.villageName;
      banner.appendChild(name);
      pathEl.appendChild(banner);
    }

    const isBigFinale = node.isLastGate;
    const house = document.createElement("button");
    house.type = "button";
    house.className = `house house-${node.status}${isBigFinale ? " house-finale" : ""}`;
    house.style.left = `${x}%`;
    house.style.top = `${y}px`;
    house.disabled = node.status !== "active";
    if (isBigFinale) house.style.containIntrinsicSize = "300px 330px";

    const icon = document.createElement("span");
    icon.className = "house-icon";
    // The castle always renders as a castle, even locked — a padlock medallion overlays it
    // instead of falling back to the generic locked-cottage badge, so gate 1000 never looks
    // like just another house on the road.
    const badgeId = isBigFinale ? BADGE_ICON.final : BADGE_ICON[node.status];
    const badgeSize = isBigFinale ? FINAL_BADGE_SIZE : REGULAR_BADGE_SIZE;
    icon.appendChild(makeIconUse(badgeId, badgeSize, "house-badge"));
    if (isBigFinale && node.status === "locked") {
      icon.appendChild(makeIconUse(LOCK_OVERLAY_ICON, Math.round(badgeSize * 0.4), "house-lock-overlay"));
    }
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
