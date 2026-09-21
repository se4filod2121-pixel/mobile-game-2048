/** Injects a shared, hidden <svg><defs> block of gradients + reusable <symbol>s once,
 *  so every scenery/badge instance on the page is a cheap <svg><use> reference into it. */

const SYMBOL_MARKUP = `
<defs>
  <radialGradient id="gCanopy" cx="35%" cy="28%" r="75%">
    <stop offset="0%" stop-color="#a5d970"/>
    <stop offset="55%" stop-color="#5fae3a"/>
    <stop offset="100%" stop-color="#2e7d32"/>
  </radialGradient>
  <linearGradient id="gTrunk" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%" stop-color="#9c7a4c"/>
    <stop offset="100%" stop-color="#5d4526"/>
  </linearGradient>
  <linearGradient id="gPine" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#7fc959"/>
    <stop offset="100%" stop-color="#1f6b2e"/>
  </linearGradient>
  <linearGradient id="gCottageWall" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#ffe0a3"/>
    <stop offset="100%" stop-color="#e8b872"/>
  </linearGradient>
  <linearGradient id="gCottageRoof" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#e2685a"/>
    <stop offset="100%" stop-color="#a5362b"/>
  </linearGradient>
  <linearGradient id="gStone" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#e8e4da"/>
    <stop offset="100%" stop-color="#b8b0a0"/>
  </linearGradient>
  <linearGradient id="gStoneCool" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#dfe6ee"/>
    <stop offset="100%" stop-color="#a8b3c2"/>
  </linearGradient>
  <radialGradient id="gLamp" cx="50%" cy="40%" r="60%">
    <stop offset="0%" stop-color="#fff6c8"/>
    <stop offset="100%" stop-color="#ffca4d"/>
  </radialGradient>
  <linearGradient id="gGold" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#ffe27a"/>
    <stop offset="100%" stop-color="#e0a324"/>
  </linearGradient>
  <radialGradient id="bLocked" cx="35%" cy="30%" r="75%">
    <stop offset="0%" stop-color="#9aa3ad"/>
    <stop offset="100%" stop-color="#5b636d"/>
  </radialGradient>
  <radialGradient id="bActive" cx="35%" cy="28%" r="80%">
    <stop offset="0%" stop-color="#ffb3e0"/>
    <stop offset="55%" stop-color="#f472b6"/>
    <stop offset="100%" stop-color="#a855f7"/>
  </radialGradient>
  <radialGradient id="bCleared" cx="35%" cy="28%" r="80%">
    <stop offset="0%" stop-color="#8bf0b0"/>
    <stop offset="100%" stop-color="#16a34a"/>
  </radialGradient>
  <radialGradient id="bFinal" cx="35%" cy="28%" r="80%">
    <stop offset="0%" stop-color="#fff3c4"/>
    <stop offset="55%" stop-color="#fbbf24"/>
    <stop offset="100%" stop-color="#b45309"/>
  </radialGradient>
</defs>

<symbol id="ic-tree-round" viewBox="0 0 64 64">
  <ellipse cx="32" cy="59" rx="15" ry="3.5" fill="rgba(0,0,0,0.28)"/>
  <rect x="29" y="38" width="6" height="18" rx="2" fill="url(#gTrunk)"/>
  <circle cx="32" cy="27" r="17" fill="#1b5e20"/>
  <circle cx="25" cy="25" r="13.5" fill="url(#gCanopy)"/>
  <circle cx="40" cy="23" r="12.5" fill="url(#gCanopy)"/>
  <circle cx="33" cy="16" r="11.5" fill="url(#gCanopy)"/>
  <ellipse cx="26" cy="16" rx="6" ry="3.5" fill="#d7f0b3" opacity="0.55"/>
</symbol>

<symbol id="ic-tree-pine" viewBox="0 0 64 64">
  <ellipse cx="32" cy="59" rx="13" ry="3.5" fill="rgba(0,0,0,0.28)"/>
  <rect x="29.5" y="46" width="5" height="12" rx="1.5" fill="url(#gTrunk)"/>
  <polygon points="32,6 47,30 17,30" fill="url(#gPine)"/>
  <polygon points="32,18 50,40 14,40" fill="url(#gPine)"/>
  <polygon points="32,30 52,52 12,52" fill="url(#gPine)"/>
  <polygon points="32,6 32,52 17,30" fill="#ffffff" opacity="0.12"/>
</symbol>

<symbol id="ic-tree-palm" viewBox="0 0 64 64">
  <ellipse cx="34" cy="59" rx="14" ry="3.5" fill="rgba(0,0,0,0.25)"/>
  <path d="M32 58 C 30 40 34 26 40 14" fill="none" stroke="url(#gTrunk)" stroke-width="5" stroke-linecap="round"/>
  <g fill="url(#gCanopy)">
    <path d="M40 14 C 30 10 18 12 10 20 C 22 20 32 18 40 14 Z"/>
    <path d="M40 14 C 34 4 22 -2 10 0 C 20 8 30 12 40 14 Z"/>
    <path d="M40 14 C 44 4 56 0 66 4 C 56 10 47 12 40 14 Z"/>
    <path d="M40 14 C 48 10 58 12 64 20 C 54 18 46 16 40 14 Z"/>
    <path d="M40 14 C 38 22 38 30 42 36 C 46 28 44 20 40 14 Z"/>
  </g>
</symbol>

<symbol id="ic-bush" viewBox="0 0 64 64">
  <ellipse cx="32" cy="52" rx="18" ry="4" fill="rgba(0,0,0,0.25)"/>
  <circle cx="22" cy="38" r="12" fill="url(#gCanopy)"/>
  <circle cx="34" cy="32" r="14" fill="url(#gCanopy)"/>
  <circle cx="45" cy="40" r="11" fill="url(#gCanopy)"/>
  <ellipse cx="27" cy="26" rx="5" ry="3" fill="#e2f4c4" opacity="0.55"/>
  <circle cx="20" cy="42" r="1.8" fill="#e64980"/>
  <circle cx="42" cy="46" r="1.8" fill="#e64980"/>
</symbol>

<symbol id="ic-flower-pink" viewBox="0 0 64 64">
  <rect x="30" y="34" width="4" height="22" rx="2" fill="#4c8c3a"/>
  <path d="M28 34 Q20 30 24 24" fill="none" stroke="#4c8c3a" stroke-width="3" stroke-linecap="round"/>
  <g transform="translate(32,22)">
    <g fill="#f472b6">
      <ellipse cx="7" rx="7" ry="4.2" transform="rotate(0)"/>
      <ellipse cx="7" rx="7" ry="4.2" transform="rotate(72)"/>
      <ellipse cx="7" rx="7" ry="4.2" transform="rotate(144)"/>
      <ellipse cx="7" rx="7" ry="4.2" transform="rotate(216)"/>
      <ellipse cx="7" rx="7" ry="4.2" transform="rotate(288)"/>
    </g>
    <circle r="4.5" fill="#ffd76b"/>
  </g>
</symbol>

<symbol id="ic-flower-purple" viewBox="0 0 64 64">
  <rect x="30" y="34" width="4" height="22" rx="2" fill="#4c8c3a"/>
  <g transform="translate(32,22)">
    <g fill="#a855f7">
      <ellipse cx="7" rx="7" ry="4.2" transform="rotate(0)"/>
      <ellipse cx="7" rx="7" ry="4.2" transform="rotate(60)"/>
      <ellipse cx="7" rx="7" ry="4.2" transform="rotate(120)"/>
      <ellipse cx="7" rx="7" ry="4.2" transform="rotate(180)"/>
      <ellipse cx="7" rx="7" ry="4.2" transform="rotate(240)"/>
      <ellipse cx="7" rx="7" ry="4.2" transform="rotate(300)"/>
    </g>
    <circle r="4.5" fill="#fff3c4"/>
  </g>
</symbol>

<symbol id="ic-flower-yellow" viewBox="0 0 64 64">
  <rect x="30" y="34" width="4" height="22" rx="2" fill="#4c8c3a"/>
  <g transform="translate(32,22)">
    <g fill="#ffd43b">
      <ellipse cx="7.5" rx="7.5" ry="4.4" transform="rotate(0)"/>
      <ellipse cx="7.5" rx="7.5" ry="4.4" transform="rotate(72)"/>
      <ellipse cx="7.5" rx="7.5" ry="4.4" transform="rotate(144)"/>
      <ellipse cx="7.5" rx="7.5" ry="4.4" transform="rotate(216)"/>
      <ellipse cx="7.5" rx="7.5" ry="4.4" transform="rotate(288)"/>
    </g>
    <circle r="4.6" fill="#c65e0e"/>
  </g>
</symbol>

<symbol id="ic-butterfly" viewBox="0 0 64 64">
  <g stroke="#33313f" stroke-width="1.4" stroke-linecap="round">
    <line x1="32" y1="20" x2="27" y2="14"/>
    <line x1="32" y1="20" x2="37" y2="14"/>
  </g>
  <ellipse cx="32" cy="34" rx="2.4" ry="16" fill="#33313f"/>
  <path d="M31 22 C 14 14 8 30 20 38 C 26 40 30 34 31 30 Z" fill="#60a5fa"/>
  <path d="M33 22 C 50 14 56 30 44 38 C 38 40 34 34 33 30 Z" fill="#818cf8"/>
  <path d="M31 34 C 18 34 14 46 24 48 C 29 48 31 40 31 36 Z" fill="#38bdf8"/>
  <path d="M33 34 C 46 34 50 46 40 48 C 35 48 33 40 33 36 Z" fill="#6366f1"/>
</symbol>

<symbol id="ic-ladybug" viewBox="0 0 64 64">
  <ellipse cx="32" cy="48" rx="14" ry="4" fill="rgba(0,0,0,0.2)"/>
  <path d="M18 30 A14 16 0 0 1 46 30 Z" fill="#2b2b2b"/>
  <path d="M18 30 A14 16 0 1 0 46 30 Z" fill="#e6402c"/>
  <line x1="32" y1="30" x2="32" y2="44" stroke="#2b2b2b" stroke-width="1.6"/>
  <circle cx="24" cy="34" r="2.4" fill="#2b2b2b"/>
  <circle cx="40" cy="34" r="2.4" fill="#2b2b2b"/>
  <circle cx="26" cy="42" r="2" fill="#2b2b2b"/>
  <circle cx="38" cy="42" r="2" fill="#2b2b2b"/>
  <circle cx="27" cy="22" r="1.6" fill="#2b2b2b"/>
  <circle cx="37" cy="22" r="1.6" fill="#2b2b2b"/>
  <ellipse cx="26" cy="28" rx="2.6" ry="1.6" fill="#fff" opacity="0.5"/>
</symbol>

<symbol id="ic-cottage" viewBox="0 0 64 64">
  <ellipse cx="32" cy="58" rx="20" ry="4" fill="rgba(0,0,0,0.25)"/>
  <rect x="16" y="34" width="9" height="6" rx="1.5" fill="#8a6a45"/>
  <ellipse cx="20.5" cy="32" rx="3.4" ry="2.4" fill="#e8e4da" opacity="0.8"/>
  <rect x="14" y="34" width="36" height="22" rx="2" fill="url(#gCottageWall)"/>
  <polygon points="10,34 32,14 54,34" fill="url(#gCottageRoof)"/>
  <rect x="27" y="42" width="10" height="14" rx="1.5" fill="#6b4a2d"/>
  <path d="M32 42 A5 6 0 0 1 37 48" fill="none" stroke="#4a3218" stroke-width="1.2"/>
  <rect x="16" y="42" width="8" height="8" rx="1" fill="#7fb8d6"/>
  <line x1="20" y1="42" x2="20" y2="50" stroke="#4a3218" stroke-width="1"/>
  <line x1="16" y1="46" x2="24" y2="46" stroke="#4a3218" stroke-width="1"/>
  <rect x="40" y="42" width="8" height="8" rx="1" fill="#7fb8d6"/>
  <line x1="44" y1="42" x2="44" y2="50" stroke="#4a3218" stroke-width="1"/>
  <line x1="40" y1="46" x2="48" y2="46" stroke="#4a3218" stroke-width="1"/>
</symbol>

<symbol id="ic-city-a" viewBox="0 0 64 64">
  <ellipse cx="32" cy="59" rx="20" ry="3.5" fill="rgba(0,0,0,0.25)"/>
  <rect x="12" y="16" width="40" height="42" fill="url(#gStone)"/>
  <polygon points="8,16 32,4 56,16" fill="#c9c2b2"/>
  <rect x="26" y="42" width="12" height="16" fill="#5d4526"/>
  <g fill="#ffd76b" opacity="0.9">
    <rect x="18" y="22" width="6" height="7"/>
    <rect x="29" y="22" width="6" height="7"/>
    <rect x="40" y="22" width="6" height="7"/>
    <rect x="18" y="32" width="6" height="7"/>
    <rect x="40" y="32" width="6" height="7"/>
  </g>
</symbol>

<symbol id="ic-city-b" viewBox="0 0 64 64">
  <ellipse cx="32" cy="59" rx="16" ry="3.5" fill="rgba(0,0,0,0.25)"/>
  <rect x="18" y="10" width="28" height="48" fill="url(#gStoneCool)"/>
  <rect x="16" y="4" width="32" height="8" rx="1.5" fill="#c3cddb"/>
  <rect x="30" y="-2" width="4" height="10" fill="#8a97a8"/>
  <polygon points="30,-2 32,-9 34,-2" fill="#e64545"/>
  <g fill="#fff3c4" opacity="0.85">
    <rect x="23" y="18" width="5" height="6"/>
    <rect x="36" y="18" width="5" height="6"/>
    <rect x="23" y="28" width="5" height="6"/>
    <rect x="36" y="28" width="5" height="6"/>
    <rect x="23" y="38" width="5" height="6"/>
    <rect x="36" y="38" width="5" height="6"/>
  </g>
</symbol>

<symbol id="ic-lamppost" viewBox="0 0 64 64">
  <ellipse cx="32" cy="59" rx="8" ry="3" fill="rgba(0,0,0,0.25)"/>
  <rect x="30" y="24" width="4" height="34" rx="1.5" fill="#3f3f46"/>
  <rect x="25" y="54" width="14" height="5" rx="1.5" fill="#3f3f46"/>
  <circle cx="32" cy="18" r="9" fill="url(#gLamp)"/>
  <circle cx="32" cy="18" r="9" fill="none" stroke="#3f3f46" stroke-width="2"/>
  <polygon points="32,6 36,12 28,12" fill="#3f3f46"/>
</symbol>

<symbol id="ic-gate-arch" viewBox="0 0 64 64">
  <ellipse cx="32" cy="59" rx="22" ry="3.5" fill="rgba(0,0,0,0.25)"/>
  <rect x="10" y="24" width="8" height="34" fill="url(#gGold)"/>
  <rect x="46" y="24" width="8" height="34" fill="url(#gGold)"/>
  <path d="M10 26 C 10 6 54 6 54 26" fill="none" stroke="url(#gGold)" stroke-width="9"/>
  <polygon points="32,2 36,10 28,10" fill="#f472b6"/>
</symbol>

<symbol id="bdg-locked" viewBox="0 0 64 64">
  <circle cx="32" cy="32" r="30" fill="url(#bLocked)"/>
  <circle cx="32" cy="32" r="30" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="2"/>
  <ellipse cx="24" cy="20" rx="10" ry="6" fill="#fff" opacity="0.16"/>
  <rect x="22" y="30" width="20" height="16" rx="3" fill="#3f4650"/>
  <path d="M25 30 v-6 a7 7 0 0 1 14 0 v6" fill="none" stroke="#3f4650" stroke-width="4"/>
  <circle cx="32" cy="37" r="2.6" fill="#c8ccd2"/>
  <rect x="31" y="38" width="2" height="4" fill="#c8ccd2"/>
</symbol>

<symbol id="bdg-active" viewBox="0 0 64 64">
  <circle cx="32" cy="32" r="30" fill="url(#bActive)"/>
  <circle cx="32" cy="32" r="30" fill="none" stroke="#ffffff" stroke-width="2.4"/>
  <ellipse cx="23" cy="19" rx="11" ry="6.5" fill="#fff" opacity="0.25"/>
  <path d="M32 18 L47 30 V46 H37 V36 H27 V46 H17 V30 Z" fill="#ffffff"/>
  <rect x="29" y="38" width="6" height="8" rx="1" fill="#a855f7"/>
</symbol>

<symbol id="bdg-cleared" viewBox="0 0 64 64">
  <circle cx="32" cy="32" r="30" fill="url(#bCleared)"/>
  <circle cx="32" cy="32" r="30" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="2"/>
  <ellipse cx="23" cy="19" rx="10" ry="6" fill="#fff" opacity="0.2"/>
  <path d="M32 14 L36.5 25.5 L49 26.5 L39.5 34.5 L42.5 47 L32 40 L21.5 47 L24.5 34.5 L15 26.5 L27.5 25.5 Z" fill="#ffe27a" stroke="#c98a12" stroke-width="1"/>
</symbol>

<symbol id="bdg-final" viewBox="0 0 64 64">
  <circle cx="32" cy="32" r="30" fill="url(#bFinal)"/>
  <circle cx="32" cy="32" r="30" fill="none" stroke="#fff" stroke-width="2.4"/>
  <ellipse cx="23" cy="19" rx="11" ry="6.5" fill="#fff" opacity="0.3"/>
  <polygon points="32,14 40,22 24,22" fill="#fff"/>
  <rect x="21" y="22" width="22" height="4" fill="#fff"/>
  <rect x="23" y="27" width="3.4" height="17" fill="#fff"/>
  <rect x="30.3" y="27" width="3.4" height="17" fill="#fff"/>
  <rect x="37.6" y="27" width="3.4" height="17" fill="#fff"/>
  <rect x="20" y="44" width="24" height="4" fill="#fff"/>
</symbol>
`;

let injected = false;

export function ensureIconDefs(): void {
  if (injected) return;
  injected = true;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("width", "0");
  svg.setAttribute("height", "0");
  svg.style.position = "absolute";
  svg.style.overflow = "hidden";
  svg.innerHTML = SYMBOL_MARKUP;
  document.body.appendChild(svg);
}

export const SCENERY_ICONS = [
  "ic-tree-round",
  "ic-tree-pine",
  "ic-tree-palm",
  "ic-bush",
  "ic-flower-pink",
  "ic-flower-purple",
  "ic-flower-yellow",
  "ic-butterfly",
  "ic-ladybug",
  "ic-cottage",
] as const;

export const CITY_ICONS = ["ic-city-a", "ic-city-b", "ic-lamppost", "ic-gate-arch"] as const;

export const BADGE_ICON: Record<"locked" | "active" | "cleared" | "final", string> = {
  locked: "bdg-locked",
  active: "bdg-active",
  cleared: "bdg-cleared",
  final: "bdg-final",
};

export function makeIconUse(symbolId: string, sizePx: number, className: string): SVGSVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 64 64");
  svg.setAttribute("width", String(sizePx));
  svg.setAttribute("height", String(sizePx));
  svg.setAttribute("class", className);
  const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
  use.setAttribute("href", `#${symbolId}`);
  svg.appendChild(use);
  return svg;
}
