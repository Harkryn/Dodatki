// ==UserScript==
// @name         Margonem – Dark Fantasy Theme
// @namespace    https://github.com/Harkryn/Dodatki
// @version      1.1.0
// @description  Mroczny motyw graficzny (dark fantasy) dla nowego interfejsu Margonem (NI). Zmienia wyłącznie wygląd UI — nie dotyka mapy ani logiki gry.
// @match        https://*.margonem.pl/*
// @match        https://margonem.pl/*
// @noframes
// @run-at       document-start
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @updateURL    https://raw.githubusercontent.com/Harkryn/Dodatki/main/margonem-dark-fantasy/margonem-dark-fantasy.user.js
// @downloadURL  https://raw.githubusercontent.com/Harkryn/Dodatki/main/margonem-dark-fantasy/margonem-dark-fantasy.user.js
// @supportURL   https://github.com/Harkryn/Dodatki
// ==/UserScript==

/*
 * Zasady działania
 *  1. Skrypt startuje przy document-start, ale NIC nie wstrzykuje, dopóki nie potwierdzi,
 *     że aktywny jest nowy interfejs (NI). Na starym interfejsie (SI) i na stronach bez gry
 *     kończy pracę bez śladu.
 *  2. Wszystkie reguły CSS są ograniczone klasą `mdf-on` na <html>. Wyłączenie motywu
 *     (Alt+T lub ikonka ✠ w lewym dolnym rogu) zdejmuje tę klasę — gra wraca do oryginału.
 *  3. Gra rysuje interfejs grafikami (border-image, sprite'y). Motyw podmienia je w dwojaki sposób:
 *       - elementy rozciągane (ramki okien, belki, tła, sloty) → własne gradienty CSS,
 *       - skomplikowane sprite'y (panel dolny, HUD, kula HP, dekory nagłówków) → przyciemnienie
 *         i ocieplenie filtrem (tylko małe, rzadko odświeżane elementy).
 *  4. Canvas mapy (#GAME_CANVAS), ikony przedmiotów i znaczniki rzadkości (.highlight.t-*)
 *     NIE są ruszane. Skrypt nie wysyła żądań do serwera gry i nie wywołuje funkcji gry.
 *
 * Selektory pochodzą z diagnostyki działającej gry (listopad 2026). Wpisy oznaczone „// ?”
 * to nadal przypuszczenia — sprawdź je w DevTools (F12), jeśli coś nie zmienia wyglądu.
 */

(() => {
  'use strict';

  if (window.top !== window.self) return;

  /* ======================================================================
   * KONFIGURACJA
   * ====================================================================== */

  const STORAGE_KEY = 'mdf.enabled';
  const ROOT_CLASS = 'mdf-on';
  const DETECT_TIMEOUT_MS = 45000; // po tym czasie bez znaczników NI skrypt się wyłącza
  const LOG = (...a) => console.info('%c[Dark Fantasy]', 'color:#b08d57;font-weight:bold', ...a);

  /**
   * Prefiks każdej reguły. Dwa `:not(#…)` podbijają specyficzność o 2 ID, dzięki czemu motyw
   * wygrywa z innymi dodatkami/motywami (np. nitheme), nawet gdy też używają !important.
   */
  const P = `html.${ROOT_CLASS}:not(#mdf-x):not(#mdf-y)`;

  /** Znaczniki wykrywania interfejsu. */
  const DETECT = {
    ni: [
      '.game-window-positioner',  // potwierdzone
      '.interface-layer',         // potwierdzone
      '.game-layer',              // potwierdzone
      '.c-window'                 // potwierdzone
    ],
    si: [
      '#centerbox',               // ? główny kontener SI
      '#base',                    // ? warstwa bazowa SI
      '#ground'                   // ? warstwa mapy SI
    ]
  };

  /**
   * Selektory UI pogrupowane w sekcje. CSS jest budowany z tych list — edytuj śmiało.
   * Bez komentarza = potwierdzone w grze. „// ?” = przypuszczenie.
   */
  const SELECTORS = {
    /* === OKNA === */
    window:          ['.c-window'],                                   // ramka: border-image window-frame.png
    windowOverlay:   ['.c-window > .border-image'],                   // dodatkowa warstwa ramki
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

    /* === RAMA INTERFEJSU (belki, kolumny) === */
    barTopBottom:    ['.interface-layer > .top.positioner > .bg', '.interface-layer > .bottom.positioner > .bg'],
    column:          ['.interface-layer > .main-column'],
    columnBorder:    ['.interface-layer > .main-column > .border'],
    hud:             ['.top.positioner .hud-container'],
    bottomPanelArt:  ['.bottom-panel .bottom-panel-graphic', '.bottom-panel .pointer-exp-graphic',
                      '.bottom-panel .pointer-ttl-graphic', '.exp-bar-wrapper .overlay'],

    /* === PRZYCISKI === */
    button:          ['.button'],                                     // struktura: .button > .background + .label
    buttonBg:        ['.button > .background'],
    buttonLabel:     ['.button > .label'],
    widget:          ['.widget-button'],                              // okrągłe/kwadratowe przyciski belek (.icon w środku)

    /* === SLOTY PRZEDMIOTÓW === */
    slot:            ['.interface-element-one-item-slot-background-to-repeat'],   // pojedynczy slot ekwipunku 34x34
    slotGrid:        ['.interface-element-item-slot-grid-stretch'],              // tło siatki torby

    /* === PASKI HP / MANA / EXP === */
    hpOrbBlood:      ['.hp-indicator .blood'],                        // animowana krew w kuli
    hpOrbGlass:      ['.hp-indicator-wrapper .glass'],
    barTrack:        ['[class*="interface-element-progress-bar-"]',
                      '.progress-bar-wrapper',                        // ? paski w walce
                      '.exp-bar-wrapper .exp-progress .progress'],
    hpFill:          ['.hero-hp-progress-bar .inner', '.hero-hp-top-progress-bar-light-mode .inner',
                      '.hp-progress-bar .inner', '.hp-progress-bar .progress-bar'],          // ? dwa ostatnie
    mpFill:          ['.hero-mp-progress-bar .inner', '.hero-mana-progress-bar .inner',      // ? mana — brak w diagnostyce
                      '.mp-progress-bar .inner', '.mana-progress-bar .inner', '.mp-progress-bar .progress-bar'],
    expFill:         ['.hero-exp-top-progress-bar-light-mode .inner', '.hero-exp-progress-bar .inner',
                      '.exp-bar-wrapper .exp-progress .progress .inner'],
    barValue:        ['[class*="interface-element-progress-bar-"] .value'],

    /* === CZAT === */
    chat:            ['.new-chat-window'],
    chatMessage:     ['.new-chat-window .new-chat-message'],
    chatTabs:        ['.chat-channel-card'],
    chatInput:       ['.new-chat-window input', '.new-chat-window textarea',
                      '.new-chat-window [contenteditable="true"]'],                         // ?

    /* === SCROLLBARY GRY (własne, nie systemowe) === */
    scrollTrack:     ['.scrollbar-wrapper .track'],
    scrollHandle:    ['.scrollbar-wrapper .track .handle'],

    /* === TOOLTIPY === */
    tooltip:         ['.tip-wrapper'],                                // ? nie było otwartego tooltipa w diagnostyce
    tooltipItemName: ['.tip-wrapper .item-name', '.tip-wrapper .item-head .name'],         // ?

    /* === POLA TEKSTOWE === */
    input:           ['.ni-input input', '.c-window input[type="text"]', '.c-window input[type="number"]',
                      '.c-window textarea'],
    inputFrame:      ['.ni-input.search-wrapper'],                    // border-image wyszukiwarki

    /* === NIE RUSZAĆ — tylko dokumentacja === */
    neverStyle:      ['#GAME_CANVAS', '.game-layer canvas', '.item .highlight', '.widget-button .icon']
  };

  /**
   * Kolory rzadkości przedmiotów (atrybut data-item-type — potwierdzone wartości t-norm, t-uniupg,
   * t-her, t-upgraded, t-leg). t-art (artefakt) to przypuszczenie.
   */
  const RARITY = {
    't-norm':     'var(--mdf-rar-common)',
    't-uniupg':   'var(--mdf-rar-unique)',    // unikat
    't-her':      'var(--mdf-rar-heroic)',    // heroik
    't-upgraded': 'var(--mdf-rar-upgraded)',  // ulepszony
    't-leg':      'var(--mdf-rar-legendary)', // legenda
    't-art':      'var(--mdf-rar-artifact)'   // ? artefakt
  };

  /* ======================================================================
   * STAN
   * ====================================================================== */

  const getEnabled = () => {
    try { return GM_getValue(STORAGE_KEY, true) !== false; } catch { return true; }
  };
  const setEnabled = (v) => {
    try { GM_setValue(STORAGE_KEY, !!v); } catch { /* brak zapisu — trudno */ }
  };

  /* ======================================================================
   * WYKRYWANIE INTERFEJSU
   * ====================================================================== */

  const anyMatch = (list) => list.some((s) => {
    try { return !!document.querySelector(s); } catch { return false; }
  });

  /** Zwraca 'ni', 'si' lub null (jeszcze nie wiadomo). */
  function detectInterface() {
    if (!document.body) return null;
    if (anyMatch(DETECT.ni)) return 'ni';
    if (anyMatch(DETECT.si)) return 'si';
    return null;
  }

  function whenInterfaceKnown(cb) {
    const first = detectInterface();
    if (first) return cb(first);

    let done = false;
    let timer = 0;
    let timeout = 0;
    const obs = new MutationObserver(() => {
      clearTimeout(timer); // debounce — gra dokłada setki węzłów przy starcie
      timer = setTimeout(() => {
        const r = detectInterface();
        if (r) finish(r);
      }, 250);
    });
    function finish(result) {
      if (done) return;
      done = true;
      obs.disconnect();
      clearTimeout(timer);
      clearTimeout(timeout);
      cb(result);
    }
    // document, bo documentElement przy document-start bywa jeszcze null
    obs.observe(document, { childList: true, subtree: true });
    timeout = setTimeout(() => finish(detectInterface()), DETECT_TIMEOUT_MS);
  }

  /* ======================================================================
   * BUDOWANIE CSS
   * ====================================================================== */

  /** Prefiksuje każdy selektor z grupy prefiksem P i dokleja opcjonalny sufiks (np. ':hover'). */
  const S = (key, suffix = '') => SELECTORS[key].map((s) => `${P} ${s}${suffix}`).join(',\n');

  // Szum generowany lokalnie (inline SVG feTurbulence) — brak zewnętrznych obrazków.
  const NOISE = `url("data:image/svg+xml;utf8,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160">' +
    '<filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" stitchTiles="stitch"/>' +
    '<feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .5 0"/></filter>' +
    '<rect width="100%" height="100%" filter="url(#n)"/></svg>'
  )}")`;

  function buildCss() {
    const rarityCss = Object.entries(RARITY).map(([type, color]) => `
${P} .tip-wrapper[data-item-type="${type}"] { --mdf-rarity: ${color}; }
${P} .tip-wrapper[data-item-type="${type}"] .item-name { color: ${color} !important; }`).join('');

    return `
/* =====================================================================
 * ZMIENNE — zmień tutaj, żeby przemalować cały motyw
 * ===================================================================== */
html.${ROOT_CLASS} {
  --mdf-black:      #0d0b0a;
  --mdf-graphite:   #1a1614;
  --mdf-wood:       #2a1f17;
  --mdf-wood-light: #3b2b1f;
  --mdf-gold:       #b08d57;
  --mdf-gold-light: #d9b779;
  --mdf-gold-dark:  #6e5532;
  --mdf-blood:      #7a1c1c;
  --mdf-blood-light:#b02a2a;
  --mdf-ghost:      #5fd3a6;   /* upiorna zieleń — podświetlenia */
  --mdf-arcane:     #8a5cf0;   /* mistyczny fiolet */
  --mdf-text:       #ddd0b6;
  --mdf-text-dim:   #a8987c;

  --mdf-bg-window:  rgba(18, 14, 12, .95);
  --mdf-bg-panel:   rgba(14, 11, 9, .92);

  --mdf-font-head:  'Cinzel', 'Trajan Pro', Georgia, serif;
  --mdf-font-body:  'Crimson Text', 'IM Fell English', Georgia, serif;

  --mdf-hp-1: #3d0808; --mdf-hp-2: #8f1a1a; --mdf-hp-3: #d23a3a;
  --mdf-mp-1: #1d1150; --mdf-mp-2: #4b2fb0; --mdf-mp-3: #7f6cf2;
  --mdf-xp-1: #4a3610; --mdf-xp-2: #a07a2a; --mdf-xp-3: #e2bf63;

  /* Rzadkość przedmiotów — muszą zostać rozpoznawalne */
  --mdf-rar-common:    #d8d0c0;
  --mdf-rar-unique:    #f2d75a;
  --mdf-rar-heroic:    #4fb4ff;
  --mdf-rar-upgraded:  #c58bff;
  --mdf-rar-legendary: #ff8c1a;
  --mdf-rar-artifact:  #ff4f4f;

  /* Filtr dla sprite'ów gry, których nie da się odtworzyć w CSS (przyciemnia i ociepla) */
  --mdf-sprite-filter: sepia(.55) saturate(.85) brightness(.72) contrast(1.12);

  --mdf-noise: ${NOISE};
  /* Kuty metal: ciemne krawędzie przetykane zgaszonym złotem */
  --mdf-metal: linear-gradient(135deg, #2a1f17 0%, #8a6a3a 18%, #3b2b1f 32%, #b08d57 50%, #3b2b1f 68%, #8a6a3a 82%, #1a1614 100%);
  --mdf-metal-v: linear-gradient(90deg, #0d0b0a, #6e5532 30%, #b08d57 50%, #6e5532 70%, #0d0b0a);
  --mdf-wood-bg:
    radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,.6) 100%),
    linear-gradient(180deg, rgba(59,43,31,.55), rgba(13,11,10,.25) 45%, rgba(42,31,23,.45)),
    var(--mdf-noise),
    linear-gradient(var(--mdf-bg-window), var(--mdf-bg-window));
}

/* =====================================================================
 * === OKNA ===
 * Oryginalna ramka to border-image (window-frame.png). Zastępujemy ją gradientem „kutego metalu”
 * o tej samej grubości, więc układ okna się nie przesuwa.
 * ===================================================================== */
${S('window')} {
  border-image: var(--mdf-metal) 1 !important;
  background-color: var(--mdf-bg-window) !important;
  background-image:
    radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,.55) 100%),
    linear-gradient(180deg, rgba(59,43,31,.4), rgba(13,11,10,.2) 40%, rgba(42,31,23,.35)),
    var(--mdf-noise) !important;
  box-shadow: 0 0 0 1px #000, 0 10px 28px rgba(0,0,0,.8), inset 0 0 0 1px rgba(217,183,121,.22), inset 0 0 40px rgba(0,0,0,.8) !important;
  color: var(--mdf-text) !important;
}
/* Przezroczystość okien ustawiana w grze (data-opacity-lvl) — zachowana. Zakres poziomów to ? */
${P} .c-window.transparent[data-opacity-lvl="1"] { background-color: rgba(18,14,12,.85) !important; }
${P} .c-window.transparent[data-opacity-lvl="2"] { background-color: rgba(18,14,12,.7) !important; }
${P} .c-window.transparent[data-opacity-lvl="3"] { background-color: rgba(18,14,12,.55) !important; }
${P} .c-window.transparent[data-opacity-lvl="4"] { background-color: rgba(18,14,12,.4) !important; }

${S('windowOverlay')} {
  border-image-source: none !important;
  border-color: transparent !important;
  background-image: none !important;
}
${S('windowContent')} {
  background-color: transparent !important;
  color: var(--mdf-text) !important;
  font-family: var(--mdf-font-body) !important;
}
${S('windowHeader')} {
  background-color: transparent !important;
  background-image:
    linear-gradient(90deg, transparent, rgba(122,28,28,.35) 20%, rgba(59,43,31,.9) 50%, rgba(122,28,28,.35) 80%, transparent),
    linear-gradient(180deg, rgba(217,183,121,.12), rgba(0,0,0,.3)) !important;
  border-bottom: 1px solid rgba(176,141,87,.45) !important;
}
${S('windowTitle')} {
  font-family: var(--mdf-font-head) !important;
  font-weight: 700 !important;
  letter-spacing: .08em !important;
  color: var(--mdf-gold-light) !important;
  text-shadow: 0 1px 0 #000, 0 0 8px rgba(176,141,87,.4) !important;
}
${S('windowDecor')},
${S('windowSmallBtn')} {
  filter: var(--mdf-sprite-filter);
  transition: filter .15s ease;
}
${S('windowSmallBtn', ':hover')} {
  filter: sepia(.3) saturate(1.6) hue-rotate(-20deg) brightness(1.1) drop-shadow(0 0 3px var(--mdf-blood-light));
}
${S('windowBottomBar')},
${S('headerBand')} {
  border-image: linear-gradient(180deg, #3b2b1f, #1a1614 60%, #0d0b0a) 1 fill !important;
  box-shadow: inset 0 1px 0 rgba(217,183,121,.35), 0 -1px 0 #000 !important;
}
${S('woodBackground')} {
  border-image: none !important;
  border-color: transparent !important;
  background: var(--mdf-wood-bg) !important;
}

/* =====================================================================
 * === RAMA INTERFEJSU (belki górna/dolna, kolumny, HUD) ===
 * ===================================================================== */
${S('barTopBottom')} {
  background:
    linear-gradient(180deg, rgba(217,183,121,.25) 0, transparent 2px, transparent calc(100% - 2px), rgba(217,183,121,.25) 100%),
    linear-gradient(180deg, #2a1f17, #120e0c 55%, #0d0b0a),
    var(--mdf-noise) !important;
  box-shadow: inset 0 0 0 1px #000, inset 0 0 18px rgba(0,0,0,.8) !important;
}
${S('column')} {
  background-color: var(--mdf-bg-panel) !important;
  background-image:
    linear-gradient(180deg, rgba(59,43,31,.35), rgba(13,11,10,.2) 30%, rgba(42,31,23,.3)),
    var(--mdf-noise) !important;
}
${S('columnBorder')} {
  background: var(--mdf-metal-v) !important;
  box-shadow: 0 0 6px rgba(0,0,0,.9) !important;
}
${S('hud')},
${S('bottomPanelArt')} {
  filter: var(--mdf-sprite-filter);
}

/* =====================================================================
 * === PRZYCISKI (runiczne tabliczki) ===
 * ===================================================================== */
${S('buttonBg')} {
  background-color: var(--mdf-wood) !important;
  background-image:
    linear-gradient(180deg, rgba(255,255,255,.07), rgba(0,0,0,.4)),
    var(--mdf-noise) !important;
  border: 1px solid var(--mdf-gold-dark) !important;
  border-radius: 2px !important;
  box-shadow: inset 0 1px 0 rgba(217,183,121,.22), inset 0 -2px 4px rgba(0,0,0,.6) !important;
  transition: box-shadow .15s ease, border-color .15s ease;
}
${P} .button.red > .background   { background-color: #4a1212 !important; }
${P} .button.violet > .background,
${P} .button.purple > .background { background-color: #2c1a4a !important; }
${S('button', ':hover > .background')} {
  border-color: var(--mdf-gold) !important;
  box-shadow: inset 0 1px 0 rgba(217,183,121,.35), 0 0 6px rgba(176,141,87,.6), 0 0 12px rgba(95,211,166,.2) !important;
}
${S('buttonLabel')} {
  font-family: var(--mdf-font-head) !important;
  letter-spacing: .04em !important;
  color: var(--mdf-gold-light) !important;
  text-shadow: 0 1px 0 #000 !important;
}
${S('button', '.disabled > .label')} { color: var(--mdf-text-dim) !important; }

/* Przyciski belek: tabliczka z kutego metalu; ikona (.icon) zostaje oryginalna.
   Kolory stanów gry (green = zwykły, violet = nowość, blue/disabled) zachowane jako poświata. */
${S('widget')} {
  background-color: var(--mdf-graphite) !important;
  background-image: radial-gradient(circle at 50% 35%, #3b2b1f, #120e0c 75%) !important;
  border-color: var(--mdf-gold-dark) !important;
  box-shadow: 0 0 0 1px #000, inset 0 0 0 1px rgba(217,183,121,.3), inset 0 -3px 6px rgba(0,0,0,.7) !important;
  transition: box-shadow .15s ease;
}
${S('widget', ':hover')} {
  box-shadow: 0 0 0 1px #000, inset 0 0 0 1px var(--mdf-gold), 0 0 8px rgba(176,141,87,.6), 0 0 14px rgba(95,211,166,.25) !important;
}
${S('widget', '.violet')},
${S('widget', '.blink-violet')} {
  box-shadow: 0 0 0 1px #000, inset 0 0 0 1px rgba(138,92,240,.7), inset 0 0 10px rgba(138,92,240,.45), 0 0 8px rgba(138,92,240,.45) !important;
}
${S('widget', '.blue')} {
  box-shadow: 0 0 0 1px #000, inset 0 0 0 1px rgba(95,211,166,.5), inset 0 0 8px rgba(95,211,166,.25) !important;
}
${S('widget', '.disabled')} { opacity: .55; }

/* =====================================================================
 * === SLOTY PRZEDMIOTÓW ===
 * Pojedyncze sloty: własne tło (przedmiot jest w środku — bez filtrów, żeby nie zmienić rzadkości).
 * Siatka torby: to osobna warstwa tła, więc wystarczy ją przyciemnić filtrem.
 * ===================================================================== */
${S('slot')} {
  background:
    radial-gradient(ellipse at center, rgba(59,43,31,.5), rgba(13,11,10,.95) 75%) !important;
  box-shadow: inset 0 0 0 1px var(--mdf-gold-dark), inset 0 0 0 2px #000, inset 0 0 8px rgba(0,0,0,.9) !important;
}
${S('slotGrid')} {
  filter: var(--mdf-sprite-filter);
}

/* =====================================================================
 * === PASKI HP / MANA / EXP ===
 * ===================================================================== */
${S('hpOrbBlood')} {
  filter: saturate(1.35) brightness(.82) hue-rotate(-6deg) contrast(1.1);
}
${S('hpOrbGlass')} {
  filter: sepia(.35) brightness(.85);
}
${S('barTrack')} {
  background-color: #0a0807 !important;
  box-shadow: inset 0 1px 3px #000, 0 0 0 1px var(--mdf-gold-dark) !important;
}
${S('hpFill')} {
  background-image:
    linear-gradient(180deg, rgba(255,255,255,.3) 0%, rgba(255,255,255,0) 45%, rgba(0,0,0,.28) 100%),
    linear-gradient(90deg, var(--mdf-hp-1), var(--mdf-hp-2) 60%, var(--mdf-hp-3)) !important;
  background-color: var(--mdf-hp-2) !important;
}
${S('mpFill')} {
  background-image:
    linear-gradient(180deg, rgba(255,255,255,.3) 0%, rgba(255,255,255,0) 45%, rgba(0,0,0,.28) 100%),
    linear-gradient(90deg, var(--mdf-mp-1), var(--mdf-mp-2) 60%, var(--mdf-mp-3)) !important;
  background-color: var(--mdf-mp-2) !important;
}
${S('expFill')} {
  background-image:
    linear-gradient(180deg, rgba(255,255,255,.28) 0%, rgba(255,255,255,0) 45%, rgba(0,0,0,.28) 100%),
    linear-gradient(90deg, var(--mdf-xp-1), var(--mdf-xp-2) 60%, var(--mdf-xp-3)) !important;
  background-color: var(--mdf-xp-2) !important;
}
${S('barValue')} {
  color: #f3e6c8 !important;
  text-shadow: 0 1px 2px #000, 0 0 3px #000 !important;
}

/* =====================================================================
 * === CZAT ===
 * Kolory kanałów zostają (nie nadpisujemy color wiadomości) — tylko lekko je gasimy.
 * ===================================================================== */
${S('chat')} {
  background-color: rgba(10, 8, 7, .92) !important;
  background-image: var(--mdf-noise) !important;
}
${S('chatMessage')} {
  font-family: var(--mdf-font-body) !important;
  filter: saturate(.8) brightness(.95);   /* małe elementy — tani filtr */
  text-shadow: 0 1px 1px rgba(0,0,0,.9);
}
${S('chatTabs')} {
  background-color: var(--mdf-wood) !important;
  background-image: linear-gradient(180deg, rgba(255,255,255,.06), rgba(0,0,0,.35)) !important;
  border-color: var(--mdf-gold-dark) !important;
  box-shadow: inset 0 0 0 1px rgba(0,0,0,.6) !important;
}
${S('chatTabs', '.active')} {
  background-color: var(--mdf-wood-light) !important;
  box-shadow: inset 0 0 0 1px var(--mdf-gold), 0 0 6px rgba(176,141,87,.4) !important;
}
${S('chatInput')} {
  background: rgba(13,11,10,.95) !important;
  color: var(--mdf-text) !important;
  border-color: var(--mdf-gold-dark) !important;
  caret-color: var(--mdf-gold-light);
}

/* =====================================================================
 * === SCROLLBARY ===
 * ===================================================================== */
${S('scrollTrack')} {
  background: var(--mdf-black) !important;
  box-shadow: inset 0 0 3px #000, inset 0 0 0 1px rgba(110,85,50,.5) !important;
}
${S('scrollHandle')} {
  background: var(--mdf-metal-v) !important;
  border-radius: 3px !important;
  box-shadow: 0 0 0 1px #000 !important;
}
${P} .interface-layer *, ${P} .c-window *, ${P} .tip-wrapper * {
  scrollbar-width: thin;
  scrollbar-color: var(--mdf-gold-dark) var(--mdf-black);
}
html.${ROOT_CLASS} ::-webkit-scrollbar { width: 9px; height: 9px; }
html.${ROOT_CLASS} ::-webkit-scrollbar-track { background: var(--mdf-black); box-shadow: inset 0 0 3px #000; }
html.${ROOT_CLASS} ::-webkit-scrollbar-thumb {
  background: var(--mdf-metal-v);
  border: 2px solid var(--mdf-black);
  border-radius: 4px;
}
html.${ROOT_CLASS} ::-webkit-scrollbar-corner { background: var(--mdf-black); }

/* =====================================================================
 * === TOOLTIPY (ciemny pergamin ze złotą ramką) ===
 * ===================================================================== */
${S('tooltip')} {
  --mdf-rarity: var(--mdf-gold);
  background-color: #1b1510 !important;
  background-image:
    radial-gradient(ellipse at 50% 0%, rgba(176,141,87,.16), transparent 70%),
    radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,.6) 100%),
    var(--mdf-noise) !important;
  border: 1px solid var(--mdf-gold-dark) !important;
  border-top: 2px solid var(--mdf-rarity) !important;
  border-image: none !important;
  border-radius: 3px !important;
  box-shadow: 0 0 0 1px #000, 0 6px 18px rgba(0,0,0,.85), inset 0 0 20px rgba(0,0,0,.6) !important;
  color: var(--mdf-text) !important;
}
${S('tooltipItemName')} {
  font-family: var(--mdf-font-head) !important;
  font-weight: 700 !important;
  text-shadow: 0 1px 0 #000, 0 0 6px rgba(0,0,0,.9) !important;
}
${rarityCss}

/* =====================================================================
 * === POLA TEKSTOWE ===
 * ===================================================================== */
${S('input')} {
  background: rgba(13,11,10,.95) !important;
  color: var(--mdf-text) !important;
}
${S('inputFrame')} {
  border-image: var(--mdf-metal) 1 !important;
  background-color: rgba(13,11,10,.95) !important;
}

/* =====================================================================
 * === ZABEZPIECZENIE: canvas mapy i znaczniki rzadkości nigdy nie dostają filtrów ===
 * ===================================================================== */
${P} #GAME_CANVAS, ${P} .item .highlight { filter: none !important; }
`;
  }

  /* Przełącznik — style aktywne po wykryciu NI (także gdy motyw wyłączony). */
  const TOGGLE_CSS = `
#mdf-toggle {
  position: fixed; left: 6px; bottom: 6px; z-index: 2147483000;
  width: 22px; height: 22px; padding: 0; margin: 0;
  display: grid; place-items: center;
  font: 700 13px/1 'Cinzel', Georgia, serif;
  color: #d9b779; background: #1a1614;
  border: 1px solid #6e5532; border-radius: 50%;
  box-shadow: 0 1px 4px rgba(0,0,0,.7);
  opacity: .35; cursor: pointer;
  transition: opacity .15s ease, box-shadow .15s ease;
}
#mdf-toggle:hover, #mdf-toggle:focus-visible { opacity: 1; box-shadow: 0 0 8px rgba(176,141,87,.6); outline: none; }
#mdf-toggle[aria-pressed="false"] { color: #7a6a52; filter: grayscale(1); }
`;

  /* ======================================================================
   * WSTRZYKIWANIE
   * ====================================================================== */

  let themeStyle = null;
  let toggleStyle = null;

  function addStyle(css, id) {
    let el;
    try { el = GM_addStyle(css); } catch { /* fallback poniżej */ }
    if (!el || !(el instanceof Element)) {
      el = document.createElement('style');
      el.textContent = css;
      (document.head || document.documentElement).appendChild(el);
    }
    el.id = id;
    return el;
  }

  function loadFonts() {
    if (document.getElementById('mdf-fonts')) return;
    const link = document.createElement('link');
    link.id = 'mdf-fonts';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&family=Crimson+Text:ital,wght@0,400;0,600;1,400&family=IM+Fell+English&display=swap';
    (document.head || document.documentElement).appendChild(link);
  }

  /**
   * Inne dodatki dokładają swoje <style>/<link> później — trzymamy nasz arkusz jako ostatni w <head>.
   * MutationObserver tylko na bezpośrednich dzieciach <head>, z debounce.
   */
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

  function applyState(on) {
    document.documentElement.classList.toggle(ROOT_CLASS, on);
    const btn = document.getElementById('mdf-toggle');
    if (btn) {
      btn.setAttribute('aria-pressed', String(on));
      btn.title = `Motyw Dark Fantasy: ${on ? 'włączony' : 'wyłączony'} (Alt+T)`;
    }
  }

  function toggle() {
    const on = !document.documentElement.classList.contains(ROOT_CLASS);
    setEnabled(on);
    applyState(on);
    LOG(on ? 'włączony' : 'wyłączony');
  }

  function createToggle() {
    if (document.getElementById('mdf-toggle') || !document.body) return;
    const btn = document.createElement('button');
    btn.id = 'mdf-toggle';
    btn.type = 'button';
    btn.textContent = '✠';
    btn.setAttribute('aria-label', 'Przełącz motyw Dark Fantasy');
    // Zatrzymujemy propagację, żeby kliknięcie nie trafiło do gry.
    btn.addEventListener('mousedown', (e) => e.stopPropagation());
    btn.addEventListener('click', (e) => { e.stopPropagation(); e.preventDefault(); toggle(); });
    document.body.appendChild(btn);
    applyState(document.documentElement.classList.contains(ROOT_CLASS) || getEnabled());
  }

  function onKey(e) {
    if (e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey && e.code === 'KeyT') {
      e.preventDefault();
      e.stopPropagation();
      toggle();
    }
  }

  /**
   * Samonaprawianie: jeśli gra lub inny dodatek usunie nasz styl, klasę na <html> albo przycisk,
   * przywracamy je. Lekki test co 3 s (trzy odczyty DOM), bez pętli po elementach.
   */
  function heal() {
    if (themeStyle && !themeStyle.isConnected) (document.head || document.documentElement).appendChild(themeStyle);
    if (toggleStyle && !toggleStyle.isConnected) (document.head || document.documentElement).appendChild(toggleStyle);
    const want = getEnabled();
    if (document.documentElement.classList.contains(ROOT_CLASS) !== want) applyState(want);
    createToggle();
  }

  function start() {
    toggleStyle = addStyle(TOGGLE_CSS, 'mdf-toggle-style');
    loadFonts();
    themeStyle = addStyle(buildCss(), 'mdf-theme-style');
    keepStyleLast();
    createToggle();
    applyState(getEnabled());
    window.addEventListener('keydown', onKey, true);
    setInterval(heal, 3000);
    LOG(`v1.1.0 aktywny (nowy interfejs). Motyw ${getEnabled() ? 'włączony' : 'wyłączony'} — Alt+T przełącza.`);
  }

  /* ======================================================================
   * START
   * ====================================================================== */

  whenInterfaceKnown((iface) => {
    if (iface !== 'ni') {
      LOG(iface === 'si' ? 'stary interfejs (SI) — motyw nieaktywny.' : 'nie wykryto gry — motyw nieaktywny.');
      return;
    }
    if (document.body) start();
    else document.addEventListener('DOMContentLoaded', start, { once: true });
  });
})();
