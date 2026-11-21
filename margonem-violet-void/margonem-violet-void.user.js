// ==UserScript==
// @name         Margonem – Fioletowa Pustka (Violet Void)
// @namespace    https://github.com/Harkryn/Dodatki
// @author       Harkryn
// @version      1.22.3
// @description  Mroczny motyw interfejsu Margonem: prawie czarne panele z grafitowymi krawędziami, fiolet pustki tylko jako akcent (cienkie linie, stany aktywne, focus, najechanie). Tylko wygląd UI – mapa, sprite'y i logika gry bez zmian. Tylko nowy interfejs (NI); na starym (SI) skrypt nic nie robi.
// @match        https://*.margonem.pl/*
// @match        https://margonem.pl/*
// @match        https://*.margonem.com/*
// @match        https://margonem.com/*
// @exclude      https://forum.margonem.pl/*
// @exclude      https://forum.margonem.com/*
// @run-at       document-start
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @grant        GM_getResourceURL
// @resource     vvFrame      https://raw.githubusercontent.com/Harkryn/Dodatki/main/assets/violet-void/frame.webp
// @resource     vvTitlePlate https://raw.githubusercontent.com/Harkryn/Dodatki/main/assets/violet-void/title-plate.webp
// @resource     vvTitleGem   https://raw.githubusercontent.com/Harkryn/Dodatki/main/assets/violet-void/title-gem.webp
// @resource     vvHudButtons https://raw.githubusercontent.com/Harkryn/Dodatki/main/assets/violet-void/hud-buttons.webp
// @resource     vvOrbCracks  https://raw.githubusercontent.com/Harkryn/Dodatki/main/assets/violet-void/orb-cracks.mp4
// @resource     vvOrbRing    https://raw.githubusercontent.com/Harkryn/Dodatki/main/assets/violet-void/orb-ring.webp
// @resource     vvShopLintel https://raw.githubusercontent.com/Harkryn/Dodatki/main/assets/violet-void/shop-lintel.webp
// @updateURL    https://raw.githubusercontent.com/Harkryn/Dodatki/main/margonem-violet-void/margonem-violet-void.user.js
// @downloadURL  https://raw.githubusercontent.com/Harkryn/Dodatki/main/margonem-violet-void/margonem-violet-void.user.js
// ==/UserScript==

/*
 * @run-at document-start: styl i klasa na <html> są nakładane, zanim gra narysuje pierwszy kadr,
 * więc nie widać mignięcia oryginalnego interfejsu. Sam CSS nie potrzebuje gotowego DOM –
 * reguły zaczynają działać na elementach gry w chwili, gdy się pojawią. Elementy wymagające DOM
 * (przycisk przełącznika, wykrywanie interfejsu) czekają na <body> przez MutationObserver.
 */

(() => {
  'use strict';

  if (window.top !== window.self) return;

  const VERSION = '1.22.3';
  const ON = 'vv-on';            // motyw włączony
  const KEY_ON = 'vv-enabled';
  const KEY_GLOW = 'vv-glow';    // low | mid | high
  const GLOWS = ['low', 'mid', 'high'];
  const GLOW_LABEL = { low: 'niska', mid: 'średnia', high: 'wysoka' };

  const get = (k, d) => { try { return typeof GM_getValue === 'function' ? GM_getValue(k, d) : d; } catch (e) { return d; } };
  const set = (k, v) => { try { if (typeof GM_setValue === 'function') GM_setValue(k, v); } catch (e) { /* brak GM */ } };

  // Prefiksy reguł: N = nowy interfejs (NI); G = cała strona gry NI (scrollbary, zaznaczenie)
  const N = `html.${ON}.vv-ni`;
  const G = `html.${ON}.vv-game`;
  // okno „zwykłe” NI (bez przezroczystych i bez okien-dymków)
  const W = `${N} .border-window:not(.transparent):not(.tip-window)`;

  // Grafiki: @resource (Tampermonkey pobiera je przy instalacji/aktualizacji i trzyma lokalnie).
  // Bez GM_getResourceURL (inne menedżery) – raw link do repo.
  const RAW = 'https://raw.githubusercontent.com/Harkryn/Dodatki/main/assets/violet-void/';
  const res = (name, file) => {
    try { if (typeof GM_getResourceURL === 'function') { const u = GM_getResourceURL(name); if (u) return u; } } catch (e) { /* brak zasobu */ }
    return RAW + file;
  };
  const IMG = {
    frame: res('vvFrame', 'frame.webp'),            // 192×192, 9-slice: wycinek 30 px
    plate: res('vvTitlePlate', 'title-plate.webp'), // 360×35, końce 46 px
    gem: res('vvTitleGem', 'title-gem.webp'),       // 20×36
    hud: res('vvHudButtons', 'hud-buttons.webp'),   // atlas 352×528: 4 obroty × 6 kamieni, kafel 88×88
    orbFx: res('vvOrbCracks', 'orb-cracks.mp4'),    // 480×480, 3 s pętli: pierścień pęknięć wokół kuli HP (FLUX + Wan 2.2)
    ring: res('vvOrbRing', 'orb-ring.webp'),        // 256×256, kamienny pierścień wokół kuli (wewn. promień = 0,367 szerokości)
    lintel: res('vvShopLintel', 'shop-lintel.webp') // 960×65, bazaltowe nadproże sklepu (w miejscu markizy)
  };

  // Przydział kafli przyciskom HUD w kolejności, w jakiej stoją na belkach – sąsiednie dostają inne kamienie
  // (kamień = i % 6), a co szósty przycisk zmienia obrót. Nieznane przyciski: kafle cyklicznie wg pozycji.
  const HUD_ORDER = ['exit', 'world-icon', 'config', 'rewards-calendar-icon',
    'inventory-browser-icon', 'matchmaking-icon', 'party', 'globe', 'clans',
    'chat', 'photo', 'portable-map-icon', 'compass', 'loot-filter-icon', 'timer-icon',
    'scroll', 'friends', 'skills', 'news-icon', 'star'];
  const HUD_TILES = [
    ...[1, 2, 3, 4, 5, 6].map((k) => `html.${ON}.vv-ni .widget-button:nth-child(6n+${k}) { --vv-hy: ${k - 1}; --vv-hx: ${k % 4}; }`),
    ...HUD_ORDER.map((n, i) => `html.${ON}.vv-ni .widget-button[widget-name="${n}"] { --vv-hy: ${i % 6}; --vv-hx: ${Math.floor(i / 6) % 4}; }`)
  ].join('\n');

  // Popękania nadproża sklepu: poszarpane szczeliny z odgałęzieniami w układzie grafiki nadproża (960×65),
  // z pominięciem ametystu pośrodku (x ≈ 455–525). Ciemny rdzeń szczeliny + fiolet z poświatą + jasna żyłka.
  // Ziarno stałe, więc pęknięcia wyglądają zawsze tak samo.
  const LINTEL_CRACKS = (() => {
    let seed = 7;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const f = (n) => Math.round(n * 10) / 10;
    const paths = [];
    [64, 150, 236, 330, 410, 575, 660, 748, 838, 905].forEach((x0, i) => {
      const down = i % 2 === 0;
      let x = x0 + (rnd() - 0.5) * 20, y = down ? 0 : 65;
      let d = `M${f(x)} ${f(y)}`;
      const steps = 3 + Math.floor(rnd() * 3);
      for (let s = 0; s < steps; s++) {
        x += (rnd() - 0.5) * 30;
        y += (down ? 1 : -1) * (7 + rnd() * 8);
        y = Math.max(0, Math.min(65, y));
        d += ` L${f(x)} ${f(y)}`;
        if (s === 1 && rnd() > 0.35) {   // odgałęzienie
          const bx = x + (rnd() > 0.5 ? 1 : -1) * (10 + rnd() * 14), by = y + (down ? 1 : -1) * (5 + rnd() * 8);
          paths.push(`M${f(x)} ${f(y)} L${f(bx)} ${f(Math.max(0, Math.min(65, by)))}`);
        }
      }
      paths.push(d);
    });
    const all = paths.map((d) => `<path d='${d}'/>`).join('');
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 960 65' width='960' height='65'>` +
      `<defs><filter id='g' x='-20%' y='-50%' width='140%' height='200%'><feGaussianBlur stdDeviation='2.2'/></filter></defs>` +
      `<g fill='none' stroke-linecap='round' stroke-linejoin='round'>` +
      `<g stroke='#8f45e6' stroke-width='7' stroke-opacity='.55' filter='url(#g)'>${all}</g>` +
      `<g stroke='#050208' stroke-width='3.2'>${all}</g>` +
      `<g stroke='#b57cff' stroke-width='1.4'>${all}</g>` +
      `<g stroke='#f0e4ff' stroke-width='.5' stroke-opacity='.8'>${all}</g></g></svg>`;
    return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
  })();

  // Pęknięcia pierścienia wokół kuli HP: w układzie grafiki pierścienia (512×512, środek 256, kamień między
  // promieniem ~190 a ~246). Szczeliny biegną w poprzek pierścienia z drobnym zygzakiem i odgałęzieniami,
  // kilka krótkich rys wzdłuż obwodu. Ten sam styl co nadproże sklepu (ciemny rdzeń, fiolet, poświata, żyłka).
  const RING_CRACKS = (() => {
    let seed = 13;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const f = (n) => Math.round(n * 10) / 10;
    const P = (r, a) => `${f(256 + Math.cos(a) * r)} ${f(256 + Math.sin(a) * r)}`;
    const R0 = 192, R1 = 244;
    const paths = [];
    for (let i = 0; i < 11; i++) {
      const a0 = (i / 11) * Math.PI * 2 + (rnd() - 0.5) * 0.35;
      const fromIn = rnd() > 0.5;
      const len = 0.55 + rnd() * 0.45;                 // jaką część szerokości pierścienia przecina
      const steps = 4;
      let d = `M${P(fromIn ? R0 : R1, a0)}`, a = a0;
      for (let s = 1; s <= steps; s++) {
        const t = (s / steps) * len;
        a += (rnd() - 0.5) * 0.07;
        const r = fromIn ? R0 + (R1 - R0) * t : R1 - (R1 - R0) * t;
        d += ` L${P(r, a)}`;
        if (s === 2 && rnd() > 0.4) {
          const ba = a + (rnd() > 0.5 ? 1 : -1) * (0.05 + rnd() * 0.06);
          const br = r + (fromIn ? 1 : -1) * (8 + rnd() * 10);
          paths.push(`M${P(r, a)} L${P(br, ba)}`);
        }
      }
      paths.push(d);
    }
    for (let i = 0; i < 4; i++) {                       // rysy wzdłuż obwodu
      const a0 = rnd() * Math.PI * 2, r = R0 + 14 + rnd() * 30;
      paths.push(`M${P(r, a0)} L${P(r + (rnd() - 0.5) * 6, a0 + 0.08)} L${P(r + (rnd() - 0.5) * 6, a0 + 0.16)}`);
    }
    const all = paths.map((d) => `<path d='${d}'/>`).join('');
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512' width='512' height='512'>` +
      `<defs><filter id='g' x='-10%' y='-10%' width='120%' height='120%'><feGaussianBlur stdDeviation='4'/></filter></defs>` +
      `<g fill='none' stroke-linecap='round' stroke-linejoin='round'>` +
      `<g stroke='#8f45e6' stroke-width='12' stroke-opacity='.55' filter='url(#g)'>${all}</g>` +
      `<g stroke='#050208' stroke-width='5'>${all}</g>` +
      `<g stroke='#b57cff' stroke-width='2.4'>${all}</g>` +
      `<g stroke='#f0e4ff' stroke-width='.9' stroke-opacity='.85'>${all}</g></g></svg>`;
    return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
  })();

  /* =====================================================================
   * === ZMIENNE (paleta i intensywność świecenia) ===
   * Motyw jest głównie mroczny: powierzchnie prawie czarne, krawędzie grafitowe.
   * Fiolet pustki to wyłącznie akcent – cienkie linie, stany aktywne, focus i najechanie.
   * ===================================================================== */
  const cssVars = `
:root {
  /* tła – prawie czerń z ledwie wyczuwalnym fioletem */
  --vv-bg-0: #060509;
  --vv-bg-1: #0c0a10;
  --vv-bg-2: #141119;
  --vv-bg-3: #1c1824;            /* aktywna zakładka, podniesiona płytka */
  /* krawędzie powierzchni – neutralny grafit */
  --vv-edge: #2a2433;
  --vv-edge-hi: #3b3346;
  /* fiolety – akcenty */
  --vv-v-1: #4a1f7a;
  --vv-v-2: #6d2fb3;
  --vv-v-3: #8f45e6;
  /* energia – najjaśniejsze akcenty (focus, najechanie) */
  --vv-e-1: #b57cff;
  --vv-e-2: #d9b8ff;
  /* głęboki akcent – oszczędnie (nowe wiadomości) */
  --vv-accent: #ff4fd8;
  /* tekst */
  --vv-text: #e6e0ee;
  --vv-text-dim: #9a93a8;
  /* mnożnik świecenia (zmieniany przełącznikiem intensywności) */
  --vv-k: .8;
  --vv-glow: rgb(143 69 230 / calc(.35 * var(--vv-k)));
  --vv-glow-strong: rgb(181 124 255 / calc(.6 * var(--vv-k)));
  /* ledwie widoczna fioletowa poświata od góry okna – bez zalewania tła kolorem */
  --vv-void-light: radial-gradient(ellipse 110% 45% at 50% 0%, rgb(109 47 179 / calc(.12 * var(--vv-k))), transparent 70%);
}
html[data-vv-glow="low"]  { --vv-k: .45; }
html[data-vv-glow="mid"]  { --vv-k: .8; }
html[data-vv-glow="high"] { --vv-k: 1.25; }
`;

  /* =====================================================================
   * === BAZOWE (cała strona gry: zaznaczenie, scrollbary, focus pól) ===
   * ===================================================================== */
  const cssBase = `
${G} ::selection { background: var(--vv-v-2); color: #fff; }
${G} * { scrollbar-color: var(--vv-edge-hi) var(--vv-bg-0); }
${G} ::-webkit-scrollbar { width: 9px; height: 9px; }
${G} ::-webkit-scrollbar-track { background: var(--vv-bg-0); }
${G} ::-webkit-scrollbar-thumb { background: var(--vv-edge-hi); border-radius: 5px; border: 1px solid var(--vv-bg-0); }
${G} ::-webkit-scrollbar-thumb:hover { background: var(--vv-v-2); }
${G} ::-webkit-scrollbar-corner { background: var(--vv-bg-0); }

/* pola tekstowe */
${G} input[type="text"], ${G} input[type="number"], ${G} input[type="search"], ${G} input[type="password"],
${G} input:not([type]), ${G} textarea {
  background-color: var(--vv-bg-0) !important;
  color: var(--vv-text) !important;
  border-color: var(--vv-edge) !important;
  caret-color: var(--vv-e-1);
}
${G} input:focus, ${G} textarea:focus, ${G} [contenteditable="true"]:focus {
  outline: none !important;
  border-color: var(--vv-v-3) !important;
  box-shadow: 0 0 0 1px var(--vv-v-3), 0 0 calc(6px * var(--vv-k)) var(--vv-glow) !important;
}
${G} input::placeholder, ${G} textarea::placeholder { color: var(--vv-text-dim) !important; opacity: 1; }

/* NI – suwaki gry (własne, nie natywne) */
${N} .scrollbar-wrapper .track { background: var(--vv-bg-0) !important; box-shadow: inset 0 0 0 1px var(--vv-edge); }
${N} .scrollbar-wrapper .handle { background: var(--vv-edge-hi) !important; box-shadow: none !important; }
${N} .scrollbar-wrapper .handle:hover { background: var(--vv-v-2) !important; }
`;

  /* =====================================================================
   * === OKNA (NI: zwykłe, przezroczyste, dialog NPC, wspólne panele, przyciski) ===
   * ===================================================================== */
  const cssWindows = `
/* --- okno zwykłe: czerń w krystalicznej ramie z wulkanicznego szkła, ametystowe kryształy w narożnikach ---
   Rama 9-slice (border-image) – border-width zostaje 0, więc układ okna się nie zmienia;
   outset 3 px wysuwa pas tuż na krawędź okna, kryształy w narożnikach lekko wystają. */
${W} {
  border-image: url("${IMG.frame}") 30 / 15px / 3px stretch !important;
  border-radius: 0;
  background: var(--vv-void-light), linear-gradient(var(--vv-bg-2), var(--vv-bg-1) 40px, var(--vv-bg-0)) !important;
  background-clip: border-box !important;
  box-shadow:
    0 0 0 1px #000,
    0 0 calc(10px * var(--vv-k)) var(--vv-glow),
    0 10px 28px rgb(0 0 0 / .85) !important;
}
${W} > .content { background: transparent !important; color: var(--vv-text); }

/* nagłówek: kamienna tabliczka z krystalicznymi ćwiekami na końcach (9-slice w poziomie, wysunięta
   o 34 px w boki, więc tytuł ma wokół siebie miejsce), na środku u góry mały ametyst */
${W} .header-label-positioner .header-label {
  background: none !important;
  border-style: solid !important;
  border-width: 0 !important;
  border-image: url("${IMG.plate}") 0 46 fill / 0 37px / 0 34px stretch !important;
  border-radius: 0;
  box-shadow: none !important;
}
${W} .header-label-positioner::after {
  content: "";
  position: absolute;
  left: 50%; top: -15px;
  width: 11px; height: 20px;
  transform: translateX(-50%);
  background: url("${IMG.gem}") center / contain no-repeat;
  filter: drop-shadow(0 0 calc(4px * var(--vv-k)) var(--vv-glow-strong));
  pointer-events: none;
  z-index: 2;
}
${W} .header-label-positioner .header-label .text {
  color: var(--vv-text) !important;
  text-shadow: 0 1px 2px #000 !important;
  letter-spacing: .03em;
}
${W} .header-label-positioner .header-label .left-decor,
${W} .header-label-positioner .header-label .right-decor { background: none !important; }

/* przycisk zamknięcia: grafitowy krąg z „×”, fiolet dopiero przy najechaniu */
${W} .close-button-corner-decor { background: none !important; }
${W} .close-button-corner-decor .close-button {
  background: radial-gradient(circle, var(--vv-bg-2) 55%, var(--vv-edge-hi) 56% 66%, transparent 68%) !important;
  border-radius: 50%;
}
${W} .close-button-corner-decor .close-button::after {
  content: "×";
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  color: var(--vv-text-dim); font: bold 15px/1 sans-serif;
  pointer-events: none;
}
${W} .close-button-corner-decor .close-button:hover {
  background: radial-gradient(circle, var(--vv-bg-2) 55%, var(--vv-v-3) 56% 66%, transparent 68%) !important;
  box-shadow: 0 0 calc(6px * var(--vv-k)) var(--vv-glow-strong);
}
${W} .close-button-corner-decor .close-button:hover::after { color: var(--vv-e-2); }

/* zakładki w oknach */
${N} .border-window .card {
  background-image: linear-gradient(var(--vv-bg-2), var(--vv-bg-0)) !important;
  color: var(--vv-text-dim) !important;
}
${N} .border-window .card:hover { color: var(--vv-text) !important; }
${N} .border-window .card.active {
  background-image: linear-gradient(var(--vv-bg-3), var(--vv-bg-1)) !important;
  color: var(--vv-text) !important;
  box-shadow: inset 0 -2px 0 var(--vv-v-3);
}

/* --- okna przezroczyste (minimapa, obserwowane zadania, zegar, ping) – ramka bez zasłaniania treści --- */
${N} .border-window.transparent .border-image {
  background: rgb(6 5 9 / .72);
  box-shadow: 0 0 0 1px #000, 0 0 0 2px var(--vv-edge), inset 0 1px 0 var(--vv-v-1) !important;
}

/* --- dialog NPC (664×222 u dołu ekranu) ---
   Rama z wulkanicznego szkła jak okna, ametyst pośrodku górnej krawędzi (jak nad tytułami okien),
   imię NPC w jasnym fiolecie, cienka fioletowa linia między wypowiedzią a odpowiedziami.
   Odpowiedzi: ikony gry przygaszone do fioletu, przy najechaniu fioletowa kreska i łuna; kolory odpowiedzi
   (np. pomarańczowe „wyjście”) zostają z gry. */
${N} .dialogue-window .border-image {
  background: var(--vv-void-light), linear-gradient(rgb(20 17 25 / .95), rgb(6 5 9 / .94) 70px) !important;
  border-style: solid !important;
  border-width: 0 !important;
  border-image: url("${IMG.frame}") 30 / 10px / 0 stretch !important;
  box-shadow: 0 0 0 1px #000, 0 0 calc(12px * var(--vv-k)) var(--vv-glow), 0 10px 26px rgb(0 0 0 / .85) !important;
}
${N} .dialogue-window .border-image::after {
  content: "";
  position: absolute; left: 50%; top: -12px;
  width: 11px; height: 20px;
  transform: translateX(-50%);
  background: url("${IMG.gem}") center / contain no-repeat;
  filter: drop-shadow(0 0 calc(4px * var(--vv-k)) var(--vv-glow-strong));
  pointer-events: none;
}
${N} .dialogue-window .dialogue-background-color { background: rgb(6 5 9 / .8) !important; }
${N} .dialogue-window .content { color: var(--vv-text); }
${N} .dialogue-window .content .npc-dialogue-wrapper .h_content {
  color: var(--vv-e-2) !important;
  font-weight: bold;
  letter-spacing: .03em;
  text-shadow: 0 0 6px rgb(143 69 230 / .5), 0 1px 2px #000 !important;
}
${N} .dialogue-window .content .npc-message { color: var(--vv-text) !important; text-shadow: 0 1px 2px #000; }
${N} .dialogue-window .content .answers-scroll::before {
  content: "";
  position: absolute; left: 0; right: 0; top: -5px; height: 1px;
  background: linear-gradient(90deg, transparent, rgb(143 69 230 / .55) 30%, rgb(143 69 230 / .55) 70%, transparent);
}
${N} .dialogue-window .content .answers li {
  border-bottom-color: rgb(42 36 51 / .8) !important;
  border-radius: 2px;
  transition: background-color .15s ease, box-shadow .15s ease;
}
${N} .dialogue-window .content .answers li .icon { filter: grayscale(1) brightness(.8) sepia(.4) hue-rotate(220deg) saturate(1.5); }
${N} .dialogue-window .content .answers li:hover {
  background: linear-gradient(90deg, rgb(143 69 230 / .2), rgb(143 69 230 / .05) 60%, transparent) !important;
  box-shadow: inset 2px 0 0 var(--vv-v-3) !important;
}
${N} .dialogue-window .content .answers li:hover .icon { filter: grayscale(1) brightness(1.05) sepia(.5) hue-rotate(220deg) saturate(2); }

/* --- wspólne panele wnętrz okien (interface-element-*) --- */
${N} .interface-element-middle-1-background,
${N} .interface-element-middle-1-background-stretch,
${N} .interface-element-middle-3-background-stretch,
${N} .interface-element-middle-4-background {
  border-image: none !important;
  border-color: var(--vv-bg-0) !important;
  background: rgb(12 10 16 / .94) !important;
  box-shadow: inset 0 0 0 1px var(--vv-edge), inset 0 0 16px rgb(0 0 0 / .7);
}
${N} .interface-element-header-1-background,
${N} .interface-element-header-1-background-stretch,
${N} .interface-element-table-header-1-background,
${N} .interface-element-header-2-background {
  border-image: none !important;
  border-color: transparent !important;
  background: linear-gradient(90deg, var(--vv-bg-0), var(--vv-bg-3) 50%, var(--vv-bg-0)) !important;
  box-shadow: inset 0 -1px 0 var(--vv-v-1);
}
${N} .interface-element-header-3,
${N} .interface-element-table-header-3-background {
  background: linear-gradient(90deg, var(--vv-bg-1), var(--vv-bg-2) 50%, var(--vv-bg-1)) !important;
  box-shadow: inset 0 -1px 0 var(--vv-edge);
}
${N} .interface-element-bottom-bar-background,
${N} .interface-element-bottom-bar-background-stretch {
  border-image: none !important;
  border-color: transparent !important;
  background: linear-gradient(90deg, transparent, var(--vv-v-1) 50%, transparent) top / 100% 1px no-repeat,
              linear-gradient(var(--vv-bg-1), var(--vv-bg-0)) !important;
}
${N} .interface-element-line-1-background {
  background: linear-gradient(90deg, transparent, var(--vv-edge-hi) 50%, transparent) !important;
}
${N} .interface-element-vertical-wood {
  background: linear-gradient(to right, var(--vv-bg-0), var(--vv-edge) 50%, var(--vv-bg-0)) !important;
}
${N} .interface-element-background-color-1,
${N} .interface-element-background-color-3 { background: var(--vv-bg-1) !important; }
${N} .interface-element-wood-box-background {
  background: rgb(12 10 16 / .96) !important;
  box-shadow: inset 0 0 0 1px var(--vv-edge);
}
${N} .interface-element-card-background,
${N} .interface-element-card-background-stretch { background: linear-gradient(var(--vv-bg-2), var(--vv-bg-0)) !important; }
${N} .interface-element-active-card-background,
${N} .interface-element-active-card-background-stretch,
${N} .interface-element-active-card-border-image {
  border-image: none !important;
  background: linear-gradient(var(--vv-bg-3), var(--vv-bg-1)) !important;
  box-shadow: inset 0 -2px 0 var(--vv-v-3), inset 0 0 0 1px var(--vv-edge);
}

/* --- przyciski: grafitowa płytka; fiolet = krawędź przy najechaniu --- */
${N} .button.green:not(.background-gold):not(.background-draconite),
${N} .button.purple:not(.green) {
  background: linear-gradient(#211c29, #121017 55%, #0b0a0e) !important;
  box-shadow: 0 0 0 1px #000, inset 0 0 0 1px var(--vv-edge-hi), inset 0 1px 0 rgb(255 255 255 / .05) !important;
}
/* fioletowy przycisk gry (np. „Kup złoto”) zachowuje fioletowy obrys jako wyróżnik */
${N} .button.purple:not(.green) { box-shadow: 0 0 0 1px #000, inset 0 0 0 1px var(--vv-v-2) !important; }
${N} .button.green::before, ${N} .button.purple::before { box-shadow: none !important; background: none !important; }
${N} .button.green .label, ${N} .button.purple .label { color: var(--vv-text) !important; text-shadow: 0 1px 2px #000; }
${N} .button.green:not(.background-gold):not(.background-draconite):not(.disable):not(.no-hover):hover,
${N} .button.purple:not(.green):not(.disable):hover {
  background: linear-gradient(#2a2234, #16121c 55%, #0d0b11) !important;
  box-shadow: 0 0 0 1px #000, inset 0 0 0 1px var(--vv-v-3), 0 0 calc(8px * var(--vv-k)) var(--vv-glow) !important;
}
${N} .button.disable { filter: grayscale(.6) brightness(.7); }

`;

  /* =====================================================================
   * === CZAT ===
   * Pod wiadomościami jednolita czerń (#060509 / 96%) – kanały zachowują kolory gry,
   * a tekst ma kontrast ≥ 4.5:1 (WCAG AA).
   * ===================================================================== */
  const cssChat = `
${N} .interface-layer > .left-column.main-column,
${N} .new-chat-window { background: var(--vv-bg-0) !important; }
/* listwy kolumn: grafit z cienką fioletową żyłą pośrodku */
${N} .interface-layer > .left-column.main-column > .border,
${N} .interface-layer > .right-column.main-column > .border {
  background: linear-gradient(to right, #000, var(--vv-edge) 40%, var(--vv-v-2) 50%, var(--vv-edge) 60%, #000) !important;
}
/* wiadomości: czerń z ledwie widoczną poświatą pustki u góry; kolory kanałów i wiadomości zostają z gry */
${N} .new-chat-window .chat-message-wrapper {
  background: radial-gradient(ellipse 120% 80px at 50% 0, rgb(109 47 179 / calc(.12 * var(--vv-k))), transparent), rgb(6 5 9 / .96) !important;
  border-top-color: var(--vv-edge) !important;
  border-bottom-color: var(--vv-edge) !important;
  box-shadow: inset 0 0 12px 2px rgb(0 0 0 / .8) !important;
}
${N} .new-chat-window .new-chat-message { text-shadow: 0 1px 1px rgb(0 0 0 / .9); }
/* pasek zakładek kanałów: kamienna tabliczka jak nagłówki („STATS”, tytuły okien) */
${N} .new-chat-window .chat-channel-card-wrapper {
  background: linear-gradient(var(--vv-bg-2), var(--vv-bg-0)) !important;
  border-style: solid;
  border-width: 0;
  border-image: url("${IMG.plate}") 0 46 fill / 0 30px / 0 stretch;
  box-shadow: 0 2px 6px rgb(0 0 0 / .8), inset 0 -1px 0 rgb(143 69 230 / .35);
}
/* zakładki: same ikony gry przygaszone do fioletu, aktywna jaśniejsza z poświatą i fioletową kreską */
${N} .new-chat-window .chat-channel-card { background: none !important; border-color: transparent !important; box-shadow: none !important; }
${N} .new-chat-window .chat-channel-card .chat-channel-card-icon {
  filter: grayscale(1) brightness(.55) sepia(.45) hue-rotate(220deg) saturate(1.5);
  transition: filter .2s ease;
}
${N} .new-chat-window .chat-channel-card:hover .chat-channel-card-icon { filter: grayscale(1) brightness(.85) sepia(.5) hue-rotate(220deg) saturate(1.8); }
${N} .new-chat-window .chat-channel-card.active { box-shadow: inset 0 -2px 0 var(--vv-v-3) !important; }
${N} .new-chat-window .chat-channel-card.active .chat-channel-card-icon {
  filter: grayscale(1) brightness(1.05) sepia(.55) hue-rotate(220deg) saturate(2.2) drop-shadow(0 0 4px rgb(181 124 255 / .7));
}
${N} .new-chat-window .chat-channel-card.channel-disabled .chat-channel-card-icon { filter: grayscale(1) brightness(.3); }
/* licznik nieprzeczytanych – jedno z niewielu miejsc z akcentem magenty */
${N} .new-chat-window .chat-channel-not-read-counter {
  background: var(--vv-accent) !important;
  color: #fff !important;
  box-shadow: 0 0 0 1px #000, 0 0 6px rgb(255 79 216 / .6);
}
/* pasek pod wiadomościami (kanał, informacje, ustawienia) i pole wpisywania w miniaturze ramy okien */
${N} .new-chat-window .chat-input-wrapper {
  background: linear-gradient(var(--vv-bg-2), var(--vv-bg-0)) !important;
  box-shadow: inset 0 1px 0 rgb(143 69 230 / .35) !important;
}
${N} .new-chat-window .chat-input-wrapper .chat-info-wrapper,
${N} .new-chat-window .chat-input-wrapper .chat-config-wrapper { filter: grayscale(1) brightness(.75) sepia(.4) hue-rotate(220deg) saturate(1.4); }
${N} .new-chat-window .magic-input-wrapper { padding: 0 4px 4px; }
${N} .new-chat-window .magic-input {
  background: #050407 !important;
  border-style: solid !important;
  border-width: 0 !important;
  border-image: url("${IMG.frame}") 30 / 6px / 0 stretch !important;
  color: var(--vv-text) !important;
  caret-color: var(--vv-e-1);
}
${N} .new-chat-window .magic-input-placeholder { color: var(--vv-text-dim) !important; }

`;

  /* =====================================================================
   * === EKWIPUNEK (prawa kolumna, postać, torby, sloty, sklep, belki i tabliczka HUD) ===
   * Ikony przedmiotów i ramki rzadkości w slotach zostają nietknięte.
   * ===================================================================== */
  const cssInventory = `
${N} .interface-layer > .right-column.main-column { background: var(--vv-bg-0) !important; }
/* obrys siatek ekwipunku i torby */
${N} .interface-element-grid-border,
${N} .interface-element-grid-border-light {
  outline-color: var(--vv-bg-0) !important;
  box-shadow: 0 0 0 1px var(--vv-edge), 0 0 0 2px #000 !important;
}
${N} .interface-layer .equipment-outline-2,
${N} .interface-layer .equipment-outline-3 { background-color: var(--vv-edge) !important; }
/* sloty: ciemna komórka z grafitową kratką (warstwa pod przedmiotami; kafel gry ma 33×33 px) */
${N} .interface-element-item-slot-grid-stretch,
${N} .interface-element-one-item-slot-background-to-repeat {
  background-color: var(--vv-bg-0) !important;
  background-image:
    linear-gradient(to right, transparent 32px, var(--vv-edge) 32px),
    linear-gradient(to bottom, transparent 32px, var(--vv-edge) 32px),
    radial-gradient(circle at 50% 45%, #15121b, var(--vv-bg-0) 72%) !important;
  background-size: 33px 33px !important;
  background-repeat: repeat !important;
}
${N} .interface-element-one-item-slot-2 {
  background: radial-gradient(circle at 50% 45%, #121017, var(--vv-bg-0) 75%) !important;
  border-color: var(--vv-edge) !important;
  outline-color: var(--vv-bg-0) !important;
}
${N} .interface-element-one-black-tile { background: linear-gradient(var(--vv-bg-1), var(--vv-bg-0)) !important; }
${N} .interface-element-one-gray-tile { background: linear-gradient(var(--vv-bg-2), var(--vv-bg-1)) !important; }

/* --- prawa kolumna: ekwipunek, przełącznik toreb, torba ---
   Ramy z wulkanicznego szkła jak w oknach (wysunięte o 4 px, więc nie zasłaniają slotów).
   Ikony przedmiotów i ich ramki rzadkości są nietknięte (leżą w osobnych elementach .item). */
${N} .interface-layer > .right-column.main-column .equipment-wrapper,
${N} .interface-layer > .right-column.main-column .bags-navigation-bg,
${N} .interface-layer > .right-column.main-column .inventory-grid-bg {
  border-style: solid !important;
  border-width: 0 !important;
  border-image: url("${IMG.frame}") 30 / 7px / 4px stretch !important;
  box-shadow: 0 0 0 4px rgb(6 5 9 / .95), 0 0 0 5px #000, 0 4px 12px 4px rgb(0 0 0 / .7) !important;
  outline: none !important;
}
${N} .interface-layer > .right-column.main-column .equipment-wrapper-outline {
  background: none !important; box-shadow: none !important; border-color: transparent !important;
}
/* sloty ekwipunku: osobne, wklęsłe czarne komórki (bez siatki torby) */
${N} .interface-layer > .right-column.main-column .equipment-wrapper .eq-slot.interface-element-one-item-slot-background-to-repeat {
  background: radial-gradient(circle at 50% 42%, #17131d, #070609 72%) !important;
  background-size: auto !important;
  box-shadow: inset 0 0 0 1px var(--vv-edge), inset 0 2px 6px #000, inset 0 -1px 0 rgb(143 69 230 / .18) !important;
  border-radius: 2px;
}
/* torba: komórki 33×33 z ciemną przerwą (maska) i ledwie jaśniejszym środkiem */
${N} .interface-layer > .right-column.main-column .inventory-grid-bg { background: #000 !important; }
${N} .interface-layer > .right-column.main-column .inventory-grid-bg .interface-element-item-slot-grid-stretch {
  background-color: #000 !important;
  background-image: radial-gradient(circle at 50% 45%, #141119 0 30%, #08070b 70%) !important;
  background-size: 33px 33px !important;
  background-repeat: repeat !important;
  background-position: 0 0 !important;
  -webkit-mask: linear-gradient(to right, #000 32px, transparent 32px) 0 0 / 33px 33px, linear-gradient(#000 32px, transparent 32px) 0 0 / 33px 33px;
  -webkit-mask-composite: source-in;
  mask: linear-gradient(to right, #000 32px, transparent 32px) 0 0 / 33px 33px, linear-gradient(#000 32px, transparent 32px) 0 0 / 33px 33px;
  mask-composite: intersect;
  box-shadow: none !important;
}
/* zakładki toreb: grafitowe kafle, aktywna torba z fioletową krawędzią.
   Ramy z cieniem wystają ok. 9 px poza element, a gra kładzie przełącznik toreb i torbę na styk (y 160–200 i 200),
   więc są rozsunięte: przełącznik o 4 px w dół (z dala od ramy ekwipunku), torba razem z przedmiotami o 22 px w dół
   (pod torbą kolumna jest pusta). Przełącznik nad torbą (z-index), żeby krawędź aktywnej torby była cała. */
${N} .interface-layer > .right-column.main-column .bags-navigation-bg { top: -36px !important; z-index: 2; }
${N} .interface-layer > .right-column.main-column .inventory-grid-bg { top: 22px !important; }
${N} .interface-layer > .right-column.main-column .bags-navigation-bg .bag-slot-wrapper {
  background: radial-gradient(circle at 50% 42%, #1a1622, #070609 75%) !important;
  box-shadow: inset 0 0 0 1px var(--vv-edge) !important;
}
${N} .interface-layer > .right-column.main-column .bags-navigation .item.bag.active {
  box-shadow: 0 0 0 1px #000, 0 0 0 2px var(--vv-v-3), 0 0 calc(8px * var(--vv-k)) var(--vv-glow-strong) !important;
  border-radius: 2px;
}

/* górna i dolna belka interfejsu, tabliczka z imieniem / lokacją / złotem */
${N} .interface-layer > .top.positioner > .bg {
  background: linear-gradient(transparent calc(100% - 1px), var(--vv-v-1)), linear-gradient(var(--vv-bg-1), var(--vv-bg-0)) !important;
}
${N} .interface-layer > .bottom.positioner > .bg {
  background: linear-gradient(var(--vv-v-1), transparent 1px), linear-gradient(var(--vv-bg-0), var(--vv-bg-1)) !important;
}
/* tabliczka z imieniem / lokacją / złotem (342×65): ta sama rama z wulkanicznego szkła co okna (9-slice,
   border-width 0 – układ bez zmian), cienka linia pod imieniem, pod spodem zwisa ametyst (jak nad tytułami okien) */
${N} .interface-layer .hud-container {
  background:
    linear-gradient(90deg, transparent 8%, rgb(143 69 230 / .45) 50%, transparent 92%) 0 21px / 100% 1px no-repeat,
    var(--vv-void-light),
    linear-gradient(var(--vv-bg-2), var(--vv-bg-0)) !important;
  border-style: solid !important;
  border-width: 0 !important;
  border-image: url("${IMG.frame}") 30 / 9px / 0 stretch !important;
  box-shadow: 0 0 0 1px #000, 0 4px 12px rgb(0 0 0 / .85), 0 0 calc(10px * var(--vv-k)) var(--vv-glow) !important;
  color: var(--vv-text) !important;
}
${N} .interface-layer .hud-container::after {
  content: "";
  position: absolute; left: 50%; bottom: -13px;
  width: 10px; height: 18px;
  transform: translateX(-50%) scaleY(-1);
  background: url("${IMG.gem}") center / contain no-repeat;
  filter: drop-shadow(0 0 calc(4px * var(--vv-k)) var(--vv-glow-strong));
  pointer-events: none;
}
${N} .interface-layer .hud-container .location,
${N} .interface-layer .hud-container .coords,
${N} .interface-layer .hud-container .world-name,
${N} .interface-layer .hud-container .herogold,
${N} .interface-layer .hud-container .herocredits { color: var(--vv-text) !important; text-shadow: 0 1px 2px #000; }
${N} .interface-layer .hud-container .coords,
${N} .interface-layer .hud-container .world-name { color: var(--vv-text-dim) !important; }
${N} .interface-layer .hud-container .heroname { text-shadow: 0 1px 2px #000, 0 0 6px rgb(0 0 0 / .8); }
/* przyciski „+” (kup złoto / smocze łzy): zamiast jaskrawej zieleni – grafitowa płytka z fioletowym plusem */
${N} .interface-layer .hud-container .btn-min {
  background: linear-gradient(#211c29, #0c0a10) !important;
  border-color: #000 !important;
  box-shadow: inset 0 0 0 1px var(--vv-edge-hi) !important;
  color: var(--vv-e-1) !important;
  text-shadow: 0 0 4px rgb(143 69 230 / .6);
  filter: none !important;
}
${N} .interface-layer .hud-container .btn-min:hover {
  box-shadow: inset 0 0 0 1px var(--vv-v-3), 0 0 calc(6px * var(--vv-k)) var(--vv-glow) !important;
  color: var(--vv-e-2) !important;
}
/* przyciski HUD (widżety): zwęglony bazalt z pęknięciem, przez które sączy się fiolet.
   Atlas 4×6 kafli (6 kamieni × 4 obroty) – każdy przycisk dostaje inny kafel (--vv-hx = obrót, --vv-hy = kamień). */
${N} .widget-button {
  background: url("${IMG.hud}") calc(var(--vv-hx, 0) * 100% / 3) calc(var(--vv-hy, 0) * 100% / 5) / 400% 600% no-repeat, var(--vv-bg-1) !important;
  border-radius: 4px !important;
  box-shadow: 0 0 0 1px #000 !important;
}
${N} .widget-button.green::before { box-shadow: none !important; }
/* kolory stanów gry zostają jako przygaszony obrys (czerwony = alarm, niebieski i fioletowy = wyróżnienia) */
${N} .widget-button.red { box-shadow: 0 0 0 1px #000, inset 0 0 0 1px rgb(201 55 79 / .8) !important; }
${N} .widget-button.blue { box-shadow: 0 0 0 1px #000, inset 0 0 0 1px rgb(80 140 230 / .7) !important; }
${N} .widget-button.violet { box-shadow: 0 0 0 1px #000, inset 0 0 0 1px var(--vv-v-3) !important; }
${N} .widget-button:not(.disabled):hover {
  filter: brightness(1.3);
  box-shadow: 0 0 0 1px #000, inset 0 0 0 1px var(--vv-v-2), 0 0 calc(6px * var(--vv-k)) var(--vv-glow) !important;
}
${N} .widget-button.green.window-is-open { box-shadow: 0 0 0 1px #000, inset 0 0 0 1px var(--vv-v-2) !important; }
${N} .widget-button.disabled { filter: grayscale(.7) brightness(.6); }
${HUD_TILES}
/* panel statystyk (123×140): rama okien, nagłówek „STATS” na kamiennej tabliczce jak tytuły okien,
   wiersze rozdzielone cienką fioletową linią, ikony gry przygaszone do fioletu; kolory odporności zostają z gry */
${N} .interface-layer .stats-wrapper {
  background: var(--vv-void-light), linear-gradient(var(--vv-bg-2), var(--vv-bg-0)) !important;
  border-style: solid !important;
  border-width: 0 !important;
  border-image: url("${IMG.frame}") 30 / 8px / 0 stretch !important;
  box-shadow: 0 0 0 1px #000, 0 4px 12px rgb(0 0 0 / .8) !important;
  outline: none !important;
}
${N} .interface-layer .stats-wrapper .header-title-wrapper .interface-element-active-card-background-stretch {
  background: none !important;
  border-style: solid !important;
  border-width: 0 !important;
  border-image: url("${IMG.plate}") 0 46 fill / 0 26px / 0 stretch !important;
  box-shadow: none !important;
}
${N} .interface-layer .stats-wrapper .header-title { color: var(--vv-text) !important; letter-spacing: .12em; text-shadow: 0 1px 2px #000 !important; }
${N} .interface-layer .stats-wrapper .stats-list li { position: relative; }
${N} .interface-layer .stats-wrapper .stats-list li + li::before {
  content: ""; position: absolute; left: 2px; right: -26px; top: 0; height: 1px;
  background: linear-gradient(90deg, transparent, rgb(143 69 230 / .35) 40%, transparent);
}
${N} .interface-layer .stats-wrapper .stats-list .stat-icon {
  filter: grayscale(1) brightness(.85) sepia(.5) hue-rotate(220deg) saturate(1.6) drop-shadow(0 0 1px rgb(143 69 230 / .4));
}
${N} .interface-layer .stats-wrapper .stats-list li:not(.resists) .value,
${N} .interface-layer .stats-wrapper .stats-list li:not(.resists) .value .stat { color: var(--vv-text) !important; }
${N} .interface-layer .stats-wrapper .stats-list .value { text-shadow: 0 1px 2px #000, 0 0 3px #000 !important; }

/* --- sklep ---
   Bez markizy (daszka). Siatka towarów oraz pola „kup” i „sprzedaj” w ramach z wulkanicznego szkła z polami
   jak w torbie (ciemne przerwy między komórkami). Ramy wystają ~9 px, więc napisy „Buy”/„Sell” są podniesione
   nad ramy, a opis sklepu opuszczony pod ramę. Kolory bilansu (zielony/czerwony) zostają z gry. */
${N} .shop-wrapper .shop-background .canopy { display: none !important; }
/* w miejscu markizy: bazaltowe nadproże z krystalicznymi ćwiekami i ametystem pośrodku (::before),
   na nim popękania, przez które prześwituje pulsujący fiolet (::after, SVG przycięte maską do kształtu kamienia;
   oba obrazy „contain” w tym samym pudełku, więc pęknięcia trafiają dokładnie w kamień) */
${N} .shop-wrapper .shop-background::before,
${N} .shop-wrapper .shop-background::after {
  content: "";
  position: absolute; left: 14px; right: 14px; top: 4px; height: 33px;
  pointer-events: none;
}
/* z-index: pierwsze dziecko tła sklepu to pełnowymiarowy, prawie nieprzezroczysty panel – bez tego zakrywał kamień */
${N} .shop-wrapper .shop-background::before {
  background: url("${IMG.lintel}") center / contain no-repeat;
  filter: drop-shadow(0 3px 4px rgb(0 0 0 / .85));
  z-index: 1;
}
${N} .shop-wrapper .shop-background::after {
  z-index: 2;
  background: ${LINTEL_CRACKS} center / contain no-repeat;
  -webkit-mask: url("${IMG.lintel}") center / contain no-repeat;
  mask: url("${IMG.lintel}") center / contain no-repeat;
  animation: vv-lintel-glow 4.5s ease-in-out infinite;
}
@keyframes vv-lintel-glow { 0%, 100% { opacity: .6; } 50% { opacity: 1; } }
@media (prefers-reduced-motion: reduce) { ${N} .shop-wrapper .shop-background::after { animation: none; opacity: .85; } }
/* skrzynia złota i napis „Need more gold?” w dolnym pasku okien – ukryte; przyciski „Buy gold” i „Recover items” zostają */
${N} .premium-footer__chest,
${N} .premium-footer__label { display: none !important; }
${N} .shop-wrapper .shop-background .paper-1,
${N} .shop-wrapper .shop-background .paper-2 {
  background: var(--vv-bg-1) !important;
  box-shadow: inset 0 0 8px #000, inset 0 0 0 1px var(--vv-edge) !important;
}
${N} .shop-wrapper .items-grid {
  border-style: solid !important;
  border-width: 0 !important;
  border-image: url("${IMG.frame}") 30 / 7px / 4px stretch !important;
  box-shadow: 0 0 0 4px rgb(6 5 9 / .95), 0 0 0 5px #000, 0 4px 12px 4px rgb(0 0 0 / .7) !important;
  outline: none !important;
}
${N} .shop-wrapper .items-grid > .interface-element-item-slot-grid-stretch {
  background-color: #000 !important;
  background-image: radial-gradient(circle at 50% 45%, #141119 0 30%, #08070b 70%) !important;
  background-size: 33px 33px !important;
  background-repeat: repeat !important;
  background-position: 0 0 !important;
  -webkit-mask: linear-gradient(to right, #000 32px, transparent 32px) 0 0 / 33px 33px, linear-gradient(#000 32px, transparent 32px) 0 0 / 33px 33px;
  -webkit-mask-composite: source-in;
  mask: linear-gradient(to right, #000 32px, transparent 32px) 0 0 / 33px 33px, linear-gradient(#000 32px, transparent 32px) 0 0 / 33px 33px;
  mask-composite: intersect;
  box-shadow: none !important;
}
${N} .shop-wrapper .items-grid .label.interface-element-grid-border {
  background: none !important; box-shadow: none !important; outline: none !important; border-image: none !important;
  color: var(--vv-text-dim) !important;
  font-variant: small-caps; letter-spacing: .1em;
  text-shadow: 0 1px 2px #000;
  translate: 0 -8px;
}
${N} .shop-wrapper .shop-info-wrapper { translate: 0 7px; }
${N} .shop-wrapper .shop-info-wrapper,
${N} .shop-wrapper .shop-info-wrapper * { color: var(--vv-text-dim) !important; text-shadow: 0 1px 2px #000; }
${N} .shop-wrapper .total-price { color: var(--vv-text) !important; font-variant: small-caps; letter-spacing: .06em; }
${N} .shop-wrapper .shop-content .shop-balance::after { background: var(--vv-edge) !important; }

`;

  /* =====================================================================
   * === TOOLTIPY ===
   * Karta prawie nieprzezroczysta (#0b0a0f / 97%) – tekst #e6e0ee ma kontrast ~16:1, przygaszony ~6.5:1.
   * Kolor rangi (--vv-rar, „r g b”) ustawia skrypt (tintTooltip) dla każdej karty przedmiotu: z grafiki ramki,
   * która FAKTYCZNIE jest pod przedmiotem – więc działa z każdym zestawem ramek (ustawienia gry, inne dodatki).
   * W tym kolorze: obwódka i górna linia karty, poświata, łuna za ikoną, separator nagłówka i nazwa przedmiotu.
   * Kolor jest wyrównywany do jasności 235, więc nazwa ma na tle karty kontrast ≥ 4.5:1.
   * Zwykłe przedmioty (szara ramka) i karty bez przedmiotu – stonowany grafit / fiolet.
   * ===================================================================== */
  const cssTooltips = `
${N} .tip-wrapper { --vv-rar: 109 47 179; }
${N} .tip-wrapper.normal-tip { --vv-rar: 92 82 108; }
${N} .tip-wrapper .content {
  background:
    radial-gradient(120% 55% at 50% 0%, rgb(var(--vv-rar) / .12), transparent 70%),
    linear-gradient(rgb(20 17 25 / .97), rgb(11 10 15 / .97) 60px) !important;
  color: var(--vv-text) !important;
  text-shadow: 0 1px 2px #000;
}
${N} .tip-wrapper {
  box-shadow:
    0 0 0 1px rgb(var(--vv-rar) / .7),
    0 0 0 2px #000,
    0 0 calc(14px * var(--vv-k)) rgb(var(--vv-rar) / .28),
    0 10px 24px rgb(0 0 0 / .88) !important;
  transition: box-shadow .2s ease;
}
/* górna linia rangi: jasny środek, zanikające końce, miękka poświata */
${N} .tip-wrapper.normal-tip::before {
  content: "";
  position: absolute; left: 10%; right: 10%; top: -1px; height: 2px;
  background: linear-gradient(90deg, rgb(var(--vv-rar) / 0), rgb(var(--vv-rar) / .95) 50%, rgb(var(--vv-rar) / 0));
  box-shadow: 0 0 8px rgb(var(--vv-rar) / .6);
  pointer-events: none; z-index: 2;
}
/* nagłówek: łuna rangi za ikoną, separator w kolorze rangi zanikający w prawo */
${N} .tip-wrapper .item-head {
  background:
    linear-gradient(90deg, rgb(var(--vv-rar) / .55), rgb(var(--vv-rar) / .12) 60%, transparent) left bottom / 100% 1px no-repeat,
    radial-gradient(90px 60px at 20px 50%, rgb(var(--vv-rar) / .22), transparent 100%) !important;
  box-shadow: none !important;
}
${N} .tip-wrapper .item-head .item { box-shadow: 0 0 0 1px #000, 0 0 10px rgb(var(--vv-rar) / .45); border-radius: 2px; }
${N} .tip-wrapper .item-name { text-shadow: 0 0 8px rgb(var(--vv-rar) / .45), 0 1px 2px #000 !important; }
/* nazwa w kolorze ramki tylko wtedy, gdy kolor odczytano z ramki (inaczej zostaje kolor nazwy z gry) */
${N} .tip-wrapper.vv-rar-frame .item-name { color: rgb(var(--vv-rar)) !important; }
${N} .tip-wrapper .item-type { color: var(--vv-text-dim) !important; }
${N} .tip-wrapper .item-tip-section { border-color: rgb(var(--vv-rar) / .14) !important; }   /* gra ustawia ten kolor inline */

`;

  /* Ikona pingu (16×26, stany lag-0 … lag-5) – ten sam półokrągły wachlarz segmentów co w oryginale gry,
     w kolorach motywu: segmenty zapalają się od dołu wraz z lagiem; zgaszone grafitowe, zapalone fioletowe,
     dwa górne (duży lag) w magencie. Rysowane w SVG w kodzie (bez plików). */
  const PING_CSS = (() => {
    const f = (n) => +n.toFixed(2);
    const sector = (cx, cy, r1, r2, a0, a1) => {
      const p = (r, a) => `${f(cx + Math.cos(a * Math.PI / 180) * r)} ${f(cy + Math.sin(a * Math.PI / 180) * r)}`;
      return `M${p(r2, a0)} A${r2} ${r2} 0 0 1 ${p(r2, a1)} L${p(r1, a1)} A${r1} ${r1} 0 0 0 ${p(r1, a0)}Z`;
    };
    const SEG = [0, 1, 2, 3, 4].map((i) => [95 + i * 34, 125 + i * 34]);   // od dołu (95°) do góry (265°)
    const LIT = ['#8f45e6', '#9d55f0', '#b57cff', '#ff4fd8', '#ff4fd8'];
    const svg = (n) => `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 26' width='16' height='26'><defs>` +
      `<filter id='f' x='-50%' y='-50%' width='200%' height='200%'><feGaussianBlur stdDeviation='.7' result='b'/><feMerge><feMergeNode in='b'/><feMergeNode in='SourceGraphic'/></feMerge></filter>` +
      `<radialGradient id='bg' cx='1' cy='.5' r='1'><stop offset='0' stop-color='#1c1824'/><stop offset='1' stop-color='#08070b'/></radialGradient></defs>` +
      `<path d='M15 0.8 A12.2 12.2 0 0 0 15 25.2 Z' fill='url(#bg)' stroke='#000' stroke-width='.8'/>` +
      `<path d='M15 1.6 A11.4 11.4 0 0 0 15 24.4' fill='none' stroke='#3b3346' stroke-width='.6'/>` +
      SEG.map(([a0, a1], i) => (i < n
        ? `<path d='${sector(15, 13, 4.6, 10.6, a0, a1)}' fill='${LIT[i]}' stroke='#000' stroke-width='.5' filter='url(#f)'/>`
        : `<path d='${sector(15, 13, 4.6, 10.6, a0, a1)}' fill='#211c29' stroke='#2a2433' stroke-width='.5'/>`)).join('') +
      `<circle cx='15' cy='13' r='2.2' fill='#0c0a10' stroke='#3b3346' stroke-width='.6'/></svg>`;
    return [0, 1, 2, 3, 4, 5].map((n) => `${N} .bottom-panel-of-bottom-positioner .lagmeter .lag.lag-${n} {
  background: url("data:image/svg+xml;utf8,${encodeURIComponent(svg(n))}") center / 16px 26px no-repeat !important;
}`).join('\n') + `
/* odbita w pionie – segmenty zapalają się od góry */
${N} .bottom-panel-of-bottom-positioner .lagmeter .lag { transform: scaleY(-1); }`;
  })();

  /* =====================================================================
   * === WALKA, PASKI, MINIMAPA ===
   * HP zostaje czerwone (czytelność w walce), fiolet dostają druga belka i doświadczenie.
   * Paski nad postaciami w walce (.one-warrior) celowo nietknięte.
   * ===================================================================== */
  const cssBattle = `
${PING_CSS}
/* paski HP / many / doświadczenia */
${N} .interface-element-progress-bar-1:not(.one-warrior *) {
  background: var(--vv-bg-0) !important;
  box-shadow: inset 0 0 0 1px var(--vv-edge);
}
${N} .interface-element-progress-bar-1:not(.one-warrior *) .inner {
  background: linear-gradient(#b3243a 65%, #7e1828 65%) !important;
  border-color: #c9374f !important;
}
${N} .interface-element-progress-bar-1.green:not(.one-warrior *) .inner {
  background: linear-gradient(var(--vv-v-2) 65%, var(--vv-v-1) 65%) !important;
  border-color: var(--vv-v-3) !important;
}
${N} .interface-element-progress-bar-1 .value { color: #fff !important; text-shadow: 0 0 3px #000, 0 1px 1px #000 !important; }
/* ===== Pasek doświadczenia (dwa paski po bokach kuli, 235×11) =====
   Koryto: czerń z wewnętrznym cieniem. Wypełnienie: ciemny fiolet pustki z jaśniejszą górną krawędzią i
   cienką linią energii, po którym wolno przesuwa się połysk (pseudo-element, długość paska ustawia gra). */
${N} .interface-layer .exp-bar-wrapper .exp-progress .progress {
  background: #050407 !important;
  overflow: visible !important;
  /* oprawa: ta sama rama z wulkanicznego szkła co w oknach, w miniaturze (9-slice 30 → 6 px, wysunięta o 5 px) */
  border-image: url("${IMG.frame}") 30 / 6px / 5px stretch;
  box-shadow: inset 0 1px 3px #000, 0 0 0 5px rgb(6 5 9 / .9), 0 3px 10px 5px rgb(0 0 0 / .7) !important;
}
/* metalowe ramki pasków gry – niepotrzebne pod nową oprawą */
${N} .interface-layer .exp-bar-wrapper .exp-progress .overlay { background: none !important; }
${N} .interface-layer .exp-bar-wrapper .exp-progress .progress .inner {
  position: relative; overflow: hidden;
  background: linear-gradient(#b57cff 0 1px, #6d2fb3 1px, #4a1f7a 45%, #2a1046 80%, #12081f) !important;
  box-shadow: 1px 0 4px rgb(181 124 255 / calc(.6 * var(--vv-k)));
  filter: none !important;
}
${N} .interface-layer .exp-bar-wrapper .exp-progress .progress .inner::after {
  content: ""; position: absolute; inset: 0;
  background: linear-gradient(100deg, transparent 0 40%, rgb(217 184 255 / .28) 50%, transparent 60% 100%) 0 0 / 240px 100% repeat-x;
  animation: vv-exp-flow 4.5s linear infinite;
}
@keyframes vv-exp-flow { from { background-position: -240px 0; } to { background-position: 240px 0; } }
${N} .interface-layer .exp-bar-wrapper .exp-progress.right .progress .inner::after { animation-direction: reverse; }
/* ===== Kula HP: obsydian z linią energii =====
   Wnętrze czarne; poziom HP wyznacza jasna fioletowa tafla na górze „krwi” (wysokość .blood ustawia gra = prawdziwe HP).
   Tło .blood z !important wygrywa z pozycją klatki sprite'a, którą gra wpisuje inline co klatkę. */
${N} .bottom-panel-of-bottom-positioner .hp-indicator-wrapper {
  background: radial-gradient(circle at 50% 40%, #0c0a10, #030204 75%) !important;
  box-shadow: 0 0 0 1px #000, 0 0 0 2px var(--vv-v-1), 0 0 calc(8px * var(--vv-k)) var(--vv-glow);
}
${N} .bottom-panel-of-bottom-positioner .glass { opacity: .22; filter: grayscale(1); }
${N} .bottom-panel-of-bottom-positioner .hp-indicator .blood {
  background: linear-gradient(rgb(143 69 230 / .55), rgb(28 14 44 / .9) 10px, #0b0712 60%, #060509) !important;
}
${N} .bottom-panel-of-bottom-positioner .hp-indicator .blood::before {
  content: "";
  position: absolute; left: 0; right: 0; top: 0; height: 2px;
  background: var(--vv-e-1);
  box-shadow: 0 0 6px 1px rgb(181 124 255 / calc(.85 * var(--vv-k)));
  animation: vv-orb-line 3.2s ease-in-out infinite;
}
@keyframes vv-orb-line { 50% { opacity: .55; box-shadow: 0 0 10px 2px rgb(181 124 255 / calc(.55 * var(--vv-k))); } }
${N} .bottom-panel-of-bottom-positioner .hp-indicator .hpp { position: relative; z-index: 3; }
${N} .bottom-panel-of-bottom-positioner .hp-indicator .hpp .value {
  color: #fff !important;
  text-shadow: 0 0 4px #000, 0 0 8px #000, 0 1px 2px #000 !important;
}
/* pierścień pęknięć wokół kuli: zapętlone wideo na czarnym tle; filtr SVG #vv-luma zamienia jasność na kanał alfa
   (czerń = przezroczystość). Nie mix-blend-mode: panel tworzy własny kontekst nakładania, więc część wystająca
   nad panel zostawiała czarny kwadrat na mapie. Wideo leży pod kulą (kula ma z-index 1), środek pęknięć
   pokrywa się ze środkiem kuli (330, 55 w dolnym panelu); powiększone tak, by pęknięcia wychodziły spod pierścienia. */
.vv-orb-fx {
  position: absolute; left: 233px; top: -42px; width: 194px; height: 194px;
  object-fit: cover; pointer-events: none; z-index: 0;
  filter: contrast(1.2) brightness(calc(.8 + .25 * var(--vv-k))) url(#vv-luma);
}
html:not(.${ON}) .vv-orb-fx { display: none; }
/* kamienny pierścień ze spękanego bazaltu wokół kuli: nachodzi 3 px na brzeg kuli, bardzo wolno krąży
   (fioletowa szczelina przesuwa się wokół kuli). Pseudo-element szablonu kuli – pozycja liczona od dolnego panelu,
   z-index 1 i później w DOM niż kula, więc leży nad jej brzegiem; kapsuły EXP/czasu podniesione nad pierścień. */
${N} .bottom-panel-of-bottom-positioner .hp-indicator-wrapper-template::after {
  content: "";
  position: absolute; left: 268px; top: -7px; width: 124px; height: 124px;
  background: url("${IMG.ring}") center / 100% 100% no-repeat;
  filter: drop-shadow(0 2px 4px rgb(0 0 0 / .85));
  animation: vv-orb-ring 90s linear infinite;
  pointer-events: none; z-index: 1;
}
/* pęknięcia na pierścieniu: osobna warstwa w tym samym miejscu, obraca się razem z kamieniem (ta sama animacja,
   startuje w tej samej chwili) i dodatkowo pulsuje fioletem; z-index 2 – nad kamieniem */
${N} .bottom-panel-of-bottom-positioner .hp-indicator-wrapper-template::before {
  content: "";
  position: absolute; left: 268px; top: -7px; width: 124px; height: 124px;
  background: ${RING_CRACKS} center / 100% 100% no-repeat;
  animation: vv-orb-ring 90s linear infinite, vv-ring-glow 4s ease-in-out infinite;
  pointer-events: none; z-index: 2;
}
@keyframes vv-orb-ring { to { transform: rotate(360deg); } }
@keyframes vv-ring-glow { 0%, 100% { opacity: .5; } 50% { opacity: 1; } }
${N} .bottom-panel-of-bottom-positioner .bottom-panel-pointer-bg { z-index: 2; }
/* metalowe skrzydła i ozdoby gry wokół kuli – usunięte (kulę oprawia bazaltowy pierścień, paski – rama okien) */
${N} .interface-layer .bottom-panel-graphic { background: none !important; filter: none !important; }
/* kapsuły „% doświadczenia” i „czas”: niska czarna płytka w tej samej ramie co okna; tekst gry leży nad nią */
${N} .bottom-panel-of-bottom-positioner .pointer-exp-graphic,
${N} .bottom-panel-of-bottom-positioner .pointer-ttl-graphic { background: none !important; }
${N} .bottom-panel-of-bottom-positioner .pointer-exp-graphic::before,
${N} .bottom-panel-of-bottom-positioner .pointer-ttl-graphic::before {
  content: "";
  position: absolute; left: 7px; top: 8px; width: 56px; height: 18px;
  background: linear-gradient(var(--vv-bg-2), #08070b);
  border-image: url("${IMG.frame}") 30 / 6px / 3px stretch;
  box-shadow: 0 2px 6px rgb(0 0 0 / .8);
}
/* Kapsuły na wewnętrznych końcach pasków doświadczenia, między paskiem a pierścieniem kuli (pierścień jest szerszy
   niż obudowa gry, więc w oryginalnym miejscu kapsuły na niego wchodziły). Paski są skrócone od strony kuli –
   szerokość wypełnienia gra ustawia procentowo ([bar-percent] → %), więc postęp zostaje prawdziwy.
   Lewy pasek x 44–204, kapsuła 213–263; prawa kapsuła 397–461, pasek x 470–617; wszystko na wysokości pasków
   (y ~21–39), więc nic nie wchodzi na mapę, sloty ani pierścień. */
${N} .bottom-panel-of-bottom-positioner .exp-progress.left .progress { width: 160px !important; }
${N} .bottom-panel-of-bottom-positioner .exp-progress.right .progress { left: 91px !important; width: 147px !important; }
${N} .bottom-panel-of-bottom-positioner .pointer-exp-graphic { translate: -16px -13px; }
${N} .bottom-panel-of-bottom-positioner .pointer-exp { translate: -20px -13px; }
${N} .bottom-panel-of-bottom-positioner .pointer-ttl-graphic { translate: 12px -13px; }
${N} .bottom-panel-of-bottom-positioner .pointer-ttl { translate: 22px -13px; }
${N} .bottom-panel-of-bottom-positioner .pointer-exp-graphic::before { width: 50px; }
${N} .bottom-panel-of-bottom-positioner .pointer-ttl-graphic::before { width: 64px; }
/* pasek szybkich slotów (1–8 po bokach kuli): obie czwórki w miniaturze ramy okien, ciemne tło między slotami;
   każdy slot to inny kafel spękanego bazaltu z atlasu przycisków HUD (ciemny środek – przedmioty czytelne),
   numery slotów przygaszone do fioletu */
${N} .bottom-panel-of-bottom-positioner .slots {
  background: var(--vv-bg-0);
  border-style: solid;
  border-width: 0;
  border-image: url("${IMG.frame}") 30 / 7px / 4px stretch;
  box-shadow: 0 0 0 4px rgb(6 5 9 / .95), 0 0 0 5px #000, 0 4px 12px 4px rgb(0 0 0 / .7);
}
${N} .bottom-panel-of-bottom-positioner .usable-slot {
  background: url("${IMG.hud}") calc(var(--vv-sx, 0) * 100% / 3) calc(var(--vv-sy, 0) * 100% / 5) / 400% 600% no-repeat, var(--vv-bg-1) !important;
  border-color: #000 !important;
  outline: none !important;
  box-shadow: inset 0 0 6px rgb(0 0 0 / .8) !important;
}
${N} .bottom-panel-of-bottom-positioner .usable-slot::before {
  color: rgb(181 124 255 / .75) !important;
  text-shadow: 0 0 3px #000, 0 1px 1px #000;
  font-weight: bold;
}
${[1, 2, 3, 4, 5, 6, 7, 8].map((n) => `${N} .bottom-panel-of-bottom-positioner .usable-slot-${n} { --vv-sy: ${(n + 2) % 6}; --vv-sx: ${(n + 1) % 4}; }`).join('\n')}

/* okno walki i dziennik (kolory wpisów dziennika zostają z gry) */
${N} .battle-controller .border-image,
${N} .battle-window .border-image {   /* TODO: zweryfikuj selektor (rama okna walki) */
  background: rgb(6 5 9 / .92) !important;
  box-shadow: 0 0 0 1px #000, 0 0 0 2px var(--vv-edge), 0 0 calc(10px * var(--vv-k)) var(--vv-glow) !important;
}
${N} .battle-controller .battle-console,
${N} .battle-controller .battle-log {   /* TODO: zweryfikuj selektor (dziennik walki) */
  background: rgb(6 5 9 / .95) !important;
  color: var(--vv-text) !important;
  box-shadow: inset 0 0 0 1px var(--vv-edge);
}
${N} .battle-controller .auto-fight-button.button,
${N} .battle-controller .button.auto-fight {   /* TODO: zweryfikuj selektor (przycisk „Auto”) */
  box-shadow: 0 0 0 1px #000, inset 0 0 0 1px var(--vv-v-3), 0 0 calc(8px * var(--vv-k)) var(--vv-glow) !important;
}

/* minimapa: sama mapa bez zmian, tylko ramka */
${N} .mini-map { box-shadow: 0 0 0 1px #000, 0 0 0 2px var(--vv-edge) !important; }

`;

  /* =====================================================================
   * === ANIMACJE ===
   * Minimum ruchu: puls fioletowej krawędzi otwartych widżetów i przejścia przy najechaniu.
   * Wszystko wyłączane przy prefers-reduced-motion.
   * ===================================================================== */
  const cssAnim = `
${N} .widget-button.green.window-is-open { animation: vv-pulse 3.6s ease-in-out infinite; }
@keyframes vv-pulse {
  0%, 100% { box-shadow: inset 0 0 0 1px var(--vv-v-2); }
  50% { box-shadow: inset 0 0 0 1px var(--vv-e-1), 0 0 calc(7px * var(--vv-k)) var(--vv-glow-strong); }
}
${N} .button, ${N} .widget-button, ${N} .border-window .card { transition: box-shadow .2s ease, background-color .2s ease; }

@media (prefers-reduced-motion: reduce) {
  ${N} .widget-button.green.window-is-open,
  ${N} .bottom-panel-of-bottom-positioner .hp-indicator .blood::before,
  ${N} .bottom-panel-of-bottom-positioner .hp-indicator-wrapper-template::after,
  ${N} .bottom-panel-of-bottom-positioner .hp-indicator-wrapper-template::before,
  ${N} .interface-layer .exp-bar-wrapper .exp-progress .progress .inner::after { animation: none !important; }
  ${N} .button, ${N} .widget-button, ${N} .border-window .card { transition: none !important; }
  #vv-toggle, #vv-toast { transition: none !important; }
}
`;

  /* =====================================================================
   * === PRZEŁĄCZNIK (przycisk, skróty, menu Tampermonkey) ===
   * ===================================================================== */
  const cssToggle = `
#vv-toggle {
  position: fixed; left: 8px; bottom: 8px; z-index: 2147483000;
  width: 22px; height: 22px; padding: 0; border-radius: 50%;
  border: 1px solid #3b3346; cursor: pointer;
  background: radial-gradient(circle at 50% 50%, #8f45e6 0 14%, #2a2433 24%, #0c0a10 70%);
  box-shadow: 0 0 0 1px #000;
  opacity: .5; transition: opacity .2s, box-shadow .2s, border-color .2s;
}
#vv-toggle:hover, #vv-toggle:focus-visible { opacity: 1; border-color: #8f45e6; box-shadow: 0 0 8px rgb(143 69 230 / .6); outline: none; }
html:not(.${ON}) #vv-toggle { filter: grayscale(1); opacity: .35; }
#vv-toast {
  position: fixed; left: 38px; bottom: 9px; z-index: 2147483000;
  padding: 4px 10px; border-radius: 3px; pointer-events: none;
  font: 12px/1.4 sans-serif; color: #e6e0ee; background: #0c0a10;
  border: 1px solid #3b3346; box-shadow: inset 0 -1px 0 #6d2fb3, 0 4px 12px rgb(0 0 0 / .8);
  opacity: 0; transition: opacity .25s;
}
#vv-toast.show { opacity: 1; }
`;

  /* ===================================================================== */

  const root = document.documentElement;
  let styleEl = null;
  const inject = () => {
    if (styleEl) return;
    const text = [cssVars, cssBase, cssWindows, cssChat, cssInventory, cssTooltips, cssBattle, cssAnim, cssToggle].join('\n');
    try { styleEl = typeof GM_addStyle === 'function' ? GM_addStyle(text) : null; } catch (e) { styleEl = null; }
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.textContent = text;
      (document.head || root).appendChild(styleEl);
    }
    styleEl.id = 'vv-theme-style';
  };

  const enabled = () => get(KEY_ON, true);
  const glow = () => { const g = get(KEY_GLOW, 'mid'); return GLOWS.includes(g) ? g : 'mid'; };
  const apply = () => {
    inject();
    root.classList.toggle(ON, enabled());
    root.dataset.vvGlow = glow();
  };

  let toastTimer = 0;
  const toast = (msg) => {
    const el = document.getElementById('vv-toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 1600);
  };
  const toggle = () => {
    set(KEY_ON, !enabled());
    apply();
    ensureOrbFx();
    toast(`Fioletowa Pustka: ${enabled() ? 'włączona' : 'wyłączona'}`);
  };
  const cycleGlow = () => {
    const next = GLOWS[(GLOWS.indexOf(glow()) + 1) % GLOWS.length];
    set(KEY_GLOW, next);
    apply();
    toast(`Świecenie: ${GLOW_LABEL[next]}`);
  };

  /* --- wykrywanie interfejsu (motyw obsługuje wyłącznie NI) ---
     Gra zapisuje wybrany interfejs w ciasteczku `interface` (ni / si) – działa od razu przy starcie.
     Potem potwierdzamy po DOM: NI ma .game-window-positioner / .interface-layer. Na SI klasa vv-ni
     nie jest ustawiana, więc żadna reguła motywu nie działa. */
  const DETECT_NI = '.game-window-positioner, .interface-layer';
  const setInterface = (iface) => { root.classList.toggle('vv-ni', iface === 'ni'); };
  try {
    const m = /(?:^|;\s*)interface=(\w+)/.exec(document.cookie || '');
    if (m && /^(ni|si)$/i.test(m[1])) setInterface(m[1].toLowerCase());
  } catch (e) { /* brak dostępu do ciasteczek */ }

  const detectDom = () => {
    return document.querySelector(DETECT_NI) ? 'ni' : null;
  };

  const addToggleButton = () => {
    if (document.getElementById('vv-toggle') || !document.body) return;
    const b = document.createElement('button');
    b.id = 'vv-toggle';
    b.type = 'button';
    b.title = 'Fioletowa Pustka – klik: włącz/wyłącz (Ctrl+Alt+V)\nPrawy klik: intensywność świecenia (Ctrl+Alt+I)';
    b.setAttribute('aria-label', 'Przełącz motyw Fioletowa Pustka');
    b.addEventListener('click', (e) => { e.stopPropagation(); toggle(); });
    b.addEventListener('contextmenu', (e) => { e.preventDefault(); e.stopPropagation(); cycleGlow(); });
    const t = document.createElement('div');
    t.id = 'vv-toast';
    document.body.append(b, t);
  };

  /* --- animacja wokół kuli HP (wideo) ---
     Gra potrafi przebudować dolny panel, więc wideo jest pilnowane przez obserwator z debounce.
     Przeglądarka pauzuje wideo w ukrytej karcie – po powrocie wznawiamy. Przy „ogranicz ruch” stoi pierwsza klatka. */
  const reduceMotion = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };
  const ensureOrbFx = () => {
    const panel = document.querySelector('.bottom-panel-of-bottom-positioner');
    if (!panel) return;
    if (!document.getElementById('vv-svg-defs')) {
      // filtr: alfa = jasność klatki (z lekkim podbiciem fioletu), kolor bez zmian
      const d = document.createElement('div');
      d.id = 'vv-svg-defs';
      d.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
      d.innerHTML = "<svg xmlns='http://www.w3.org/2000/svg' width='0' height='0'><filter id='vv-luma' color-interpolation-filters='sRGB'>" +
        "<feColorMatrix type='matrix' values='1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  1.6 1.6 2 0 -0.1'/></filter></svg>";
      document.body.append(d);
    }
    let v = panel.querySelector(':scope > video.vv-orb-fx');
    if (!v) {
      v = document.createElement('video');
      v.className = 'vv-orb-fx';
      v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'auto';
      v.setAttribute('muted', ''); v.setAttribute('aria-hidden', 'true');
      v.src = IMG.orbFx;
      panel.append(v);
    }
    const shouldPlay = enabled() && !reduceMotion() && document.visibilityState === 'visible';
    if (shouldPlay && v.paused) v.play().catch(() => { /* autoplay zablokowany – spróbujemy przy kolejnym sprawdzeniu */ });
    else if (!shouldPlay && !v.paused) v.pause();
  };
  let orbDebounce = 0;
  const orbObs = new MutationObserver(() => { clearTimeout(orbDebounce); orbDebounce = setTimeout(ensureOrbFx, 300); });
  document.addEventListener('visibilitychange', ensureOrbFx);

  /* --- kolor rangi w tooltipie: z ramki, która faktycznie jest pod przedmiotem ---
     Nie zgadujemy koloru po klasie rangi: bierzemy grafikę ramki (.highlight) tego samego przedmiotu
     w torbie/ekwipunku (po item-id; zapasowo – kopię w nagłówku tooltipa), wycinamy jej fragment z arkusza
     tak jak gra (background-position/size) i liczymy dominujący nasycony kolor. Dzięki temu kolor zgadza się
     z każdym zestawem ramek (ustawienia gry, inne dodatki). Wynik jest zapamiętywany per grafika+pozycja.
       – kolor znaleziony → --vv-rar na tooltipie + klasa vv-rar-frame (nazwa w tym kolorze),
       – ramka szara (zwykły przedmiot) → kolor domyślny z CSS,
       – grafiki nie da się odczytać (obca domena bez CORS) → kolor nazwy przedmiotu z gry. */
  const rarCache = new Map();
  const frameColor = (el) => {
    const cs = getComputedStyle(el);
    const m = /url\("?([^")]+)"?\)/.exec(cs.backgroundImage);
    if (!m) return Promise.resolve(undefined);
    const w = el.offsetWidth || 32, h = el.offsetHeight || 32;
    const key = `${m[1]}|${cs.backgroundPosition}|${cs.backgroundSize}|${w}x${h}`;
    if (!rarCache.has(key)) {
      rarCache.set(key, (async () => {
        const img = new Image();
        if (!/^(blob:|data:)/.test(m[1]) && new URL(m[1], location.href).origin !== location.origin) img.crossOrigin = 'anonymous';
        img.src = m[1];
        await img.decode();
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        const x = c.getContext('2d', { willReadFrequently: true });
        const pos = cs.backgroundPosition.split(' ').map((v) => (v.endsWith('px') ? parseFloat(v) : 0));
        const bs = cs.backgroundSize.split(' ');
        let sw = img.naturalWidth, sh = img.naturalHeight;
        if (bs[0] && bs[0].endsWith('px')) { sw = parseFloat(bs[0]); sh = bs[1] && bs[1].endsWith('px') ? parseFloat(bs[1]) : sw * img.naturalHeight / img.naturalWidth; }
        // tło się powtarza, więc dodatnie przesunięcie (np. „96px 0”) gra zawija – sprowadzamy je do (−rozmiar, 0]
        const wrap = (p, size) => { if (!size) return p; p %= size; return p > 0 ? p - size : p; };
        x.drawImage(img, wrap(pos[0] || 0, sw), wrap(pos[1] || 0, sh), sw, sh);
        const d = x.getImageData(0, 0, w, h).data;
        let r = 0, g = 0, b = 0, n = 0;
        for (let i = 0; i < d.length; i += 4) {
          if (d[i + 3] < 160) continue;
          const mx = Math.max(d[i], d[i + 1], d[i + 2]), mn = Math.min(d[i], d[i + 1], d[i + 2]);
          const s = (mx - mn) / (mx || 1);
          if (s < 0.35 || mx < 70) continue;           // szarości i cienie ramki pomijamy
          r += d[i] * s; g += d[i + 1] * s; b += d[i + 2] * s; n += s;
        }
        if (n < 4) return null;                         // ramka szara – zwykły przedmiot
        r /= n; g /= n; b /= n;
        const k = 235 / Math.max(r, g, b);              // wyrównanie jasności – czytelna nazwa i poświata
        return `${Math.round(Math.min(255, r * k))} ${Math.round(Math.min(255, g * k))} ${Math.round(Math.min(255, b * k))}`;
      })().catch(() => undefined));
    }
    return rarCache.get(key);
  };
  const nameColor = (tip) => {
    const el = tip.querySelector('.item-name');
    const c = el && /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(getComputedStyle(el).color);
    if (!c) return undefined;
    const [r, g, b] = [+c[1], +c[2], +c[3]];
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    return (mx - mn) / (mx || 1) < 0.3 ? null : `${r} ${g} ${b}`;
  };
  const tintTooltip = async (tip) => {
    const item = tip.querySelector('.item-head .item');
    if (!item) return;
    const idCls = [...item.classList].find((c) => c.startsWith('item-id-')) || '';
    tip.dataset.vvFor = idCls;
    const source = idCls ? [...document.querySelectorAll('.item.' + idCls)].find((e) => !e.closest('.tip-wrapper')) : null;
    const frames = [source && source.querySelector('.highlight'), item.querySelector('.highlight')].filter(Boolean);
    let color, fromFrame = false;
    for (const f of frames) { color = await frameColor(f); if (color !== undefined) { fromFrame = !!color; break; } }
    if (color === undefined) color = nameColor(tip);
    if (tip.dataset.vvFor !== idCls) return;            // w międzyczasie tooltip pokazuje już inny przedmiot
    if (color) tip.style.setProperty('--vv-rar', color); else tip.style.removeProperty('--vv-rar');
    tip.classList.toggle('vv-rar-frame', fromFrame);
  };
  const pendingTips = new Set();
  let tipFrame = 0;
  const queueTip = (tip) => {
    pendingTips.add(tip);
    if (!tipFrame) tipFrame = requestAnimationFrame(() => { tipFrame = 0; const l = [...pendingTips]; pendingTips.clear(); l.forEach(tintTooltip); });
  };
  // tooltip pojawił się albo zmienił zawartość (gra używa ponownie tych samych elementów) → kolor z ramki
  const tipObs = new MutationObserver((muts) => {
    if (!enabled()) return;
    for (const m of muts) {
      if (!m.addedNodes.length) continue;
      const t = m.target.nodeType === 1 && (m.target.closest('.tip-wrapper.normal-tip') || (m.target.classList.contains('tip-wrapper') ? m.target : null));
      if (t) queueTip(t);
      else for (const n of m.addedNodes) if (n.nodeType === 1 && n.classList.contains('tip-wrapper')) queueTip(n);
    }
  });

  // Strona gry rozpoznana → klasa vv-game (reguły globalne) + przycisk. Obserwator z debounce,
  // odłączany, gdy interfejs zostanie potwierdzony (albo po 60 s – np. strona logowania).
  let debounce = 0;
  const onGameFound = (iface) => {
    setInterface(iface);
    if (iface !== 'ni') return;
    root.classList.add('vv-game');
    addToggleButton();
    const layer = document.querySelector('.interface-layer') || document.body;
    orbObs.observe(layer, { childList: true, subtree: true });
    ensureOrbFx();
    tipObs.observe(document.body, { childList: true, subtree: true });
  };
  const check = () => {
    const iface = detectDom();
    if (iface && document.body) { onGameFound(iface); obs.disconnect(); }
  };
  const obs = new MutationObserver(() => {
    clearTimeout(debounce);
    debounce = setTimeout(check, 150);
  });
  obs.observe(root, { childList: true, subtree: true });
  setTimeout(() => obs.disconnect(), 60000);
  check();   // gdy Tampermonkey uruchomi skrypt dopiero po załadowaniu strony

  apply();
  GM_registerMenuCommand('Fioletowa Pustka: włącz / wyłącz (Ctrl+Alt+V)', toggle);
  GM_registerMenuCommand('Fioletowa Pustka: intensywność świecenia (Ctrl+Alt+I)', cycleGlow);
  window.addEventListener('keydown', (e) => {
    if (!e.ctrlKey || !e.altKey || e.shiftKey || e.metaKey) return;
    if (e.code === 'KeyV') { e.preventDefault(); toggle(); }
    else if (e.code === 'KeyI') { e.preventDefault(); cycleGlow(); }
  }, true);

  console.info(`[Fioletowa Pustka] v${VERSION} ${enabled() ? 'włączona' : 'wyłączona'}, świecenie: ${GLOW_LABEL[glow()]}`);
})();
