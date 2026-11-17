// ==UserScript==
// @name         Margonem – Dark Fantasy Theme
// @namespace    https://github.com/Harkryn/Dodatki
// @version      1.0.0
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
 *     (strona główna, forum) kończy pracę bez śladu.
 *  2. Wszystkie reguły CSS są ograniczone klasą `mdf-on` na <html>. Wyłączenie motywu
 *     (Alt+T lub ikonka w rogu) zdejmuje tę klasę — gra wraca do oryginalnego wyglądu.
 *  3. Canvas mapy (#GAME_CANVAS) i warstwa gry nie są stylowane. Skrypt nie wysyła żadnych
 *     żądań do serwera gry i nie wywołuje funkcji gry — tylko CSS + jeden mały przycisk.
 *
 * Jak poprawić selektory: patrz obiekt SELECTORS niżej. Każda grupa to lista selektorów
 * łączona przecinkiem. Wpisy oznaczone „// ?” to przypuszczenia do sprawdzenia w DevTools (F12).
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

  /** Znaczniki wykrywania interfejsu. */
  const DETECT = {
    // Elementy charakterystyczne dla NI (wystarczy jeden).
    ni: [
      '.game-window-positioner',  // kontener okna gry NI
      '.interface-layer',         // warstwa interfejsu NI
      '.game-layer',              // warstwa mapy NI (używana też w Legendary Frame Plus)
      '.c-window',                // nowe okna NI
      '.border-window'            // ? starsze okna NI
    ],
    // Elementy charakterystyczne dla SI (jeśli są — skrypt nic nie robi).
    si: [
      '#centerbox',               // ? główny kontener SI
      '#base',                    // ? warstwa bazowa SI
      '#ground'                   // ? warstwa mapy SI
    ]
  };

  /**
   * Selektory UI pogrupowane w sekcje. Edytuj śmiało — CSS jest budowany z tych list.
   * Oznaczenie „// ?” = przypuszczenie, zweryfikuj w grze.
   */
  const SELECTORS = {
    /* === OKNA === */
    window: [
      '.c-window',                       // nowe okna NI
      '.border-window'                   // ? starsze okna NI
    ],
    windowHeader: [
      '.c-window .header-label',         // ? tytuł okna
      '.c-window .header-label-positioner', // ?
      '.border-window .header-label',    // ?
      '.c-window .header'                // ?
    ],
    windowContent: [
      '.c-window .content',              // ? treść okna
      '.border-window .content'          // ?
    ],
    closeButton: [
      '.c-window .close-button',         // ?
      '.border-window .close-button',    // ?
      '.close-button-corner-decor'       // ?
    ],

    /* === PANELE (dolny pasek, panele boczne) === */
    panel: [
      '.interface-layer .main-column',   // ? kolumny interfejsu
      '.interface-layer .bottom-panel',  // ?
      '.interface-layer .right-column',  // ?
      '.interface-layer .left-column'    // ?
    ],

    /* === PRZYCISKI === */
    button: [
      '.button',                         // ? standardowy przycisk NI
      '.btn-ni',                         // ?
      '.c-window button'
    ],
    buttonLabel: [
      '.button .label'                   // ? napis przycisku
    ],

    /* === PASKI HP / MP / EXP === */
    barTrack: [
      '.hero-stats .bar',                // ?
      '.player-bars .bar',               // ?
      '.hp-bar, .mp-bar, .exp-bar'       // ?
    ],
    hpFill: [
      '.hp-indicator', '.hp-bar .fill', '.health-bar .fill', '[class*="hp-bar"] .bar-fill'   // ?
    ],
    mpFill: [
      '.mp-indicator', '.mp-bar .fill', '.mana-bar .fill', '[class*="mp-bar"] .bar-fill'     // ?
    ],
    expFill: [
      '.exp-indicator', '.exp-bar .fill', '.exp-bar-fill', '[class*="exp-bar"] .bar-fill'   // ?
    ],

    /* === CZAT === */
    chat: [
      '.chat-tpl',                       // ? kontener czatu
      '.new-chat-window',                // ?
      '.chat-window'                     // ?
    ],
    chatMessages: [
      '.chat-tpl .messages',             // ? lista wiadomości
      '.new-chat-window .scroll-pane',   // ?
      '.chat-window .messages'           // ?
    ],
    chatMessage: [
      '.chat-tpl .new-chat-message',     // ? pojedyncza wiadomość
      '.new-chat-window .new-chat-message', // ?
      '.chat-tpl .message'               // ?
    ],
    chatInput: [
      '.chat-tpl input', '.chat-tpl textarea',
      '.new-chat-window input',          // ?
      '.chat-input-wrapper input'        // ?
    ],
    chatTabs: [
      '.chat-tpl .card', '.chat-tpl .tab',          // ? zakładki kanałów
      '.new-chat-window .chat-channel-card'          // ?
    ],

    /* === TOOLTIPY === */
    tooltip: [
      '.tip-wrapper',                    // tooltip NI
      '.tw-tooltip'                      // ?
    ],
    tooltipItemName: [
      '.tip-wrapper .item-name',         // ? nazwa przedmiotu
      '.tip-wrapper .item-head .name'    // ?
    ],

    /* === POLA TEKSTOWE === */
    input: [
      '.interface-layer input[type="text"]',
      '.interface-layer input[type="number"]',
      '.interface-layer textarea',
      '.c-window input[type="text"]',
      '.c-window textarea'
    ],

    /* === NIE RUSZAĆ (canvas mapy itp.) — tylko dokumentacja, nie są stylowane === */
    neverStyle: ['#GAME_CANVAS', '.game-layer canvas']
  };

  /**
   * Kolory rzadkości przedmiotów — atrybut data-item-type na tooltipie.
   * Wartości t-* to przypuszczenia na podstawie NI; zweryfikuj w DevTools.
   */
  const RARITY = {
    't-norm':     'var(--mdf-rar-common)',
    't-uniupg':   'var(--mdf-rar-unique)',    // unikat
    't-her':      'var(--mdf-rar-heroic)',    // heroik
    't-upgraded': 'var(--mdf-rar-upgraded)',  // ulepszony
    't-leg':      'var(--mdf-rar-legendary)', // legenda
    't-art':      'var(--mdf-rar-artifact)'   // artefakt
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
    // Obiekty globalne (dostępne przez unsafeWindow w Tampermonkey, jeśli jest).
    const w = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
    try {
      if (w.Engine && typeof w.Engine === 'object' && (w.Engine.hero || w.Engine.interface)) return 'ni';
    } catch { /* ignore */ }

    if (!document.body) return null;
    if (anyMatch(DETECT.si) && !anyMatch(DETECT.ni)) return 'si';
    if (anyMatch(DETECT.ni)) return 'ni';
    return null;
  }

  function whenInterfaceKnown(cb) {
    const first = detectInterface();
    if (first) return cb(first);

    let done = false;
    let timer = 0;
    const finish = (result) => {
      if (done) return;
      done = true;
      obs.disconnect();
      clearTimeout(timer);
      clearTimeout(timeout);
      cb(result);
    };
    const obs = new MutationObserver(() => {
      // debounce — gra dokłada setki węzłów przy starcie
      clearTimeout(timer);
      timer = setTimeout(() => {
        const r = detectInterface();
        if (r) finish(r);
      }, 250);
    });
    obs.observe(document, { childList: true, subtree: true }); // document, bo documentElement przy document-start bywa jeszcze null
    const timeout = setTimeout(() => finish(detectInterface()), DETECT_TIMEOUT_MS);
  }

  /* ======================================================================
   * BUDOWANIE CSS
   * ====================================================================== */

  /** Prefiksuje każdy selektor z listy klasą `html.mdf-on` i dokleja opcjonalny sufiks. */
  const S = (key, suffix = '') => {
    const list = Array.isArray(key) ? key : SELECTORS[key];
    return list
      .flatMap((s) => s.split(',').map((x) => x.trim()).filter(Boolean))
      .map((s) => `html.${ROOT_CLASS} ${s}${suffix}`)
      .join(',\n');
  };

  // Szum generowany lokalnie (inline SVG feTurbulence) — brak zewnętrznych obrazków.
  const NOISE = `url("data:image/svg+xml;utf8,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160">' +
    '<filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" stitchTiles="stitch"/>' +
    '<feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .55 0"/></filter>' +
    '<rect width="100%" height="100%" filter="url(#n)"/></svg>'
  )}")`;

  function buildCss() {
    const rarityCss = Object.entries(RARITY).map(([type, color]) => `
html.${ROOT_CLASS} .tip-wrapper[data-item-type="${type}"] { --mdf-rarity: ${color}; }
html.${ROOT_CLASS} .tip-wrapper[data-item-type="${type}"] .item-name { color: ${color} !important; }`).join('');

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

  --mdf-bg-window:  rgba(18, 14, 12, .94);
  --mdf-bg-panel:   rgba(14, 11, 9, .88);

  --mdf-font-head:  'Cinzel', 'Trajan Pro', Georgia, serif;
  --mdf-font-body:  'Crimson Text', 'IM Fell English', Georgia, serif;

  --mdf-hp-1: #4a0b0b; --mdf-hp-2: #9a1d1d; --mdf-hp-3: #d23a3a;
  --mdf-mp-1: #1d1150; --mdf-mp-2: #4b2fb0; --mdf-mp-3: #7f6cf2;
  --mdf-xp-1: #4a3610; --mdf-xp-2: #a07a2a; --mdf-xp-3: #e2bf63;

  /* Rzadkość przedmiotów — muszą zostać rozpoznawalne */
  --mdf-rar-common:    #d8d0c0;
  --mdf-rar-unique:    #f2d75a;
  --mdf-rar-heroic:    #4fb4ff;
  --mdf-rar-upgraded:  #c58bff;
  --mdf-rar-legendary: #ff8c1a;
  --mdf-rar-artifact:  #ff4f4f;

  --mdf-noise: ${NOISE};
  --mdf-frame:
    0 0 0 1px var(--mdf-black),
    0 0 0 2px var(--mdf-gold-dark),
    0 0 0 3px #1c150f,
    0 8px 24px rgba(0,0,0,.75);
  --mdf-inner:
    inset 0 0 0 1px rgba(217,183,121,.18),
    inset 0 0 40px rgba(0,0,0,.85);
}

/* =====================================================================
 * === OKNA ===
 * ===================================================================== */
${S('window')} {
  background-color: var(--mdf-bg-window) !important;
  background-image:
    radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,.55) 100%),
    linear-gradient(180deg, rgba(59,43,31,.35), rgba(13,11,10,.2) 40%, rgba(42,31,23,.3)),
    var(--mdf-noise) !important;
  border-radius: 3px !important;
  box-shadow: var(--mdf-frame), var(--mdf-inner) !important;
  color: var(--mdf-text) !important;
}
${S('windowHeader')} {
  font-family: var(--mdf-font-head) !important;
  font-weight: 700 !important;
  letter-spacing: .08em !important;
  color: var(--mdf-gold-light) !important;
  text-shadow: 0 1px 0 #000, 0 0 8px rgba(176,141,87,.35) !important;
  background-image: linear-gradient(180deg, rgba(59,43,31,.85), rgba(26,22,20,.85)) !important;
  border-bottom: 1px solid var(--mdf-gold-dark) !important;
}
${S('windowContent')} {
  font-family: var(--mdf-font-body) !important;
  color: var(--mdf-text) !important;
}
${S('closeButton')} {
  filter: sepia(.6) saturate(1.4) hue-rotate(-15deg) brightness(.9);
  transition: filter .15s ease;
}
${S('closeButton', ':hover')} {
  filter: sepia(.2) saturate(2) hue-rotate(-30deg) brightness(1.15) drop-shadow(0 0 4px var(--mdf-blood-light));
}

/* =====================================================================
 * === PANELE ===
 * ===================================================================== */
${S('panel')} {
  background-color: var(--mdf-bg-panel) !important;
  background-image:
    linear-gradient(180deg, rgba(59,43,31,.25), rgba(13,11,10,.35)),
    var(--mdf-noise) !important;
  box-shadow: var(--mdf-inner) !important;
}

/* =====================================================================
 * === PRZYCISKI (runiczne tabliczki) ===
 * ===================================================================== */
${S('button')} {
  font-family: var(--mdf-font-head) !important;
  letter-spacing: .04em !important;
  color: var(--mdf-gold-light) !important;
  background-color: var(--mdf-wood) !important;
  background-image:
    linear-gradient(180deg, rgba(255,255,255,.06), rgba(0,0,0,.35)),
    var(--mdf-noise) !important;
  border: 1px solid var(--mdf-gold-dark) !important;
  border-radius: 2px !important;
  box-shadow: inset 0 1px 0 rgba(217,183,121,.2), inset 0 -2px 4px rgba(0,0,0,.6), 0 1px 2px #000 !important;
  text-shadow: 0 1px 0 #000 !important;
  transition: box-shadow .15s ease, color .15s ease, border-color .15s ease;
}
${S('button', ':hover')} {
  color: #f3dfb0 !important;
  border-color: var(--mdf-gold) !important;
  box-shadow: inset 0 1px 0 rgba(217,183,121,.35), inset 0 -2px 4px rgba(0,0,0,.5),
              0 0 6px rgba(176,141,87,.55), 0 0 12px rgba(95,211,166,.18) !important;
}
${S('button', ':active')} {
  box-shadow: inset 0 2px 6px rgba(0,0,0,.8) !important;
}
${S('buttonLabel')} {
  color: inherit !important;
  font-family: inherit !important;
}

/* =====================================================================
 * === PASKI HP / MP / EXP ===
 * ===================================================================== */
${S('barTrack')} {
  background-color: #0a0807 !important;
  box-shadow: inset 0 1px 3px #000, 0 0 0 1px var(--mdf-gold-dark) !important;
}
${S('hpFill')} {
  background-image:
    linear-gradient(180deg, rgba(255,255,255,.28) 0%, rgba(255,255,255,0) 45%, rgba(0,0,0,.25) 100%),
    linear-gradient(90deg, var(--mdf-hp-1), var(--mdf-hp-2) 60%, var(--mdf-hp-3)) !important;
  background-color: var(--mdf-hp-2) !important;
}
${S('mpFill')} {
  background-image:
    linear-gradient(180deg, rgba(255,255,255,.28) 0%, rgba(255,255,255,0) 45%, rgba(0,0,0,.25) 100%),
    linear-gradient(90deg, var(--mdf-mp-1), var(--mdf-mp-2) 60%, var(--mdf-mp-3)) !important;
  background-color: var(--mdf-mp-2) !important;
}
${S('expFill')} {
  background-image:
    linear-gradient(180deg, rgba(255,255,255,.25) 0%, rgba(255,255,255,0) 45%, rgba(0,0,0,.25) 100%),
    linear-gradient(90deg, var(--mdf-xp-1), var(--mdf-xp-2) 60%, var(--mdf-xp-3)) !important;
  background-color: var(--mdf-xp-2) !important;
}

/* =====================================================================
 * === CZAT ===
 * Kolory kanałów zostają (nie nadpisujemy color wiadomości) — tylko lekko je gasimy.
 * ===================================================================== */
${S('chat')} {
  background-color: rgba(10, 8, 7, .9) !important;
  background-image: var(--mdf-noise) !important;
  box-shadow: var(--mdf-frame) !important;
}
${S('chatMessages')} {
  background: transparent !important;
}
${S('chatMessage')} {
  font-family: var(--mdf-font-body) !important;
  filter: saturate(.8) brightness(.95);   /* małe elementy — tani filtr */
  text-shadow: 0 1px 1px rgba(0,0,0,.9);
  line-height: 1.35 !important;
}
${S('chatInput')} {
  background: rgba(13,11,10,.95) !important;
  color: var(--mdf-text) !important;
  border: 1px solid var(--mdf-gold-dark) !important;
  font-family: var(--mdf-font-body) !important;
  caret-color: var(--mdf-gold-light);
}
${S('chatInput', ':focus')} {
  outline: none !important;
  border-color: var(--mdf-gold) !important;
  box-shadow: 0 0 6px rgba(95,211,166,.25) !important;
}
${S('chatTabs')} {
  font-family: var(--mdf-font-head) !important;
  background-color: var(--mdf-wood) !important;
  border-color: var(--mdf-gold-dark) !important;
}

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
  border-radius: 3px !important;
  box-shadow: 0 0 0 1px #000, 0 6px 18px rgba(0,0,0,.85), inset 0 0 20px rgba(0,0,0,.6) !important;
  color: var(--mdf-text) !important;
  font-family: var(--mdf-font-body) !important;
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
  border: 1px solid var(--mdf-gold-dark) !important;
}

/* =====================================================================
 * === SCROLLBARY ===
 * ===================================================================== */
html.${ROOT_CLASS} .interface-layer *,
html.${ROOT_CLASS} .c-window *,
html.${ROOT_CLASS} .tip-wrapper * {
  scrollbar-width: thin;
  scrollbar-color: var(--mdf-gold-dark) var(--mdf-black);
}
html.${ROOT_CLASS} ::-webkit-scrollbar { width: 9px; height: 9px; }
html.${ROOT_CLASS} ::-webkit-scrollbar-track {
  background: var(--mdf-black);
  box-shadow: inset 0 0 3px #000;
}
html.${ROOT_CLASS} ::-webkit-scrollbar-thumb {
  background: linear-gradient(90deg, var(--mdf-gold-dark), var(--mdf-gold), var(--mdf-gold-dark));
  border: 2px solid var(--mdf-black);
  border-radius: 4px;
}
html.${ROOT_CLASS} ::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(90deg, var(--mdf-gold), var(--mdf-gold-light), var(--mdf-gold));
}
html.${ROOT_CLASS} ::-webkit-scrollbar-corner { background: var(--mdf-black); }

/* =====================================================================
 * === ZABEZPIECZENIE: canvas mapy nigdy nie dostaje stylów ===
 * ===================================================================== */
html.${ROOT_CLASS} #GAME_CANVAS { filter: none !important; }
`;
  }

  /* Przełącznik — style zawsze aktywne po wykryciu NI (także gdy motyw wyłączony). */
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
   * Gra może dokładać własne <style> później — trzymamy nasz arkusz jako ostatni w <head>,
   * żeby wygrywał kaskadę. MutationObserver tylko na bezpośrednich dzieciach <head>, z debounce.
   */
  function keepStyleLast() {
    const head = document.head;
    if (!head) return;
    let t = 0;
    new MutationObserver(() => {
      clearTimeout(t);
      t = setTimeout(() => {
        if (themeStyle && themeStyle.isConnected && head.lastElementChild !== themeStyle) {
          head.appendChild(themeStyle);
        } else if (themeStyle && !themeStyle.isConnected) {
          head.appendChild(themeStyle);
        }
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
  }

  function createToggle() {
    if (document.getElementById('mdf-toggle')) return;
    const btn = document.createElement('button');
    btn.id = 'mdf-toggle';
    btn.type = 'button';
    btn.textContent = '✠';
    btn.setAttribute('aria-label', 'Przełącz motyw Dark Fantasy');
    // Zatrzymujemy propagację, żeby kliknięcie nie trafiło do gry.
    btn.addEventListener('mousedown', (e) => e.stopPropagation());
    btn.addEventListener('click', (e) => { e.stopPropagation(); e.preventDefault(); toggle(); });
    document.body.appendChild(btn);
  }

  function onKey(e) {
    if (e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey && (e.code === 'KeyT' || e.key === 't' || e.key === 'T')) {
      e.preventDefault();
      e.stopPropagation();
      toggle();
    }
  }

  function start() {
    addStyle(TOGGLE_CSS, 'mdf-toggle-style');
    loadFonts();
    themeStyle = addStyle(buildCss(), 'mdf-theme-style');
    keepStyleLast();
    createToggle();
    applyState(getEnabled());
    window.addEventListener('keydown', onKey, true);
  }

  /* ======================================================================
   * START
   * ====================================================================== */

  whenInterfaceKnown((iface) => {
    if (iface !== 'ni') return; // SI albo strona bez gry — nic nie robimy
    if (document.body) start();
    else document.addEventListener('DOMContentLoaded', start, { once: true });
  });
})();
