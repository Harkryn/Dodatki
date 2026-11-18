// ==UserScript==
// @name         Margonem – Dark Gothic Theme
// @namespace    https://github.com/Harkryn/Dodatki
// @version      3.5.0
// @description  Mroczny, spójny motyw interfejsu Margonem z własnych grafik: spękany kamień z wytartymi runami, poniszczone maski demonów, runiczny pierścień kuli HP (animowany), stłumiona czerwień. Tylko wygląd – bez zmian w logice gry.
// @author       Harkryn
// @match        https://*.margonem.pl/*
// @match        https://*.margonem.com/*
// @run-at       document-start
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @downloadURL  https://raw.githubusercontent.com/Harkryn/Dodatki/main/margonem-dark-gothic/dark-gothic.user.js
// @updateURL    https://raw.githubusercontent.com/Harkryn/Dodatki/main/margonem-dark-gothic/dark-gothic.user.js
// ==/UserScript==

(function () {
  'use strict';

  // Grafiki: assets/dark-gothic/ w repo, serwowane przez jsDelivr.
  const A = 'https://cdn.jsdelivr.net/gh/Harkryn/Dodatki@main/assets/dark-gothic/';
  const ON_CLASS = 'dg-on';
  const KEY = 'dg-enabled';

  const get = (k, d) => { try { return typeof GM_getValue === 'function' ? GM_getValue(k, d) : d; } catch (e) { return d; } };
  const set = (k, v) => { try { if (typeof GM_setValue === 'function') GM_setValue(k, v); } catch (e) { /* ignore */ } };

  // Każda reguła jest pod html.dg-on i wewnątrz .game-window-positioner:
  // wyłączenie motywu = zdjęcie jednej klasy; forum i strona główna są nietknięte.
  const R = 'html.' + ON_CLASS + ' .game-window-positioner';
  // Tabliczka HUD: reguły gry mają tu 6 klas, więc potrzebna jest pełna ścieżka.
  const HUD = R + ' .layer.interface-layer .positioner.top .hud-container';

  /*
   * Grafiki (piksele w plikach; wyświetlane w połowie rozmiaru = ostre na ekranach 2x):
   *   frame.webp        79×79   cienka ramka 9-slice ze spękanego kamienia (róg 12 px → 6 px)
   *   corner-*.webp     64×64   subtelne narożniki: sierpowate łuki-rogi z runą (tl/tr/bl/br)
   *   edge.webp         55×12   kafel kamiennej krawędzi belek
   *   btn-01…12.webp    96×96   12 kamiennych kafli przycisków o różnym stopniu zniszczenia
   *   top-head-left/right.webp 120×150 głowy posągów przy imieniu (bez szyi, patrzą na zewnątrz)
   *   top-eyes-left/right.webp 120×150 ogień w ich oczach (legenda)
   *   hud-ornament.webp 760×64  kamienna listwa z runami i medalionem pod tabliczką z imieniem
   *   stats-plaque.webp 256×396 spękana płyta z runicznym obramowaniem pod statystyki (9-slice)
   *   orb-ring.webp     260×260 runiczny pierścień kuli HP (otwór r≈92 px → 46 px)
   *   orb-runes.webp    260×260 sam żar w rowkach run (warstwa pulsująca)
   *   bg-wall.webp      512×1344 przyciemniona ściana z płaskorzeźbą demona (tło kolumn i okien)
   *   statue-head.webp  98×120  głowa kamiennego posągu demona (dolna belka, patrzy na wprost)
   *   statue-eyes-fire.webp 98×120 ogień w oczach tej głowy (zapala się przy legendzie)
   */

  // Kafle przycisków HUD: każdy pasek zaczyna od innego kafla, żeby sąsiednie przyciski się różniły.
  const BTN = (i) => `url("${A}btn-${String(i).padStart(2, '0')}.webp")`;
  const BAR_OFFSETS = { 'top-left': 0, 'top-right': 4, 'bottom-left': 7, 'bottom-right': 10 };
  let btnRules = '';
  for (const [bar, off] of Object.entries(BAR_OFFSETS)) {
    for (let k = 1; k <= 12; k++) {
      btnRules += `${R} .main-buttons-container.${bar} .widget-button:nth-child(12n+${k}) { --dg-btn: ${BTN(((k - 1 + off) % 12) + 1)}; }\n`;
    }
  }

  const css = `
html.${ON_CLASS} {
  --dg-void: #050405;
  --dg-bg0: #09080a;
  --dg-bg1: #110e10;
  --dg-blood: #2a0507;
  --dg-bordo: #43080c;
  --dg-red: #6e0f14;
  --dg-ember: #8f1a1f;
  --dg-bone: #cbc2b6;
  --dg-ash: #8d878c;
  --dg-line: rgba(110, 15, 20, .38);
  --dg-hair: rgba(140, 132, 138, .16);
  --dg-frame: url("${A}frame.webp");
  --dg-edge: url("${A}edge.webp");
  --dg-wall: url("${A}bg-wall.webp");
  --dg-corners:
    url("${A}corner-tl.webp") left top / 26px 26px no-repeat,
    url("${A}corner-tr.webp") right top / 26px 26px no-repeat,
    url("${A}corner-bl.webp") left bottom / 26px 26px no-repeat,
    url("${A}corner-br.webp") right bottom / 26px 26px no-repeat;
  --dg-font-title: "Cinzel", "Trajan Pro", Georgia, "Times New Roman", serif;
}

@keyframes dg-spin { to { transform: rotate(360deg); } }
@keyframes dg-pulse { 0%, 100% { opacity: .18; } 50% { opacity: .85; } }

/* ═════════════ GÓRNA I DOLNA BELKA ═════════════ */
/* position: relative (nie absolute!) – .bg nadaje belce wysokość; pozycjonowanie absolutne zwijało
 * dolną belkę do zera i wypychało jej tło poza ekran */
${R} .top.positioner > .bg,
${R} .bottom.positioner > .bg {
  position: relative;
  background: linear-gradient(#0a0809, #040304);
}
/* kamienna krawędź od strony mapy */
${R} .top.positioner > .bg::after {
  content: "";
  position: absolute; left: 0; right: 0; bottom: -3px;
  height: 6px;
  background: var(--dg-edge) repeat-x 0 0 / auto 6px;
  box-shadow: 0 0 6px rgba(0,0,0,.9);
  pointer-events: none;
}
${R} .bottom.positioner > .bg {
  background: var(--dg-edge) repeat-x 0 0 / auto 6px, linear-gradient(#0a0809, #040304);
}
/* głowy kamiennych posągów demonów po bokach kuli HP – patrzą na wprost; dół równo z dolną
 * krawędzią okna gry (nic nie wystaje poniżej), góra lekko zachodzi na mapę.
 * Dolny panel gry jest wyśrodkowany, więc liczymy od środka; wewnętrzna krawędź głów omija pasek EXP. */
${R} .bottom.positioner > .bg::before,
${R} .bottom.positioner > .bg::after {
  content: "";
  position: absolute;
  left: calc(50% - 361px); width: 722px;   /* dosunięte do paska EXP (kończy się ok. ±298 px od środka) */
  bottom: 0; height: 84px;
  pointer-events: none;
}
${R} .bottom.positioner > .bg::before {
  background:
    url("${A}statue-head.webp") left center / auto 100% no-repeat,
    url("${A}statue-head.webp") right center / auto 100% no-repeat;
  filter: drop-shadow(0 2px 3px #000);
}
/* ogień w oczach – niewidoczny, zapala się po zdobyciu legendy (klasa html.dg-legend) */
${R} .bottom.positioner > .bg::after {
  background:
    url("${A}statue-eyes-fire.webp") left center / auto 100% no-repeat,
    url("${A}statue-eyes-fire.webp") right center / auto 100% no-repeat;
  mix-blend-mode: screen;
  opacity: 0;
}
html.${ON_CLASS}.dg-legend .game-window-positioner .bottom.positioner > .bg::after {
  animation: dg-eyes-burn 7s ease-out forwards, dg-eyes-flicker .18s steps(2) infinite;
}
@keyframes dg-eyes-burn {
  0% { opacity: 0; }
  5% { opacity: 1; }
  80% { opacity: 1; }
  100% { opacity: 0; }
}
@keyframes dg-eyes-flicker {
  0% { filter: brightness(1) saturate(1); transform: translateY(0); }
  100% { filter: brightness(1.35) saturate(1.2); transform: translateY(-.5px); }
}

/* ═════════════ TABLICZKA HUD ═════════════ */
${HUD} {
  background: radial-gradient(ellipse 60% 85% at 50% 30%, rgba(30, 5, 7, .55), rgba(0,0,0,0) 72%);
  z-index: 0;
}
/* głowy kamiennych posągów po obu stronach imienia – bez szyi, patrzą na zewnątrz
 * (odsunięte, żeby prawej nie zasłaniała ikona powiadomień gry) */
${R} .hud-container::before,
${R} .hud-container::after {
  content: "";
  position: absolute;
  left: -116px; right: -116px;
  top: -4px; height: 68px;
  pointer-events: none;
}
${R} .hud-container::after {
  z-index: -2;
  background:
    url("${A}top-head-left.webp") left center / auto 100% no-repeat,
    url("${A}top-head-right.webp") right center / auto 100% no-repeat;
  filter: drop-shadow(0 3px 4px #000);
}
/* ogień w ich oczach – zapala się razem z dolnymi przy legendzie */
${R} .hud-container::before {
  z-index: -1;
  background:
    url("${A}top-eyes-left.webp") left center / auto 100% no-repeat,
    url("${A}top-eyes-right.webp") right center / auto 100% no-repeat;
  mix-blend-mode: screen;
  opacity: 0;
}
html.${ON_CLASS}.dg-legend .game-window-positioner .hud-container::before {
  animation: dg-eyes-burn 7s ease-out forwards, dg-eyes-flicker .18s steps(2) infinite;
}
/* kamienne zdobienie z runami i medalionem pod tabliczką z imieniem */
${R} .top.positioner > .bg::before {
  content: "";
  position: absolute;
  left: calc(50% - 190px); width: 380px;
  top: 57px; height: 32px;
  z-index: 1;
  background: url("${A}hud-ornament.webp") center / 100% 100% no-repeat;
  filter: drop-shadow(0 3px 3px #000);
  pointer-events: none;
}
${HUD} .hero-data .heroname {
  color: #a3242a;
  font-family: var(--dg-font-title);
  font-weight: 700;
  letter-spacing: .04em;
  text-shadow: 0 0 5px rgba(80, 6, 10, .8), 0 1px 1px #000;
}
${HUD} .location, ${HUD} .coords, ${HUD} .world-name, ${HUD} .herocredits {
  color: var(--dg-ash);
  text-shadow: 0 1px 1px #000;
}
${HUD} .herogold { color: var(--dg-bone); font-weight: 700; text-shadow: 0 1px 1px #000; }
/* ikony walut były częścią sprite'a tabliczki – podstawiamy czyste ikony gry */
${HUD} .gold-tip { background: url("/img/currency/goldIcon16.gif") center / 16px 16px no-repeat; filter: drop-shadow(0 0 2px #000) brightness(.9); }
${HUD} .credits-tip { background: url("/img/draconite_small.gif") -6px -4px no-repeat; transform: scale(.85); filter: drop-shadow(0 0 2px #000) brightness(.9); }
${HUD} .btn-min {
  background: ${BTN(12)} center / 100% 100%, #0b090a;
  box-shadow: 0 0 0 1px #000;
  color: var(--dg-ash);
}
${HUD} .btn-min:hover { color: var(--dg-bone); filter: brightness(1.25); }

/* ═════════════ KULA HP: runiczny pierścień (obraca się, runy pulsują) ═════════════ */
${R} .bottom-panel-graphic { filter: grayscale(1) brightness(.3) contrast(1.4); }
${R} .bottom-panel-pointer-bg::before,
${R} .bottom-panel-pointer-bg::after {
  content: "";
  position: absolute;
  /* środek kuli: 120 px od lewej krawędzi tego elementu, 29 px poniżej jego góry */
  left: calc(120px - 65px);
  top: calc(29px - 65px);
  width: 130px; height: 130px;
  pointer-events: none;
  z-index: 2;
}
${R} .bottom-panel-pointer-bg::before {
  background: url("${A}orb-ring.webp") 0 0 / 100% 100% no-repeat;
  filter: drop-shadow(0 2px 4px #000);
  animation: dg-spin 120s linear infinite;
}
${R} .bottom-panel-pointer-bg::after {
  background: url("${A}orb-runes.webp") 0 0 / 100% 100% no-repeat;
  mix-blend-mode: screen;
  animation: dg-spin 120s linear infinite, dg-pulse 6s ease-in-out infinite;
}
${R} .hp-indicator-wrapper .value {
  color: #e6ddd2;
  font-family: var(--dg-font-title);
  text-shadow: 0 0 6px #000, 0 0 2px #000;
}
${R} .bottom-panel-of-bottom-positioner .exp-bar-wrapper .exp-progress .progress .inner {
  background: linear-gradient(#0c0a0b 0%, #7a1419 30%, #560b0f 62%, #0c0a0b 100%);
}
${R} .bottom-panel-of-bottom-positioner .exp-bar-wrapper .exp-progress .progress.noexp .inner {
  background: linear-gradient(#0c0a0b 0%, #6e6a6e 30%, #4d494d 62%, #0c0a0b 100%);
}
${R} .bottom-panel-of-bottom-positioner .exp-bar-wrapper .exp-progress .overlay,
${R} .bottom-panel-pointer-bg .pointer-exp-graphic,
${R} .bottom-panel-pointer-bg .pointer-ttl-graphic { filter: grayscale(1) brightness(.45) contrast(1.3); }
${R} .bottom-panel-pointer-bg .pointer-exp,
${R} .bottom-panel-pointer-bg .pointer-ttl { color: #b3acb1; text-shadow: 0 1px 2px #000; }
${R} .interface-element-one-item-slot-2 {
  background: radial-gradient(circle at 50% 40%, #141113, #060506 75%);
  border-color: #1d191b;
  outline-color: #030203;
  box-shadow: inset 0 0 10px #000;
}

/* ═════════════ PRZYCISKI HUD: 12 kamiennych kafli ═════════════ */
${btnRules}
${R} .widget-button,
${R} .widget-button.green, ${R} .widget-button.blue, ${R} .widget-button.violet,
${R} .widget-button.blink-violet, ${R} .widget-button.red, ${R} .widget-button.orange {
  background: var(--dg-btn, ${BTN(1)}) center / 100% 100% no-repeat, #060506;
  box-shadow: none;
}
${R} .widget-button::before { box-shadow: none; }
/* kolor przycisku z gry zostaje jako słaby poblask (fiolet = nowość, niebieski = grupa) */
${R} .widget-button.violet::before, ${R} .widget-button.blink-violet::before { box-shadow: inset 0 0 9px rgba(120, 70, 160, .45); }
${R} .widget-button.blue::before { box-shadow: inset 0 0 9px rgba(60, 100, 170, .4); }
${R} .widget-button .icon { filter: grayscale(1) brightness(1.05) contrast(1.05) drop-shadow(0 1px 1px #000); }
${R} .widget-button:hover { filter: brightness(1.25); }
${R} .widget-button:hover .icon { filter: grayscale(.35) brightness(1.15) drop-shadow(0 1px 1px #000); }
${R} .widget-button.disabled .icon { filter: grayscale(1) brightness(.5); }

/* ═════════════ BOCZNE KOLUMNY I CZAT ═════════════ */
${R} .layer.interface-layer .main-column {
  /* ciemna ściana z płaskorzeźbą demona, łańcuchami i czaszkami – u dołu kolumny, góra pod tekstem zostaje ciemna */
  background: linear-gradient(rgba(5,4,5,.5), rgba(5,4,5,.12) 55%, rgba(5,4,5,0)), var(--dg-wall) center bottom / 100% auto no-repeat, var(--dg-void);
}
/* tekst czatu na ilustracji – cień dla czytelności */
${R} .chat-message-wrapper .scroll-pane { text-shadow: 0 1px 2px #000, 0 0 4px #000; }
${R} .layer.interface-layer .main-column > .border,
${R} .interface-element-vertical-wood {
  background: none;
  box-sizing: border-box;
  border-style: solid;
  border-width: 0 0 0 6px;
  border-image: var(--dg-frame) 12 / 0 0 0 6px / 0 round;
}
${R} .left-column .new-chat-window,
${R} .left-column .chat-input-wrapper { background: transparent; }
${R} .left-column .chat-channel-card-wrapper {
  background: linear-gradient(#0b090a, rgba(5,4,5,.5));
  box-shadow: inset 0 -1px 0 var(--dg-hair);
}
${R} .left-column .chat-input-wrapper {
  background: rgba(4,3,4,.9);
  box-shadow: inset 0 1px 0 var(--dg-hair);
}
${R} .left-column .magic-input-wrapper { background: rgba(0,0,0,.5); }

/* ═════════════ ZAKŁADKI ═════════════ */
${R} .tabs-nav .card,
${R} .chat-channel-card {
  background-image: linear-gradient(#100d0f, #060506);
  color: #6b666a;
  box-shadow: inset 0 0 0 1px #1a1618;
}
${R} .tabs-nav .card:hover,
${R} .chat-channel-card:hover { color: var(--dg-bone); }
${R} .tabs-nav .card.active,
${R} .chat-channel-card.active {
  background-image: linear-gradient(#1b0a0c, #0b0607);
  color: var(--dg-bone);
  box-shadow: inset 0 0 0 1px #2d1a1c, inset 0 -2px 0 var(--dg-red);
}
${R} .chat-channel-card .chat-channel-card-icon { filter: grayscale(1) brightness(.95); }
${R} .chat-channel-card.active .chat-channel-card-icon { filter: grayscale(1) brightness(1.3); }

/* ═════════════ OKNA ═════════════ */
${R} .border-window:not(.transparent) {
  border-image: var(--dg-frame) 12 / 6px / 0 round;
  /* ta sama ściana, mocniej przygaszona – w oknach ma być tylko tłem */
  background: linear-gradient(rgba(5,4,5,.6), rgba(5,4,5,.6)), var(--dg-wall) center / cover no-repeat, var(--dg-void);
  background-clip: border-box;
  background-origin: border-box;
  box-shadow: 0 10px 26px rgba(0,0,0,.85), 0 0 0 1px #000;
  color: var(--dg-bone);
}
/* subtelne narożniki: sierpowate łuki-rogi z runą */
${R} .border-window:not(.transparent)::before {
  content: "";
  position: absolute;
  inset: -32px -20px;
  background: var(--dg-corners);
  pointer-events: none;
  z-index: 3;
}
${R} .border-window:not(.transparent) > .content {
  background: rgba(5, 4, 5, .6);
  color: var(--dg-bone);
  box-shadow: inset 0 0 0 1px var(--dg-hair), inset 0 0 28px rgba(0,0,0,.85);
}
${R} .border-window .content a { color: #b8443d; }
/* tytuł okna: bez ozdobnych tabliczek – kapitaliki na czerni z cienką kreską */
${R} .border-window .header-label-positioner .header-label {
  background: linear-gradient(90deg, rgba(0,0,0,0), rgba(20,6,8,.9) 25%, rgba(20,6,8,.9) 75%, rgba(0,0,0,0));
  box-shadow: inset 0 -1px 0 var(--dg-line);
}
${R} .border-window .header-label-positioner .header-label .left-decor,
${R} .border-window .header-label-positioner .header-label .right-decor { background: none; }
${R} .border-window .header-label-positioner .header-label .text {
  color: var(--dg-bone);
  font-family: var(--dg-font-title);
  font-variant: small-caps;
  letter-spacing: .1em;
  text-shadow: 0 1px 2px #000;
}
${R} .border-window.transparent .header-label-positioner .header-label { background: none; box-shadow: none; }
${R} .border-window.transparent .header-label-positioner .header-label .text { color: #b9b0a5; }
${R} .border-window.transparent .border-image {
  background: linear-gradient(rgba(8,6,7,.92), rgba(4,3,4,.88));
  box-shadow: 0 0 0 1px #000, 0 0 0 2px var(--dg-hair), 0 4px 14px rgba(0,0,0,.7);
}
/* zamknięcie – przytłumiony krzyżyk bez drewnianego narożnika */
${R} .border-window:not(.transparent) .close-button-corner-decor { background: none; z-index: 4; }
${R} .border-window:not(.transparent) .close-button-corner-decor .close-button { filter: grayscale(1) brightness(.75); }
${R} .border-window:not(.transparent) .close-button-corner-decor .close-button:hover { filter: grayscale(1) sepia(1) hue-rotate(-50deg) saturate(3) brightness(.85); }
${R} .interface-element-bottom-bar-background-stretch { filter: grayscale(1) brightness(.35) contrast(1.3); }

/* ═════════════ PRZYCISKI TEKSTOWE ═════════════ */
/* border-width 0 + jawna border-image-width: oprawa nie zmienia układu przycisku */
${R} .button {
  border-style: solid;
  border-width: 0;
  border-image: ${BTN(12)} 22 fill / 5px / 0 stretch;
  background-image: none;
  background-color: #070607;
  box-shadow: 0 0 0 1px #000, 0 1px 4px rgba(0,0,0,.7);
}
${R} .button:hover { filter: brightness(1.3); }
${R} .button::before { box-shadow: none; }
${R} .button .label { color: var(--dg-bone); text-shadow: 0 1px 2px #000; }
/* kolory gry zachowują znaczenie – stonowane, pod kamienną oprawą bez wypełnienia */
${R} .button.red, ${R} .button.blue, ${R} .button.violet, ${R} .button.purple, ${R} .button.orange, ${R} .button.blink-violet {
  border-image: ${BTN(12)} 22 / 5px / 0 stretch;
}
${R} .button.red { background-image: linear-gradient(#4f0c10, #1c0305); }
${R} .button.blue { background-image: linear-gradient(#18283a, #070c12); }
${R} .button.violet, ${R} .button.purple, ${R} .button.blink-violet { background-image: linear-gradient(#2e1d35, #100a13); }
${R} .button.orange { background-image: linear-gradient(#4a2a0c, #190e04); }

/* ═════════════ EKWIPUNEK, TORBY, STATYSTYKI ═════════════ */
${R} .interface-element-item-slot-grid-stretch { filter: grayscale(1) brightness(.62) contrast(1.3); }
${R} .interface-element-grid-border {
  outline-color: #000;
  box-shadow: 0 0 0 1px #1d191b, 0 0 0 2px #050405;
}
${R} .interface-element-one-black-tile { background: linear-gradient(#110e10, #050405); }
/* sloty toreb – wyraźne ramki z kamiennych kafli */
${R} .inventory_wrapper .bag-slot-wrapper {
  background: ${BTN(3)} center / 100% 100% no-repeat, #070607;
  box-shadow: 0 0 0 1px #000, 0 0 0 2px #2c2629, inset 0 0 8px #000;
}
${R} .inventory_wrapper .bags-navigation-bg {
  box-shadow: 0 0 0 1px #000, 0 0 0 2px #241f22;
}
/* pole statystyk na ciemnej, spękanej płycie z runicznym obramowaniem (9-slice, runy się nie rozciągają) */
${R} .stats-wrapper.interface-element-background-color-3 {
  background: none;
  border-style: solid;
  border-width: 0;
  border-image: url("${A}stats-plaque.webp") 46 fill / 18px / 0 stretch;
  box-shadow: 0 4px 10px rgba(0,0,0,.8);
}
${R} .stats-wrapper .header-title-wrapper { margin: 4px 6px 0; }
${R} .interface-element-background-color-3,
${R} .interface-element-middle-3-background,
${R} .interface-element-middle-3-background-stretch { background: rgba(7, 6, 7, .94); }
${R} .interface-element-background-color-1,
${R} .interface-element-middle-1-background,
${R} .interface-element-middle-1-background-stretch { background: linear-gradient(rgba(5,4,5,.6), rgba(5,4,5,.6)), var(--dg-wall) center / cover no-repeat, var(--dg-void); }
${R} .interface-element-box-shadow-2 { box-shadow: inset 0 0 0 1px #1d191b, inset 0 0 14px #000; }
${R} .interface-element-active-card-background-stretch,
${R} .interface-element-active-card-border-image {
  border-image: none;
  border-color: #110d0f;  /* gra zostawia tu 5 px ramki – bez tego przyjęłaby jasny kolor tekstu */
  background: linear-gradient(#1b0a0c, #0b0607);
  box-shadow: inset 0 0 0 1px #2d1a1c, inset 0 -1px 0 var(--dg-red);
}
${R} .stats-wrapper .header-title { color: var(--dg-bone); font-family: var(--dg-font-title); letter-spacing: .1em; }
${R} .interface-element-line-1-background { background: linear-gradient(90deg, transparent, #2d1a1c 25%, #6e0f14 50%, #2d1a1c 75%, transparent); }

/* ═════════════ PASKI POSTĘPU ═════════════ */
${R} .interface-element-progress-bar-1,
${R} .interface-element-progress-bar-0 { background: #040304; box-shadow: inset 0 0 0 1px #1d191b; }
${R} .interface-element-progress-bar-0 .inner,
${R} .interface-element-progress-bar-1 .inner {
  background: linear-gradient(#7a1419 0%, #560b0f 65%, #3a070a 66%);
  border-color: #7a1419;
}
${R} .interface-element-progress-bar-0 .value,
${R} .interface-element-progress-bar-1 .value { color: #e6ddd2; }

/* ═════════════ TOOLTIPY ═════════════ */
${R} .tip-wrapper.normal-tip {
  border: 6px solid transparent;
  border-image: var(--dg-frame) 12 / 6px / 0 round;
  background: var(--dg-void);
  background-clip: padding-box;
  box-shadow: 0 8px 18px rgba(0,0,0,.9);
}
${R} .tip-wrapper.normal-tip > .content { background: rgba(5,4,5,.95); }
${R} .tip-wrapper .item-head {
  background: linear-gradient(rgba(30,6,8,.85), rgba(10,3,4,.3));
  box-shadow: inset 0 -1px 0 var(--dg-hair);
}
${R} .tip-wrapper .item-tip-section { border-color: var(--dg-hair) !important; }

/* ═════════════ DIALOG Z NPC ═════════════ */
${R} .dialogue-window .border-image {
  border: 6px solid transparent;
  border-image: var(--dg-frame) 12 / 6px / 0 round;
  background: linear-gradient(rgba(5,4,5,.6), rgba(5,4,5,.6)), var(--dg-wall) center / cover no-repeat, var(--dg-void);
  background-clip: padding-box;
  box-shadow: 0 10px 26px rgba(0,0,0,.9);
  inset: -4px;
}
${R} .dialogue-window .border-image::before {
  content: "";
  position: absolute;
  inset: -10px;
  background: var(--dg-corners);
  pointer-events: none;
}
${R} .dialogue-window .dialogue-background-color { background: rgba(4,3,4,.5); }
${R} .dialogue-window .content .npc-message { color: var(--dg-bone); }

/* ═════════════ TEKST ROZJAŚNIONY PRZEZ SKANER + POZOSTAŁE TŁA GRY ═════════════ */
html.${ON_CLASS} .dg-lt { color: var(--dg-c, #cbc2b6) !important; }
/* zielone panele informacyjne (np. „nie należysz do gildii”) → przygaszona czerń z czerwienią */
${R} .interface-element-green-box-background,
${R} .interface-element-green-box-background-stretch {
  background: linear-gradient(90deg, #070607 0%, #170a0c 30%, #170a0c 70%, #070607 100%);
  box-shadow: inset 0 0 0 1px #1d191b;
}
${R} .interface-element-wood-box-background { background: linear-gradient(#110e10, #070607); box-shadow: inset 0 0 0 1px #1d191b; }
${R} .interface-element-card-background,
${R} .interface-element-card-background-stretch { background: linear-gradient(#100d0f, #060506); border-image: none; box-shadow: inset 0 0 0 1px #1a1618; }
${R} .interface-element-header-1-background,
${R} .interface-element-header-1-background-stretch,
${R} .interface-element-header-2-background,
${R} .interface-element-header-2-background-stretch,
${R} .interface-element-bottom-bar-background {
  border-image: none; border-color: transparent;
  background: linear-gradient(90deg, rgba(0,0,0,0), rgba(24,8,10,.9) 20%, rgba(24,8,10,.9) 80%, rgba(0,0,0,0));
  box-shadow: inset 0 -1px 0 var(--dg-line);
}
${R} .interface-element-header-1 { color: var(--dg-bone); }
${R} .interface-element-middle-2-background,
${R} .interface-element-middle-2-background-stretch,
${R} .interface-element-background-color-2 { background: rgba(7, 6, 7, .94); color: var(--dg-bone); }

/* kafle okna Premium (w grze jaskrawozielone – zieleń to tu tylko domyślny kolor, nie znaczenie) */
${R} .premium-panel .product-kind .premium-item-wrapper .premium-item {
  background-color: #0f0b0d;
  box-shadow: inset 0 0 0 1px #2a2226, inset 0 1px 0 rgba(0,0,0,.75), inset 0 0 14px rgba(0,0,0,.8);
}
${R} .premium-panel .product-kind .premium-item-wrapper .premium-item:hover { background-color: #1b0d10; box-shadow: inset 0 0 0 1px #4a1a1f, inset 0 0 14px rgba(0,0,0,.8); }

/* ═════════════ SKLEP ═════════════ */
${R} .shop-background .canopy { filter: grayscale(1) sepia(.6) hue-rotate(-40deg) saturate(1.6) brightness(.32) contrast(1.25); }

/* ═════════════ SCROLLBARY ═════════════ */
${R} .scrollbar-wrapper .track { background: rgba(0,0,0,.5); box-shadow: inset 0 0 0 1px var(--dg-hair); }
${R} .scrollbar-wrapper .handle { background: linear-gradient(90deg, #1d191b, #3a3337, #1d191b); box-shadow: 0 0 0 1px #000; }

/* ═════════════ OGRANICZ RUCH ═════════════ */
@media (prefers-reduced-motion: reduce) {
  ${R} .bottom-panel-pointer-bg::before,
  ${R} .bottom-panel-pointer-bg::after { animation: none; }
  html.${ON_CLASS}.dg-legend .game-window-positioner .bottom.positioner > .bg::after { animation: dg-eyes-burn 7s ease-out forwards; }
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
   * PRZEMALOWANIE GRAFIK GRY W LOCIE
   * Gra rysuje większość UI z kilkudziesięciu plików /img/gui/* (sam atlas buttony.png
   * jest w ~180 regułach CSS). Zamiast podmieniać każdą regułę ręcznie, skrypt:
   *  1) pobiera dany plik z serwera gry (to samo źródło, nic nie jest kopiowane do repo),
   *  2) przemalowuje go na canvasie: drewno/brąz/pergamin/szarości → okopcony czarny kamień,
   *     a kolory znaczeniowe (złoto, zieleń statusów, błękit, czerwone znaczniki, jasne ikony) zostają,
   *  3) podmienia adres w regułach CSS gry na wersję przemalowaną (blob:).
   * Jasne, pergaminowe tła w regułach CSS są przyciemniane, a ciemny tekst na nich rozjaśniany.
   * Wyłączenie motywu przywraca oryginalne wartości reguł.
   * ───────────────────────────────────────────────────────────────────────── */
  const GUI_URL = /url\(\s*["']?([^"')]*\/img\/gui\/[^"')]+\.(?:png|gif))(\?[^"')]*)?["']?\s*\)/gi;
  // grafiki, które mają zostać nietknięte: kursory, ramki rzadkości, ikony umiejętności/mapy, animacje slotów…
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
      const vivid = s > 0.62 && l > 0.3 && l < 0.72;                 // złoto, klejnoty, ogień
      const green = hue > 70 && hue < 170 && s > 0.3;               // statusy, potwierdzenia
      const blue = hue > 190 && hue < 260 && s > 0.3;               // mana, informacje
      const redMark = (hue < 8 || hue > 340) && s > 0.55 && l > 0.25; // powiadomienia, ostrzeżenia
      if (vivid || green || blue || redMark) continue;
      const warm = hue >= 8 && hue <= 58;                            // drewno, brąz, pergamin
      if (s < 0.22 && l > 0.6) {                                     // jasne ikony i glify – zostają czytelne
        a[i] *= 0.88; a[i + 1] *= 0.86; a[i + 2] *= 0.86;
      } else if (warm || s < 0.22) {
        const L = 0.025 + Math.pow(l, 1.45) * 0.42;
        a[i] = Math.min(255, L * 1.06 * 255); a[i + 1] = L * 0.97 * 255; a[i + 2] = L * 255;
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

  // jasność koloru CSS (0–1) albo -1, gdy to nie kolor rgb/rgba
  function lum(v) {
    const m = /rgba?\(\s*(\d+)[ ,]+(\d+)[ ,]+(\d+)(?:[ ,/]+([\d.]+))?/.exec(v || '');
    if (!m) return -1;
    if (m[4] !== undefined && parseFloat(m[4]) < 0.5) return -1;    // półprzezroczyste – zostawiamy
    return (0.299 * m[1] + 0.587 * m[2] + 0.114 * m[3]) / 255;
  }

  async function processRule(rule) {
    const st = rule.style;
    // stany wyróżnienia (hover/aktywny/zaznaczony) przyciemniamy słabiej, żeby nadal odróżniały się od tła
    const hl = /:hover|\.active|\.selected|highlight|\.is-active|\.pressed/.test(rule.selectorText);
    for (const prop of IMG_PROPS) {
      const v = st.getPropertyValue(prop);
      if (!v || v.indexOf('/img/gui/') === -1 || v.indexOf('blob:') !== -1) continue;
      const jobs = [];
      v.replace(GUI_URL, (all, url) => { const path = url.replace(/^https?:\/\/[^/]+/, ''); if (!KEEP.test(path)) jobs.push([all, recolored(path)]); return all; });
      if (!jobs.length) continue;
      let nv = v;
      for (const [token, p] of jobs) { const u = await p; if (u) nv = nv.split(token).join(`url("${u}")`); }
      if (nv !== v && document.documentElement.classList.contains(ON_CLASS)) { remember(rule, prop); st.setProperty(prop, nv, st.getPropertyPriority(prop)); }
    }
    // jasne (pergaminowe) tła → czerń; ciemny tekst w tej samej regule → kość
    const bg = st.getPropertyValue('background-color');
    if (lum(bg) > 0.72) {
      remember(rule, 'background-color'); st.setProperty('background-color', 'rgba(9, 8, 10, .92)', st.getPropertyPriority('background-color'));
      const col = st.getPropertyValue('color');
      if (lum(col) >= 0 && lum(col) < 0.45) { remember(rule, 'color'); st.setProperty('color', '#cbc2b6', st.getPropertyPriority('color')); }
    } else if (neutral(bg) && lum(bg) > 0.2) {
      // szare tła (nagłówki sekcji, tabele, kafle) → ciemna sadza
      remember(rule, 'background-color'); st.setProperty('background-color', soot(bg, hl), st.getPropertyPriority('background-color'));
    }
    // szare gradienty w tłach → przyciemnione; kolorowe (zielone/czerwone przyciski) zostają
    const bi = st.getPropertyValue('background-image');
    if (bi && bi.indexOf('gradient') !== -1 && bi.indexOf('blob:') === -1) {
      const nb = bi.replace(/rgba?\([^)]*\)/g, (c) => (neutral(c) && lum(c) > 0.2 ? soot(c, hl) : c));
      if (nb !== bi) { remember(rule, 'background-image'); st.setProperty('background-image', nb, st.getPropertyPriority('background-image')); }
    }
  }

  function neutral(v) { const c = parseRgb(v); if (!c || c[3] < 0.5) return false; return Math.max(c[0], c[1], c[2]) - Math.min(c[0], c[1], c[2]) < 24; }
  function soot(v, highlight) {
    const c = parseRgb(v); const L = (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255;
    const k = Math.round((highlight ? 0.09 + L * 0.26 : 0.035 + L * 0.17) * 255);
    return `rgba(${k + 3}, ${k - 1}, ${k + 1}, ${c[3]})`;
  }

  const seen = new WeakSet();
  function walk(rules, out) {
    for (const r of rules) {
      if (r.cssRules && !r.selectorText) { walk(r.cssRules, out); continue; }
      if (!r.style || !r.selectorText || seen.has(r) || r.selectorText.indexOf(ON_CLASS) !== -1) continue;
      seen.add(r); out.push(r);
    }
  }
  function scanSheets() {
    if (!document.documentElement.classList.contains(ON_CLASS)) return;
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
    for (const sh of document.styleSheets) { let rr; try { rr = sh.cssRules; } catch (e) { continue; } const all = []; if (rr) (function w(list) { for (const r of list) { if (r.cssRules && !r.selectorText) w(r.cssRules); else if (r.style) all.push(r); } })(rr); all.forEach((r) => seen.delete(r)); }
    scanSheets();
  }

  /* ─────────────────────────────────────────────────────────────────────────
   * CZYTELNOŚĆ TEKSTU W OKNACH
   * Część okien gry miała ciemny tekst na pergaminie. Na czarnym tle byłby nieczytelny,
   * więc skaner oznacza elementy z ciemnym tekstem klasą .dg-lt i podaje jaśniejszy
   * odpowiednik koloru (neutralne → kość, kolorowe → ten sam odcień, rozjaśniony).
   * ───────────────────────────────────────────────────────────────────────── */
  const SCOPE = '.border-window, .tip-wrapper, .dialogue-window';
  const marked = new Set();
  function parseRgb(v) { const m = /rgba?\(\s*(\d+)[ ,]+(\d+)[ ,]+(\d+)(?:[ ,/]+([\d.]+))?/.exec(v || ''); return m ? [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]] : null; }
  function lighter([r, g, b]) {
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    if (mx - mn < 28) return '#cbc2b6';                       // szary/czarny tekst → kość
    const k = 190 / Math.max(mx, 1);                           // kolorowy → ten sam odcień, jaśniej
    return `rgb(${Math.min(255, Math.round(r * k + 30))}, ${Math.min(255, Math.round(g * k + 30))}, ${Math.min(255, Math.round(b * k + 30))})`;
  }
  function fixText(root) {
    if (!document.documentElement.classList.contains(ON_CLASS)) return;
    const els = root.querySelectorAll('*');
    for (const el of els) {
      if (el.classList.contains('dg-lt') || el.closest('.item, canvas')) continue;
      let hasText = false;
      for (const n of el.childNodes) if (n.nodeType === 3 && n.nodeValue.trim()) { hasText = true; break; }
      if (!hasText) continue;
      const c = parseRgb(getComputedStyle(el).color);
      if (!c || c[3] < 0.3) continue;
      const L = (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255;
      if (L >= 0.36) continue;
      el.style.setProperty('--dg-c', lighter(c));
      el.classList.add('dg-lt');
      marked.add(el);
    }
  }
  function unfixText() {
    for (const el of marked) { el.classList.remove('dg-lt'); el.style.removeProperty('--dg-c'); }
    marked.clear();
  }
  let pending = new Set(), timer = 0;
  function queueFix(node) {
    const w = node.nodeType === 1 ? node.closest(SCOPE) : node.parentElement && node.parentElement.closest(SCOPE);
    if (!w) return;
    pending.add(w);
    if (!timer) timer = setTimeout(() => { timer = 0; const list = [...pending]; pending.clear(); list.forEach(fixText); }, 120);
  }

  function apply(on) {
    document.documentElement.classList.toggle(ON_CLASS, on);
    if (on) { reapplySheets(); document.querySelectorAll(SCOPE).forEach(fixText); } else { restoreSheets(); unfixText(); }
  }

  const style = addStyle(css);
  if (style && style.id !== undefined) style.id = 'dark-gothic-theme';
  let enabled = get(KEY, true);
  apply(enabled);

  // Arkusze gry dochodzą w trakcie ładowania (i czasem później) – skanujemy przy zdarzeniach,
  // przy każdym nowym <style>/<link> oraz okresowo przez pierwsze dwie minuty.
  const rescan = () => { if (enabled) scanSheets(); };
  document.addEventListener('DOMContentLoaded', rescan);
  window.addEventListener('load', rescan);
  new MutationObserver((muts) => {
    let sheets = false;
    for (const m of muts) {
      for (const n of m.addedNodes) {
        if (n.nodeName === 'STYLE' || n.nodeName === 'LINK') sheets = true;
        else if (enabled) queueFix(n);
      }
      if (enabled && m.type === 'characterData') queueFix(m.target);
    }
    if (sheets) setTimeout(rescan, 50);
  }).observe(document.documentElement, { childList: true, subtree: true });
  let ticks = 0;
  const iv = setInterval(() => { rescan(); if (++ticks >= 40) clearInterval(iv); }, 3000);

  /* ─────────────────────────────────────────────────────────────────────────
   * LEGENDA → PŁONĄCE OCZY POSĄGÓW
   * Tylko obserwacja DOM (jak w Kociej Nocy): nowy przedmiot z oznaczeniem legendy (t-leg),
   * którego identyfikatora wcześniej nie widzieliśmy, pojawia się w oknie łupu albo w torbie.
   * Pierwsze 15 s po wczytaniu to rozgrzewka – zapamiętujemy przedmioty, które już są.
   * ───────────────────────────────────────────────────────────────────────── */
  const LEGEND_ITEM = '.item .highlight.t-leg, .item[data-item-type="t-leg"]';
  const LEGEND_SCOPE = ['.loot-wnd', '.interface-layer'];
  const seenLegends = new Set();
  const legendWarmUntil = Date.now() + 15000;
  let legendTimer = 0, lastLegend = 0;

  function burnEyes(force) {
    if (!enabled) return;
    if (!force && Date.now() - lastLegend < 8000) return;
    lastLegend = Date.now();
    const root = document.documentElement;
    root.classList.remove('dg-legend');
    void root.offsetWidth;            // restart animacji
    root.classList.add('dg-legend');
    clearTimeout(legendTimer);
    legendTimer = setTimeout(() => root.classList.remove('dg-legend'), 7200);
  }
  function scanLegends() {
    const armed = Date.now() > legendWarmUntil;
    let fire = false;
    for (const el of document.querySelectorAll(LEGEND_ITEM)) {
      const item = el.classList.contains('item') ? el : el.closest('.item');
      if (!item) continue;
      let id = null;
      for (const c of item.classList) if (c.startsWith('item-id-')) { id = c; break; }
      if (!id || seenLegends.has(id)) continue;
      seenLegends.add(id);
      if (armed && LEGEND_SCOPE.some((s) => item.closest(s))) fire = true;
    }
    if (fire) burnEyes(false);
  }
  let legendScheduled = false;
  new MutationObserver(() => {
    if (legendScheduled) return;
    legendScheduled = true;
    setTimeout(() => { legendScheduled = false; scanLegends(); }, 400);
  }).observe(document.documentElement, { childList: true, subtree: true });

  // Podgląd efektu: Ctrl+Alt+L
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.altKey && (e.key === 'l' || e.key === 'L')) { e.preventDefault(); burnEyes(true); }
  }, true);

  function toggle() {
    enabled = !enabled;
    set(KEY, enabled);
    apply(enabled);
  }

  // Wyłączanie: menu Tampermonkey albo Ctrl+Alt+G.
  if (typeof GM_registerMenuCommand === 'function') {
    GM_registerMenuCommand('Dark Gothic: włącz / wyłącz', toggle);
  }
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.altKey && (e.key === 'g' || e.key === 'G')) {
      e.preventDefault();
      toggle();
    }
  }, true);
})();
