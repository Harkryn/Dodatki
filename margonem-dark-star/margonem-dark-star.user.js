// ==UserScript==
// @name         Margonem – Mroczna Gwiazda
// @namespace    https://github.com/Harkryn/Dodatki
// @version      1.17.0
// @description  Motyw interfejsu Margonem w klimacie kosmicznej pustki: głęboka czerń, fiolet jako akcent, srebrno-lawendowy tekst, ledwo widoczny gwiezdny pył. Tylko wygląd – bez zmian w logice gry i mapie.
// @author       Harkryn
// @match        https://*.margonem.pl/*
// @match        https://*.margonem.com/*
// @run-at       document-start
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @grant        GM_getResourceURL
// @resource     corner-tl https://raw.githubusercontent.com/Harkryn/Dodatki/main/assets/dark-star/okno-naroznik-tl.png
// @resource     corner-tr https://raw.githubusercontent.com/Harkryn/Dodatki/main/assets/dark-star/okno-naroznik-tr.png
// @resource     corner-bl https://raw.githubusercontent.com/Harkryn/Dodatki/main/assets/dark-star/okno-naroznik-bl.png
// @resource     corner-br https://raw.githubusercontent.com/Harkryn/Dodatki/main/assets/dark-star/okno-naroznik-br.png
// @resource     ring      https://raw.githubusercontent.com/Harkryn/Dodatki/main/assets/dark-star/pierscien.png
// @resource     orbneb    https://raw.githubusercontent.com/Harkryn/Dodatki/main/assets/dark-star/mglawica-kula.png
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
  // tabliczka HUD: reguły gry mają tu 6 klas, więc potrzebna jest pełna ścieżka
  const HUD = R + ' .layer.interface-layer .positioner.top .hud-container';
  // reguły globalne (zaznaczenie, scrollbary) – tylko na stronie gry
  const G = 'html.' + ON_CLASS + '.mds-game';

  // Gwiezdny pył: kilkanaście kropek o bardzo niskiej alfie na kaflu 160×160 (inline SVG, ok. 1 KB).
  const DUST = (() => {
    const pts = [
      [12, 18, .6, .22], [47, 92, .5, .16], [88, 34, .7, .2], [131, 71, .5, .14], [150, 140, .6, .18],
      [23, 128, .4, .12], [70, 150, .5, .15], [104, 112, .8, .24], [140, 12, .4, .12], [60, 58, .4, .1],
      [117, 150, .3, .1], [5, 75, .3, .1], [96, 6, .3, .12], [33, 48, .3, .09], [156, 96, .3, .1],
    ];
    const dots = pts.map(([x, y, r, a]) => `<circle cx='${x}' cy='${y}' r='${r}' fill='rgba(220,203,214,${a})'/>`).join('');
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><circle cx='104' cy='112' r='2.2' fill='rgba(236,140,128,.05)'/>${dots}</svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  })();

  /*
   * Grafiki: assets/dark-star/ w repo, dołączone przez @resource – Tampermonkey pobiera je razem
   * ze skryptem i aktualizuje przy każdej nowej wersji (bez zapytań do GitHuba podczas gry).
   *   okno-naroznik-tl/tr/bl/br.png  256×256  minimalistyczny narożnik: fioletowa linia z rombem
   *                                          (punkt rogu ok. 14 px od krawędzi pliku → ok. 3,5 px przy 64 px,
   *                                           2,2 px przy 40 px w tooltipach)
   *   pierscien.png                  280×280  łososiowy pierścień cząstek widziany z góry (otwór ok. 30% szerokości);
   *                                          w grze 200 px, przechylony w 3D i obracany wokół kuli HP
   *   mglawica-kula.png              844×88   pasmo subtelnej mgławicy (z lustrzanym odbiciem) przewijane we wnętrzu kuli HP
   */
  const RAW = 'https://raw.githubusercontent.com/Harkryn/Dodatki/main/assets/dark-star/';
  const res = (name, file) => {
    try { if (typeof GM_getResourceURL === 'function') { const u = GM_getResourceURL(name); if (u) return u; } } catch (e) { /* ignore */ }
    return RAW + file;   // awaryjnie: bezpośrednio z repo
  };
  const CORNER = {
    tl: res('corner-tl', 'okno-naroznik-tl.png'),
    tr: res('corner-tr', 'okno-naroznik-tr.png'),
    bl: res('corner-bl', 'okno-naroznik-bl.png'),
    br: res('corner-br', 'okno-naroznik-br.png'),
  };
  const RING = res('ring', 'pierscien.png');
  const ORB_NEB = res('orbneb', 'mglawica-kula.png');
  // cztery rogi jako warstwy jednego tła o zadanym rozmiarze (px)
  const CORNERS = (px) => ['tl:left top', 'tr:right top', 'bl:left bottom', 'br:right bottom']
    .map((s) => { const [k, pos] = s.split(':'); return `url("${CORNER[k]}") ${pos} / ${px}px ${px}px no-repeat`; })
    .join(', ');

  const css = `
/* ═════════════ ZMIENNE (paleta) ═════════════ */
:root {
  --mds-bg0: #09060a;          /* tła – trzy warstwy paneli */
  --mds-bg1: #120b13;
  --mds-bg2: #1c121e;
  /* paleta według obrazu poglądowego: czerń → przydymiona śliwka, światło łososiowo-koralowe */
  --mds-violet: #7a4878;       /* główny akcent: przydymiona śliwka */
  --mds-violet-hi: #ec8c80;    /* podświetlenia, hover: łososiowy koral */
  --mds-violet-line: #3e2440;  /* obramowania: ciemna śliwka */
  --mds-text: #dccbd6;         /* srebrny tekst z różowym odcieniem */
  --mds-text-dim: #9a8496;
  --mds-white: #ffffff;        /* tylko najważniejsze elementy */
  --mds-blue: #5a7bd8;         /* oszczędny drugi akcent (mana) */
  --mds-glow: rgba(236, 140, 128, .22);
  --mds-glow-soft: rgba(236, 140, 128, .10);
  --mds-hair: rgba(220, 203, 214, .08);
  --mds-shadow: 0 10px 28px rgba(0, 0, 0, .85);
  --mds-dust: ${DUST};
  --mds-panel: radial-gradient(120% 80% at 50% 0%, rgba(66, 36, 66, .18), rgba(0,0,0,0) 60%), linear-gradient(#120b13, #09060a);
  --mds-edge: 0 0 0 1px #000, 0 0 0 2px #3e2440;
  --mds-corners: ${CORNERS(64)};
  --mds-corners-sm: ${CORNERS(40)};}

@keyframes mds-glow-pulse {
  0%, 100% { box-shadow: inset 0 0 0 1px var(--mds-violet), 0 0 6px rgba(236, 140, 128, .14); }
  50%      { box-shadow: inset 0 0 0 1px var(--mds-violet-hi), 0 0 12px rgba(236, 140, 128, .3); }
}

/* ═════════════ BAZOWE: zaznaczenie, scrollbary, pola tekstowe ═════════════ */
${G} ::selection { background: rgba(122, 72, 120, .55); color: var(--mds-white); }
${G} ::-webkit-scrollbar { width: 8px; height: 8px; }
${G} ::-webkit-scrollbar-track { background: var(--mds-bg0); }
${G} ::-webkit-scrollbar-thumb { background: linear-gradient(90deg, #201320, var(--mds-violet-line)); border: 1px solid var(--mds-bg0); border-radius: 4px; }
${G} ::-webkit-scrollbar-thumb:hover { background: var(--mds-violet); }
/* scrollbary rysowane przez grę */
${R} .scrollbar-wrapper .track { background: rgba(9, 6, 10, .7); box-shadow: inset 0 0 0 1px var(--mds-hair); }
${R} .scrollbar-wrapper .handle { background: linear-gradient(90deg, #201320, var(--mds-violet-line), #201320); box-shadow: 0 0 0 1px #000, 0 0 6px var(--mds-glow-soft); }
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
  background-image: linear-gradient(#1e1420, var(--mds-bg1) 55%, var(--mds-bg0));
  background-color: var(--mds-bg0);
  box-shadow: inset 0 0 0 1px var(--mds-violet-line), inset 0 1px 0 rgba(220, 203, 214, .06), 0 1px 4px rgba(0, 0, 0, .7);
}
${R} .button::before { box-shadow: none; }
${R} .button .label { color: var(--mds-text); text-shadow: 0 1px 2px #000; }
${R} .button:hover { animation: mds-glow-pulse 2.6s ease-in-out infinite; }
${R} .button:hover .label { color: var(--mds-white); }
/* kolory gry zachowują znaczenie (czerwony = uwaga, zielony = potwierdź…) – tylko przygaszone */
${R} .button.red { background-image: linear-gradient(#4a1420, #1d0810); }
${R} .button.green { background-image: linear-gradient(#173a28, #08160f); }
${R} .button.blue { background-image: linear-gradient(#1c2a55, #0a1024); }
${R} .button.violet, ${R} .button.purple, ${R} .button.blink-violet { background-image: linear-gradient(#3e2440, #1c0d1c); }
${R} .button.orange { background-image: linear-gradient(#4a2c12, #1b1006); }
${S} button, ${S} .button {   /* TODO: zweryfikuj selektor (przyciski SI) */
  background: linear-gradient(#1e1420, var(--mds-bg0));
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
  /* okno ma przezroczystą ramkę 32 px u góry (tytuł) i 20 px po bokach – tło musi ją wypełniać */
  background-clip: border-box;
  background-origin: border-box;
  box-shadow: var(--mds-edge), 0 0 18px rgba(122, 72, 120, .12), var(--mds-shadow);
  color: var(--mds-text);
}
${R} .border-window:not(.transparent) > .content {
  background: rgba(9, 6, 10, .55);
  color: var(--mds-text);
  box-shadow: inset 0 0 0 1px var(--mds-hair), inset 0 0 24px rgba(0, 0, 0, .8);
}
${R} .border-window .content a { color: var(--mds-violet-hi); }
/* tytuł: lekki letter-spacing i poświata, pod nim fioletowa linia zanikająca na końcach */
${R} .border-window .header-label-positioner .header-label {
  background: linear-gradient(90deg, rgba(0,0,0,0), rgba(28, 17, 29, .95) 22%, rgba(28, 17, 29, .95) 78%, rgba(0,0,0,0));
  box-shadow: none;
}
${R} .border-window .header-label-positioner .header-label::after {
  content: "";
  position: absolute; left: 12%; right: 12%; bottom: 0; height: 1px;
  background: linear-gradient(90deg, rgba(122, 72, 120, 0), var(--mds-violet), rgba(122, 72, 120, 0));
  pointer-events: none;
}
${R} .border-window .header-label-positioner .header-label .left-decor,
${R} .border-window .header-label-positioner .header-label .right-decor { background: none; }
${R} .border-window .header-label-positioner .header-label .text {
  color: var(--mds-white);
  letter-spacing: .08em;
  text-shadow: 0 0 6px rgba(236, 140, 128, .35), 0 1px 2px #000;
}
/* okna przezroczyste (śledzone questy, sorter) – czerń z cienką obwódką */
${R} .border-window.transparent .header-label-positioner .header-label { background: none; box-shadow: none; }
${R} .border-window.transparent .header-label-positioner .header-label .text { color: var(--mds-text); }
${R} .border-window.transparent .border-image {
  background: linear-gradient(rgba(18, 11, 19, .92), rgba(9, 6, 10, .88));
  box-shadow: 0 0 0 1px #000, 0 0 0 2px var(--mds-hair), 0 4px 14px rgba(0, 0, 0, .7);
}
/* NAROŻNIKI: fioletowa linia z rombem, romb dokładnie na fioletowej krawędzi okna (box-shadow 2 px na zewnątrz);
 * punkt rogu leży ok. 3,5 px od brzegu grafiki, więc warstwa wychodzi 5 px poza okno */
${R} .border-window:not(.transparent)::before,
${R} .dialogue-window .border-image::before {
  content: "";
  position: absolute;
  inset: -5px;
  background: var(--mds-corners);
  pointer-events: none;
  z-index: 3;
}
/* zamknięcie – szary krzyżyk, przy najechaniu fioletowa poświata */
${R} .border-window:not(.transparent) .close-button-corner-decor { background: none; z-index: 4; }
${R} .border-window .close-button { filter: grayscale(1) brightness(.8); }
${R} .border-window .close-button:hover { filter: grayscale(1) brightness(1.2) drop-shadow(0 0 4px rgba(236, 140, 128, .7)); }
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
${R} .interface-element-middle-2-background-stretch { background: rgba(18, 11, 19, .94); color: var(--mds-text); }
${R} .interface-element-background-color-3,
${R} .interface-element-middle-3-background,
${R} .interface-element-middle-3-background-stretch { background: rgba(9, 6, 10, .94); }
${R} .interface-element-box-shadow-2 { box-shadow: inset 0 0 0 1px var(--mds-hair), inset 0 0 14px #000; }
${R} .interface-element-wood-box-background { background: linear-gradient(var(--mds-bg2), var(--mds-bg1)); box-shadow: inset 0 0 0 1px var(--mds-hair); }
${R} .interface-element-green-box-background,
${R} .interface-element-green-box-background-stretch {
  background: linear-gradient(90deg, var(--mds-bg0), #24131f 30%, #24131f 70%, var(--mds-bg0));
  box-shadow: inset 0 0 0 1px var(--mds-violet-line);
}
${R} .interface-element-header-1-background,
${R} .interface-element-header-1-background-stretch,
${R} .interface-element-header-2-background,
${R} .interface-element-header-2-background-stretch,
${R} .interface-element-bottom-bar-background {
  border-image: none; border-color: transparent;
  background: linear-gradient(90deg, rgba(0,0,0,0), rgba(28, 17, 29, .95) 20%, rgba(28, 17, 29, .95) 80%, rgba(0,0,0,0));
  box-shadow: inset 0 -1px 0 rgba(122, 72, 120, .45);
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
  background: linear-gradient(#241624, var(--mds-bg1));
  color: var(--mds-white);
  box-shadow: inset 0 0 0 1px var(--mds-violet-line), inset 0 -2px 0 var(--mds-violet);
}

/* ═════════════ DIALOG Z NPC ═════════════ */
${R} .dialogue-window .border-image {
  border-image: none;
  background: var(--mds-dust), var(--mds-panel);
  box-shadow: var(--mds-edge), 0 0 18px rgba(122, 72, 120, .12), var(--mds-shadow);
}
${R} .dialogue-window .dialogue-background-color { background: rgba(9, 6, 10, .55); }
${R} .dialogue-window .content .npc-message { color: var(--mds-text); }

/* ═════════════ SKLEP ═════════════ */
${R} .shop-background .canopy { filter: grayscale(1) sepia(.5) hue-rotate(215deg) saturate(1.4) brightness(.3) contrast(1.2); }

/* ═════════════ CZAT I BOCZNE KOLUMNY ═════════════ */
/* kolumny: czerń z pyłem i bardzo słabą fioletową mgłą u dołu */
${R} .layer.interface-layer .main-column {
  background:
    radial-gradient(140% 40% at 50% 100%, rgba(66, 36, 66, .22), rgba(0,0,0,0) 70%),
    var(--mds-dust),
    var(--mds-bg0);
}
/* krawędź kolumny od strony mapy: cienka fioletowa linia zamiast drewnianej belki */
${R} .layer.interface-layer .main-column > .border,
${R} .interface-element-vertical-wood {
  background: linear-gradient(90deg, #000, var(--mds-violet-line) 45%, rgba(122, 72, 120, .55) 50%, var(--mds-violet-line) 55%, #000);
  border-image: none;
}
${R} .left-column .new-chat-window { background: transparent; }
${R} .left-column .chat-channel-card-wrapper {
  background: linear-gradient(var(--mds-bg1), rgba(9, 6, 10, .6));
  box-shadow: inset 0 -1px 0 var(--mds-hair);
}
${R} .chat-channel-card .chat-channel-card-icon { filter: grayscale(1) brightness(.9); }
${R} .chat-channel-card.active .chat-channel-card-icon { filter: grayscale(1) brightness(1.4) drop-shadow(0 0 3px rgba(236, 140, 128, .5)); }
/* wiadomości: kolory kanałów zostają (ważne w grze) – dodajemy tylko cień dla czytelności na czerni */
${R} .chat-message-wrapper .scroll-pane { text-shadow: 0 1px 2px #000; }
${R} .new-chat-window .new-chat-message:hover { background: rgba(122, 72, 120, .07); }
${R} .left-column .chat-input-wrapper {
  background: rgba(9, 6, 10, .92);
  box-shadow: inset 0 1px 0 var(--mds-violet-line);
}
${R} .left-column .magic-input-wrapper { background: rgba(0, 0, 0, .55); box-shadow: inset 0 0 0 1px var(--mds-hair); }
${R} .left-column .magic-input-wrapper:focus-within { box-shadow: inset 0 0 0 1px var(--mds-violet), 0 0 8px var(--mds-glow-soft); }
${R} .left-column .magic-input-wrapper .magic-input { color: var(--mds-text); caret-color: var(--mds-violet-hi); }   /* TODO: zweryfikuj selektor (.magic-input) */
/* SI */
${S} #chat, ${S} #chattxt {   /* TODO: zweryfikuj selektor (czat SI) */
  background: var(--mds-dust), rgba(9, 6, 10, .9);
  text-shadow: 0 1px 2px #000;
}
${S} #inpchat {   /* TODO: zweryfikuj selektor (pole czatu SI) */
  background: var(--mds-bg0);
  color: var(--mds-text);
  border: 1px solid var(--mds-violet-line);
}

/* ═════════════ KOLUMNA EKWIPUNKU: PÓŁPRZEZROCZYSTE POLA ═════════════ */
/* Pola ekwipunku, torby i statystyki mają półprzezroczyste wnętrza i lekko przezroczyste ramki w śliwce.
 * Reguły mają w ścieżce .right-column, więc są mocniejsze od ogólnych reguł slotów niżej. */
${R} .right-column .equipment-outline { background: rgba(9, 6, 10, .22); }
${R} .right-column .eq-slot {
  background: radial-gradient(circle at 50% 40%, rgba(50, 30, 52, .32), rgba(9, 6, 10, .18) 75%);
  box-shadow: inset 0 0 0 1px rgba(122, 72, 120, .55), 0 0 0 1px rgba(0, 0, 0, .5);
}
${R} .right-column .eq-slot:hover { box-shadow: inset 0 0 0 1px var(--mds-violet-hi), 0 0 0 1px rgba(0, 0, 0, .5), 0 0 8px var(--mds-glow); }
${R} .right-column .stats-wrapper.interface-element-background-color-3 {
  background: rgba(9, 6, 10, .45);
  box-shadow: inset 0 0 0 1px rgba(122, 72, 120, .45);
}
${R} .right-column .inventory_wrapper .bag-slot-wrapper {
  background: radial-gradient(circle at 50% 40%, rgba(50, 30, 52, .35), rgba(9, 6, 10, .2) 75%);
  box-shadow: 0 0 0 1px rgba(0, 0, 0, .5), 0 0 0 2px rgba(122, 72, 120, .5);
}
/* siatka torby: linie co 33 px w półprzezroczystym fiolecie, wnętrza pól prawie przezroczyste */
${R} .right-column .interface-element-item-slot-grid-stretch {
  background:
    linear-gradient(90deg, rgba(0,0,0,0) 31px, rgba(122,72,120,.5) 31px, rgba(122,72,120,.5) 32px, rgba(0,0,0,.35) 32px) 0 0 / 33px 33px,
    linear-gradient(rgba(0,0,0,0) 31px, rgba(122,72,120,.5) 31px, rgba(122,72,120,.5) 32px, rgba(0,0,0,.35) 32px) 0 0 / 33px 33px,
    linear-gradient(90deg, rgba(122,72,120,.5) 1px, rgba(0,0,0,0) 1px) 0 0 / 33px 33px,
    linear-gradient(rgba(122,72,120,.5) 1px, rgba(0,0,0,0) 1px) 0 0 / 33px 33px,
    radial-gradient(circle at 50% 40%, rgba(50, 30, 52, .28), rgba(9, 6, 10, .12) 75%) 0 0 / 33px 33px;
  background-color: transparent;
}

/* ═════════════ EKWIPUNEK, TORBY, SLOTY ═════════════ */
/* siatka torby i sklepu (wzór co 33 px, jak siatka gry): ciemna wnęka, cienka fioletowa linia, czarna fuga */
${R} .interface-element-item-slot-grid-stretch {
  filter: none;
  background:
    linear-gradient(90deg, rgba(0,0,0,0) 31px, #2f1a30 31px, #2f1a30 32px, #050305 32px) 0 0 / 33px 33px,
    linear-gradient(rgba(0,0,0,0) 31px, #2f1a30 31px, #2f1a30 32px, #050305 32px) 0 0 / 33px 33px,
    linear-gradient(90deg, #2f1a30 1px, rgba(0,0,0,0) 1px) 0 0 / 33px 33px,
    linear-gradient(#2f1a30 1px, rgba(0,0,0,0) 1px) 0 0 / 33px 33px,
    radial-gradient(circle at 50% 40%, #180f19 0, #0d080d 55%, #070407 100%) 0 0 / 33px 33px,
    var(--mds-bg0);
}
${R} .interface-element-grid-border { outline-color: #000; box-shadow: 0 0 0 1px var(--mds-violet-line), 0 0 0 2px #000; }
${R} .interface-element-one-black-tile { background: linear-gradient(var(--mds-bg2), var(--mds-bg0)); }
/* sloty ekwipunku postaci i paska szybkiego użycia */
${R} .eq-slot,
${R} .interface-element-one-item-slot-2 {
  background: radial-gradient(circle at 50% 40%, #180f19 0, #0d080d 55%, #070407 100%);
  border-color: var(--mds-violet-line);
  outline-color: #000;
  box-shadow: inset 0 0 0 1px #2f1a30, 0 0 0 1px #000, inset 0 0 8px #000;
}
${R} .eq-slot:hover,
${R} .interface-element-one-item-slot-2:hover { box-shadow: inset 0 0 0 1px var(--mds-violet), 0 0 0 1px #000, 0 0 8px var(--mds-glow-soft); }
/* sloty toreb */
${R} .inventory_wrapper .bag-slot-wrapper {
  background: radial-gradient(circle at 50% 40%, #1f1320, var(--mds-bg0) 75%);
  box-shadow: 0 0 0 1px #000, 0 0 0 2px var(--mds-violet-line), inset 0 0 8px #000;
}
${R} .inventory_wrapper .bags-navigation-bg { box-shadow: 0 0 0 1px #000, 0 0 0 2px var(--mds-violet-line); }
/* panel statystyk */
${R} .stats-wrapper.interface-element-background-color-3 {
  background: var(--mds-dust), linear-gradient(var(--mds-bg1), var(--mds-bg0));
  box-shadow: inset 0 0 0 1px var(--mds-violet-line), 0 4px 10px rgba(0, 0, 0, .8);
}
${R} .stats-wrapper .header-title { color: var(--mds-white); letter-spacing: .08em; text-shadow: 0 0 6px rgba(236, 140, 128, .3); }
${R} .stats-wrapper .stats-list li { color: var(--mds-text); }   /* TODO: zweryfikuj selektor (kolor wartości statystyk) */
/* SI */
${S} #panel .item, ${S} #bag .item {   /* TODO: zweryfikuj selektor (sloty SI) */
  box-shadow: inset 0 0 0 1px #2f1a30;
}

/* ═════════════ TOOLTIPY ═════════════ */
/* KARTA PRZEDMIOTU – kolor rangi (--mds-rar, „r, g, b”) ustawia skrypt (tintTooltip): odczytuje grafikę ramki,
 * która faktycznie jest pod przedmiotem (dowolny zestaw ramek z ustawień gry albo z innego dodatku),
 * i liczy z niej dominujący kolor. Zwykłe przedmioty (szara ramka) dostają stonowaną śliwkę. */
${R} .tip-wrapper.normal-tip {
  --mds-rar: 154, 132, 150;
  border-image: none;
  border-radius: 4px;
  background:
    radial-gradient(120% 60% at 50% 0%, rgba(var(--mds-rar), .13), rgba(var(--mds-rar), 0) 70%),
    var(--mds-dust),
    linear-gradient(#120b13, #09060a 55%, #050305);
  box-shadow:
    0 0 0 1px rgba(var(--mds-rar), .55),
    0 0 0 2px rgba(0, 0, 0, .9),
    0 0 18px rgba(var(--mds-rar), .2),
    0 14px 28px rgba(0, 0, 0, .9);
  color: var(--mds-text);
  transition: box-shadow .2s ease;
}
/* linia rangi u góry karty: jasny środek, zanikające końce, miękka poświata */
${R} .tip-wrapper.normal-tip::before {
  content: "";
  position: absolute;
  left: 10%; right: 10%; top: -1px; height: 2px;
  background: linear-gradient(90deg, rgba(var(--mds-rar), 0), rgba(var(--mds-rar), .95) 50%, rgba(var(--mds-rar), 0));
  box-shadow: 0 0 8px rgba(var(--mds-rar), .6);
  pointer-events: none;
  z-index: 2;
}
${R} .tip-wrapper.normal-tip > .content {
  background: transparent;
  text-shadow: 0 1px 2px #000;
}
/* nagłówek: łuna rangi za ikoną, separator w kolorze rangi zanikający w prawo */
${R} .tip-wrapper.normal-tip .item-head {
  background:
    linear-gradient(90deg, rgba(var(--mds-rar), .5), rgba(var(--mds-rar), .12) 60%, rgba(var(--mds-rar), 0)) left bottom / 100% 1px no-repeat,
    radial-gradient(90px 60px at 20px 50%, rgba(var(--mds-rar), .2), rgba(var(--mds-rar), 0) 100%);
  box-shadow: none;
}
${R} .tip-wrapper.normal-tip .item-head .item {
  box-shadow: 0 0 0 1px #000, 0 0 10px rgba(var(--mds-rar), .45);
  border-radius: 2px;
}
${R} .tip-wrapper.normal-tip .item-name { text-shadow: 0 0 8px rgba(var(--mds-rar), .45), 0 1px 2px #000; }   /* kolor nazwy zostaje z gry */
${R} .tip-wrapper.normal-tip .item-type { color: var(--mds-text-dim); }
${R} .tip-wrapper.normal-tip .item-rarity { font-variant: small-caps; letter-spacing: .08em; text-shadow: 0 0 6px rgba(var(--mds-rar), .4), 0 1px 2px #000; }
${R} .tip-wrapper.normal-tip .item-tip-section { border-color: rgba(220, 203, 214, .08) !important; }   /* gra ustawia ten kolor w stylu inline */
/* tooltipy bez przedmiotu (podpowiedzi przycisków, NPC) */
${R} .tip-wrapper:not(.normal-tip) {   /* TODO: zweryfikuj selektor (inne typy tooltipów NI) */
  background: rgba(9, 6, 10, .95);
  color: var(--mds-text);
  box-shadow: 0 0 0 1px var(--mds-violet-line), 0 6px 14px rgba(0, 0, 0, .8);
}
/* SI */
${SB} #tip {   /* TODO: zweryfikuj selektor (tooltip SI) */
  background: var(--mds-dust), linear-gradient(var(--mds-bg2), var(--mds-bg0));
  color: var(--mds-text);
  border: 1px solid var(--mds-violet-line);
  box-shadow: 0 6px 16px rgba(0, 0, 0, .85);
}

/* ═════════════ WALKA ═════════════ */
/* tylko rama okna walki i dziennik; postaci, ich paski HP i efekty zostają jak w grze */
${R} .battle-controller .border-image,
${R} .battle-window .border-image {   /* TODO: zweryfikuj selektor (rama okna walki) */
  border-image: none;
  background: var(--mds-dust), var(--mds-panel);
  box-shadow: var(--mds-edge), 0 0 18px rgba(122, 72, 120, .12), var(--mds-shadow);
}
${R} .battle-controller .battle-console,
${R} .battle-controller .battle-log {   /* TODO: zweryfikuj selektor (dziennik walki) */
  background: rgba(9, 6, 10, .9);
  color: var(--mds-text);
  box-shadow: inset 0 0 0 1px var(--mds-hair);
  text-shadow: 0 1px 1px #000;
}
${R} .battle-controller .auto-fight-button.button,
${R} .battle-controller .button.auto-fight {   /* TODO: zweryfikuj selektor (przycisk „Auto”) */
  box-shadow: inset 0 0 0 1px var(--mds-violet), 0 0 10px var(--mds-glow);
}
/* paski postaci w walce (.one-warrior) celowo bez zmian – reguły pasków w sekcji HUD je pomijają */
${SB} #battle {   /* TODO: zweryfikuj selektor (okno walki SI) */
  box-shadow: var(--mds-edge), var(--mds-shadow);
}
${SB} #battle #battlelog {   /* TODO: zweryfikuj selektor (dziennik walki SI) */
  background: rgba(9, 6, 10, .9);
  color: var(--mds-text);
}

/* ═════════════ HUD: BELKI, TABLICZKA, PRZYCISKI ═════════════ */
/* position: relative (nie absolute) – .bg nadaje belce wysokość (sprawdzone w Dark Gothic) */
${R} .top.positioner > .bg,
${R} .bottom.positioner > .bg {
  position: relative;
  background: var(--mds-dust), linear-gradient(var(--mds-bg1), var(--mds-bg0));
}
/* cienka fioletowa linia od strony mapy */
${R} .top.positioner > .bg { box-shadow: inset 0 -1px 0 var(--mds-violet-line), 0 1px 0 #000; }
${R} .bottom.positioner > .bg { box-shadow: inset 0 1px 0 var(--mds-violet-line), 0 -1px 0 #000; }
${R} .bottom-panel-graphic { filter: grayscale(1) brightness(.3) contrast(1.3); }
/* tabliczka z imieniem: ciemna płyta z pyłem; reguły gry mają tu 6 klas, stąd pełna ścieżka */
${R} .layer.interface-layer .positioner.top .hud-container {
  background: var(--mds-dust), radial-gradient(100% 120% at 50% 0%, #22131f, var(--mds-bg0) 75%);
  border-image: none;
  box-shadow: 0 0 0 1px #000, 0 0 0 2px var(--mds-violet-line), 0 4px 12px rgba(0, 0, 0, .8);
}
${HUD} .hero-data .heroname {
  color: var(--mds-white);
  letter-spacing: .05em;
  text-shadow: 0 0 6px rgba(236, 140, 128, .45), 0 1px 1px #000;
}
${HUD} .location, ${HUD} .coords, ${HUD} .world-name, ${HUD} .herocredits { color: var(--mds-text-dim); text-shadow: 0 1px 1px #000; }
${HUD} .herogold { color: var(--mds-text); text-shadow: 0 1px 1px #000; }
/* ikony walut były częścią grafiki tabliczki – podstawiamy czyste ikony gry (sprawdzone w Dark Gothic) */
${HUD} .gold-tip { background: url("/img/currency/goldIcon16.gif") center / 16px 16px no-repeat; filter: drop-shadow(0 0 2px #000); }
${HUD} .credits-tip { background: url("/img/draconite_small.gif") -6px -4px no-repeat; transform: scale(.85); filter: drop-shadow(0 0 2px #000); }
/* przyciski HUD: ciemne kafle z fioletową obwódką; kolor gry (fiolet = nowość, niebieski = grupa) jako poblask */
${R} .widget-button,
${R} .widget-button.green, ${R} .widget-button.blue, ${R} .widget-button.violet,
${R} .widget-button.blink-violet, ${R} .widget-button.red, ${R} .widget-button.orange {
  background: radial-gradient(circle at 50% 35%, #1f1320, var(--mds-bg0) 80%);
  box-shadow: inset 0 0 0 1px var(--mds-violet-line), 0 0 0 1px #000;
}
${R} .widget-button::before { box-shadow: none; }
${R} .widget-button.violet::before, ${R} .widget-button.blink-violet::before { box-shadow: inset 0 0 9px rgba(236, 140, 128, .45); }
${R} .widget-button.blue::before { box-shadow: inset 0 0 9px rgba(90, 123, 216, .45); }
${R} .widget-button.red::before { box-shadow: inset 0 0 9px rgba(200, 60, 70, .45); }
${R} .widget-button .icon { filter: grayscale(.6) brightness(1.05) drop-shadow(0 1px 1px #000); }
${R} .widget-button:hover { animation: mds-glow-pulse 2.6s ease-in-out infinite; }
${R} .widget-button:hover .icon { filter: grayscale(0) brightness(1.15) drop-shadow(0 0 3px rgba(236, 140, 128, .5)); }
${R} .widget-button.disabled .icon { filter: grayscale(1) brightness(.5); }

/* ═════════════ PASKI: HP, MANA, DOŚWIADCZENIE ═════════════ */
/* KULA HP = PLANETA-OSOBLIWOŚĆ Z KRĄŻĄCYM PIERŚCIENIEM
 * Kula gry: .hp-indicator-wrapper 98×98, okrągła (overflow hidden), z-index 1; .blood ma wysokość = poziom HP.
 * Środek kuli: 120 px od lewej i 29 px poniżej góry .bottom-panel-pointer-bg (sprawdzone w grze).
 * Skrypt wstawia tam #mds-orb-fx (patrz ensureOrbFx), wspólny kontekst warstw to dolny panel:
 *  – pierścień (pierscien.png, widok z góry) przechylony w 3D i obracany wokół własnej osi; tylna połowa
 *    (z-index 0) idzie za kulą, przednia (z-index 3) przed nią – pierścień naprawdę okrąża kulę,
 *  – wnętrze kuli: czerń z przewijaną mgławicą w .blood (niżej); .blood przycina ją do poziomu HP. */
${R} #mds-orb-fx { position: absolute; left: 120px; top: 29px; width: 0; height: 0; pointer-events: none; }
html:not(.${ON_CLASS}) #mds-orb-fx { display: none; }
${R} #mds-orb-fx > div { position: absolute; pointer-events: none; }
/* połówki pierścienia: nieobracane okna przycinające (góra = tył, dół = przód), w środku obracający się pierścień */
${R} #mds-orb-fx .mds-ring-half { left: -110px; top: -110px; width: 220px; height: 220px; perspective: 520px; }
${R} #mds-orb-fx .mds-ring-back { clip-path: inset(0 0 50% 0); z-index: 0; }
${R} #mds-orb-fx .mds-ring-front { clip-path: inset(50% 0 0 0); z-index: 3; }
${R} #mds-orb-fx .mds-ring {
  position: absolute; left: 10px; top: 10px; width: 200px; height: 200px;
  background: url("${RING}") center / 100% 100% no-repeat;
  transform: rotateZ(-10deg) rotateX(72deg) rotateZ(0deg);
  animation: mds-orbit 16s linear infinite;
  filter: drop-shadow(0 0 4px rgba(236, 140, 128, .35));
}
${R} #mds-orb-fx .mds-ring-back .mds-ring { opacity: .75; }
/* poświata pod kulą i pierścieniem: szeroka, eliptyczna łuna (jak pierścień), delikatnie pulsuje;
 * pierwsza w DOM i z-index 0 – leży za tylną połową pierścienia i za kulą */
${R} #mds-orb-fx .mds-orb-glow {
  left: -125px; top: -62px; width: 250px; height: 124px;
  border-radius: 50%;
  background: radial-gradient(ellipse at 50% 50%, rgba(236, 140, 128, .38) 0, rgba(122, 72, 120, .3) 38%, rgba(62, 36, 64, .14) 60%, rgba(62, 36, 64, 0) 72%);
  filter: blur(4px);
  z-index: 0;
  animation: mds-orb-glow 4.5s ease-in-out infinite;
}
@keyframes mds-orb-glow {
  0%, 100% { opacity: .55; transform: scale(.94); }
  50%      { opacity: 1;   transform: scale(1.05); }
}
@keyframes mds-orbit {
  from { transform: rotateZ(-10deg) rotateX(72deg) rotateZ(0deg); }
  to   { transform: rotateZ(-10deg) rotateX(72deg) rotateZ(360deg); }
}
/* niskie HP (< 30%, klasa ustawiana przez skrypt): pierścień w głębokiej czerwieni */
html.${ON_CLASS}.mds-ni.mds-lowhp .game-window-positioner #mds-orb-fx { filter: hue-rotate(-12deg) saturate(1.9); }
/* WNĘTRZE KULI: CZARNE JAK CZARNA DZIURA
 * .blood (wysokość = poziom HP) jest czarne; w nim dwie warstwy subtelnej mgławicy (mglawica-kula.png,
 * pasmo z lustrzanym odbiciem – przewija się bez szwu) płyną w przeciwne strony z różną prędkością.
 * Poziom HP pokazuje cienka, jasna linia „powierzchni”. Co ok. 9 s przez kulę przechodzi delikatny rozbłysk. */
${R} .hp-indicator .blood {
  background: #000;   /* sprite krwi gry nie jest potrzebny */
  overflow: hidden;
}
${R} .hp-indicator .blood::before {
  content: "";
  position: absolute;
  left: 0; right: 0; bottom: -20px; height: 92px;   /* pasmo wokół środka kuli (26 px nad dołem .blood) */
  background:
    url("${ORB_NEB}") 0 38% / auto 64px repeat-x,
    url("${ORB_NEB}") 0 72% / auto 44px repeat-x;
  opacity: .5;
  pointer-events: none;
  animation: mds-orb-neb 70s linear infinite;
}
/* przesunięcie = pełna szerokość kafla w danej skali (844×88 → 614 px przy 64 px, 422 px przy 44 px) */
@keyframes mds-orb-neb {
  from { background-position: 0 38%, 0 72%; }
  to   { background-position: -614px 38%, 422px 72%; }
}
/* powierzchnia „płynu”: cienka jasna linia na poziomie HP */
${R} .hp-indicator .blood::after {
  content: "";
  position: absolute; left: 0; right: 0; top: 0; height: 2px;
  background: linear-gradient(90deg, rgba(236, 140, 128, 0), rgba(255, 205, 195, .75), rgba(236, 140, 128, 0));
  pointer-events: none;
}
/* rozbłysk: przez większość czasu niewidoczny, co ok. 9 s krótki, miękki błysk śliwki i koralu */
${R} .hp-indicator::after {
  content: "";
  position: absolute;
  left: calc(50% - 49px); bottom: -23px;   /* cała kula: 98 px, środek 26 px nad dołem .hp-indicator */
  width: 98px; height: 98px;
  border-radius: 50%;
  background: radial-gradient(circle at 42% 40%, rgba(255, 205, 195, .35) 0, rgba(236, 140, 128, .18) 30%, rgba(122, 72, 120, .12) 55%, rgba(122, 72, 120, 0) 72%);
  mix-blend-mode: screen;
  opacity: 0;
  pointer-events: none;
  animation: mds-orb-flash 9s ease-in-out infinite;
}
@keyframes mds-orb-flash {
  0%, 78%, 100% { opacity: 0; }
  82% { opacity: .9; }
  85% { opacity: .25; }
  88% { opacity: .6; }
  94% { opacity: 0; }
}
${R} .hp-indicator-wrapper .value { color: var(--mds-white); text-shadow: 0 0 6px #000, 0 0 2px #000; }
/* doświadczenie: fiolet od ciemnego do akcentu */
${R} .bottom-panel-of-bottom-positioner .exp-bar-wrapper .exp-progress .progress .inner {
  background: linear-gradient(#0d080d 0%, #d07a78 30%, #7a3a55 62%, #0d080d 100%);
}
${R} .bottom-panel-of-bottom-positioner .exp-bar-wrapper .exp-progress .overlay,
${R} .bottom-panel-pointer-bg .pointer-exp-graphic,
${R} .bottom-panel-pointer-bg .pointer-ttl-graphic { filter: grayscale(1) brightness(.45) contrast(1.3); }
${R} .bottom-panel-pointer-bg .pointer-exp,
${R} .bottom-panel-pointer-bg .pointer-ttl { color: var(--mds-text); text-shadow: 0 1px 2px #000; }
/* paski postępu w oknach (bez pasków postaci w walce) */
${R} .interface-element-progress-bar-0:not(.one-warrior *),
${R} .interface-element-progress-bar-1:not(.one-warrior *) { background: var(--mds-bg0); box-shadow: inset 0 0 0 1px var(--mds-violet-line); }
${R} .interface-element-progress-bar-0:not(.one-warrior *) .inner,
${R} .interface-element-progress-bar-1:not(.one-warrior *) .inner {
  background: linear-gradient(#d98a80 0%, #8a4560 65%, #3e2440 66%);
  border-color: var(--mds-violet);
}
${R} .interface-element-progress-bar-0 .value,
${R} .interface-element-progress-bar-1 .value { color: var(--mds-white); text-shadow: 0 1px 2px #000; }
/* mana – oszczędny błękit */
${R} .mana-indicator .inner, ${R} .mana-bar .inner {   /* TODO: zweryfikuj selektor (pasek many NI) */
  background: linear-gradient(#7d97e4 0%, var(--mds-blue) 55%, #2c3f78 100%);
}

/* ═════════════ MINIMAPA I RAMKI ═════════════ */
${R} .mini-map, ${R} .mini-map-wrapper {   /* TODO: zweryfikuj selektor (minimapa NI) */
  box-shadow: 0 0 0 1px #000, 0 0 0 2px var(--mds-violet-line), 0 0 14px rgba(122, 72, 120, .15);
}
${R} .mini-map canvas, ${R} .mini-map img { filter: none; }   /* sama mapa bez zmian */
${S} #minimap, ${S} #mmap {   /* TODO: zweryfikuj selektor (minimapa SI) */
  box-shadow: 0 0 0 1px #000, 0 0 0 2px var(--mds-violet-line);
}

/* ═════════════ TEKST ROZJAŚNIONY PRZEZ SKANER ═════════════ */
html.${ON_CLASS} .mds-lt { color: var(--mds-c, #dccbd6) !important; }

/* ═════════════ OGRANICZ RUCH ═════════════ */
@media (prefers-reduced-motion: reduce) {
  ${R} #mds-orb-fx .mds-ring,
  ${R} #mds-orb-fx .mds-orb-glow,
  ${R} .hp-indicator::after,
  ${R} .hp-indicator .blood::before { animation: none; }
  ${R} .button:hover,
  ${R} .widget-button:hover { animation: none; box-shadow: inset 0 0 0 1px var(--mds-violet), 0 0 8px var(--mds-glow); }
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
  let cookie = null;
  try { cookie = /(?:^|;\s*)interface=(\w+)/.exec(document.cookie || ''); } catch (e) { /* strona bez dostępu do ciasteczek */ }
  if (cookie && /^(ni|si)$/i.test(cookie[1])) setInterface(cookie[1].toLowerCase());

  function detectDom() {
    if (document.querySelector(DETECT_NI)) return 'ni';
    if (document.querySelector(DETECT_SI)) return 'si';
    return null;
  }

  /* ─────────────────────────────────────────────────────────────────────────
   * PRZEMALOWANIE GRAFIK GRY W LOCIE (mechanizm z Dark Gothic, paleta Mrocznej Gwiazdy)
   * Gra rysuje większość UI z kilkudziesięciu plików /img/gui/* (sam atlas buttony.png jest
   * w ~180 regułach CSS). Skrypt:
   *  1) pobiera dany plik z serwera gry (nic nie jest kopiowane do repo),
   *  2) przemalowuje go na canvasie: drewno/brąz/pergamin/szarości → fioletowa czerń,
   *     złote i brązowe obszycia → przygaszony fiolet, jasne ikony → lekko lawendowe,
   *     a kolory znaczeniowe (złoto ikon, zieleń statusów, błękit, czerwone znaczniki) zostają,
   *  3) podmienia adres w regułach CSS gry na wersję przemalowaną (blob:).
   * Jasne, pergaminowe tła w regułach są przyciemniane, a ciemny tekst na nich rozjaśniany.
   * Wyłączenie motywu przywraca oryginalne wartości reguł bez przeładowania.
   * ───────────────────────────────────────────────────────────────────────── */
  const GUI_URL = /url\(\s*["']?([^"')]*\/img\/gui\/[^"')]+\.(?:png|gif))(\?[^"')]*)?["']?\s*\)/gi;
  // nietknięte: kursory, ramki rzadkości, ikony umiejętności/mapy, emotki, animacje slotów…
  const KEEP = /\/img\/gui\/(?:cursor|item_frames|skills|map-icons|emo|buffs-in-fight|item-slot-anim|line-highlight|X-blackoutline|ok-blackoutline|triangle|search|zoom|battle-|outfit)/i;
  const IMG_PROPS = ['background-image', 'border-image-source', 'list-style-image'];
  const blobCache = new Map();   // ścieżka → Promise<blob URL | null>
  const touched = new Map();     // reguła CSS → { właściwość: [wartość oryginalna, priorytet] }

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
      const vivid = s > 0.62 && l > 0.3 && l < 0.72;                 // złoto ikon, klejnoty, ogień
      const green = hue > 70 && hue < 170 && s > 0.3;               // statusy, potwierdzenia
      const blue = hue > 190 && hue < 255 && s > 0.3;               // mana, informacje
      const violet = hue >= 255 && hue < 320 && s > 0.3;            // już fioletowe – zostaje
      const redMark = (hue < 8 || hue > 340) && s > 0.55 && l > 0.25; // powiadomienia, ostrzeżenia
      if (vivid || green || blue || violet || redMark) continue;
      const warm = hue >= 8 && hue <= 58;                            // drewno, brąz, pergamin, obszycia
      if (s < 0.22 && l > 0.42) {                                    // szare/jasne ikony i glify (w atlasie l 0,5–0,8) – czytelne, lekko lawendowe
        a[i] = Math.min(255, a[i] * 0.98); a[i + 1] *= 0.87; a[i + 2] *= 0.92;   // lekko różowe srebro
      } else if (warm && s > 0.35 && l > 0.42) {                     // złote/brązowe obszycia → śliwka przechodząca w łososiowy róż
        const k = Math.min(1, (l - 0.3) * 1.6);
        a[i] = 82 + 120 * k; a[i + 1] = 40 + 62 * k; a[i + 2] = 78 + 40 * k;
      } else if (warm || s < 0.22) {                                 // powierzchnie → fioletowa czerń
        const L = 0.02 + Math.pow(l, 1.4) * 0.4;
        a[i] = Math.min(255, L * 1.12 * 255); a[i + 1] = L * 0.82 * 255; a[i + 2] = Math.min(255, L * 1.12 * 255);   // śliwkowa czerń
      }
    }
    ctx.putImageData(id, 0, 0);
  }

  function recolored(path) {
    if (!blobCache.has(path)) {
      blobCache.set(path, (async () => {
        const res = await fetch(path, { credentials: 'same-origin' });
        if (!res.ok) return null;
        const bm = await createImageBitmap(await res.blob());
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
  // jasność koloru CSS (0–1) albo -1, gdy to nie kolor rgb/rgba lub jest półprzezroczysty
  function lum(v) { const c = parseRgb(v); if (!c || c[3] < 0.5) return -1; return (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255; }
  function neutral(v) { const c = parseRgb(v); if (!c || c[3] < 0.5) return false; return Math.max(c[0], c[1], c[2]) - Math.min(c[0], c[1], c[2]) < 24; }
  // szare tło → fioletowa sadza (stany wyróżnienia jaśniejsze, żeby nadal odróżniały się od tła)
  function soot(v, highlight) {
    const c = parseRgb(v); const L = (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255;
    const k = Math.round((highlight ? 0.09 + L * 0.26 : 0.03 + L * 0.16) * 255);
    return `rgba(${k + 6}, ${k}, ${k + 6}, ${c[3]})`;   // śliwkowa sadza
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
      if (nv !== v && root.classList.contains(ON_CLASS)) { remember(rule, prop); st.setProperty(prop, nv, st.getPropertyPriority(prop)); }
    }
    // jasne (pergaminowe) tła → czerń; ciemny tekst w tej samej regule → lawendowy
    const bg = st.getPropertyValue('background-color');
    if (lum(bg) > 0.72) {
      remember(rule, 'background-color'); st.setProperty('background-color', 'rgba(18, 11, 19, .92)', st.getPropertyPriority('background-color'));
      const col = st.getPropertyValue('color');
      if (lum(col) >= 0 && lum(col) < 0.45) { remember(rule, 'color'); st.setProperty('color', '#dccbd6', st.getPropertyPriority('color')); }
    } else if (neutral(bg) && lum(bg) > 0.2) {
      remember(rule, 'background-color'); st.setProperty('background-color', soot(bg, hl), st.getPropertyPriority('background-color'));
    }
    // szare gradienty w tłach → przyciemnione; kolorowe (zielone/czerwone przyciski) zostają
    const bi = st.getPropertyValue('background-image');
    if (bi && bi.indexOf('gradient') !== -1 && bi.indexOf('blob:') === -1) {
      const nb = bi.replace(/rgba?\([^)]*\)/g, (c) => (neutral(c) && lum(c) > 0.2 ? soot(c, hl) : c));
      if (nb !== bi) { remember(rule, 'background-image'); st.setProperty('background-image', nb, st.getPropertyPriority('background-image')); }
    }
  }

  const seenRules = new WeakSet();
  function walk(rules, out) {
    for (const r of rules) {
      if (r.cssRules && !r.selectorText) { walk(r.cssRules, out); continue; }
      if (!r.style || !r.selectorText || seenRules.has(r) || r.selectorText.indexOf('mds-') !== -1) continue;
      seenRules.add(r); out.push(r);
    }
  }
  function scanSheets() {
    if (!enabled || !root.classList.contains('mds-ni')) return;   // SI: TODO – przemalowanie nie było sprawdzone
    const rules = [];
    for (const sh of document.styleSheets) { let rr; try { rr = sh.cssRules; } catch (e) { continue; } if (rr) walk(rr, rules); }
    rules.forEach((r) => { processRule(r); });
  }
  function restoreSheets() {
    for (const [rule, props] of touched) for (const p in props) rule.style.setProperty(p, props[p][0], props[p][1]);
    touched.clear();
  }
  function reapplySheets() {
    // ponowne włączenie: reguły znów do przetworzenia (przemalowane pliki są już w pamięci)
    for (const sh of document.styleSheets) {
      let rr; try { rr = sh.cssRules; } catch (e) { continue; }
      if (rr) (function w(list) { for (const r of list) { if (r.cssRules && !r.selectorText) w(r.cssRules); else seenRules.delete(r); } })(rr);
    }
    scanSheets();
  }

  /* ─────────────────────────────────────────────────────────────────────────
   * CZYTELNOŚĆ TEKSTU W OKNACH
   * Część okien miała ciemny tekst na pergaminie. Skaner oznacza takie elementy klasą .mds-lt
   * i podaje jaśniejszy odpowiednik koloru (neutralny → lawendowy, kolorowy → ten sam odcień, jaśniej).
   * ───────────────────────────────────────────────────────────────────────── */
  const SCOPE = '.border-window, .tip-wrapper, .dialogue-window';
  const marked = new Set();
  function lighter([r, g, b]) {
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    if (mx - mn < 28) return '#dccbd6';
    const k = 190 / Math.max(mx, 1);
    return `rgb(${Math.min(255, Math.round(r * k + 30))}, ${Math.min(255, Math.round(g * k + 30))}, ${Math.min(255, Math.round(b * k + 30))})`;
  }
  function fixText(scopeEl) {
    if (!enabled) return;
    for (const el of scopeEl.querySelectorAll('*')) {
      if (el.classList.contains('mds-lt') || el.closest('.item, canvas')) continue;
      let hasText = false;
      for (const n of el.childNodes) if (n.nodeType === 3 && n.nodeValue.trim()) { hasText = true; break; }
      if (!hasText) continue;
      const c = parseRgb(getComputedStyle(el).color);
      if (!c || c[3] < 0.3) continue;
      if ((0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255 >= 0.36) continue;
      el.style.setProperty('--mds-c', lighter(c));
      el.classList.add('mds-lt');
      marked.add(el);
    }
  }
  function unfixText() {
    for (const el of marked) { el.classList.remove('mds-lt'); el.style.removeProperty('--mds-c'); }
    marked.clear();
  }
  const pendingFix = new Set();
  let fixTimer = 0;
  function queueFix(node) {
    const el = node.nodeType === 1 ? node : node.parentElement;
    const w = el && el.closest && el.closest(SCOPE);
    if (!w) return;
    pendingFix.add(w);
    if (!fixTimer) fixTimer = setTimeout(() => { fixTimer = 0; const list = [...pendingFix]; pendingFix.clear(); list.forEach(fixText); }, 150);
  }

  /* ─────────────────────────────────────────────────────────────────────────
   * WŁĄCZANIE / WYŁĄCZANIE
   * ───────────────────────────────────────────────────────────────────────── */
  let enabled = get(KEY, true);

  function apply(on) {
    root.classList.toggle(ON_CLASS, on);
    if (on) { reapplySheets(); document.querySelectorAll(SCOPE).forEach(fixText); } else { restoreSheets(); unfixText(); }
  }
  function toggle() {
    enabled = !enabled;
    set(KEY, enabled);
    apply(enabled);
  }

  addStyle(css);
  apply(enabled);

  /* NISKIE HP: ResizeObserver na pasku krwi (.blood ma wysokość = poziom HP) – bez pętli i bez odpytywania.
   * Poniżej 30% na <html> pojawia się klasa mds-lowhp (horyzont kuli w karmazynie, szybszy puls). */
  /* KULA HP – warstwy efektów: tylna i przednia połowa pierścienia.
   * Wstawiane do .bottom-panel-pointer-bg (wspólny kontekst warstw z kulą gry); gdy gra przebuduje panel,
   * obserwator DOM wstawia je ponownie. Tylko wygląd – pointer-events: none. */
  function ensureOrbFx() {
    const host = document.querySelector('.game-window-positioner .bottom-panel-pointer-bg');
    if (!host || host.querySelector('#mds-orb-fx .mds-orb-glow')) return;
    const old = document.getElementById('mds-orb-fx');   // starsza wersja warstw (bez poświaty) – przebudowa
    if (old) old.remove();
    const fx = document.createElement('div');
    fx.id = 'mds-orb-fx';
    fx.innerHTML =
      '<div class="mds-orb-glow"></div>' +
      '<div class="mds-ring-half mds-ring-back"><div class="mds-ring"></div></div>' +
      '<div class="mds-ring-half mds-ring-front"><div class="mds-ring"></div></div>';
    host.appendChild(fx);
  }

  /* KOLOR RANGI W TOOLTIPIE – z ramki, która faktycznie jest pod przedmiotem.
   * Nie zgadujemy koloru po klasie rangi: bierzemy grafikę ramki (.highlight) tego samego przedmiotu
   * w torbie/ekwipunku (item-id), wycinamy jej fragment z arkusza tak, jak robi to gra (background-position/size),
   * i liczymy dominujący nasycony kolor. Dzięki temu kolor zgadza się z każdym zestawem ramek
   * (ustawienia gry, inne dodatki). Wynik jest zapamiętywany per grafika+pozycja.
   *  – kolor znaleziony → --mds-rar na tooltipie,
   *  – ramka szara (zwykły przedmiot) → kolor domyślny z CSS,
   *  – grafiki nie da się odczytać (obca domena) → kolor nazwy przedmiotu, który gra barwi według rangi. */
  const rarCache = new Map();
  function frameColor(el) {
    const cs = getComputedStyle(el);
    const m = /url\("?([^")]+)"?\)/.exec(cs.backgroundImage);
    if (!m) return Promise.resolve(undefined);
    const w = el.offsetWidth || 32, h = el.offsetHeight || 32;
    const key = m[1] + '|' + cs.backgroundPosition + '|' + cs.backgroundSize + '|' + w + 'x' + h;
    if (!rarCache.has(key)) {
      rarCache.set(key, (async () => {
        const img = new Image();
        if (!/^(blob:|data:)/.test(m[1]) && new URL(m[1], location.href).origin !== location.origin) img.crossOrigin = 'anonymous';
        img.src = m[1];
        await img.decode();
        const c = document.createElement('canvas'); c.width = w; c.height = h;
        const x = c.getContext('2d', { willReadFrequently: true });
        const pos = cs.backgroundPosition.split(' ').map((v) => (v.endsWith('px') ? parseFloat(v) : 0));
        const bs = cs.backgroundSize.split(' ');
        let sw = img.naturalWidth, sh = img.naturalHeight;
        if (bs[0] && bs[0].endsWith('px')) { sw = parseFloat(bs[0]); sh = bs[1] && bs[1].endsWith('px') ? parseFloat(bs[1]) : sw * img.naturalHeight / img.naturalWidth; }
        x.drawImage(img, pos[0] || 0, pos[1] || 0, sw, sh);
        const d = x.getImageData(0, 0, w, h).data;
        let r = 0, g = 0, b = 0, n = 0;
        for (let i = 0; i < d.length; i += 4) {
          if (d[i + 3] < 160) continue;
          const mx = Math.max(d[i], d[i + 1], d[i + 2]), mn = Math.min(d[i], d[i + 1], d[i + 2]);
          const s = (mx - mn) / (mx || 1);
          if (s < 0.35 || mx < 70) continue;          // szarości i cienie ramki pomijamy
          r += d[i] * s; g += d[i + 1] * s; b += d[i + 2] * s; n += s;
        }
        if (n < 4) return null;                        // ramka szara – zwykły przedmiot
        r /= n; g /= n; b /= n;
        const k = 235 / Math.max(r, g, b);             // wyrównanie jasności, żeby poświata była czytelna
        return `${Math.round(Math.min(255, r * k))}, ${Math.round(Math.min(255, g * k))}, ${Math.round(Math.min(255, b * k))}`;
      })().catch(() => undefined));
    }
    return rarCache.get(key);
  }
  function nameColor(tip) {
    const el = tip.querySelector('.item-name');
    const c = el && parseRgb(getComputedStyle(el).color);
    if (!c) return undefined;
    const mx = Math.max(c[0], c[1], c[2]), mn = Math.min(c[0], c[1], c[2]);
    return (mx - mn) / (mx || 1) < 0.3 ? null : `${c[0]}, ${c[1]}, ${c[2]}`;
  }
  async function tintTooltip(tip) {
    const item = tip.querySelector('.item-head .item');
    if (!item) return;
    const idCls = [...item.classList].find((c) => c.startsWith('item-id-')) || '';
    tip.dataset.mdsFor = idCls;
    const source = idCls ? [...document.querySelectorAll('.item.' + idCls)].find((e) => !e.closest('.tip-wrapper')) : null;
    const frames = [source && source.querySelector('.highlight'), item.querySelector('.highlight')].filter(Boolean);
    let color;
    for (const f of frames) { color = await frameColor(f); if (color !== undefined) break; }
    if (color === undefined) color = nameColor(tip);
    if (tip.dataset.mdsFor !== idCls) return;          // w międzyczasie tooltip pokazuje już inny przedmiot
    if (color) tip.style.setProperty('--mds-rar', color); else tip.style.removeProperty('--mds-rar');
  }
  const pendingTips = new Set();
  let tipFrame = 0;
  function queueTip(tip) {
    pendingTips.add(tip);
    if (!tipFrame) tipFrame = requestAnimationFrame(() => { tipFrame = 0; const l = [...pendingTips]; pendingTips.clear(); l.forEach(tintTooltip); });
  }

  let hpWatched = null;
  function watchHp() {
    const blood = document.querySelector('.hp-indicator .blood');
    if (!blood || blood === hpWatched || typeof ResizeObserver !== 'function') return;
    hpWatched = blood;
    const box = blood.parentElement;
    new ResizeObserver(() => {
      const full = box.offsetHeight;
      root.classList.toggle('mds-lowhp', full > 0 && blood.offsetHeight / full < 0.3);
    }).observe(blood);
  }

  /* Wykrycie gry: od razu (skrypt mógł wejść do już wczytanej strony), przy DOMContentLoaded/load
   * i przy zmianach DOM (z debounce). Po wykryciu: klasa mds-game, skan arkuszy. */
  function detect() {
    if (root.classList.contains('mds-game')) { ensureOrbFx(); watchHp(); return true; }
    const iface = detectDom();
    if (!iface) return false;
    setInterface(iface);
    root.classList.add('mds-game');
    apply(enabled);
    ensureOrbFx();
    watchHp();
    return true;
  }
  detect();
  document.addEventListener('DOMContentLoaded', detect);
  window.addEventListener('load', () => { detect(); scanSheets(); });

  // Jeden obserwator DOM z debounce:
  //  – do wykrycia gry: sprawdzenie interfejsu,
  //  – nowe <style>/<link> gry: ponowny skan arkuszy (przemalowanie grafik),
  //  – nowe elementy w oknach/tooltipach: kolejka poprawy czytelności tekstu,
  //  – kula HP: podpięcie strażnika niskiego HP, gdy gra (prze)buduje pasek krwi.
  // Na stronach, które nie są grą (forum, strona główna), po minucie się odłącza.
  let detectTimer = 0;
  const obs = new MutationObserver((muts) => {
    if (!root.classList.contains('mds-game')) {
      if (!detectTimer) detectTimer = setTimeout(() => { detectTimer = 0; detect(); }, 300);
      return;
    }
    let sheets = false;
    for (const m of muts) {
      for (const n of m.addedNodes) {
        if (n.nodeName === 'STYLE' || n.nodeName === 'LINK') sheets = true;
        else if (enabled) queueFix(n);
      }
      if (enabled && m.type === 'characterData') queueFix(m.target);
      // tooltip przedmiotu pojawił się albo zmienił zawartość → kolor rangi z ramki
      if (enabled && m.addedNodes.length) {
        const t = m.target.nodeType === 1 && (m.target.closest('.tip-wrapper.normal-tip') ||
          (m.target.classList.contains('tip-wrapper') ? m.target : null));
        if (t) queueTip(t);
        else for (const n of m.addedNodes) if (n.nodeType === 1 && n.classList.contains('tip-wrapper')) queueTip(n);
      }
    }
    if (sheets) setTimeout(scanSheets, 50);
    if (!hpWatched || !hpWatched.isConnected) watchHp();
    if (!document.querySelector('#mds-orb-fx .mds-orb-glow')) ensureOrbFx();
  });
  obs.observe(root, { childList: true, subtree: true });
  setTimeout(() => { if (!root.classList.contains('mds-game')) obs.disconnect(); }, 60000);
  // arkusze gry dochodzą też później – okresowy skan przez pierwsze dwie minuty
  let ticks = 0;
  const iv = setInterval(() => { scanSheets(); if (++ticks >= 40) clearInterval(iv); }, 3000);

  // Wyłączanie (jak w Dark Gothic): menu Tampermonkey albo Ctrl+Alt+D (wybór jest zapamiętywany).
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
