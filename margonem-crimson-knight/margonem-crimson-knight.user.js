// ==UserScript==
// @name         Margonem – Crimson Knight Theme
// @namespace    https://github.com/Harkryn/Dodatki
// @version      1.3.0
// @description  Mroczny, gotycko-rycerski motyw dla nowego interfejsu Margonem (NI): czerń, kute żelazo, maswerki, sterczyny i miecze. Dwa warianty: Szkarłat i Butelkowa Zieleń. Zmienia wyłącznie wygląd UI.
// @match        https://*.margonem.pl/*
// @match        https://margonem.pl/*
// @match        https://*.margonem.com/*
// @match        https://margonem.com/*
// @noframes
// @run-at       document-start
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @updateURL    https://raw.githubusercontent.com/Harkryn/Dodatki/main/margonem-crimson-knight/margonem-crimson-knight.user.js
// @downloadURL  https://raw.githubusercontent.com/Harkryn/Dodatki/main/margonem-crimson-knight/margonem-crimson-knight.user.js
// @supportURL   https://github.com/Harkryn/Dodatki
// ==/UserScript==

/*
 * Crimson Knight — co robi
 *  - Czarny, brudny interfejs mrocznego średniowiecza w stylu gotyckich budowli: kanciaste żelazne
 *    ramy, okute narożniki ze sterczynami, szczyty z kwiatonem nad tytułami, maswerki, rozety,
 *    ostrołuki, blanki nad dolną belką i koronka ostrołuków pod górną.
 *  - Dwa warianty kolorystyczne przez zmienne CSS (atrybut data-ck-variant na <html>):
 *      crimson — „Szkarłat” (zaschnięta krew, rdza),
 *      green   — „Butelkowa Zieleń” (gęsta zielona ciecz, patyna/śniedź).
 *    Przełączenie działa od razu, z płynnym przejściem kolorów (~300 ms).
 *  - Wszystkie grafiki to SVG/CSS wygenerowane w kodzie — żadnych zewnętrznych obrazków.
 *
 * Zasady
 *  1. Działa WYŁĄCZNIE na nowym interfejsie (NI) — wykrywanie jak w „Kociej Nocy” (ciasteczko gry
 *     `interface`, a w razie braku znaczniki DOM). Na SI nic nie wstrzykuje.
 *  2. Reguły są ograniczone klasą `ck-on` na <html>. Alt+T — motyw, Alt+V — wariant, Alt+A — animacje
 *     (gdy obecna jest „Kocia Noc”, która też używa Alt+T: motyw przełącza Alt+Shift+T).
 *  3. Nie rusza mapy, ikon przedmiotów ani znaczników rzadkości. Nie wysyła żądań do serwera
 *     i nie wywołuje funkcji gry. Niski poziom HP rozpoznaje wyłącznie po wyglądzie kuli HP.
 *
 * Oznaczenia selektorów w obiekcie SELECTORS:
 *   [KN]   — przejęty z „Kociej Nocy”, tam potwierdzony w grze,
 *   [KN?]  — przejęty z „Kociej Nocy”, ale już tam oznaczony jako przypuszczenie,
 *   [NOWY] — dopisany na potrzeby tego motywu, DO WERYFIKACJI w grze (F12),
 *   [GRA]  — sprawdzony bezpośrednio w grze (NI na margonem.com, 18.11.2026).
 */

(() => {
  'use strict';

  if (window.top !== window.self) return;

  // Tylko strona gry: subdomena świata (np. solphyr.margonem.pl), ścieżka „/” — jak w „Kociej Nocy”.
  const HOST_PARTS = location.hostname.split('.');
  const NON_GAME = ['www', 'forum', 'commons', 'addons', 'pomoc', 'wiki', 'static'];
  if (HOST_PARTS.length < 3 || NON_GAME.includes(HOST_PARTS[0]) || location.pathname !== '/') return;

  /* ======================================================================
   * KONFIGURACJA
   * ====================================================================== */

  const VERSION = '1.3.0';
  const KEY_ENABLED = 'ck.enabled';
  const KEY_VARIANT = 'ck.variant';
  const KEY_ANIM = 'ck.anim';
  const KEY_KN_NOTICE = 'ck.knNoticeShown';
  const ROOT_CLASS = 'ck-on';
  const ANIM_CLASS = 'ck-anim';
  const DETECT_TIMEOUT_MS = 45000;
  const LOW_HP_PCT = 30;          // poniżej tylu procent HP poświata okna pulsuje na czerwono
  const LOG = (...a) => console.info('%c[Crimson Knight]', 'color:#9e1b1b;font-weight:bold', ...a);

  const VARIANTS = {
    crimson: 'Szkarłat',
    green: 'Butelkowa Zieleń'
  };
  const DEFAULT_VARIANT = 'crimson';

  /** Przełączniki funkcji — ustaw false, żeby wyłączyć. */
  const FEATURES = {
    gothicFrame: true,    // okute narożniki ze sterczynami, szczyt z kwiatonem nad tytułem, arkada u dołu okna
    barOrnaments: true,   // blanki nad dolną belką i koronka ostrołuków pod górną
    crest: true,          // rozeta w dużych oknach i ostrołukowe okno w kolumnach (znaki wodne)
    fog: true,            // mgła/dym na dole mapy
    lowHpPulse: true,     // czerwone pulsowanie przy niskim HP
    skinScanner: true,    // przemalowywanie drewna/pergaminu we wnętrzach okien (logika z „Kociej Nocy”)
    gridFix: true         // kratki torby rysowane od nowa (logika z „Kociej Nocy”)
  };

  /** Prefiksy reguł. Dwa `:not(#…)` podbijają specyficzność (ten sam sposób co w „Kociej Nocy”). */
  const P = `html.${ROOT_CLASS}:not(#ck-x):not(#ck-y)`;
  const PA = `html.${ROOT_CLASS}.${ANIM_CLASS}:not(#ck-x):not(#ck-y)`;
  const PL = `html.${ROOT_CLASS}[data-ck-lowhp]:not(#ck-x):not(#ck-y)`;
  /** Reguły tylko dla Szkarłatu (wyższa specyficzność niż P, więc nadpisują wspólne; Zieleń ich nie widzi). */
  const PC = `html.${ROOT_CLASS}[data-ck-variant="crimson"]:not(#ck-x):not(#ck-y)`;

  const DETECT = {
    ni: ['.game-window-positioner', '.interface-layer', '.game-layer', '.c-window'],   // [KN]
    si: ['#centerbox', '#base', '#ground']                                              // [KN?]
  };

  /** Znaczniki „Kociej Nocy” w DOM (odczytane z jej kodu). */
  const KN_MARKERS = {
    present: ['#mkn-theme-style', '#mkn-toggle'],   // skrypt działa (nawet jeśli motyw wyłączony)
    activeClass: 'mkn-on'                             // motyw włączony
  };

  /** Selektory UI — jeden obiekt konfiguracyjny. Oznaczenia: patrz nagłówek pliku. */
  const SELECTORS = {
    /* === OKNA === [KN] */
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
    windowTabs:      ['.c-window .card'],                                   // [KN?]

    /* === RAMA INTERFEJSU === [KN] */
    barTop:          ['.interface-layer > .top.positioner > .bg'],
    barBottom:       ['.interface-layer > .bottom.positioner > .bg'],
    column:          ['.interface-layer > .main-column'],
    columnBorder:    ['.interface-layer > .main-column > .border'],
    hud:             ['.top.positioner .hud-container'],
    orbPanel:        ['.bottom-panel .bottom-panel-graphic'],
    orbPointer:      ['.bottom-panel .pointer-exp-graphic', '.bottom-panel .pointer-ttl-graphic'],
    orbPointerText:  ['.bottom-panel .pointer-exp', '.bottom-panel .pointer-ttl'],
    goldIcon:        ['.top.positioner .hud-container .gold-tip'],
    creditsIcon:     ['.top.positioner .hud-container .credits-tip'],
    expOverlay:      ['.exp-bar-wrapper .overlay'],
    spriteArt:       ['.lagmeter .lag'],
    slotGrid:        ['.interface-element-item-slot-grid-stretch'],
    gridBorder:      ['.interface-element-grid-border', '.interface-element-grid-border-light'],

    /* === OZDOBNIKI — gdzie doklejamy własne elementy === [GRA] sprawdzone 18.11.2026 na margonem.com */
    barTopHost:      ['.interface-layer > .top.positioner'],   // [GRA] position: absolute — koronka ostrołuków pod belką
    barBottomHost:   ['.interface-layer > .bottom.positioner'],// [GRA] position: absolute — blanki nad belką
    fogHost:         ['.game-layer'],                          // [GRA] position: absolute — mgła jako nakładka nad mapą (canvas nietknięty)
    // Uwaga [GRA]: .c-window > .header-label-positioner jest static, a .c-window .header-label — relative.

    /* === PRZYCISKI === [KN] */
    button:          ['.button'],                  // [GRA] position: relative
    buttonBg:        ['.button > .background'],   // [GRA] static — ::after (rozlanie koloru) pozycjonuje się więc względem .button
    buttonLabel:     ['.button > .label'],
    widget:          ['.widget-button'],

    /* === SLOTY === */
    slot:            ['.interface-element-one-item-slot-background-to-repeat',   // [KN]
                      '.interface-element-one-item-slot-2'],                     // [KN?]

    /* === PASKI === */
    hpOrb:           ['.hp-indicator'],                                           // [KN]
    hpOrbBlood:      ['.hp-indicator .blood'],                                    // [KN]
    hpOrbValue:      ['.hp-indicator .hpp .value'],                               // [GRA] napis „100%” — główny odczyt % HP
    barTrack:        ['[class*="interface-element-progress-bar-"]:not(.one-warrior *)',
                      '.exp-bar-wrapper .exp-progress .progress'],                // [KN]
    hpFill:          ['.hero-hp-progress-bar .inner', '.hero-hp-top-progress-bar-light-mode .inner',   // [KN]
                      '.hp-progress-bar .inner', '.hp-progress-bar .progress-bar'],                     // [KN?]
    mpFill:          ['.hero-mp-progress-bar .inner', '.hero-mana-progress-bar .inner',                 // [KN?] wszystkie
                      '.mp-progress-bar .inner', '.mana-progress-bar .inner', '.mp-progress-bar .progress-bar'],
    expFill:         ['.hero-exp-top-progress-bar-light-mode .inner', '.hero-exp-progress-bar .inner',
                      '.exp-bar-wrapper .exp-progress .progress .inner'],         // [KN]
    barValue:        ['[class*="interface-element-progress-bar-"] .value'],       // [KN]

    /* === CZAT === */
    chat:            ['.new-chat-window'],                                        // [KN]
    chatMessage:     ['.new-chat-window .new-chat-message'],                      // [KN]
    chatTabs:        ['.chat-channel-card'],                                      // [KN]
    chatInput:       ['.new-chat-window input', '.new-chat-window textarea',
                      '.new-chat-window [contenteditable="true"]'],               // [KN?]

    /* === SCROLLBARY GRY === [KN] */
    scrollTrack:     ['.scrollbar-wrapper .track'],
    scrollHandle:    ['.scrollbar-wrapper .track .handle'],

    /* === TOOLTIPY === [GRA] .tip-wrapper[data-item-type="t-…"] i .item-name potwierdzone; .tw-tooltip i
       .item-head .name nadal [KN?] */
    tooltip:         ['.tip-wrapper', '.tw-tooltip'],
    tooltipItemName: ['.tip-wrapper .item-name', '.tip-wrapper .item-head .name'],

    /* === POLA TEKSTOWE === [KN] */
    input:           ['.ni-input input', '.c-window input[type="text"]', '.c-window input[type="number"]',
                      '.c-window textarea'],
    inputFrame:      ['.ni-input.search-wrapper'],

    /* === SKANER SKÓREK === [KN] (zakres i wyjątki; dopisane wyjątki dla elementów obu motywów) */
    skinScope:       ['.c-window', '.battle-controller', '.interface-layer > .main-column'],
    skinSkip:        ['.item', '.highlight', '[class*="icon"]', 'canvas', 'img', 'input', 'textarea', 'select',
                      '.new-chat-message', '[class*="progress"]', '[class*="avatar"]', '.button', '.widget-button',
                      '[class*="close-button"]', '.header-label', '.scrollbar-wrapper', '.card',
                      '.new-chat-window', '.hp-indicator-wrapper-template', '.one-warrior',
                      '.interface-element-item-slot-grid-stretch', '.ck-grid', '.mkn-grid',
                      '[data-ck]', '[id^="ck-"]', '[id^="mkn-"]', '.mkn-amb-eyes',
                      '[class*="vaddonz"]', '[class*="ll:"]', '[class*="mz-"]', '[class*="ykp"]'],

    /* === NIE RUSZAĆ — dokumentacja === */
    neverStyle:      ['#GAME_CANVAS', '.game-layer canvas', '.item .highlight', '.widget-button .icon'],
    hpOrbHost:       ['.hp-indicator-wrapper-template']   // [KN] NIE dawać tu filter/transform (kula HP „odjeżdża”)
  };

  /** Kolory rzadkości — STAŁE, niezależne od wariantu. t-art to przypuszczenie (jak w „Kociej Nocy”). */
  const RARITY = {
    't-norm':     'var(--ck-rar-common)',
    't-uniupg':   'var(--ck-rar-unique)',
    't-her':      'var(--ck-rar-heroic)',
    't-upgraded': 'var(--ck-rar-upgraded)',
    't-leg':      'var(--ck-rar-legendary)',
    't-art':      'var(--ck-rar-artifact)'
  };

  /* ======================================================================
   * GRAFIKI SVG (generowane lokalnie; kolor nadaje CSS przez mask-image + background)
   * ====================================================================== */

  const svgUrl = (svg) => `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
  const SVG = (vb, body, extra = '') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}"${extra}>${body}</svg>`;

  const SWORD_V = '<path d="M12 .8 L13.3 3 V15 H10.7 V3 Z M7.6 15 H16.4 V16.7 H7.6 Z M11.2 16.7 H12.8 V20.4 H11.2 Z"/><circle cx="12" cy="21.7" r="1.5"/>';

  const MASKSVG = (vb, body, extra = '') => svgUrl(SVG(vb, `<g fill="#fff">${body}</g>`, extra));

  /* --- Okuty narożnik okna (lewy górny; pozostałe = odbicia). Narożnik okna leży w punkcie (8,8):
         sterczyna wystaje na zewnątrz, ramiona biegną wzdłuż krawędzi, na nich żabki (crockets). --- */
  const CORNER_IRON =
    '<path d="M0 0 L11 4.5 L9.5 9.5 L4.5 11 Z"/>' +
    '<path fill-rule="evenodd" d="M8 8 H25 V25 H8 Z M16.5 11.3 A5.2 5.2 0 1 0 16.5 21.7 A5.2 5.2 0 1 0 16.5 11.3 Z"/>' +
    '<path d="M25 9 H50 L55 11 L50 13 H25 Z"/><path d="M25 15 H40 L43 16 L40 17 H25 Z"/>' +
    '<path d="M9 25 V50 L11 55 L13 50 V25 Z"/><path d="M15 25 V40 L16 43 L17 40 V25 Z"/>' +
    '<path d="M31 9 Q32 4 35.5 2.6 Q33.8 5.6 34.5 9 Z"/><path d="M41 9 Q42 4.5 45.5 3.4 Q43.8 6.2 44.5 9 Z"/>' +
    '<path d="M9 31 Q4 32 2.6 35.5 Q5.6 33.8 9 34.5 Z"/><path d="M9 41 Q4.5 42 3.4 45.5 Q6.2 43.8 9 44.5 Z"/>';
  const CORNER_INLAY =
    '<circle cx="14.4" cy="16.5" r="2.3"/><circle cx="18.6" cy="16.5" r="2.3"/><circle cx="16.5" cy="14.4" r="2.3"/><circle cx="16.5" cy="18.6" r="2.3"/>' +
    '<path d="M33 11 L35 9.7 L37 11 L35 12.3 Z"/><path d="M11 33 L9.7 35 L11 37 L12.3 35 Z"/>';

  /* --- Szczyt nad tytułem okna: belka, ośli grzbiet z żabkami i kwiatonem, sterczyny. Górna krawędź okna = y 24. --- */
  const GABLE_IRON =
    '<path d="M14 21 L26 18 H214 L226 21 L214 24 H26 Z"/>' +
    '<path d="M78 19 C96 19 110 14 120 6 C130 14 144 19 162 19 Z"/>' +
    '<path d="M120 0 L123 3.5 L120 7.5 L117 3.5 Z"/><path d="M120 5.5 Q114 4.5 112.5 1 Q117 2.5 120 5.5 Z M120 5.5 Q126 4.5 127.5 1 Q123 2.5 120 5.5 Z"/>' +
    '<path d="M100 16 Q99 11 102 9 Q101.5 12 103.5 15 Z"/><path d="M110 12 Q109.5 7.5 112 6 Q111.5 9 113 11 Z"/>' +
    '<path d="M140 16 Q141 11 138 9 Q138.5 12 136.5 15 Z"/><path d="M130 12 Q130.5 7.5 128 6 Q128.5 9 127 11 Z"/>' +
    '<path d="M70 21 V10 L73 2.5 L76 10 V21 Z"/><path d="M164 21 V10 L167 2.5 L170 10 V21 Z"/>' +
    '<path d="M36 19 V13 L38 8.5 L40 13 V19 Z"/><path d="M200 19 V13 L202 8.5 L204 13 V19 Z"/>';
  const GABLE_INLAY =
    '<circle cx="120" cy="12.4" r="2.2"/><circle cx="118" cy="15.6" r="2.2"/><circle cx="122" cy="15.6" r="2.2"/>' +
    '<circle cx="120" cy="3.5" r="1.2"/>' +
    '<path d="M73 9.5 L74.5 12 L73 14.5 L71.5 12 Z"/><path d="M167 9.5 L168.5 12 L167 14.5 L165.5 12 Z"/>' +
    '<path d="M50 21 L53 19.5 L56 21 L53 22.5 Z"/><path d="M184 21 L187 19.5 L190 21 L187 22.5 Z"/>';

  /* --- Separator pod tytułem: medalion z czwórliściem, belki z trójliściowymi zakończeniami --- */
  const DIV_HALF = '<circle cx="6" cy="7" r="2.4"/><circle cx="9.2" cy="4.4" r="1.7"/><circle cx="9.2" cy="9.6" r="1.7"/>' +
    '<path d="M10 6.1 H84 L91 7 L84 7.9 H10 Z"/><path d="M60 6.1 L64 3.6 L68 6.1 Z M60 7.9 L64 10.4 L68 7.9 Z"/>';
  const DIV_IRON = DIV_HALF + `<g transform="translate(200 0) scale(-1 1)">${DIV_HALF}</g>` +
    '<path fill-rule="evenodd" d="M100 0 A7 7 0 1 0 100 14 A7 7 0 1 0 100 0 Z M100 2.8 A4.2 4.2 0 1 1 100 11.2 A4.2 4.2 0 1 1 100 2.8 Z"/>';
  const DIV_INLAY = '<circle cx="98.2" cy="7" r="1.8"/><circle cx="101.8" cy="7" r="1.8"/><circle cx="100" cy="5.2" r="1.8"/><circle cx="100" cy="8.8" r="1.8"/>' +
    '<path d="M36 7 L39 5.5 L42 7 L39 8.5 Z"/><path d="M158 7 L161 5.5 L164 7 L161 8.5 Z"/>';

  /* --- Rozeta (znak wodny dużych okien) --- */
  let ROSE = '<path fill-rule="evenodd" d="M50 1 A49 49 0 1 0 50 99 A49 49 0 1 0 50 1 Z M50 5 A45 45 0 1 1 50 95 A45 45 0 1 1 50 5 Z"/>' +
    '<path fill-rule="evenodd" d="M50 31 A19 19 0 1 0 50 69 A19 19 0 1 0 50 31 Z M50 35 A15 15 0 1 1 50 65 A15 15 0 1 1 50 35 Z"/>' +
    '<circle cx="46" cy="50" r="4"/><circle cx="54" cy="50" r="4"/><circle cx="50" cy="46" r="4"/><circle cx="50" cy="54" r="4"/>';
  for (let i = 0; i < 12; i++) {
    ROSE += `<rect x="49" y="5" width="2" height="27" transform="rotate(${i * 30} 50 50)"/>` +
      `<circle cx="50" cy="18.5" r="5.4" fill="none" stroke="#fff" stroke-width="1.6" transform="rotate(${i * 30 + 15} 50 50)"/>`;
  }

  /* --- Ostrołukowe okno z maswerkiem (znak wodny kolumn) --- */
  const LANCET = '<g fill="none" stroke="#fff" stroke-width="3">' +
    '<path d="M3 140 V52 Q3 14 30 2 Q57 14 57 52 V140"/><path d="M30 62 V140"/>' +
    '<path d="M8 140 V70 Q8 52 19 46 Q30 52 30 70"/><path d="M30 70 Q30 52 41 46 Q52 52 52 70 V140"/>' +
    '<circle cx="30" cy="31" r="11"/></g>' +
    '<g fill="none" stroke="#fff" stroke-width="1.6"><circle cx="26.5" cy="31" r="3.5"/><circle cx="33.5" cy="31" r="3.5"/><circle cx="30" cy="27.5" r="3.5"/><circle cx="30" cy="34.5" r="3.5"/></g>';

  /* --- Ślepy ostrołuk z trójliściem (po bokach tytułu) --- */
  const TRACERY = '<path fill-rule="evenodd" d="M2 22 V10 Q2 3.5 8 0 Q14 3.5 14 10 V22 Z M4 20 V10.5 Q4 5.6 8 2.6 Q12 5.6 12 10.5 V20 Z"/>' +
    '<circle cx="8" cy="8.6" r="1.7"/><circle cx="6.5" cy="11.2" r="1.7"/><circle cx="9.5" cy="11.2" r="1.7"/><path d="M7.4 12.5 H8.6 V20 H7.4 Z"/>';

  /* --- Narożnik tooltipa: stałe kolory żelaza (tooltip nie zależy od wariantu) --- */
  const TIP_CORNER = '<path d="M0 0 H16 L14 2.5 H2.5 V14 L0 16 Z" fill="#57504c"/><path d="M0 0 H7 V7 H0 Z" fill="#6d6560"/>' +
    '<circle cx="3.5" cy="3.5" r="1.4" fill="#0c0909"/><path d="M9 2.5 L10.5 0.8 L12 2.5 Z M2.5 9 L0.8 10.5 L2.5 12 Z" fill="#3d3838"/>';
  const tipCorner = (rot) => svgUrl(SVG('0 0 16 16', `<g transform="rotate(${rot} 8 8)">${TIP_CORNER}</g>`));

  const ICONS = {
    // Skrzyżowane miecze — maska (biały = widoczne)
    swordsCross: MASKSVG('0 0 24 24', `<g transform="rotate(40 12 12)">${SWORD_V}</g><g transform="rotate(-40 12 12)">${SWORD_V}</g>`),
    cornerIron: MASKSVG('0 0 56 56', CORNER_IRON),
    cornerInlay: MASKSVG('0 0 56 56', CORNER_INLAY),
    gableIron: MASKSVG('0 0 240 26', GABLE_IRON),
    gableInlay: MASKSVG('0 0 240 26', GABLE_INLAY),
    dividerIron: MASKSVG('0 0 200 14', DIV_IRON),
    dividerInlay: MASKSVG('0 0 200 14', DIV_INLAY),
    rose: MASKSVG('0 0 100 100', ROSE),
    lancet: MASKSVG('0 0 60 140', LANCET),
    tracery: MASKSVG('0 0 16 22', TRACERY),
    // Kafle powtarzane poziomo: koronka (wiszące ostrołuki), blanki z otworem strzelniczym
    lace: MASKSVG('0 0 18 10', '<path fill-rule="evenodd" d="M0 0 H18 V2 Q15.5 2.4 13.6 5.4 L9 10 L4.4 5.4 Q2.5 2.4 0 2 Z M4.2 2.7 Q6.6 3.6 9 7.4 Q11.4 3.6 13.8 2.7 Z"/><circle cx="18" cy="2.6" r="1.3"/><circle cx="0" cy="2.6" r="1.3"/>'),
    // Ślepa arkada jako zwykłe tło (stały kolor ciemnego żelaza) — na belkach interfejsu
    arcadeBg: svgUrl(SVG('0 0 14 9', '<path fill="#2c2727" d="M0.5 9 V5 Q0.5 1.5 7 0 Q13.5 1.5 13.5 5 V9 H12 V5.4 Q12 2.7 7 1.6 Q2 2.7 2 5.4 V9 Z"/>')),
    // …i jej wersja dla Szkarłatu: ledwo odróżnialna od czerni
    arcadeBgDark: svgUrl(SVG('0 0 14 9', '<path fill="#120c0c" d="M0.5 9 V5 Q0.5 1.5 7 0 Q13.5 1.5 13.5 5 V9 H12 V5.4 Q12 2.7 7 1.6 Q2 2.7 2 5.4 V9 Z"/>')),
    // Tabliczka HUD (Szkarłat): wiszący ośli łuk z żabkami i skrzyżowanymi mieczami; górna krawędź = dół tabliczki
    hudCrestIron: MASKSVG('0 0 100 46',
      '<path d="M6 0 H94 L90 4 H10 Z"/>' +
      '<path fill-rule="evenodd" d="M18 4 H82 C80 14 68 22 58 28 C54 31 51.5 36 50 46 C48.5 36 46 31 42 28 C32 22 20 14 18 4 Z M27 6.5 H73 C70 13.5 62 19 55 23.5 C52.8 25 51 27.5 50 31 C49 27.5 47.2 25 45 23.5 C38 19 30 13.5 27 6.5 Z"/>' +
      '<path d="M22 10 Q16 12 15 16 Q19 13.5 23.5 13 Z M78 10 Q84 12 85 16 Q81 13.5 76.5 13 Z M33 20 Q27 23 27 27 Q30 24 35 23 Z M67 20 Q73 23 73 27 Q70 24 65 23 Z"/>' +
      '<path d="M8 4 V10 L10 15 L12 10 V4 Z M88 4 V10 L90 15 L92 10 V4 Z"/>' +
      `<g transform="translate(41 4.2) scale(.75)"><g transform="rotate(40 12 12)">${SWORD_V}</g><g transform="rotate(-40 12 12)">${SWORD_V}</g></g>`),
    hudCrestInlay: MASKSVG('0 0 100 46',
      '<path d="M27 6.5 H73 C70 13.5 62 19 55 23.5 C52.8 25 51 27.5 50 31 C49 27.5 47.2 25 45 23.5 C38 19 30 13.5 27 6.5 Z"/>' +
      '<circle cx="10" cy="7" r="1.1"/><circle cx="90" cy="7" r="1.1"/>'),
    // Wisząca sterczyna z żabkami (po bokach tabliczki)
    pendantIron: MASKSVG('0 0 16 40',
      '<path d="M2 0 H14 V8 L12 12 V20 L10 24 L8 40 L6 24 L4 20 V12 L2 8 Z"/>' +
      '<path d="M4 14 Q0 15 0 18 Q2 16.5 4 17 Z M12 14 Q16 15 16 18 Q14 16.5 12 17 Z M5 22 Q2 23.5 2.5 26 Q4 24.5 5.6 25 Z M11 22 Q14 23.5 13.5 26 Q12 24.5 10.4 25 Z"/>'),
    pendantInlay: MASKSVG('0 0 16 40', '<path d="M7 2.5 H9 V9 L8 10.8 L7 9 Z"/><path d="M7.4 13 H8.6 V19 H7.4 Z"/>'),
    battlement: MASKSVG('0 0 24 11', '<path fill-rule="evenodd" d="M0 1 H11 V8 H24 V11 H0 Z M4.9 3 H6.1 V6.5 H4.9 Z"/><path d="M-0.5 0 H11.5 V1.4 H-0.5 Z"/>'),
    tipTL: tipCorner(0), tipTR: tipCorner(90), tipBR: tipCorner(180), tipBL: tipCorner(270),
    // Szum (brud) — czarne drobinki
    noise: svgUrl('<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180">' +
      '<filter id="n" x="0" y="0"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" stitchTiles="stitch"/>' +
      '<feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.8 0 0 0 -.62"/></filter>' +
      '<rect width="180" height="180" filter="url(#n)" opacity=".45"/></svg>'),
    // Rysy — kilka jasnych, ledwo widocznych linii
    scratches: svgUrl('<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240">' +
      '<g stroke="#fff" stroke-width=".6" fill="none" stroke-linecap="round">' +
      '<path d="M12 40 L70 22" opacity=".05"/><path d="M140 180 L215 150" opacity=".04"/><path d="M60 200 L95 215" opacity=".05"/>' +
      '<path d="M180 30 L230 60" opacity=".035"/><path d="M20 130 C40 125 60 128 85 118" opacity=".04"/><path d="M150 95 L162 92" opacity=".06"/></g></svg>')
  };

  /* ======================================================================
   * STAN
   * ====================================================================== */

  const getVal = (k, d) => { try { return GM_getValue(k, d); } catch { return d; } };
  const setVal = (k, v) => { try { GM_setValue(k, v); } catch { /* brak zapisu */ } };
  const isEnabled = () => getVal(KEY_ENABLED, true) !== false;
  const isAnim = () => getVal(KEY_ANIM, true) !== false;
  const getVariant = () => { const v = getVal(KEY_VARIANT, DEFAULT_VARIANT); return VARIANTS[v] ? v : DEFAULT_VARIANT; };
  const reducedMotion = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } };
  const knPresent = () => KN_MARKERS.present.some((s) => document.querySelector(s));
  const knActive = () => document.documentElement.classList.contains(KN_MARKERS.activeClass);

  /* ======================================================================
   * WYKRYWANIE INTERFEJSU (jak w „Kociej Nocy”)
   * ====================================================================== */

  const anyMatch = (list) => list.some((s) => {
    try { return !!document.querySelector(s); } catch { return false; }
  });

  /** Gra sama zapisuje wybrany interfejs w ciasteczku `interface` (ni / si). */
  function cookieInterface() {
    const m = /(?:^|;\s*)interface=(\w+)/.exec(document.cookie || '');
    return m ? m[1].toLowerCase() : null;
  }

  function detectInterface() {
    const c = cookieInterface();
    if (c === 'ni' || c === 'si') return c;
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
    obs.observe(document, { childList: true, subtree: true });
    timeout = setTimeout(() => finish(detectInterface()), DETECT_TIMEOUT_MS);
  }

  /* ======================================================================
   * CSS MOTYWU
   * ====================================================================== */

  const S = (key, suffix = '') => SELECTORS[key].map((s) => `${P} ${s}${suffix}`).join(',\n');
  const SA = (key, suffix = '') => SELECTORS[key].map((s) => `${PA} ${s}${suffix}`).join(',\n');
  const MASK = (icon, pos = 'center / contain') => `-webkit-mask: ${icon} ${pos} no-repeat; mask: ${icon} ${pos} no-repeat;`;
  /** Wypełnienia ozdobników nakładane przez maskę: brudne kute żelazo (z przebarwieniem wariantu) i inkrustacja w kolorze wariantu. */
  const IRON_BG = 'var(--ck-noise), var(--ck-iron-grad)';   // gradient żelaza zależy od wariantu (patrz --ck-iron-grad)
  const INLAY_BG = 'linear-gradient(180deg, var(--ck-a4), var(--ck-a2) 70%, var(--ck-a1))';
  /** Łańcuch (dwie warstwy tła: ogniwa z boku i z góry), kolory ze zmiennych. Pozycja od góry albo od dołu. */
  const CHAIN_RING = 'radial-gradient(ellipse 4.5px 2.6px at 4.5px 3px, transparent 48%, var(--ck-metal-hi) 56% 76%, transparent 86%)';
  const CHAIN_LINK = 'linear-gradient(90deg, transparent 3px, var(--ck-iron-3) 3px 6px, transparent 6px)';
  const CHAIN_TOP = (t) => `${CHAIN_RING} 0 ${t}px / 9px 6px repeat-x, ${CHAIN_LINK} 4.5px ${t + 2.4}px / 9px 1.2px repeat-x`;
  const CHAIN_BOTTOM = (b) => `${CHAIN_RING} left 0 bottom ${b}px / 9px 6px repeat-x, ${CHAIN_LINK} left 4.5px bottom ${b + 2.4}px / 9px 1.2px repeat-x`;

  /** Zmienne zależne od wariantu — rejestrowane przez @property, żeby kolory płynnie się przenikały. */
  const VARIANT_PROPS = ['--ck-a0', '--ck-a1', '--ck-a2', '--ck-a3', '--ck-a4', '--ck-glow', '--ck-glow-soft',
    '--ck-stain', '--ck-stain-2', '--ck-tint', '--ck-metal-tint', '--ck-metal-hi', '--ck-fog', '--ck-grid-line'];

  function buildCss() {
    const props = VARIANT_PROPS.map((p) => `@property ${p} { syntax: '<color>'; inherits: true; initial-value: transparent; }`).join('\n');

    const rarityCss = Object.entries(RARITY).map(([type, color]) => `
${P} .tip-wrapper[data-item-type="${type}"] { --ck-rarity: ${color}; }
${P} .tip-wrapper[data-item-type="${type}"] .item-name { color: ${color} !important; }`).join('');

    return `
/* =====================================================================
 * === WARIANTY === — wszystkie kolory akcentu wyłącznie tutaj
 * ===================================================================== */
${props}

/* Wspólne dla obu wariantów (zdefiniowane bez ck-on, żeby panel przełącznika działał też przy wyłączonym motywie) */
html[data-ck-variant] {
  /* Czerń i grafity — ok. 80% powierzchni */
  --ck-black:   #050404;
  --ck-coal:    #0c0909;
  --ck-graphite:#141010;
  /* Zmatowiałe żelazo i stal */
  --ck-iron-1:  #2a2626;
  --ck-iron-2:  #3d3838;
  --ck-iron-3:  #57504c;
  --ck-brass:   #6b5a3a;   /* bardzo zgaszony mosiądz — tylko drobne detale */
  --ck-text:     #d9cfc4;  /* kość / popiół */
  --ck-text-dim: #8f857d;

  --ck-font-gothic: 'UnifrakturMaguntia', 'Pirata One', serif;
  --ck-font-caps:   'Cinzel', 'Crimson Text', Georgia, serif;
  --ck-font-body:   'Crimson Text', Georgia, 'Times New Roman', serif;

  /* Paski — STAŁE: HP zawsze czerwień, mana zawsze zimny błękit/fiolet, EXP przyciemniony mosiądz */
  --ck-hp-1: #2a0505; --ck-hp-2: #6e0f0f; --ck-hp-3: #a82424;
  --ck-mp-1: #0b1030; --ck-mp-2: #232f72; --ck-mp-3: #5060b0;
  --ck-xp-1: #241f16; --ck-xp-2: #57492f; --ck-xp-3: #8c7852;
  --ck-lowhp: #b3201c;

  /* Rzadkość — STAŁA, wyraźnie rozpoznawalna w obu wariantach */
  --ck-rar-common:    #cfc8bd;
  --ck-rar-unique:    #e8c94a;
  --ck-rar-heroic:    #4aa8f0;
  --ck-rar-upgraded:  #c07ff0;
  --ck-rar-legendary: #ff8a1e;
  --ck-rar-artifact:  #ff5a5a;

  --ck-noise: ${ICONS.noise};
  --ck-scratches: ${ICONS.scratches};
  /* Nit: łebek z refleksem, ciemna obwódka i przebarwienie metalu wokół */
  /* Domyślne wartości powierzchni (używa ich Butelkowa Zieleń; Szkarłat nadpisuje je na ciemniejsze) */
  --ck-win-rgb: 11 8 8;                                     /* tło okien */
  --ck-title: #e4d8ca;                                      /* tytuły okien */
  --ck-steel-hi: #9a918a;                                   /* jasna krawędź drobnych ozdobników */
  --ck-grime: rgba(48,30,18,.24);                           /* brudne, brunatne zacieki */
  --ck-grime-2: rgba(40,24,14,.2);
  --ck-vignette: rgba(0,0,0,.72);                           /* przyciemnienie brzegów okien */
  --ck-iron-grad: linear-gradient(160deg, #8f8680 0%, #5d5550 20%, var(--ck-metal-tint) 52%, #1b1616 100%);
  --ck-rivet: radial-gradient(circle at 42% 38%, #8a827c 0 .7px, #4f4844 1.2px 2.3px, #0a0808 2.9px, var(--ck-stain) 3.3px, transparent 4.6px);

  transition: ${VARIANT_PROPS.map((p) => `${p} .3s ease`).join(', ')};
}

/* --- Wariant 1: Szkarłat — mega mroczny: niemal sama czerń, czerwień tylko jako ciemne, zaschnięte akcenty --- */
html[data-ck-variant="crimson"] {
  --ck-a0: #0e0202;
  --ck-a1: #210404;
  --ck-a2: #370707;
  --ck-a3: #4f0a0a;
  --ck-a4: #6e0e0e;                       /* najjaśniejszy akcent — nadal ciemna, zakrzepła czerwień */
  --ck-glow: rgba(110,14,14,.42);
  --ck-glow-soft: rgba(70,8,8,.2);
  --ck-stain: rgba(30,8,6,.55);            /* zakrzepły brud zamiast jasnej rdzy */
  --ck-stain-2: rgba(22,6,5,.4);
  --ck-tint: rgba(28,3,3,.35);
  --ck-metal-tint: #140c0b;               /* poczerniałe, okopcone żelazo */
  --ck-metal-hi: #2b1c1a;
  --ck-fog: rgba(6,3,3,.7);               /* czarny dym */
  --ck-grid-line: rgba(48,20,18,.8);
  --ck-sprite-filter: grayscale(.9) brightness(.34) sepia(.35) hue-rotate(-22deg) saturate(1.4) contrast(1.15);
  --ck-tile-filter: grayscale(1) brightness(.38) sepia(.55) hue-rotate(-30deg) saturate(1.4) contrast(1.2);
  --ck-widget-filter: hue-rotate(-120deg) saturate(.6) brightness(.55);

  /* Powierzchnie: niemal czysta czerń */
  --ck-black:    #010000;
  --ck-coal:     #040202;
  --ck-graphite: #080505;
  --ck-iron-1:   #161212;
  --ck-iron-2:   #221c1c;
  --ck-iron-3:   #332b2a;
  --ck-text:     #cbbfb4;                 /* przygaszona kość — nadal czytelna */
  --ck-text-dim: #7a6f68;
  --ck-win-rgb: 3 2 2;
  --ck-title: #c9b9ac;
  --ck-steel-hi: #4a403e;
  --ck-grime: rgba(0,0,0,.45);
  --ck-grime-2: rgba(10,2,2,.4);
  --ck-vignette: rgba(0,0,0,.88);
  --ck-iron-grad: linear-gradient(160deg, #4a403e 0%, #2a2120 22%, var(--ck-metal-tint) 55%, #030202 100%);
}

/* --- Wariant 2: Butelkowa Zieleń — gęsta zielona ciecz, patyna i śniedź --- */
html[data-ck-variant="green"] {
  --ck-a0: #04100b;
  --ck-a1: #0a1f16;
  --ck-a2: #12301f;
  --ck-a3: #1b4430;
  --ck-a4: #2e6b4c;                       /* najjaśniejszy akcent */
  --ck-glow: rgba(56,122,92,.50);          /* chłodny, przygaszony blask */
  --ck-glow-soft: rgba(36,90,66,.26);
  --ck-stain: rgba(38,88,74,.36);          /* śniedź */
  --ck-stain-2: rgba(62,104,88,.22);
  --ck-tint: rgba(10,34,24,.38);
  --ck-metal-tint: #24302a;
  --ck-metal-hi: #46564d;
  --ck-fog: rgba(20,46,34,.5);
  --ck-grid-line: rgba(46,84,66,.75);
  --ck-sprite-filter: grayscale(.85) brightness(.48) sepia(.35) hue-rotate(95deg) saturate(.9) contrast(1.1);
  --ck-tile-filter: grayscale(1) brightness(.55) sepia(.6) hue-rotate(95deg) saturate(1.1) contrast(1.15);
  --ck-widget-filter: saturate(.55) brightness(.75);
}

/* Własne elementy są ukryte, dopóki motyw nie jest włączony */
.ck-deco, .ck-bar-lace, .ck-bar-wall, .ck-col-crest, .ck-fog, .ck-hud-deco { display: none; }

/* =====================================================================
 * === OKNA ===
 * Kanciasta gotycka bryła z kutego żelaza: okopcone, brudne wnętrze, podwójna rama z inkrustowaną
 * linią w kolorze wariantu, okute narożniki ze sterczynami i żabkami, szczyt z kwiatonem nad tytułem,
 * koronka ostrołuków pod spodem (elementy w warstwie .ck-deco). Żadnych zaokrągleń.
 * ===================================================================== */
${S('window')} {
  border-image: none !important;
  border-color: transparent !important;
  background-color: rgb(var(--ck-win-rgb) / .97) !important;
  background-image:
    radial-gradient(120% 50% at 50% 0%, var(--ck-tint), transparent 70%),
    radial-gradient(60% 40% at 18% 100%, var(--ck-grime), transparent 70%),
    radial-gradient(40% 30% at 88% 70%, var(--ck-grime-2), transparent 70%),
    radial-gradient(140% 110% at 50% 50%, transparent 48%, var(--ck-vignette)),
    linear-gradient(180deg, rgba(0,0,0,.4), transparent 20%),
    var(--ck-scratches),
    var(--ck-noise),
    var(--ck-noise) !important;
  background-position: 0 0, 0 0, 0 0, 0 0, 0 0, 0 0, 0 0, 90px 45px !important;
  background-clip: border-box !important;
  border-radius: 0 !important;
  box-shadow:
    0 0 0 1px #000,
    0 0 0 3px var(--ck-iron-1),
    0 0 0 4px #000,
    0 18px 44px rgba(0,0,0,.9),
    0 0 30px var(--ck-glow-soft) !important;
  color: var(--ck-text) !important;
}
${P} .c-window.transparent[data-opacity-lvl="1"] { background-color: rgb(var(--ck-win-rgb) / .85) !important; }
${P} .c-window.transparent[data-opacity-lvl="2"] { background-color: rgb(var(--ck-win-rgb) / .7) !important; }
${P} .c-window.transparent[data-opacity-lvl="3"] { background-color: rgb(var(--ck-win-rgb) / .55) !important; }
${P} .c-window.transparent[data-opacity-lvl="4"] { background-color: rgb(var(--ck-win-rgb) / .4) !important; }

${S('windowOverlay')} {
  border-image-source: none !important;
  border-color: transparent !important;
  background-image: none !important;
}
${S('windowContent')} {
  background-color: transparent !important;
  background-image: none !important;
  color: var(--ck-text) !important;
  font-family: var(--ck-font-body) !important;
  font-size-adjust: .48;                 /* Crimson Text ma niską x-wysokość — wyrównujemy czytelność */
  font-variant-numeric: lining-nums;
}
/* Nadproże z tytułem: ciemny pas, linia z inkrustacją, pośrodku gotycki separator (medalion z czwórliściem).
   Separator siedzi na .header-label (position: relative, wyśrodkowany nad tytułem) — .header-label-positioner
   jest statyczny (sprawdzone w grze). ::after = żelazo, ::before = inkrustacja w kolorze wariantu. */
${S('windowHeaderBox')} {
  background:
    linear-gradient(90deg, transparent 2%, var(--ck-iron-2) 18%, var(--ck-a3) 50%, var(--ck-iron-2) 82%, transparent 98%) 0 100% / 100% 1px no-repeat,
    linear-gradient(180deg, rgba(0,0,0,.5), color-mix(in srgb, var(--ck-a1) 40%, transparent)) !important;
}
${S('windowHeader', '::before')},
${S('windowHeader', '::after')} {
  content: '';
  position: absolute; left: 50%; bottom: -6px;
  width: 172px; height: 12px; margin-left: -86px;
  pointer-events: none;
  z-index: 6;
}
${S('windowHeader', '::after')} { ${MASK(ICONS.dividerIron)} background: ${IRON_BG}; }
${S('windowHeader', '::before')} { ${MASK(ICONS.dividerInlay)} background: ${INLAY_BG}; z-index: 7; }
${S('windowHeader')} {
  z-index: 6;   /* nad warstwą ozdobników — w części okien gra kładzie tytuł na samej górnej krawędzi (sprawdzone w grze) */
  background: none !important;
  border-image: none !important;
  border-color: transparent !important;
  box-shadow: none !important;
}
${S('windowTitle')} {
  font-family: var(--ck-font-gothic) !important;
  font-weight: 400 !important;
  font-size: 15px !important;
  letter-spacing: .05em !important;
  color: var(--ck-title) !important;
  text-shadow: 0 0 12px var(--ck-glow), 0 1px 0 #000, 0 0 3px #000, 0 0 1px #000 !important;
}
/* Ozdobniki po bokach tytułu → ślepe ostrołuki z trójliściem */
${S('windowDecor')} {
  border-image: none !important;
  background: linear-gradient(180deg, var(--ck-steel-hi), var(--ck-metal-tint) 55%, var(--ck-a3)) !important;
  ${MASK(ICONS.tracery, 'center / 13px 18px')}
}
${S('windowSmallBtn')} {
  filter: var(--ck-sprite-filter);
  transition: filter .15s ease;
}
${S('windowSmallBtn', ':hover')} {
  filter: var(--ck-sprite-filter) brightness(1.6) drop-shadow(0 0 4px var(--ck-glow));
}
/* Przyciski okna (zamknij, menu okien przezroczystych) nad warstwą ozdobników */
${P} .c-window > .close-button-corner-decor,
${P} .c-window > .transparent-window-buttons-menu { z-index: 8 !important; }
/* Dolny pasek okna: ciemny cokół z żelazną listwą */
${S('windowBottomBar')},
${S('headerBand')} {
  border-image: none !important;
  border-color: transparent !important;
  background:
    linear-gradient(90deg, transparent, var(--ck-iron-3) 12% 88%, transparent) 0 0 / 100% 1px no-repeat,
    linear-gradient(90deg, transparent, color-mix(in srgb, var(--ck-a2) 70%, transparent) 30% 70%, transparent) 0 2px / 100% 1px no-repeat,
    var(--ck-noise),
    linear-gradient(180deg, rgba(20,16,16,.92), rgba(5,4,4,.96)) !important;
  background-clip: border-box !important;
  box-shadow: none !important;
}
${S('innerPanel')} {
  border-image: none !important;
  border-color: transparent !important;
  background: rgba(255,255,255,.012) !important;
  box-shadow: inset 0 0 0 1px rgba(61,56,56,.5), inset 0 0 0 2px #000, inset 0 0 12px rgba(0,0,0,.55) !important;
  border-radius: 0 !important;
}

/* --- Warstwa ozdobników okna (.ck-deco — doklejana przez JS, nie przechwytuje kliknięć) --- */
${P} .ck-deco {
  display: block;
  position: absolute; inset: 0;
  pointer-events: none;
  z-index: 5;
  background:
    radial-gradient(ellipse 18% 12% at 0 0, var(--ck-stain), transparent),
    radial-gradient(ellipse 14% 9% at 100% 0, var(--ck-stain-2), transparent),
    radial-gradient(ellipse 16% 13% at 100% 100%, var(--ck-stain), transparent),
    radial-gradient(ellipse 12% 9% at 0 100%, var(--ck-stain-2), transparent),
    radial-gradient(ellipse 9% 2.5% at 63% 100%, var(--ck-stain-2), transparent),
    radial-gradient(ellipse 1.5% 6% at 100% 38%, rgba(0,0,0,.7), transparent),
    radial-gradient(ellipse 1.5% 5% at 0 64%, rgba(0,0,0,.7), transparent);
  box-shadow:
    inset 0 0 0 1px #000,
    inset 0 0 0 4px var(--ck-iron-1),
    inset 0 0 0 5px #000,
    inset 0 0 0 6px color-mix(in srgb, var(--ck-a3) 70%, transparent),
    inset 0 0 0 7px rgba(0,0,0,.85),
    inset 0 0 0 8px color-mix(in srgb, var(--ck-metal-hi) 25%, transparent),
    inset 0 0 26px rgba(0,0,0,.6);
}
/* Okute narożniki: sterczyna na zewnątrz, ramiona z żabkami, czwórliść w kolorze wariantu */
${P} .ck-deco > .ck-corner {
  --cs: 56px;
  position: absolute;
  width: var(--cs); height: var(--cs);
  filter: drop-shadow(0 1px 1px #000) drop-shadow(0 0 2px rgba(0,0,0,.8));
}
${P} .ck-deco.ck-small > .ck-corner { --cs: 40px; }
${P} .ck-corner::before, ${P} .ck-corner::after,
${P} .ck-gable::before, ${P} .ck-gable::after { content: ''; position: absolute; inset: 0; }
${P} .ck-corner::before { ${MASK(ICONS.cornerIron, '0 0 / 100% 100%')} background: ${IRON_BG}; }
${P} .ck-corner::after  { ${MASK(ICONS.cornerInlay, '0 0 / 100% 100%')} background: ${INLAY_BG}; }
${P} .ck-deco > .ck-tl { left: calc(var(--cs) * -.143); top: calc(var(--cs) * -.143); }
${P} .ck-deco > .ck-tr { right: calc(var(--cs) * -.143); top: calc(var(--cs) * -.143); transform: scaleX(-1); }
${P} .ck-deco > .ck-bl { left: calc(var(--cs) * -.143); bottom: calc(var(--cs) * -.143); transform: scaleY(-1); }
${P} .ck-deco > .ck-br { right: calc(var(--cs) * -.143); bottom: calc(var(--cs) * -.143); transform: scale(-1, -1); }
/* Szczyt nad tytułem: belka, ośli grzbiet z żabkami i kwiatonem, sterczyny */
${P} .ck-deco > .ck-gable {
  position: absolute; left: 50%; top: 0;
  width: min(240px, 92%); aspect-ratio: 240 / 26;
  transform: translate(-50%, -92.3%);
  filter: drop-shadow(0 -1px 2px rgba(0,0,0,.85));
}
${P} .ck-deco.ck-small > .ck-gable { width: min(170px, 92%); }
${P} .ck-gable::before { ${MASK(ICONS.gableIron)} background: ${IRON_BG}; }
${P} .ck-gable::after  { ${MASK(ICONS.gableInlay)} background: ${INLAY_BG}; }
/* Koronka wiszących ostrołuków pod oknem (nie przy oknach przezroczystych) */
${P} .ck-deco > .ck-lace {
  position: absolute; left: 24px; right: 24px; top: 100%;
  height: 8px;
  -webkit-mask: ${ICONS.lace} 0 0 / 16px 8px repeat-x; mask: ${ICONS.lace} 0 0 / 16px 8px repeat-x;
  background: ${IRON_BG};
}
${P} .c-window.transparent > .ck-deco > .ck-lace { display: none; }

/* Poświata aktywnego okna (ostatnio klikniętego) — animowana tylko opacity */
${P} .ck-deco > .ck-glow {
  position: absolute; inset: 0;
  opacity: 0;
  box-shadow: inset 0 0 0 1px var(--ck-a4), inset 0 0 18px var(--ck-glow);
  transition: opacity .3s ease;
}
${P} .c-window.ck-active-win > .ck-deco > .ck-glow { opacity: .55; }
${PA} .c-window.ck-active-win > .ck-deco > .ck-glow { animation: ck-pulse 3.8s ease-in-out infinite; }
/* Niskie HP — pulsowanie zawsze czerwone, w obu wariantach */
${PL} .ck-deco > .ck-glow { box-shadow: inset 0 0 0 1px var(--ck-lowhp), inset 0 0 18px rgba(190,24,24,.75); }
${PL} .c-window.ck-active-win > .ck-deco > .ck-glow { opacity: .8; }
html.${ROOT_CLASS}.${ANIM_CLASS}[data-ck-lowhp]:not(#ck-x):not(#ck-y) .c-window.ck-active-win > .ck-deco > .ck-glow { animation-duration: 1.4s; }
@keyframes ck-pulse { 0%, 100% { opacity: .28; } 50% { opacity: .85; } }

/* Znaki wodne: rozeta w dużych oknach, ostrołukowe okno z maswerkiem w kolumnach — ledwo widoczne */
${P} .ck-deco > .ck-rose { display: none; }
${P} .ck-deco.ck-big > .ck-rose {
  display: block;
  position: absolute; left: 50%; top: 55%;
  width: 46%; max-width: 240px; aspect-ratio: 1;
  transform: translate(-50%, -50%);
  ${MASK(ICONS.rose)}
  background: linear-gradient(180deg, var(--ck-a3), var(--ck-a1));
  opacity: .07;
}
${P} .ck-col-crest {
  display: block;
  position: absolute; left: 50%; top: 50%;
  width: 62%; max-width: 150px; aspect-ratio: 60 / 140;
  transform: translate(-50%, -50%);
  ${MASK(ICONS.lancet)}
  background: linear-gradient(180deg, var(--ck-a3), var(--ck-a1));
  opacity: .08;
  pointer-events: none;
  z-index: 0;
}

/* --- Ozdoby belek: koronka ostrołuków pod górną, blanki z otworami strzelniczymi nad dolną.
       z-index: -1 — pod HUD-em i kulą HP, ale nad mapą (warstwa interfejsu ma własny kontekst). --- */
${P} .ck-bar-lace, ${P} .ck-bar-wall {
  display: block;
  position: absolute; left: 0; right: 0;
  pointer-events: none;
  z-index: -1;
  background: ${IRON_BG};
}
${P} .ck-bar-lace {
  top: 100%; height: 10px;
  -webkit-mask: ${ICONS.lace} 0 0 / 20px 10px repeat-x; mask: ${ICONS.lace} 0 0 / 20px 10px repeat-x;
}
${P} .ck-bar-wall {
  bottom: 100%; height: 11px;
  -webkit-mask: ${ICONS.battlement} 0 100% / 24px 11px repeat-x; mask: ${ICONS.battlement} 0 100% / 24px 11px repeat-x;
}

/* =====================================================================
 * === RAMA INTERFEJSU ===
 * ===================================================================== */
${S('barTop')},
${S('barBottom')} {
  background:
    linear-gradient(90deg, transparent, var(--ck-a3) 50%, transparent) 0 0 / 100% 1px no-repeat,
    linear-gradient(90deg, transparent, var(--ck-a3) 50%, transparent) 0 100% / 100% 1px no-repeat,
    linear-gradient(90deg, transparent 2%, var(--ck-iron-2) 20% 80%, transparent 98%) 0 3px / 100% 1px no-repeat,
    linear-gradient(90deg, transparent 2%, var(--ck-iron-2) 20% 80%, transparent 98%) 0 calc(100% - 3px) / 100% 1px no-repeat,
    ${ICONS.arcadeBg} 0 50% / 14px 9px repeat-x,
    radial-gradient(60% 140% at 50% 50%, var(--ck-tint), transparent 70%),
    var(--ck-noise),
    linear-gradient(180deg, var(--ck-iron-1), var(--ck-graphite) 30%, var(--ck-black) 100%) !important;
  box-shadow: inset 0 0 0 1px #000, inset 0 1px 0 rgba(255,255,255,.05) !important;
}
${S('column')} {
  background:
    radial-gradient(120% 40% at 50% 0%, var(--ck-tint), transparent 70%),
    var(--ck-scratches),
    var(--ck-noise),
    var(--ck-coal) !important;
}
${S('columnBorder')} {
  background: linear-gradient(90deg, #000, var(--ck-iron-1) 30%, var(--ck-metal-hi) 50%, var(--ck-iron-1) 70%, #000) !important;
  box-shadow: 0 0 8px rgba(0,0,0,.9) !important;
}
/* Tryb okienkowy (body[data-res]) — żelazna rama z przebarwieniem w kolorze wariantu [KN] */
${P} body[data-res] .game-window-positioner > .interface-layer {
  border-image: linear-gradient(180deg, var(--ck-iron-3), var(--ck-iron-2) 20%, var(--ck-a2) 55%, var(--ck-iron-1) 85%, var(--ck-iron-2)) 1 !important;
  box-shadow: 0 0 0 1px #000, 0 0 0 3px var(--ck-iron-1), 0 0 30px var(--ck-glow-soft), 0 18px 50px rgba(0,0,0,.9) !important;
}
${S('spriteArt')} { filter: var(--ck-sprite-filter); }

/* Górna tabliczka (imię, lokacja, złoto): żelazna płyta, łańcuch u dołu, miecze pod spodem */
${S('hud')} {
  background:
    ${CHAIN_BOTTOM(3)},
    radial-gradient(90% 120% at 50% 140%, var(--ck-tint), transparent 62%),
    var(--ck-noise),
    linear-gradient(180deg, var(--ck-black), var(--ck-graphite) 60%, #1b1616) !important;
  border-radius: 0 !important;
  box-shadow:
    inset 0 0 0 1px #000, inset 0 0 0 4px var(--ck-iron-1), inset 0 0 0 5px #000,
    inset 0 0 0 6px color-mix(in srgb, var(--ck-a3) 70%, transparent), inset 0 0 0 7px #000,
    0 0 0 1px #000, 0 10px 26px rgba(0,0,0,.8), 0 0 20px var(--ck-glow-soft) !important;
  filter: none !important;
  color: var(--ck-text) !important;
}
/* Pod tabliczką: rozeta w kolorze wariantu, na niej skrzyżowane miecze z kutego żelaza */
${S('hud', '::before')},
${S('hud', '::after')} {
  content: '';
  position: absolute; left: 50%;
  pointer-events: none;
}
${S('hud', '::before')} {
  top: calc(100% - 10px);
  width: 34px; height: 34px; margin-left: -17px;
  ${MASK(ICONS.rose)}
  background: ${INLAY_BG};
  z-index: 2;
}
${S('hud', '::after')} {
  top: calc(100% - 5px);
  width: 24px; height: 24px; margin-left: -12px;
  ${MASK(ICONS.swordsCross)}
  background: ${IRON_BG};
  z-index: 3;
}
${P} .hud-container *:not([class*="icon"]):not(.map_ball) {
  color: var(--ck-text) !important;
  text-shadow: 0 0 8px var(--ck-glow-soft), 0 1px 1px #000 !important;
  font-family: var(--ck-font-caps) !important;
}
${P} .hud-container .map-data *, ${P} .hud-container .herogold, ${P} .hud-container .herocredits {
  font-family: var(--ck-font-body) !important;
}
${P} .hud-container .btn-min {
  background: linear-gradient(180deg, var(--ck-iron-2), var(--ck-iron-1)) !important;
  border: 1px solid #000 !important;
  border-radius: 0 !important;
  box-shadow: inset 0 0 0 1px var(--ck-a2), inset 0 1px 0 rgba(255,255,255,.1) !important;
  color: var(--ck-text) !important;
  filter: none !important;
}
${P} .hud-container .btn-min:hover { box-shadow: inset 0 0 0 1px var(--ck-a4), 0 0 8px var(--ck-glow) !important; }
/* Waluty (ich ikony były częścią tła tabliczki): zgaszona mosiężna moneta i zielona smocza łza */
${S('goldIcon')} {
  background: radial-gradient(circle at 38% 32%, #cdb57c 0, #8a7444 40%, #4a3c20 78%, transparent 82%) center / 15px 15px no-repeat !important;
}
${S('creditsIcon')} {
  background: radial-gradient(ellipse at 40% 35%, #b6e8a0 0, #3f8f3a 45%, #16401a 78%, transparent 82%) center / 13px 17px no-repeat !important;
}

/* Grafika wokół kuli HP: przezroczysta, z łańcuchem i nitami */
${S('orbPanel')} {
  background:
    var(--ck-rivet) left 16px top 82px / 10px 10px no-repeat,
    var(--ck-rivet) right 16px top 82px / 10px 10px no-repeat,
    ${CHAIN_TOP(84)} !important;
  filter: none !important;
}
${S('orbPointer')} {
  background: var(--ck-noise), linear-gradient(180deg, var(--ck-iron-1), var(--ck-coal) 60%, #000) !important;
  border-radius: 0 !important;
  box-shadow: inset 0 0 0 1px var(--ck-iron-2), inset 0 0 0 2px #000, 0 0 0 1px #000 !important;
  filter: none !important;
}
${S('orbPointerText')} {
  font-family: var(--ck-font-caps) !important;
  font-weight: 700 !important;
  color: var(--ck-text) !important;
  text-shadow: 0 1px 1px #000, 0 0 6px var(--ck-glow-soft) !important;
}
${S('expOverlay')} {
  background: repeating-linear-gradient(90deg, transparent 0 calc(10% - 1px), rgba(140,120,82,.35) calc(10% - 1px) 10%) !important;
  border-radius: 0 !important;
  box-shadow: inset 0 0 0 1px var(--ck-iron-2), 0 0 0 1px #000 !important;
  filter: none !important;
}

/* =====================================================================
 * === PRZYCISKI === — żelazne tabliczki; przy najechaniu kolor wariantu rozlewa się od krawędzi
 * ===================================================================== */
${S('button')},
${S('buttonBg')} {
  background:
    radial-gradient(ellipse at 12% 100%, var(--ck-stain), transparent 55%),
    var(--ck-noise),
    linear-gradient(180deg, var(--ck-iron-2) 0%, var(--ck-iron-1) 18%, #1b1717 60%, #0e0b0b 100%) !important;
  border: 1px solid #050404 !important;
  border-radius: 0 !important;
  /* Okuta tabliczka: jasna krawędź, czarna fuga, inkrustowana listwa u dołu */
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.08),
    inset 0 0 0 1px rgba(110,100,95,.38),
    inset 0 0 0 2px rgba(0,0,0,.85),
    inset 0 -3px 0 0 color-mix(in srgb, var(--ck-a2) 60%, transparent),
    0 0 0 1px #000, 0 2px 3px rgba(0,0,0,.75) !important;
  transition: box-shadow .2s ease, border-color .2s ease;
}
${S('button')} { color: var(--ck-text) !important; border-image: none !important; }
${P} .button.red, ${P} .button.red > .background {
  background: var(--ck-noise), linear-gradient(180deg, #3a1010, #1c0606) !important;
}
${P} .button.green, ${P} .button.green > .background { border-color: var(--ck-a3) !important; }
${S('button', ':hover')},
${S('button', ':hover > .background')} {
  border-color: var(--ck-a3) !important;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.1),
    inset 0 0 0 1px color-mix(in srgb, var(--ck-a4) 70%, transparent),
    inset 0 0 0 2px rgba(0,0,0,.85),
    inset 0 -3px 0 0 var(--ck-a3),
    0 0 0 1px #000, 0 0 10px var(--ck-glow) !important;
}
${S('button', ':active > .background')} { box-shadow: inset 0 2px 6px rgba(0,0,0,.75) !important; }
${S('buttonBg', '::after')} {
  content: '';
  position: absolute; inset: 0;
  border-radius: inherit;
  pointer-events: none;
  background:
    radial-gradient(120% 150% at 50% 125%, color-mix(in srgb, var(--ck-a4) 50%, transparent), transparent 70%),
    linear-gradient(90deg, color-mix(in srgb, var(--ck-a3) 45%, transparent), transparent 30% 70%, color-mix(in srgb, var(--ck-a3) 45%, transparent));
  opacity: 0;
  transform: scaleX(.6);
  transition: opacity .25s ease, transform .3s ease;
}
${P} .button:hover > .background::after { opacity: 1; transform: none; }
${S('buttonLabel')} {
  font-family: var(--ck-font-caps) !important;
  font-weight: 700 !important;
  letter-spacing: .03em !important;
  color: var(--ck-text) !important;
  text-shadow: 0 1px 0 #000, 0 0 4px #000 !important;
}
${S('button', '.disabled > .label')} { color: var(--ck-text-dim) !important; }

${S('widget')} {
  background: radial-gradient(circle at 50% 30%, var(--ck-iron-1), var(--ck-coal) 75%) !important;
  border-color: var(--ck-iron-2) !important;
  outline-color: var(--ck-iron-2) !important;
  box-shadow: 0 0 0 1px #000, inset 0 0 0 1px rgba(120,110,104,.25), inset 0 -3px 6px rgba(0,0,0,.6) !important;
  transition: box-shadow .18s ease;
}
${S('widget', ':hover')} {
  box-shadow: 0 0 0 1px #000, inset 0 0 0 1px var(--ck-a3), 0 0 8px var(--ck-glow) !important;
}
${S('widget', '.violet')},
${S('widget', '.blink-violet')} {
  box-shadow: 0 0 0 1px #000, inset 0 0 0 1px var(--ck-a4), 0 0 10px var(--ck-glow) !important;
}
${S('widget', '.blue')} { box-shadow: 0 0 0 1px #000, inset 0 0 0 1px rgba(80,96,176,.6) !important; }
${S('widget', '.disabled')} { opacity: .5; }
${S('widget', '::before')},
${S('widget', '::after')} { filter: var(--ck-widget-filter); }

/* =====================================================================
 * === SLOTY === (bez filtrów — przedmiot i jego rzadkość zostają nietknięte)
 * ===================================================================== */
${S('slot')} {
  background: radial-gradient(ellipse at 50% 35%, var(--ck-graphite), var(--ck-black) 78%) !important;
  border-image: none !important;
  border-radius: 0;
  box-shadow: inset 0 0 0 1px var(--ck-iron-2), inset 0 0 0 2px #000, inset 0 0 10px rgba(0,0,0,.85) !important;
}
${S('slot', ':hover')} {
  box-shadow: inset 0 0 0 1px var(--ck-a3), inset 0 0 12px var(--ck-glow-soft) !important;
}
${S('slotGrid')} { filter: var(--ck-tile-filter); }   /* zapas, zanim JS zmierzy kratkę */
${P} .ck-grid.ck-grid {
  background:
    linear-gradient(to right, var(--ck-grid-line) 0 1px, transparent 1px) 0 0 / var(--ck-cell-w) var(--ck-cell-h),
    linear-gradient(to bottom, var(--ck-grid-line) 0 1px, transparent 1px) 0 0 / var(--ck-cell-w) var(--ck-cell-h),
    radial-gradient(ellipse at 50% 0%, var(--ck-tint), transparent 70%),
    #070505 !important;
  box-shadow: inset -1px -1px 0 var(--ck-grid-line) !important;
  filter: none !important;
}
${S('gridBorder')} {
  border-image: none !important;
  border-color: var(--ck-iron-2) !important;
  box-shadow: 0 0 0 1px #000, 0 0 10px rgba(0,0,0,.6) !important;
}

/* === ZAKŁADKI W OKNACH === */
${S('windowTabs')} {
  background: var(--ck-noise), linear-gradient(180deg, var(--ck-iron-1), var(--ck-graphite)) !important;
  border-image: none !important;
  border-color: #000 !important;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.05) !important;
  color: var(--ck-text-dim) !important;
  font-family: var(--ck-font-caps) !important;
  font-weight: 700 !important;
  text-shadow: 0 1px 0 #000 !important;
}
${S('windowTabs', ':hover')} { color: var(--ck-text) !important; }
${S('windowTabs', '.active')} {
  box-shadow: inset 0 -2px 0 var(--ck-a3), inset 0 1px 0 rgba(255,255,255,.06) !important;
  color: var(--ck-text) !important;
}

/* =====================================================================
 * === SKANER SKÓREK === (logika z „Kociej Nocy”: JS oznacza drewno/pergamin klasami ck-skin/ck-edge/ck-ink)
 * ===================================================================== */
${P} .ck-skin {
  background: linear-gradient(180deg, rgba(22,18,18,.92), rgba(6,5,5,.95)) padding-box !important;
  border-image: none !important;
  border-color: transparent !important;
  box-shadow: inset 0 0 0 1px rgba(61,56,56,.45) !important;
  color: var(--ck-text) !important;
  text-shadow: none !important;
}
${P} .ck-edge { border-image: none !important; border-color: rgba(61,56,56,.75) !important; }
${P} .ck-ink  { color: var(--ck-text) !important; text-shadow: none !important; }
${P} .c-window .players-online__info {
  background: linear-gradient(90deg, transparent, var(--ck-tint) 50%, transparent) !important;
  border: 0 !important;
  box-shadow: inset 0 -1px 0 var(--ck-iron-2), inset 0 1px 0 rgba(61,56,56,.4) !important;
}
${P} .c-window .players-online__item { border-color: rgba(61,56,56,.4) !important; }
${P} .c-window .players-online__item:hover { background: var(--ck-glow-soft) !important; }
${P} .c-checkbox__label::before {
  background: var(--ck-black) !important;
  border: 1px solid var(--ck-iron-2) !important;
  border-radius: 0 !important;
  box-shadow: inset 0 1px 3px #000 !important;
}
${P} .c-checkbox input:checked + .c-checkbox__label::before {
  background: linear-gradient(180deg, var(--ck-a3), var(--ck-a1)) !important;
  border-color: var(--ck-a4) !important;
  box-shadow: 0 0 6px var(--ck-glow), inset 0 1px 0 rgba(255,255,255,.15) !important;
}
${P} .interface-layer [class*="interface-element-background-color-"],
${P} .c-window [class*="interface-element-background-color-"] {
  background-color: rgba(16,12,12,.95) !important;
  background-image: linear-gradient(180deg, color-mix(in srgb, var(--ck-a2) 22%, transparent), transparent 55%) !important;
}
${P} [class*="interface-element-box-shadow-"] {
  box-shadow: 0 0 0 1px var(--ck-iron-2), 0 0 0 2px #000, 0 0 12px rgba(0,0,0,.6) !important;
}
${P} [class*="interface-element-header-"] {
  background: var(--ck-noise), linear-gradient(180deg, var(--ck-a2), var(--ck-a1) 60%, var(--ck-coal)) !important;
  border-image: none !important;
  color: var(--ck-text) !important;
  text-shadow: 0 1px 0 #000, 0 0 8px var(--ck-glow-soft) !important;
}

/* =====================================================================
 * === PASKI === — kolory STAŁE (niezależne od wariantu)
 * ===================================================================== */
/* Kula HP: zawsze ciemna czerwień. Uwaga: bez filter/transform na .hp-indicator-wrapper-template (patrz KN). */
${S('hpOrbBlood')} {
  background-image:
    radial-gradient(120% 20% at 50% 0%, rgba(230,120,110,.45), rgba(180,40,40,.15) 45%, transparent 75%),
    linear-gradient(to top, #1a0303, #5c0d0d 55%, #8f1a1a 92%, #b02a2a) !important;
  background-size: 100% 100%, 100% 100% !important;
  background-repeat: no-repeat !important;
}
${S('hpOrbValue')} {
  font-family: var(--ck-font-caps) !important;
  color: #f0e6e0 !important;
  text-shadow: 0 0 6px rgba(90,10,10,.95), 0 1px 2px #000 !important;
}
${S('barTrack')} {
  background-color: #000 !important;
  border-radius: 0;
  box-shadow: inset 0 1px 3px #000, 0 0 0 1px var(--ck-iron-2) !important;
}
${S('hpFill')} {
  background: linear-gradient(180deg, rgba(255,255,255,.18), rgba(255,255,255,0) 50%, rgba(0,0,0,.3)),
              linear-gradient(90deg, var(--ck-hp-1), var(--ck-hp-2) 60%, var(--ck-hp-3)) !important;
  border-radius: 0;
}
${S('mpFill')} {
  background: linear-gradient(180deg, rgba(255,255,255,.18), rgba(255,255,255,0) 50%, rgba(0,0,0,.3)),
              linear-gradient(90deg, var(--ck-mp-1), var(--ck-mp-2) 60%, var(--ck-mp-3)) !important;
  border-radius: 0;
}
${S('expFill')} {
  background: linear-gradient(180deg, rgba(255,255,255,.16), rgba(255,255,255,0) 50%, rgba(0,0,0,.3)),
              linear-gradient(90deg, var(--ck-xp-1), var(--ck-xp-2) 60%, var(--ck-xp-3)) !important;
  border-radius: 0;
}
${S('barValue')} {
  font-family: var(--ck-font-caps) !important;
  font-weight: 700 !important;
  color: #f2ece6 !important;
  text-shadow: 0 1px 2px #000, 0 0 3px #000 !important;
}

/* =====================================================================
 * === CZAT === — ciemne tło, kolory kanałów zachowane, lekko przytłumione
 * ===================================================================== */
${S('chat')} {
  background: radial-gradient(120% 50% at 50% 100%, var(--ck-tint), transparent 70%), var(--ck-noise), rgba(7,5,5,.96) !important;
}
${S('chatMessage')} {
  font-family: var(--ck-font-body) !important;
  font-size-adjust: .48;
  filter: saturate(.78) brightness(.94);
  text-shadow: 0 1px 1px rgba(0,0,0,.9);
}
${S('chatTabs')} {
  background: var(--ck-noise), linear-gradient(180deg, var(--ck-iron-1), var(--ck-graphite)) !important;
  border-color: #000 !important;
  border-radius: 0 !important;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.05) !important;
  color: var(--ck-text-dim) !important;
  font-family: var(--ck-font-caps) !important;
  font-weight: 700 !important;
}
${S('chatTabs', ':hover')} { color: var(--ck-text) !important; }
${S('chatTabs', '.active')} {
  box-shadow: inset 0 -2px 0 var(--ck-a3) !important;
  color: var(--ck-text) !important;
}
${S('chatInput')} {
  background: rgba(0,0,0,.95) !important;
  color: var(--ck-text) !important;
  border-color: var(--ck-iron-2) !important;
  caret-color: var(--ck-a4);
}

/* =====================================================================
 * === SCROLLBARY === — czarny tor, żelazny uchwyt z obwódką w kolorze wariantu
 * ===================================================================== */
${S('scrollTrack')} {
  background: rgba(0,0,0,.92) !important;
  border-radius: 0;
  box-shadow: inset 0 0 0 1px var(--ck-iron-1) !important;
}
${S('scrollHandle')} {
  background: linear-gradient(90deg, var(--ck-iron-1), var(--ck-iron-3) 50%, var(--ck-iron-1)) !important;
  border-radius: 0 !important;
  box-shadow: inset 0 0 0 1px var(--ck-a2), 0 0 4px rgba(0,0,0,.8) !important;
}
${P} .interface-layer *, ${P} .c-window *, ${P} .tip-wrapper * {
  scrollbar-width: thin;
  scrollbar-color: var(--ck-iron-2) #000;
}
html.${ROOT_CLASS} ::-webkit-scrollbar { width: 8px; height: 8px; }
html.${ROOT_CLASS} ::-webkit-scrollbar-track { background: #000; }
html.${ROOT_CLASS} ::-webkit-scrollbar-thumb {
  background: linear-gradient(90deg, var(--ck-iron-1), var(--ck-iron-3) 50%, var(--ck-iron-1));
  border: 1px solid #000;
  box-shadow: inset 0 0 0 1px var(--ck-a2);
  border-radius: 0;
}
html.${ROOT_CLASS} ::-webkit-scrollbar-corner { background: #000; }

/* =====================================================================
 * === TOOLTIPY === — ciemny, brudny pergamin w żelaznej ramce z nitami; rzadkość na górnej krawędzi
 * ===================================================================== */
${S('tooltip')} {
  --ck-rarity: var(--ck-iron-3);
  background:
    ${ICONS.tipTL} left 0 top 0 / 16px 16px no-repeat,
    ${ICONS.tipTR} right 0 top 0 / 16px 16px no-repeat,
    ${ICONS.tipBR} right 0 bottom 0 / 16px 16px no-repeat,
    ${ICONS.tipBL} left 0 bottom 0 / 16px 16px no-repeat,
    radial-gradient(130% 40% at 50% 0%, color-mix(in srgb, var(--ck-rarity) 14%, transparent), transparent 70%) no-repeat,
    radial-gradient(ellipse 40% 30% at 85% 80%, rgba(70,48,30,.22), transparent 70%) no-repeat,
    radial-gradient(ellipse 35% 25% at 12% 60%, rgba(60,40,26,.2), transparent 70%) no-repeat,
    radial-gradient(140% 120% at 50% 50%, transparent 55%, rgba(0,0,0,.6)) no-repeat,
    var(--ck-noise),
    #110d0a !important;
  border: 1px solid var(--ck-iron-2) !important;
  border-top: 2px solid var(--ck-rarity) !important;
  border-image: none !important;
  border-radius: 0 !important;
  box-shadow: 0 0 0 1px #000, inset 0 0 0 1px rgba(0,0,0,.8), inset 0 0 18px rgba(0,0,0,.55), 0 12px 28px rgba(0,0,0,.85) !important;
  color: #d8cdbf !important;
  font-family: var(--ck-font-body) !important;
  font-size-adjust: .48;
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
  border-color: rgba(87,80,76,.4) !important;
}
${P} .tip-wrapper > *,
${P} .tip-wrapper .content,
${P} .tip-wrapper [class*="section"],
${P} .tip-wrapper [class*="head"],
${P} .tip-wrapper [class*="description"] {
  color: #d8cdbf !important;
}
${S('tooltipItemName')} {
  font-family: var(--ck-font-caps) !important;
  font-weight: 700 !important;
  letter-spacing: .02em !important;
  text-shadow: 0 0 10px color-mix(in srgb, var(--ck-rarity) 40%, transparent), 0 1px 0 #000 !important;
}
${rarityCss}

/* === POLA TEKSTOWE === */
${S('input')} {
  background: rgba(0,0,0,.95) !important;
  color: var(--ck-text) !important;
}
${S('inputFrame')} {
  border-image: linear-gradient(180deg, var(--ck-iron-2), var(--ck-iron-1)) 1 !important;
  background-color: rgba(0,0,0,.95) !important;
}

/* =====================================================================
 * === ANIMACJE === — mgła/dym na dole mapy (tylko transform + opacity, nie przechwytuje kliknięć)
 * ===================================================================== */
${P} .ck-fog {
  display: block;
  position: absolute; left: 0; right: 0; bottom: 0; height: 24%;
  overflow: hidden;
  pointer-events: none;
  z-index: 1;
  opacity: .5;
}
${P} .ck-fog::before,
${P} .ck-fog::after {
  content: '';
  position: absolute; bottom: -20%; left: -25%;
  width: 150%; height: 140%;
  background:
    radial-gradient(ellipse 22% 40% at 20% 80%, var(--ck-fog), transparent 70%),
    radial-gradient(ellipse 26% 45% at 55% 92%, var(--ck-fog), transparent 70%),
    radial-gradient(ellipse 20% 38% at 85% 85%, var(--ck-fog), transparent 70%);
  will-change: transform;
}
${P} .ck-fog::after { opacity: .7; transform: translateX(10%) scaleX(-1); }
${PA} .ck-fog::before { animation: ck-fog 70s ease-in-out infinite alternate; }
${PA} .ck-fog::after  { animation: ck-fog2 90s ease-in-out infinite alternate; }
@keyframes ck-fog  { from { transform: translateX(0); } to { transform: translateX(14%); } }
@keyframes ck-fog2 { from { transform: translateX(10%) scaleX(-1); } to { transform: translateX(-6%) scaleX(-1); } }

@media (prefers-reduced-motion: reduce) {
  html.${ROOT_CLASS} .ck-glow,
  html.${ROOT_CLASS} .ck-fog::before, html.${ROOT_CLASS} .ck-fog::after { animation: none !important; }
  html.${ROOT_CLASS} .button > .background::after { transition: none !important; }
}

/* =====================================================================
 * === SZKARŁAT: BELKI I TABLICZKA HUD === (tylko ten wariant — Butelkowa Zieleń zostaje bez zmian)
 * ===================================================================== */
/* Belki: czerń, ledwo widoczna ślepa arkada, cienkie krwiste linie przy krawędziach */
${PC} .interface-layer > .top.positioner > .bg,
${PC} .interface-layer > .bottom.positioner > .bg {
  background:
    linear-gradient(90deg, transparent, var(--ck-a3) 50%, transparent) 0 0 / 100% 1px no-repeat,
    linear-gradient(90deg, transparent, var(--ck-a3) 50%, transparent) 0 100% / 100% 1px no-repeat,
    linear-gradient(90deg, transparent 2%, #120e0e 20% 80%, transparent 98%) 0 3px / 100% 1px no-repeat,
    linear-gradient(90deg, transparent 2%, #120e0e 20% 80%, transparent 98%) 0 calc(100% - 3px) / 100% 1px no-repeat,
    ${ICONS.arcadeBgDark} 0 50% / 14px 9px repeat-x,
    var(--ck-noise),
    linear-gradient(180deg, #070404, #020101 45%, #000 100%) !important;
  box-shadow: inset 0 0 0 1px #000 !important;
}

/* Tabliczka: czarna płyta w podwójnej żelaznej ramie z krwistą inkrustacją */
${PC} .top.positioner .hud-container {
  background:
    radial-gradient(80% 140% at 50% 125%, rgba(55,7,7,.28), transparent 60%),
    radial-gradient(140% 100% at 50% 50%, transparent 55%, rgba(0,0,0,.85)),
    var(--ck-noise),
    linear-gradient(180deg, #000, #040202 55%, #0a0505) !important;
  box-shadow:
    inset 0 0 0 1px #000, inset 0 0 0 3px #171212, inset 0 0 0 4px #000,
    inset 0 0 0 5px rgba(79,10,10,.75), inset 0 0 0 6px #000,
    inset 0 -12px 18px rgba(0,0,0,.8),
    0 0 0 1px #000, 0 0 0 3px #171212, 0 0 0 4px #000,
    0 14px 30px rgba(0,0,0,.92) !important;
}
${PC} .top.positioner .hud-container::before,
${PC} .top.positioner .hud-container::after { display: none !important; }   /* stara rozeta z mieczami → wiszący łuk niżej */
${PC} .hud-container .heroname {
  font-family: var(--ck-font-gothic) !important;
  font-size: 15px !important;
  letter-spacing: .04em !important;
  color: var(--ck-title) !important;
  text-shadow: 0 0 10px rgba(110,14,14,.55), 0 1px 0 #000, 0 0 3px #000 !important;
}
${PC} .hud-container .btn-min {
  background: linear-gradient(180deg, #1c1616, #090606) !important;
  box-shadow: inset 0 0 0 1px var(--ck-a3), inset 0 1px 0 rgba(255,255,255,.06), 0 0 0 1px #000 !important;
}

/* Ozdoby tabliczki (.ck-hud-deco — doklejane przez JS do .hud-container) */
${PC} .ck-hud-deco {
  display: block;
  position: absolute; inset: 0;
  pointer-events: none;
  z-index: 2;
}
${PC} .ck-hud-deco > i { position: absolute; display: block; filter: drop-shadow(0 2px 2px #000); }
${PC} .ck-hud-deco > i::before, ${PC} .ck-hud-deco > i::after { content: ''; position: absolute; inset: 0; }
/* Wiszący ośli łuk z mieczami pośrodku */
${PC} .ck-hud-deco > .ck-hud-crest { left: 50%; top: calc(100% - 1px); width: 108px; height: 50px; margin-left: -54px; }
${PC} .ck-hud-crest::before { ${MASK(ICONS.hudCrestInlay)} background: linear-gradient(180deg, #4f0a0a, #210404 70%, #0e0202); }
${PC} .ck-hud-crest::after  { ${MASK(ICONS.hudCrestIron)} background: ${IRON_BG}; }
/* Wiszące sterczyny po bokach */
${PC} .ck-hud-deco > .ck-hud-pend { top: calc(100% - 1px); width: 14px; height: 36px; }
${PC} .ck-hud-deco > .ck-hud-pend.ck-l { left: 22%; margin-left: -7px; }
${PC} .ck-hud-deco > .ck-hud-pend.ck-r { left: 78%; margin-left: -7px; }
${PC} .ck-hud-pend::before { ${MASK(ICONS.pendantIron)} background: ${IRON_BG}; }
${PC} .ck-hud-pend::after  { ${MASK(ICONS.pendantInlay)} background: linear-gradient(180deg, var(--ck-a4), var(--ck-a2)); }
/* Koronka ostrołuków wzdłuż dolnej krawędzi */
${PC} .ck-hud-deco > .ck-hud-lace {
  left: 10px; right: 10px; top: 100%; height: 8px;
  -webkit-mask: ${ICONS.lace} 0 0 / 14px 8px repeat-x; mask: ${ICONS.lace} 0 0 / 14px 8px repeat-x;
  background: ${IRON_BG};
  filter: none;
}
/* Okute narożniki u dołu (sterczyna na zewnątrz) */
${PC} .ck-hud-deco > .ck-hud-corner { width: 34px; height: 34px; bottom: -5px; }
${PC} .ck-hud-deco > .ck-hud-corner.ck-l { left: -5px; transform: scaleY(-1); }
${PC} .ck-hud-deco > .ck-hud-corner.ck-r { right: -5px; transform: scale(-1, -1); }
${PC} .ck-hud-corner::before { ${MASK(ICONS.cornerIron, '0 0 / 100% 100%')} background: ${IRON_BG}; }
${PC} .ck-hud-corner::after  { ${MASK(ICONS.cornerInlay, '0 0 / 100% 100%')} background: ${INLAY_BG}; }

/* =====================================================================
 * === ZABEZPIECZENIE: mapa i znaczniki rzadkości bez filtrów ===
 * ===================================================================== */
${P} #GAME_CANVAS, ${P} .item .highlight { filter: none !important; }
`;
  }

  /** Przełącznik i panel — style niezależne od włączenia motywu (zmienne z html[data-ck-variant]). */
  const UI_CSS = `
#ck-toggle {
  position: fixed; left: 6px; bottom: 38px; z-index: 2147483000;   /* nad ikonką „Kociej Nocy” (6px/6px) */
  width: 26px; height: 26px; padding: 0; margin: 0;
  background: radial-gradient(circle at 50% 35%, #2a2626, #050404 80%);
  border: 1px solid #3d3838; border-radius: 0;
  box-shadow: 0 0 0 1px #000, 0 2px 6px rgba(0,0,0,.7);
  opacity: .5; cursor: pointer;
  transition: opacity .18s ease, box-shadow .18s ease;
}
#ck-toggle::before {
  content: ''; position: absolute; inset: 3px;
  ${MASK(ICONS.swordsCross)}
  background: linear-gradient(180deg, #8a817b, var(--ck-a4, #9e1b1b));
}
#ck-toggle.ck-off::before { background: #4a4440; }
#ck-toggle:hover, #ck-toggle:focus-visible, #ck-toggle[aria-expanded="true"] {
  opacity: 1; outline: none;
  box-shadow: 0 0 0 1px #000, 0 0 10px var(--ck-glow, rgba(158,27,27,.55));
}
#ck-panel {
  position: fixed; left: 6px; bottom: 70px; z-index: 2147483001;
  width: 268px; box-sizing: border-box; padding: 9px 10px 10px;
  background: ${ICONS.noise}, radial-gradient(120% 60% at 50% 0%, var(--ck-tint, transparent), transparent 70%), linear-gradient(180deg, #141010, #070505);
  border: 1px solid #3d3838; border-radius: 0;
  box-shadow: 0 0 0 1px #000, inset 0 0 0 1px rgba(0,0,0,.9), 0 10px 26px rgba(0,0,0,.85);
  color: #d9cfc4;
  font: 600 12px var(--ck-font-caps, Georgia, serif);
}
#ck-panel[hidden] { display: none; }
#ck-panel .ck-p-title {
  font-family: var(--ck-font-gothic, serif); font-weight: 400; font-size: 19px; line-height: 1.1;
  text-align: center; letter-spacing: .04em;
  text-shadow: 0 0 10px var(--ck-glow, transparent), 0 1px 0 #000;
}
#ck-panel .ck-p-sep {
  height: 9px; margin: 3px auto 6px; width: 140px;
  ${MASK(ICONS.dividerIron)}
  background: linear-gradient(160deg, #8f8680, #57504c 30%, #2a2626);
}
#ck-panel .ck-row {
  display: flex; align-items: center; gap: 7px;
  width: 100%; box-sizing: border-box; margin: 5px 0 0; padding: 6px 8px;
  background: linear-gradient(180deg, #2a2626, #141010);
  border: 1px solid #050404; border-radius: 0;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.06), inset 0 0 0 1px rgba(87,80,76,.3);
  color: #d9cfc4; font: inherit; text-align: left; cursor: pointer;
  transition: box-shadow .18s ease, border-color .18s ease;
}
#ck-panel .ck-row:hover, #ck-panel .ck-row:focus-visible {
  outline: none; border-color: var(--ck-a3, #7a1414);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.06), 0 0 8px var(--ck-glow, transparent);
}
#ck-panel .ck-row i {
  flex: none; width: 7px; height: 7px; transform: rotate(45deg);
  background: #2a2626; box-shadow: inset 0 0 0 1px #000;
}
#ck-panel .ck-row[aria-pressed="true"] i { background: var(--ck-a4, #9e1b1b); box-shadow: 0 0 6px var(--ck-glow, transparent); }
#ck-panel .ck-row span { flex: 1; }
#ck-panel .ck-row b { font-weight: 400; color: #a39890; font-family: var(--ck-font-body, Georgia, serif); font-size: 13px; }
#ck-panel kbd {
  font: 10px var(--ck-font-body, Georgia, serif); color: #8f857d;
  border: 1px solid #3d3838; border-radius: 0; padding: 0 3px; background: #0c0909;
}
#ck-toast {
  position: fixed; left: 38px; bottom: 38px; z-index: 2147483001;
  max-width: 320px; box-sizing: border-box; padding: 8px 26px 8px 10px;
  background: #0c0909; border: 1px solid #3d3838; border-left: 3px solid var(--ck-a3, #7a1414); border-radius: 0;
  box-shadow: 0 0 0 1px #000, 0 8px 22px rgba(0,0,0,.8);
  color: #d9cfc4; font: 13px/1.35 var(--ck-font-body, Georgia, serif);
  opacity: 0; transform: translateY(6px);
  transition: opacity .3s ease, transform .3s ease;
}
#ck-toast.ck-show { opacity: 1; transform: none; }
#ck-toast button {
  position: absolute; top: 4px; right: 4px; width: 18px; height: 18px; padding: 0;
  background: none; border: 0; color: #8f857d; font: 14px/1 Georgia, serif; cursor: pointer;
}
@media (prefers-reduced-motion: reduce) { #ck-toast, #ck-toggle, #ck-panel .ck-row { transition: none; } }
`;

  /* ======================================================================
   * WSTRZYKIWANIE
   * ====================================================================== */

  let themeStyle = null;
  let uiStyle = null;

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
    if (document.getElementById('ck-fonts')) return;
    const link = document.createElement('link');
    link.id = 'ck-fonts';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&family=Crimson+Text:wght@400;600;700&family=Pirata+One&family=UnifrakturMaguntia&display=swap';
    (document.head || document.documentElement).appendChild(link);
  }

  /** Styl motywu zawsze na końcu <head> — chyba że działa „Kocia Noc”, która robi to samo
      (dwa takie obserwatory przestawiałyby arkusze bez końca). */
  function keepStyleLast() {
    const head = document.head;
    if (!head) return;
    let t = 0;
    new MutationObserver(() => {
      clearTimeout(t);
      t = setTimeout(() => {
        if (knPresent()) return;
        if (themeStyle && head.lastElementChild !== themeStyle) head.appendChild(themeStyle);
      }, 500);
    }).observe(head, { childList: true });
  }

  /* ======================================================================
   * STAN NA <html>, PRZEŁĄCZNIK I PANEL
   * ====================================================================== */

  function applyState() {
    const root = document.documentElement;
    const on = isEnabled();
    const variant = getVariant();
    root.classList.toggle(ROOT_CLASS, on);
    root.classList.toggle(ANIM_CLASS, isAnim());
    if (root.getAttribute('data-ck-variant') !== variant) root.setAttribute('data-ck-variant', variant);
    if (!on) setLowHp(false);
    updateUi();
  }

  function updateUi() {
    const btn = document.getElementById('ck-toggle');
    if (btn) {
      btn.classList.toggle('ck-off', !isEnabled());
      btn.title = `Crimson Knight: ${isEnabled() ? 'włączony' : 'wyłączony'} · wariant: ${VARIANTS[getVariant()]}`;
    }
    const panel = document.getElementById('ck-panel');
    if (!panel) return;
    const set = (act, pressed, label) => {
      const row = panel.querySelector(`[data-act="${act}"]`);
      if (!row) return;
      row.setAttribute('aria-pressed', String(pressed));
      row.querySelector('b').textContent = label;
    };
    set('theme', isEnabled(), isEnabled() ? 'wł.' : 'wył.');
    set('variant', true, VARIANTS[getVariant()]);
    set('anim', isAnim(), isAnim() ? 'wł.' : 'wył.');
    const kbdT = panel.querySelector('[data-act="theme"] kbd');
    if (kbdT) kbdT.textContent = knPresent() ? 'Alt+Shift+T' : 'Alt+T';
  }

  function toggleTheme() {
    setVal(KEY_ENABLED, !isEnabled());
    applyState();
    if (isEnabled()) decorate();
    LOG(isEnabled() ? 'motyw włączony' : 'motyw wyłączony');
  }

  function toggleVariant() {
    setVal(KEY_VARIANT, getVariant() === 'crimson' ? 'green' : 'crimson');
    applyState();
    LOG('wariant: ' + VARIANTS[getVariant()]);
  }

  function toggleAnim() {
    setVal(KEY_ANIM, !isAnim());
    applyState();
    LOG(isAnim() ? 'animacje włączone' : 'animacje wyłączone');
  }

  /** Zdarzenia z przycisku i panelu nie trafiają do gry. */
  const shield = (el) => ['mousedown', 'mouseup', 'click', 'dblclick', 'wheel', 'keydown', 'contextmenu', 'touchstart']
    .forEach((t) => el.addEventListener(t, (e) => e.stopPropagation()));

  function createUi() {
    if (!document.body || document.getElementById('ck-toggle')) return;
    const btn = document.createElement('button');
    btn.id = 'ck-toggle';
    btn.type = 'button';
    btn.setAttribute('data-ck', '');
    btn.setAttribute('aria-label', 'Ustawienia motywu Crimson Knight');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', 'ck-panel');
    shield(btn);
    btn.addEventListener('click', (e) => { e.preventDefault(); setPanel(document.getElementById('ck-panel').hidden); });

    const panel = document.createElement('div');
    panel.id = 'ck-panel';
    panel.hidden = true;
    panel.setAttribute('data-ck', '');
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Crimson Knight');
    const row = (act, label, key) =>
      `<button type="button" class="ck-row" data-act="${act}"><i></i><span>${label}</span><b></b><kbd>${key}</kbd></button>`;
    panel.innerHTML =
      '<div class="ck-p-title">Crimson Knight</div><div class="ck-p-sep"></div>' +
      row('theme', 'Motyw', 'Alt+T') + row('variant', 'Wariant', 'Alt+V') + row('anim', 'Animacje', 'Alt+A');
    shield(panel);
    panel.addEventListener('click', (e) => {
      const r = e.target.closest('.ck-row');
      if (!r) return;
      e.preventDefault();
      ({ theme: toggleTheme, variant: toggleVariant, anim: toggleAnim })[r.dataset.act]();
    });

    document.body.appendChild(panel);
    document.body.appendChild(btn);
    updateUi();
  }

  function setPanel(open) {
    const panel = document.getElementById('ck-panel');
    const btn = document.getElementById('ck-toggle');
    if (!panel || !btn) return;
    panel.hidden = !open;
    btn.setAttribute('aria-expanded', String(open));
    if (open) updateUi();
  }

  // Zamknięcie panelu kliknięciem obok lub Esc (zdarzenie idzie dalej do gry — nic nie blokujemy).
  function onDocMouseDown(e) {
    const panel = document.getElementById('ck-panel');
    if (panel && !panel.hidden && !e.target.closest?.('#ck-panel, #ck-toggle')) setPanel(false);
    // Aktywne okno = ostatnio kliknięte (tylko klasa do poświaty)
    const win = e.target.closest?.(SELECTORS.window.join(','));
    if (win && !win.classList.contains('ck-active-win')) {
      document.querySelectorAll('.ck-active-win').forEach((w) => w.classList.remove('ck-active-win'));
      win.classList.add('ck-active-win');
    }
  }

  /**
   * Skróty: Alt+T motyw, Alt+V wariant, Alt+A animacje. Bez Ctrl (AltGr = Ctrl+Alt, więc polskie
   * znaki ą/ć… nie wyzwalają skrótów). Gdy działa „Kocia Noc” (też Alt+T), nasz motyw przełącza Alt+Shift+T.
   */
  function onKey(e) {
    if (e.key === 'Escape') { setPanel(false); return; }
    if (!e.altKey || e.ctrlKey || e.metaKey || e.repeat) return;
    let action = null;
    if (e.code === 'KeyT' && (e.shiftKey || !knPresent())) action = toggleTheme;
    else if (!e.shiftKey && e.code === 'KeyV') action = toggleVariant;
    else if (!e.shiftKey && e.code === 'KeyA') action = toggleAnim;
    if (!action) return;
    e.preventDefault();
    e.stopPropagation();
    action();
  }

  /* ======================================================================
   * OZDOBNIKI W DOM (gotyckie narożniki, szczyty, koronki, rozety, blanki, poświata, mgła)
   * Jeden MutationObserver (debounce) — każdy element dostaje ozdobniki raz.
   * ====================================================================== */

  const mkDeco = (tag, cls) => {
    const el = document.createElement(tag);
    el.className = cls;
    el.setAttribute('data-ck', '');
    el.setAttribute('aria-hidden', 'true');
    return el;
  };

  function buildWindowDeco() {
    const deco = mkDeco('div', 'ck-deco');
    deco.innerHTML = '<i class="ck-glow"></i>' +
      (FEATURES.crest ? '<i class="ck-rose"></i>' : '') +
      (FEATURES.gothicFrame
        ? '<i class="ck-corner ck-tl"></i><i class="ck-corner ck-tr"></i><i class="ck-corner ck-bl"></i><i class="ck-corner ck-br"></i>' +
          '<i class="ck-gable"></i><i class="ck-lace"></i>'
        : '');
    return deco;
  }

  /** Dokleja ozdobnik do każdego hosta, który go jeszcze nie ma. */
  const ensureChild = (hostSel, cls, tag = 'i') => {
    document.querySelectorAll(hostSel).forEach((host) => {
      if (!host.querySelector(`:scope > .${cls}`)) host.appendChild(mkDeco(tag, cls));
    });
  };

  function decorate() {
    if (!isEnabled() || !document.body) return;
    document.querySelectorAll(SELECTORS.window.join(',')).forEach((win) => {
      let deco = win.querySelector(':scope > .ck-deco');
      if (!deco) { deco = buildWindowDeco(); win.appendChild(deco); }
      // Gra daje oknom przezroczysty border (12–20 px) — warstwa ozdobników sięga do zewnętrznej krawędzi okna.
      const cs = getComputedStyle(win);
      const bw = [cs.borderTopWidth, cs.borderRightWidth, cs.borderBottomWidth, cs.borderLeftWidth];
      const inset = bw.map((v) => `-${v}`).join(' ');
      if (deco.dataset.ckInset !== inset) { deco.dataset.ckInset = inset; deco.style.inset = inset; }
      const w = win.offsetWidth, h = win.offsetHeight;
      const big = w >= 300 && h >= 240;
      const small = w > 0 && (w < 200 || h < 110);
      if (deco.classList.contains('ck-big') !== big) deco.classList.toggle('ck-big', big);
      if (deco.classList.contains('ck-small') !== small) deco.classList.toggle('ck-small', small);
    });
    if (FEATURES.barOrnaments) {
      ensureChild(SELECTORS.barTopHost.join(','), 'ck-bar-lace');
      ensureChild(SELECTORS.barBottomHost.join(','), 'ck-bar-wall');
    }
    // Ozdoby tabliczki HUD (widoczne tylko w Szkarłacie — CSS pod data-ck-variant="crimson")
    document.querySelectorAll(SELECTORS.hud.join(',')).forEach((hud) => {
      if (hud.querySelector(':scope > .ck-hud-deco')) return;
      const d = mkDeco('div', 'ck-hud-deco');
      d.innerHTML = '<i class="ck-hud-lace"></i><i class="ck-hud-corner ck-l"></i><i class="ck-hud-corner ck-r"></i>' +
        '<i class="ck-hud-pend ck-l"></i><i class="ck-hud-pend ck-r"></i><i class="ck-hud-crest"></i>';
      hud.appendChild(d);
    });
    if (FEATURES.crest) ensureChild(SELECTORS.column.join(','), 'ck-col-crest');
    if (FEATURES.fog) {
      const host = document.querySelector(SELECTORS.fogHost.join(','));
      if (host && !host.querySelector(':scope > .ck-fog')) host.appendChild(mkDeco('div', 'ck-fog'));
    }
  }

  let decorateTimer = 0;
  function scheduleDecorate() {
    clearTimeout(decorateTimer);
    decorateTimer = setTimeout(decorate, 300);
  }

  /* ======================================================================
   * NISKIE HP — tylko odczyt wyglądu kuli HP (wysokość „krwi” = procent HP, jak opisano w KN)
   * ====================================================================== */

  function setLowHp(low) {
    const root = document.documentElement;
    if (root.hasAttribute('data-ck-lowhp') !== low) root.toggleAttribute('data-ck-lowhp', low);
  }

  function checkHp() {
    if (!FEATURES.lowHpPulse || !isEnabled()) return;
    // Najpierw napis z procentem na kuli (w grze: „100%”), zapasowo wysokość „krwi” względem kuli.
    let pct = null;
    const v = document.querySelector(SELECTORS.hpOrbValue.join(','));
    const m = v && /(\d+(?:[.,]\d+)?)\s*%/.exec(v.textContent || '');
    if (m) pct = parseFloat(m[1].replace(',', '.'));
    if (pct === null) {
      const orb = document.querySelector(SELECTORS.hpOrb[0]);
      const blood = document.querySelector(SELECTORS.hpOrbBlood[0]);
      if (orb && blood && orb.offsetHeight > 0) pct = (blood.offsetHeight / orb.offsetHeight) * 100;
    }
    setLowHp(pct !== null && pct > 0 && pct < LOW_HP_PCT);
  }

  /* ======================================================================
   * „KOCIA NOC” AKTYWNA RÓWNOCZEŚNIE — jednorazowa informacja
   * ====================================================================== */

  function checkKociaNoc() {
    if (getVal(KEY_KN_NOTICE, false) || !knActive() || !isEnabled() || !document.body) return;
    setVal(KEY_KN_NOTICE, true);
    const t = document.createElement('div');
    t.id = 'ck-toast';
    t.setAttribute('data-ck', '');
    t.setAttribute('role', 'status');
    t.innerHTML = '<b>Crimson Knight:</b> wykryto włączony motyw „Kocia Noc”. Oba motywy zmieniają te same elementy ' +
      'i mogą się gryźć — zostaw jeden. Kocią Noc wyłączysz przez Alt+T, a Crimson Knight przez Alt+Shift+T albo ikonkę mieczy.' +
      '<button type="button" aria-label="Zamknij">×</button>';
    shield(t);
    const close = () => { t.classList.remove('ck-show'); setTimeout(() => t.remove(), 400); };
    t.querySelector('button').addEventListener('click', close);
    document.body.appendChild(t);
    requestAnimationFrame(() => t.classList.add('ck-show'));
    setTimeout(close, 14000);
    LOG('wykryto aktywną „Kocią Noc” — motywy mogą się gryźć.');
  }

  /* ======================================================================
   * SKANER SKÓREK (logika z „Kociej Nocy”, klasy ck-*)
   * Sprawdza wygląd nowych elementów w oknach (raz na element) i oznacza:
   *   ck-skin — grafika z /img/gui/ gry, jasne lub brązowe tło → czarny panel,
   *   ck-edge — brązowa/jasna cienka ramka → żelazna linia,
   *   ck-ink  — ciemny tekst (pod pergamin) → jasny tekst.
   * ====================================================================== */

  const GUI_RE = /\/img\/gui\//i;
  const ICON_RE = /buttony|addons-icons|krew|oneItemSlot|emots|obrazki|progressbar/i;
  const skinChecked = new WeakSet();
  const skinSeenVisible = new WeakSet();
  const skinQueue = [];
  let skinFlushScheduled = false;
  const SKIP_SEL = SELECTORS.skinSkip.join(',');
  const SCOPE_SEL = SELECTORS.skinScope.join(',');

  function parseRgb(str) {
    const m = /rgba?\(([^)]+)\)/.exec(str || '');
    if (!m) return null;
    const p = m[1].split(/[\s,/]+/).filter(Boolean).map(parseFloat);
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  }
  function toHsl({ r, g, b }) {
    r /= 255; g /= 255; b /= 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
    let h = 0, s = 0;
    if (d) {
      s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
      h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
      h *= 60; if (h < 0) h += 360;
    }
    return { h, s, l };
  }
  const isBrown = (c) => c.h >= 12 && c.h <= 50 && c.s > 0.25;
  const isPale = (c) => c.l > 0.55 && c.s < 0.85;
  const isGray = (c) => c.s < 0.15 && c.l > 0.2;
  const hasOwnText = (el) => { for (const n of el.childNodes) if (n.nodeType === 3 && n.nodeValue.trim()) return true; return false; };

  function classifySkin(el) {
    if (skinChecked.has(el) || !el.isConnected) return;
    if (el.closest(SKIP_SEL)) { skinChecked.add(el); return; }
    if (el.matches('.c-window')) { skinChecked.add(el); return; }
    const st = getComputedStyle(el);
    const visible = el.offsetWidth > 0;
    let skin = false, pending = false;
    for (const src of [st.backgroundImage, st.borderImageSource]) {
      if (!src || src === 'none' || !GUI_RE.test(src)) continue;
      if (!ICON_RE.test(src)) skin = true;
      else if (visible) skin = skin || (el.offsetWidth >= 80 && el.offsetHeight >= 14);
      else pending = true;
    }
    if (!skin) {
      const c = parseRgb(st.backgroundColor);
      if (c && c.a > 0.5) { const h = toHsl(c); if (isPale(h) || isGray(h) || (isBrown(h) && h.l < 0.5)) skin = true; }
    }
    let edge = false;
    const bw = Math.max(parseFloat(st.borderTopWidth) || 0, parseFloat(st.borderLeftWidth) || 0);
    if (bw >= 0.5 && bw <= 3 && (st.borderTopStyle !== 'none' || st.borderLeftStyle !== 'none')) {
      const c = parseRgb(st.borderTopStyle !== 'none' ? st.borderTopColor : st.borderLeftColor);
      if (c && c.a > 0.3) { const h = toHsl(c); if (isBrown(h) || isPale(h) || isGray(h)) edge = true; }
    }
    let ink = false;
    if (hasOwnText(el)) {
      const c = parseRgb(st.color);
      if (c) { const h = toHsl(c); if (h.l < 0.32 && (h.s < 0.35 || isBrown(h))) ink = true; }
    }
    if (skin) el.classList.add('ck-skin');
    if (edge) el.classList.add('ck-edge');
    if (ink) el.classList.add('ck-ink');
    if (!pending) skinChecked.add(el);
  }

  function enqueueSkin(root) {
    if (!FEATURES.skinScanner || !root || root.nodeType !== 1) return;
    skinQueue.push(root, ...root.querySelectorAll('*'));
    scheduleSkinFlush();
  }

  function scheduleSkinFlush() {
    if (skinFlushScheduled) return;
    skinFlushScheduled = true;
    const run = (deadline) => {
      skinFlushScheduled = false;
      let n = 0;
      while (skinQueue.length && n < 600 && (!deadline || deadline.timeRemaining() > 2 || n < 60)) { classifySkin(skinQueue.shift()); n++; }
      if (skinQueue.length) scheduleSkinFlush();
    };
    if (window.requestIdleCallback) requestIdleCallback(run, { timeout: 500 }); else setTimeout(run, 50);
  }

  function recheckSkins() {
    if (!FEATURES.skinScanner) return;
    document.querySelectorAll(SCOPE_SEL).forEach((w) => {
      if (w.offsetWidth > 0 && !skinSeenVisible.has(w)) { skinSeenVisible.add(w); enqueueSkin(w); }
    });
  }

  /** Kratki torby: rozmiar kratki odczytany z grafiki gry (logika z „Kociej Nocy”). */
  function fixGrids() {
    if (!FEATURES.gridFix) return;
    document.querySelectorAll(SELECTORS.slotGrid.join(',')).forEach((grid) => {
      if (grid.dataset.ckGrid) return;
      const st = getComputedStyle(grid);
      const m = /url\(["']?([^"')]+)["']?\)/.exec(st.backgroundImage || '');
      if (!m) return;
      grid.dataset.ckGrid = '1';
      const img = new Image();
      img.onload = () => {
        let w = img.naturalWidth, h = img.naturalHeight;
        const [sw, sh] = (st.backgroundSize || 'auto').split(' ');
        if (sw && sw.endsWith('px')) { const nw = parseFloat(sw); h = sh && sh.endsWith('px') ? parseFloat(sh) : h * (nw / w); w = nw; }
        if (!w || !h) return;
        grid.style.setProperty('--ck-cell-w', w + 'px');
        grid.style.setProperty('--ck-cell-h', h + 'px');
        grid.classList.add('ck-grid');
      };
      img.src = m[1];   // grafika jest już w pamięci podręcznej przeglądarki
    });
  }

  /* ======================================================================
   * OBSERWATOR DOM (jeden na wszystko, z debounce)
   * ====================================================================== */

  function watchDom() {
    new MutationObserver((records) => {
      let relevant = false;
      for (const r of records) {
        for (const node of r.addedNodes) {
          if (node.nodeType !== 1 || node.hasAttribute('data-ck') || node.id === 'mkn-legend') continue;
          relevant = true;
          if (FEATURES.skinScanner) {
            if (node.closest(SCOPE_SEL)) enqueueSkin(node);
            else if (node.querySelectorAll) node.querySelectorAll(SCOPE_SEL).forEach(enqueueSkin);
          }
        }
      }
      if (relevant) scheduleDecorate();
    }).observe(document.body, { childList: true, subtree: true });
  }

  /* ======================================================================
   * START
   * ====================================================================== */

  /** Samonaprawianie co 3 s: style, stan na <html>, przycisk, ozdobniki, kratki, okna widoczne pierwszy raz. */
  function heal() {
    const host = document.head || document.documentElement;
    if (themeStyle && !themeStyle.isConnected) host.appendChild(themeStyle);
    if (uiStyle && !uiStyle.isConnected) host.appendChild(uiStyle);
    const root = document.documentElement;
    if (root.classList.contains(ROOT_CLASS) !== isEnabled() || root.classList.contains(ANIM_CLASS) !== isAnim() ||
        root.getAttribute('data-ck-variant') !== getVariant()) applyState();
    createUi();
    decorate();
    fixGrids();
    recheckSkins();
    checkKociaNoc();
  }

  function start() {
    document.documentElement.setAttribute('data-ck-variant', getVariant());
    uiStyle = addStyle(UI_CSS, 'ck-ui-style');
    loadFonts();
    themeStyle = addStyle(buildCss(), 'ck-theme-style');
    keepStyleLast();
    createUi();
    applyState();
    window.addEventListener('keydown', onKey, true);
    document.addEventListener('mousedown', onDocMouseDown, { capture: true, passive: true });
    watchDom();
    decorate();
    fixGrids();
    recheckSkins();
    setInterval(heal, 3000);
    setInterval(checkHp, 1000);
    setTimeout(checkKociaNoc, 4000);
    LOG(`v${VERSION} aktywny (wariant: ${VARIANTS[getVariant()]}). Alt+T — motyw, Alt+V — wariant, Alt+A — animacje.`);
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
