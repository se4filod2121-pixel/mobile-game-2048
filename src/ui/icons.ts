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
  <linearGradient id="gCottageWallLocked" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#b9b3a6"/>
    <stop offset="100%" stop-color="#8e887c"/>
  </linearGradient>
  <linearGradient id="gCottageRoofLocked" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#7c7267"/>
    <stop offset="100%" stop-color="#5a5248"/>
  </linearGradient>
  <linearGradient id="gBoulder" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#9b968c"/>
    <stop offset="100%" stop-color="#6b665c"/>
  </linearGradient>
  <radialGradient id="gCastleGlow" cx="50%" cy="50%" r="50%">
    <stop offset="0%" stop-color="#fff3c4" stop-opacity="0.9"/>
    <stop offset="60%" stop-color="#ffd76b" stop-opacity="0.35"/>
    <stop offset="100%" stop-color="#ffd76b" stop-opacity="0"/>
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

<symbol id="ic-grass-tuft" viewBox="0 0 64 64">
  <g stroke="#3f7d32" stroke-width="3.4" stroke-linecap="round" fill="none">
    <path d="M22 56 C 20 44 24 36 26 30"/>
    <path d="M30 57 C 30 42 32 34 32 26"/>
    <path d="M38 56 C 40 44 38 36 36 30"/>
    <path d="M46 57 C 46 46 44 40 42 34"/>
  </g>
</symbol>

<symbol id="ic-mushroom" viewBox="0 0 64 64">
  <ellipse cx="32" cy="56" rx="10" ry="2.6" fill="rgba(0,0,0,0.2)"/>
  <rect x="28" y="40" width="8" height="16" rx="3" fill="#f3e6d0"/>
  <path d="M16 38 C 16 24 48 24 48 38 C 40 32 24 32 16 38 Z" fill="#e64545"/>
  <circle cx="24" cy="32" r="2.2" fill="#fff"/>
  <circle cx="34" cy="29" r="2.6" fill="#fff"/>
  <circle cx="42" cy="33" r="1.8" fill="#fff"/>
</symbol>

<symbol id="ic-stone" viewBox="0 0 64 64">
  <ellipse cx="32" cy="56" rx="16" ry="3" fill="rgba(0,0,0,0.2)"/>
  <path d="M14 50 C 10 38 20 28 32 28 C 46 28 54 38 50 50 C 40 56 22 56 14 50 Z" fill="url(#gStone)"/>
  <path d="M20 34 C 26 30 38 30 44 36" fill="none" stroke="#fff" stroke-width="2" opacity="0.35"/>
</symbol>

<symbol id="ic-boulder" viewBox="0 0 64 64">
  <ellipse cx="32" cy="57" rx="24" ry="5" fill="rgba(0,0,0,0.32)"/>
  <path d="M8 48 C 2 30 16 14 34 14 C 54 14 60 28 56 44 C 52 58 14 60 8 48 Z" fill="url(#gBoulder)"/>
  <path d="M14 32 C 22 24 40 22 50 30" fill="none" stroke="#fff" stroke-width="2.4" opacity="0.25"/>
  <path d="M18 44 C 26 40 38 42 44 48" fill="none" stroke="#000" stroke-width="2" opacity="0.15"/>
</symbol>

<symbol id="ic-tree-far" viewBox="0 0 64 64">
  <ellipse cx="32" cy="52" rx="14" ry="3" fill="rgba(0,0,0,0.15)"/>
  <rect x="30" y="34" width="4" height="16" fill="#1b3a1e"/>
  <circle cx="32" cy="24" r="17" fill="#1b3a1e"/>
</symbol>

<symbol id="ic-cottage" viewBox="0 0 64 64">
  <ellipse cx="32" cy="58" rx="20" ry="4" fill="rgba(0,0,0,0.25)"/>
  <rect x="16" y="34" width="9" height="6" rx="1.5" fill="#8a6a45"/>
  <ellipse cx="20.5" cy="32" rx="3.4" ry="2.4" fill="#e8e4da" opacity="0.8"/>
  <rect x="14" y="34" width="36" height="22" rx="2" fill="url(#gCottageWall)"/>
  <polygon points="10,34 32,14 54,34" fill="url(#gCottageRoof)"/>
  <rect x="27" y="42" width="10" height="14" rx="1.5" fill="#6b4a2d"/>
  <path d="M32 42 A5 6 0 0 1 37 48" fill="none" stroke="#4a3218" stroke-width="1.2"/>
  <rect x="12.5" y="42" width="2.6" height="8" rx="0.6" fill="#5a7d52"/>
  <rect x="25" y="42" width="2.6" height="8" rx="0.6" fill="#5a7d52"/>
  <rect x="16" y="42" width="8" height="8" rx="1" fill="#7fb8d6"/>
  <line x1="20" y1="42" x2="20" y2="50" stroke="#4a3218" stroke-width="1"/>
  <line x1="16" y1="46" x2="24" y2="46" stroke="#4a3218" stroke-width="1"/>
  <rect x="36.5" y="42" width="2.6" height="8" rx="0.6" fill="#5a7d52"/>
  <rect x="49" y="42" width="2.6" height="8" rx="0.6" fill="#5a7d52"/>
  <rect x="40" y="42" width="8" height="8" rx="1" fill="#7fb8d6"/>
  <line x1="44" y1="42" x2="44" y2="50" stroke="#4a3218" stroke-width="1"/>
  <line x1="40" y1="46" x2="48" y2="46" stroke="#4a3218" stroke-width="1"/>
  <rect x="9" y="52" width="6" height="3" rx="1" fill="#e64980" opacity="0.8"/>
  <rect x="49" y="52" width="6" height="3" rx="1" fill="#ffd43b" opacity="0.8"/>
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
  <ellipse cx="32" cy="58" rx="19" ry="3.6" fill="rgba(0,0,0,0.22)"/>
  <rect x="16" y="34" width="9" height="6" rx="1.5" fill="#6f695d"/>
  <rect x="14" y="34" width="36" height="22" rx="2" fill="url(#gCottageWallLocked)"/>
  <polygon points="10,34 32,14 54,34" fill="url(#gCottageRoofLocked)"/>
  <rect x="27" y="42" width="10" height="14" rx="1.5" fill="#463f36"/>
  <rect x="16" y="42" width="8" height="8" rx="1" fill="#4a453d"/>
  <rect x="40" y="42" width="8" height="8" rx="1" fill="#4a453d"/>
  <circle cx="32" cy="49" r="12" fill="#3f4650" stroke="#e8e8ec" stroke-width="2"/>
  <rect x="27" y="47" width="10" height="8" rx="2" fill="#c8ccd2"/>
  <path d="M28.5 47 v-3.2 a3.5 3.5 0 0 1 7 0 v3.2" fill="none" stroke="#c8ccd2" stroke-width="2.2"/>
  <circle cx="32" cy="50.5" r="1.6" fill="#3f4650"/>
</symbol>

<symbol id="bdg-active" viewBox="0 0 64 64">
  <ellipse cx="32" cy="58" rx="22" ry="5" fill="#f472b6" opacity="0.3"/>
  <rect x="16" y="34" width="9" height="6" rx="1.5" fill="#8a6a45"/>
  <rect x="14" y="34" width="36" height="22" rx="2" fill="url(#gCottageWall)"/>
  <polygon points="10,34 32,14 54,34" fill="url(#gCottageRoof)"/>
  <rect x="27" y="42" width="10" height="14" rx="1.5" fill="#6b4a2d"/>
  <rect x="12.5" y="42" width="2.6" height="8" rx="0.6" fill="#5a7d52"/>
  <rect x="25" y="42" width="2.6" height="8" rx="0.6" fill="#5a7d52"/>
  <rect x="16" y="42" width="8" height="8" rx="1.5" fill="#ffe27a"/>
  <rect x="36.5" y="42" width="2.6" height="8" rx="0.6" fill="#5a7d52"/>
  <rect x="49" y="42" width="2.6" height="8" rx="0.6" fill="#5a7d52"/>
  <rect x="40" y="42" width="8" height="8" rx="1.5" fill="#ffe27a"/>
  <path d="M32 42 A5 6 0 0 1 37 48" fill="none" stroke="#4a3218" stroke-width="1.2"/>
  <circle cx="32" cy="7" r="3.4" fill="#fff3c4"/>
  <g stroke="#fff3c4" stroke-width="1.6" stroke-linecap="round">
    <line x1="32" y1="0" x2="32" y2="2"/>
    <line x1="25" y1="7" x2="27" y2="7"/>
    <line x1="37" y1="7" x2="39" y2="7"/>
  </g>
</symbol>

<symbol id="bdg-cleared" viewBox="0 0 64 64">
  <ellipse cx="32" cy="58" rx="20" ry="4" fill="rgba(0,0,0,0.2)"/>
  <rect x="16" y="34" width="9" height="6" rx="1.5" fill="#8a6a45"/>
  <rect x="14" y="34" width="36" height="22" rx="2" fill="url(#gCottageWall)"/>
  <polygon points="10,34 32,14 54,34" fill="url(#gCottageRoof)"/>
  <rect x="27" y="42" width="10" height="14" rx="1.5" fill="#6b4a2d"/>
  <rect x="12.5" y="42" width="2.6" height="8" rx="0.6" fill="#5a7d52"/>
  <rect x="25" y="42" width="2.6" height="8" rx="0.6" fill="#5a7d52"/>
  <rect x="16" y="42" width="8" height="8" rx="1" fill="#7fb8d6"/>
  <rect x="36.5" y="42" width="2.6" height="8" rx="0.6" fill="#5a7d52"/>
  <rect x="49" y="42" width="2.6" height="8" rx="0.6" fill="#5a7d52"/>
  <rect x="40" y="42" width="8" height="8" rx="1" fill="#7fb8d6"/>
  <circle cx="47" cy="18" r="12" fill="#22c55e" stroke="#fff" stroke-width="2.2"/>
  <path d="M41 18 l4.2 4.2 l8 -8.6" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
</symbol>

<symbol id="bdg-final" viewBox="0 0 64 64">
  <!-- Soft radiant glow behind the whole castle -->
  <circle cx="32" cy="32" r="32" fill="url(#gCastleGlow)"/>
  <ellipse cx="32" cy="61" rx="30" ry="3" fill="rgba(0,0,0,0.35)"/>
  <!-- Outer curtain wall -->
  <rect x="2" y="46" width="60" height="13" fill="url(#gStone)"/>
  <polygon points="2,46 2,42 6,42 6,46 12,46 12,42 16,42 16,46 48,46 48,42 52,42 52,46 58,46 58,42 62,42 62,46" fill="#c9c2b2"/>
  <!-- Left tower -->
  <rect x="4" y="22" width="14" height="32" fill="url(#gStone)"/>
  <polygon points="4,22 4,16 7,16 7,19 10,19 10,16 13,16 13,19 18,19 18,22" fill="#c9c2b2"/>
  <polygon points="3,16 19,16 11,6" fill="#a5362b"/>
  <!-- Right tower -->
  <rect x="46" y="22" width="14" height="32" fill="url(#gStone)"/>
  <polygon points="46,22 46,16 49,16 49,19 52,19 52,16 55,16 55,19 60,19 60,22" fill="#c9c2b2"/>
  <polygon points="45,16 61,16 53,6" fill="#a5362b"/>
  <!-- Central keep -->
  <rect x="16" y="10" width="32" height="44" fill="url(#gStoneCool)"/>
  <polygon points="16,10 16,4 20,4 20,7 24,7 24,4 28,4 28,7 32,7 32,4 36,4 36,7 40,7 40,4 44,4 44,10" fill="#dfe6ee"/>
  <!-- Grand gate -->
  <path d="M25 54 v-14 a7 7 0 0 1 14 0 v14 z" fill="#3a2a16"/>
  <path d="M25 54 v-14 a7 7 0 0 1 14 0 v14" fill="none" stroke="#20150b" stroke-width="1.2"/>
  <!-- Glowing windows -->
  <rect x="8" y="30" width="5.5" height="7.5" fill="#ffd76b"/>
  <rect x="50.5" y="30" width="5.5" height="7.5" fill="#ffd76b"/>
  <rect x="21" y="16" width="6" height="8" fill="#ffd76b"/>
  <rect x="37" y="16" width="6" height="8" fill="#ffd76b"/>
  <circle cx="32" cy="14" r="4" fill="#ffd76b"/>
  <!-- Flags -->
  <rect x="10.2" y="6" width="1.6" height="8" fill="#5d4526"/>
  <polygon points="11.8,6 18,9 11.8,12" fill="#e64545"/>
  <rect x="31.2" y="0" width="1.6" height="8" fill="#5d4526"/>
  <polygon points="32.8,0 40,3.5 32.8,7" fill="#a855f7"/>
  <rect x="52.2" y="6" width="1.6" height="8" fill="#5d4526"/>
  <polygon points="53.8,6 60,9 53.8,12" fill="#e64545"/>
</symbol>

<symbol id="ic-padlock-badge" viewBox="0 0 64 64">
  <circle cx="32" cy="32" r="23" fill="#3f4650" stroke="#e8e8ec" stroke-width="3"/>
  <rect x="21" y="28" width="22" height="19" rx="3" fill="#c8ccd2"/>
  <path d="M24 28 v-7.5 a8 8 0 0 1 16 0 v7.5" fill="none" stroke="#c8ccd2" stroke-width="4.2"/>
  <circle cx="32" cy="36" r="3.4" fill="#3f4650"/>
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
  "ic-boulder",
  "ic-flower-pink",
  "ic-flower-purple",
  "ic-flower-yellow",
  "ic-butterfly",
  "ic-ladybug",
  "ic-cottage",
] as const;

export const CITY_ICONS = ["ic-city-a", "ic-city-b", "ic-lamppost", "ic-gate-arch"] as const;

/** Small, dense ground texture (grass/mushrooms/stones) scattered anywhere to fill empty ground. */
export const GROUND_DETAIL_ICONS = ["ic-grass-tuft", "ic-mushroom", "ic-stone"] as const;

/**
 * Trees/bushes/boulders only — used to pack BOTH far margins of the map solid, every row,
 * so the ground never reads as bald no matter which way that village's path swings.
 */
export const MARGIN_FILLER_ICONS = ["ic-tree-round", "ic-tree-pine", "ic-tree-palm", "ic-bush", "ic-boulder"] as const;

/** A dim, blurred silhouette used sparsely far from the path for a parallax-like depth layer. */
export const FAR_TREE_ICON = "ic-tree-far";

export const BADGE_ICON: Record<"locked" | "active" | "cleared" | "final", string> = {
  locked: "bdg-locked",
  active: "bdg-active",
  cleared: "bdg-cleared",
  final: "bdg-final",
};

/** Small padlock medallion overlaid on the still-locked castle so it reads as "locked castle",
 * not a generic locked cottage — the finale should never look like just another house. */
export const LOCK_OVERLAY_ICON = "ic-padlock-badge";

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
