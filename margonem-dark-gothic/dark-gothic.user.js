// ==UserScript==
// @name         Margonem – Dark Gothic Theme
// @namespace    https://github.com/Harkryn/Dodatki
// @version      2.0.0
// @description  Mroczny, demoniczny motyw interfejsu Margonem z własnych grafik: głowy demonów, czarne żelazo z żarem, krwawy dym, pierścień kuli HP. Tylko wygląd – bez zmian w logice gry.
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

  /*
   * Geometria grafik (piksele w plikach; wyświetlane w połowie rozmiaru = ostre na ekranach 2x):
   *   frame.webp      166×166  9-slice, róg 28 px (żelazne guzy z żarem), krawędź = belka z runami
   *   beam.webp       110×28   kafel belki (powtarzany w poziomie)
   *   nameplate.webp  680×152  tabliczka HUD z rogami
   *   header.webp     560×117  baner tytułu okna (końcówki z rogami ~120 px)
   *   demon.webp      188×220  głowa demona
   *   orb-ring.webp   334×344  pierścień kuli HP; środek otworu (168.7, 181.3), promień 98
   *   button.webp     96×96    kafel przycisku (+ button-hover.webp)
   *   skull.webp      73×96    czaszka demona
   *   smoke.webp      512×512  krwawy dym (tło, bez powtarzania)
   */
  const css = `
html.${ON_CLASS} {
  --dg-void: #070607;
  --dg-bg0: #0b0b0d;
  --dg-bg1: #141012;
  --dg-blood: #3a0508;
  --dg-bordo: #5a0a0f;
  --dg-red: #8b0000;
  --dg-ember: #c0262d;
  --dg-bone: #d8cfc0;
  --dg-silver: #8a8a90;
  --dg-line: rgba(139, 0, 0, .55);
  --dg-frame: url("${A}frame.webp");
  --dg-beam: url("${A}beam.webp");
  --dg-smoke: url("${A}smoke.webp");
  --dg-demon: url("${A}demon.webp");
  --dg-font-title: "Cinzel", "Trajan Pro", Georgia, "Times New Roman", serif;
}

/* ═════════════ GÓRNA BELKA I TABLICZKA HUD ═════════════ */
${R} .top.positioner > .bg,
${R} .bottom.positioner > .bg {
  background:
    linear-gradient(rgba(58,5,8,.18), rgba(0,0,0,0) 60%),
    linear-gradient(#0c0a0b, #050405);
}
/* belka z runami na krawędzi od strony mapy */
${R} .top.positioner > .bg::after,
${R} .bottom.positioner > .bg::after {
  content: "";
  position: absolute;
  left: 0; right: 0;
  height: 14px;
  background: var(--dg-beam) repeat-x 0 0 / auto 14px;
  filter: drop-shadow(0 0 4px rgba(0,0,0,.9));
  pointer-events: none;
}
${R} .top.positioner > .bg::after { bottom: -7px; }
${R} .bottom.positioner > .bg::after { top: -7px; }
${R} .top.positioner > .bg, ${R} .bottom.positioner > .bg { position: absolute; inset: 0; }

/* tabliczka z imieniem, lokacją i złotem */
${R} .hud-container {
  background: none;
  z-index: 0;
}
${R} .hud-container::before {
  content: "";
  position: absolute;
  left: -40px; right: -40px;
  top: -14px; height: 94px;
  z-index: -1;
  background:
    url("${A}nameplate.webp") center / 100% 100% no-repeat,
    linear-gradient(#0d0a0b, #050304) center 52% / 64% 50% no-repeat;
  filter: drop-shadow(0 4px 6px rgba(0,0,0,.9));
  pointer-events: none;
}
/* głowy demonów po obu stronach tabliczki */
${R} .hud-container::after {
  content: "";
  position: absolute;
  left: -104px; right: -104px;
  top: -6px; height: 70px;
  z-index: -2;
  background:
    var(--dg-demon) left center / auto 100% no-repeat,
    var(--dg-demon) right center / auto 100% no-repeat;
  filter: drop-shadow(0 3px 5px rgba(0,0,0,.95)) brightness(.9);
  pointer-events: none;
}
${R} .hud-container .heroname {
  color: var(--dg-ember);
  font-family: var(--dg-font-title);
  font-weight: 700;
  letter-spacing: .03em;
  text-shadow: 0 0 6px rgba(139,0,0,.75), 0 1px 1px #000;
}
${R} .hud-container .location,
${R} .hud-container .coords,
${R} .hud-container .world-name,
${R} .hud-container .herogold,
${R} .hud-container .herocredits {
  color: #a8a2a6;
  text-shadow: 0 1px 1px #000;
}
${R} .hud-container .herogold { color: var(--dg-bone); font-weight: 700; }
${R} .hud-container .btn-min {
  background: linear-gradient(#3a0508, #160203);
  box-shadow: inset 0 0 0 1px #5a0a0f, 0 0 0 1px #000;
  color: var(--dg-bone);
}

/* ═════════════ DOLNY PANEL, KULA HP, EXP ═════════════ */
/* oryginalna grafika panelu → poczerniałe żelazo */
${R} .bottom-panel-graphic { filter: grayscale(1) brightness(.42) contrast(1.35); }
/* pierścień kuli HP i głowy demonów zawieszone na .bottom-panel-pointer-bg (wyśrodkowane nad kulą) */
${R} .bottom-panel-pointer-bg::before {
  content: "";
  position: absolute;
  /* środek kuli: 120 px od lewej krawędzi tego elementu, 29 px poniżej jego góry */
  left: calc(120px - 84.35px);
  top: calc(29px - 90.65px);
  width: 167px; height: 172px;
  background: url("${A}orb-ring.webp") 0 0 / 100% 100% no-repeat;
  z-index: 2;
  pointer-events: none;
}
${R} .bottom-panel-pointer-bg::after {
  content: "";
  position: absolute;
  left: calc(120px - 330px); width: 660px;
  top: -44px; height: 68px;
  background:
    var(--dg-demon) left center / auto 100% no-repeat,
    var(--dg-demon) right center / auto 100% no-repeat;
  filter: drop-shadow(0 3px 5px rgba(0,0,0,.95)) brightness(.85);
  z-index: 0;
  pointer-events: none;
}
${R} .hp-indicator-wrapper .value {
  color: #f1e6dc;
  font-family: var(--dg-font-title);
  text-shadow: 0 0 6px #000, 0 0 2px #000;
}
${R} .bottom-panel-of-bottom-positioner .exp-bar-wrapper .exp-progress .progress .inner {
  background: linear-gradient(#0f0f0f 0%, #c0262d 25%, #8b0000 60%, #0f0f0f 100%);
}
${R} .bottom-panel-of-bottom-positioner .exp-bar-wrapper .exp-progress .progress.noexp .inner {
  background: linear-gradient(#0f0f0f 0%, #8a8a90 25%, #8a8a90 60%, #0f0f0f 100%);
}
${R} .bottom-panel-of-bottom-positioner .exp-bar-wrapper .exp-progress .overlay { filter: grayscale(1) brightness(.6) contrast(1.3); }
${R} .bottom-panel-pointer-bg .pointer-exp-graphic,
${R} .bottom-panel-pointer-bg .pointer-ttl-graphic { filter: grayscale(1) brightness(.5) contrast(1.3); }
${R} .bottom-panel-pointer-bg .pointer-exp,
${R} .bottom-panel-pointer-bg .pointer-ttl { color: #c9c2c6; text-shadow: 0 1px 2px #000; }
/* sloty szybkiego użycia */
${R} .interface-element-one-item-slot-2 {
  background: radial-gradient(circle at 50% 40%, #171214, #070607 75%);
  border-color: #2a0a0c;
  outline-color: #050405;
  box-shadow: inset 0 0 10px #000, inset 0 0 0 1px rgba(139,0,0,.25);
}

/* ═════════════ PRZYCISKI HUD (kwadratowe ikony) ═════════════ */
${R} .widget-button,
${R} .widget-button.green,
${R} .widget-button.blue,
${R} .widget-button.violet,
${R} .widget-button.blink-violet,
${R} .widget-button.red {
  background: url("${A}button.webp") center / 100% 100% no-repeat, #070607;
  box-shadow: none;
}
${R} .widget-button::before { box-shadow: none; }
${R} .widget-button:hover { background-image: url("${A}button-hover.webp"); }
/* kolor przycisku gry zostaje jako delikatna poświata (fiolet = nowość, niebieski = grupa…) */
${R} .widget-button.violet::before, ${R} .widget-button.blink-violet::before { box-shadow: inset 0 0 10px rgba(150, 80, 190, .55); }
${R} .widget-button.blue::before { box-shadow: inset 0 0 10px rgba(60, 120, 200, .5); }
${R} .widget-button .icon { filter: grayscale(1) brightness(1.25) contrast(1.05) drop-shadow(0 1px 1px #000); }
${R} .widget-button:hover .icon { filter: grayscale(.2) brightness(1.3) drop-shadow(0 0 4px rgba(192,38,45,.7)); }
${R} .widget-button.disabled .icon { filter: grayscale(1) brightness(.55); }

/* ═════════════ BOCZNE KOLUMNY ═════════════ */
${R} .layer.interface-layer .main-column {
  background: var(--dg-smoke) left bottom / 170% auto no-repeat, var(--dg-void);
}
${R} .layer.interface-layer .right-column.main-column { background-position: right bottom, 0 0; }
${R} .layer.interface-layer .main-column > .border,
${R} .interface-element-vertical-wood {
  background: none;
  box-sizing: border-box;
  border-style: solid;
  border-width: 0 0 0 10px;
  border-image: var(--dg-frame) 28 / 0 0 0 10px / 0 round;
}

/* ═════════════ CZAT ═════════════ */
${R} .left-column .new-chat-window,
${R} .left-column .chat-input-wrapper { background: transparent; }
${R} .left-column .chat-channel-card-wrapper {
  background: linear-gradient(#0e0b0c, rgba(7,6,7,.6));
  box-shadow: inset 0 -1px 0 var(--dg-line);
}
${R} .left-column .chat-input-wrapper {
  background: rgba(5,4,5,.88);
  box-shadow: inset 0 1px 0 var(--dg-line);
}
${R} .left-column .magic-input-wrapper { background: rgba(0,0,0,.55); }

/* ═════════════ ZAKŁADKI ═════════════ */
${R} .tabs-nav .card,
${R} .chat-channel-card {
  background-image: linear-gradient(#141012, #070607);
  color: #77727a;
  box-shadow: inset 0 0 0 1px #1e1a1c;
}
${R} .tabs-nav .card:hover,
${R} .chat-channel-card:hover { color: var(--dg-bone); }
${R} .tabs-nav .card.active,
${R} .chat-channel-card.active {
  background-image: linear-gradient(#3a0508, #120203);
  color: var(--dg-bone);
  box-shadow: inset 0 0 0 1px #6b0d13, inset 0 -2px 0 var(--dg-ember), 0 0 8px rgba(139,0,0,.35);
}
${R} .chat-channel-card .chat-channel-card-icon { filter: grayscale(1) brightness(1.1); }
${R} .chat-channel-card.active .chat-channel-card-icon { filter: grayscale(.3) brightness(1.2) drop-shadow(0 0 3px rgba(192,38,45,.6)); }

/* ═════════════ OKNA ═════════════ */
${R} .border-window:not(.transparent) {
  border-image: var(--dg-frame) 28 / 14px / 0 round;
  background: var(--dg-smoke) center bottom / 140% auto no-repeat, var(--dg-void);
  background-clip: border-box;
  background-origin: border-box;
  box-shadow: 0 10px 28px rgba(0,0,0,.85), 0 0 0 1px #000;
  color: var(--dg-bone);
}
/* czaszka demona pośrodku dolnej krawędzi */
${R} .border-window:not(.transparent)::after {
  content: "";
  position: absolute;
  left: 50%; bottom: -46px;
  width: 26px; height: 34px;
  margin-left: -13px;
  background: url("${A}skull.webp") 0 0 / 100% 100% no-repeat;
  filter: drop-shadow(0 2px 3px #000);
  pointer-events: none;
  z-index: 3;
}
${R} .border-window:not(.transparent) > .content {
  background: rgba(7, 6, 7, .62);
  color: var(--dg-bone);
  box-shadow: inset 0 0 0 1px rgba(139,0,0,.22), inset 0 0 30px rgba(0,0,0,.85);
}
${R} .border-window .content a { color: #d0453c; }

/* baner tytułu z rogami (rysowany przez border-image na .header-label, wychodzi na miejsce ozdób) */
${R} .border-window .header-label-positioner .header-label {
  background: none;
  box-shadow: none;
  border-style: solid;
  border-width: 0;
  border-image: url("${A}header.webp") 0 125 fill / 0 30px / 0 46px stretch;
}
${R} .border-window .header-label-positioner .header-label .left-decor,
${R} .border-window .header-label-positioner .header-label .right-decor { background: none; }
${R} .border-window .header-label-positioner .header-label .text {
  color: var(--dg-bone);
  font-family: var(--dg-font-title);
  font-variant: small-caps;
  letter-spacing: .08em;
  text-shadow: 0 0 6px rgba(139,0,0,.9), 0 1px 1px #000;
}
/* okna przezroczyste (questy, sorter) – lżejsze: bez rogów, tylko kreska */
${R} .border-window.transparent .header-label-positioner .header-label { border-image: none; }
${R} .border-window.transparent .header-label-positioner .header-label .text {
  color: #c9bfb3; font-family: var(--dg-font-title); font-variant: small-caps; letter-spacing: .06em; text-shadow: 0 1px 2px #000;
}
${R} .border-window.transparent .border-image {
  background: linear-gradient(rgba(10,8,9,.9), rgba(5,4,5,.86));
  box-shadow: 0 0 0 1px #000, 0 0 0 2px rgba(139,0,0,.45), 0 4px 14px rgba(0,0,0,.7);
}
/* zamknięcie – czerwony krzyżyk bez drewnianego narożnika */
${R} .border-window:not(.transparent) .close-button-corner-decor { background: none; }
${R} .border-window:not(.transparent) .close-button-corner-decor .close-button {
  filter: grayscale(1) sepia(1) hue-rotate(-50deg) saturate(4) brightness(.7);
}
${R} .border-window:not(.transparent) .close-button-corner-decor .close-button:hover { filter: grayscale(1) sepia(1) hue-rotate(-50deg) saturate(5) brightness(1.05); }
/* dolny pasek okien („Need more gold?” itp.) */
${R} .interface-element-bottom-bar-background-stretch { filter: grayscale(1) brightness(.4) contrast(1.3); }

/* ═════════════ PRZYCISKI TEKSTOWE ═════════════ */
/* border-width 0 + jawna border-image-width: oprawa nie zmienia układu przycisku */
${R} .button {
  border-style: solid;
  border-width: 0;
  border-image: url("${A}button.webp") 24 fill / 6px / 0 stretch;
  background-image: none;
  background-color: #070607;
  box-shadow: none;
}
${R} .button:hover { border-image-source: url("${A}button-hover.webp"); }
${R} .button::before { box-shadow: none; }
${R} .button .label { color: var(--dg-bone); text-shadow: 0 1px 2px #000; }
/* kolory gry zachowują znaczenie: oprawa bez wypełnienia, pod nią przyciemniony kolor */
${R} .button.red, ${R} .button.blue, ${R} .button.violet, ${R} .button.purple, ${R} .button.orange, ${R} .button.blink-violet {
  border-image: url("${A}button.webp") 24 / 6px / 0 stretch;
}
${R} .button.red { background-image: linear-gradient(#7d1017, #2a0406); }
${R} .button.blue { background-image: linear-gradient(#1d3550, #08111c); }
${R} .button.violet, ${R} .button.purple, ${R} .button.blink-violet { background-image: linear-gradient(#45284f, #160c1a); }
${R} .button.orange { background-image: linear-gradient(#6a3a0d, #231304); }

/* ═════════════ EKWIPUNEK, TORBY, STATYSTYKI ═════════════ */
${R} .interface-element-item-slot-grid-stretch { filter: grayscale(1) brightness(.5) contrast(1.25); }
${R} .interface-element-grid-border {
  outline-color: #000;
  box-shadow: 0 0 0 1px #2a2628, 0 0 0 2px #050405, 0 0 0 3px #3a0508;
}
${R} .interface-element-one-black-tile { background: linear-gradient(#141012, #050405); }
${R} .interface-element-background-color-3,
${R} .interface-element-middle-3-background,
${R} .interface-element-middle-3-background-stretch { background: rgba(9, 7, 8, .94); }
${R} .interface-element-background-color-1,
${R} .interface-element-middle-1-background,
${R} .interface-element-middle-1-background-stretch { background: var(--dg-smoke) center bottom / 140% auto no-repeat, var(--dg-void); }
${R} .interface-element-box-shadow-2 { box-shadow: inset 0 0 0 1px #2a0a0c, inset 0 0 14px #000; }
${R} .interface-element-active-card-background-stretch,
${R} .interface-element-active-card-border-image {
  border-image: none;
  background: linear-gradient(#3a0508, #120203);
  box-shadow: inset 0 0 0 1px #6b0d13, inset 0 -2px 0 var(--dg-ember);
}
${R} .stats-wrapper .header-title { color: var(--dg-bone); font-family: var(--dg-font-title); letter-spacing: .08em; }
${R} .interface-element-line-1-background { background: linear-gradient(90deg, transparent, #5a0a0f 25%, #c0262d 50%, #5a0a0f 75%, transparent); }

/* ═════════════ PASKI POSTĘPU ═════════════ */
${R} .interface-element-progress-bar-1,
${R} .interface-element-progress-bar-0 { background: #050405; box-shadow: inset 0 0 0 1px #2a2628; }
${R} .interface-element-progress-bar-0 .inner,
${R} .interface-element-progress-bar-1 .inner {
  background: linear-gradient(#c0262d 0%, #8b0000 65%, #5a0a0f 66%);
  border-color: #c0262d;
}
${R} .interface-element-progress-bar-0 .value,
${R} .interface-element-progress-bar-1 .value { color: #f1ebe0; }

/* ═════════════ TOOLTIPY ═════════════ */
${R} .tip-wrapper.normal-tip {
  border: 7px solid transparent;
  border-image: var(--dg-frame) 28 / 7px / 0 round;
  background: var(--dg-void);
  background-clip: padding-box;
  box-shadow: 0 8px 18px rgba(0,0,0,.9);
}
${R} .tip-wrapper.normal-tip > .content { background: rgba(7,6,7,.94); }
${R} .tip-wrapper .item-head {
  background: linear-gradient(rgba(58,5,8,.75), rgba(20,3,4,.3));
  box-shadow: inset 0 -1px 0 var(--dg-line);
}
${R} .tip-wrapper .item-tip-section { border-color: rgba(139,0,0,.3) !important; }

/* ═════════════ DIALOG Z NPC ═════════════ */
${R} .dialogue-window .border-image {
  border: 14px solid transparent;
  border-image: var(--dg-frame) 28 / 14px / 0 round;
  background: var(--dg-smoke) center bottom / 120% auto no-repeat, var(--dg-void);
  background-clip: padding-box;
  box-shadow: 0 10px 26px rgba(0,0,0,.9);
  inset: -10px;
}
${R} .dialogue-window .dialogue-background-color { background: rgba(5,4,5,.55); }
${R} .dialogue-window .content .npc-message { color: var(--dg-bone); }
/* głowa demona nad dialogiem */
${R} .dialogue-window .border-image::before {
  content: "";
  position: absolute;
  left: 50%; top: -52px;
  width: 44px; height: 52px;
  margin-left: -22px;
  background: var(--dg-demon) center / 100% 100% no-repeat;
  filter: drop-shadow(0 3px 4px #000);
  pointer-events: none;
}

/* ═════════════ SKLEP ═════════════ */
${R} .shop-background .canopy { filter: grayscale(1) sepia(1) hue-rotate(-48deg) saturate(2.6) brightness(.45) contrast(1.2); }

/* ═════════════ SCROLLBARY ═════════════ */
${R} .scrollbar-wrapper .track { background: rgba(0,0,0,.5); box-shadow: inset 0 0 0 1px rgba(139,0,0,.2); }
${R} .scrollbar-wrapper .handle { background: linear-gradient(90deg, #3a0508, #8b0000, #3a0508); box-shadow: 0 0 0 1px #000; }
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
