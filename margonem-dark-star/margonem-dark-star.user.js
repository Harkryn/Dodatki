// ==UserScript==
// @name         Margonem – Mroczna Gwiazda
// @namespace    https://github.com/Harkryn/Dodatki
// @version      1.1.0
// @description  Motyw interfejsu Margonem w klimacie kosmicznej pustki: głęboka czerń, fiolet jako akcent, srebrno-lawendowy tekst, ledwo widoczny gwiezdny pył. Tylko wygląd – bez zmian w logice gry i mapie.
// @author       Harkryn
// @match        https://*.margonem.pl/*
// @match        https://*.margonem.com/*
// @run-at       document-start
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @downloadURL  https://raw.githubusercontent.com/Harkryn/Dodatki/main/margonem-dark-star/margonem-dark-star.user.js
// @updateURL    https://raw.githubusercontent.com/Harkryn/Dodatki/main/margonem-dark-star/margonem-dark-star.user.js
// ==/UserScript==

(function () {
  'use strict';

  /*
   * @run-at document-start (jak w Dark Gothic): styl jest w stronie, zanim gra narysuje interfejs,
   * więc nie ma mignięcia oryginalnego wyglądu, a ciasteczko gry `interface` (ni/si) jest dostępne od razu.
   * Każda reguła jest pod html.mds-on i wewnątrz kontenera gry, więc wczesne wstrzyknięcie nie rusza
   * forum ani strony głównej, a wyłączenie motywu = zdjęcie jednej klasy.
   *
   * Interfejsy: NI – pełne wsparcie (selektory w większości sprawdzone w Dark Gothic),
   * SI – wsparcie podstawowe; jego selektory są oznaczone „TODO: zweryfikuj selektor”.
   * Mapa (canvas) i sprite'y postaci nie są ruszane.
   */

  const ON_CLASS = 'mds-on';
  const KEY = 'mds-enabled';

  const get = (k, d) => { try { return typeof GM_getValue === 'function' ? GM_getValue(k, d) : d; } catch (e) { return d; } };
  const set = (k, v) => { try { if (typeof GM_setValue === 'function') GM_setValue(k, v); } catch (e) { /* ignore */ } };

  // NI: wszystko wewnątrz .game-window-positioner.
  const R = 'html.' + ON_CLASS + '.mds-ni .game-window-positioner';
  // SI: kontener starego interfejsu i elementy wiszące bezpośrednio w <body> (okna, tooltipy).
  const S = 'html.' + ON_CLASS + '.mds-si #centerbox';   // TODO: zweryfikuj selektor (główny kontener SI)
  const SB = 'html.' + ON_CLASS + '.mds-si body';        // TODO: zweryfikuj selektor
  // reguły globalne (zaznaczenie, scrollbary) – tylko na stronie gry
  const G = 'html.' + ON_CLASS + '.mds-game';

  // Gwiezdny pył: kilkanaście kropek o bardzo niskiej alfie na kaflu 160×160 (inline SVG, ok. 1 KB).
  const DUST = (() => {
    const pts = [
      [12, 18, .6, .22], [47, 92, .5, .16], [88, 34, .7, .2], [131, 71, .5, .14], [150, 140, .6, .18],
      [23, 128, .4, .12], [70, 150, .5, .15], [104, 112, .8, .24], [140, 12, .4, .12], [60, 58, .4, .1],
      [117, 150, .3, .1], [5, 75, .3, .1], [96, 6, .3, .12], [33, 48, .3, .09], [156, 96, .3, .1],
    ];
    const dots = pts.map(([x, y, r, a]) => `<circle cx='${x}' cy='${y}' r='${r}' fill='rgba(201,195,230,${a})'/>`).join('');
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><circle cx='104' cy='112' r='2.2' fill='rgba(157,107,255,.05)'/>${dots}</svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  })();

  const css = `
/* ═════════════ ZMIENNE (paleta) ═════════════ */
:root {
  --mds-bg0: #07060b;          /* tła – trzy warstwy paneli */
  --mds-bg1: #0d0b14;
  --mds-bg2: #14111f;
  --mds-violet: #6b3fa0;       /* główny akcent */
  --mds-violet-hi: #9d6bff;    /* podświetlenia, hover */
  --mds-violet-line: #3a2257;  /* obramowania */
  --mds-text: #c9c3e6;         /* srebrno-lawendowy tekst */
  --mds-text-dim: #8d87aa;
  --mds-white: #ffffff;        /* tylko najważniejsze elementy */
  --mds-blue: #5a7bd8;         /* oszczędny drugi akcent (mana) */
  --mds-glow: rgba(157, 107, 255, .22);
  --mds-glow-soft: rgba(157, 107, 255, .10);
  --mds-hair: rgba(201, 195, 230, .08);
  --mds-shadow: 0 10px 28px rgba(0, 0, 0, .85);
  --mds-dust: ${DUST};
  --mds-panel: radial-gradient(120% 80% at 50% 0%, rgba(58, 34, 87, .18), rgba(0,0,0,0) 60%), linear-gradient(#0d0b14, #07060b);
  --mds-edge: 0 0 0 1px #000, 0 0 0 2px #3a2257;
}

@keyframes mds-glow-pulse {
  0%, 100% { box-shadow: inset 0 0 0 1px var(--mds-violet), 0 0 6px rgba(157, 107, 255, .14); }
  50%      { box-shadow: inset 0 0 0 1px var(--mds-violet-hi), 0 0 12px rgba(157, 107, 255, .3); }
}

/* ═════════════ BAZOWE: zaznaczenie, scrollbary, pola tekstowe ═════════════ */
${G} ::selection { background: rgba(107, 63, 160, .55); color: var(--mds-white); }
${G} ::-webkit-scrollbar { width: 8px; height: 8px; }
${G} ::-webkit-scrollbar-track { background: var(--mds-bg0); }
${G} ::-webkit-scrollbar-thumb { background: linear-gradient(90deg, #1c1630, var(--mds-violet-line)); border: 1px solid var(--mds-bg0); border-radius: 4px; }
${G} ::-webkit-scrollbar-thumb:hover { background: var(--mds-violet); }
/* scrollbary rysowane przez grę */
${R} .scrollbar-wrapper .track { background: rgba(7, 6, 11, .7); box-shadow: inset 0 0 0 1px var(--mds-hair); }
${R} .scrollbar-wrapper .handle { background: linear-gradient(90deg, #1c1630, var(--mds-violet-line), #1c1630); box-shadow: 0 0 0 1px #000, 0 0 6px var(--mds-glow-soft); }
${R} .scrollbar-wrapper .handle:hover { background: linear-gradient(90deg, var(--mds-violet-line), var(--mds-violet), var(--mds-violet-line)); }

${R} input[type="text"], ${R} input[type="number"], ${R} input[type="search"], ${R} input:not([type]), ${R} textarea,
${S} input[type="text"], ${S} input:not([type]), ${S} textarea {
  background: var(--mds-bg0);
  color: var(--mds-text);
  border: 1px solid var(--mds-violet-line);
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, .8);
  caret-color: var(--mds-violet-hi);
}
${R} input:focus, ${R} textarea:focus, ${S} input:focus, ${S} textarea:focus {
  outline: none;
  border-color: var(--mds-violet);
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, .8), 0 0 8px var(--mds-glow-soft);
}

/* ═════════════ PRZYCISKI TEKSTOWE ═════════════ */
/* bez border-image i bez zmiany border-width – układ przycisku zostaje jak w grze */
${R} .button {
  border-image: none;
  background-image: linear-gradient(#1a1528, var(--mds-bg1) 55%, var(--mds-bg0));
  background-color: var(--mds-bg0);
  box-shadow: inset 0 0 0 1px var(--mds-violet-line), inset 0 1px 0 rgba(201, 195, 230, .06), 0 1px 4px rgba(0, 0, 0, .7);
}
${R} .button::before { box-shadow: none; }
${R} .button .label { color: var(--mds-text); text-shadow: 0 1px 2px #000; }
${R} .button:hover { animation: mds-glow-pulse 2.6s ease-in-out infinite; }
${R} .button:hover .label { color: var(--mds-white); }
/* kolory gry zachowują znaczenie (czerwony = uwaga, zielony = potwierdź…) – tylko przygaszone */
${R} .button.red { background-image: linear-gradient(#4a1420, #1d0810); }
${R} .button.green { background-image: linear-gradient(#173a28, #08160f); }
${R} .button.blue { background-image: linear-gradient(#1c2a55, #0a1024); }
${R} .button.violet, ${R} .button.purple, ${R} .button.blink-violet { background-image: linear-gradient(#3a2257, #160c25); }
${R} .button.orange { background-image: linear-gradient(#4a2c12, #1b1006); }
${S} button, ${S} .button {   /* TODO: zweryfikuj selektor (przyciski SI) */
  background: linear-gradient(#1a1528, var(--mds-bg0));
  color: var(--mds-text);
  border: 1px solid var(--mds-violet-line);
}
${S} button:hover, ${S} .button:hover { border-color: var(--mds-violet); box-shadow: 0 0 8px var(--mds-glow); }

/* ═════════════ OKNA ═════════════ */
/* czarny panel z gwiezdnym pyłem, cienka fioletowa krawędź, delikatna poświata */
${R} .border-window:not(.transparent) {
  border-image: none;
  border-color: transparent;
  background: var(--mds-dust), var(--mds-panel);
  background-clip: padding-box;
  box-shadow: var(--mds-edge), 0 0 18px rgba(107, 63, 160, .12), var(--mds-shadow);
  color: var(--mds-text);
}
${R} .border-window:not(.transparent) > .content {
  background: rgba(7, 6, 11, .55);
  color: var(--mds-text);
  box-shadow: inset 0 0 0 1px var(--mds-hair), inset 0 0 24px rgba(0, 0, 0, .8);
}
${R} .border-window .content a { color: var(--mds-violet-hi); }
/* tytuł: lekki letter-spacing i poświata, pod nim fioletowa linia zanikająca na końcach */
${R} .border-window .header-label-positioner .header-label {
  background: linear-gradient(90deg, rgba(0,0,0,0), rgba(20, 17, 31, .95) 22%, rgba(20, 17, 31, .95) 78%, rgba(0,0,0,0));
  box-shadow: none;
}
${R} .border-window .header-label-positioner .header-label::after {
  content: "";
  position: absolute; left: 12%; right: 12%; bottom: 0; height: 1px;
  background: linear-gradient(90deg, rgba(107, 63, 160, 0), var(--mds-violet), rgba(107, 63, 160, 0));
  pointer-events: none;
}
${R} .border-window .header-label-positioner .header-label .left-decor,
${R} .border-window .header-label-positioner .header-label .right-decor { background: none; }
${R} .border-window .header-label-positioner .header-label .text {
  color: var(--mds-white);
  letter-spacing: .08em;
  text-shadow: 0 0 6px rgba(157, 107, 255, .35), 0 1px 2px #000;
}
/* okna przezroczyste (śledzone questy, sorter) – czerń z cienką obwódką */
${R} .border-window.transparent .header-label-positioner .header-label { background: none; box-shadow: none; }
${R} .border-window.transparent .header-label-positioner .header-label .text { color: var(--mds-text); }
${R} .border-window.transparent .border-image {
  background: linear-gradient(rgba(13, 11, 20, .92), rgba(7, 6, 11, .88));
  box-shadow: 0 0 0 1px #000, 0 0 0 2px var(--mds-hair), 0 4px 14px rgba(0, 0, 0, .7);
}
/* zamknięcie – szary krzyżyk, przy najechaniu fioletowa poświata */
${R} .border-window:not(.transparent) .close-button-corner-decor { background: none; z-index: 4; }
${R} .border-window .close-button { filter: grayscale(1) brightness(.8); }
${R} .border-window .close-button:hover { filter: grayscale(1) brightness(1.2) drop-shadow(0 0 4px rgba(157, 107, 255, .7)); }
${R} .c-window {   /* TODO: zweryfikuj selektor (z Kociej Nocy, nie sprawdzony w tym motywie) */
  background: var(--mds-dust), var(--mds-panel);
  box-shadow: var(--mds-edge), var(--mds-shadow);
  color: var(--mds-text);
}
${SB} .window, ${SB} #dlgwin {   /* TODO: zweryfikuj selektor (okna i dialog SI) */
  background: var(--mds-dust), var(--mds-panel);
  color: var(--mds-text);
  box-shadow: var(--mds-edge), var(--mds-shadow);
}

/* ═════════════ TŁA PANELI W OKNACH ═════════════ */
${R} .interface-element-background-color-1,
${R} .interface-element-middle-1-background,
${R} .interface-element-middle-1-background-stretch { background: var(--mds-dust), linear-gradient(var(--mds-bg1), var(--mds-bg0)); }
${R} .interface-element-background-color-2,
${R} .interface-element-middle-2-background,
${R} .interface-element-middle-2-background-stretch { background: rgba(13, 11, 20, .94); color: var(--mds-text); }
${R} .interface-element-background-color-3,
${R} .interface-element-middle-3-background,
${R} .interface-element-middle-3-background-stretch { background: rgba(7, 6, 11, .94); }
${R} .interface-element-box-shadow-2 { box-shadow: inset 0 0 0 1px var(--mds-hair), inset 0 0 14px #000; }
${R} .interface-element-wood-box-background { background: linear-gradient(var(--mds-bg2), var(--mds-bg1)); box-shadow: inset 0 0 0 1px var(--mds-hair); }
${R} .interface-element-green-box-background,
${R} .interface-element-green-box-background-stretch {
  background: linear-gradient(90deg, var(--mds-bg0), #1a1230 30%, #1a1230 70%, var(--mds-bg0));
  box-shadow: inset 0 0 0 1px var(--mds-violet-line);
}
${R} .interface-element-header-1-background,
${R} .interface-element-header-1-background-stretch,
${R} .interface-element-header-2-background,
${R} .interface-element-header-2-background-stretch,
${R} .interface-element-bottom-bar-background {
  border-image: none; border-color: transparent;
  background: linear-gradient(90deg, rgba(0,0,0,0), rgba(20, 17, 31, .95) 20%, rgba(20, 17, 31, .95) 80%, rgba(0,0,0,0));
  box-shadow: inset 0 -1px 0 rgba(107, 63, 160, .45);
}
${R} .interface-element-header-1 { color: var(--mds-white); letter-spacing: .05em; }
${R} .interface-element-bottom-bar-background-stretch { filter: grayscale(1) brightness(.3) contrast(1.2); }
${R} .interface-element-line-1-background { background: linear-gradient(90deg, rgba(0,0,0,0), var(--mds-violet-line) 25%, var(--mds-violet) 50%, var(--mds-violet-line) 75%, rgba(0,0,0,0)); }
${R} .interface-element-card-background,
${R} .interface-element-card-background-stretch { background: linear-gradient(var(--mds-bg2), var(--mds-bg0)); border-image: none; box-shadow: inset 0 0 0 1px var(--mds-hair); }

/* ═════════════ ZAKŁADKI ═════════════ */
${R} .tabs-nav .card,
${R} .chat-channel-card {
  background-image: linear-gradient(var(--mds-bg2), var(--mds-bg0));
  color: var(--mds-text-dim);
  box-shadow: inset 0 0 0 1px var(--mds-hair);
}
${R} .tabs-nav .card:hover,
${R} .chat-channel-card:hover { color: var(--mds-text); }
${R} .tabs-nav .card.active,
${R} .chat-channel-card.active,
${R} .interface-element-active-card-background-stretch,
${R} .interface-element-active-card-border-image {
  border-image: none;
  border-color: var(--mds-bg1);   /* gra zostawia tu 5 px ramki – bez tego przyjęłaby jasny kolor tekstu */
  background: linear-gradient(#1d1530, var(--mds-bg1));
  color: var(--mds-white);
  box-shadow: inset 0 0 0 1px var(--mds-violet-line), inset 0 -2px 0 var(--mds-violet);
}

/* ═════════════ DIALOG Z NPC ═════════════ */
${R} .dialogue-window .border-image {
  border-image: none;
  background: var(--mds-dust), var(--mds-panel);
  box-shadow: var(--mds-edge), 0 0 18px rgba(107, 63, 160, .12), var(--mds-shadow);
}
${R} .dialogue-window .dialogue-background-color { background: rgba(7, 6, 11, .55); }
${R} .dialogue-window .content .npc-message { color: var(--mds-text); }

/* ═════════════ SKLEP ═════════════ */
${R} .shop-background .canopy { filter: grayscale(1) sepia(.5) hue-rotate(215deg) saturate(1.4) brightness(.3) contrast(1.2); }

/* ═════════════ CZAT I BOCZNE KOLUMNY ═════════════ */
/* kolumny: czerń z pyłem i bardzo słabą fioletową mgłą u dołu */
${R} .layer.interface-layer .main-column {
  background:
    radial-gradient(140% 40% at 50% 100%, rgba(58, 34, 87, .22), rgba(0,0,0,0) 70%),
    var(--mds-dust),
    var(--mds-bg0);
}
/* krawędź kolumny od strony mapy: cienka fioletowa linia zamiast drewnianej belki */
${R} .layer.interface-layer .main-column > .border,
${R} .interface-element-vertical-wood {
  background: linear-gradient(90deg, #000, var(--mds-violet-line) 45%, rgba(107, 63, 160, .55) 50%, var(--mds-violet-line) 55%, #000);
  border-image: none;
}
${R} .left-column .new-chat-window { background: transparent; }
${R} .left-column .chat-channel-card-wrapper {
  background: linear-gradient(var(--mds-bg1), rgba(7, 6, 11, .6));
  box-shadow: inset 0 -1px 0 var(--mds-hair);
}
${R} .chat-channel-card .chat-channel-card-icon { filter: grayscale(1) brightness(.9); }
${R} .chat-channel-card.active .chat-channel-card-icon { filter: grayscale(1) brightness(1.4) drop-shadow(0 0 3px rgba(157, 107, 255, .5)); }
/* wiadomości: kolory kanałów zostają (ważne w grze) – dodajemy tylko cień dla czytelności na czerni */
${R} .chat-message-wrapper .scroll-pane { text-shadow: 0 1px 2px #000; }
${R} .new-chat-window .new-chat-message:hover { background: rgba(107, 63, 160, .07); }
${R} .left-column .chat-input-wrapper {
  background: rgba(7, 6, 11, .92);
  box-shadow: inset 0 1px 0 var(--mds-violet-line);
}
${R} .left-column .magic-input-wrapper { background: rgba(0, 0, 0, .55); box-shadow: inset 0 0 0 1px var(--mds-hair); }
${R} .left-column .magic-input-wrapper:focus-within { box-shadow: inset 0 0 0 1px var(--mds-violet), 0 0 8px var(--mds-glow-soft); }
${R} .left-column .magic-input-wrapper .magic-input { color: var(--mds-text); caret-color: var(--mds-violet-hi); }   /* TODO: zweryfikuj selektor (.magic-input) */
/* SI */
${S} #chat, ${S} #chattxt {   /* TODO: zweryfikuj selektor (czat SI) */
  background: var(--mds-dust), rgba(7, 6, 11, .9);
  text-shadow: 0 1px 2px #000;
}
${S} #inpchat {   /* TODO: zweryfikuj selektor (pole czatu SI) */
  background: var(--mds-bg0);
  color: var(--mds-text);
  border: 1px solid var(--mds-violet-line);
}

/* ═════════════ PRZEŁĄCZNIK (gwiazdka w lewym dolnym rogu) ═════════════ */
#mds-toggle {
  position: fixed; left: 6px; bottom: 6px; z-index: 2147483000;
  width: 22px; height: 22px; padding: 0; margin: 0;
  display: none; align-items: center; justify-content: center;
  border: 1px solid #3a2257; border-radius: 50%;
  background: radial-gradient(circle at 50% 45%, #1d1530, #07060b 70%);
  color: #9d6bff; cursor: pointer; opacity: .45;
}
html.mds-game #mds-toggle { display: flex; }
#mds-toggle:hover { opacity: 1; box-shadow: 0 0 10px rgba(157, 107, 255, .45); }
html:not(.${ON_CLASS}) #mds-toggle { color: #6c6880; border-color: #2a2833; }
#mds-toggle svg { width: 14px; height: 14px; display: block; }

/* ═════════════ OGRANICZ RUCH ═════════════ */
@media (prefers-reduced-motion: reduce) {
  ${R} .button:hover { animation: none; box-shadow: inset 0 0 0 1px var(--mds-violet), 0 0 8px var(--mds-glow); }
}
`;

  function addStyle(text) {
    if (typeof GM_addStyle === 'function') return GM_addStyle(text);
    const s = document.createElement('style');
    s.textContent = text;
    (document.head || document.documentElement).appendChild(s);
    return s;
  }

  /* ─────────────────────────────────────────────────────────────────────────
   * WYKRYWANIE INTERFEJSU
   * Ciasteczko gry `interface` (ni/si) – od razu przy starcie; potem potwierdzenie po DOM,
   * które dodaje też klasę mds-game (reguły globalne i przycisk tylko na stronie gry).
   * ───────────────────────────────────────────────────────────────────────── */
  const root = document.documentElement;
  const DETECT_NI = '.game-window-positioner';
  const DETECT_SI = '#centerbox, #base';   // TODO: zweryfikuj selektor (znaczniki SI)

  function setInterface(iface) {
    root.classList.toggle('mds-ni', iface === 'ni');
    root.classList.toggle('mds-si', iface === 'si');
  }
  const cookie = /(?:^|;\s*)interface=(\w+)/.exec(document.cookie || '');
  if (cookie && /^(ni|si)$/i.test(cookie[1])) setInterface(cookie[1].toLowerCase());

  function detectDom() {
    if (document.querySelector(DETECT_NI)) return 'ni';
    if (document.querySelector(DETECT_SI)) return 'si';
    return null;
  }

  /* ─────────────────────────────────────────────────────────────────────────
   * WŁĄCZANIE / WYŁĄCZANIE
   * ───────────────────────────────────────────────────────────────────────── */
  let enabled = get(KEY, true);

  function apply(on) {
    root.classList.toggle(ON_CLASS, on);
    const b = document.getElementById('mds-toggle');
    if (b) b.title = 'Mroczna Gwiazda: ' + (on ? 'włączona' : 'wyłączona') + ' (Ctrl+Alt+D)';
  }
  function toggle() {
    enabled = !enabled;
    set(KEY, enabled);
    apply(enabled);
  }

  const STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 1.5l2.1 7.2 7.4.3-6 4.4 2.3 7.1L12 16.2 6.2 20.5l2.3-7.1-6-4.4 7.4-.3z"/></svg>';
  function ensureButton() {
    if (!document.body || document.getElementById('mds-toggle')) return;
    const b = document.createElement('button');
    b.id = 'mds-toggle';
    b.type = 'button';
    b.innerHTML = STAR;
    b.addEventListener('mousedown', (e) => e.stopPropagation());   // kliknięcie nie trafia do mapy
    b.addEventListener('click', (e) => { e.stopPropagation(); toggle(); });
    document.body.appendChild(b);
    apply(enabled);
  }

  addStyle(css);
  apply(enabled);

  // Obserwator DOM z debounce: tylko wykrycie gry i przycisk – reszta to CSS, który sam łapie
  // dynamicznie dodawane okna. Po wykryciu gry obserwuje już tylko bezpośrednie dzieci <body>.
  let timer = 0;
  const startObs = new MutationObserver(() => {
    if (timer) return;
    timer = setTimeout(() => {
      timer = 0;
      const iface = detectDom();
      if (!iface) return;
      setInterface(iface);
      root.classList.add('mds-game');
      ensureButton();
      startObs.disconnect();
      new MutationObserver(() => { if (!document.getElementById('mds-toggle')) ensureButton(); })
        .observe(document.body, { childList: true });
    }, 300);
  });
  startObs.observe(root, { childList: true, subtree: true });
  setTimeout(() => { if (!root.classList.contains('mds-game')) startObs.disconnect(); }, 60000);

  // Wyłączanie: menu Tampermonkey, gwiazdka w lewym dolnym rogu albo Ctrl+Alt+D (wybór jest zapamiętywany).
  if (typeof GM_registerMenuCommand === 'function') {
    GM_registerMenuCommand('Mroczna Gwiazda: włącz / wyłącz', toggle);
  }
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.altKey && (e.key === 'd' || e.key === 'D')) {
      e.preventDefault();
      toggle();
    }
  }, true);
})();
