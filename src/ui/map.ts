import type { HouseState } from "../game/levels";

const ROW_HEIGHT = 84;
const TOP_PAD = 50;
const BOTTOM_PAD = 60;
const AMPLITUDE = 27;
const SVG_NS = "http://www.w3.org/2000/svg";

function nodeX(i: number): number {
  return 50 + AMPLITUDE * Math.sin(i * 0.5);
}

const STATUS_ICON: Record<HouseState["status"], string> = {
  cleared: "⭐",
  active: "🏠",
  locked: "🔒",
};

export function renderVillageMap(
  pathEl: HTMLElement,
  svgEl: SVGSVGElement,
  houses: HouseState[],
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

  const points = houses.map((_, i) => ({ x: nodeX(i), y: TOP_PAD + i * ROW_HEIGHT }));

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
    icon.textContent = STATUS_ICON[house.status];
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
