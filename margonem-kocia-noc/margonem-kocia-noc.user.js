// ==UserScript==
// @name         Margonem – Kocia Noc
// @namespace    https://github.com/Harkryn/Dodatki
// @version      1.1.0
// @description  Czarny, elegancki motyw z kotami i subtelnymi fioletowymi akcentami dla nowego interfejsu Margonem (NI). Ekran wczytywania, efekt legendy, kotki w kuli HP. Zmienia wyłącznie wygląd UI.
// @match        https://*.margonem.pl/*
// @match        https://margonem.pl/*
// @noframes
// @run-at       document-start
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @updateURL    https://raw.githubusercontent.com/Harkryn/Dodatki/main/margonem-kocia-noc/margonem-kocia-noc.user.js
// @downloadURL  https://raw.githubusercontent.com/Harkryn/Dodatki/main/margonem-kocia-noc/margonem-kocia-noc.user.js
// @supportURL   https://github.com/Harkryn/Dodatki
// ==/UserScript==

/*
 * Kocia Noc — co robi
 *  - Czarny interfejs; fiolet tylko jako akcent (cienkie linie, poświata, aktywne zakładki).
 *  - Kocie detale: uszy na oknach, łapki w nagłówkach i tooltipach, wzór łapek w tle,
 *    kot-maskotka na dolnej belce, kotki ganiające się w kuli HP, mrugające oczy w ciemności.
 *  - Ekran wczytywania gry (księżyc, kot na dachu) i efekt po zdobyciu legendy.
 *  - Wszystkie grafiki to SVG/CSS wygenerowane w kodzie — żadnych zewnętrznych obrazków.
 *
 * Zasady
 *  1. Działa WYŁĄCZNIE na nowym interfejsie (NI). Na SI i poza grą nic nie wstrzykuje.
 *     Ekran wczytywania pokazuje się tylko na świecie, na którym poprzednio wykryto NI.
 *  2. Reguły są ograniczone klasą `mkn-on` na <html>. Alt+T (albo kocia ikonka w lewym dolnym
 *     rogu) wyłącza motyw. Alt+K wyłącza kocie animacje. Alt+L pokazuje podgląd efektu legendy.
 *  3. Nie rusza mapy, ikon przedmiotów ani znaczników rzadkości. Nie wysyła żądań do serwera
 *     gry i nie wywołuje funkcji gry — legendę rozpoznaje wyłącznie po wyglądzie przedmiotów w DOM.
 *
 * Selektory pochodzą z diagnostyki działającej gry. „// ?” = przypuszczenie do sprawdzenia (F12).
 */

(() => {
  'use strict';

  if (window.top !== window.self) return;

  /* ======================================================================
   * KONFIGURACJA
   * ====================================================================== */

  const VERSION = '1.1.0';
  const KEY_ENABLED = 'mkn.enabled';
  const KEY_ANIM = 'mkn.mascot';                       // kocie animacje (kot, kotki w HP, oczy)
  const KEY_IFACE = 'mkn.iface.' + location.hostname;  // jaki interfejs był tu ostatnio
  const ROOT_CLASS = 'mkn-on';
  const ANIM_CLASS = 'mkn-mascot';
  const DETECT_TIMEOUT_MS = 45000;
  const LOG = (...a) => console.info('%c[Kocia Noc]', 'color:#b79cf0;font-weight:bold', ...a);

  /** Przełączniki funkcji — ustaw false, żeby wyłączyć. */
  const FEATURES = {
    catEars: true,        // uszy na oknach
    loadingScreen: true,  // ekran wczytywania
    legendEffect: true,   // efekt po zdobyciu legendy
    ambientEyes: true,    // mrugające oczy w ciemnych kolumnach
    hpKittens: true       // kotki w kuli HP
  };

  /** Prefiksy reguł. Dwa `:not(#…)` podbijają specyficzność, żeby wygrywać z innymi motywami. */
  const P = `html.${ROOT_CLASS}:not(#mkn-x):not(#mkn-y)`;
  const PA = `html.${ROOT_CLASS}.${ANIM_CLASS}:not(#mkn-x):not(#mkn-y)`;

  const DETECT = {
    ni: ['.game-window-positioner', '.interface-layer', '.game-layer', '.c-window'],
    si: ['#centerbox', '#base', '#ground']   // ? znaczniki SI
  };

  /** Selektory UI. Bez komentarza = potwierdzone w grze. „// ?” = przypuszczenie. */
  const SELECTORS = {
    /* === OKNA === */
    window:          ['.c-window'],
    windowOverlay:   ['.c-window > .border-image'],
    windowHeaderBox: ['.c-window > .header-label-positioner'],
    windowHeader:    ['.c-window .header-label'],
    windowTitle:     ['.c-window .header-label .text'],
    windowDecor:     ['.c-window .header-label .left-decor', '.c-window .header-label .right-decor'],
    windowContent:   ['.c-window > .content'],
    windowBottomBar: ['.c-window__bottom-bar .interface-element-bottom-bar-background-stretch',
                      '.bottom-panel-graphics .interface-element-bottom-bar-background-stretch'],
    windowSmallBtn:  ['.c-window .close-button-corner-decor', '.c-window .close-button',
                      '.transparent-window-buttons-menu > div'],
    innerPanel:      ['.interface-element-middle-1-background', '.window-wood-background'],
    headerBand:      ['.interface-element-header-2-background'],
    lootWindow:      ['.c-window.loot-wnd'],                        // z Legendary Frame Plus

    /* === RAMA INTERFEJSU === */
    barTop:          ['.interface-layer > .top.positioner > .bg'],
    barBottom:       ['.interface-layer > .bottom.positioner > .bg'],
    bottomBarHost:   ['.interface-layer > .bottom.positioner'],     // tu siedzi kot-maskotka
    column:          ['.interface-layer > .main-column'],
    columnBorder:    ['.interface-layer > .main-column > .border'],
    spriteArt:       ['.top.positioner .hud-container', '.bottom-panel .bottom-panel-graphic',
                      '.bottom-panel .pointer-exp-graphic', '.bottom-panel .pointer-ttl-graphic',
                      '.exp-bar-wrapper .overlay', '.interface-element-item-slot-grid-stretch'],

    /* === PRZYCISKI === */
    button:          ['.button'],
    buttonBg:        ['.button > .background'],
    buttonLabel:     ['.button > .label'],
    widget:          ['.widget-button'],

    /* === SLOTY === */
    slot:            ['.interface-element-one-item-slot-background-to-repeat'],

    /* === PASKI === */
    hpOrb:           ['.hp-indicator'],                               // kula HP (kotki biegają w środku)
    hpOrbBlood:      ['.hp-indicator .blood'],
    hpOrbGlass:      ['.hp-indicator-wrapper .glass'],
    barTrack:        ['[class*="interface-element-progress-bar-"]', '.progress-bar-wrapper',          // ? .progress-bar-wrapper
                      '.exp-bar-wrapper .exp-progress .progress'],
    hpFill:          ['.hero-hp-progress-bar .inner', '.hero-hp-top-progress-bar-light-mode .inner',
                      '.hp-progress-bar .inner', '.hp-progress-bar .progress-bar'],                   // ? dwa ostatnie
    mpFill:          ['.hero-mp-progress-bar .inner', '.hero-mana-progress-bar .inner',               // ? wszystkie
                      '.mp-progress-bar .inner', '.mana-progress-bar .inner', '.mp-progress-bar .progress-bar'],
    expFill:         ['.hero-exp-top-progress-bar-light-mode .inner', '.hero-exp-progress-bar .inner',
                      '.exp-bar-wrapper .exp-progress .progress .inner'],
    barValue:        ['[class*="interface-element-progress-bar-"] .value'],

    /* === CZAT === */
    chat:            ['.new-chat-window'],
    chatMessage:     ['.new-chat-window .new-chat-message'],
    chatTabs:        ['.chat-channel-card'],
    chatInput:       ['.new-chat-window input', '.new-chat-window textarea',
                      '.new-chat-window [contenteditable="true"]'],                                  // ?

    /* === SCROLLBARY GRY === */
    scrollTrack:     ['.scrollbar-wrapper .track'],
    scrollHandle:    ['.scrollbar-wrapper .track .handle'],

    /* === TOOLTIPY === (struktura do potwierdzenia — diagnostyka.js ma tryb przechwytywania) */
    tooltip:         ['.tip-wrapper', '.tw-tooltip'],                                                // ?
    tooltipItemName: ['.tip-wrapper .item-name', '.tip-wrapper .item-head .name'],                   // ?

    /* === POLA TEKSTOWE === */
    input:           ['.ni-input input', '.c-window input[type="text"]', '.c-window input[type="number"]',
                      '.c-window textarea'],
    inputFrame:      ['.ni-input.search-wrapper'],

    /* === EFEKT LEGENDY — gdzie szukać nowych przedmiotów === */
    legendItem:      ['.item .highlight.t-leg', '.item[data-item-type="t-leg"]'],                    // drugi: ?
    legendScope:     ['.loot-wnd', '.interface-layer'],     // torba/ekwipunek są w .interface-layer, łup w .loot-wnd

    /* === NIE RUSZAĆ — dokumentacja === */
    neverStyle:      ['#GAME_CANVAS', '.game-layer canvas', '.item .highlight', '.widget-button .icon']
  };

  /** Kolory rzadkości — muszą zostać rozpoznawalne. t-art to przypuszczenie. */
  const RARITY = {
    't-norm':     'var(--mkn-rar-common)',
    't-uniupg':   'var(--mkn-rar-unique)',
    't-her':      'var(--mkn-rar-heroic)',
    't-upgraded': 'var(--mkn-rar-upgraded)',
    't-leg':      'var(--mkn-rar-legendary)',
    't-art':      'var(--mkn-rar-artifact)'   // ?
  };

  /* ======================================================================
   * GRAFIKI SVG (generowane lokalnie)
   * ====================================================================== */

  const svgUrl = (svg) => `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
  const SVG = (vb, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}">${body}</svg>`;

  const PAW = (fill) =>
    `<g fill="${fill}"><ellipse cx="12" cy="16.2" rx="5.2" ry="4.4"/>` +
    `<ellipse cx="5.4" cy="10.2" rx="2.2" ry="2.8" transform="rotate(-18 5.4 10.2)"/>` +
    `<ellipse cx="9.4" cy="5.8" rx="2.2" ry="2.9" transform="rotate(-6 9.4 5.8)"/>` +
    `<ellipse cx="14.6" cy="5.8" rx="2.2" ry="2.9" transform="rotate(6 14.6 5.8)"/>` +
    `<ellipse cx="18.6" cy="10.2" rx="2.2" ry="2.8" transform="rotate(18 18.6 10.2)"/></g>`;

  /** Biegnący kot (bokiem, w prawo) — do kuli HP. */
  const RUNNING_CAT = (x, s) =>
    `<g transform="translate(${x} 0) scale(${s})">` +
    '<g fill="none" stroke="#050507" stroke-width="1.9" stroke-linecap="round">' +
    '<path d="M25 15 L31 19.5"/><path d="M23.5 15.5 L27.5 20.5"/><path d="M12.5 15 L6.5 19.5"/><path d="M14 15.5 L9.5 20.5"/>' +
    '<path d="M9.5 12 C5 11 3 7 4.6 4"/></g>' +
    '<g fill="#050507" stroke="#a98be0" stroke-width=".55" stroke-opacity=".8">' +
    '<ellipse cx="18" cy="13" rx="9" ry="4.3"/><circle cx="28.4" cy="9.6" r="3.9"/>' +
    '<path d="M25.9 7.2 L26.5 3.1 L28.7 6.1 Z"/><path d="M29.3 6 L31.7 3.1 L32.1 7.2 Z"/></g>' +
    '<circle cx="30" cy="9.2" r=".7" fill="#e8c25a"/></g>';

  const ICONS = {
    paw: svgUrl(SVG('0 0 24 24', PAW('#a98be0'))),
    pawDim: svgUrl(SVG('0 0 24 24', PAW('#2a2238'))),

    pawPattern: svgUrl(
      '<svg xmlns="http://www.w3.org/2000/svg" width="140" height="140" viewBox="0 0 140 140">' +
      `<g opacity=".045"><g transform="translate(18 92) rotate(-28) scale(.75)">${PAW('#c7b3ff')}</g>` +
      `<g transform="translate(46 70) rotate(-28) scale(.75)">${PAW('#c7b3ff')}</g>` +
      `<g transform="translate(84 34) rotate(-28) scale(.75)">${PAW('#c7b3ff')}</g>` +
      `<g transform="translate(112 12) rotate(-28) scale(.75)">${PAW('#c7b3ff')}</g></g></svg>`),

    ear: svgUrl(SVG('0 0 20 16',
      '<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2e2448"/><stop offset="1" stop-color="#000"/></linearGradient></defs>' +
      '<path d="M1 16 C2 10 4 4 7 1 C9 3 14 8 19 16 Z" fill="url(#g)" stroke="#7a62b0" stroke-width=".8" stroke-linejoin="round"/>' +
      '<path d="M5 15 C5.5 11 6.5 7 7.5 4.5 C9.5 7 12 10.5 14.5 15 Z" fill="#e3a3c6" opacity=".25"/>')),

    cat: svgUrl(SVG('0 0 64 64',
      '<defs><linearGradient id="r" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8f74d6" stop-opacity=".9"/><stop offset=".6" stop-color="#4b3b6e" stop-opacity=".5"/><stop offset="1" stop-color="#1e1928" stop-opacity="0"/></linearGradient></defs>' +
      '<g fill="#000" stroke="url(#r)" stroke-width="1.1" stroke-linejoin="round">' +
      '<path d="M44 61 C55 61 61 55 59 45 C58 40 54 40 54.5 43.5 C56 51 52 56.5 43 56.5 Z"/>' +
      '<path d="M18 62 C12 62 11 52 15 42 C18 34 22 30.5 28 30.5 C37 30.5 44 38 46 48 C47.5 56 45.5 62 39 62 Z"/>' +
      '<path d="M15.5 25 C14.5 18 15 10 16.5 4.5 C19.5 7.5 22 10 23.5 12.5 C25 12 28 12 29.5 12.5 C31 10 33.5 7.5 36.5 4.5 C38 10 38.5 18 37.5 25 C36.5 31 32 34 26.5 34 C21 34 16.5 31 15.5 25 Z"/>' +
      '</g><path d="M24.5 27.5 L26.5 29 L28.5 27.5" fill="none" stroke="#e3a3c6" stroke-opacity=".55" stroke-width=".9" stroke-linecap="round"/>')),

    catEyes: svgUrl(SVG('0 0 64 64',
      '<defs><radialGradient id="e"><stop offset="0" stop-color="#fff3c4"/><stop offset=".45" stop-color="#e8c25a"/><stop offset="1" stop-color="#b48a2a"/></radialGradient></defs>' +
      '<g fill="url(#e)"><ellipse cx="21.5" cy="22.5" rx="2.6" ry="2.2"/><ellipse cx="31.5" cy="22.5" rx="2.6" ry="2.2"/></g>' +
      '<g fill="#000"><ellipse cx="21.5" cy="22.5" rx=".7" ry="1.9"/><ellipse cx="31.5" cy="22.5" rx=".7" ry="1.9"/></g>')),

    // Para małych oczu świecących w ciemności
    smallEyes: svgUrl(SVG('0 0 34 12',
      '<defs><radialGradient id="e"><stop offset="0" stop-color="#f6f0ff"/><stop offset=".5" stop-color="#c3a8ff"/><stop offset="1" stop-color="#6a54a0"/></radialGradient></defs>' +
      '<g fill="url(#e)"><path d="M1 6 C3 1.5 9 1.5 11 6 C9 10.5 3 10.5 1 6 Z"/><path d="M23 6 C25 1.5 31 1.5 33 6 C31 10.5 25 10.5 23 6 Z"/></g>' +
      '<g fill="#000"><ellipse cx="6" cy="6" rx=".9" ry="3.6"/><ellipse cx="28" cy="6" rx=".9" ry="3.6"/></g>')),

    // Wielkie oko do efektu legendy (kolor legendy)
    legendEye: svgUrl(SVG('0 0 100 50',
      '<defs><radialGradient id="e" cx=".5" cy=".5" r=".6"><stop offset="0" stop-color="#fff2c9"/><stop offset=".35" stop-color="#ffb347"/><stop offset=".8" stop-color="#ff8c1a"/><stop offset="1" stop-color="#7a3300"/></radialGradient></defs>' +
      '<path d="M2 25 C18 2 82 2 98 25 C82 48 18 48 2 25 Z" fill="url(#e)" stroke="#2a1500" stroke-width="2"/>' +
      '<ellipse cx="50" cy="25" rx="5.5" ry="21" fill="#0a0503"/>' +
      '<ellipse cx="40" cy="16" rx="5" ry="3.2" fill="#fff" opacity=".55"/>')),

    // Dwa ganiające się kotki i kłębek włóczki — pasek do kuli HP
    kittens: svgUrl(SVG('0 0 120 24',
      RUNNING_CAT(0, 0.82) + RUNNING_CAT(44, 0.95) +
      '<circle cx="104" cy="17" r="4.2" fill="#9b7bd4"/>' +
      '<path d="M100.5 15 C103 16 105 18 107 20 M101 18.5 C103 17.5 106 15.5 107.5 15.5 M103 13 C104 15 104.5 18 104 21" fill="none" stroke="#e6dcff" stroke-width=".55" opacity=".8"/>' +
      '<path d="M99.9 17.5 C95 19 92 21 88 21" fill="none" stroke="#9b7bd4" stroke-width=".6"/>')),

    face: svgUrl(SVG('0 0 24 24',
      '<path d="M4 20 C3 15 3 8 4.5 3 C7 5 8.5 6.5 9.5 8 C11 7.6 13 7.6 14.5 8 C15.5 6.5 17 5 19.5 3 C21 8 21 15 20 20 C18.5 22 15.5 23 12 23 C8.5 23 5.5 22 4 20 Z" fill="#000" stroke="#a98be0" stroke-width="1.1" stroke-linejoin="round"/>' +
      '<ellipse cx="9" cy="14.2" rx="1.5" ry="1.7" fill="#e8c25a"/><ellipse cx="15" cy="14.2" rx="1.5" ry="1.7" fill="#e8c25a"/>' +
      '<path d="M11 18 L12 18.8 L13 18" fill="none" stroke="#e3a3c6" stroke-width=".9" stroke-linecap="round"/>'))
  };

  /* ======================================================================
   * STAN
   * ====================================================================== */

  const getVal = (k, d) => { try { return GM_getValue(k, d); } catch { return d; } };
  const setVal = (k, v) => { try { GM_setValue(k, v); } catch { /* brak zapisu */ } };
  const isEnabled = () => getVal(KEY_ENABLED, true) !== false;
  const isAnim = () => getVal(KEY_ANIM, true) !== false;
  const reducedMotion = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } };

  /* ======================================================================
   * EKRAN WCZYTYWANIA
   * Pokazywany od razu przy document-start, ale tylko tam, gdzie poprzednio wykryto NI.
   * Znika, gdy interfejs gry jest gotowy (albo po kliknięciu / Esc / 15 s).
   * ====================================================================== */

  const LOADER_CSS = `
#mkn-loader {
  position: fixed; inset: 0; z-index: 2147483646;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px;
  background:
    radial-gradient(ellipse 60% 45% at 72% 22%, rgba(110,84,170,.22), transparent 70%),
    radial-gradient(ellipse 80% 50% at 50% 100%, rgba(60,40,100,.18), transparent 70%),
    #000;
  color: #e6e0f0; cursor: pointer; user-select: none;
  font-family: 'Quicksand', 'Nunito', 'Segoe UI', sans-serif;
  opacity: 1; transition: opacity .7s ease;
}
#mkn-loader.mkn-out { opacity: 0; pointer-events: none; }
#mkn-loader .mkn-l-sky {
  position: absolute; inset: 0; pointer-events: none;
  background:
    radial-gradient(1.5px 1.5px at 12% 18%, #fff, transparent), radial-gradient(1px 1px at 28% 8%, #d9ccff, transparent),
    radial-gradient(1.5px 1.5px at 44% 26%, #fff, transparent), radial-gradient(1px 1px at 61% 12%, #fff, transparent),
    radial-gradient(1px 1px at 86% 40%, #d9ccff, transparent), radial-gradient(1.5px 1.5px at 92% 9%, #fff, transparent),
    radial-gradient(1px 1px at 8% 52%, #fff, transparent), radial-gradient(1px 1px at 35% 46%, #d9ccff, transparent),
    radial-gradient(1px 1px at 78% 62%, #fff, transparent), radial-gradient(1.5px 1.5px at 18% 72%, #d9ccff, transparent);
  animation: mkn-twinkle 4s ease-in-out infinite alternate;
}
#mkn-loader .mkn-l-moon {
  position: absolute; top: 13%; right: 20%; width: 74px; height: 74px; border-radius: 50%;
  box-shadow: inset -17px 9px 0 0 #ece6f7;
  filter: drop-shadow(0 0 22px rgba(195,168,255,.45));
  transform: rotate(-12deg);
}
#mkn-loader .mkn-l-scene { position: relative; width: 300px; height: 170px; }
#mkn-loader .mkn-l-cat {
  position: absolute; left: 50%; bottom: 2px; width: 150px; height: 150px; margin-left: -75px;
  background: ${ICONS.cat} center / contain no-repeat;
  filter: drop-shadow(0 0 14px rgba(155,123,212,.35));
}
#mkn-loader .mkn-l-cat i {
  position: absolute; inset: 0;
  background: ${ICONS.catEyes} center / contain no-repeat;
  transform-origin: 50% 35%;
  filter: drop-shadow(0 0 4px rgba(232,194,90,.9));
  animation: mkn-blink 4.5s infinite;
}
#mkn-loader .mkn-l-ledge {
  position: absolute; left: 0; right: 0; bottom: 0; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(195,168,255,.65), transparent);
}
#mkn-loader .mkn-l-title {
  font-weight: 700; font-size: 26px; letter-spacing: .42em; text-indent: .42em; text-transform: uppercase;
  background: linear-gradient(180deg, #f4efff, #a98be0);
  -webkit-background-clip: text; background-clip: text; color: transparent;
  filter: drop-shadow(0 0 12px rgba(155,123,212,.4));
}
#mkn-loader .mkn-l-sub { font-size: 12px; letter-spacing: .3em; text-transform: uppercase; color: #8d84a0; }
#mkn-loader .mkn-l-sub span { animation: mkn-dot 1.4s infinite; opacity: 0; }
#mkn-loader .mkn-l-sub span:nth-child(2) { animation-delay: .2s; }
#mkn-loader .mkn-l-sub span:nth-child(3) { animation-delay: .4s; }
#mkn-loader .mkn-l-paws { display: flex; gap: 14px; height: 22px; margin-top: 6px; }
#mkn-loader .mkn-l-paws i {
  width: 14px; height: 14px; background: ${ICONS.paw} center / contain no-repeat;
  opacity: 0; animation: mkn-pawstep 2.5s infinite;
}
#mkn-loader .mkn-l-paws i:nth-child(odd)  { transform: translateY(6px) rotate(80deg); }
#mkn-loader .mkn-l-paws i:nth-child(even) { transform: translateY(-2px) rotate(100deg); }
#mkn-loader .mkn-l-paws i:nth-child(2) { animation-delay: .3s; }
#mkn-loader .mkn-l-paws i:nth-child(3) { animation-delay: .6s; }
#mkn-loader .mkn-l-paws i:nth-child(4) { animation-delay: .9s; }
#mkn-loader .mkn-l-paws i:nth-child(5) { animation-delay: 1.2s; }
#mkn-loader .mkn-l-hint {
  position: absolute; bottom: 18px; font-size: 10px; letter-spacing: .25em; text-transform: uppercase; color: #4a4458;
}
@keyframes mkn-twinkle { from { opacity: .55; } to { opacity: 1; } }
@keyframes mkn-blink { 0%, 90%, 100% { transform: scaleY(1); } 93%, 96% { transform: scaleY(.08); } }
@keyframes mkn-dot { 0%, 100% { opacity: 0; } 40%, 70% { opacity: 1; } }
@keyframes mkn-pawstep { 0% { opacity: 0; } 15%, 55% { opacity: .9; } 85%, 100% { opacity: 0; } }
@media (prefers-reduced-motion: reduce) { #mkn-loader * { animation: none !important; opacity: 1; } }
`;

  let loader = null;
  let loaderShownAt = 0;

  function showLoader() {
    const mount = () => {
      if (loader || !document.documentElement) return !!loader;
      loader = document.createElement('div');
      loader.id = 'mkn-loader';
      loader.setAttribute('aria-hidden', 'true');
      loader.innerHTML =
        `<style>${LOADER_CSS}</style>` +
        '<div class="mkn-l-sky"></div><div class="mkn-l-moon"></div>' +
        '<div class="mkn-l-scene"><div class="mkn-l-cat"><i></i></div><div class="mkn-l-ledge"></div></div>' +
        '<div class="mkn-l-title">Kocia Noc</div>' +
        '<div class="mkn-l-sub">wczytywanie świata<span>.</span><span>.</span><span>.</span></div>' +
        '<div class="mkn-l-paws"><i></i><i></i><i></i><i></i><i></i></div>' +
        '<div class="mkn-l-hint">kliknij, aby pominąć</div>';
      loader.addEventListener('click', () => hideLoader(true));
      document.documentElement.appendChild(loader);
      loaderShownAt = Date.now();
      window.addEventListener('keydown', onLoaderKey, true);
      setTimeout(() => hideLoader(), 15000); // twardy limit — nigdy nie blokujemy gry dłużej
      return true;
    };
    if (mount()) return;
    const obs = new MutationObserver(() => { if (mount()) obs.disconnect(); });
    obs.observe(document, { childList: true });
  }

  function onLoaderKey(e) { if (e.key === 'Escape') hideLoader(true); }

  function hideLoader(immediate = false) {
    if (!loader) return;
    const el = loader;
    loader = null;
    window.removeEventListener('keydown', onLoaderKey, true);
    if (immediate === 'now') { el.remove(); return; }
    const wait = immediate ? 0 : Math.max(0, 900 - (Date.now() - loaderShownAt)); // min. 0,9 s, bez mignięcia
    setTimeout(() => {
      el.classList.add('mkn-out');
      setTimeout(() => el.remove(), 750);
    }, wait);
  }

  /** Gra gotowa: Engine.allInit (jeśli dostępny) albo obecność dolnej belki i canvasu mapy. */
  function whenGameReady(cb) {
    const W = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
    const started = Date.now();
    const iv = setInterval(() => {
      let ready = false;
      try {
        const eng = W.Engine;
        if (eng && typeof eng.allInit === 'boolean') ready = eng.allInit;   // ? nazwa flagi
        else ready = !!document.querySelector('.interface-layer > .bottom.positioner') && !!document.getElementById('GAME_CANVAS');
      } catch { ready = true; }
      if (ready || Date.now() - started > 15000) { clearInterval(iv); cb(); }
    }, 250);
  }

  /* ======================================================================
   * WYKRYWANIE INTERFEJSU
   * ====================================================================== */

  const anyMatch = (list) => list.some((s) => {
    try { return !!document.querySelector(s); } catch { return false; }
  });

  function detectInterface() {
    if (!document.body) return null;
    if (anyMatch(DETECT.ni)) return 'ni';
    if (anyMatch(DETECT.si)) return 'si';
    return null;
  }

  function whenInterfaceKnown(cb) {
    const first = detectInterface();
    if (first) return cb(first);
    let done = false, timer = 0, timeout = 0;
    const obs = new MutationObserver(() => {
      clearTimeout(timer); // debounce
      timer = setTimeout(() => { const r = detectInterface(); if (r) finish(r); }, 250);
    });
    function finish(result) {
      if (done) return;
      done = true;
      obs.disconnect();
      clearTimeout(timer);
      clearTimeout(timeout);
      cb(result);
    }
    obs.observe(document, { childList: true, subtree: true }); // document: documentElement bywa jeszcze null
    timeout = setTimeout(() => finish(detectInterface()), DETECT_TIMEOUT_MS);
  }

  /* ======================================================================
   * CSS MOTYWU
   * ====================================================================== */

  const S = (key, suffix = '') => SELECTORS[key].map((s) => `${P} ${s}${suffix}`).join(',\n');
  const SA = (key, suffix = '') => SELECTORS[key].map((s) => `${PA} ${s}${suffix}`).join(',\n');

  function buildCss() {
    const rarityCss = Object.entries(RARITY).map(([type, color]) => `
${P} .tip-wrapper[data-item-type="${type}"] { --mkn-rarity: ${color}; }
${P} .tip-wrapper[data-item-type="${type}"] .item-name { color: ${color} !important; }`).join('');

    const earsCss = !FEATURES.catEars ? '' : `
/* Kocie uszy — wystają nad nagłówkiem okna i lekko się przechylają, gdy najedziesz na okno */
${S('windowHeaderBox', '::before')},
${S('windowHeaderBox', '::after')} {
  content: '';
  position: absolute;
  top: -15px;
  width: 20px;
  height: 16px;
  background: ${ICONS.ear} center / contain no-repeat;
  pointer-events: none;
  z-index: 2;
  filter: drop-shadow(0 -1px 2px rgba(0,0,0,.6));
  transition: transform .25s ease;
}
${S('windowHeaderBox', '::before')} { left: 16px; transform-origin: 50% 100%; }
${S('windowHeaderBox', '::after')}  { right: 16px; transform: scaleX(-1); transform-origin: 50% 100%; }
${P} .c-window:hover > .header-label-positioner::before { transform: rotate(-6deg); }
${P} .c-window:hover > .header-label-positioner::after  { transform: scaleX(-1) rotate(-6deg); }`;

    const kittensCss = !FEATURES.hpKittens ? '' : `
/* Kotki ganiające kłębek w kuli HP — przebiegają co ~30 s (animowane tylko tło małego elementu) */
${SA('hpOrb', '::after')} {
  content: '';
  position: absolute;
  left: 9%; right: 9%; top: 9%; bottom: 9%;
  border-radius: 50%;
  background: ${ICONS.kittens} no-repeat;
  background-size: 66px auto;
  background-position: -90px 80%;
  pointer-events: none;
  z-index: 3;
  animation: mkn-kittens 30s linear 4s infinite;
}
@keyframes mkn-kittens {
  0%        { background-position: -90px 80%; }
  2.5%      { background-position: -55px 76%; }
  5%        { background-position: -20px 80%; }
  7.5%      { background-position: 15px 76%; }
  10%       { background-position: 50px 80%; }
  12.5%     { background-position: 85px 76%; }
  15%, 100% { background-position: 130px 80%; }
}`;

    return `
/* =====================================================================
 * ZMIENNE — zmień tutaj, żeby przemalować cały motyw
 * ===================================================================== */
html.${ROOT_CLASS} {
  --mkn-ink:        #000000;   /* czysta czerń — tło wszędzie, gdzie się da */
  --mkn-night:      #040405;   /* tło okien */
  --mkn-velvet:     #0b0a0e;   /* powierzchnie (przyciski, zakładki) */
  --mkn-velvet-2:   #15131b;   /* powierzchnie podniesione */
  --mkn-line:       #2a2436;   /* cienkie linie, ramki */
  --mkn-violet:     #9b7bd4;   /* główny akcent — używany oszczędnie */
  --mkn-violet-hi:  #c3a8ff;   /* poświata */
  --mkn-violet-lo:  #4b3b6e;
  --mkn-pink:       #e3a3c6;   /* „kocí nosek” — tylko drobne detale */
  --mkn-amber:      #e8c25a;   /* kocie oczy */
  --mkn-text:       #e9e4f3;
  --mkn-text-dim:   #a49cb4;

  --mkn-font-head:  'Quicksand', 'Nunito', 'Segoe UI', sans-serif;
  --mkn-font-body:  'Nunito', 'Quicksand', 'Segoe UI', sans-serif;

  --mkn-hp-1: #4a1027; --mkn-hp-2: #b8385f; --mkn-hp-3: #f08aa8;
  --mkn-mp-1: #1d2a63; --mkn-mp-2: #4a6ee0; --mkn-mp-3: #a8bcff;
  --mkn-xp-1: #2f2357; --mkn-xp-2: #7c5cd6; --mkn-xp-3: #c9b2ff;

  --mkn-rar-common:    #d9d4e3;
  --mkn-rar-unique:    #f2d75a;
  --mkn-rar-heroic:    #4fb4ff;
  --mkn-rar-upgraded:  #c58bff;
  --mkn-rar-legendary: #ff8c1a;
  --mkn-rar-artifact:  #ff4f4f;

  /* Sprite'y gry, których nie da się odtworzyć w CSS: przyciemnij i przesuń w chłodny fiolet */
  --mkn-sprite-filter: grayscale(.8) brightness(.45) sepia(.25) hue-rotate(215deg) saturate(1.4) contrast(1.08);

  --mkn-paws: ${ICONS.pawPattern};
  --mkn-frame-v: linear-gradient(90deg, #000, #241c38 35%, #6a54a0 50%, #241c38 65%, #000);
  --mkn-hairline: rgba(155,123,212,.38);
  --mkn-surface:
    radial-gradient(120% 70% at 50% 0%, rgba(155,123,212,.06), transparent 60%),
    var(--mkn-paws),
    #000;
  --mkn-ring: 0 0 0 1px rgba(195,168,255,.55), 0 0 10px rgba(155,123,212,.45);
}

/* =====================================================================
 * === OKNA ===
 * Jednolita czarna bryła: czarna ramka, cienka fioletowa linia na zewnątrz i delikatna
 * poświata od góry. Nagłówek nie ma własnego tła — tytuł „leży” na oknie, nie na pasku.
 * ===================================================================== */
${S('window')} {
  /* Ramka gry znika — tło okna wchodzi pod obramowanie, więc okno jest jedną bryłą */
  border-image: none !important;
  border-color: transparent !important;
  background-color: rgba(3,3,4,.97) !important;
  background-image:
    radial-gradient(90% 55% at 50% 0%, rgba(155,123,212,.10), transparent 70%),
    var(--mkn-paws) !important;
  background-clip: border-box !important;
  border-radius: 10px;
  box-shadow:
    0 0 0 1px var(--mkn-hairline),
    0 16px 40px rgba(0,0,0,.85),
    0 0 34px rgba(110,84,170,.16) !important;
  color: var(--mkn-text) !important;
}
${P} .c-window.transparent[data-opacity-lvl="1"] { background-color: rgba(3,3,4,.85) !important; }
${P} .c-window.transparent[data-opacity-lvl="2"] { background-color: rgba(3,3,4,.7) !important; }
${P} .c-window.transparent[data-opacity-lvl="3"] { background-color: rgba(3,3,4,.55) !important; }
${P} .c-window.transparent[data-opacity-lvl="4"] { background-color: rgba(3,3,4,.4) !important; }

${S('windowOverlay')} {
  border-image-source: none !important;
  border-color: transparent !important;
  background-image: none !important;
}
${S('windowContent')} {
  background-color: transparent !important;
  background-image: none !important;
  color: var(--mkn-text) !important;
  font-family: var(--mkn-font-body) !important;
}
/* Nagłówek: bez tła i ramek — tylko tekst i łapki; pod spodem wygaszająca się linia na całą szerokość */
${S('windowHeaderBox')} {
  background: linear-gradient(90deg, transparent 4%, rgba(155,123,212,.32) 50%, transparent 96%) 0 100% / 100% 1px no-repeat !important;
}
${S('windowHeader')} {
  background: none !important;
  border-image: none !important;
  border-color: transparent !important;
  box-shadow: none !important;
}
${S('windowTitle')} {
  font-family: var(--mkn-font-head) !important;
  font-weight: 600 !important;
  letter-spacing: .18em !important;
  text-transform: uppercase;
  font-size: 11px !important;
  color: #d9d0ea !important;
  text-shadow: 0 0 14px rgba(155,123,212,.45), 0 1px 0 #000 !important;
}
${S('windowDecor')} {
  background: ${ICONS.paw} center / 11px 11px no-repeat !important;
  border-image: none !important;
  opacity: .6;
}
${S('windowSmallBtn')} {
  filter: var(--mkn-sprite-filter);
  transition: filter .15s ease;
}
${S('windowSmallBtn', ':hover')} {
  filter: grayscale(.4) brightness(1.05) sepia(.3) hue-rotate(215deg) saturate(2) drop-shadow(0 0 4px rgba(195,168,255,.7));
}
/* Dolny pasek okna — przezroczysty, tylko cienka linia oddzielająca */
${S('windowBottomBar')},
${S('headerBand')} {
  border-image: none !important;
  border-color: transparent !important;
  background: linear-gradient(90deg, transparent 4%, rgba(155,123,212,.22) 50%, transparent 96%) 0 0 / 100% 1px no-repeat !important;
  box-shadow: none !important;
}
${S('innerPanel')} {
  border-image: none !important;
  border-color: transparent !important;
  background: rgba(255,255,255,.012) !important;
  box-shadow: inset 0 0 0 1px rgba(155,123,212,.12) !important;
  border-radius: 6px;
}
${earsCss}

/* =====================================================================
 * === RAMA INTERFEJSU ===
 * ===================================================================== */
${S('barTop')},
${S('barBottom')} {
  background:
    linear-gradient(90deg, transparent, rgba(155,123,212,.45) 50%, transparent) 0 0 / 100% 1px no-repeat,
    linear-gradient(90deg, transparent, rgba(155,123,212,.45) 50%, transparent) 0 100% / 100% 1px no-repeat,
    var(--mkn-paws),
    #000 !important;
  box-shadow: inset 0 0 0 1px #000 !important;
}
${S('column')} {
  background: var(--mkn-surface) !important;
}
${S('columnBorder')} {
  background: var(--mkn-frame-v) !important;
  box-shadow: 0 0 8px rgba(0,0,0,.9) !important;
}
${S('spriteArt')} {
  filter: var(--mkn-sprite-filter);
}

/* =====================================================================
 * === PRZYCISKI ===
 * ===================================================================== */
${S('buttonBg')} {
  background: linear-gradient(180deg, var(--mkn-velvet-2), var(--mkn-velvet)) !important;
  border: 1px solid var(--mkn-line) !important;
  border-radius: 7px !important;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.06), 0 1px 2px rgba(0,0,0,.6) !important;
  transition: box-shadow .18s ease, border-color .18s ease;
}
${P} .button.red > .background { background: linear-gradient(180deg, #2a0f1b, #160810) !important; }
${S('button', ':hover > .background')} {
  border-color: var(--mkn-violet) !important;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.08), 0 0 10px rgba(155,123,212,.45) !important;
}
${S('button', ':active > .background')} {
  box-shadow: inset 0 2px 6px rgba(0,0,0,.7) !important;
}
${S('buttonLabel')} {
  font-family: var(--mkn-font-head) !important;
  font-weight: 700 !important;
  letter-spacing: .04em !important;
  color: var(--mkn-text) !important;
  text-shadow: 0 1px 0 #000 !important;
}
${S('button', '.disabled > .label')} { color: var(--mkn-text-dim) !important; }

${S('widget')} {
  background: radial-gradient(circle at 50% 30%, #16131e, #000 75%) !important;
  border-color: var(--mkn-line) !important;
  box-shadow: 0 0 0 1px #000, inset 0 0 0 1px rgba(195,168,255,.12), inset 0 -3px 6px rgba(0,0,0,.6) !important;
  transition: box-shadow .18s ease;
}
${S('widget', ':hover')} {
  box-shadow: 0 0 0 1px #000, var(--mkn-ring) !important;
}
${S('widget', '.violet')},
${S('widget', '.blink-violet')} {
  box-shadow: 0 0 0 1px #000, inset 0 0 0 1px rgba(195,168,255,.6), 0 0 12px rgba(155,123,212,.55) !important;
}
${S('widget', '.blue')} {
  box-shadow: 0 0 0 1px #000, inset 0 0 0 1px rgba(168,188,255,.45) !important;
}
${S('widget', '.disabled')} { opacity: .5; }

/* =====================================================================
 * === SLOTY === (bez filtrów — przedmiot i jego rzadkość zostają nietknięte)
 * ===================================================================== */
${S('slot')} {
  background: radial-gradient(ellipse at 50% 35%, #100e15, #000 78%) !important;
  border-radius: 4px;
  box-shadow: inset 0 0 0 1px var(--mkn-line), inset 0 0 8px rgba(0,0,0,.85) !important;
}

/* =====================================================================
 * === PASKI ===
 * ===================================================================== */
${S('hpOrbBlood')} {
  filter: hue-rotate(-14deg) saturate(1.15) brightness(.9);
}
${S('hpOrbGlass')} {
  filter: grayscale(.5) brightness(.85) hue-rotate(215deg) saturate(1.3);
}
${kittensCss}
${S('barTrack')} {
  background-color: #000 !important;
  border-radius: 6px;
  box-shadow: inset 0 1px 3px #000, 0 0 0 1px var(--mkn-line) !important;
}
${S('hpFill')} {
  background: linear-gradient(180deg, rgba(255,255,255,.32), rgba(255,255,255,0) 50%, rgba(0,0,0,.25)),
              linear-gradient(90deg, var(--mkn-hp-1), var(--mkn-hp-2) 60%, var(--mkn-hp-3)) !important;
  border-radius: 6px;
}
${S('mpFill')} {
  background: linear-gradient(180deg, rgba(255,255,255,.32), rgba(255,255,255,0) 50%, rgba(0,0,0,.25)),
              linear-gradient(90deg, var(--mkn-mp-1), var(--mkn-mp-2) 60%, var(--mkn-mp-3)) !important;
  border-radius: 6px;
}
${S('expFill')} {
  background: linear-gradient(180deg, rgba(255,255,255,.3), rgba(255,255,255,0) 50%, rgba(0,0,0,.25)),
              linear-gradient(90deg, var(--mkn-xp-1), var(--mkn-xp-2) 60%, var(--mkn-xp-3)) !important;
  border-radius: 6px;
}
${S('barValue')} {
  font-family: var(--mkn-font-head) !important;
  font-weight: 700 !important;
  color: #fff !important;
  text-shadow: 0 1px 2px #000, 0 0 3px #000 !important;
}

/* =====================================================================
 * === CZAT ===
 * ===================================================================== */
${S('chat')} {
  background: var(--mkn-surface) !important;
}
${S('chatMessage')} {
  font-family: var(--mkn-font-body) !important;
  filter: saturate(.85);
  text-shadow: 0 1px 1px rgba(0,0,0,.9);
}
${S('chatTabs')} {
  background: var(--mkn-velvet) !important;
  border-color: var(--mkn-line) !important;
  border-radius: 6px 6px 0 0 !important;
  box-shadow: none !important;
  color: var(--mkn-text-dim) !important;
  font-family: var(--mkn-font-head) !important;
  font-weight: 700 !important;
  transition: background-color .15s ease;
}
${S('chatTabs', ':hover')} { background: var(--mkn-velvet-2) !important; }
${S('chatTabs', '.active')} {
  background: var(--mkn-velvet-2) !important;
  box-shadow: inset 0 -2px 0 var(--mkn-violet) !important;
  color: var(--mkn-text) !important;
}
${S('chatInput')} {
  background: rgba(0,0,0,.95) !important;
  color: var(--mkn-text) !important;
  border-color: var(--mkn-line) !important;
  caret-color: var(--mkn-violet-hi);
}

/* =====================================================================
 * === SCROLLBARY ===
 * ===================================================================== */
${S('scrollTrack')} {
  background: rgba(0,0,0,.9) !important;
  border-radius: 4px;
  box-shadow: inset 0 0 0 1px var(--mkn-line) !important;
}
${S('scrollHandle')} {
  background: linear-gradient(180deg, var(--mkn-violet), var(--mkn-violet-lo)) !important;
  border-radius: 4px !important;
  box-shadow: 0 0 6px rgba(155,123,212,.45) !important;
}
${P} .interface-layer *, ${P} .c-window *, ${P} .tip-wrapper * {
  scrollbar-width: thin;
  scrollbar-color: var(--mkn-violet-lo) var(--mkn-ink);
}
html.${ROOT_CLASS} ::-webkit-scrollbar { width: 8px; height: 8px; }
html.${ROOT_CLASS} ::-webkit-scrollbar-track { background: var(--mkn-ink); }
html.${ROOT_CLASS} ::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, var(--mkn-violet), var(--mkn-violet-lo));
  border: 2px solid var(--mkn-ink);
  border-radius: 8px;
}
html.${ROOT_CLASS} ::-webkit-scrollbar-corner { background: var(--mkn-ink); }

/* =====================================================================
 * === TOOLTIPY ===
 * Czarna karta z kolorem rzadkości na górnej krawędzi i delikatną poświatą w tym kolorze.
 * Wewnętrzne sekcje tracą swoje tła/ramki (pergamin gry), ale NIE ruszamy:
 *  - kolorów tekstu (bonusy, wymagania, rzadkość),
 *  - grafik z atrybutu style (ikona przedmiotu ustawiana przez grę inline).
 * ===================================================================== */
${S('tooltip')} {
  --mkn-rarity: var(--mkn-violet);
  background-color: #020203 !important;
  background-image:
    ${ICONS.pawDim},
    radial-gradient(130% 50% at 50% 0%, color-mix(in srgb, var(--mkn-rarity) 16%, transparent), transparent 70%) !important;
  background-repeat: no-repeat !important;
  background-size: 22px 22px, 100% 100% !important;
  background-position: right 7px bottom 7px, 0 0 !important;
  border: 1px solid rgba(155,123,212,.28) !important;
  border-top: 2px solid var(--mkn-rarity) !important;
  border-image: none !important;
  border-radius: 10px !important;
  box-shadow: 0 12px 30px rgba(0,0,0,.85), 0 0 0 1px #000, 0 -4px 18px -6px var(--mkn-rarity) !important;
  color: var(--mkn-text) !important;
  font-family: var(--mkn-font-body) !important;
}
${P} .tip-wrapper *:not(.item):not(img):not([style*="background"]):not([class*="icon"]) {
  background-color: transparent !important;
  background-image: none !important;
  border-image: none !important;
  box-shadow: none !important;
}
${P} .tip-wrapper [class*="section"],
${P} .tip-wrapper [class*="separator"],
${P} .tip-wrapper hr {
  border-color: rgba(155,123,212,.18) !important;
}
/* Kontenery tooltipa dostają jasny tekst (gra ustawia tu ciemny pod pergamin). Elementy z własnym
   kolorem (bonusy, wymagania, rzadkość) mają go na sobie, więc go zachowują. */
${P} .tip-wrapper > *,
${P} .tip-wrapper .content,
${P} .tip-wrapper [class*="section"],
${P} .tip-wrapper [class*="head"],
${P} .tip-wrapper [class*="description"] {
  color: var(--mkn-text) !important;
}
${S('tooltipItemName')} {
  font-family: var(--mkn-font-head) !important;
  font-weight: 700 !important;
  letter-spacing: .02em !important;
  text-shadow: 0 0 10px color-mix(in srgb, var(--mkn-rarity) 45%, transparent), 0 1px 0 #000 !important;
}
${rarityCss}

/* =====================================================================
 * === POLA TEKSTOWE ===
 * ===================================================================== */
${S('input')} {
  background: rgba(0,0,0,.95) !important;
  color: var(--mkn-text) !important;
}
${S('inputFrame')} {
  border-image: linear-gradient(180deg, #2a2436, #15131b) 1 !important;
  background-color: rgba(0,0,0,.95) !important;
}

/* =====================================================================
 * === KOT-MASKOTKA === (siedzi na dolnej belce, mruga)
 * ===================================================================== */
${SA('bottomBarHost', '::before')},
${SA('bottomBarHost', '::after')} {
  content: '';
  position: absolute;
  right: 230px;          /* ? przesuń, jeśli kot zasłania coś na belce */
  bottom: calc(100% - 6px);
  width: 46px;
  height: 46px;
  pointer-events: none;
  z-index: 5;
}
${SA('bottomBarHost', '::before')} {
  background: ${ICONS.cat} center / contain no-repeat;
  filter: drop-shadow(0 0 6px rgba(155,123,212,.35));
}
${SA('bottomBarHost', '::after')} {
  background: ${ICONS.catEyes} center / contain no-repeat;
  transform-origin: 50% 35%;
  animation: mkn-blink 7s infinite;
  filter: drop-shadow(0 0 2px rgba(232,194,90,.8));
}
@keyframes mkn-blink {
  0%, 92%, 100% { transform: scaleY(1); }
  94%, 96%      { transform: scaleY(.08); }
}

/* =====================================================================
 * === OCZY W CIEMNOŚCI === (co jakiś czas w czarnej kolumnie otwiera się para oczu)
 * ===================================================================== */
${P} .mkn-amb-eyes {
  position: absolute;
  width: 30px; height: 11px;
  background: ${ICONS.smallEyes} center / contain no-repeat;
  filter: drop-shadow(0 0 5px rgba(195,168,255,.7));
  pointer-events: none;
  z-index: 0;
  opacity: 0;
  animation: mkn-amb 4.6s ease-in-out forwards;
}
@keyframes mkn-amb {
  0%   { opacity: 0;   transform: scaleY(.05); }
  10%  { opacity: .75; transform: scaleY(1); }
  36%  { transform: scaleY(1); }
  39%  { transform: scaleY(.06); }
  43%  { transform: scaleY(1); }
  70%  { opacity: .75; transform: scaleY(1) translateX(0); }
  78%  { transform: scaleY(1) translateX(3px); }
  86%  { opacity: .6;  transform: scaleY(.06) translateX(3px); }
  100% { opacity: 0;   transform: scaleY(.05) translateX(3px); }
}

/* =====================================================================
 * === EFEKT LEGENDY ===
 * ===================================================================== */
#mkn-legend {
  position: fixed; inset: 0; z-index: 2147483600; pointer-events: none;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px;
  animation: mkn-lg-fade 4.2s ease forwards;
  font-family: var(--mkn-font-head);
}
#mkn-legend .mkn-lg-vignette {
  position: absolute; inset: 0;
  background: radial-gradient(ellipse at 50% 42%, transparent 25%, rgba(0,0,0,.78) 100%);
  box-shadow: inset 0 0 140px rgba(255,140,26,.35);
  animation: mkn-lg-pulse 1.4s ease-in-out 2;
}
#mkn-legend .mkn-lg-eyes { position: relative; display: flex; gap: 46px; margin-top: -60px; }
#mkn-legend .mkn-lg-eyes i {
  width: 96px; height: 48px;
  background: ${ICONS.legendEye} center / contain no-repeat;
  filter: drop-shadow(0 0 14px rgba(255,140,26,.85)) drop-shadow(0 0 40px rgba(255,140,26,.45));
  transform: scaleY(.04);
  animation: mkn-lg-eye 4.2s ease forwards;
}
#mkn-legend .mkn-lg-eyes i:last-child { transform: scaleX(-1) scaleY(.04); animation-name: mkn-lg-eye-r; }
#mkn-legend .mkn-lg-title {
  position: relative; margin-top: 18px;
  font-size: 30px; font-weight: 700; letter-spacing: .55em; text-indent: .55em; text-transform: uppercase;
  background: linear-gradient(180deg, #fff2c9, #ffb347 45%, #ff8c1a);
  -webkit-background-clip: text; background-clip: text; color: transparent;
  filter: drop-shadow(0 0 12px rgba(255,140,26,.7));
  opacity: 0; animation: mkn-lg-text 4.2s ease forwards;
}
#mkn-legend .mkn-lg-sub {
  position: relative; font-size: 11px; letter-spacing: .35em; text-transform: uppercase; color: #d9c6a8;
  opacity: 0; animation: mkn-lg-text 4.2s ease .15s forwards;
}
#mkn-legend .mkn-lg-burst { position: absolute; left: 50%; top: 46%; }
#mkn-legend .mkn-lg-burst b {
  position: absolute; width: 18px; height: 18px; margin: -9px;
  background: ${ICONS.paw} center / contain no-repeat;
  filter: hue-rotate(150deg) saturate(2.4) brightness(1.3) drop-shadow(0 0 6px rgba(255,140,26,.8));
  opacity: 0;
  animation: mkn-lg-paw 2.4s ease-out .5s forwards;
}
@keyframes mkn-lg-fade  { 0% { opacity: 0; } 8% { opacity: 1; } 82% { opacity: 1; } 100% { opacity: 0; } }
@keyframes mkn-lg-pulse { 50% { box-shadow: inset 0 0 200px rgba(255,140,26,.55); } }
@keyframes mkn-lg-eye {
  0% { transform: scaleY(.04); } 12% { transform: scaleY(1); }
  34% { transform: scaleY(1); } 37% { transform: scaleY(.06); } 41% { transform: scaleY(1); }
  58% { transform: scaleY(1); } 61% { transform: scaleY(.06); } 65% { transform: scaleY(1); }
  84% { transform: scaleY(1); } 92%, 100% { transform: scaleY(.04); }
}
@keyframes mkn-lg-eye-r {
  0% { transform: scaleX(-1) scaleY(.04); } 12% { transform: scaleX(-1) scaleY(1); }
  34% { transform: scaleX(-1) scaleY(1); } 37% { transform: scaleX(-1) scaleY(.06); } 41% { transform: scaleX(-1) scaleY(1); }
  58% { transform: scaleX(-1) scaleY(1); } 61% { transform: scaleX(-1) scaleY(.06); } 65% { transform: scaleX(-1) scaleY(1); }
  84% { transform: scaleX(-1) scaleY(1); } 92%, 100% { transform: scaleX(-1) scaleY(.04); }
}
@keyframes mkn-lg-text { 0%, 15% { opacity: 0; transform: translateY(6px); } 25%, 82% { opacity: 1; transform: none; } 100% { opacity: 0; } }
@keyframes mkn-lg-paw {
  0%   { opacity: 0;  transform: rotate(var(--a)) translateY(0) scale(.3); }
  20%  { opacity: .95; }
  100% { opacity: 0;  transform: rotate(var(--a)) translateY(-190px) scale(1.1); }
}

@media (prefers-reduced-motion: reduce) {
  html.${ROOT_CLASS} *::after, html.${ROOT_CLASS} .mkn-amb-eyes { animation: none !important; }
}

/* =====================================================================
 * === ZABEZPIECZENIE: mapa i znaczniki rzadkości bez filtrów ===
 * ===================================================================== */
${P} #GAME_CANVAS, ${P} .item .highlight { filter: none !important; }
`;
  }

  const TOGGLE_CSS = `
#mkn-toggle {
  position: fixed; left: 6px; bottom: 6px; z-index: 2147483000;
  width: 26px; height: 26px; padding: 0; margin: 0;
  background: ${ICONS.face} center / 20px 20px no-repeat, #000;
  border: 1px solid #2a2436; border-radius: 50%;
  box-shadow: 0 2px 6px rgba(0,0,0,.7);
  opacity: .45; cursor: pointer;
  transition: opacity .18s ease, box-shadow .18s ease, transform .18s ease;
}
#mkn-toggle:hover, #mkn-toggle:focus-visible {
  opacity: 1; outline: none; transform: translateY(-1px);
  box-shadow: 0 0 0 1px rgba(195,168,255,.55), 0 0 10px rgba(155,123,212,.5);
}
#mkn-toggle[aria-pressed="false"] { filter: grayscale(1); }
`;

  /* ======================================================================
   * WSTRZYKIWANIE
   * ====================================================================== */

  let themeStyle = null;
  let toggleStyle = null;

  function addStyle(css, id) {
    let el;
    try { el = GM_addStyle(css); } catch { /* fallback */ }
    if (!el || !(el instanceof Element)) {
      el = document.createElement('style');
      el.textContent = css;
      (document.head || document.documentElement).appendChild(el);
    }
    el.id = id;
    return el;
  }

  function loadFonts() {
    if (document.getElementById('mkn-fonts')) return;
    const link = document.createElement('link');
    link.id = 'mkn-fonts';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&family=Quicksand:wght@500;600;700&display=swap';
    (document.head || document.documentElement).appendChild(link);
  }

  function keepStyleLast() {
    const head = document.head;
    if (!head) return;
    let t = 0;
    new MutationObserver(() => {
      clearTimeout(t);
      t = setTimeout(() => {
        if (themeStyle && head.lastElementChild !== themeStyle) head.appendChild(themeStyle);
      }, 500);
    }).observe(head, { childList: true });
  }

  function applyState() {
    const on = isEnabled();
    const root = document.documentElement;
    root.classList.toggle(ROOT_CLASS, on);
    root.classList.toggle(ANIM_CLASS, isAnim());
    const btn = document.getElementById('mkn-toggle');
    if (btn) {
      btn.setAttribute('aria-pressed', String(on));
      btn.title = `Kocia Noc: ${on ? 'włączona' : 'wyłączona'} (Alt+T) · kocie animacje: Alt+K · podgląd legendy: Alt+L`;
    }
  }

  function toggleTheme() {
    setVal(KEY_ENABLED, !isEnabled());
    applyState();
    LOG(isEnabled() ? 'motyw włączony' : 'motyw wyłączony');
  }

  function toggleAnim() {
    setVal(KEY_ANIM, !isAnim());
    applyState();
    LOG(isAnim() ? 'koty wróciły' : 'koty poszły spać');
  }

  function createToggle() {
    if (document.getElementById('mkn-toggle') || !document.body) return;
    const btn = document.createElement('button');
    btn.id = 'mkn-toggle';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Przełącz motyw Kocia Noc');
    btn.addEventListener('mousedown', (e) => e.stopPropagation()); // kliknięcie nie trafia do gry
    btn.addEventListener('click', (e) => { e.stopPropagation(); e.preventDefault(); toggleTheme(); });
    document.body.appendChild(btn);
    applyState();
  }

  function onKey(e) {
    if (!e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    if (e.code === 'KeyT') { e.preventDefault(); e.stopPropagation(); toggleTheme(); }
    else if (e.code === 'KeyK') { e.preventDefault(); e.stopPropagation(); toggleAnim(); }
    else if (e.code === 'KeyL') { e.preventDefault(); e.stopPropagation(); playLegend(true); }
  }

  /* ======================================================================
   * EFEKT LEGENDY
   * Patrzymy tylko na DOM: nowy przedmiot z oznaczeniem legendy (t-leg), który pojawił się
   * w oknie łupu albo w torbie/ekwipunku i którego identyfikatora nie widzieliśmy nigdzie wcześniej
   * (przedmioty wyjęte z depozytu czy handlu były już widoczne w ich oknach — nie liczą się).
   * ====================================================================== */

  const seenLegends = new Set();
  let legendWarmUntil = 0;
  let lastLegendFx = 0;

  function playLegend(force = false) {
    if (!isEnabled() || !document.body) return;
    if (!force && Date.now() - lastLegendFx < 8000) return;
    lastLegendFx = Date.now();
    document.getElementById('mkn-legend')?.remove();
    const fx = document.createElement('div');
    fx.id = 'mkn-legend';
    fx.setAttribute('aria-hidden', 'true');
    const paws = Array.from({ length: 10 }, (_, i) => `<b style="--a:${i * 36 + 8}deg;animation-delay:${0.45 + (i % 3) * 0.08}s"></b>`).join('');
    fx.innerHTML =
      '<div class="mkn-lg-vignette"></div>' +
      `<div class="mkn-lg-burst">${paws}</div>` +
      '<div class="mkn-lg-eyes"><i></i><i></i></div>' +
      '<div class="mkn-lg-title">Legenda</div>' +
      '<div class="mkn-lg-sub">kocie szczęście dopisało</div>';
    document.body.appendChild(fx);
    setTimeout(() => fx.remove(), 4400);
  }

  function itemId(item) {
    for (const c of item.classList) if (c.startsWith('item-id-')) return c;
    return null;
  }

  function scanLegends() {
    if (!FEATURES.legendEffect) return;
    const armed = Date.now() > legendWarmUntil;
    let fire = false;
    let nodes;
    try { nodes = document.querySelectorAll(SELECTORS.legendItem.join(',')); } catch { return; }
    for (const el of nodes) {
      const item = el.classList.contains('item') ? el : el.closest('.item');
      if (!item) continue;
      const id = itemId(item);
      if (!id || seenLegends.has(id)) continue;
      seenLegends.add(id);
      if (armed && SELECTORS.legendScope.some((s) => item.closest(s))) fire = true;
    }
    if (fire) { LOG('legenda!'); playLegend(); }
  }

  function watchLegends() {
    if (!FEATURES.legendEffect) return;
    // Rozgrzewka: przez pierwsze 15 s gra wczytuje torbę — tylko zapamiętujemy, co już jest.
    legendWarmUntil = Date.now() + 15000;
    let scheduled = false;
    new MutationObserver(() => {
      if (scheduled) return;           // throttle: co najwyżej jedno skanowanie na 400 ms
      scheduled = true;
      setTimeout(() => { scheduled = false; scanLegends(); }, 400);
    }).observe(document.body, { childList: true, subtree: true });
    scanLegends();
  }

  /* ======================================================================
   * OCZY W CIEMNOŚCI
   * ====================================================================== */

  function scheduleAmbientEyes() {
    if (!FEATURES.ambientEyes) return;
    const next = 22000 + Math.random() * 26000;
    setTimeout(() => {
      try { spawnEyes(); } finally { scheduleAmbientEyes(); }
    }, next);
  }

  function spawnEyes() {
    if (!isEnabled() || !isAnim() || document.hidden || reducedMotion()) return;
    const cols = [...document.querySelectorAll(SELECTORS.column.join(','))].filter((c) => c.offsetWidth > 60 && c.offsetHeight > 160);
    if (!cols.length) return;
    const col = cols[Math.floor(Math.random() * cols.length)];
    const eyes = document.createElement('div');
    eyes.className = 'mkn-amb-eyes';
    eyes.setAttribute('aria-hidden', 'true');
    eyes.style.left = `${12 + Math.random() * Math.max(0, col.offsetWidth - 54)}px`;
    eyes.style.top = `${20 + Math.random() * Math.max(0, col.offsetHeight - 60)}px`;
    col.appendChild(eyes);
    setTimeout(() => eyes.remove(), 4800);
  }

  /* ======================================================================
   * START
   * ====================================================================== */

  /** Samonaprawianie co 3 s: przywraca styl, klasy na <html> i przycisk, jeśli coś je usunęło. */
  function heal() {
    const host = document.head || document.documentElement;
    if (themeStyle && !themeStyle.isConnected) host.appendChild(themeStyle);
    if (toggleStyle && !toggleStyle.isConnected) host.appendChild(toggleStyle);
    const root = document.documentElement;
    if (root.classList.contains(ROOT_CLASS) !== isEnabled() || root.classList.contains(ANIM_CLASS) !== isAnim()) applyState();
    createToggle();
  }

  function start() {
    toggleStyle = addStyle(TOGGLE_CSS, 'mkn-toggle-style');
    loadFonts();
    themeStyle = addStyle(buildCss(), 'mkn-theme-style');
    keepStyleLast();
    createToggle();
    applyState();
    window.addEventListener('keydown', onKey, true);
    setInterval(heal, 3000);
    watchLegends();
    scheduleAmbientEyes();
    whenGameReady(() => hideLoader());
    LOG(`v${VERSION} aktywna. Alt+T — motyw, Alt+K — kocie animacje, Alt+L — podgląd legendy.`);
  }

  // Ekran wczytywania — od razu, jeśli ten świat ostatnio działał na NI.
  if (FEATURES.loadingScreen && isEnabled() && getVal(KEY_IFACE, '') === 'ni') showLoader();

  whenInterfaceKnown((iface) => {
    setVal(KEY_IFACE, iface || 'none');
    if (iface !== 'ni') {
      hideLoader('now');
      LOG(iface === 'si' ? 'stary interfejs (SI) — motyw nieaktywny.' : 'nie wykryto gry — motyw nieaktywny.');
      return;
    }
    if (document.body) start();
    else document.addEventListener('DOMContentLoaded', start, { once: true });
  });
})();
