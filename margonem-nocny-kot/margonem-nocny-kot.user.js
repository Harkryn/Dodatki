// ==UserScript==
// @name         Margonem – Nocny Kot
// @namespace    https://github.com/Harkryn/Dodatki
// @version      1.5.0
// @description  Minimalistyczny czarny motyw nowego interfejsu (NI) z kreskówkowymi kotami; fiolet tylko jako akcent. Tylko wygląd – bez zmian w logice gry.
// @author       Harkryn
// @match        https://*.margonem.pl/*
// @match        https://*.margonem.com/*
// @run-at       document-start
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @grant        GM_getResourceURL
// @resource     nktChatCat   https://raw.githubusercontent.com/Harkryn/Dodatki/main/assets/nocny-kot/spiacy-kot.png
// @resource     nktTail      https://raw.githubusercontent.com/Harkryn/Dodatki/main/assets/nocny-kot/ogonek.png
// @resource     nktPaw       https://raw.githubusercontent.com/Harkryn/Dodatki/main/assets/nocny-kot/odcisk.png
// @resource     nktMiniCat   https://raw.githubusercontent.com/Harkryn/Dodatki/main/assets/nocny-kot/kot-minimapa.png
// @resource     nktEyes      https://raw.githubusercontent.com/Harkryn/Dodatki/main/assets/nocny-kot/oczy.png
// @resource     nktHpPaw     https://raw.githubusercontent.com/Harkryn/Dodatki/main/assets/nocny-kot/lapka-hp.png
// @resource     nktEarL      https://raw.githubusercontent.com/Harkryn/Dodatki/main/assets/nocny-kot/uszko-l.png
// @resource     nktEarR      https://raw.githubusercontent.com/Harkryn/Dodatki/main/assets/nocny-kot/uszko-p.png
// @resource     nktToggle    https://raw.githubusercontent.com/Harkryn/Dodatki/main/assets/nocny-kot/przelacznik.png
// @resource     nktLoader    https://raw.githubusercontent.com/Harkryn/Dodatki/main/assets/nocny-kot/ekran-ladowania.webp
// @resource     nktHudIcons  https://raw.githubusercontent.com/Harkryn/Dodatki/main/assets/nocny-kot/ikony-hud.png
// @resource     nktFrame     https://raw.githubusercontent.com/Harkryn/Dodatki/main/assets/nocny-kot/rama-hud.png
// @resource     nktGold      https://raw.githubusercontent.com/Harkryn/Dodatki/main/assets/nocny-kot/zloto.png
// @resource     nktTears     https://raw.githubusercontent.com/Harkryn/Dodatki/main/assets/nocny-kot/smocze-lzy.png
// @resource     nktFur       https://raw.githubusercontent.com/Harkryn/Dodatki/main/assets/nocny-kot/futro.png
// @resource     nktOrn       https://raw.githubusercontent.com/Harkryn/Dodatki/main/assets/nocny-kot/zdobienie-hp.png
// @resource     nktExp       https://raw.githubusercontent.com/Harkryn/Dodatki/main/assets/nocny-kot/pasek-exp.png
// @updateURL    https://raw.githubusercontent.com/Harkryn/Dodatki/main/margonem-nocny-kot/margonem-nocny-kot.user.js
// @downloadURL  https://raw.githubusercontent.com/Harkryn/Dodatki/main/margonem-nocny-kot/margonem-nocny-kot.user.js
// ==/UserScript==

/*
 * Budowa (sprawdzona w Tamahagane): wszystkie reguły są pod html.nkt-on.nkt-ni, więc wyłączenie motywu
 * to zdjęcie jednej klasy. Klasa nkt-ni pojawia się dopiero po wykryciu nowego interfejsu w DOM –
 * w starym interfejsie (SI) skrypt kończy się od razu i niczego nie dodaje.
 * Opcje na <html>: nkt-anim (kocie animacje), nkt-hp-red (czerwone wypełnienie łapki HP zamiast fioletu).
 * Sekcje: ZMIENNE · BAZOWE · OKNA · CZAT · EKWIPUNEK · TOOLTIPY · WALKA · ŁAPKA HP · PASKI · ANIMACJE · PRZEŁĄCZNIK
 */

(() => {
  'use strict';

  if (window.top !== window.self) return;

  // Stary interfejs (SI): gra zapisuje wybór w ciasteczku `interface` – w SI nic nie robimy.
  try { if (/(?:^|;\s*)interface=si\b/i.test(document.cookie || '')) return; } catch (e) { /* brak ciasteczek */ }

  const VERSION = '1.5.0';
  const ON = 'nkt-on';          // motyw włączony
  const NI = 'nkt-ni';          // wykryto nowy interfejs
  const ANIM = 'nkt-anim';      // kocie animacje włączone
  const HPRED = 'nkt-hp-red';   // łapka HP wypełniona czerwienią
  const KEY_ON = 'nkt-enabled';
  const KEY_ANIM = 'nkt-anim';
  const KEY_HP = 'nkt-hp-color'; // 'violet' | 'red'
  const root = document.documentElement;

  const get = (k, d) => { try { return typeof GM_getValue === 'function' ? GM_getValue(k, d) : d; } catch (e) { return d; } };
  const set = (k, v) => { try { if (typeof GM_setValue === 'function') GM_setValue(k, v); } catch (e) { /* brak GM */ } };

  // N – reguły nowego interfejsu; W – zwykłe okno NI (bez przezroczystych i dymków); A – tylko z animacjami
  const N = `html.${ON}.${NI}`;
  const W = `${N} .border-window:not(.transparent):not(.tip-window)`;
  const A = `html.${ON}.${NI}.${ANIM}`;

  // Grafiki: @resource + GM_getResourceURL (Tampermonkey trzyma je lokalnie). Tampermonkey zwraca adresy data:,
  // które wklejone do CSS robiły z arkusza Tamahagane ~1,5 MB – każdą grafikę zamieniamy raz na krótki adres blob:.
  const RAW = 'https://raw.githubusercontent.com/Harkryn/Dodatki/main/assets/nocny-kot/';
  const toBlobUrl = (u) => {
    if (!u || u.slice(0, 5) !== 'data:') return u;
    try {
      const i = u.indexOf(','), meta = u.slice(5, i), body = u.slice(i + 1);
      const bin = /;base64/i.test(meta) ? atob(body) : decodeURIComponent(body);
      const arr = new Uint8Array(bin.length);
      for (let k = 0; k < bin.length; k++) arr[k] = bin.charCodeAt(k);
      let type = meta.split(';')[0];
      if (!/^image\//.test(type)) type = 'image/png';
      return URL.createObjectURL(new Blob([arr], { type }));
    } catch (e) { return u; }
  };
  const res = (name, file) => {
    try { if (typeof GM_getResourceURL === 'function') { const u = GM_getResourceURL(name); if (u) return toBlobUrl(u); } } catch (e) { /* brak zasobu */ }
    return RAW + file;
  };
  // Grafiki malowane (Qwen-Image i lokalne ComfyUI; prompty w assets/nocny-kot/PROMPTS.md). Pliki mają 2× rozmiar w grze.
  const IMG = {
    chatCat: res('nktChatCat', 'spiacy-kot.png'),   // 240×123, kot śpiący na krawędzi (łapka i ogon zwisają); krawędź na 53% wysokości
    tail: res('nktTail', 'ogonek.png'),             // 81×180, puszysty ogon zwisający z krawędzi, miękki zakręt
    paw: res('nktPaw', 'odcisk.png'),               // 48×42, ciemne poduszki łapki na fioletowej poświacie
    miniCat: res('nktMiniCat', 'kot-minimapa.png'),        // 160×118, kot zaglądający zza krawędzi (nad dolnym paskiem); dół głowy (krawędź) y 102
    eyes: res('nktEyes', 'oczy.png'),               // 120×47, bursztynowe kocie oczy w ciemności (ekran wczytywania)
    hpPaw: res('nktHpPaw', 'lapka-hp.png'),         // 200×217, spód kociej łapki – kształt i tekstura kuli HP
    earL: res('nktEarL', 'uszko-l.png'),            // 58×72, puszyste lewe ucho z pędzelkiem
    earR: res('nktEarR', 'uszko-p.png'),            // 57×72, puszyste prawe ucho z pędzelkiem
    toggle: res('nktToggle', 'przelacznik.png'),    // 64×64, kot na tle półksiężyca (fioletowy kafelek)
    loader: res('nktLoader', 'ekran-ladowania.webp'), // 480×480, kot na murku patrzy na księżyc (brzegi wygaszone do czerni)
    // lokalne ComfyUI (Z-Image Turbo + RMBG 3.0):
    hudIcons: res('nktHudIcons', 'ikony-hud.png'),  // 1200×60, 20 ikon HUD po 60×60 (kolejność w HUD_ICONS)
    frame: res('nktFrame', 'rama-hud.png'),         // ramka przycisku HUD z kocimi uszkami 100×104 (wymiary w FRAME)
    gold: res('nktGold', 'zloto.png'),              // 42×42, stos monet z odciskiem łapki
    tears: res('nktTears', 'smocze-lzy.png'),       // 42×42, karmazynowo-fioletowa kropla
    fur: res('nktFur', 'futro.png'),                // 240×237, kwadratowa ramka z czarnej sierści (border-image, sierść ~20% boku)
    orn: res('nktOrn', 'zdobienie-hp.png'),         // 1180×216, dwa kocie ogony w spiralach i okrągłe gniazdo kuli (środek gniazda y 138)
    exp: res('nktExp', 'pasek-exp.png')             // 500×43, ramka paska expa z odciskiem łapki na lewym końcu
  };

  const FRAME = { w: 100, h: 104 }; // rama-hud.png; kwadratowa część ma 100×100 u dołu, nad nią uszy

  const svgUrl = (s) => `url("data:image/svg+xml,${encodeURIComponent(s)}")`;

  /* ─────────────────────────────────────────────────────────────────────────
   * IKONY WEKTOROWE (rysowane w kodzie: gruba, zaokrąglona linia jak w kreskówce)
   * ───────────────────────────────────────────────────────────────────────── */
  // lupa w polach wyszukiwania
  const SEARCH_ICON = svgUrl(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke-linecap='round'>` +
    `<circle cx='6.8' cy='6.8' r='4.4' stroke='#8d8a9c' stroke-width='2'/><path d='M10.2 10.2l3.6 3.6' stroke='#7b4fd6' stroke-width='2.4'/></svg>`);
  // ptaszek zaznaczonego pola
  const CHECK_ICON = svgUrl(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='#ecebf2' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'>` +
    `<path d='M3.5 8.5l3 3 6-7'/></svg>`);
  // „×” zamykania – zaokrąglone końce
  const CLOSE_ICON = (c) => svgUrl(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='${c}' stroke-width='2.4' stroke-linecap='round'>` +
    `<path d='M4.5 4.5l7 7M11.5 4.5l-7 7'/></svg>`);
  // przełącznik motywu: malowany kafelek z kotem i półksiężycem
  const CAT_FACE = `url("${IMG.toggle}")`;

  /* =====================================================================
   * === ZMIENNE ===
   * Płaskie czernie i grafity, fiolet tylko na akcentach, różowy wyłącznie na kocich poduszeczkach.
   * Kontrast (WCAG): #ecebf2 na #0a0a0d ≈ 17:1, na #1a1a20 ≈ 14:1; przygaszony #8d8a9c na #0a0a0d ≈ 5,9:1,
   * na #1a1a20 ≈ 5,0:1 (AA dla zwykłego tekstu); #a07cf0 na #0a0a0d ≈ 6,0:1.
   * ===================================================================== */
  const cssVars = `
:root {
  --nkt-k0: #0a0a0d;            /* tło, wnęki */
  --nkt-k1: #121216;            /* panele */
  --nkt-k2: #1a1a20;            /* podniesione elementy, nagłówki, przyciski */
  --nkt-k3: #222229;            /* najechanie na podniesione */
  --nkt-v: #7b4fd6;             /* fiolet – główny akcent */
  --nkt-v-hi: #a07cf0;          /* najechanie, aktywne */
  --nkt-v-line: #3b2a63;        /* cienkie obramowania */
  --nkt-pink: #f2a7c3;          /* tylko kocie poduszeczki */
  --nkt-text: #ecebf2;
  --nkt-dim: #8d8a9c;
  --nkt-r: 12px;                /* zaokrąglenie okien */
  --nkt-r-s: 10px;              /* zaokrąglenie mniejszych elementów */
  --nkt-ring: 0 0 0 2px var(--nkt-v-line);                 /* gruby, miękki kontur jak w kreskówce */
  --nkt-ring-hi: 0 0 0 2px var(--nkt-v-hi);
  --nkt-lift: 0 8px 24px rgb(0 0 0 / .55);                 /* jeden lekki cień zamiast ciężkich */
  --nkt-font: 'Nunito', 'Segoe UI', Arial, sans-serif;
}
`;

  /* =====================================================================
   * === BAZOWE (zaznaczenie, scrollbary, pola tekstowe, przełączniki, tabele, czcionka) ===
   * ===================================================================== */
  const cssBase = `
${N} ::selection { background: var(--nkt-v); color: #fff; }

/* czcionka: zaokrąglone Nunito (z polskimi znakami) w oknach, czacie, tooltipach i dialogach.
   Waga 600 – na ciemnym tle cienkie kreski małych liter znikały. */
${N} .border-window, ${N} .tip-wrapper, ${N} .new-chat-window, ${N} .dialogue-window,
${N} .battle-controller, ${N} .button .label, ${N} .mAlert {
  font-family: var(--nkt-font) !important;
}
${N} .border-window .content, ${N} .tip-wrapper .content, ${N} .new-chat-window .new-chat-message { font-weight: 600; }

/* scrollbary natywne: cienki zaokrąglony uchwyt w grafitowej rynnie */
${N} * { scrollbar-color: var(--nkt-v-line) var(--nkt-k0); }
${N} ::-webkit-scrollbar { width: 8px; height: 8px; }
${N} ::-webkit-scrollbar-track { background: var(--nkt-k0); border-radius: 8px; }
${N} ::-webkit-scrollbar-thumb { background: var(--nkt-v-line); border-radius: 8px; border: 2px solid var(--nkt-k0); }
${N} ::-webkit-scrollbar-thumb:hover { background: var(--nkt-v); }
${N} ::-webkit-scrollbar-corner { background: var(--nkt-k0); }

/* suwaki gry (własne elementy, nie natywne) */
${N} .scrollbar-wrapper .track { background: var(--nkt-k0) !important; border-radius: 8px; box-shadow: none !important; }
${N} .scrollbar-wrapper .handle {
  background: var(--nkt-v-line) !important;
  border-radius: 8px !important;
  box-shadow: none !important;
  transition: background-color .2s ease;
}
${N} .scrollbar-wrapper .handle:hover { background: var(--nkt-v) !important; }

/* pola tekstowe: płaska wnęka, zaokrąglona, fioletowy kontur przy fokusie */
${N} input[type="text"], ${N} input[type="number"], ${N} input[type="search"], ${N} input[type="password"],
${N} input:not([type]), ${N} textarea, ${N} select {
  background-color: var(--nkt-k0) !important;
  color: var(--nkt-text) !important;
  border-color: var(--nkt-v-line) !important;
  border-radius: 8px;
  caret-color: var(--nkt-v-hi);
  font-family: var(--nkt-font);
}
${N} input:focus, ${N} textarea:focus, ${N} select:focus, ${N} [contenteditable="true"]:focus {
  outline: none !important;
  border-color: var(--nkt-v) !important;
  box-shadow: 0 0 0 2px rgb(123 79 214 / .35) !important;
}
${N} input::placeholder, ${N} textarea::placeholder { color: var(--nkt-dim) !important; opacity: 1; }

/* pola wyszukiwania */
${N} .search-component {
  border: 2px solid var(--nkt-v-line) !important;
  border-image: none !important;
  border-radius: 999px !important;
  background: ${SEARCH_ICON} 8px 50% / 13px 13px no-repeat, var(--nkt-k0) !important;
  box-shadow: none !important;
}
${N} .search-component:focus-within { border-color: var(--nkt-v) !important; }

/* przełączniki (c-checkbox): zaokrąglony kwadracik, zaznaczony – fiolet z ptaszkiem */
${N} .c-checkbox__label::before {
  background: var(--nkt-k0) !important;
  border: 2px solid var(--nkt-v-line) !important;
  border-radius: 6px !important;
  box-shadow: none !important;
}
${N} .c-checkbox__label:hover::before { border-color: var(--nkt-v-hi) !important; }
${N} .c-checkbox input:checked + .c-checkbox__label::before {
  background: ${CHECK_ICON} center / 80% no-repeat, var(--nkt-v) !important;
  border-color: var(--nkt-v) !important;
}

/* listy z grupami (ustawienia, rzemiosło): wybrana pozycja – zaokrąglona plakietka z fioletową kreską */
${N} .one-item-on-divide-list { border-radius: 8px; }
${N} .one-item-on-divide-list.active {
  background: rgb(123 79 214 / .16) !important;
  box-shadow: inset 3px 0 0 var(--nkt-v);
}
${N} .one-item-on-divide-list:not(.active):hover { background: rgb(123 79 214 / .08) !important; }

/* tabele (c-table) */
${N} .c-table th {
  background: var(--nkt-k2) !important;
  border-color: var(--nkt-k0) !important;
  box-shadow: inset 0 -2px 0 var(--nkt-v-line);
  color: var(--nkt-text) !important;
  text-shadow: none;
}
${N} .c-table td, ${N} .c-table tr, ${N} .c-table table { border-color: var(--nkt-k2) !important; }
${N} .c-table td { background-color: rgb(10 10 13 / .6); }

/* tekst rozjaśniony przez skaner czytelności (ciemny tekst z dawnego pergaminu) */
${N} .nkt-lt { color: var(--nkt-c) !important; }
`;

  /* =====================================================================
   * === OKNA (zwykłe, przezroczyste, dymki, komunikaty, wspólne panele, zakładki, przyciski) ===
   * Płaskie panele z zaokrąglonymi rogami i grubym miękkim konturem, dużo powietrza, bez tekstur.
   * ===================================================================== */
  const cssWindows = `
/* --- okno zwykłe: płaski grafit, kontur 2 px w ciemnym fiolecie, jeden miękki cień.
   border-width zostaje taki jak w grze – układ okna się nie zmienia. --- */
${W} {
  border-image: none !important;
  border-color: transparent !important;
  border-radius: var(--nkt-r) !important;
  background: var(--nkt-k1) !important;
  background-clip: padding-box !important;
  box-shadow: var(--nkt-ring), 0 0 0 4px var(--nkt-k0), var(--nkt-lift) !important;
  color: var(--nkt-text);
}
${W} > .content { background: transparent !important; color: var(--nkt-text); }
/* futrzana ramka: miękka czarna sierść nałożona na krawędź okna (border-image 9-slice, nakładka bez kliknięć) */
${W}::after {
  content: ""; position: absolute; inset: -10px; pointer-events: none;
  border: 18px solid transparent; border-image: url("${IMG.fur}") 20% round;
  filter: drop-shadow(0 0 1px rgb(123 79 214 / .35)) drop-shadow(0 2px 3px rgb(0 0 0 / .5));
}

/* tytuł: zaokrąglona plakietka (pigułka) w grafitowym odcieniu, czcionka Nunito 800 */
${W} .header-label-positioner .header-label {
  border-image: none !important;
  border-width: 0 !important;
  background: var(--nkt-k2) !important;
  border-radius: 999px !important;
  box-shadow: var(--nkt-ring) !important;
}
${W} .header-label-positioner .header-label .left-decor,
${W} .header-label-positioner .header-label .right-decor { background: none !important; display: none !important; }
${W} .header-label-positioner .header-label .text {
  color: var(--nkt-text) !important;
  font-family: var(--nkt-font) !important;
  font-weight: 800 !important;
  letter-spacing: .03em;
  text-shadow: none !important;
}

/* zamknięcie: okrągły guzik z zaokrąglonym „×”; najechanie – fiolet i lekkie podskoczenie */
${W} .close-button-corner-decor { background: none !important; }
${W} .close-button-corner-decor .close-button {
  background: ${CLOSE_ICON('#8d8a9c')} center / 12px 12px no-repeat, var(--nkt-k2) !important;
  border-radius: 50% !important;
  box-shadow: var(--nkt-ring) !important;
  filter: none !important;
}
${W} .close-button-corner-decor .close-button:hover {
  background: ${CLOSE_ICON('#ecebf2')} center / 12px 12px no-repeat, var(--nkt-v) !important;
  box-shadow: var(--nkt-ring-hi) !important;
}

/* drobne ikony okien (przezroczystość, zwijanie, informacja): szare, przy najechaniu jasnofioletowe */
${N} .border-window .increase-opacity,
${N} .border-window .collapse,
${N} .dialogue-window .increase-opacity,
${N} .info-icon { filter: grayscale(1) brightness(.8); }
${N} .border-window .increase-opacity:hover,
${N} .border-window .collapse:hover,
${N} .dialogue-window .increase-opacity:hover,
${N} .info-icon:hover { filter: grayscale(1) sepia(1) hue-rotate(215deg) saturate(3) brightness(1.05); }

/* zakładki w oknach: płaskie, zaokrąglone u góry; aktywna jaśniejsza z grubą fioletową kreską */
${N} .border-window .card,
${N} .interface-element-card-background,
${N} .interface-element-card-background-stretch {
  border-color: transparent !important;
  border-image: none !important;
  background: var(--nkt-k0) !important;
  border-radius: var(--nkt-r-s) var(--nkt-r-s) 0 0 !important;
  box-shadow: none !important;
  color: var(--nkt-dim) !important;
}
${N} .border-window .card:hover { color: var(--nkt-text) !important; background: var(--nkt-k2) !important; }
${N} .border-window .card.active,
${N} .interface-element-active-card-background,
${N} .interface-element-active-card-background-stretch,
${N} .interface-element-active-card-border-image {
  border-color: transparent !important;
  border-image: none !important;
  background: var(--nkt-k2) !important;
  border-radius: var(--nkt-r-s) var(--nkt-r-s) 0 0 !important;
  box-shadow: inset 0 -3px 0 var(--nkt-v) !important;
  color: var(--nkt-text) !important;
}

/* --- okna przezroczyste (minimapa, obserwowane zadania, zegar…): półprzezroczysta czerń, cienki kontur --- */
${N} .border-window.transparent .border-image {
  border-image: none !important;
  border-color: transparent !important;
  background: rgb(10 10 13 / .8) !important;
  border-radius: var(--nkt-r) !important;
  box-shadow: 0 0 0 2px rgb(59 42 99 / .8), 0 6px 16px rgb(0 0 0 / .5) !important;
}
${N} .border-window.transparent .header-label .text {
  color: var(--nkt-text) !important;
  font-family: var(--nkt-font) !important;
  font-weight: 800;
  text-shadow: 0 1px 2px #000 !important;
}

/* --- małe okna podpowiedzi (tip-window) --- */
${N} .border-window.tip-window {
  border-image: none !important;
  border-color: transparent !important;
  background: var(--nkt-k1) !important;
  background-clip: padding-box !important;
  border-radius: var(--nkt-r-s) !important;
  box-shadow: var(--nkt-ring), 0 6px 16px rgb(0 0 0 / .55) !important;
}
${N} .border-window.tip-window .content { background: transparent !important; color: var(--nkt-text); }
${N} .border-window.tip-window .header-label-positioner .header-label { background: none !important; }
${N} .border-window.tip-window .header-label-positioner .header-label .left-decor,
${N} .border-window.tip-window .header-label-positioner .header-label .right-decor { background: none !important; }

/* --- okno komunikatu (mAlert): pergamin → płaski grafit --- */
${N} .border-window.mAlert .paper-background,
${N} .border-window.mAlert-mobile-layer .paper-background {
  background: var(--nkt-k1) !important;
  border-radius: var(--nkt-r-s);
  box-shadow: none;
}

/* --- dymki nad postaciami (bubbledialog) – TODO: zweryfikuj selektor --- */
${N} .bubbledialog .bg-layer .top-frame,
${N} .bubbledialog .bg-layer .bottom-frame,
${N} .bubbledialog .bg-layer .left-frame,
${N} .bubbledialog .bg-layer .right-frame { background: none !important; }
${N} .bubbledialog .bg-layer {
  border-image: none !important;
  background: rgb(18 18 22 / .96) !important;
  border-radius: var(--nkt-r-s);
  box-shadow: var(--nkt-ring);
}

/* --- wspólne panele wnętrz okien (interface-element-*): płaska czerń, zaokrąglone rogi, bez ramek --- */
${N} .interface-element-middle-1-background,
${N} .interface-element-middle-1-background-stretch,
${N} .interface-element-middle-2-background,
${N} .interface-element-middle-2-background-stretch,
${N} .interface-element-middle-3-background,
${N} .interface-element-middle-3-background-stretch,
${N} .interface-element-middle-4-background,
${N} .interface-element-wood-box-background {
  border-image: none !important;
  border-color: transparent !important;
  background: var(--nkt-k0) !important;
  border-radius: var(--nkt-r-s);
  box-shadow: none !important;
  color: var(--nkt-text);
}
${N} .interface-element-background-color-1,
${N} .interface-element-background-color-2,
${N} .interface-element-background-color-3 { background: var(--nkt-k1) !important; color: var(--nkt-text); }
${N} .interface-element-green-box-background,
${N} .interface-element-green-box-background-stretch {
  background: var(--nkt-k2) !important;
  border-radius: var(--nkt-r-s);
  box-shadow: none;
}
/* nagłówki sekcji i paski: grafit z cienką fioletową kreską u dołu (zaokrąglone końce) */
${N} .interface-element-header-1-background,
${N} .interface-element-header-1-background-stretch,
${N} .interface-element-table-header-1-background,
${N} .interface-element-header-2-background,
${N} .interface-element-header-2-background-stretch,
${N} .interface-element-header-3,
${N} .interface-element-table-header-3-background,
${N} .interface-element-bottom-bar-background,
${N} .interface-element-bottom-bar-background-stretch,
${N} .cards-header-wrapper .header-background-graphic,
${N} .trade-window header .h_background .middle {
  border-image: none !important;
  border-color: transparent !important;
  background:
    linear-gradient(var(--nkt-v-line), var(--nkt-v-line)) center bottom / calc(100% - 24px) 2px no-repeat,
    var(--nkt-k2) !important;
  border-radius: var(--nkt-r-s);
  box-shadow: none !important;
}
${N} .trade-window header .h_background .left,
${N} .trade-window header .h_background .right { background: none !important; }
${N} .interface-element-header-1 { color: var(--nkt-text); }
${N} .interface-element-line-1-background { background: linear-gradient(90deg, transparent, var(--nkt-v-line) 15% 85%, transparent) center / 100% 2px no-repeat !important; }
${N} .interface-element-one-black-tile { background: var(--nkt-k0) !important; }
${N} .interface-element-one-gray-tile { background: var(--nkt-k1) !important; }
${N} .interface-element-box-shadow-2 { box-shadow: inset 0 0 0 2px var(--nkt-k2) !important; border-radius: var(--nkt-r-s); }
${N} .interface-element-border-window-frame,
${N} .additional-skill-panel .graphics .additional-skill-panel-border {
  border-image: none !important;
  border-color: var(--nkt-v-line) !important;
  border-radius: var(--nkt-r);
}
${N} .interface-element-vertical-wood {
  border-image: none !important;
  border-color: transparent !important;
  background: var(--nkt-k0) !important;
  border-radius: 6px;
}

/* --- przyciski tekstowe: zaokrąglone, płaski grafit z konturem; najechanie – jasny fiolet i lekkie podskoczenie.
   Kolory gry z innym znaczeniem (złoto, smocze łzy, czerwony) zostają jako przygaszona barwa. --- */
${N} .button.green:not(.background-gold):not(.background-draconite),
${N} .button.purple:not(.green) {
  border-image: none !important;
  border-color: transparent !important;
  border-radius: var(--nkt-r-s) !important;
  background: var(--nkt-k2) !important;
  box-shadow: var(--nkt-ring) !important;
}
${N} .button.purple:not(.green) { background: rgb(123 79 214 / .28) !important; }
${N} .button.green::before, ${N} .button.purple::before { box-shadow: none !important; background: none !important; }
${N} .button .label { color: var(--nkt-text) !important; font-weight: 700; text-shadow: none !important; }
${N} .button.green:not(.background-gold):not(.background-draconite):not(.disable):not(.no-hover):hover,
${N} .button.purple:not(.green):not(.disable):hover {
  background: var(--nkt-k3) !important;
  box-shadow: var(--nkt-ring-hi) !important;
}
${N} .button.red { filter: saturate(.7) brightness(.9); border-radius: var(--nkt-r-s) !important; }
${N} .button.disable { filter: grayscale(1) brightness(.6); }
`;

  /* =====================================================================
   * === KOCIE DETALE (kot śpiący na czacie, ogon na krawędzi kolumny, kot przy minimapie, odciski łapek) ===
   * Elementy .nkt-deco tworzy skrypt (placeDecor) i ustawia względem elementów gry; przy wyłączonym motywie
   * są ukryte. Czarne koty dostają cienką fioletową obwódkę (drop-shadow), żeby nie znikały na czarnym tle.
   * ===================================================================== */
  const cssCats = `
html:not(.${ON}) .nkt-deco { display: none !important; }
.nkt-deco { position: absolute; z-index: 6; pointer-events: none; }
.nkt-deco img { display: block; width: 100%; height: auto; -webkit-user-drag: none; user-select: none; }
.nkt-deco .nkt-cat-img { filter: drop-shadow(0 0 1px #7b4fd6) drop-shadow(0 0 .5px #7b4fd6) drop-shadow(0 2px 3px rgb(0 0 0 / .6)); }

/* kot śpiący na górnej krawędzi pola czatu (sprawdzone w grze: .new-chat-window .chat-input-wrapper) */
.nkt-chatcat { width: 92px; }
${A} .nkt-chatcat .nkt-cat-img { transform-origin: 50% 70%; animation: nkt-breathe 4.2s ease-in-out infinite; }
@keyframes nkt-breathe { 0%, 100% { transform: scale(1, 1); } 50% { transform: scale(1.012, 1.035); } }

/* ogon zwisający z krawędzi lewej kolumny; po najechaniu merda (zaczepiony u góry) */
.nkt-tail { width: 36px; pointer-events: auto; cursor: default; }
.nkt-tail .nkt-cat-img { transform-origin: 50% 0; }
${A} .nkt-tail:hover .nkt-cat-img { animation: nkt-wag .95s ease-in-out; }
@keyframes nkt-wag { 0% { transform: rotate(0); } 20% { transform: rotate(14deg); } 45% { transform: rotate(-11deg); } 70% { transform: rotate(6deg); } 100% { transform: rotate(0); } }

/* kot zaglądający znad górnej krawędzi dolnego paska (na stałe, na prawo od zdobienia kuli HP); łapki na krawędzi paska */
.nkt-barcat { width: 96px; z-index: 5; }

/* odciski łapek: wybrana pozycja list z grupami i środek cienkich separatorów */
${N} .one-item-on-divide-list.active {
  background: url("${IMG.paw}") 6px 50% / 12px auto no-repeat, rgb(123 79 214 / .16) !important;
  padding-left: 22px !important;
}
${N} .interface-element-line-1-background {
  background:
    url("${IMG.paw}") center / auto 9px no-repeat,
    linear-gradient(90deg, transparent, var(--nkt-v-line) 15% 44%, transparent 44% 56%, var(--nkt-v-line) 56% 85%, transparent) center / 100% 2px no-repeat !important;
}

/* uszy: dwa puszyste uszy wystające zza górnej krawędzi zwykłych okien, rozstawione przy rogach;
   podstawa schowana za oknem (z-index -1 w kontekście okna), po najechaniu na okno strzygą */
${W} .header-label-positioner::before,
${W} .header-label-positioner::after {
  content: ""; position: absolute; top: -30px; width: 29px; height: 36px; z-index: -1;
  pointer-events: none; transform-origin: 50% 100%;
  background: center bottom / contain no-repeat;
  filter: drop-shadow(0 0 1px rgb(123 79 214 / .7));
}
${W} .header-label-positioner::before { left: 13%; background-image: url("${IMG.earL}"); }
${W} .header-label-positioner::after { right: 13%; background-image: url("${IMG.earR}"); }
${A} .border-window:not(.transparent):not(.tip-window):hover .header-label-positioner::before { animation: nkt-ear-l .7s ease-in-out; }
${A} .border-window:not(.transparent):not(.tip-window):hover .header-label-positioner::after { animation: nkt-ear-r .7s ease-in-out .08s; }
@keyframes nkt-ear-l { 0%, 100% { transform: rotate(0); } 25% { transform: rotate(-14deg); } 55% { transform: rotate(6deg); } }
@keyframes nkt-ear-r { 0%, 100% { transform: rotate(0); } 25% { transform: rotate(14deg); } 55% { transform: rotate(-6deg); } }
`;

  /* =====================================================================
   * === ŁAPKA HP ===
   * Kula gry: .hp-indicator-wrapper (98×98, przycięta do koła) → .hp-indicator (98×78) → .blood (wysokość = % HP,
   * ustawia ją gra) i .hpp .value (napis). Poziomu nie liczymy sami – maska łapki jest zakotwiczona u dołu .blood,
   * więc wypełnienie rośnie od dołu dokładnie tak, jak gra zmienia wysokość krwi. Pusta część: ta sama łapka
   * przygaszona (::before). Kliknięcia i podpowiedzi zostają na elementach gry (dekoracje bez pointer-events).
   * ===================================================================== */
  const HPB = `${N} .hp-indicator-wrapper-template`;
  const cssHp = `
${HPB} .hp-indicator-wrapper { overflow: visible !important; border-radius: 0 !important; background: none !important; box-shadow: none !important; }
/* łapka półtora raza większa: rośnie w górę od dołu kuli i spokojnie wystaje na mapę (transform na samej kuli – kliknięcia i podpowiedzi działają) */
${HPB} .hp-indicator-wrapper { transform: scale(1.5); transform-origin: 50% 88%; z-index: 3; }
${HPB} .hp-indicator-wrapper .glass { opacity: 0 !important; }
${HPB} .hp-indicator { --nkt-hp-h: 78px; }
${HPB} .hp-indicator::before {
  content: ""; position: absolute; inset: 0; z-index: 0; pointer-events: none;
  background: url("${IMG.hpPaw}") center / auto 100% no-repeat;
  filter: grayscale(1) brightness(.3) drop-shadow(0 0 1px rgb(123 79 214 / .8)) drop-shadow(0 3px 6px rgb(0 0 0 / .7));
}
${HPB} .hp-indicator .blood {
  z-index: 1; overflow: hidden;
  background: linear-gradient(#d8c2ff, #8d5ff0 10%, #5a32b0 60%, #2c1660) !important;
  -webkit-mask: url("${IMG.hpPaw}") center bottom / auto var(--nkt-hp-h) no-repeat;
  mask: url("${IMG.hpPaw}") center bottom / auto var(--nkt-hp-h) no-repeat;
  transition: height .5s ease;
}
html.${ON}.${NI}.${HPRED} .hp-indicator-wrapper-template .hp-indicator .blood { background: linear-gradient(#ffc4ca, #e0566a 10%, #a52a3e 60%, #4e0f1c) !important; }
/* tekstura łapki (sierść, poduszki) prześwituje przez kolor wypełnienia */
${HPB} .hp-indicator .blood::after {
  content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: var(--nkt-hp-h); pointer-events: none;
  background: url("${IMG.hpPaw}") center bottom / auto var(--nkt-hp-h) no-repeat;
  mix-blend-mode: luminosity; opacity: .55;
}
${HPB} .hp-indicator .blood-frame { display: none !important; }
/* zdobienie wokół łapki: dwa kocie ogony w spiralach, okrągłe gniazdo pod łapką (zamiast grafiki gry .bottom-panel-graphic 590×100) */
${N} .bottom-panel-of-bottom-positioner .bottom-panel-graphic {
  background: url("${IMG.orn}") 50% -27px / 590px auto no-repeat !important;
  filter: drop-shadow(0 2px 4px rgb(0 0 0 / .6));
}
/* paski expa: ramka z odciskiem łapki (prawa w lustrze), żółte wypełnienie z łagodnym przesuwającym się połyskiem */
${N} .exp-bar-wrapper .exp-progress .overlay { background: url("${IMG.exp}") center / 100% 100% no-repeat !important; }
${N} .exp-bar-wrapper .exp-progress.right .overlay { transform: scaleX(-1); }
${N} .exp-bar-wrapper .exp-progress .progress { border-radius: 999px; overflow: hidden; }
${N} .exp-bar-wrapper .exp-progress .progress .inner {
  border-radius: 999px;
  background:
    linear-gradient(100deg, transparent 40%, rgb(255 251 225 / .6) 50%, transparent 60%) 100% 0 / 300% 100% no-repeat,
    linear-gradient(#fff1b8, #f5c542 45%, #c98a12) !important;
  box-shadow: 0 0 6px rgb(245 197 66 / .45);
}
${A} .exp-bar-wrapper .exp-progress .progress .inner { animation: nkt-exp-shine 4s ease-in-out infinite, nkt-exp-glow 4s ease-in-out infinite; }
${A} .exp-bar-wrapper .exp-progress.right .progress .inner { animation-delay: 2s; }
@keyframes nkt-exp-shine { 0% { background-position: 100% 0, 0 0; } 55%, 100% { background-position: 0% 0, 0 0; } }
@keyframes nkt-exp-glow { 0%, 100% { box-shadow: 0 0 5px rgb(245 197 66 / .35); } 50% { box-shadow: 0 0 10px rgb(245 197 66 / .7); } }
${HPB} .hp-indicator .hpp { z-index: 2; }
${HPB} .hp-indicator .hpp .value {
  color: #fff !important; font-family: var(--nkt-font) !important; font-weight: 800 !important;
  text-shadow: 0 0 3px #000, 0 0 2px #000, 0 1px 1px #000, 0 0 6px rgb(0 0 0 / .8) !important;
}
/* niskie HP (< 25%): łapka delikatnie pulsuje – klasę nkt-hp-low ustawia skrypt z wysokości .blood */
html.${ON}.${NI}.${ANIM}.nkt-hp-low .hp-indicator-wrapper-template .hp-indicator { animation: nkt-hp-pulse 1.4s ease-in-out infinite; }
@keyframes nkt-hp-pulse { 0%, 100% { transform: scale(1); filter: none; } 50% { transform: scale(1.05); filter: drop-shadow(0 0 7px rgb(160 124 240 / .7)); } }
`;

  /* =====================================================================
   * === EKRAN WCZYTYWANIA (warstwa gry .layer.loader-layer: logo .loader-image, pasek .inner-wrapper > .inner) ===
   * ===================================================================== */
  const cssLoader = `
${N} .layer.loader-layer {
  background:
    /* logo gry stoi ~100 px nad środkiem – ilustracja tuż nad nim; rozmiar zależy od wysokości okna (niskie ekrany) */
    url("${IMG.loader}") 50% calc(50% - 100px - min(150px, 20vh)) / min(300px, 40vh) min(300px, 40vh) no-repeat,
    radial-gradient(ellipse 30% 18% at 50% 56%, rgb(123 79 214 / .12), transparent 70%),
    #08080a !important;
}
${N} .layer.loader-layer .loader-image {
  filter: sepia(1) hue-rotate(225deg) saturate(2.2) brightness(1.05) drop-shadow(0 0 10px rgb(123 79 214 / .6)) drop-shadow(0 2px 4px #000);
}
${N} .layer.loader-layer .progress-bar .inner-wrapper {
  height: 12px !important; border-radius: 999px; overflow: hidden;
  background: #121216 !important; box-shadow: 0 0 0 2px var(--nkt-v-line), 0 0 14px rgb(123 79 214 / .25);
}
${N} .layer.loader-layer .progress-bar .inner-wrapper .inner {
  border-radius: 999px;
  background: url("${IMG.paw}") 3px 50% / 10px auto repeat-x, linear-gradient(#b596ff, #7b4fd6) !important;
  transition: width .3s ease;
}
${N} .layer.loader-layer .bottom-info { color: var(--nkt-dim) !important; font-family: var(--nkt-font); }
/* bursztynowe oczy w ciemnych rogach, co kilka sekund mrugają */
${N} .layer.loader-layer::before,
${N} .layer.loader-layer::after {
  content: ""; position: absolute; width: 84px; height: 33px; pointer-events: none;
  background: url("${IMG.eyes}") center / contain no-repeat; opacity: .8;
}
${N} .layer.loader-layer::before { left: 6%; top: 9%; }
${N} .layer.loader-layer::after { right: 7%; bottom: 14%; width: 64px; height: 25px; opacity: .6; }
${A} .layer.loader-layer::before { animation: nkt-blink 5.2s infinite; }
${A} .layer.loader-layer::after { animation: nkt-blink 6.4s 2.3s infinite; }
@keyframes nkt-blink { 0%, 90%, 100% { transform: scaleY(1); } 93% { transform: scaleY(.08); } }
`;

  /* =====================================================================
   * === PRZYCISKI HUD (.widget-button 44×44 z .icon.<nazwa> 30×30) i WALUTY (.gold-tip / .credits-tip 21×21) ===
   * ===================================================================== */
  // Kolejność ikon w arkuszu ikony-hud.png (po 60×60 px, w grze 30×30). Nazwy = klasy .icon w grze.
  const HUD_ICONS = ['exit', 'world-icon', 'config', 'rewards-calendar-icon', 'clans', 'globe', 'party',
    'inventory-browser-icon', 'matchmaking-icon', 'chat', 'photo', 'portable-map-icon', 'compass', 'loot-filter-icon',
    'timer-icon', 'star', 'skills', 'friends', 'scroll', 'news-icon'];
  const WB = `${N} .widget-button`;
  const cssHud = `
/* kolory grup gry (zielony/niebieski/fioletowy/czerwony) zastępuje jednolity grafit; ramka z kocimi uszkami to obrazek */
${WB} {
  background: radial-gradient(120% 90% at 50% 12%, #22202b, #0e0e12 72%) !important;
  border: 0 !important; border-radius: 10px !important; box-shadow: none !important; overflow: visible !important;
}
${WB}::before {
  inset: 2px !important; border-radius: 8px !important; background-color: transparent;
  box-shadow: none !important; transition: background-color .18s ease, box-shadow .18s ease;
}
${WB}::after {
  content: "" !important; position: absolute; left: -3px !important; right: -3px; bottom: -3px; top: auto !important;
  width: auto !important; height: calc((100% + 6px) * ${FRAME.h / FRAME.w}) !important;
  background: url("${IMG.frame}") center bottom / 100% auto no-repeat !important;
  box-shadow: none !important; border-radius: 0 !important; pointer-events: none; z-index: 2;
}
${WB}:hover::before { background-color: rgb(123 79 214 / .14); box-shadow: 0 0 10px rgb(123 79 214 / .45) !important; }
${WB}.window-is-open::before { background-color: rgb(123 79 214 / .22) !important; }
${WB}.active::before { background-color: rgb(0 0 0 / .35); }
${WB} .red-notification { z-index: 3; }
${HUD_ICONS.map((n, i) => `${WB} .icon.${n}`).join(',\n')} {
  background: url("${IMG.hudIcons}") 0 0 / ${HUD_ICONS.length * 30}px 30px no-repeat !important;
  filter: brightness(1.3) drop-shadow(0 0 1px rgb(160 124 240 / .6)) drop-shadow(0 1px 1px rgb(0 0 0 / .7)); /* ciemne ikony czytelne na grafitowym tle */
  transition: transform .18s ease;
}
${HUD_ICONS.map((n, i) => `${WB} .icon.${n} { background-position: ${-i * 30}px 0 !important; }`).join('\n')}
${A} .widget-button:hover .icon { transform: translateY(-1px) scale(1.06); }
/* waluty na górnej tabliczce: złoto z odciskiem łapki, smocze łzy */
${N} .hud-container .gold-tip,
${N} .hud-container .credits-tip { border-radius: 50%; filter: drop-shadow(0 1px 1px rgb(0 0 0 / .8)); }
${N} .hud-container .gold-tip { background: url("${IMG.gold}") center / contain no-repeat, #1a1a20 !important; }
${N} .hud-container .credits-tip { background: url("${IMG.tears}") center / contain no-repeat, #1a1a20 !important; }
`;

  /* =====================================================================
   * === ANIMACJE (delikatne; tylko z klasą nkt-anim; zawsze wyłączone przy prefers-reduced-motion) ===
   * ===================================================================== */
  const cssAnim = `
@keyframes nkt-hop { 0%, 100% { transform: translateY(0); } 40% { transform: translateY(-2px); } 70% { transform: translateY(.5px); } }
${N} .button, ${N} .border-window .card, ${N} .close-button { transition: box-shadow .18s ease, background-color .18s ease, color .18s ease; }
${A} .button:not(.disable):hover,
${A} .close-button-corner-decor .close-button:hover { animation: nkt-hop .32s ease-out; }
@media (prefers-reduced-motion: reduce) {
  ${N} *, ${N} *::before, ${N} *::after { animation: none !important; transition: none !important; }
  #nkt-toggle, #nkt-toast, #nkt-panel { transition: none !important; animation: none !important; }
}
`;

  /* =====================================================================
   * === PRZEŁĄCZNIK (kocia główka w lewym dolnym rogu, panel opcji, skróty, menu Tampermonkey) ===
   * ===================================================================== */
  const cssToggle = `
#nkt-toggle {
  position: fixed; left: 8px; bottom: 8px; z-index: 2147483000;
  width: 32px; height: 32px; padding: 0; border: 0; border-radius: 9px;
  background: ${CAT_FACE} center / cover no-repeat, #0a0a0d;
  box-shadow: 0 0 0 2px #3b2a63;
  cursor: pointer;
  opacity: .6;
  transition: opacity .2s, box-shadow .2s, transform .25s;
}
#nkt-toggle:hover, #nkt-toggle:focus-visible { opacity: 1; outline: none; box-shadow: 0 0 0 2px #a07cf0; transform: translateY(-2px) rotate(-8deg); }
html:not(.${ON}) #nkt-toggle { filter: grayscale(1); opacity: .35; }
#nkt-toast {
  position: fixed; left: 46px; bottom: 12px; z-index: 2147483000;
  padding: 5px 12px;
  background: #121216; color: #ecebf2;
  font: 600 12px/1.4 'Nunito', 'Segoe UI', Arial, sans-serif;
  border-radius: 999px; box-shadow: 0 0 0 2px #3b2a63, 0 4px 12px rgb(0 0 0 / .6);
  opacity: 0; pointer-events: none; transition: opacity .25s;
}
#nkt-toast.show { opacity: 1; }
#nkt-panel {
  position: fixed; left: 8px; bottom: 48px; z-index: 2147483001;
  display: none; flex-direction: column; gap: 10px; width: 236px;
  padding: 14px 16px;
  background: #121216; color: #ecebf2;
  font: 600 13px/1.4 'Nunito', 'Segoe UI', Arial, sans-serif;
  border-radius: 14px;
  box-shadow: 0 0 0 2px #3b2a63, 0 10px 28px rgb(0 0 0 / .65);
}
#nkt-panel.show { display: flex; }
#nkt-panel .nkt-p-title { font-weight: 800; font-size: 14px; display: flex; align-items: center; gap: 8px; }
#nkt-panel .nkt-p-title::before { content: ""; width: 18px; height: 18px; background: ${CAT_FACE} center / contain no-repeat; }
#nkt-panel label { display: flex; align-items: center; gap: 8px; cursor: pointer; }
#nkt-panel input[type=checkbox], #nkt-panel input[type=radio] { accent-color: #7b4fd6; width: 15px; height: 15px; margin: 0; cursor: pointer; }
#nkt-panel .nkt-p-group { display: flex; flex-direction: column; gap: 6px; padding-top: 8px; border-top: 2px solid #1a1a20; }
#nkt-panel .nkt-p-sub { color: #8d8a9c; font-size: 12px; }
#nkt-panel .nkt-p-row { display: flex; gap: 14px; }
#nkt-panel .nkt-p-sw { width: 12px; height: 12px; border-radius: 50%; display: inline-block; }
#nkt-panel .nkt-p-note { color: #8d8a9c; font-size: 11px; }
#nkt-panel button {
  align-self: flex-end; height: 26px; padding: 0 14px; cursor: pointer;
  background: #1a1a20; color: #ecebf2; border: 0; border-radius: 999px;
  box-shadow: 0 0 0 2px #3b2a63; font: 700 12px 'Nunito', 'Segoe UI', Arial, sans-serif;
}
#nkt-panel button:hover, #nkt-panel button:focus-visible { box-shadow: 0 0 0 2px #a07cf0; outline: none; }
`;

  /* ─────────────────────────────────────────────────────────────────────────
   * PRZEMALOWANIE GRAFIK GRY W LOCIE (sprawdzone rozwiązanie z Tamahagane / Dark Gothic)
   * Gra rysuje większość UI z plików /img/gui/*. Skrypt pobiera taki plik, przemalowuje drewno, brąz, pergamin
   * i szarości na chłodny grafit (#0a0a0d–#1a1a20 z ledwie wyczuwalnym fioletem), zostawia kolory znaczeniowe
   * (złoto, zieleń, błękit, czerwone znaczniki, jasne ikony) i podmienia adres w regułach CSS gry na wersję
   * przemalowaną (blob:). Wyłączenie motywu przywraca oryginalne wartości.
   * ───────────────────────────────────────────────────────────────────────── */
  const GUI_URL = /url\(\s*["']?([^"')]*\/img\/gui\/[^"')]+\.(?:png|gif))(\?[^"')]*)?["']?\s*\)/gi;
  const KEEP = /\/img\/gui\/(?:cursor|item_frames|skills|map-icons|emo|buffs-in-fight|item-slot-anim|line-highlight|X-blackoutline|ok-blackoutline|triangle|search|zoom|battle-|outfit|krew|hpStateSprite|loader)/i;
  const IMG_PROPS = ['background-image', 'border-image-source', 'list-style-image'];
  const blobCache = new Map();
  const touched = new Map();

  async function recolorPixels(ctx, w, h) {
    const id = ctx.getImageData(0, 0, w, h), a = id.data;
    const CHUNK = 4 * 120000;                         // ~120 tys. pikseli na kawałek, potem przerwa dla gry
    for (let i = 0; i < a.length; i += 4) {
      if (i && i % CHUNK === 0) await new Promise((ok) => setTimeout(ok, 0));
      if (a[i + 3] === 0) continue;
      const r = a[i] / 255, g = a[i + 1] / 255, b = a[i + 2] / 255;
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
      let s = 0, hue = 0;
      if (d > 0) {
        s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
        if (mx === r) hue = (g - b) / d + (g < b ? 6 : 0); else if (mx === g) hue = (b - r) / d + 2; else hue = (r - g) / d + 4;
        hue *= 60;
      }
      const vivid = s > 0.62 && l > 0.3 && l < 0.72;
      const green = hue > 70 && hue < 170 && s > 0.3;
      const blue = hue > 190 && hue < 260 && s > 0.3;
      const redMark = (hue < 8 || hue > 340) && s > 0.55 && l > 0.25;
      if (vivid || green || blue || redMark) continue;
      const warm = hue >= 8 && hue <= 58;
      if (s < 0.22 && l > 0.6) {                      // jasne ikony i glify – zostają czytelne, lekko chłodne
        a[i] *= 0.93; a[i + 1] *= 0.92; a[i + 2] *= 0.97;
      } else if (warm || s < 0.22) {                  // drewno, brąz, pergamin, szarości → grafit
        const L = 0.03 + Math.pow(l, 1.5) * 0.24;
        a[i] = L * 0.97 * 255; a[i + 1] = L * 0.95 * 255; a[i + 2] = Math.min(255, L * 1.16 * 255);
      }
    }
    ctx.putImageData(id, 0, 0);
  }

  // Przebarwione arkusze gry: pamięć podręczna (Cache API, klucz = wersja + ścieżka), a gdy jej brak –
  // liczenie po jednym arkuszu naraz, z przerwami (kolejka), żeby gra nie zamierała przy wczytywaniu.
  let cachePromise = null;
  const cacheOpen = () => {
    if (!cachePromise) cachePromise = (window.caches ? caches.open('nkt-gfx').catch(() => null) : Promise.resolve(null));
    return cachePromise;
  };
  let recolorQueue = Promise.resolve();
  function recolored(path) {
    if (!blobCache.has(path)) {
      blobCache.set(path, (async () => {
        const id = `https://nkt.cache/v${VERSION}/rc/${encodeURIComponent(path)}`;
        const cache = await cacheOpen();
        if (cache) {
          const hit = await cache.match(id).catch(() => null);
          if (hit) return URL.createObjectURL(await hit.blob());
        }
        const job = async () => {
          const r = await fetch(path, { credentials: 'same-origin' });
          if (!r.ok) return null;
          const bm = await createImageBitmap(await r.blob());
          const c = document.createElement('canvas');
          c.width = bm.width; c.height = bm.height;
          const x = c.getContext('2d', { willReadFrequently: true });
          x.drawImage(bm, 0, 0);
          await recolorPixels(x, bm.width, bm.height);
          return new Promise((ok) => c.toBlob(ok, 'image/png'));
        };
        const run = recolorQueue.then(() => new Promise((ok) => setTimeout(ok, 16))).then(job);
        recolorQueue = run.catch(() => null);
        const blob = await run;
        if (!blob) return null;
        if (cache) cache.put(id, new Response(blob, { headers: { 'content-type': 'image/png' } })).catch(() => {});
        return URL.createObjectURL(blob);
      })().catch(() => null));
    }
    return blobCache.get(path);
  }
  // stare wersje przemalowanych arkuszy (inna wersja motywu) – usuwane w tle
  const pruneCache = async () => {
    const cache = await cacheOpen();
    if (!cache) return;
    const keys = await cache.keys().catch(() => []);
    for (const k of keys) if (k.url.indexOf(`/v${VERSION}/`) === -1) cache.delete(k).catch(() => {});
  };

  function remember(rule, prop) {
    let m = touched.get(rule);
    if (!m) { m = {}; touched.set(rule, m); }
    if (!(prop in m)) m[prop] = [rule.style.getPropertyValue(prop), rule.style.getPropertyPriority(prop)];
  }
  function parseRgb(v) { const m = /rgba?\(\s*(\d+)[ ,]+(\d+)[ ,]+(\d+)(?:[ ,/]+([\d.]+))?/.exec(v || ''); return m ? [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]] : null; }
  function lum(v) { const c = parseRgb(v); if (!c || c[3] < 0.5) return -1; return (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255; }
  function neutral(v) { const c = parseRgb(v); if (!c || c[3] < 0.5) return false; return Math.max(c[0], c[1], c[2]) - Math.min(c[0], c[1], c[2]) < 24; }
  function graphite(v, highlight) {
    const c = parseRgb(v); const L = (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255;
    const k = Math.round((highlight ? 0.1 + L * 0.2 : 0.045 + L * 0.13) * 255);
    return `rgba(${k}, ${k}, ${Math.min(255, k + 6)}, ${c[3]})`;
  }

  // Podmiany grafik w regułach zbierane i wykonywane razem (jedno przeliczenie stylów zamiast setek).
  const pendingSets = [];
  let flushTimer = 0, flushFirst = 0;
  function flushSets() {
    flushFirst = 0;
    const list = pendingSets.splice(0);
    if (!root.classList.contains(ON)) return;
    for (const [rule, prop, v] of list) { remember(rule, prop); rule.style.setProperty(prop, v, rule.style.getPropertyPriority(prop)); }
  }
  function queueSet(rule, prop, v) {
    pendingSets.push([rule, prop, v]);
    const now = performance.now();
    if (!flushFirst) flushFirst = now;
    clearTimeout(flushTimer);
    flushTimer = setTimeout(flushSets, now - flushFirst > 1000 ? 0 : 150);
  }

  async function processRule(rule) {
    const st = rule.style;
    const hl = /:hover|\.active|\.selected|highlight|\.is-active|\.pressed/.test(rule.selectorText);
    for (const prop of IMG_PROPS) {
      const v = st.getPropertyValue(prop);
      if (!v || v.indexOf('/img/gui/') === -1 || v.indexOf('blob:') !== -1) continue;
      const jobs = [];
      v.replace(GUI_URL, (all, url) => { const path = url.replace(/^https?:\/\/[^/]+/, ''); if (!KEEP.test(path)) jobs.push([all, recolored(path)]); return all; });
      if (!jobs.length) continue;
      let nv = v;
      for (const [token, p] of jobs) { const u = await p; if (u) nv = nv.split(token).join(`url("${u}")`); }
      if (nv !== v && root.classList.contains(ON)) queueSet(rule, prop, nv);
    }
    const bg = st.getPropertyValue('background-color');
    if (lum(bg) > 0.72) {
      remember(rule, 'background-color'); st.setProperty('background-color', 'rgba(18, 18, 22, .95)', st.getPropertyPriority('background-color'));
      const col = st.getPropertyValue('color');
      if (lum(col) >= 0 && lum(col) < 0.45) { remember(rule, 'color'); st.setProperty('color', '#ecebf2', st.getPropertyPriority('color')); }
    } else if (neutral(bg) && lum(bg) > 0.2) {
      remember(rule, 'background-color'); st.setProperty('background-color', graphite(bg, hl), st.getPropertyPriority('background-color'));
    }
    const bi = st.getPropertyValue('background-image');
    if (bi && bi.indexOf('gradient') !== -1 && bi.indexOf('blob:') === -1) {
      const nb = bi.replace(/rgba?\([^)]*\)/g, (c) => (neutral(c) && lum(c) > 0.2 ? graphite(c, hl) : c));
      if (nb !== bi) { remember(rule, 'background-image'); st.setProperty('background-image', nb, st.getPropertyPriority('background-image')); }
    }
  }

  const seen = new WeakSet();
  function walk(rules, out) {
    for (const r of rules) {
      if (r.cssRules && !r.selectorText) { walk(r.cssRules, out); continue; }
      if (!r.style || !r.selectorText || seen.has(r) || r.selectorText.indexOf('nkt-') !== -1) continue;
      seen.add(r); out.push(r);
    }
  }
  function scanSheets() {
    if (!root.classList.contains(ON) || !root.classList.contains(NI)) return;
    const rules = [];
    for (const sh of document.styleSheets) {
      if (sh.ownerNode && sh.ownerNode.id === 'nkt-theme') continue;
      let rr; try { rr = sh.cssRules; } catch (e) { continue; }
      if (rr) walk(rr, rules);
    }
    rules.forEach((r) => { processRule(r); });
  }
  function restoreSheets() {
    for (const [rule, props] of touched) for (const p in props) rule.style.setProperty(p, props[p][0], props[p][1]);
    touched.clear();
  }
  function reapplySheets() {
    for (const sh of document.styleSheets) {
      let rr; try { rr = sh.cssRules; } catch (e) { continue; }
      if (!rr) continue;
      (function w(list) { for (const r of list) { if (r.cssRules && !r.selectorText) w(r.cssRules); else if (r.style) seen.delete(r); } })(rr);
    }
    scanSheets();
  }

  /* ─────────────────────────────────────────────────────────────────────────
   * CZYTELNOŚĆ TEKSTU W OKNACH: ciemny tekst z dawnego pergaminu → jasny odpowiednik
   * (neutralny → #ecebf2, kolorowy → ten sam odcień, rozjaśniony). Klasa .nkt-lt + zmienna --nkt-c.
   * ───────────────────────────────────────────────────────────────────────── */
  const TEXT_SCOPE = '.border-window, .tip-wrapper, .dialogue-window, .battle-controller';
  const marked = new Set();
  function lighter([r, g, b]) {
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    if (mx - mn < 28) return '#ecebf2';
    const k = 190 / Math.max(mx, 1);
    return `rgb(${Math.min(255, Math.round(r * k + 30))}, ${Math.min(255, Math.round(g * k + 30))}, ${Math.min(255, Math.round(b * k + 30))})`;
  }
  function fixText(scope) {
    if (!root.classList.contains(ON)) return;
    for (const el of scope.querySelectorAll('*')) {
      if (el.classList.contains('nkt-lt') || el.closest('.item, canvas')) continue;
      let hasText = false;
      for (const n of el.childNodes) if (n.nodeType === 3 && n.nodeValue.trim()) { hasText = true; break; }
      if (!hasText) continue;
      const c = parseRgb(getComputedStyle(el).color);
      if (!c || c[3] < 0.3) continue;
      if ((0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255 >= 0.36) continue;
      el.style.setProperty('--nkt-c', lighter(c));
      el.classList.add('nkt-lt');
      marked.add(el);
    }
  }
  function unfixText() {
    for (const el of marked) { el.classList.remove('nkt-lt'); el.style.removeProperty('--nkt-c'); }
    marked.clear();
  }
  const pending = new Set();
  let fixTimer = 0;
  function queueFix(node) {
    const w = node.nodeType === 1 ? node.closest(TEXT_SCOPE) : node.parentElement && node.parentElement.closest(TEXT_SCOPE);
    if (!w) return;
    pending.add(w);
    if (!fixTimer) fixTimer = setTimeout(() => { fixTimer = 0; const list = [...pending]; pending.clear(); list.forEach(fixText); }, 120);
  }

  /* ─────────────────────────────────────────────────────────────────────────
   * STAN, PRZEŁĄCZNIK, WYKRYWANIE NI
   * ───────────────────────────────────────────────────────────────────────── */
  const addStyle = (text) => {
    if (typeof GM_addStyle === 'function') return GM_addStyle(text);
    const s = document.createElement('style');
    s.textContent = text;
    (document.head || root).appendChild(s);
    return s;
  };
  const baseCss = [cssVars, cssBase, cssWindows, cssCats, cssHp, cssLoader, cssHud, cssAnim, cssToggle].join('\n');
  const style = addStyle(baseCss);
  if (style && 'id' in style) style.id = 'nkt-theme';

  // Nunito z Google Fonts (podzbiór latin-ext ma ą, ć, ę, ł, ń, ó, ś, ź, ż). Gra nie ma CSP, więc zwykły <link>.
  const addFont = () => {
    if (document.getElementById('nkt-font')) return;
    const l = document.createElement('link');
    l.id = 'nkt-font';
    l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800&display=swap';
    (document.head || root).appendChild(l);
  };

  const enabled = () => get(KEY_ON, true);
  const animOn = () => get(KEY_ANIM, true);
  const hpColor = () => (get(KEY_HP, 'violet') === 'red' ? 'red' : 'violet');
  const apply = () => {
    root.classList.toggle(ON, enabled());
    root.classList.toggle(ANIM, enabled() && animOn());
    root.classList.toggle(HPRED, hpColor() === 'red');
  };

  let toastTimer = 0;
  const toast = (msg) => {
    const t = document.getElementById('nkt-toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 1600);
  };
  const syncGraphics = () => {
    if (!root.classList.contains(NI)) return;
    if (enabled()) { reapplySheets(); document.querySelectorAll(TEXT_SCOPE).forEach(fixText); } else { restoreSheets(); unfixText(); }
  };
  const syncPanel = () => { const p = document.getElementById('nkt-panel'); if (p && p.nktSync) p.nktSync(); };
  const toggle = () => {
    set(KEY_ON, !enabled());
    apply();
    syncGraphics();
    syncPanel();
    if (typeof placeDecor === 'function') placeDecor();
    toast(enabled() ? 'Nocny Kot: włączony' : 'Nocny Kot: wyłączony');
  };
  const toggleAnim = () => {
    set(KEY_ANIM, !animOn());
    apply();
    syncPanel();
    toast(animOn() ? 'Kocie animacje: włączone' : 'Kocie animacje: wyłączone');
  };
  const setHpColor = (c) => {
    set(KEY_HP, c === 'red' ? 'red' : 'violet');
    apply();
    syncPanel();
    toast(hpColor() === 'red' ? 'Łapka HP: czerwona' : 'Łapka HP: fioletowa');
  };

  // Panel opcji: motyw, kocie animacje, kolor wypełnienia łapki HP. Wszystko zapisywane w GM_setValue.
  const openPanel = () => {
    let p = document.getElementById('nkt-panel');
    if (!p) {
      p = document.createElement('div');
      p.id = 'nkt-panel';
      p.setAttribute('role', 'dialog');
      p.setAttribute('aria-label', 'Ustawienia motywu Nocny Kot');
      p.innerHTML = '<div class="nkt-p-title">Nocny Kot</div>'
        + '<label><input type="checkbox" data-o="on"> Motyw włączony <span class="nkt-p-sub">Ctrl+Alt+N</span></label>'
        + '<label><input type="checkbox" data-o="anim"> Kocie animacje <span class="nkt-p-sub">Ctrl+Alt+M</span></label>'
        + '<div class="nkt-p-group"><span class="nkt-p-sub">Wypełnienie łapki HP</span><div class="nkt-p-row">'
        + '<label><input type="radio" name="nkt-hp" value="violet"> <span class="nkt-p-sw" style="background:#7b4fd6"></span> fiolet</label>'
        + '<label><input type="radio" name="nkt-hp" value="red"> <span class="nkt-p-sw" style="background:#d94a5c"></span> czerwień</label>'
        + '</div></div>'
        + '<div class="nkt-p-note">Animacje zawsze wyłączone, gdy system prosi o ograniczenie ruchu.</div>'
        + '<button type="button" data-a="close">Zamknij</button>';
      p.nktSync = () => {
        p.querySelector('[data-o="on"]').checked = enabled();
        p.querySelector('[data-o="anim"]').checked = animOn();
        p.querySelectorAll('input[name="nkt-hp"]').forEach((r) => { r.checked = r.value === hpColor(); });
      };
      p.addEventListener('change', (e) => {
        const t = e.target;
        if (t.dataset.o === 'on' && t.checked !== enabled()) toggle();
        else if (t.dataset.o === 'anim' && t.checked !== animOn()) toggleAnim();
        else if (t.name === 'nkt-hp') setHpColor(t.value);
      });
      p.addEventListener('click', (e) => { if (e.target.closest('[data-a="close"]')) p.classList.remove('show'); });
      p.addEventListener('keydown', (e) => { if (e.key === 'Escape') p.classList.remove('show'); });
      // klawisze w panelu nie trafiają do gry (gra łapie strzałki i litery na document)
      ['keydown', 'keyup', 'keypress'].forEach((ev) => p.addEventListener(ev, (e) => e.stopPropagation()));
      document.body.appendChild(p);
    }
    p.nktSync();
    p.classList.toggle('show');
    if (p.classList.contains('show')) p.querySelector('input').focus();
  };

  const addToggleButton = () => {
    if (document.getElementById('nkt-toggle') || !document.body) return;
    const b = document.createElement('button');
    b.id = 'nkt-toggle';
    b.type = 'button';
    b.title = 'Nocny Kot – klik: włącz/wyłącz motyw (Ctrl+Alt+N)\nPrawy klik: ustawienia (animacje, kolor łapki HP)';
    b.setAttribute('aria-label', 'Przełącz motyw Nocny Kot');
    b.addEventListener('click', (e) => { e.stopPropagation(); if (e.shiftKey) openPanel(); else toggle(); });
    b.addEventListener('contextmenu', (e) => { e.preventDefault(); e.stopPropagation(); openPanel(); });
    const t = document.createElement('div');
    t.id = 'nkt-toast';
    t.setAttribute('role', 'status');
    document.body.append(b, t);
  };

  /* ─────────────────────────────────────────────────────────────────────────
   * KOCIE DETALE – tworzenie i ustawianie (debounce; tylko odczyt położenia elementów gry, bez zmian w nich)
   * Każdy detal siedzi w kontenerze, który przesuwa się razem z elementem gry (okno czatu, okno minimapy,
   * warstwa interfejsu), więc przeciąganie okien nie wymaga ciągłego przeliczania.
   * ───────────────────────────────────────────────────────────────────────── */
  const mkDeco = (cls, html) => {
    const d = document.createElement('div');
    d.className = `nkt-deco ${cls}`;
    d.setAttribute('aria-hidden', 'true');
    d.innerHTML = html;
    return d;
  };
  const deco = {};
  const relRect = (el, host) => {
    const a = el.getBoundingClientRect(), b = host.getBoundingClientRect();
    return { left: a.left - b.left + host.scrollLeft, top: a.top - b.top + host.scrollTop, width: a.width, height: a.height };
  };
  const setPos = (d, left, top) => {
    const l = `${Math.round(left)}px`, t = `${Math.round(top)}px`;
    if (d.style.left !== l) d.style.left = l;
    if (d.style.top !== t) d.style.top = t;
  };
  const placeDecor = () => {
    if (!enabled() || !root.classList.contains(NI)) return;
    // kot na czacie: leży na górnej krawędzi paska z polem wpisywania, przy prawym brzegu
    // TODO: zweryfikuj selektor (.new-chat-window .chat-input-wrapper)
    const chat = document.querySelector('.new-chat-window'), bar = chat && chat.querySelector('.chat-input-wrapper');
    if (chat && bar && bar.offsetWidth) {
      if (!deco.chat || deco.chat.parentElement !== chat) {
        deco.chat = mkDeco('nkt-chatcat', `<img class="nkt-cat-img" alt="" src="${IMG.chatCat}">`);
        if (getComputedStyle(chat).position === 'static') chat.style.position = 'relative';
        chat.appendChild(deco.chat);
      }
      const r = relRect(bar, chat);
      setPos(deco.chat, r.left + r.width - 92 - 10, r.top - 47 * 0.53);   // 92×47, krawędź na 53% wysokości grafiki
    }
    // ogon: zwisa z górnej części listwy między lewą kolumną (czat) a mapą
    // TODO: zweryfikuj selektor (.interface-layer > .left-column.main-column > .border)
    const layer = document.querySelector('.interface-layer');
    const strip = document.querySelector('.interface-layer > .left-column.main-column > .border');
    if (layer && strip && strip.offsetHeight) {
      if (!deco.tail || deco.tail.parentElement !== layer) {
        deco.tail = mkDeco('nkt-tail', `<img class="nkt-cat-img" alt="" src="${IMG.tail}">`);
        layer.appendChild(deco.tail);
      }
      const r = relRect(strip, layer);
      setPos(deco.tail, r.left + r.width / 2 - 18, r.top - 4);   // zaczepiony tuż pod górną belką
    }
    // kot nad dolnym paskiem: zagląda znad jego górnej krawędzi zaraz na prawo od kuli HP – na stałe względem
    // środka dolnego panelu (panel gry jest wyśrodkowany), więc przy zmianie szerokości okna nie jeździ
    // (sprawdzone w grze: pasek .bottom.positioner > .bg, panel .bottom-panel-of-bottom-positioner)
    const barBg = document.querySelector('.interface-layer .bottom.positioner > .bg');
    const panel = document.querySelector('.bottom-panel-of-bottom-positioner');
    if (layer && barBg && panel && barBg.offsetWidth) {
      if (!deco.bar || deco.bar.parentElement !== layer) {
        deco.bar = mkDeco('nkt-barcat', `<img class="nkt-cat-img" alt="" src="${IMG.miniCat}">`);
        layer.appendChild(deco.bar);
      }
      const b = relRect(barBg, layer), p = relRect(panel, layer);
      setPos(deco.bar, p.left + p.width / 2 + 140, b.top - 61);   // 96×71, krawędź (dół głowy y 102 z 118 → 61 px) na górze paska
    }
    // łapka HP: niskie HP (< 25%) z wysokości krwi ustawianej przez grę → klasa nkt-hp-low (pulsowanie)
    const ind = document.querySelector('.hp-indicator-wrapper-template .hp-indicator');
    const blood = ind && ind.querySelector('.blood');
    if (ind && blood && ind.offsetHeight) {
      const low = blood.offsetHeight / ind.offsetHeight < 0.25;
      if (root.classList.contains('nkt-hp-low') !== low) root.classList.toggle('nkt-hp-low', low);
    }
  };
  let decoTimer = 0;
  const queueDecor = () => { clearTimeout(decoTimer); decoTimer = setTimeout(placeDecor, 250); };
  // obserwator nowych elementów i arkuszy (debounce) – startuje dopiero po wykryciu NI
  let sheetTimer = 0;
  const gfxObs = new MutationObserver((muts) => {
    if (!enabled()) return;
    let sheets = false;
    for (const m of muts) for (const n of m.addedNodes) {
      if (n.nodeName === 'STYLE' || n.nodeName === 'LINK') sheets = true;
      else if (!(n.nodeType === 1 && n.classList.contains('nkt-deco'))) queueFix(n);
    }
    queueDecor();
    if (sheets) { clearTimeout(sheetTimer); sheetTimer = setTimeout(scanSheets, 80); }
  });

  // Wykrywanie NI po DOM (.game-window-positioner / .interface-layer). Bez tego klasa nkt-ni nie powstaje
  // i żadna reguła motywu nie działa (strona logowania, forum, SI).
  const DETECT_NI = '.game-window-positioner, .interface-layer';
  let started = false;
  const onGameFound = () => {
    if (started) return;
    started = true;
    root.classList.add(NI);
    addFont();
    addToggleButton();
    scanSheets();
    document.querySelectorAll(TEXT_SCOPE).forEach(fixText);
    gfxObs.observe(root, { childList: true, subtree: true });
    placeDecor();
    window.addEventListener('resize', queueDecor);
    setInterval(placeDecor, 1500);   // zmiana układu bez nowych węzłów (rozmiar kolumn) i poziom HP (pulsowanie łapki)
    let ticks = 0;
    const iv = setInterval(() => { scanSheets(); if (++ticks >= 40) clearInterval(iv); }, 3000);
    setTimeout(pruneCache, 20000);
  };
  let debounce = 0;
  const check = () => { if (document.body && document.querySelector(DETECT_NI)) { onGameFound(); detectObs.disconnect(); } };
  const detectObs = new MutationObserver(() => { clearTimeout(debounce); debounce = setTimeout(check, 150); });
  detectObs.observe(root, { childList: true, subtree: true });
  setTimeout(() => detectObs.disconnect(), 60000);
  check();

  apply();
  if (typeof GM_registerMenuCommand === 'function') {
    GM_registerMenuCommand('Nocny Kot: włącz / wyłącz (Ctrl+Alt+N)', toggle);
    GM_registerMenuCommand('Nocny Kot: kocie animacje (Ctrl+Alt+M)', toggleAnim);
    GM_registerMenuCommand('Nocny Kot: ustawienia', () => openPanel());
  }
  window.addEventListener('keydown', (e) => {
    if (!e.ctrlKey || !e.altKey || e.shiftKey || e.metaKey) return;
    if (e.code === 'KeyN') { e.preventDefault(); toggle(); }
    else if (e.code === 'KeyM') { e.preventDefault(); toggleAnim(); }
  }, true);

  console.info(`[Nocny Kot] v${VERSION} ${enabled() ? 'włączony' : 'wyłączony'}`);
})();
