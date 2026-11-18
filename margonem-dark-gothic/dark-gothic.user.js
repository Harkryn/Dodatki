// ==UserScript==
// @name         Margonem – Dark Gothic Theme
// @namespace    https://github.com/Harkryn/Dodatki
// @version      3.0.0
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
   *   demon.webp        180×220 poniszczona maska demona
   *   orb-ring.webp     260×260 runiczny pierścień kuli HP (otwór r≈92 px → 46 px)
   *   orb-runes.webp    260×260 sam żar w rowkach run (warstwa pulsująca)
   *   smoke.webp        512×512 bardzo ciemny krwawy dym (tło, bez powtarzania)
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
  --dg-smoke: url("${A}smoke.webp");
  --dg-demon: url("${A}demon.webp");
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
${R} .top.positioner > .bg,
${R} .bottom.positioner > .bg {
  position: absolute; inset: 0;
  background: linear-gradient(#0a0809, #040304);
}
/* kamienna krawędź od strony mapy */
${R} .top.positioner > .bg::after,
${R} .bottom.positioner > .bg::after {
  content: "";
  position: absolute; left: 0; right: 0;
  height: 6px;
  background: var(--dg-edge) repeat-x 0 0 / auto 6px;
  box-shadow: 0 0 6px rgba(0,0,0,.9);
  pointer-events: none;
}
${R} .top.positioner > .bg::after { bottom: -3px; }
${R} .bottom.positioner > .bg::after { top: -3px; }
/* maski demonów po bokach kuli HP (dolny panel jest wyśrodkowany) */
${R} .bottom.positioner > .bg::before {
  content: "";
  position: absolute;
  left: calc(50% - 340px); width: 680px;
  top: -40px; height: 62px;
  background:
    var(--dg-demon) left center / auto 100% no-repeat,
    var(--dg-demon) right center / auto 100% no-repeat;
  filter: drop-shadow(0 3px 4px #000);
  pointer-events: none;
}

/* ═════════════ TABLICZKA HUD ═════════════ */
${HUD} {
  background: radial-gradient(ellipse 60% 85% at 50% 30%, rgba(30, 5, 7, .55), rgba(0,0,0,0) 72%);
  z-index: 0;
}
/* maski demonów po obu stronach imienia */
${R} .hud-container::after {
  content: "";
  position: absolute;
  /* odsunięte, żeby prawej maski nie zasłaniała ikona powiadomień gry */
  left: -112px; right: -112px;
  top: -2px; height: 64px;
  z-index: -1;
  background:
    var(--dg-demon) left center / auto 100% no-repeat,
    var(--dg-demon) right center / auto 100% no-repeat;
  filter: drop-shadow(0 3px 4px #000);
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
  background: var(--dg-smoke) left bottom / 170% auto no-repeat, var(--dg-void);
}
${R} .layer.interface-layer .right-column.main-column { background-position: right bottom, 0 0; }
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
  background: var(--dg-smoke) center bottom / 140% auto no-repeat, var(--dg-void);
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
${R} .interface-element-background-color-3,
${R} .interface-element-middle-3-background,
${R} .interface-element-middle-3-background-stretch { background: rgba(7, 6, 7, .94); }
${R} .interface-element-background-color-1,
${R} .interface-element-middle-1-background,
${R} .interface-element-middle-1-background-stretch { background: var(--dg-smoke) center bottom / 140% auto no-repeat, var(--dg-void); }
${R} .interface-element-box-shadow-2 { box-shadow: inset 0 0 0 1px #1d191b, inset 0 0 14px #000; }
${R} .interface-element-active-card-background-stretch,
${R} .interface-element-active-card-border-image {
  border-image: none;
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
  background: var(--dg-smoke) center bottom / 120% auto no-repeat, var(--dg-void);
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

/* ═════════════ SKLEP ═════════════ */
${R} .shop-background .canopy { filter: grayscale(1) sepia(.6) hue-rotate(-40deg) saturate(1.6) brightness(.32) contrast(1.25); }

/* ═════════════ SCROLLBARY ═════════════ */
${R} .scrollbar-wrapper .track { background: rgba(0,0,0,.5); box-shadow: inset 0 0 0 1px var(--dg-hair); }
${R} .scrollbar-wrapper .handle { background: linear-gradient(90deg, #1d191b, #3a3337, #1d191b); box-shadow: 0 0 0 1px #000; }

/* ═════════════ OGRANICZ RUCH ═════════════ */
@media (prefers-reduced-motion: reduce) {
  ${R} .bottom-panel-pointer-bg::before,
  ${R} .bottom-panel-pointer-bg::after { animation: none; }
}
`;

  function addStyle(text) {
    if (typeof GM_addStyle === 'function') return GM_addStyle(text);
    const s = document.createElement('style');
    s.textContent = text;
    (document.head || document.documentElement).appendChild(s);
    return s;
  }

  function apply(on) {
    document.documentElement.classList.toggle(ON_CLASS, on);
  }

  const style = addStyle(css);
  if (style && style.id !== undefined) style.id = 'dark-gothic-theme';
  let enabled = get(KEY, true);
  apply(enabled);

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
