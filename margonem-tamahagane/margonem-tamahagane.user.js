// ==UserScript==
// @name         Margonem – Tamahagane
// @namespace    https://github.com/Harkryn/Dodatki
// @version      2.3.0
// @description  Motyw nowego interfejsu (NI) z hartowanej stali tamahagane: żelazo z żarzącymi się pęknięciami, czarny lakier, tsuba i płynny żar. Tylko wygląd – bez zmian w logice gry.
// @author       Harkryn
// @match        https://*.margonem.pl/*
// @match        https://*.margonem.com/*
// @run-at       document-start
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @grant        GM_getResourceURL
// @resource     tmgLiquid https://raw.githubusercontent.com/Harkryn/Dodatki/main/assets/tamahagane/ciecz-orba.webp
// @resource     tmgBar    https://raw.githubusercontent.com/Harkryn/Dodatki/main/assets/tamahagane/pasek-tlo.webp
// @resource     tmgSlot   https://raw.githubusercontent.com/Harkryn/Dodatki/main/assets/tamahagane/ramka-slotu.webp
// @resource     tmgRing   https://raw.githubusercontent.com/Harkryn/Dodatki/main/assets/tamahagane/rama-orba.webp
// @resource     tmgSeparator https://raw.githubusercontent.com/Harkryn/Dodatki/main/assets/tamahagane/separator.webp
// @resource     tmgGold      https://raw.githubusercontent.com/Harkryn/Dodatki/main/assets/tamahagane/ikona-zlota.webp
// @resource     tmgTears     https://raw.githubusercontent.com/Harkryn/Dodatki/main/assets/tamahagane/ikona-smoczych-lez.webp
// @resource     tmgPlate     https://raw.githubusercontent.com/Harkryn/Dodatki/main/assets/tamahagane/rama-tabliczki.webp
// @resource     tmgWinFrame  https://raw.githubusercontent.com/Harkryn/Dodatki/main/assets/tamahagane/okno-rama.webp
// @resource     tmgWinTitle  https://raw.githubusercontent.com/Harkryn/Dodatki/main/assets/tamahagane/okno-tytul.webp
// @resource     tmgButton    https://raw.githubusercontent.com/Harkryn/Dodatki/main/assets/tamahagane/przycisk.webp
// @resource     tmgColumn    https://raw.githubusercontent.com/Harkryn/Dodatki/main/assets/tamahagane/kolumna-tlo.webp
// @resource     tmgFrameThin https://raw.githubusercontent.com/Harkryn/Dodatki/main/assets/tamahagane/ramka-cienka.webp
// @resource     tmgToggle    https://raw.githubusercontent.com/Harkryn/Dodatki/main/assets/tamahagane/przelacznik.webp
// @resource     tmgMedal     https://raw.githubusercontent.com/Harkryn/Dodatki/main/assets/tamahagane/medalion-pvp.webp
// @updateURL    https://raw.githubusercontent.com/Harkryn/Dodatki/main/margonem-tamahagane/margonem-tamahagane.user.js
// @downloadURL  https://raw.githubusercontent.com/Harkryn/Dodatki/main/margonem-tamahagane/margonem-tamahagane.user.js
// ==/UserScript==

/*
 * Budowa (jak w Dark Gothic): wszystkie reguły są pod html.tmg-on.tmg-ni, więc wyłączenie motywu
 * to zdjęcie jednej klasy. Klasa tmg-ni pojawia się dopiero po wykryciu nowego interfejsu –
 * w starym interfejsie (SI) skrypt kończy się od razu i niczego nie dodaje.
 * Sekcje: ZMIENNE · BAZOWE · OKNA · CZAT · EKWIPUNEK · TOOLTIPY · WALKA · PASKI · ANIMACJE · PRZEŁĄCZNIK
 */

(() => {
  'use strict';

  if (window.top !== window.self) return;

  // Stary interfejs (SI): gra zapisuje wybór w ciasteczku `interface` – w SI nic nie robimy.
  try { if (/(?:^|;\s*)interface=si\b/i.test(document.cookie || '')) return; } catch (e) { /* brak ciasteczek */ }

  const VERSION = '2.3.0';
  const ON = 'tmg-on';          // motyw włączony
  const FX = 'tmg-fx';          // efekty (popiół, mgła) włączone
  const KEY_ON = 'tmg-enabled';
  const KEY_FX = 'tmg-effects';
  const root = document.documentElement;

  const get = (k, d) => { try { return typeof GM_getValue === 'function' ? GM_getValue(k, d) : d; } catch (e) { return d; } };
  const set = (k, v) => { try { if (typeof GM_setValue === 'function') GM_setValue(k, v); } catch (e) { /* brak GM */ } };

  // N – reguły nowego interfejsu; W – zwykłe okno NI (bez przezroczystych i dymków)
  const N = `html.${ON}.tmg-ni`;
  const W = `${N} .border-window:not(.transparent):not(.tip-window)`;

  // Grafiki: @resource (Tampermonkey trzyma je lokalnie), bez GM_getResourceURL – raw link do repo.
  const RAW = 'https://raw.githubusercontent.com/Harkryn/Dodatki/main/assets/tamahagane/';
  const res = (name, file) => {
    try { if (typeof GM_getResourceURL === 'function') { const u = GM_getResourceURL(name); if (u) return u; } } catch (e) { /* brak zasobu */ }
    return RAW + file;
  };
  const IMG = {
    liquid: res('tmgLiquid', 'ciecz-orba.webp'),  // 256×256, kafel bez szwów: płynny żar w czarnej wodzie (ciecz orba HP)
    bar: res('tmgBar', 'pasek-tlo.webp'),         // 107×120, kafel bez szwów: malowany czarny lakier belki
    slot: res('tmgSlot', 'ramka-slotu.webp'),     // 74×80, ramka slotu: poszarpane żelazo z żarem
    ring: res('tmgRing', 'rama-orba.webp'),       // 248×264, rama orba: pierścień z chmurami, pęknięcia z żarem, rogi
    separator: res('tmgSeparator', 'separator.webp'), // 50×120, czerwone pociągnięcie pędzla sumi-e
    gold: res('tmgGold', 'ikona-zlota.webp'),         // 64×51, stos monet koban
    tears: res('tmgTears', 'ikona-smoczych-lez.webp'), // 47×64, czerwony kryształ łzy z ogniem
    plate: res('tmgPlate', 'rama-tabliczki.webp'),     // 600×205, rama górnej tabliczki (gniazda z ogniem na końcach)
    winFrame: res('tmgWinFrame', 'okno-rama.webp'),    // 256×258, rama okien: kamienie z lawą, kolce w narożnikach (9-slice, wycinek 32)
    winTitle: res('tmgWinTitle', 'okno-tytul.webp'),   // 300×130, tytuł okna: żelazna płytka z lawą, zakrzywione kolce na końcach (końce 62 px)
    button: res('tmgButton', 'przycisk.webp'),         // 150×78, przycisk: czarny lakier w kutej oprawie z nitami (9-slice, wycinek 22)
    column: res('tmgColumn', 'kolumna-tlo.webp'),      // 384×384, tło kolumn: czarne drewno, czerwony dym u dołu
    frameThin: res('tmgFrameThin', 'ramka-cienka.webp'), // 128×131, cienka rama: kute żelazo z linią żaru (9-slice, wycinek 9 10 10 9)
    toggle: res('tmgToggle', 'przelacznik.webp'),      // 64×64, tsuba z żelaza z płomiennymi wycięciami (przełącznik motywu)
    medal: res('tmgMedal', 'medalion-pvp.webp')        // 48×61, medalion PvP: żelazny pierścień z lawą i haczykiem; otwór (23.5, 36) r 13.75
  };

  const svgUrl = (s) => `url("data:image/svg+xml,${encodeURIComponent(s)}")`;

  /* ─────────────────────────────────────────────────────────────────────────
   * GRAFIKI WEKTOROWE (rysowane w kodzie, ostre w każdej skali)
   * ───────────────────────────────────────────────────────────────────────── */

  // Pociągnięcie pędzla sumi-e (separator / podkreślenie): zwężające się końce, poszarpany brzeg
  const BRUSH = (color, op) => svgUrl(
    `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='8' viewBox='0 0 200 8' preserveAspectRatio='none'>` +
    `<path d='M2 4.6 C30 2.4 60 2.2 100 2.6 C140 3 170 2.8 198 4.2 C170 5.6 140 6 100 5.6 C70 5.4 40 6.4 2 4.6Z' fill='${color}' fill-opacity='${op}'/>` +
    `<path d='M24 4 C60 3.4 90 3.6 120 3.9' stroke='${color}' stroke-opacity='${op * .6}' stroke-width='.5' fill='none'/>` +
    `</svg>`);
  const BRUSH_RED = BRUSH('#7a1212', .95);
  const BRUSH_DIM = BRUSH('#5c0d0d', .7);

  // Lupa pól wyszukiwania
  const SEARCH_ICON = svgUrl(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'><circle cx='6.5' cy='6.5' r='4.6' fill='none' stroke='#8f8478' stroke-width='1.8'/>` +
    `<path d='M10 10l4.2 4.2' stroke='#9e1b1b' stroke-width='2.2' stroke-linecap='round'/></svg>`);

  /* =====================================================================
   * === ZMIENNE ===
   * Przewaga czerni (ciepłe warstwy paneli), ciemna czerwień tylko na akcentach,
   * jasna czerwień oszczędnie, mosiądz rzadko. Tekst w kolorze papieru washi.
   * Kontrast: #e6dccf na #0e0a0a ≈ 15:1, przygaszony #8f8478 ≈ 5,4:1 (WCAG AA).
   * ===================================================================== */
  const cssVars = `
:root {
  --tmg-k0: #070505;
  --tmg-k1: #0e0a0a;
  --tmg-k2: #161010;
  --tmg-k3: #1f1716;            /* podniesiona płytka, aktywna zakładka */
  --tmg-edge: #2a1f1d;          /* krawędź lakieru */
  --tmg-edge-hi: #3a2b28;
  --tmg-r1: #5c0d0d;
  --tmg-r2: #7a1212;
  --tmg-r3: #9e1b1b;
  --tmg-hi: #c42a2a;            /* tylko najważniejsze */
  --tmg-gold: #8a6a3a;          /* okucia, bardzo rzadko */
  --tmg-text: #e6dccf;          /* papier washi */
  --tmg-dim: #8f8478;
  --tmg-ember: 0 0 8px rgb(196 42 42 / .45), 0 0 2px rgb(196 42 42 / .6);   /* żarzący się węgiel */
  /* połysk lakieru urushi: miękkie światło z góry, głęboka czerń niżej */
  --tmg-urushi: linear-gradient(170deg, rgb(255 235 220 / .035) 0, rgb(255 235 220 / 0) 38%),
                linear-gradient(rgb(14 10 10 / .55), rgb(7 5 5 / .8)),
                url("${IMG.bar}") 0 0 / auto 90px repeat;
  --tmg-frame: url("${IMG.winFrame}");   /* kamienie z pęknięciami pełnymi lawy, kolce w narożnikach (9-slice, wycinek 32) */
  --tmg-frame-thin: url("${IMG.frameThin}");
  --tmg-brush: ${BRUSH_RED};
  --tmg-brush-dim: ${BRUSH_DIM};
}
`;

  /* =====================================================================
   * === BAZOWE (cała strona gry NI: zaznaczenie, scrollbary, pola, przełączniki) ===
   * ===================================================================== */
  const cssBase = `
${N} ::selection { background: var(--tmg-r2); color: #fff; }
${N} * { scrollbar-color: var(--tmg-edge-hi) var(--tmg-k0); }
${N} ::-webkit-scrollbar { width: 8px; height: 8px; }
${N} ::-webkit-scrollbar-track { background: var(--tmg-k0); }
${N} ::-webkit-scrollbar-thumb { background: linear-gradient(90deg, var(--tmg-edge), var(--tmg-edge-hi), var(--tmg-edge)); border: 1px solid #000; border-radius: 4px; }
${N} ::-webkit-scrollbar-thumb:hover { background: var(--tmg-r2); }
${N} ::-webkit-scrollbar-corner { background: var(--tmg-k0); }

/* suwaki gry (własne, nie natywne): rowek z czarnego lakieru, uchwyt jak płytka zbroi */
${N} .scrollbar-wrapper .track { background: var(--tmg-k0) !important; box-shadow: inset 0 0 0 1px var(--tmg-edge); }
${N} .scrollbar-wrapper .handle {
  background: linear-gradient(90deg, #0b0808, var(--tmg-edge-hi) 50%, #0b0808) !important;
  box-shadow: 0 0 0 1px #000, inset 0 1px 0 rgb(255 235 220 / .06) !important;
  border-radius: 2px;
}
${N} .scrollbar-wrapper .handle:hover { background: linear-gradient(90deg, #1a0606, var(--tmg-r2) 50%, #1a0606) !important; }

/* pola tekstowe: czarna wnęka, karetka i obrys przy fokusie w czerwieni */
${N} input[type="text"], ${N} input[type="number"], ${N} input[type="search"], ${N} input[type="password"],
${N} input:not([type]), ${N} textarea, ${N} select {
  background-color: var(--tmg-k0) !important;
  color: var(--tmg-text) !important;
  border-color: var(--tmg-edge-hi) !important;
  caret-color: var(--tmg-hi);
}
${N} input:focus, ${N} textarea:focus, ${N} select:focus, ${N} [contenteditable="true"]:focus {
  outline: none !important;
  border-color: var(--tmg-r3) !important;
  box-shadow: 0 0 0 1px var(--tmg-r2), 0 0 6px rgb(158 27 27 / .35) !important;
}
${N} input::placeholder, ${N} textarea::placeholder { color: var(--tmg-dim) !important; opacity: 1; }

/* pola wyszukiwania */
${N} .search-component {
  border-style: solid !important;
  border-color: transparent !important;
  border-image: var(--tmg-frame-thin) 9 10 10 9 / 4px / 0 round !important;
  background: ${SEARCH_ICON} 8px 50% / 12px 12px no-repeat, var(--tmg-k0) !important;
  background-clip: border-box !important;
  background-origin: border-box !important;
  box-shadow: inset 0 0 8px rgb(0 0 0 / .8);
}

/* przełączniki (c-checkbox) */
${N} .c-checkbox__label::before {
  background: var(--tmg-k0) !important;
  border-color: var(--tmg-edge-hi) !important;
  box-shadow: inset 0 1px 3px #000 !important;
  border-radius: 2px;
}
${N} .c-checkbox__label:hover::before { border-color: var(--tmg-r3) !important; }
${N} .c-checkbox input:checked + .c-checkbox__label::before {
  background: linear-gradient(var(--tmg-r3), var(--tmg-r1)) !important;
  border-color: var(--tmg-hi) !important;
  box-shadow: var(--tmg-ember) !important;
}

/* listy z grupami (ustawienia, rzemiosło): wybrana pozycja z czerwoną kreską */
${N} .one-item-on-divide-list.active {
  background: linear-gradient(90deg, rgb(122 18 18 / .3), transparent 80%) !important;
  box-shadow: inset 2px 0 0 var(--tmg-r3);
}
${N} .one-item-on-divide-list:not(.active):hover { background: linear-gradient(90deg, rgb(122 18 18 / .14), transparent 80%) !important; }

/* tabele (c-table) */
${N} .c-table th {
  background: linear-gradient(var(--tmg-k3), var(--tmg-k1)) !important;
  border-color: var(--tmg-edge) !important;
  box-shadow: inset 0 -1px 0 var(--tmg-r2);
  color: var(--tmg-text) !important;
  text-shadow: 0 1px 2px #000;
}
${N} .c-table td, ${N} .c-table tr, ${N} .c-table table { border-color: var(--tmg-edge) !important; }
${N} .c-table td { background-color: rgb(7 5 5 / .55); }

/* tekst rozjaśniony przez skaner czytelności (ciemny tekst z dawnego pergaminu) */
${N} .tmg-lt { color: var(--tmg-c) !important; }
`;

  /* =====================================================================
   * === OKNA (zwykłe, przezroczyste, dymki, komunikaty, wspólne panele, przyciski) ===
   * ===================================================================== */
  const cssWindows = `
/* --- okno zwykłe: skrzynia z czarnego lakieru w ramie z lamelkowych płytek i czerwonego sznura,
   mosiężne okucia w narożnikach. border-width zostaje 0 – układ okna gry bez zmian (outset 4 px). --- */
${W} {
  border-image: var(--tmg-frame) 32 / 12px / 6px round !important;
  border-radius: 0;
  background:
    var(--tmg-urushi) !important;
  background-clip: border-box !important;
  box-shadow: 0 0 0 4px rgb(0 0 0 / .55), 0 12px 30px rgb(0 0 0 / .85) !important;
  color: var(--tmg-text);
}
${W} > .content { background: transparent !important; color: var(--tmg-text); }

/* tytuł: malowana żelazna płytka z lawą i zakrzywionymi kolcami na końcach (okno-tytul.webp, 9-slice w poziomie);
   oryginalna czcionka gry */
${W} .header-label-positioner .header-label {
  background: none !important;
  border-style: solid !important;
  border-width: 0 !important;
  background: none !important;
  border-image: url("${IMG.winTitle}") 0 62 fill / 0 18px / 5px 18px stretch !important;
  box-shadow: none !important;
}
${W} .header-label-positioner .header-label .left-decor,
${W} .header-label-positioner .header-label .right-decor { background: none !important; }
${W} .header-label-positioner .header-label .text {
  color: var(--tmg-text) !important;
  letter-spacing: .05em;
  text-shadow: 0 1px 0 #000, 0 0 6px rgb(0 0 0 / .9) !important;
}

/* zamknięcie: mała tsuba z „×”, przy najechaniu żarzy się czerwienią */
${W} .close-button-corner-decor { background: none !important; }
${W} .close-button-corner-decor .close-button {
  background: radial-gradient(circle, var(--tmg-k2) 52%, var(--tmg-gold) 54% 60%, #000 62% 66%, transparent 68%) !important;
  border-radius: 50%;
  filter: saturate(.8) brightness(.85);
}
${W} .close-button-corner-decor .close-button::after {
  content: "×";
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  color: var(--tmg-dim); font: bold 14px/1 sans-serif;
  pointer-events: none;
}
${W} .close-button-corner-decor .close-button:hover {
  filter: none;
  background: radial-gradient(circle, var(--tmg-k2) 52%, var(--tmg-r3) 54% 60%, #000 62% 66%, transparent 68%) !important;
  box-shadow: var(--tmg-ember);
}
${W} .close-button-corner-decor .close-button:hover::after { color: var(--tmg-text); }

/* drobne ikony okien (przezroczystość, zwijanie, informacja): przygaszone, przy najechaniu ciepły żar */
${N} .border-window .increase-opacity,
${N} .border-window .collapse,
${N} .dialogue-window .increase-opacity,
${N} .info-icon { filter: grayscale(1) brightness(.85); }
${N} .border-window .increase-opacity:hover,
${N} .border-window .collapse:hover,
${N} .dialogue-window .increase-opacity:hover,
${N} .info-icon:hover { filter: grayscale(1) sepia(1) hue-rotate(-30deg) saturate(3) brightness(.95); }

/* zakładki w oknach: płytki lakieru, aktywna z czerwonym pociągnięciem pędzla pod spodem */
${N} .border-window .card,
${N} .interface-element-card-background,
${N} .interface-element-card-background-stretch {
  border-color: transparent !important;
  border-image: none !important;
  background: linear-gradient(var(--tmg-k2), var(--tmg-k0)) !important;
  box-shadow: inset 0 0 0 1px var(--tmg-edge), inset 0 1px 0 rgb(255 235 220 / .04) !important;
  color: var(--tmg-dim) !important;
}
${N} .border-window .card:hover { color: var(--tmg-text) !important; }
${N} .border-window .card.active,
${N} .interface-element-active-card-background,
${N} .interface-element-active-card-background-stretch,
${N} .interface-element-active-card-border-image {
  border-color: transparent !important;   /* bez tego ramka brała kolor tekstu */
  border-image: none !important;
  background: var(--tmg-brush) center bottom 1px / 86% 4px no-repeat, linear-gradient(var(--tmg-k3), var(--tmg-k1)) !important;
  box-shadow: inset 0 0 0 1px var(--tmg-edge-hi), inset 0 1px 0 rgb(255 235 220 / .06) !important;
  color: var(--tmg-text) !important;
}

/* --- okna przezroczyste (minimapa, obserwowane zadania, zegar…): półprzezroczysty lakier w cienkiej ramie --- */
${N} .border-window.transparent .border-image {
  background: rgb(7 5 5 / .78) !important;
  border-style: solid;
  border-width: 0;
  border-image: var(--tmg-frame-thin) 9 10 10 9 / 4px / 0 round !important;
  box-shadow: 0 0 0 1px #000, 0 6px 16px rgb(0 0 0 / .7) !important;
}
${N} .border-window.transparent .header-label .text {
  color: var(--tmg-text) !important;
  text-shadow: 0 1px 2px #000 !important;
  letter-spacing: .04em;
}

/* --- małe okna podpowiedzi (tip-window) --- */
${N} .border-window.tip-window {
  border-style: solid !important;
  border-image: var(--tmg-frame-thin) 9 10 10 9 / 4px / 0 round !important;
  background: rgb(14 10 10 / .96) !important;
  background-clip: border-box !important;
  box-shadow: 0 0 0 1px #000, 0 6px 16px rgb(0 0 0 / .7) !important;
}
${N} .border-window.tip-window .content { background: transparent !important; color: var(--tmg-text); }
${N} .border-window.tip-window .header-label-positioner .header-label { background: none !important; }
${N} .border-window.tip-window .header-label-positioner .header-label .left-decor,
${N} .border-window.tip-window .header-label-positioner .header-label .right-decor { background: none !important; }

/* --- okno komunikatu (mAlert): pergamin → lakier --- */
${N} .border-window.mAlert .paper-background,
${N} .border-window.mAlert-mobile-layer .paper-background {
  background: rgb(14 10 10 / .97) !important;
  box-shadow: inset 0 0 0 1px var(--tmg-edge), inset 0 0 18px rgb(0 0 0 / .7);
}

/* --- dymki nad postaciami (bubbledialog) – TODO: zweryfikuj selektor --- */
${N} .bubbledialog .bg-layer .top-frame,
${N} .bubbledialog .bg-layer .bottom-frame,
${N} .bubbledialog .bg-layer .left-frame,
${N} .bubbledialog .bg-layer .right-frame { background: none !important; }
${N} .bubbledialog .bg-layer {
  border-style: solid;
  border-width: 0;
  border-image: var(--tmg-frame-thin) 9 10 10 9 / 4px / 0 round !important;
  background: rgb(14 10 10 / .95) !important;
}

/* --- wspólne panele wnętrz okien (interface-element-*): lakier w cienkiej ramie --- */
${N} .interface-element-middle-1-background,
${N} .interface-element-middle-1-background-stretch,
${N} .interface-element-middle-2-background,
${N} .interface-element-middle-2-background-stretch,
${N} .interface-element-middle-3-background,
${N} .interface-element-middle-3-background-stretch,
${N} .interface-element-middle-4-background,
${N} .interface-element-wood-box-background {
  border-style: solid !important;
  border-color: transparent !important;
  border-image: var(--tmg-frame-thin) 9 10 10 9 / 4px / 0 round !important;
  background: rgb(14 10 10 / .94) !important;
  background-clip: border-box !important;
  box-shadow: inset 0 0 16px rgb(0 0 0 / .7);
  color: var(--tmg-text);
}
${N} .interface-element-background-color-1,
${N} .interface-element-background-color-2,
${N} .interface-element-background-color-3 { background: var(--tmg-k1) !important; color: var(--tmg-text); }
${N} .interface-element-green-box-background,
${N} .interface-element-green-box-background-stretch {
  background: linear-gradient(90deg, var(--tmg-k0), #1c0b0b 30%, #1c0b0b 70%, var(--tmg-k0)) !important;
  box-shadow: inset 0 0 0 1px var(--tmg-edge);
}
/* nagłówki sekcji i paski: czarny pas z pędzlowym podkreśleniem */
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
    var(--tmg-brush-dim) center bottom / 92% 3px no-repeat,
    linear-gradient(90deg, transparent, rgb(22 16 16 / .95) 18%, rgb(22 16 16 / .95) 82%, transparent) !important;
  box-shadow: none !important;
}
${N} .trade-window header .h_background .left,
${N} .trade-window header .h_background .right { background: none !important; }
${N} .interface-element-header-1 { color: var(--tmg-text); }
${N} .interface-element-line-1-background { background: var(--tmg-brush-dim) center / 100% 100% no-repeat !important; }
${N} .interface-element-one-black-tile { background: linear-gradient(var(--tmg-k1), var(--tmg-k0)) !important; }
${N} .interface-element-one-gray-tile { background: linear-gradient(var(--tmg-k2), var(--tmg-k1)) !important; }
${N} .interface-element-box-shadow-2 { box-shadow: inset 0 0 0 1px var(--tmg-edge), inset 0 0 14px #000 !important; }
${N} .interface-element-border-window-frame,
${N} .additional-skill-panel .graphics .additional-skill-panel-border {
  border-style: solid !important;
  border-image: var(--tmg-frame) 32 / 10px / 0 round !important;
}
${N} .interface-element-vertical-wood {
  border-style: solid !important;
  border-color: transparent !important;
  border-image: var(--tmg-frame-thin) 9 10 10 9 / 0 3px / 0 round !important;
  background: var(--tmg-k0) !important;
  background-clip: border-box !important;
}

/* --- przyciski tekstowe: czarny lakier w kutej żelaznej oprawie z nitami, u dołu żar (przycisk.webp, 9-slice).
   Najechanie – żar mocniej (jaśniej + czerwona poświata). Kolory gry z innym znaczeniem (złoto, smocze łzy,
   czerwony, niebieski) zostają jako przygaszona barwa. --- */
${N} .button.green:not(.background-gold):not(.background-draconite),
${N} .button.purple:not(.green) {
  border-style: solid !important;
  border-image: url("${IMG.button}") 22 fill / 6px / 0 stretch !important;
  background: none !important;
  box-shadow: 0 1px 3px rgb(0 0 0 / .7) !important;
}
${N} .button.purple:not(.green) { box-shadow: 0 0 0 1px rgb(110 60 140 / .55), 0 1px 3px rgb(0 0 0 / .7) !important; }
${N} .button.green::before, ${N} .button.purple::before { box-shadow: none !important; background: none !important; }
${N} .button .label { color: var(--tmg-text) !important; text-shadow: 0 1px 2px #000, 0 0 3px #000; }
${N} .button.green:not(.background-gold):not(.background-draconite):not(.disable):not(.no-hover):hover,
${N} .button.purple:not(.green):not(.disable):hover {
  filter: brightness(1.2) saturate(1.15);
  box-shadow: var(--tmg-ember) !important;
}
${N} .button.red { filter: saturate(.75) brightness(.85); }
${N} .button.disable { filter: grayscale(.7) brightness(.65); }
`;

  /* =====================================================================
   * === CZAT ===
   * Pod wiadomościami prawie nieprzezroczysta czerń (#070505 / 93%): kolory kanałów zostają z gry,
   * tekst washi ma kontrast ~15:1, przygaszone znaczniki czasu ~5:1 (WCAG AA).
   * ===================================================================== */
  const cssChat = `
${N} .interface-layer > .left-column.main-column,
${N} .new-chat-window { background: linear-gradient(rgb(7 5 5 / .25), rgb(7 5 5 / .25)), url("${IMG.column}") center bottom / 100% auto no-repeat, var(--tmg-k0) !important; }
/* listwy kolumn: pionowa belka czarnego lakieru z czerwonym sznurem pośrodku */
${N} .interface-layer > .left-column.main-column > .border,
${N} .interface-layer > .right-column.main-column > .border {
  background:
    linear-gradient(90deg, transparent 45%, var(--tmg-r1) 45% 55%, transparent 55%),
    linear-gradient(90deg, #000, var(--tmg-edge-hi) 30%, var(--tmg-k2) 50%, var(--tmg-edge-hi) 70%, #000) !important;
  border-image: none !important;
}
/* wiadomości */
${N} .new-chat-window .chat-message-wrapper {
  background: radial-gradient(ellipse 120% 70px at 50% 0, rgb(122 18 18 / .1), transparent), rgb(7 5 5 / .93) !important;
  border-top-color: var(--tmg-edge) !important;
  border-bottom-color: var(--tmg-edge) !important;
  box-shadow: inset 0 0 14px 2px rgb(0 0 0 / .85) !important;
}
${N} .new-chat-window .new-chat-message { text-shadow: 0 1px 1px rgb(0 0 0 / .95); }
${N} .new-chat-window .new-chat-message .ts-section { color: var(--tmg-dim) !important; }
${N} .new-chat-window .new-chat-message .author-section.click-able:hover { text-decoration: underline; text-decoration-color: var(--tmg-r3); }
/* pasek zakładek kanałów: lakier, pod nim pędzlowa kreska */
${N} .new-chat-window .chat-channel-card-wrapper {
  background: var(--tmg-brush-dim) center bottom / 96% 3px no-repeat, linear-gradient(var(--tmg-k2), var(--tmg-k0)) !important;
  border-image: none !important;
  box-shadow: 0 2px 6px rgb(0 0 0 / .8);
}
${N} .new-chat-window .chat-channel-card { background: none !important; border-color: transparent !important; box-shadow: none !important; }
${N} .new-chat-window .chat-channel-card .chat-channel-card-icon {
  filter: grayscale(1) sepia(.25) brightness(.6);
  transition: filter .2s ease;
}
${N} .new-chat-window .chat-channel-card:hover .chat-channel-card-icon { filter: grayscale(1) sepia(.3) brightness(.95); }
${N} .new-chat-window .chat-channel-card.active {
  background: var(--tmg-brush) center bottom 1px / 80% 3px no-repeat !important;
}
${N} .new-chat-window .chat-channel-card.active .chat-channel-card-icon {
  filter: grayscale(1) sepia(.35) brightness(1.15) drop-shadow(0 0 3px rgb(196 42 42 / .55));
}
${N} .new-chat-window .chat-channel-card.channel-disabled .chat-channel-card-icon { filter: grayscale(1) brightness(.28); }
/* licznik nieprzeczytanych – jedno z niewielu miejsc z jasną czerwienią (#fff na #c42a2a ≈ 5:1) */
${N} .new-chat-window .chat-channel-not-read-counter {
  background: var(--tmg-hi) !important;
  color: #fff !important;
  box-shadow: 0 0 0 1px #000, 0 0 6px rgb(196 42 42 / .6);
}
/* pasek pod wiadomościami i pole wpisywania */
${N} .new-chat-window .chat-input-wrapper {
  background: linear-gradient(var(--tmg-k2), var(--tmg-k0)) !important;
  box-shadow: inset 0 1px 0 var(--tmg-r1) !important;
}
${N} .new-chat-window .chat-input-wrapper .chat-info-wrapper,
${N} .new-chat-window .chat-input-wrapper .chat-config-wrapper { filter: grayscale(1) sepia(.3) brightness(.8); }
${N} .new-chat-window .chat-input-wrapper .chat-info-wrapper:hover,
${N} .new-chat-window .chat-input-wrapper .chat-config-wrapper:hover { filter: grayscale(1) sepia(1) hue-rotate(-30deg) saturate(3) brightness(.95); }
${N} .new-chat-window .magic-input-wrapper { padding: 0 4px 4px; }
${N} .new-chat-window .magic-input {
  background: var(--tmg-k0) !important;
  border-style: solid !important;
  border-width: 0 !important;
  border-image: var(--tmg-frame-thin) 9 10 10 9 / 4px / 0 round !important;
  color: var(--tmg-text) !important;
  caret-color: var(--tmg-hi);
}
${N} .new-chat-window .magic-input-placeholder { color: var(--tmg-dim) !important; }
/* menu kanału (lista wyboru nad polem) i powiadomienia czatu */
${N} .new-chat-window .control-wrapper .card-list,
${N} .new-chat-window .menu-card {
  background: rgb(14 10 10 / .97) !important;
  box-shadow: 0 0 0 1px #000, inset 0 0 0 1px var(--tmg-edge) !important;
  color: var(--tmg-text) !important;
}
${N} .new-chat-window .chat-notification { text-shadow: 0 1px 2px #000; }
`;

  /* =====================================================================
   * === EKWIPUNEK (prawa kolumna, postać, torby, sloty, statystyki, sklep, przyciski HUD) ===
   * Ikony przedmiotów i ramki rzadkości w slotach zostają nietknięte.
   * ===================================================================== */
  const cssInventory = `
${N} .interface-layer > .right-column.main-column { background: linear-gradient(rgb(7 5 5 / .25), rgb(7 5 5 / .25)), url("${IMG.column}") center bottom / 100% auto no-repeat, var(--tmg-k0) !important; }
${N} .interface-element-grid-border,
${N} .interface-element-grid-border-light {
  outline-color: var(--tmg-k0) !important;
  box-shadow: 0 0 0 1px var(--tmg-edge), 0 0 0 2px #000 !important;
}
${N} .interface-layer .equipment-outline-2,
${N} .interface-layer .equipment-outline-3 { background-color: var(--tmg-edge) !important; }

/* siatka slotów (torba, sklep, skrzynie): wklęsłe komórki z czarnego lakieru, kratka w bardzo ciemnej czerwieni
   (wzór co 33 px jak siatka gry) */
${N} .interface-element-item-slot-grid-stretch,
${N} .interface-element-one-item-slot-background-to-repeat {
  filter: none !important;
  background-color: var(--tmg-k0) !important;
  background-image:
    linear-gradient(90deg, transparent 32px, #2a0a0a 32px),
    linear-gradient(transparent 32px, #2a0a0a 32px),
    radial-gradient(circle at 50% 40%, #1a1312, #0a0707 70%) !important;
  background-size: 33px 33px !important;
  background-repeat: repeat !important;
}
/* połysk lakieru przesuwa się powoli po liniach siatki (jak w Dark Gothic, tu w ciemnej czerwieni) */
${N} .interface-element-item-slot-grid-stretch::after {
  content: "";
  position: absolute; inset: 0;
  pointer-events: none;
  background: linear-gradient(115deg, transparent 42%, rgb(158 27 27 / .55) 50%, transparent 58%) 0 0 / 300% 100% no-repeat;
  --tmg-grid-mask:
    linear-gradient(90deg, transparent 32px, #000 32px) 0 0 / 33px 33px,
    linear-gradient(transparent 32px, #000 32px) 0 0 / 33px 33px;
  -webkit-mask: var(--tmg-grid-mask);
  mask: var(--tmg-grid-mask);
  animation: tmg-shine 11s linear infinite;
}
${N} .interface-element-one-item-slot-2 {
  background: radial-gradient(circle at 50% 40%, #1a1312, var(--tmg-k0) 75%) !important;
  border-color: var(--tmg-edge) !important;
  outline-color: #000 !important;
  box-shadow: inset 0 0 8px #000 !important;
}

/* ekwipunek, przełącznik toreb, torba: ramy z płytek zbroi (wysunięte o 4 px – sloty nie są zasłonięte) */
${N} .interface-layer > .right-column.main-column .equipment-wrapper,
${N} .interface-layer > .right-column.main-column .bags-navigation-bg,
${N} .interface-layer > .right-column.main-column .inventory-grid-bg {
  border-style: solid !important;
  border-width: 0 !important;
  border-image: var(--tmg-frame-thin) 9 10 10 9 / 4px / 4px round !important;
  box-shadow: 0 0 0 4px rgb(7 5 5 / .95), 0 4px 12px 4px rgb(0 0 0 / .7) !important;
  outline: none !important;
}
${N} .interface-layer > .right-column.main-column .equipment-wrapper-outline {
  background: none !important; box-shadow: none !important; border-color: transparent !important;
}
/* sloty postaci: osobne wnęki z cienką czerwoną krawędzią od dołu (jak sznur pod płytką) */
${N} .interface-layer > .right-column.main-column .equipment-wrapper .eq-slot.interface-element-one-item-slot-background-to-repeat {
  background: radial-gradient(circle at 50% 40%, #1c1412, #080505 72%) !important;
  background-size: auto !important;
  box-shadow: inset 0 0 0 1px var(--tmg-edge), inset 0 2px 6px #000, inset 0 -1px 0 rgb(122 18 18 / .45) !important;
  border-radius: 2px;
}
${N} .interface-layer > .right-column.main-column .bags-navigation-bg .bag-slot-wrapper {
  background: radial-gradient(circle at 50% 40%, #1c1412, #080505 75%) !important;
  box-shadow: inset 0 0 0 1px var(--tmg-edge) !important;
}
${N} .interface-layer > .right-column.main-column .bags-navigation .item.bag.active {
  box-shadow: 0 0 0 1px #000, 0 0 0 2px var(--tmg-r3), 0 0 8px rgb(196 42 42 / .45) !important;
  border-radius: 2px;
}

/* panel statystyk: lakier w cienkiej ramie, „STATS” pędzlem, wiersze rozdzielone pociągnięciem pędzla.
   Kolory odporności (ogień, zimno…) zostają z gry. */
${N} .interface-layer .stats-wrapper {
  background: var(--tmg-urushi) !important;
  border-style: solid !important;
  border-width: 0 !important;
  border-image: var(--tmg-frame-thin) 9 10 10 9 / 4px / 0 round !important;
  box-shadow: 0 0 0 1px #000, 0 4px 12px rgb(0 0 0 / .8) !important;
  outline: none !important;
}
${N} .interface-layer .stats-wrapper .header-title-wrapper .interface-element-active-card-background-stretch {
  background: var(--tmg-brush) center bottom / 70% 3px no-repeat !important;
  border-image: none !important;
  box-shadow: none !important;
}
${N} .interface-layer .stats-wrapper .header-title {
  color: var(--tmg-text) !important;
  letter-spacing: .08em;
  text-shadow: 0 1px 2px #000 !important;
}
${N} .interface-layer .stats-wrapper .stats-list li { position: relative; }
${N} .interface-layer .stats-wrapper .stats-list li + li::before {
  content: ""; position: absolute; left: 2px; right: -26px; top: 0; height: 2px;
  background: var(--tmg-brush-dim) left center / 100% 100% no-repeat;
  opacity: .6;
}
${N} .interface-layer .stats-wrapper .stats-list .stat-icon { filter: grayscale(1) sepia(.3) brightness(.95) drop-shadow(0 1px 1px #000); }
${N} .interface-layer .stats-wrapper .stats-list li:not(.resists) .value,
${N} .interface-layer .stats-wrapper .stats-list li:not(.resists) .value .stat { color: var(--tmg-text) !important; }
${N} .interface-layer .stats-wrapper .stats-list .value { text-shadow: 0 1px 2px #000, 0 0 3px #000 !important; }

/* --- sklep: markiza jako ciemnoczerwona kurtyna noren, pola kupna/sprzedaży jak torba --- */
${N} .shop-wrapper .shop-background .canopy { filter: grayscale(1) sepia(1) hue-rotate(-38deg) saturate(2.6) brightness(.32) contrast(1.3) !important; }
${N} .shop-wrapper .shop-background .paper-1,
${N} .shop-wrapper .shop-background .paper-2 { filter: grayscale(1) brightness(.18) !important; }
${N} .shop-wrapper .shop-info-wrapper,
${N} .shop-wrapper .shop-info-wrapper * { color: var(--tmg-dim) !important; text-shadow: 0 1px 2px #000; }
${N} .shop-wrapper .total-price { color: var(--tmg-text) !important; letter-spacing: .04em; }
${N} .shop-wrapper .shop-content .shop-balance::after { background: var(--tmg-edge) !important; }

/* --- przyciski HUD (widżety): płytki czarnego lakieru z mosiężnym obrzeżem; ikony gry przygaszone do
   koloru starego papieru, przy najechaniu żarzą się. Kolory stanów gry zostają jako obrys. --- */
${N} .widget-button {
  background:
    radial-gradient(ellipse 90% 60% at 50% 0, rgb(255 235 220 / .08), transparent 70%),
    linear-gradient(#1f1716, #0e0a0a 60%, #070505) !important;
  border-radius: 3px !important;
  box-shadow: 0 0 0 1px #000, inset 0 0 0 1px rgb(138 106 58 / .35), inset 0 -2px 0 rgb(92 13 13 / .5) !important;
}
${N} .widget-button::before { box-shadow: none !important; }
${N} .widget-button .icon {
  filter: grayscale(1) sepia(.35) brightness(.95) drop-shadow(0 1px 0 #000) !important;
  opacity: .92;
}
${N} .widget-button:not(.disabled):hover { box-shadow: 0 0 0 1px #000, inset 0 0 0 1px var(--tmg-r3), var(--tmg-ember) !important; }
${N} .widget-button:not(.disabled):hover .icon,
${N} .widget-button.window-is-open .icon {
  filter: grayscale(1) sepia(.6) brightness(1.15) drop-shadow(0 1px 0 #000) drop-shadow(0 0 3px rgb(196 42 42 / .6)) !important;
  opacity: 1;
}
${N} .widget-button.green.window-is-open { box-shadow: 0 0 0 1px #000, inset 0 0 0 1px var(--tmg-r2), inset 0 -2px 0 var(--tmg-r3) !important; }
${N} .widget-button.red { box-shadow: 0 0 0 1px #000, inset 0 0 0 1px rgb(196 42 42 / .9) !important; }
${N} .widget-button.blue { box-shadow: 0 0 0 1px #000, inset 0 0 0 1px rgb(80 130 210 / .7) !important; }
${N} .widget-button.violet, ${N} .widget-button.blink-violet { box-shadow: 0 0 0 1px #000, inset 0 0 0 1px rgb(150 90 200 / .7) !important; }
${N} .widget-button.disabled { filter: grayscale(.8) brightness(.55); }
`;

  /* =====================================================================
   * === TOOLTIPY ===
   * Karta z czarnego lakieru (#0e0a0a / 97%) – tekst washi ~15:1, przygaszony ~5,4:1 (WCAG AA).
   * Kolor rzadkości (--tmg-rar, „r g b”) z klasy ramki ikony w nagłówku (t-…): obwódka, górna linia,
   * łuna i oprawa ikony. Nazwy i statystyki zachowują kolory gry. Zwykłe przedmioty – stonowana czerwień.
   * ===================================================================== */
  const cssTooltips = `
${N} .tip-wrapper { --tmg-rar: 122 18 18; }
${N} .tip-wrapper:has(.item-head .highlight.t-uniupg) { --tmg-rar: 255 251 0; }
${N} .tip-wrapper:has(.item-head .highlight.t-her) { --tmg-rar: 56 184 235; }
${N} .tip-wrapper:has(.item-head .highlight.t-upgraded) { --tmg-rar: 255 89 175; }
${N} .tip-wrapper:has(.item-head .highlight.t-leg) { --tmg-rar: 255 132 0; }
${N} .tip-wrapper:has(.item-head .highlight.t-art) { --tmg-rar: 225 64 70; }
${N} .tip-wrapper {
  border-style: solid; border-width: 0;
  border-image: var(--tmg-frame-thin) 9 10 10 9 / 4px / 2px round !important;
  box-shadow:
    0 0 0 1px rgb(0 0 0 / .9),
    0 0 14px rgb(var(--tmg-rar) / .22),
    0 12px 28px rgb(0 0 0 / .9) !important;
}
${N} .tip-wrapper .content {
  background:
    radial-gradient(120% 60px at 50% 0, rgb(var(--tmg-rar) / .1), transparent 100%),
    linear-gradient(rgb(22 16 16 / .97), rgb(14 10 10 / .97) 60px, rgb(7 5 5 / .97)) !important;
  box-shadow: inset 0 0 0 1px rgb(var(--tmg-rar) / .32), inset 0 0 22px rgb(0 0 0 / .7);
  color: var(--tmg-text) !important;
  text-shadow: 0 1px 2px #000;
}
/* górna linia w kolorze rzadkości */
${N} .tip-wrapper.normal-tip::before {
  content: "";
  position: absolute; left: 12%; right: 12%; top: 1px; height: 1px;
  background: linear-gradient(90deg, rgb(var(--tmg-rar) / 0), rgb(var(--tmg-rar) / .9) 50%, rgb(var(--tmg-rar) / 0));
  pointer-events: none; z-index: 2;
}
/* nagłówek: łuna rzadkości za ikoną, ikona w oprawie, pod spodem pociągnięcie pędzla */
${N} .tip-wrapper .item-head {
  border-color: transparent !important;
  background:
    var(--tmg-brush-dim) center bottom / 94% 3px no-repeat,
    radial-gradient(70px 44px at 22px 50%, rgb(var(--tmg-rar) / .22), transparent 100%) !important;
  box-shadow: none !important;
  padding-bottom: 6px !important;
}
${N} .tip-wrapper .item-head .item {
  background: radial-gradient(circle, rgb(var(--tmg-rar) / .22), var(--tmg-k0) 72%) !important;
  box-shadow: 0 0 0 1px #000, 0 0 0 2px rgb(var(--tmg-rar) / .6), 0 0 0 3px #000, 0 0 10px rgb(var(--tmg-rar) / .4) !important;
}
${N} .tip-wrapper .item-name { font-weight: bold; text-shadow: 0 0 6px rgb(var(--tmg-rar) / .35), 0 1px 2px #000 !important; }
${N} .tip-wrapper .item-type,
${N} .tip-wrapper .item-builds { color: var(--tmg-dim) !important; letter-spacing: .03em; }
${N} .tip-wrapper .item-rarity { color: var(--tmg-dim) !important; letter-spacing: .1em; text-transform: uppercase; font-size: 10px !important; font-weight: bold; }
${N} .tip-wrapper:has(.item-head .highlight:is(.t-uniupg, .t-her, .t-upgraded, .t-leg, .t-art)) .item-rarity { color: rgb(var(--tmg-rar)) !important; letter-spacing: .1em; text-transform: uppercase; font-size: 10px !important; font-weight: bold; }
/* sekcje: pędzlowe separatory zamiast cienkich linii gry (gra ustawia kolor linii inline) */
${N} .tip-wrapper .item-tip-section { border-bottom-color: transparent !important; position: relative; }
${N} .tip-wrapper .item-tip-section:not(.no-border):not(:last-child)::after {
  content: "";
  position: absolute; left: 4%; right: 4%; bottom: 0; height: 3px;
  background: var(--tmg-brush-dim) center / 100% 100% no-repeat;
  opacity: .75;
  pointer-events: none;
}
/* proste tooltipy (np. nad przyciskami) – lakier z czerwoną krawędzią */
${N} .tip-wrapper:not(.normal-tip) .content { box-shadow: inset 0 0 0 1px var(--tmg-edge-hi), inset 0 -1px 0 var(--tmg-r2); }
`;

  /* =====================================================================
   * === WALKA i DIALOGI Z NPC ===
   * Plansza walki (grafika gry, sprite'y) bez zmian – przebudowany jest tylko panel walki i dziennik.
   * Kolory stron walki (zielony/czerwony) i wpisy dziennika zostają z gry.
   * ===================================================================== */
  const cssBattle = `
/* --- panel walki (.battle-controller) --- */
${N} .battle-controller .battle-border {
  border-image: var(--tmg-frame) 32 / 10px / 0 round !important;
  box-shadow: 0 0 0 1px #000, 0 10px 26px rgb(0 0 0 / .85);
}
${N} .battle-controller .middle-graphic,
${N} .battle-controller .graphics {
  background: radial-gradient(ellipse 100% 60px at 50% 0, rgb(122 18 18 / .14), transparent), linear-gradient(rgb(22 16 16 / .96), rgb(7 5 5 / .96) 70px) !important;
}
/* pasek czasu tury jak ostrze: stalowa krawędź u góry, ciemnoczerwony lakier */
${N} .battle-controller .c-timer {
  background: var(--tmg-k0) !important;
  box-shadow: inset 0 1px 3px #000, 0 0 0 1px var(--tmg-edge) !important;
  border-color: transparent !important;
}
${N} .battle-controller .c-timer__progress-bar {
  background: linear-gradient(#cfc6bd 0 1px, #9e1b1b 1px, #7a1212 55%, #3a0808) !important;
}
${N} .battle-controller .c-timer__text { color: var(--tmg-text) !important; text-shadow: 0 1px 2px #000 !important; }
${N} .battle-controller .pool-timer-wrapper,
${N} .battle-controller .battle-watch { color: var(--tmg-dim) !important; text-shadow: 0 1px 2px #000; }
${N} .battle-controller .attach-icon,
${N} .battle-controller .toggle-battle { filter: grayscale(1) sepia(.3) brightness(.85); }
${N} .battle-controller .attach-icon:hover,
${N} .battle-controller .toggle-battle:hover { filter: grayscale(1) sepia(1) hue-rotate(-30deg) saturate(3) brightness(.95); }
${N} .battle-controller .battle-msg { color: var(--tmg-text); text-shadow: 0 1px 2px #000; }
/* komunikaty informacyjne – zamiast szarego paska delikatna czerwień z kreską pędzla z lewej */
${N} .battle-controller .battle-msg.txt {
  background-color: rgb(122 18 18 / .18) !important;
  box-shadow: inset 2px 0 0 var(--tmg-r3);
  color: var(--tmg-text) !important;
}
${N} .battle-controller .turn-prediction__item { border-color: var(--tmg-edge) !important; }

/* --- dialog z NPC: papier shoji w lakierowanej ramie (ciemny, czytelny), imię pędzlem,
   pociągnięcie pędzla między wypowiedzią a odpowiedziami, odpowiedzi żarzą się przy najechaniu --- */
${N} .dialogue-window .border-image {
  background:
    linear-gradient(rgb(22 16 16 / .96), rgb(7 5 5 / .95) 80px) !important;
  border-style: solid !important;
  border-width: 0 !important;
  border-image: var(--tmg-frame) 32 / 10px / 0 round !important;
  box-shadow: 0 0 0 1px #000, 0 10px 26px rgb(0 0 0 / .85) !important;
}
${N} .dialogue-window .dialogue-background-color { background: rgb(7 5 5 / .7) !important; }
${N} .dialogue-window .content { color: var(--tmg-text); }
${N} .dialogue-window .content .npc-dialogue-wrapper .h_content {
  color: var(--tmg-text) !important;
  letter-spacing: .04em;
  text-shadow: 0 0 6px rgb(158 27 27 / .5), 0 1px 2px #000 !important;
}
${N} .dialogue-window .content .npc-message { color: var(--tmg-text) !important; text-shadow: 0 1px 2px #000; }
${N} .dialogue-window .content .answers-scroll::before {
  content: "";
  position: absolute; left: 0; right: 0; top: -6px; height: 4px;
  background: var(--tmg-brush) center / 100% 100% no-repeat;
  opacity: .8;
}
${N} .dialogue-window .content .answers li {
  border-bottom-color: rgb(42 31 29 / .8) !important;
  transition: background-color .15s ease, box-shadow .15s ease;
}
${N} .dialogue-window .content .answers li .icon { filter: grayscale(1) sepia(.35) brightness(.85); }
${N} .dialogue-window .content .answers li:hover {
  background: linear-gradient(90deg, rgb(158 27 27 / .25), rgb(122 18 18 / .06) 60%, transparent) !important;
  box-shadow: inset 2px 0 0 var(--tmg-hi) !important;
}
${N} .dialogue-window .content .answers li:hover .icon { filter: grayscale(1) sepia(1) hue-rotate(-30deg) saturate(3) brightness(1); }
`;

  /* =====================================================================
   * === PASKI (belki, tabliczka HUD, kula HP, doświadczenie, paski postępu, minimapa) ===
   * HP jak czerwony lakier z połyskiem, paski jak ostrze (stalowa krawędź + ciemnoczerwona głownia).
   * ===================================================================== */
  const cssBars = `
/* --- GÓRA w tym samym stylu co dolny pasek ---
   belka: ten sam malowany lakier co dół (kafel bez szwów) */
${N} .interface-layer > .top.positioner > .bg {
  background: url("${IMG.bar}") 0 0 / auto 100% repeat-x, var(--tmg-k0) !important;
  box-shadow: 0 4px 10px rgb(0 0 0 / .6);
}

/* tabliczka z imieniem / lokacją / walutami (gra: 342×65 na górze ekranu).
   Rama: żelazo z pęknięciami pełnymi żaru, na obu końcach okrągłe gniazda z ogniem
   (rama-tabliczki.webp, 600×205; wnętrze 141/45 – 458/144 px). 9-slice w skali 0,34: góra 15 px (w obrębie
   tabliczki), boki 48 px i dół 20 px wysunięte na zewnątrz (outset) – układ gry bez zmian. Środek ramy
   powtarzany (round), żeby kamienie belek nie były rozciągnięte. */
${N} .interface-layer .hud-container {
  background:
    var(--tmg-brush-dim) center 33px / 60% 2px no-repeat,
    radial-gradient(ellipse 45% 70% at 50% 100%, rgb(122 18 18 / .2), transparent 70%),
    url("${IMG.bar}") 0 50% / auto 140% repeat-x,
    var(--tmg-k0) !important;
  border-style: solid !important;
  border-width: 0 !important;
  border-image: url("${IMG.plate}") 45 142 60 141 / 15px 48px 20px 48px / 0 48px 20px 48px round stretch !important;
  box-shadow: none !important;
  color: var(--tmg-text) !important;
  overflow: visible !important;
}

/* ZWARTY UKŁAD (wnętrze ramy: 15–65 px): imię, pod nim mapa + koordynaty + świat w jednym rzędzie,
   niżej złoto i smocze łzy obok siebie, wszystko wyśrodkowane */
${N} .interface-layer .hud-container .heroname {
  transform: translateY(14px);
  text-shadow: 0 1px 2px #000, 0 0 6px rgb(0 0 0 / .9);   /* oryginalna czcionka i kolor gry */
}
/* nazwa świata jest przenoszona przez skrypt do .map-data (arrangeHud), więc cały rząd to jeden flex */
${N} .interface-layer .hud-container .map-data {
  position: absolute !important;
  left: 0 !important; right: 0 !important; top: 34px !important;
  margin: 0 !important;
  height: auto !important;
  display: flex !important;
  justify-content: center;
  align-items: baseline;
  gap: 5px;
  transform: none !important;
}
${N} .interface-layer .hud-container .map-data > .location,
${N} .interface-layer .hud-container .map-data > .coords,
${N} .interface-layer .hud-container .map-data > .world-name {
  position: static !important;
  left: auto !important; top: auto !important;
  width: auto !important; max-width: none !important;
  white-space: nowrap;
}
${N} .interface-layer .hud-container .location { color: var(--tmg-text) !important; text-shadow: 0 1px 2px #000; }
${N} .interface-layer .hud-container .coords,
${N} .interface-layer .hud-container .world-name { color: var(--tmg-dim) !important; text-shadow: 0 1px 2px #000; }
/* waluty: „+” usunięte, złoto i smocze łzy jako para wyśrodkowana pod mapą */
${N} .interface-layer .hud-container .btn-min { display: none !important; }
${N} .interface-layer .hud-container .gold-tip,
${N} .interface-layer .hud-container .credits-tip { top: 48px !important; width: 18px !important; height: 18px !important; transform: none !important; }
${N} .interface-layer .hud-container .gold-tip { left: calc(50% - 76px) !important; background: url("${IMG.gold}") center / contain no-repeat !important; filter: drop-shadow(0 1px 2px #000); }
${N} .interface-layer .hud-container .credits-tip { left: calc(50% + 16px) !important; background: url("${IMG.tears}") center / contain no-repeat !important; filter: drop-shadow(0 1px 2px #000); }
${N} .interface-layer .hud-container .herogold,
${N} .interface-layer .hud-container .herocredits {
  top: 49px !important; width: auto !important;
  text-align: left !important;
  color: var(--tmg-text) !important; text-shadow: 0 1px 2px #000;
}
${N} .interface-layer .hud-container .herogold { left: calc(50% - 54px) !important; }
${N} .interface-layer .hud-container .herocredits { left: calc(50% + 38px) !important; }
${N} .interface-layer .hud-container .herogold-difference { left: calc(50% - 54px) !important; top: 88px !important; text-align: left !important; }
${N} .interface-layer .hud-container .herocredits-difference { left: calc(50% + 38px) !important; top: 88px !important; text-align: left !important; }

/* kulka trybu PvP mapy → medalion zwisający z dolnej krawędzi ramy: żelazny pierścień z mosiężną obwódką,
   w środku żarzący się kamień w kolorze mapy (gra nadal przełącza klasy green/yellow/orange/red).
   To ten sam element gry (.map_ball) – tylko przeniesiony i przemalowany, więc podpowiedź „PvP…”
   i kliknięcie (lista poszukiwanych) działają jak wcześniej. */
${N} .interface-layer .hud-container .map_ball {
  --tmg-pvp: 120 120 120;
  left: calc(50% - 13px) !important;
  top: 64px !important;
  width: 26px !important; height: 33px !important;
  z-index: 5;
  border-radius: 0;
  /* medalion 48×61 w skali 26/48: otwór w (12.7px, 19.5px), promień ≈ 7.4px */
  background:
    url("${IMG.medal}") 0 0 / 100% 100% no-repeat,
    radial-gradient(circle at 11.6px 18.2px, rgb(255 255 255 / .6) 0 1.2px, transparent 2.2px),
    radial-gradient(circle at 12.7px 19.5px, rgb(var(--tmg-pvp)) 0 3.8px, rgb(var(--tmg-pvp) / .6) 5.6px, #0b0707 7.6px, transparent 8px) !important;
  box-shadow: none;
  filter: drop-shadow(0 2px 2px #000) drop-shadow(0 0 4px rgb(var(--tmg-pvp) / .5));
  cursor: pointer;
}
${N} .interface-layer .hud-container .map_ball.green { --tmg-pvp: 60 170 80; }
${N} .interface-layer .hud-container .map_ball.yellow { --tmg-pvp: 220 180 50; }
${N} .interface-layer .hud-container .map_ball.orange { --tmg-pvp: 230 110 30; }
${N} .interface-layer .hud-container .map_ball.red { --tmg-pvp: 210 30 30; }
${N} .interface-layer .hud-container .map_ball:hover { filter: brightness(1.25) drop-shadow(0 2px 2px #000) drop-shadow(0 0 6px rgb(var(--tmg-pvp) / .7)); }


/* paski postępu w oknach (np. zadania, rzemiosło) */
${N} .interface-element-progress-bar-0,
${N} .interface-element-progress-bar-1 { background: var(--tmg-k0) !important; box-shadow: inset 0 0 0 1px var(--tmg-edge) !important; }
${N} .interface-element-progress-bar-0 .inner,
${N} .interface-element-progress-bar-1 .inner {
  background: linear-gradient(#cfc6bd 0 1px, #9e1b1b 1px, #7a1212 55%, #3a0808) !important;
  border-color: var(--tmg-r2) !important;
}
${N} .interface-element-progress-bar-0 .value,
${N} .interface-element-progress-bar-1 .value { color: var(--tmg-text) !important; text-shadow: 0 1px 2px #000; }

/* minimapa: sama mapa bez zmian; wokół cienka lakierowana krawędź i winieta nad mapą (bez przechwytywania kliknięć) */
${N} .mini-map { box-shadow: 0 0 0 1px #000, 0 0 0 2px var(--tmg-edge-hi) !important; }
${N} .handheld-mini-map { position: relative; }
${N} .handheld-mini-map::after {
  content: "";
  position: absolute; left: 0; top: 0; width: 100%; aspect-ratio: 1;
  pointer-events: none;
  box-shadow: inset 0 0 0 1px #000, inset 0 0 0 2px var(--tmg-r1), inset 0 0 16px rgb(0 0 0 / .7);
}
`;

  /* =====================================================================
   * === ANIMACJE (lekkie; wyłączane przy prefers-reduced-motion) ===
   * ===================================================================== */
  /* =====================================================================
   * === DOLNY PASEK (belka, panel ze slotami, orb HP w ramie tsuby, tabliczki ema) ===
   * Tylko wygląd: wszystkie ozdoby to pseudo-elementy z pointer-events: none, sloty i orb działają jak w grze.
   * Poziom cieczy w orbie wyznacza gra (wysokość .blood = HP) – motyw tylko ją maluje i animuje.
   * ===================================================================== */
  // Środek orba: x = środek panelu − 2 px, y = 55 px od góry szablonu (gra: wrapper 98×98 w (281, 6))
  const B = `${N} .bottom-panel-of-bottom-positioner`;

  const cssBottomBar = `
/* --- belka na całą szerokość: malowany czarny lakier (pasek-tlo.webp, kafel bez szwów)
   z przygaszonymi czerwonymi liniami u góry i u dołu --- */
${N} .interface-layer > .bottom.positioner > .bg {
  background: url("${IMG.bar}") 0 0 / auto 100% repeat-x, var(--tmg-k0) !important;   /* malowany lakier, kafel bez szwów */
  box-shadow: 0 -4px 10px rgb(0 0 0 / .6);
}

/* --- panel ze slotami: grafika gry schowana, zamiast niej lakierowana płyta w ramie z płytek zbroi --- */
${B} .bottom-panel-graphic { opacity: 0 !important; }
${B}::before {
  content: "";
  position: absolute;
  left: 30px; right: 30px; top: 30px; bottom: -10px;
  z-index: 0;
  pointer-events: none;
  border-style: solid; border-width: 0;
  border-image: var(--tmg-frame) 32 / 10px / 0 round;
  background:
    radial-gradient(ellipse 30% 70% at 50% 0, rgb(122 18 18 / .16), transparent 70%),
    var(--tmg-urushi);
  box-shadow: 0 -2px 12px rgb(0 0 0 / .8);
}

/* sloty: czarne lakierowane kwadraty z cienką krawędzią; najechanie = żarzący się węgiel */
${B} .usable-slot {
  background: radial-gradient(circle at 50% 38%, #1d1513, #090606 70%) !important;
  border-color: #000 !important;
  outline: none !important;
  box-shadow: inset 0 0 0 1px var(--tmg-edge-hi), inset 0 -1px 0 rgb(122 18 18 / .55), inset 0 0 8px #000, 0 1px 2px #000 !important;
  transition: box-shadow .18s ease;
}
/* ramka slotu: poszarpane żelazo z żarzącym się wnętrzem (ramka-slotu.webp).
   Żeby 8 jednakowych ramek nie było monotonne: każdy slot dostaje inne ułożenie tej samej grafiki
   (8 kombinacji obrotu i odbicia – płomienie raz u dołu, raz z boku, raz u góry), lekko inną jasność
   i własny rytm „oddechu” żaru (różny czas i przesunięcie animacji, tylko opacity). */
${B} .usable-slot::after {
  content: "" !important;
  display: block !important;
  position: absolute;
  inset: -4px;
  z-index: 1;
  pointer-events: none;
  background: url("${IMG.slot}") center / 100% 100% no-repeat !important;
  transform: var(--tmg-st, none);
  filter: brightness(var(--tmg-sb, 1)) drop-shadow(0 1px 2px #000);
  animation: none;
}
${B} .usable-slot-1 { --tmg-st: none;                       --tmg-sb: 1;    --tmg-sd: 4.2s; --tmg-so: 0s; }
${B} .usable-slot-2 { --tmg-st: rotate(180deg);             --tmg-sb: .9;   --tmg-sd: 5.1s; --tmg-so: -1.3s; }
${B} .usable-slot-3 { --tmg-st: scaleX(-1);                 --tmg-sb: 1.08; --tmg-sd: 4.6s; --tmg-so: -2.7s; }
${B} .usable-slot-4 { --tmg-st: rotate(-90deg);             --tmg-sb: .95;  --tmg-sd: 5.6s; --tmg-so: -.8s; }
${B} .usable-slot-5 { --tmg-st: rotate(90deg);              --tmg-sb: .95;  --tmg-sd: 4.9s; --tmg-so: -3.1s; }
${B} .usable-slot-6 { --tmg-st: scaleY(-1);                 --tmg-sb: 1.05; --tmg-sd: 5.3s; --tmg-so: -1.9s; }
${B} .usable-slot-7 { --tmg-st: rotate(90deg) scaleX(-1);   --tmg-sb: .92;  --tmg-sd: 4.4s; --tmg-so: -3.6s; }
${B} .usable-slot-8 { --tmg-st: rotate(-90deg) scaleX(-1);  --tmg-sb: 1.02; --tmg-sd: 5.8s; --tmg-so: -2.2s; }
html.${ON}.${FX}.tmg-ni .bottom-panel-of-bottom-positioner .usable-slot::after {
  animation: tmg-coal var(--tmg-sd, 5s) ease-in-out var(--tmg-so, 0s) infinite alternate;
}
@keyframes tmg-coal { from { opacity: .78; } to { opacity: 1; } }
${B} .usable-slot:hover,
${B} .usable-slot:active,
${B} .usable-slot.active {   /* .active – TODO: zweryfikuj selektor (stan slotu po użyciu skrótu) */
  box-shadow: inset 0 0 0 1px var(--tmg-r3), inset 0 0 10px rgb(196 42 42 / .35), 0 0 8px rgb(196 42 42 / .5), 0 0 2px rgb(255 120 80 / .6) !important;
}
/* numery slotów: washi, pogrubione, z cieniem – czytelne na czerni */
${B} .usable-slot::before {
  color: rgb(230 220 207 / .85) !important;
  font-weight: bold;
  text-shadow: 0 0 3px #000, 0 1px 1px #000, 0 0 1px #000;
  z-index: 2;
}
/* pędzlowe separatory między slotami 4 | orbem i orbem | 5 */
${B} .slots.left::after,
${B} .slots.right::after {
  content: "";
  position: absolute; top: -4px; bottom: -4px; width: 14px;
  background: url("${IMG.separator}") center / 100% 100% no-repeat;
  pointer-events: none;
}
${B} .slots.left::after { right: -12px; }
${B} .slots.right::after { left: -12px; transform: scaleX(-1); }

/* --- orb HP: rama w kształcie tsuby (osobna warstwa, przezroczysty środek) --- */
/* rama orba: żelazny pierścień z chmurami, pęknięcia z żarem, rogi u góry (rama-orba.webp, 248×264,
   otwór: środek 127/134 px, promień 72 px). Skala 0,694 → otwór r 50 px dokładnie na kulę (r 49);
   środek kuli w szablonie: x = 50% − 2 px, y = 55 px. */
${B} .hp-indicator-wrapper-template::before {
  content: "";
  position: absolute;
  left: calc(50% - 2px - 88px); top: calc(55px - 93px);
  width: 172px; height: 183px;
  z-index: 2;
  pointer-events: none;
  background: url("${IMG.ring}") center / 100% 100% no-repeat;
  filter: drop-shadow(0 2px 5px #000);
}
/* tło kuli (pusta część): głęboka czerń wody z ledwie widoczną czerwienią */
${B} .hp-indicator-wrapper { background: radial-gradient(circle at 50% 40%, #1a0707, #050202 70%) !important; }
${B} .hp-indicator-wrapper .glass { opacity: .55; }
/* ciecz: płynny żar wirujący w czarnej wodzie (ciecz-orba.webp – kafel bez szwów).
   Wysokość .blood ustawia gra (HP), overflow: hidden przycina ciecz do aktualnego poziomu.
   Tekstury są zakotwiczone u dołu kuli, więc przy zmianie HP ciecz nie „skacze”.
   Warstwy: .blood – nieruchoma tekstura (kafel 150 px) na ciemnym dnie,
            ::before – ta sama tekstura (kafel 110 px) płynąca po skosie w górę (tylko transform, pętla o 1 kafel),
            ::after – powierzchnia (jasny menisk) i cień przy brzegach kuli (nieruchome). */
${B} .hp-indicator .blood {
  overflow: hidden !important;
  background:
    url("${IMG.liquid}") left bottom / 150px 150px repeat,
    linear-gradient(#5c0d0d, #2a0404) !important;
}
${B} .hp-indicator .blood::before,
${B} .hp-indicator .blood::after {
  content: "";
  position: absolute;
  pointer-events: none;
}
${B} .hp-indicator .blood::before {
  left: -110px; bottom: -110px; width: 330px; height: 330px;
  background: url("${IMG.liquid}") 0 0 / 110px 110px repeat;
  mix-blend-mode: screen;
  opacity: .7;
}
${B} .hp-indicator .blood::after {
  inset: 0;
  background:
    linear-gradient(rgb(255 140 120 / .55), rgb(255 140 120 / 0) 2px),
    linear-gradient(rgb(0 0 0 / .35), transparent 6px),
    radial-gradient(ellipse 70% 120% at 50% 100%, transparent 55%, rgb(0 0 0 / .55) 100%);
}
html.${ON}.${FX}.tmg-ni .bottom-panel-of-bottom-positioner .hp-indicator .blood::before { animation: tmg-liquid 38s linear infinite; }
@keyframes tmg-liquid { from { transform: translate(0, 0); } to { transform: translate(110px, -110px); } }
${B} .hp-indicator-wrapper .value {
  color: var(--tmg-text) !important;
  font-weight: bold;
  text-shadow: 0 0 6px #000, 0 0 2px #000, 0 1px 1px #000 !important;
}

/* --- ping (lagmeter) usunięty: psuł symetrię paska --- */
${B} .lagmeter { display: none !important; }

/* --- pasek doświadczenia: dwie połówki gry (lewa 0–50 %, prawa 50–100 %, każda 235×11 px) wchodzą pod ramę orba.
   Rowek z czarnego lakieru w cienkiej ramie z płytek (jak panel), wypełnienie z tej samej cieczy-żaru co orb HP,
   z jasną linią powierzchni u góry i rozżarzonym czołem po prawej. Grafika ramki gry (.overlay) schowana. --- */
${B} .exp-bar-wrapper .exp-progress .overlay {
  background: none !important;
  filter: none !important;
  border-style: solid !important;
  border-width: 0 !important;
  border-image: var(--tmg-frame-thin) 9 10 10 9 / 4px / 0 round !important;
  box-shadow: 0 1px 4px rgb(0 0 0 / .8);
  pointer-events: none;
}
${B} .exp-bar-wrapper .exp-progress .progress {
  background: linear-gradient(#030202, #0e0a0a 60%, #070505) !important;
  box-shadow: inset 0 1px 2px #000, inset 0 0 0 1px rgb(92 13 13 / .45);
  overflow: hidden;
}
${B} .exp-bar-wrapper .exp-progress .progress .inner {
  position: relative;
  background:
    linear-gradient(rgb(255 150 130 / .6), rgb(255 150 130 / 0) 2px),
    linear-gradient(transparent 55%, rgb(0 0 0 / .45)),
    url("${IMG.liquid}") 0 50% / 64px 64px repeat,
    #5c0d0d !important;
  border-color: transparent !important;
}
/* rozżarzone czoło paska (gdzie kończy się doświadczenie) */
${B} .exp-bar-wrapper .exp-progress .progress .inner::after {
  content: "";
  position: absolute; right: 0; top: 0; bottom: 0; width: 3px;
  background: linear-gradient(90deg, transparent, rgb(255 120 90 / .85));
  box-shadow: 0 0 5px rgb(196 42 42 / .9);
  pointer-events: none;
}
${B} .exp-bar-wrapper .exp-progress .progress.noexp .inner {
  background: linear-gradient(rgb(230 220 207 / .35), transparent 2px), linear-gradient(#3a3430, #141110) !important;
}
${B} .exp-bar-wrapper .exp-progress .progress.noexp .inner::after { display: none; }

/* --- procent doświadczenia i stamina: sam tekst na pasku expa (bez tabliczek).
   Procent na środku widocznej części lewej połówki (352–553 px, dalej rama orba), stamina na środku
   prawej (723–925 px). Przesunięcie tylko przez transform – podpowiedzi gry działają. --- */
${B} .bottom-panel-pointer-bg .pointer-exp-graphic,
${B} .bottom-panel-pointer-bg .pointer-ttl-graphic { visibility: hidden !important; }
${B} .bottom-panel-pointer-bg .pointer-exp { transform: translate(-114px, -16px); }
${B} .bottom-panel-pointer-bg .pointer-ttl { transform: translate(109px, -16px); }
${B} .bottom-panel-pointer-bg .pointer-exp,
${B} .bottom-panel-pointer-bg .pointer-ttl {
  z-index: 3;
  color: var(--tmg-text) !important;
  font-weight: bold;
  font-size: 10px !important;
  line-height: 12px !important;
  text-align: center;
  text-shadow: 0 0 2px #000, 0 0 3px #000, 0 1px 1px #000, 0 0 1px #000;
}
`;

  // Popiół i żar: kafel 180×260 z kilkunastoma drobinami (szary popiół, nieliczne czerwone węgielki),
  // dwie warstwy o różnej skali i prędkości unoszą się powoli w górę. Tylko w bocznych kolumnach –
  // nigdy nad mapą gry. Pod treścią kolumn (isolation + z-index -1), więc nie zasłania tekstu.
  const ASH = (() => {
    let seed = 11;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const dots = [];
    for (let i = 0; i < 16; i++) {
      const x = Math.round(rnd() * 180), y = Math.round(rnd() * 260), r = (0.6 + rnd() * 1.1).toFixed(1);
      const ember = i % 5 === 0;
      const c = ember ? `rgb(196 42 42 / ${(0.55 + rnd() * 0.35).toFixed(2)})` : `rgb(150 140 130 / ${(0.25 + rnd() * 0.3).toFixed(2)})`;
      dots.push(`radial-gradient(${r}px ${r}px at ${x}px ${y}px, ${c}, transparent)`);
    }
    return dots.join(',\n    ');
  })();
  const F = `html.${ON}.${FX}.tmg-ni`;

  const cssAnim = `
@keyframes tmg-shine { 0% { background-position: 100% 0; } 60%, 100% { background-position: 0 0; } }
@keyframes tmg-mist { from { background-position: 0 100%, 0 100%; } to { background-position: 400px 100%, -300px 100%; } }
@keyframes tmg-ember-pulse { 0%, 100% { opacity: .55; } 50% { opacity: .85; } }

/* popiół i żar w bocznych kolumnach */
${F} .interface-layer > .main-column { isolation: isolate; }
${F} .interface-layer > .main-column::before {
  content: "";
  position: absolute; inset: 0;
  z-index: -1;
  pointer-events: none;
  background-image: ${ASH}, ${ASH};
  background-size: ${Array(16).fill('180px 260px').join(', ')}, ${Array(16).fill('270px 390px').join(', ')};
  animation: tmg-ash-a 34s linear infinite, tmg-ember-pulse 7s ease-in-out infinite;
}
@keyframes tmg-ash-a {
  from { background-position: ${Array(16).fill('0 0').join(', ')}, ${Array(16).fill('60px 0').join(', ')}; }
  to { background-position: ${Array(16).fill('0 -260px').join(', ')}, ${Array(16).fill('60px -780px').join(', ')}; }
}
/* nocna mgła u dołu kolumn: dwie szerokie smugi przesuwające się w przeciwne strony */
${F} .interface-layer > .main-column::after {
  content: "";
  position: absolute; left: 0; right: 0; bottom: 0; height: 45%;
  z-index: -1;
  pointer-events: none;
  background:
    radial-gradient(ellipse 60% 40% at 30% 100%, rgb(143 132 120 / .09), transparent 70%),
    radial-gradient(ellipse 50% 32% at 70% 100%, rgb(122 18 18 / .07), transparent 70%);
  background-size: 400px 100%, 300px 100%;
  background-repeat: repeat-x;
  animation: tmg-mist 60s linear infinite;
}
${N} .button, ${N} .border-window .card, ${N} .close-button, ${N} .widget-button { transition: box-shadow .2s ease, background-color .2s ease, filter .2s ease; }
@media (prefers-reduced-motion: reduce) {
  ${N} .button, ${N} .border-window .card, ${N} .close-button, ${N} .widget-button { transition: none !important; }
  ${N} *, ${N} *::before, ${N} *::after { animation: none !important; }
  #tmg-toggle, #tmg-toast { transition: none !important; }
}
`;

  /* =====================================================================
   * === PRZEŁĄCZNIK (tsuba w lewym dolnym rogu, skróty, menu Tampermonkey) ===
   * ===================================================================== */
  const cssToggle = `
#tmg-toggle {
  position: fixed; left: 8px; bottom: 8px; z-index: 2147483000;
  width: 28px; height: 28px; padding: 0; border: 0; border-radius: 50%;
  background: url("${IMG.toggle}") center / 100% 100% no-repeat;
  cursor: pointer;
  opacity: .55;
  box-shadow: 0 2px 4px rgb(0 0 0 / .7);
  transition: opacity .2s, box-shadow .2s, transform .3s;
}
#tmg-toggle:hover, #tmg-toggle:focus-visible { opacity: 1; outline: none; box-shadow: 0 0 10px rgb(196 42 42 / .55); transform: rotate(30deg); }
html:not(.${ON}) #tmg-toggle { filter: grayscale(1); opacity: .35; }
html.${ON}:not(.${FX}) #tmg-toggle { filter: saturate(.4); }
#tmg-toast {
  position: fixed; left: 40px; bottom: 10px; z-index: 2147483000;
  padding: 4px 10px;
  background: rgb(14 10 10 / .95); color: #e6dccf;
  font: 12px/1.4 Arial, sans-serif;
  border: 1px solid #5c0d0d; border-radius: 2px;
  box-shadow: 0 2px 8px rgb(0 0 0 / .8);
  opacity: 0; pointer-events: none; transition: opacity .25s;
}
#tmg-toast.show { opacity: 1; }
`;

  /* ─────────────────────────────────────────────────────────────────────────
   * PRZEMALOWANIE GRAFIK GRY W LOCIE (sprawdzone rozwiązanie z Dark Gothic)
   * Gra rysuje większość UI z plików /img/gui/*. Skrypt pobiera taki plik z serwera gry, przemalowuje
   * drewno/brąz/pergamin/szarości na czarny lakier (ciepła czerń), zostawia kolory znaczeniowe
   * (złoto, zieleń statusów, błękit, czerwone znaczniki, jasne ikony) i podmienia adres w regułach CSS
   * gry na wersję przemalowaną (blob:). Wyłączenie motywu przywraca oryginalne wartości.
   * ───────────────────────────────────────────────────────────────────────── */
  const GUI_URL = /url\(\s*["']?([^"')]*\/img\/gui\/[^"')]+\.(?:png|gif))(\?[^"')]*)?["']?\s*\)/gi;
  const KEEP = /\/img\/gui\/(?:cursor|item_frames|skills|map-icons|emo|buffs-in-fight|item-slot-anim|line-highlight|X-blackoutline|ok-blackoutline|triangle|search|zoom|battle-|outfit|krew|hpStateSprite|loader)/i;
  const IMG_PROPS = ['background-image', 'border-image-source', 'list-style-image'];
  const blobCache = new Map();
  const touched = new Map();

  function recolorPixels(ctx, w, h) {
    const id = ctx.getImageData(0, 0, w, h), a = id.data;
    for (let i = 0; i < a.length; i += 4) {
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
      if (s < 0.22 && l > 0.6) {                      // jasne ikony i glify – zostają czytelne, lekko ciepłe
        a[i] *= 0.9; a[i + 1] *= 0.86; a[i + 2] *= 0.81;
      } else if (warm || s < 0.22) {                  // drewno, brąz, pergamin, szarości → lakier
        const L = 0.022 + Math.pow(l, 1.45) * 0.4;
        a[i] = Math.min(255, L * 1.12 * 255); a[i + 1] = L * 0.92 * 255; a[i + 2] = L * 0.88 * 255;
      }
    }
    ctx.putImageData(id, 0, 0);
  }

  function recolored(path) {
    if (!blobCache.has(path)) {
      blobCache.set(path, (async () => {
        const r = await fetch(path, { credentials: 'same-origin' });
        if (!r.ok) return null;
        const bm = await createImageBitmap(await r.blob());
        const c = document.createElement('canvas');
        c.width = bm.width; c.height = bm.height;
        const x = c.getContext('2d', { willReadFrequently: true });
        x.drawImage(bm, 0, 0);
        recolorPixels(x, bm.width, bm.height);
        const blob = await new Promise((ok) => c.toBlob(ok, 'image/png'));
        return blob ? URL.createObjectURL(blob) : null;
      })().catch(() => null));
    }
    return blobCache.get(path);
  }

  function remember(rule, prop) {
    let m = touched.get(rule);
    if (!m) { m = {}; touched.set(rule, m); }
    if (!(prop in m)) m[prop] = [rule.style.getPropertyValue(prop), rule.style.getPropertyPriority(prop)];
  }
  function parseRgb(v) { const m = /rgba?\(\s*(\d+)[ ,]+(\d+)[ ,]+(\d+)(?:[ ,/]+([\d.]+))?/.exec(v || ''); return m ? [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]] : null; }
  function lum(v) { const c = parseRgb(v); if (!c || c[3] < 0.5) return -1; return (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255; }
  function neutral(v) { const c = parseRgb(v); if (!c || c[3] < 0.5) return false; return Math.max(c[0], c[1], c[2]) - Math.min(c[0], c[1], c[2]) < 24; }
  function soot(v, highlight) {
    const c = parseRgb(v); const L = (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255;
    const k = Math.round((highlight ? 0.09 + L * 0.26 : 0.035 + L * 0.17) * 255);
    return `rgba(${k + 5}, ${Math.max(0, k - 1)}, ${Math.max(0, k - 2)}, ${c[3]})`;
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
      if (nv !== v && root.classList.contains(ON)) { remember(rule, prop); st.setProperty(prop, nv, st.getPropertyPriority(prop)); }
    }
    const bg = st.getPropertyValue('background-color');
    if (lum(bg) > 0.72) {
      remember(rule, 'background-color'); st.setProperty('background-color', 'rgba(14, 10, 10, .94)', st.getPropertyPriority('background-color'));
      const col = st.getPropertyValue('color');
      if (lum(col) >= 0 && lum(col) < 0.45) { remember(rule, 'color'); st.setProperty('color', '#e6dccf', st.getPropertyPriority('color')); }
    } else if (neutral(bg) && lum(bg) > 0.2) {
      remember(rule, 'background-color'); st.setProperty('background-color', soot(bg, hl), st.getPropertyPriority('background-color'));
    }
    const bi = st.getPropertyValue('background-image');
    if (bi && bi.indexOf('gradient') !== -1 && bi.indexOf('blob:') === -1) {
      const nb = bi.replace(/rgba?\([^)]*\)/g, (c) => (neutral(c) && lum(c) > 0.2 ? soot(c, hl) : c));
      if (nb !== bi) { remember(rule, 'background-image'); st.setProperty('background-image', nb, st.getPropertyPriority('background-image')); }
    }
  }

  const seen = new WeakSet();
  function walk(rules, out) {
    for (const r of rules) {
      if (r.cssRules && !r.selectorText) { walk(r.cssRules, out); continue; }
      if (!r.style || !r.selectorText || seen.has(r) || r.selectorText.indexOf('tmg-') !== -1) continue;
      seen.add(r); out.push(r);
    }
  }
  function scanSheets() {
    if (!root.classList.contains(ON) || !root.classList.contains('tmg-ni')) return;
    const rules = [];
    for (const sh of document.styleSheets) { let rr; try { rr = sh.cssRules; } catch (e) { continue; } if (rr) walk(rr, rules); }
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
   * (neutralny → washi, kolorowy → ten sam odcień, rozjaśniony). Klasa .tmg-lt + zmienna --tmg-c.
   * ───────────────────────────────────────────────────────────────────────── */
  const TEXT_SCOPE = '.border-window, .tip-wrapper, .dialogue-window, .battle-controller';
  const marked = new Set();
  function lighter([r, g, b]) {
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    if (mx - mn < 28) return '#e6dccf';
    const k = 190 / Math.max(mx, 1);
    return `rgb(${Math.min(255, Math.round(r * k + 30))}, ${Math.min(255, Math.round(g * k + 30))}, ${Math.min(255, Math.round(b * k + 30))})`;
  }
  function fixText(scope) {
    if (!root.classList.contains(ON)) return;
    for (const el of scope.querySelectorAll('*')) {
      if (el.classList.contains('tmg-lt') || el.closest('.item, canvas')) continue;
      let hasText = false;
      for (const n of el.childNodes) if (n.nodeType === 3 && n.nodeValue.trim()) { hasText = true; break; }
      if (!hasText) continue;
      const c = parseRgb(getComputedStyle(el).color);
      if (!c || c[3] < 0.3) continue;
      if ((0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255 >= 0.36) continue;
      el.style.setProperty('--tmg-c', lighter(c));
      el.classList.add('tmg-lt');
      marked.add(el);
    }
  }
  function unfixText() {
    for (const el of marked) { el.classList.remove('tmg-lt'); el.style.removeProperty('--tmg-c'); }
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
  const style = addStyle([cssVars, cssBase, cssWindows, cssChat, cssInventory, cssTooltips, cssBattle, cssBars, cssBottomBar, cssAnim, cssToggle].join('\n'));
  if (style && 'id' in style) style.id = 'tmg-theme';


  const enabled = () => get(KEY_ON, true);
  const effects = () => get(KEY_FX, true);
  const apply = () => {
    root.classList.toggle(ON, enabled());
    root.classList.toggle(FX, enabled() && effects());
  };

  let toastTimer = 0;
  const toast = (msg) => {
    const t = document.getElementById('tmg-toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 1600);
  };
  const syncGraphics = () => {
    if (!root.classList.contains('tmg-ni')) return;
    if (enabled()) { reapplySheets(); document.querySelectorAll(TEXT_SCOPE).forEach(fixText); } else { restoreSheets(); unfixText(); }
  };
  const toggle = () => {
    set(KEY_ON, !enabled());
    apply();
    syncGraphics();
    arrangeHud();
    toast(enabled() ? 'Tamahagane: włączony' : 'Tamahagane: wyłączony');
  };
  const toggleFx = () => {
    set(KEY_FX, !effects());
    apply();
    toast(effects() ? 'Efekty (popiół, mgła): włączone' : 'Efekty (popiół, mgła): wyłączone');
  };

  const addToggleButton = () => {
    if (document.getElementById('tmg-toggle') || !document.body) return;
    const b = document.createElement('button');
    b.id = 'tmg-toggle';
    b.type = 'button';
    b.title = 'Tamahagane – klik: włącz/wyłącz motyw (Ctrl+Alt+H)\nPrawy klik: efekty popiołu i mgły (Ctrl+Alt+P)';
    b.setAttribute('aria-label', 'Przełącz motyw Tamahagane');
    b.addEventListener('click', (e) => { e.stopPropagation(); toggle(); });
    b.addEventListener('contextmenu', (e) => { e.preventDefault(); e.stopPropagation(); toggleFx(); });
    const t = document.createElement('div');
    t.id = 'tmg-toast';
    t.setAttribute('role', 'status');
    document.body.append(b, t);
  };

  // Górna tabliczka: nazwa świata trafia do rzędu z mapą i koordynatami (.map-data – flex w CSS),
  // żeby stała zaraz za nimi niezależnie od długości nazwy mapy. Wyłączenie motywu odkłada ją na miejsce.
  const arrangeHud = () => {
    const h = document.querySelector('.interface-layer .hud-container');
    if (!h) return;
    const md = h.querySelector('.map-data'), wn = h.querySelector('.world-name');
    if (!md || !wn) return;
    if (enabled()) { if (wn.parentElement !== md) md.appendChild(wn); }
    else if (wn.parentElement === md) md.after(wn);
  };
  let hudTimer = 0;
  const queueHud = () => { clearTimeout(hudTimer); hudTimer = setTimeout(arrangeHud, 300); };

  // obserwator stylów i nowych elementów (debounce) – startuje dopiero po wykryciu NI
  let sheetTimer = 0;
  const gfxObs = new MutationObserver((muts) => {
    if (!enabled()) return;
    let sheets = false;
    for (const m of muts) for (const n of m.addedNodes) {
      if (n.nodeName === 'STYLE' || n.nodeName === 'LINK') sheets = true;
      else queueFix(n);
    }
    queueHud();
    if (sheets) { clearTimeout(sheetTimer); sheetTimer = setTimeout(scanSheets, 80); }
  });

  // Wykrywanie NI po DOM (.game-window-positioner / .interface-layer). Bez tego klasa tmg-ni nie powstaje
  // i żadna reguła motywu nie działa (strona logowania, forum, SI).
  const DETECT_NI = '.game-window-positioner, .interface-layer';
  let started = false;
  const onGameFound = () => {
    if (started) return;
    started = true;
    root.classList.add('tmg-ni');
    addToggleButton();
    arrangeHud();
    scanSheets();
    document.querySelectorAll(TEXT_SCOPE).forEach(fixText);
    gfxObs.observe(root, { childList: true, subtree: true });
    let ticks = 0;
    const iv = setInterval(() => { scanSheets(); if (++ticks >= 40) clearInterval(iv); }, 3000);
  };
  let debounce = 0;
  const check = () => { if (document.body && document.querySelector(DETECT_NI)) { onGameFound(); detectObs.disconnect(); } };
  const detectObs = new MutationObserver(() => { clearTimeout(debounce); debounce = setTimeout(check, 150); });
  detectObs.observe(root, { childList: true, subtree: true });
  setTimeout(() => detectObs.disconnect(), 60000);
  check();

  apply();
  if (typeof GM_registerMenuCommand === 'function') {
    GM_registerMenuCommand('Tamahagane: włącz / wyłącz (Ctrl+Alt+H)', toggle);
    GM_registerMenuCommand('Tamahagane: efekty popiołu i mgły (Ctrl+Alt+P)', toggleFx);
  }
  window.addEventListener('keydown', (e) => {
    if (!e.ctrlKey || !e.altKey || e.shiftKey || e.metaKey) return;
    if (e.code === 'KeyH') { e.preventDefault(); toggle(); }
    else if (e.code === 'KeyP') { e.preventDefault(); toggleFx(); }
  }, true);

  console.info(`[Tamahagane] v${VERSION} ${enabled() ? 'włączony' : 'wyłączony'}`);
})();
