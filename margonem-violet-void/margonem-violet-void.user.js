// ==UserScript==
// @name         Margonem – Fioletowa Pustka (Violet Void)
// @namespace    https://github.com/Harkryn/Dodatki
// @author       Harkryn
// @version      1.0.0
// @description  Mroczny, fioletowy motyw interfejsu Margonem w klimacie kosmicznej otchłani: świecące krawędzie, poświata pustki, gwiezdne iskry. Tylko wygląd UI – mapa, sprite'y i logika gry bez zmian. NI (pełne wsparcie) i SI (podstawowe).
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
// @updateURL    https://raw.githubusercontent.com/Harkryn/Dodatki/main/margonem-violet-void/margonem-violet-void.user.js
// @downloadURL  https://raw.githubusercontent.com/Harkryn/Dodatki/main/margonem-violet-void/margonem-violet-void.user.js
// ==/UserScript==

/*
 * @run-at document-start: styl i klasa na <html> są nakładane, zanim gra narysuje pierwszy kadr,
 * więc nie widać mignięcia oryginalnego (brązowego) interfejsu. Sam CSS nie potrzebuje gotowego DOM –
 * reguły zaczynają działać na elementach gry w chwili, gdy się pojawią. Elementy wymagające DOM
 * (przycisk przełącznika, wykrywanie interfejsu) czekają na <body> przez MutationObserver.
 */

(() => {
  'use strict';

  if (window.top !== window.self) return;

  const VERSION = '1.0.0';
  const ON = 'vv-on';            // motyw włączony
  const KEY_ON = 'vv-enabled';
  const KEY_GLOW = 'vv-glow';    // low | mid | high
  const GLOWS = ['low', 'mid', 'high'];
  const GLOW_LABEL = { low: 'niska', mid: 'średnia', high: 'wysoka' };

  const get = (k, d) => { try { return typeof GM_getValue === 'function' ? GM_getValue(k, d) : d; } catch (e) { return d; } };
  const set = (k, v) => { try { if (typeof GM_setValue === 'function') GM_setValue(k, v); } catch (e) { /* brak GM */ } };

  // Prefiksy reguł: NI = nowy interfejs, SI = stary; G = cała strona gry (scrollbary, zaznaczenie)
  const N = `html.${ON}.vv-ni`;
  const S = `html.${ON}.vv-si`;
  const G = `html.${ON}.vv-game`;
  // okno „zwykłe” NI (bez przezroczystych i bez okien-dymków)
  const W = `${N} .border-window:not(.transparent):not(.tip-window)`;

  // Gwiezdne iskry: kilkanaście drobnych punktów na kaflu 180×180 (inline SVG, < 1 KB), bardzo niska alfa.
  const SPARKS = (() => {
    const pts = [
      [14, 22, .7, .5], [52, 96, .5, .35], [91, 31, .9, .55], [136, 74, .5, .3], [158, 148, .7, .45],
      [27, 133, .4, .3], [74, 160, .6, .35], [109, 118, 1, .6], [149, 14, .5, .3], [63, 59, .4, .25],
      [121, 163, .35, .25], [6, 80, .35, .25], [99, 6, .35, .3], [37, 48, .3, .2], [171, 101, .35, .25]
    ];
    const dots = pts.map(([x, y, r, a]) => `<circle cx='${x}' cy='${y}' r='${r}' fill='%23d9b8ff' fill-opacity='${a}'/>`).join('');
    return `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'>${dots}</svg>")`;
  })();

  /* =====================================================================
   * === ZMIENNE (paleta i intensywność świecenia) ===
   * ===================================================================== */
  const cssVars = `
:root {
  /* tła – warstwy paneli z fioletowym odcieniem */
  --vv-bg-0: #0b0614;
  --vv-bg-1: #140a24;
  --vv-bg-2: #1c0f33;
  /* fiolety główne */
  --vv-v-1: #4a1f7a;
  --vv-v-2: #6d2fb3;
  --vv-v-3: #8f45e6;
  /* energia i podświetlenia */
  --vv-e-1: #b57cff;
  --vv-e-2: #d9b8ff;
  /* głęboki akcent – oszczędnie (krytyczne komunikaty) */
  --vv-accent: #ff4fd8;
  /* tekst */
  --vv-text: #e8ddff;
  --vv-text-dim: #9d8cc2;
  /* linie i obrysy */
  --vv-line: rgb(143 69 230 / .45);
  --vv-line-soft: rgb(143 69 230 / .22);
  /* mnożnik świecenia (zmieniany przełącznikiem intensywności) */
  --vv-k: .8;
  --vv-glow: rgb(181 124 255 / calc(.5 * var(--vv-k)));
  --vv-glow-strong: rgb(181 124 255 / calc(.8 * var(--vv-k)));
  --vv-sparks: ${SPARKS};
  /* światło z wnętrza pustki */
  --vv-void-light: radial-gradient(ellipse 120% 70% at 50% 0%, rgb(109 47 179 / calc(.34 * var(--vv-k))), transparent 62%),
                   radial-gradient(ellipse 80% 60% at 50% 115%, rgb(74 31 122 / calc(.4 * var(--vv-k))), transparent 70%);
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
${G} * { scrollbar-color: var(--vv-v-2) var(--vv-bg-0); }
${G} ::-webkit-scrollbar { width: 9px; height: 9px; }
${G} ::-webkit-scrollbar-track { background: var(--vv-bg-0); box-shadow: inset 0 0 0 1px var(--vv-line-soft); }
${G} ::-webkit-scrollbar-thumb {
  background: linear-gradient(90deg, var(--vv-v-1), var(--vv-v-3), var(--vv-v-1));
  border-radius: 5px;
  border: 1px solid var(--vv-bg-0);
}
${G} ::-webkit-scrollbar-thumb:hover { background: linear-gradient(90deg, var(--vv-v-2), var(--vv-e-1), var(--vv-v-2)); }
${G} ::-webkit-scrollbar-corner { background: var(--vv-bg-0); }

/* pola tekstowe */
${G} input[type="text"], ${G} input[type="number"], ${G} input[type="search"], ${G} input[type="password"],
${G} input:not([type]), ${G} textarea {
  background-color: var(--vv-bg-0) !important;
  color: var(--vv-text) !important;
  border-color: var(--vv-line) !important;
  caret-color: var(--vv-e-1);
}
${G} input:focus, ${G} textarea:focus, ${G} [contenteditable="true"]:focus {
  outline: none !important;
  border-color: var(--vv-e-1) !important;
  box-shadow: 0 0 0 1px var(--vv-e-1), 0 0 calc(8px * var(--vv-k)) var(--vv-glow) !important;
}
${G} input::placeholder, ${G} textarea::placeholder { color: var(--vv-text-dim) !important; opacity: 1; }

/* NI – suwaki gry (własne, nie natywne) */
${N} .scrollbar-wrapper .track { background: var(--vv-bg-0) !important; box-shadow: inset 0 0 0 1px var(--vv-line-soft); }
${N} .scrollbar-wrapper .handle {
  background: linear-gradient(90deg, var(--vv-v-1), var(--vv-v-3), var(--vv-v-1)) !important;
  box-shadow: 0 0 calc(5px * var(--vv-k)) var(--vv-glow) !important;
}
`;

  /* =====================================================================
   * === OKNA (NI: zwykłe, przezroczyste, dialog NPC, sklep, wspólne panele; SI: podstawy) ===
   * ===================================================================== */
  const cssWindows = `
/* --- okno zwykłe: warstwy fioletu, światło z wnętrza, iskry, świecąca krawędź --- */
${W} {
  border-image: none !important;
  border-radius: 4px;
  background: var(--vv-void-light), var(--vv-sparks), linear-gradient(var(--vv-bg-2), var(--vv-bg-1) 30%, var(--vv-bg-0)) !important;
  /* krawędź rysowana cieniem, nie „border” – nie zmienia wymiarów okna */
  box-shadow:
    inset 0 0 0 1px var(--vv-v-2),
    inset 0 0 0 2px rgb(217 184 255 / .07),
    0 0 0 1px #000,
    0 0 calc(14px * var(--vv-k)) var(--vv-glow),
    0 10px 28px rgb(0 0 0 / .85) !important;
}
${W} > .content { background: transparent !important; color: var(--vv-text); }

/* nagłówek: tytuł na ciemnej plakietce z poświatą (wir dochodzi w sekcji ANIMACJE) */
${W} .header-label-positioner .header-label {
  background: radial-gradient(ellipse 60% 120% at 50% 50%, rgb(143 69 230 / calc(.45 * var(--vv-k))), transparent 75%),
              linear-gradient(var(--vv-bg-2), var(--vv-bg-0)) !important;
  border-image: none !important;
  border-radius: 3px;
  box-shadow: inset 0 0 0 1px var(--vv-line), 0 0 calc(8px * var(--vv-k)) var(--vv-glow) !important;
}
${W} .header-label-positioner .header-label .text {
  color: var(--vv-e-2) !important;
  text-shadow: 0 1px 2px #000, 0 0 2px #000 !important;
  letter-spacing: .03em;
}
${W} .header-label-positioner .header-label .left-decor,
${W} .header-label-positioner .header-label .right-decor { background: none !important; }

/* przycisk zamknięcia: fioletowy krąg z „×” */
${W} .close-button-corner-decor { background: none !important; }
${W} .close-button-corner-decor .close-button {
  background: radial-gradient(circle, var(--vv-bg-2) 55%, var(--vv-v-1) 56% 66%, transparent 68%) !important;
  border-radius: 50%;
}
${W} .close-button-corner-decor .close-button::after {
  content: "×";
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  color: var(--vv-e-2); font: bold 15px/1 sans-serif;
  pointer-events: none;
}
${W} .close-button-corner-decor .close-button:hover {
  background: radial-gradient(circle, var(--vv-v-1) 55%, var(--vv-e-1) 56% 66%, transparent 68%) !important;
  box-shadow: 0 0 calc(8px * var(--vv-k)) var(--vv-glow-strong);
}

/* zakładki w oknach */
${N} .border-window .card {
  background-image: linear-gradient(var(--vv-bg-2), var(--vv-bg-0)) !important;
  color: var(--vv-text-dim) !important;
}
${N} .border-window .card:hover { color: var(--vv-text) !important; }
${N} .border-window .card.active {
  background-image: linear-gradient(var(--vv-v-1), var(--vv-bg-1)) !important;
  color: var(--vv-text) !important;
  box-shadow: inset 0 -2px 0 var(--vv-e-1), 0 0 calc(6px * var(--vv-k)) var(--vv-glow);
}

/* --- okna przezroczyste (minimapa, obserwowane zadania) – ramka bez zasłaniania treści --- */
${N} .border-window.transparent .border-image {
  background: rgb(11 6 20 / .7);
  box-shadow: 0 0 0 1px #000, 0 0 0 2px var(--vv-v-1), 0 0 calc(10px * var(--vv-k)) var(--vv-glow) !important;
}

/* --- dialog NPC --- */
${N} .dialogue-window .border-image {
  background: var(--vv-void-light), rgb(11 6 20 / .9);
  box-shadow: 0 0 0 1px #000, 0 0 0 2px var(--vv-v-2), 0 0 calc(14px * var(--vv-k)) var(--vv-glow) !important;
}
${N} .dialogue-window .dialogue-background-color { background: rgb(11 6 20 / .78) !important; }
${N} .dialogue-window .content .npc-dialogue-wrapper .h_content { color: var(--vv-e-2) !important; }
${N} .dialogue-window .content { color: var(--vv-text); }
${N} .dialogue-window .content .answers li { border-bottom-color: var(--vv-line-soft) !important; }
${N} .dialogue-window .content .answers li:hover {
  background: linear-gradient(90deg, rgb(143 69 230 / .3), transparent) !important;
  box-shadow: inset 2px 0 0 var(--vv-e-1);
}

/* --- wspólne panele wnętrz okien (interface-element-*) --- */
${N} .interface-element-middle-1-background,
${N} .interface-element-middle-1-background-stretch,
${N} .interface-element-middle-3-background-stretch,
${N} .interface-element-middle-4-background {
  border-image: none !important;
  border-color: var(--vv-bg-0) !important;
  background: rgb(20 10 36 / .92) !important;
  box-shadow: inset 0 0 0 1px var(--vv-line-soft), inset 0 0 16px rgb(0 0 0 / .7);
}
${N} .interface-element-header-1-background,
${N} .interface-element-header-1-background-stretch,
${N} .interface-element-table-header-1-background,
${N} .interface-element-header-2-background {
  border-image: none !important;
  border-color: transparent !important;
  background: linear-gradient(90deg, var(--vv-bg-0), var(--vv-v-1) 50%, var(--vv-bg-0)) !important;
  box-shadow: inset 0 -1px 0 var(--vv-line), inset 0 1px 0 rgb(217 184 255 / .08);
}
${N} .interface-element-header-3,
${N} .interface-element-table-header-3-background {
  background: linear-gradient(90deg, var(--vv-bg-1), var(--vv-bg-2) 50%, var(--vv-bg-1)) !important;
  box-shadow: inset 0 -1px 0 var(--vv-line);
}
${N} .interface-element-bottom-bar-background,
${N} .interface-element-bottom-bar-background-stretch {
  border-image: none !important;
  border-color: transparent !important;
  background: linear-gradient(90deg, transparent, var(--vv-v-3) 50%, transparent) top / 100% 1px no-repeat,
              linear-gradient(var(--vv-bg-1), var(--vv-bg-0)) !important;
}
${N} .interface-element-line-1-background {
  background: linear-gradient(90deg, transparent, var(--vv-v-3) 50%, transparent) !important;
}
${N} .interface-element-vertical-wood {
  background: linear-gradient(to right, var(--vv-bg-0), var(--vv-v-1) 50%, var(--vv-bg-0)) !important;
}
${N} .interface-element-background-color-1,
${N} .interface-element-background-color-3 { background: var(--vv-bg-1) !important; }
${N} .interface-element-wood-box-background {
  background: var(--vv-void-light), rgb(20 10 36 / .95) !important;
  box-shadow: inset 0 0 0 1px var(--vv-line-soft);
}
${N} .interface-element-card-background,
${N} .interface-element-card-background-stretch { background: linear-gradient(var(--vv-bg-2), var(--vv-bg-0)) !important; }
${N} .interface-element-active-card-background,
${N} .interface-element-active-card-background-stretch,
${N} .interface-element-active-card-border-image {
  border-image: none !important;
  background: linear-gradient(var(--vv-v-1), var(--vv-bg-1)) !important;
  box-shadow: inset 0 0 0 1px var(--vv-line);
}

/* --- przyciski --- */
${N} .button.green:not(.background-gold):not(.background-draconite),
${N} .button.purple:not(.green) {
  background: linear-gradient(var(--vv-v-2), var(--vv-v-1) 55%, #2a1046) !important;
  box-shadow: 0 0 0 1px #000, inset 0 0 0 1px rgb(217 184 255 / .25) !important;
}
${N} .button.green::before, ${N} .button.purple::before { box-shadow: none !important; background: none !important; }
${N} .button.green .label, ${N} .button.purple .label { color: var(--vv-text) !important; text-shadow: 0 1px 2px #000; }
${N} .button.green:not(.background-gold):not(.background-draconite):not(.disable):not(.no-hover):hover,
${N} .button.purple:not(.green):not(.disable):hover {
  background: linear-gradient(var(--vv-v-3), var(--vv-v-2) 55%, var(--vv-v-1)) !important;
  box-shadow: 0 0 0 1px #000, inset 0 0 0 1px var(--vv-e-2), 0 0 calc(9px * var(--vv-k)) var(--vv-glow-strong) !important;
}
${N} .button.disable { filter: grayscale(.6) brightness(.7); }

/* --- SI (stary interfejs): podstawowe okna --- */
${S} #dlgwin, ${S} .dlgwin {   /* TODO: zweryfikuj selektor (dialog NPC SI) */
  background: var(--vv-void-light), var(--vv-bg-1) !important;
  color: var(--vv-text) !important;
  border: 1px solid var(--vv-v-2) !important;
  box-shadow: 0 0 calc(12px * var(--vv-k)) var(--vv-glow) !important;
}
${S} #shop, ${S} #bagc, ${S} #panel {   /* TODO: zweryfikuj selektor (sklep / torby / panel SI) */
  background-color: var(--vv-bg-1) !important;
  box-shadow: 0 0 0 1px var(--vv-v-1), 0 0 calc(10px * var(--vv-k)) var(--vv-glow);
}
`;

  /* Kolejne sekcje (czat, ekwipunek, tooltipy, walka, animacje) dochodzą w następnych wersjach. */
  const cssChat = ``;
  const cssInventory = ``;
  const cssTooltips = ``;
  const cssBattle = ``;
  const cssAnim = ``;

  /* =====================================================================
   * === PRZEŁĄCZNIK (przycisk, skróty, menu Tampermonkey) ===
   * ===================================================================== */
  const cssToggle = `
#vv-toggle {
  position: fixed; left: 8px; bottom: 8px; z-index: 2147483000;
  width: 24px; height: 24px; padding: 0; border-radius: 50%;
  border: 1px solid #6d2fb3; cursor: pointer;
  background: radial-gradient(circle at 50% 50%, #000 0 26%, #4a1f7a 34%, #140a24 70%);
  box-shadow: 0 0 6px rgb(181 124 255 / .55);
  opacity: .55; transition: opacity .2s, box-shadow .2s;
}
#vv-toggle:hover, #vv-toggle:focus-visible { opacity: 1; box-shadow: 0 0 10px rgb(181 124 255 / .9); outline: none; }
html:not(.${ON}) #vv-toggle { filter: grayscale(1); opacity: .35; }
#vv-toast {
  position: fixed; left: 40px; bottom: 10px; z-index: 2147483000;
  padding: 4px 10px; border-radius: 4px; pointer-events: none;
  font: 12px/1.4 sans-serif; color: #e8ddff; background: #140a24;
  border: 1px solid #6d2fb3; box-shadow: 0 0 8px rgb(181 124 255 / .5);
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
    toast(`Fioletowa Pustka: ${enabled() ? 'włączona' : 'wyłączona'}`);
  };
  const cycleGlow = () => {
    const next = GLOWS[(GLOWS.indexOf(glow()) + 1) % GLOWS.length];
    set(KEY_GLOW, next);
    apply();
    toast(`Świecenie: ${GLOW_LABEL[next]}`);
  };

  /* --- wykrywanie interfejsu ---
     Gra zapisuje wybrany interfejs w ciasteczku `interface` (ni / si) – działa od razu przy starcie.
     Potem potwierdzamy po DOM: NI ma .game-window-positioner, SI – #centerbox / #base. */
  const DETECT_NI = '.game-window-positioner, .interface-layer';
  const DETECT_SI = '#centerbox, #base';   // TODO: zweryfikuj selektor (znaczniki SI)
  const setInterface = (iface) => {
    root.classList.toggle('vv-ni', iface === 'ni');
    root.classList.toggle('vv-si', iface === 'si');
  };
  try {
    const m = /(?:^|;\s*)interface=(\w+)/.exec(document.cookie || '');
    if (m && /^(ni|si)$/i.test(m[1])) setInterface(m[1].toLowerCase());
  } catch (e) { /* brak dostępu do ciasteczek */ }

  const detectDom = () => {
    if (document.querySelector(DETECT_NI)) return 'ni';
    if (document.querySelector(DETECT_SI)) return 'si';
    return null;
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

  // Strona gry rozpoznana → klasa vv-game (reguły globalne) + przycisk. Obserwator z debounce,
  // odłączany, gdy interfejs zostanie potwierdzony (albo po 60 s – np. strona logowania).
  let debounce = 0;
  const onGameFound = (iface) => {
    setInterface(iface);
    root.classList.add('vv-game');
    addToggleButton();
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
