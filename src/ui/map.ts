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
 *    the house coordinates into a flowing SVG path (Catmull-Rom, as cubic Bezier segments
 *    that pass exactly through every house's own point) instead of straight lines. SVG was
 *    used instead of <canvas> because the path has to stay in the
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
 *
 * Also in this file: river/bridge crossings, the biome weather overlay (four atmospheric
 * regions across the 1000 gates, see `biomeForGate` in levels.ts), and treasure chests every
 * 50 gates. The Lucky Wheel is a separate, map-independent modal — see main.ts.
 */
import type { HouseStatus, JourneyNode, VillageOverviewEntry } from "../game/levels";
import {
  BADGE_ICON,
  BRIDGE_ICON,
  CHEST_ICON_CLOSED,
  CHEST_ICON_OPEN,
  CITY_ICONS,
  FAR_TREE_ICON,
  GROUND_DETAIL_ICONS,
  LOCK_OVERLAY_ICON,
  MARGIN_FILLER_ICONS,
  REED_ICON,
  SCENERY_ICONS,
  ensureIconDefs,
  makeIconUse,
  makeIconUseSized,
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

/** The map's single scroll listener (biome weather overlay) — kept as one module-level
 *  reference so re-rendering the map (which happens on every screen visit) replaces the old
 *  listener instead of stacking a new one on top of it. */
let activeWeatherScrollHandler: (() => void) | null = null;

/** Tints forest scenery per journey biome via CSS filters (see style.css) instead of
 *  separate art assets — the same tree/bush symbols read as stormy, misty, or autumnal. */
function biomeSceneryClass(biome: JourneyNode["biome"]): string {
  if (biome === "storm") return " scenery-biome-storm";
  if (biome === "mist") return " scenery-biome-mist";
  if (biome === "autumn") return " scenery-biome-autumn";
  return "";
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

/**
 * A smooth curve that passes exactly through every point (Catmull-Rom, converted to cubic
 * Bezier segments). The previous version used each point only as a Bezier *control* point
 * and drew the curve through the midpoints between them — which looked smooth but meant the
 * visible road never actually touched a house's own coordinate, so houses sat visibly off
 * the path's centerline. This version's segments start/end exactly at points[i]/points[i+1],
 * so a house at (x, y) is always precisely on the drawn road.
 */
function smoothPathD(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  if (points.length === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x} ${c1y} ${c2x} ${c2y} ${p2.x} ${p2.y}`;
  }
  return d;
}

export function renderJourney(
  forestEl: HTMLElement,
  pathEl: HTMLElement,
  svgEl: SVGSVGElement,
  nodes: JourneyNode[],
  openedChests: ReadonlySet<number>,
  onSelect: (node: JourneyNode) => void,
  onOpenChest: (gate: number, chestEl: HTMLElement) => void,
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

  // Biome weather overlay: which of the four atmospheric regions (see levels.ts
  // `biomeForGate`) is centered in the viewport right now decides whether rain, fog, or
  // falling leaves show (CSS, driven by a class on the scroll container — see style.css
  // `.weather-fx`). Gate boundaries land at exactly 25/50/75% of the 1000-gate road.
  const scrollContainer = forestEl.parentElement;
  if (scrollContainer) {
    const boundaries = [251, 501, 751].map((gate) => TOP_PAD + (gate - 1.5) * ROW_HEIGHT);
    const updateWeather = () => {
      const viewCenter = scrollContainer.scrollTop + scrollContainer.clientHeight / 2;
      let biome: JourneyNode["biome"] = "sunny";
      if (viewCenter >= boundaries[2]) biome = "autumn";
      else if (viewCenter >= boundaries[1]) biome = "mist";
      else if (viewCenter >= boundaries[0]) biome = "storm";
      scrollContainer.classList.remove("biome-sunny", "biome-storm", "biome-mist", "biome-autumn");
      scrollContainer.classList.add(`biome-${biome}`);
    };
    if (activeWeatherScrollHandler) {
      scrollContainer.removeEventListener("scroll", activeWeatherScrollHandler);
    }
    activeWeatherScrollHandler = updateWeather;
    scrollContainer.addEventListener("scroll", updateWeather, { passive: true });
    updateWeather();
  }

  const points = nodes.map((node) => ({
    // The castle (gate 1000) renders at 300px wide — on a ~350px-wide phone screen, letting
    // it sit wherever the zigzag would normally put it can push most of that width past the
    // container's right edge. That horizontal overflow, ~54,000px down an absolutely
    // positioned column, is what was corrupting this whole element's paint/layout offset
    // (reproduced and confirmed: forcing the castle back to a narrow width made the bug
    // disappear). Centering it avoids the overflow on every screen size, and reads well too
    // — the road opens into a plaza for its final approach.
    x: node.isLastGate ? 50 : PATH_SHAPES[pathVariantForLevel(node.level)](node.indexInLevel - 1),
    y: TOP_PAD + (node.gate - 1) * ROW_HEIGHT,
  }));

  // A handful of villages have a river cutting across the whole width, roughly mid-village
  // so it never collides with a banner or the castle. The road itself is never interrupted —
  // it flows straight through; a wooden bridge (added in the house layer, below) is what
  // actually carries it over the water at each crossing.
  type RiverZone = {
    top: number;
    height: number;
    x: number;
    y: number;
    crossIndex: number;
    biome: JourneyNode["biome"];
  };
  const riverZones: RiverZone[] = [];
  {
    const riverRand = mulberry32(777);
    let lastRiverLevel = -10;
    for (let i = 0; i < count - 1; i++) {
      const node = nodes[i];
      if (node.isFinalLevel || node.level < 2 || node.level === lastRiverLevel) continue;
      if (node.indexInLevel !== 8) continue;
      if (riverRand() >= 0.42) continue;
      const midY = (points[i].y + points[i + 1].y) / 2;
      const midX = (points[i].x + points[i + 1].x) / 2;
      const bandHeight = 70 + riverRand() * 24;
      riverZones.push({
        top: midY - bandHeight / 2,
        height: bandHeight,
        x: midX,
        y: midY,
        crossIndex: i,
        biome: node.biome,
      });
      lastRiverLevel = node.level;
    }
  }
  const riverByCrossIndex = new Map(riverZones.map((zone) => [zone.crossIndex, zone]));

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
    const el = makeIconUse(
      FAR_TREE_ICON,
      Math.round(50 + rand() * 30),
      `scenery-item scenery-far${biomeSceneryClass(nodes[i].biome)}`,
    );
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
      const el = makeIconUse(
        iconId,
        Math.round(16 + rand() * 14),
        `scenery-item scenery-ground${biomeSceneryClass(nodes[i].biome)}`,
      );
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
    const biomeClass = biomeSceneryClass(nodes[i].biome);
    for (const onLeft of [true, false]) {
      const itemsHere = rand() < 0.65 ? 2 : 1;
      for (let k = 0; k < itemsHere; k++) {
        const iconId = MARGIN_FILLER_ICONS[Math.floor(rand() * MARGIN_FILLER_ICONS.length)];
        const size = Math.round(32 + rand() * 32);
        const el = makeIconUse(iconId, size, `scenery-item scenery-margin${biomeClass}`);
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
    const el = makeIconUse(iconId, size, `scenery-item${biomeSceneryClass(node.biome)}`);
    el.style.left = `${onRight ? 68 + rand() * 24 : 8 + rand() * 24}%`;
    el.style.top = `${y + (rand() - 0.5) * ROW_HEIGHT * 0.7}px`;
    el.style.transform = `translate(-50%, -85%) rotate(${(rand() - 0.5) * 14}deg)`;
    forestEl.appendChild(el);
  }

  // Rivers: rendered last so they visually cover any ground/margin scenery underneath at
  // that band, giving the water a clean edge instead of trees poking up through it. Built
  // from four stacked layers — a soft drop shadow the water sits inside (bank depth), the
  // deep-to-light water fill, a darker underwater current line, and an animated foam/shine
  // line drifting sideways (native SVG <animate>, no JS render loop needed) — instead of one
  // flat tinted rectangle.
  const RIVER_WAVE_D =
    "M0,18 Q12.5,4 25,18 T50,18 T75,18 T100,18 L100,82 Q87.5,96 75,82 T50,82 T25,82 T0,82 Z";
  const RIVER_BANK_TOP_D = "M0,18 Q12.5,4 25,18 T50,18 T75,18 T100,18";
  const RIVER_BANK_BOTTOM_D = "M0,82 Q12.5,96 25,82 T50,82 T75,82 T100,82";
  for (const zone of riverZones) {
    const biomeRiverClass =
      zone.biome === "storm"
        ? " river-band-storm"
        : zone.biome === "mist"
          ? " river-band-mist"
          : zone.biome === "autumn"
            ? " river-band-autumn"
            : "";
    const river = document.createElementNS(SVG_NS, "svg") as unknown as SVGSVGElement;
    river.setAttribute("viewBox", "0 0 100 100");
    river.setAttribute("preserveAspectRatio", "none");
    river.setAttribute("class", `river-band${biomeRiverClass}`);
    river.style.top = `${zone.top}px`;
    river.style.height = `${zone.height}px`;

    // Bank shadow: a dark, blurred duplicate sitting just inside the water's edge, so the
    // banks read as a real depression in the ground rather than a flat sticker.
    const bankShadow = document.createElementNS(SVG_NS, "path");
    bankShadow.setAttribute("d", RIVER_WAVE_D);
    bankShadow.setAttribute("fill", "none");
    bankShadow.setAttribute("stroke", "rgba(0,0,0,0.4)");
    bankShadow.setAttribute("stroke-width", "5");
    bankShadow.setAttribute("class", "river-bank-shadow");
    river.appendChild(bankShadow);

    const water = document.createElementNS(SVG_NS, "path");
    water.setAttribute("d", RIVER_WAVE_D);
    water.setAttribute("fill", "url(#gRiver)");
    river.appendChild(water);

    // A slightly darker mid-current band gives the water body itself some depth/volume
    // instead of being a single flat fill.
    const current = document.createElementNS(SVG_NS, "path");
    current.setAttribute(
      "d",
      "M0,42 Q12.5,34 25,42 T50,42 T75,42 T100,42 L100,60 Q87.5,68 75,60 T50,60 T25,60 T0,60 Z",
    );
    current.setAttribute("fill", "rgba(10,50,70,0.28)");
    river.appendChild(current);

    // Highlight along the top bank where light catches the water's edge.
    const bankLight = document.createElementNS(SVG_NS, "path");
    bankLight.setAttribute("d", RIVER_BANK_TOP_D);
    bankLight.setAttribute("fill", "none");
    bankLight.setAttribute("stroke", "rgba(255,255,255,0.5)");
    bankLight.setAttribute("stroke-width", "1.4");
    bankLight.setAttribute("vector-effect", "non-scaling-stroke");
    river.appendChild(bankLight);
    const bankLight2 = document.createElementNS(SVG_NS, "path");
    bankLight2.setAttribute("d", RIVER_BANK_BOTTOM_D);
    bankLight2.setAttribute("fill", "none");
    bankLight2.setAttribute("stroke", "rgba(0,0,0,0.3)");
    bankLight2.setAttribute("stroke-width", "1.4");
    bankLight2.setAttribute("vector-effect", "non-scaling-stroke");
    river.appendChild(bankLight2);

    // Two shine/foam lines, dash-animated sideways forever, so the river reads as flowing
    // rather than a static painted stripe.
    for (let s = 0; s < 2; s++) {
      const shine = document.createElementNS(SVG_NS, "path");
      const shineY = 38 + s * 24;
      shine.setAttribute("d", `M-20,${shineY} Q5,${shineY - 10} 30,${shineY} T90,${shineY} T150,${shineY}`);
      shine.setAttribute("fill", "none");
      shine.setAttribute("stroke", "#eaffff");
      shine.setAttribute("stroke-width", s === 0 ? "1.8" : "1.1");
      shine.setAttribute("opacity", s === 0 ? "0.55" : "0.35");
      shine.setAttribute("stroke-dasharray", "6 10");
      shine.setAttribute("stroke-linecap", "round");
      shine.setAttribute("vector-effect", "non-scaling-stroke");
      const animate = document.createElementNS(SVG_NS, "animate");
      animate.setAttribute("attributeName", "stroke-dashoffset");
      animate.setAttribute("from", "0");
      animate.setAttribute("to", "-32");
      animate.setAttribute("dur", `${1.8 + s * 0.6}s`);
      animate.setAttribute("repeatCount", "indefinite");
      shine.appendChild(animate);
      river.appendChild(shine);
    }

    forestEl.appendChild(river);

    // A few reeds along both banks; skip the stretch right around the bridge crossing.
    for (let k = 0; k < 8; k++) {
      const onTop = k % 2 === 0;
      const rx = 4 + rand() * 92;
      if (Math.abs(rx - zone.x) < 10) continue;
      const reed = makeIconUse(
        REED_ICON,
        Math.round(26 + rand() * 14),
        `scenery-item scenery-reed${biomeSceneryClass(zone.biome)}`,
      );
      reed.style.left = `${rx}%`;
      reed.style.top = `${onTop ? zone.top + 6 : zone.top + zone.height - 6}px`;
      reed.style.transform = `translate(-50%, -70%) rotate(${(rand() - 0.5) * 12}deg)`;
      forestEl.appendChild(reed);
    }
  }

  let activeEl: HTMLElement | null = null;

  nodes.forEach((node, i) => {
    const { x, y } = points[i];

    const riverZone = riverByCrossIndex.get(i);
    if (riverZone) {
      const bridge = makeIconUseSized(BRIDGE_ICON, "0 0 40 100", 30, riverZone.height + 26, "map-bridge");
      bridge.style.left = `${riverZone.x}%`;
      bridge.style.top = `${riverZone.y}px`;
      bridge.style.transform = "translate(-50%, -50%)";
      pathEl.appendChild(bridge);
    }

    // Treasure chests: every 50th gate (never the finale, which has the castle instead),
    // shown only once the player has actually reached that stretch of road — a still-locked
    // chest ahead would spoil "the road continues, but you don't get to see everything yet."
    if (node.isTreasureGate && node.status !== "locked") {
      const opened = openedChests.has(node.gate);
      const chestX = Math.min(93, Math.max(7, x + (x < 50 ? 17 : -17)));
      const chestY = y + (node.isFirstOfLevel ? 32 : 0);
      const chest = document.createElement(opened ? "div" : "button");
      if (!opened) (chest as HTMLButtonElement).type = "button";
      chest.className = `map-chest${opened ? " map-chest-open" : " map-chest-closed"}`;
      chest.style.left = `${chestX}%`;
      chest.style.top = `${chestY}px`;
      chest.appendChild(makeIconUse(opened ? CHEST_ICON_OPEN : CHEST_ICON_CLOSED, 44, "chest-icon"));
      if (!opened) {
        chest.addEventListener("click", () => onOpenChest(node.gate, chest));
      }
      pathEl.appendChild(chest);
    }

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
