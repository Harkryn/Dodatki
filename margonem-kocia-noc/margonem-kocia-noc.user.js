// ==UserScript==
// @name         Margonem – Kocia Noc
// @namespace    https://github.com/Harkryn/Dodatki
// @version      1.0.0
// @description  Ciemny, elegancki motyw z kotami i subtelnymi fioletowymi akcentami dla nowego interfejsu Margonem (NI). Zmienia wyłącznie wygląd UI.
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
 *  - Ciemny, aksamitny interfejs w odcieniach atramentowej śliwki; fiolet tylko jako akcent
 *    (cienkie linie, poświata przy najechaniu, aktywne zakładki).
 *  - Kocie detale: uszy na oknach, łapki w nagłówkach okien, delikatny wzór łapek w tle,
 *    kot-maskotka siedzący na dolnej belce (mruga), kocia ikonka przełącznika.
 *  - Wszystkie grafiki to SVG wygenerowane w kodzie — żadnych zewnętrznych obrazków.
 *
 * Zasady
 *  1. Działa WYŁĄCZNIE na nowym interfejsie (NI). Na SI i poza grą nic nie wstrzykuje.
 *  2. Wszystkie reguły są ograniczone klasą `mkn-on` na <html>. Alt+T (albo kocia ikonka
 *     w lewym dolnym rogu) wyłącza motyw i gra wraca do oryginału. Alt+K chowa/pokazuje kota.
 *  3. Nie rusza mapy (#GAME_CANVAS), ikon przedmiotów ani znaczników rzadkości. Nie wysyła
 *     żądań do serwera gry i nie wywołuje funkcji gry.
 *
 * Selektory pochodzą z diagnostyki działającej gry. „// ?” = przypuszczenie do sprawdzenia (F12).
 */

(() => {
  'use strict';

  if (window.top !== window.self) return;

  /* ======================================================================
   * KONFIGURACJA
   * ====================================================================== */

  const VERSION = '1.0.0';
  const KEY_ENABLED = 'mkn.enabled';
  const KEY_MASCOT = 'mkn.mascot';
  const ROOT_CLASS = 'mkn-on';
  const MASCOT_CLASS = 'mkn-mascot';
  const DETECT_TIMEOUT_MS = 45000;
  const LOG = (...a) => console.info('%c[Kocia Noc]', 'color:#b79cf0;font-weight:bold', ...a);

  /** Kocie uszy na oknach — ustaw false, jeśli w którymś oknie przeszkadzają. */
  const CAT_EARS = true;

  /**
   * Prefiks reguł. Dwa `:not(#…)` podbijają specyficzność o 2 ID, żeby motyw wygrywał
   * z innymi dodatkami/motywami, także tymi z !important.
   */
  const P = `html.${ROOT_CLASS}:not(#mkn-x):not(#mkn-y)`;

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
    woodBackground:  ['.interface-element-middle-1-background', '.window-wood-background'],
    headerBand:      ['.interface-element-header-2-background'],

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

    /* === TOOLTIPY === */
    tooltip:         ['.tip-wrapper'],                                                               // ?
    tooltipItemName: ['.tip-wrapper .item-name', '.tip-wrapper .item-head .name'],                   // ?

    /* === POLA TEKSTOWE === */
    input:           ['.ni-input input', '.c-window input[type="text"]', '.c-window input[type="number"]',
                      '.c-window textarea'],
    inputFrame:      ['.ni-input.search-wrapper'],

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

  const PAW = (fill) =>
    `<g fill="${fill}"><ellipse cx="12" cy="16.2" rx="5.2" ry="4.4"/>` +
    `<ellipse cx="5.4" cy="10.2" rx="2.2" ry="2.8" transform="rotate(-18 5.4 10.2)"/>` +
    `<ellipse cx="9.4" cy="5.8" rx="2.2" ry="2.9" transform="rotate(-6 9.4 5.8)"/>` +
    `<ellipse cx="14.6" cy="5.8" rx="2.2" ry="2.9" transform="rotate(6 14.6 5.8)"/>` +
    `<ellipse cx="18.6" cy="10.2" rx="2.2" ry="2.8" transform="rotate(18 18.6 10.2)"/></g>`;

  const ICONS = {
    // Pojedyncza łapka (dekory nagłówków)
    paw: svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">${PAW('#a98be0')}</svg>`),

    // Wzór łapek w tle — bardzo subtelny, kafel 140x140, ślady „idą” po skosie
    pawPattern: svgUrl(
      '<svg xmlns="http://www.w3.org/2000/svg" width="140" height="140" viewBox="0 0 140 140">' +
      `<g opacity=".05"><g transform="translate(18 92) rotate(-28) scale(.75)">${PAW('#c7b3ff')}</g>` +
      `<g transform="translate(46 70) rotate(-28) scale(.75)">${PAW('#c7b3ff')}</g>` +
      `<g transform="translate(84 34) rotate(-28) scale(.75)">${PAW('#c7b3ff')}</g>` +
      `<g transform="translate(112 12) rotate(-28) scale(.75)">${PAW('#c7b3ff')}</g></g></svg>`),

    // Ucho kota (lewe; prawe = lustrzane odbicie w CSS)
    ear: svgUrl(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 16">' +
      '<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2e2448"/><stop offset="1" stop-color="#000"/></linearGradient></defs>' +
      '<path d="M1 16 C2 10 4 4 7 1 C9 3 14 8 19 16 Z" fill="url(#g)" stroke="#7a62b0" stroke-width=".8" stroke-linejoin="round"/>' +
      '<path d="M5 15 C5.5 11 6.5 7 7.5 4.5 C9.5 7 12 10.5 14.5 15 Z" fill="#e3a3c6" opacity=".28"/></svg>'),

    // Kot-maskotka (sylwetka, siedzi bokiem, ogon zawinięty) — oczy osobno, żeby mrugały
    cat: svgUrl(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
      '<defs><linearGradient id="r" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8f74d6" stop-opacity=".9"/><stop offset=".6" stop-color="#4b3b6e" stop-opacity=".5"/><stop offset="1" stop-color="#1e1928" stop-opacity="0"/></linearGradient></defs>' +
      '<g fill="#000" stroke="url(#r)" stroke-width="1.1" stroke-linejoin="round">' +
      '<path d="M44 61 C55 61 61 55 59 45 C58 40 54 40 54.5 43.5 C56 51 52 56.5 43 56.5 Z"/>' +
      '<path d="M18 62 C12 62 11 52 15 42 C18 34 22 30.5 28 30.5 C37 30.5 44 38 46 48 C47.5 56 45.5 62 39 62 Z"/>' +
      '<path d="M15.5 25 C14.5 18 15 10 16.5 4.5 C19.5 7.5 22 10 23.5 12.5 C25 12 28 12 29.5 12.5 C31 10 33.5 7.5 36.5 4.5 C38 10 38.5 18 37.5 25 C36.5 31 32 34 26.5 34 C21 34 16.5 31 15.5 25 Z"/>' +
      '</g><path d="M24.5 27.5 L26.5 29 L28.5 27.5" fill="none" stroke="#e3a3c6" stroke-opacity=".55" stroke-width=".9" stroke-linecap="round"/></svg>'),

    catEyes: svgUrl(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
      '<defs><radialGradient id="e"><stop offset="0" stop-color="#fff3c4"/><stop offset=".45" stop-color="#e8c25a"/><stop offset="1" stop-color="#b48a2a"/></radialGradient></defs>' +
      '<g fill="url(#e)"><ellipse cx="21.5" cy="22.5" rx="2.6" ry="2.2"/><ellipse cx="31.5" cy="22.5" rx="2.6" ry="2.2"/></g>' +
      '<g fill="#000"><ellipse cx="21.5" cy="22.5" rx=".7" ry="1.9"/><ellipse cx="31.5" cy="22.5" rx=".7" ry="1.9"/></g></svg>'),

    // Kocia buzia — ikonka przełącznika
    face: svgUrl(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">' +
      '<path d="M4 20 C3 15 3 8 4.5 3 C7 5 8.5 6.5 9.5 8 C11 7.6 13 7.6 14.5 8 C15.5 6.5 17 5 19.5 3 C21 8 21 15 20 20 C18.5 22 15.5 23 12 23 C8.5 23 5.5 22 4 20 Z" fill="#000" stroke="#a98be0" stroke-width="1.1" stroke-linejoin="round"/>' +
      '<ellipse cx="9" cy="14.2" rx="1.5" ry="1.7" fill="#e8c25a"/><ellipse cx="15" cy="14.2" rx="1.5" ry="1.7" fill="#e8c25a"/>' +
      '<path d="M11 18 L12 18.8 L13 18" fill="none" stroke="#e3a3c6" stroke-width=".9" stroke-linecap="round"/></svg>')
  };

  /* ======================================================================
   * STAN
   * ====================================================================== */

  const getVal = (k, d) => { try { return GM_getValue(k, d); } catch { return d; } };
  const setVal = (k, v) => { try { GM_setValue(k, v); } catch { /* brak zapisu */ } };
  const isEnabled = () => getVal(KEY_ENABLED, true) !== false;
  const isMascot = () => getVal(KEY_MASCOT, true) !== false;

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
   * CSS
   * ====================================================================== */

  const S = (key, suffix = '') => SELECTORS[key].map((s) => `${P} ${s}${suffix}`).join(',\n');

  function buildCss() {
    const rarityCss = Object.entries(RARITY).map(([type, color]) => `
${P} .tip-wrapper[data-item-type="${type}"] { --mkn-rarity: ${color}; }
${P} .tip-wrapper[data-item-type="${type}"] .item-name { color: ${color} !important; }`).join('');

    const earsCss = !CAT_EARS ? '' : `
/* Kocie uszy — wystają nad nagłówkiem okna */
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
/* Uszy lekko się „nastawiają”, gdy najedziesz na okno */
${P} .c-window:hover > .header-label-positioner::before { transform: rotate(-6deg); }
${P} .c-window:hover > .header-label-positioner::after  { transform: scaleX(-1) rotate(-6deg); }`;

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
  --mkn-text:       #e6e0f0;
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
  --mkn-frame: linear-gradient(160deg, #050506 0%, #3a2d58 22%, #050506 45%, #1c1729 62%, #6a54a0 82%, #000 100%);
  --mkn-frame-v: linear-gradient(90deg, #000, #241c38 35%, #6a54a0 50%, #241c38 65%, #000);
  --mkn-surface:
    radial-gradient(120% 70% at 50% 0%, rgba(155,123,212,.06), transparent 60%),
    var(--mkn-paws),
    #000;
  --mkn-ring: 0 0 0 1px rgba(195,168,255,.55), 0 0 10px rgba(155,123,212,.45);
}

/* =====================================================================
 * === OKNA === (aksamitne tło, fioletowo-grafitowa ramka, uszy)
 * ===================================================================== */
${S('window')} {
  border-image: var(--mkn-frame) 1 !important;
  background-color: rgba(3,3,4,.96) !important;
  background-image:
    radial-gradient(120% 70% at 50% 0%, rgba(155,123,212,.07), transparent 60%),
    var(--mkn-paws) !important;
  box-shadow: 0 0 0 1px #000, 0 12px 32px rgba(0,0,0,.75), 0 0 24px rgba(75,59,110,.25),
              inset 0 0 0 1px rgba(195,168,255,.08) !important;
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
  color: var(--mkn-text) !important;
  font-family: var(--mkn-font-body) !important;
}
${S('windowHeader')} {
  background-color: transparent !important;
  background-image:
    linear-gradient(90deg, transparent 8%, rgba(155,123,212,.55) 50%, transparent 92%),
    linear-gradient(180deg, rgba(13,12,17,.95), rgba(0,0,0,.95)) !important;
  background-size: 100% 1px, 100% 100% !important;
  background-position: 0 100%, 0 0 !important;
  background-repeat: no-repeat !important;
}
${S('windowTitle')} {
  font-family: var(--mkn-font-head) !important;
  font-weight: 700 !important;
  letter-spacing: .12em !important;
  text-transform: uppercase;
  font-size: 11px !important;
  color: var(--mkn-text) !important;
  text-shadow: 0 1px 0 #000, 0 0 10px rgba(155,123,212,.35) !important;
}
/* Dekory nagłówka → łapki */
${S('windowDecor')} {
  background: ${ICONS.paw} center / 12px 12px no-repeat !important;
  opacity: .75;
}
${S('windowSmallBtn')} {
  filter: var(--mkn-sprite-filter);
  transition: filter .15s ease;
}
${S('windowSmallBtn', ':hover')} {
  filter: grayscale(.4) brightness(1.05) sepia(.3) hue-rotate(215deg) saturate(2) drop-shadow(0 0 4px rgba(195,168,255,.7));
}
${S('windowBottomBar')},
${S('headerBand')} {
  border-image: linear-gradient(180deg, #0d0c11, #000) 1 fill !important;
  box-shadow: inset 0 1px 0 rgba(155,123,212,.3) !important;
}
${S('woodBackground')} {
  border-image: none !important;
  border-color: transparent !important;
  background: var(--mkn-surface) !important;
}
${earsCss}

/* =====================================================================
 * === RAMA INTERFEJSU ===
 * ===================================================================== */
${S('barTop')},
${S('barBottom')} {
  background:
    linear-gradient(90deg, transparent, rgba(155,123,212,.5) 50%, transparent) 0 0 / 100% 1px no-repeat,
    linear-gradient(90deg, transparent, rgba(155,123,212,.5) 50%, transparent) 0 100% / 100% 1px no-repeat,
    var(--mkn-paws),
    #000 !important;
  box-shadow: inset 0 0 0 1px #000, inset 0 0 22px rgba(0,0,0,.7) !important;
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
 * === PRZYCISKI === (aksamitne kapsułki, fioletowa poświata przy najechaniu)
 * ===================================================================== */
${S('buttonBg')} {
  background: linear-gradient(180deg, var(--mkn-velvet-2), var(--mkn-velvet)) !important;
  border: 1px solid var(--mkn-line) !important;
  border-radius: 7px !important;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.06), 0 1px 2px rgba(0,0,0,.6) !important;
  transition: box-shadow .18s ease, border-color .18s ease;
}
${P} .button.red > .background { background: linear-gradient(180deg, #3a1726, #24101a) !important; }
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
 * === PASKI === (HP jak kocí nosek-róż, EXP fiolet, mana błękit)
 * ===================================================================== */
${S('hpOrbBlood')} {
  filter: hue-rotate(-14deg) saturate(1.15) brightness(.9);
}
${S('hpOrbGlass')} {
  filter: grayscale(.5) brightness(.85) hue-rotate(215deg) saturate(1.3);
}
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
 * === CZAT === (kolory kanałów zachowane, tylko lekko złagodzone)
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
 * === TOOLTIPY === (ciemny aksamit, kolor rzadkości na górnej krawędzi, łapka w rogu)
 * ===================================================================== */
${S('tooltip')} {
  --mkn-rarity: var(--mkn-violet);
  background-color: #030304 !important;
  background-image:
    ${ICONS.paw.replace('%23a98be0', '%23221d2c')},
    radial-gradient(120% 60% at 50% 0%, rgba(155,123,212,.14), transparent 65%) !important;
  background-repeat: no-repeat !important;
  background-size: 22px 22px, 100% 100% !important;
  background-position: right 6px bottom 6px, 0 0 !important;
  border: 1px solid var(--mkn-line) !important;
  border-top: 2px solid var(--mkn-rarity) !important;
  border-image: none !important;
  border-radius: 8px !important;
  box-shadow: 0 10px 26px rgba(0,0,0,.8), 0 0 0 1px #000 !important;
  color: var(--mkn-text) !important;
}
${S('tooltipItemName')} {
  font-family: var(--mkn-font-head) !important;
  font-weight: 700 !important;
  text-shadow: 0 1px 0 #000 !important;
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
  border-image: var(--mkn-frame) 1 !important;
  background-color: rgba(0,0,0,.95) !important;
}

/* =====================================================================
 * === KOT-MASKOTKA === (siedzi na dolnej belce po prawej, mruga co kilka sekund)
 * ===================================================================== */
html.${ROOT_CLASS}.${MASCOT_CLASS}:not(#mkn-x):not(#mkn-y) ${SELECTORS.bottomBarHost[0]}::before,
html.${ROOT_CLASS}.${MASCOT_CLASS}:not(#mkn-x):not(#mkn-y) ${SELECTORS.bottomBarHost[0]}::after {
  content: '';
  position: absolute;
  right: 230px;          /* ? przesuń, jeśli kot zasłania coś na belce */
  bottom: calc(100% - 6px);
  width: 46px;
  height: 46px;
  pointer-events: none;
  z-index: 5;
}
html.${ROOT_CLASS}.${MASCOT_CLASS}:not(#mkn-x):not(#mkn-y) ${SELECTORS.bottomBarHost[0]}::before {
  background: ${ICONS.cat} center / contain no-repeat;
  filter: drop-shadow(0 0 6px rgba(155,123,212,.35));
}
html.${ROOT_CLASS}.${MASCOT_CLASS}:not(#mkn-x):not(#mkn-y) ${SELECTORS.bottomBarHost[0]}::after {
  background: ${ICONS.catEyes} center / contain no-repeat;
  transform-origin: 50% 35%;
  animation: mkn-blink 7s infinite;
  filter: drop-shadow(0 0 2px rgba(232,194,90,.8));
}
@keyframes mkn-blink {
  0%, 92%, 100% { transform: scaleY(1); }
  94%, 96%      { transform: scaleY(.08); }
}
@media (prefers-reduced-motion: reduce) {
  html.${ROOT_CLASS} *::after { animation: none !important; }
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
  border: 1px solid #3a3049; border-radius: 50%;
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
    link.href = 'https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&family=Quicksand:wght@500;700&display=swap';
    (document.head || document.documentElement).appendChild(link);
  }

  /** Trzymamy nasz arkusz jako ostatni w <head> (obserwujemy tylko dzieci <head>, z debounce). */
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
    root.classList.toggle(MASCOT_CLASS, isMascot());
    const btn = document.getElementById('mkn-toggle');
    if (btn) {
      btn.setAttribute('aria-pressed', String(on));
      btn.title = `Kocia Noc: ${on ? 'włączona' : 'wyłączona'} (Alt+T) · kot: Alt+K`;
    }
  }

  function toggleTheme() {
    setVal(KEY_ENABLED, !isEnabled());
    applyState();
    LOG(isEnabled() ? 'motyw włączony' : 'motyw wyłączony');
  }

  function toggleMascot() {
    setVal(KEY_MASCOT, !isMascot());
    applyState();
    LOG(isMascot() ? 'kot wrócił' : 'kot poszedł spać');
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
    else if (e.code === 'KeyK') { e.preventDefault(); e.stopPropagation(); toggleMascot(); }
  }

  /** Samonaprawianie co 3 s: przywraca styl, klasę na <html> i przycisk, jeśli coś je usunęło. */
  function heal() {
    const host = document.head || document.documentElement;
    if (themeStyle && !themeStyle.isConnected) host.appendChild(themeStyle);
    if (toggleStyle && !toggleStyle.isConnected) host.appendChild(toggleStyle);
    const root = document.documentElement;
    if (root.classList.contains(ROOT_CLASS) !== isEnabled() || root.classList.contains(MASCOT_CLASS) !== isMascot()) applyState();
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
    LOG(`v${VERSION} aktywna. Alt+T — motyw, Alt+K — kot.`);
  }

  whenInterfaceKnown((iface) => {
    if (iface !== 'ni') {
      LOG(iface === 'si' ? 'stary interfejs (SI) — motyw nieaktywny.' : 'nie wykryto gry — motyw nieaktywny.');
      return;
    }
    if (document.body) start();
    else document.addEventListener('DOMContentLoaded', start, { once: true });
  });
})();
