// ==UserScript==
// @name         Margonem – Czarna Dziura
// @namespace    https://github.com/Harkryn/Dodatki
// @author       Harkryn
// @version      1.0.0
// @description  Motyw interfejsu Margonem w barwach czarnej dziury: czerń, głęboki fiolet i różowo-magentowa korona zaćmienia. Tylko wygląd – bez zmian w logice gry i mapie.
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
// @updateURL    https://raw.githubusercontent.com/Harkryn/Dodatki/main/margonem-czarna-dziura/czarna-dziura.user.js
// @downloadURL  https://raw.githubusercontent.com/Harkryn/Dodatki/main/margonem-czarna-dziura/czarna-dziura.user.js
// ==/UserScript==

(() => {
  'use strict';

  if (window.top !== window.self) return;

  const VERSION = '1.0.0';
  // Grafiki: assets/czarna-dziura/ w repo, serwowane przez jsDelivr.
  const A = `https://cdn.jsdelivr.net/gh/Harkryn/Dodatki@main/assets/czarna-dziura`;
  const ON_CLASS = 'cdz-on';
  const KEY = 'cdz-enabled';

  const css = (A) => `
:root {
  --cdz-bg: #07040d;
  --cdz-panel: rgba(10, 5, 18, .92);
  --cdz-violet: #8a4fd0;
  --cdz-pink: #e65fd2;
  --cdz-pink-soft: rgba(230, 95, 210, .35);
  --cdz-line: rgba(200, 120, 230, .35);
  --cdz-text: #e8def2;
  --cdz-title: #ffd9f6;
  --cdz-tex: url("${A}/panel-bg.webp");
  --cdz-haze: radial-gradient(ellipse 90% 60% at 50% 0%, rgba(150, 50, 150, .22), transparent 70%),
             radial-gradient(ellipse 70% 50% at 100% 100%, rgba(90, 40, 160, .18), transparent 70%);
}

/* ===== Okna (zwykłe) ===== */
html.${ON_CLASS} .border-window:not(.transparent):not(.tip-window) {
  border-image: url("${A}/frame.webp") 16 / 16px / 0 stretch !important;
  background: var(--cdz-haze), var(--cdz-tex), var(--cdz-bg) !important;
  background-clip: border-box !important;
  box-shadow: 0 0 0 1px #000, 0 0 18px var(--cdz-pink-soft), 0 6px 24px rgba(0, 0, 0, .8);
}
html.${ON_CLASS} .border-window:not(.transparent):not(.tip-window) > .content {
  background: transparent !important;
  color: var(--cdz-text);
}
/* nagłówek okna */
html.${ON_CLASS} .border-window:not(.transparent):not(.tip-window) .header-label-positioner .header-label {
  background: url("${A}/header.webp") center / 100% 100% no-repeat, #0b0612 !important;
  box-shadow: 0 0 0 1px #000, 0 0 10px rgba(230, 95, 210, .45) !important;
}
html.${ON_CLASS} .border-window:not(.transparent):not(.tip-window) .header-label-positioner .header-label .text {
  color: var(--cdz-title) !important;
  text-shadow: 0 0 6px rgba(230, 95, 210, .9), 0 1px 2px #000 !important;
}
html.${ON_CLASS} .border-window:not(.transparent):not(.tip-window) .header-label-positioner .header-label .left-decor,
html.${ON_CLASS} .border-window:not(.transparent):not(.tip-window) .header-label-positioner .header-label .right-decor {
  background: url("${A}/skull.webp") center / 30px 30px no-repeat !important;
  filter: drop-shadow(0 0 4px rgba(230, 95, 210, .7));
}
/* przycisk zamknięcia */
/* oryginalny „X” zostaje (czytelność), tylko przebarwiony na fiolet/magentę */
html.${ON_CLASS} .border-window:not(.transparent):not(.tip-window) .close-button-corner-decor {
  filter: hue-rotate(285deg) saturate(1.4) drop-shadow(0 0 5px rgba(230, 95, 210, .7));
}
html.${ON_CLASS} .border-window:not(.transparent):not(.tip-window) .close-button-corner-decor .close-button:hover {
  filter: brightness(1.3);
}
/* zakładki */
html.${ON_CLASS} .border-window .card {
  background-image: linear-gradient(#1d1027, #0d0714) !important;
  color: #a998b8 !important;
}
html.${ON_CLASS} .border-window .card.active {
  background-image: linear-gradient(#5a2a6e, #2a1036) !important;
  color: #fff !important;
  box-shadow: inset 0 -2px 0 var(--cdz-pink), 0 0 8px rgba(230, 95, 210, .4);
}

/* ===== Okna przezroczyste (minimapa, obserwowane zadania) ===== */
html.${ON_CLASS} .border-window.transparent .border-image {
  background: rgba(10, 4, 18, .78);
  box-shadow: 0 0 0 1px #000, 0 0 0 2px rgba(200, 110, 220, .55), 0 0 0 3px #0a0410, 0 0 12px rgba(230, 95, 210, .3) !important;
}

/* ===== Okno dialogu NPC ===== */
html.${ON_CLASS} .dialogue-window .border-image {
  background: rgba(8, 3, 14, .82);
  box-shadow: 0 0 0 1px #000, 0 0 0 2px rgba(200, 110, 220, .6), 0 0 0 3px #0a0410, 0 0 16px rgba(230, 95, 210, .35) !important;
}
html.${ON_CLASS} .dialogue-window .dialogue-background-color { background: rgba(8, 3, 14, .7) !important; }
html.${ON_CLASS} .dialogue-window .content .npc-dialogue-wrapper .h_content { color: var(--cdz-title) !important; text-shadow: 0 0 6px rgba(230, 95, 210, .7); }
html.${ON_CLASS} .dialogue-window .content .answers li { border-bottom-color: var(--cdz-line) !important; }
html.${ON_CLASS} .dialogue-window .content .answers li:hover { background: rgba(230, 95, 210, .14) !important; }

/* ===== Przyciski ===== */
html.${ON_CLASS} .button.green:not(.background-gold):not(.background-draconite) {
  background: url("${A}/button.webp") center / 100% 100% no-repeat, #0b0612 !important;
  box-shadow: 0 0 0 1px #000 !important;
}
html.${ON_CLASS} .button.green:not(.background-gold):not(.background-draconite):not(.disable):not(.no-hover):hover {
  background-image: url("${A}/button-hover.webp") !important;
  box-shadow: 0 0 0 1px #000, 0 0 8px rgba(230, 95, 210, .6) !important;
}
html.${ON_CLASS} .button.green::before { box-shadow: none !important; }
html.${ON_CLASS} .button.green .label { color: #f6e9ff !important; text-shadow: 0 0 4px rgba(230, 95, 210, .8), 0 1px 1px #000; }
html.${ON_CLASS} .widget-button.green {
  background-image: linear-gradient(#4a1c5c, #14061e) !important;
  box-shadow: inset 0 0 1px 1px rgba(230, 160, 240, .7), inset 0 0 0 3px #0c0610 !important;
}
html.${ON_CLASS} .widget-button.green::before { box-shadow: inset 0 0 1px 1px rgba(230, 95, 210, .55) !important; }
html.${ON_CLASS} .widget-button.green:not(.disabled):hover { filter: brightness(1.25) drop-shadow(0 0 4px rgba(230, 95, 210, .7)); }

/* ===== Górny i dolny pasek interfejsu ===== */
html.${ON_CLASS} .interface-layer > .top.positioner > .bg {
  background: url("${A}/separator.webp") bottom center / 100% 6px no-repeat, var(--cdz-tex), var(--cdz-bg) !important;
}
html.${ON_CLASS} .interface-layer > .bottom.positioner > .bg {
  background: url("${A}/separator.webp") top center / 100% 6px no-repeat, var(--cdz-tex), var(--cdz-bg) !important;
}
html.${ON_CLASS} .interface-layer .bottom-panel-graphic,
html.${ON_CLASS} .interface-layer .hud-container {
  filter: sepia(.35) hue-rotate(235deg) saturate(1.5) brightness(.9);
}

/* ===== Prawa kolumna (postać, ekwipunek, torby) ===== */
html.${ON_CLASS} .interface-layer > .right-column.main-column {
  background: var(--cdz-haze), var(--cdz-tex), var(--cdz-bg) !important;
}
html.${ON_CLASS} .interface-layer > .right-column.main-column > .border {
  background: linear-gradient(to right, #050208 0, #2a0f33 35%, var(--cdz-pink) 50%, #2a0f33 65%, #050208 100%) !important;
  box-shadow: 0 0 10px rgba(230, 95, 210, .45);
}
html.${ON_CLASS} .interface-layer .interface-element-grid-border,
html.${ON_CLASS} .interface-layer .interface-element-grid-border-light {
  outline-color: #0a0410 !important;
  box-shadow: 0 0 0 1px rgba(170, 100, 210, .55), 0 0 0 2px #12081a, 0 0 0 3px rgba(120, 60, 160, .5), 0 0 8px rgba(230, 95, 210, .18) !important;
}
html.${ON_CLASS} .interface-layer .stats-wrapper { background-color: rgba(14, 7, 22, .92) !important; }
html.${ON_CLASS} .interface-layer .equipment-outline-2,
html.${ON_CLASS} .interface-layer .equipment-outline-3 { background-color: #4b2d5e !important; }

/* ===== Paski HP / EXP ===== */
html.${ON_CLASS} .interface-element-progress-bar-1 {
  background: #0b0612 !important;
  box-shadow: inset 0 0 0 1px rgba(150, 90, 200, .35);
}
html.${ON_CLASS} .interface-element-progress-bar-1 .inner {
  background: linear-gradient(#d0283f 70%, #9a1630 70%) !important;
  border-color: #e0405a !important;
  box-shadow: 0 0 6px rgba(240, 60, 90, .55);
}
html.${ON_CLASS} .interface-element-progress-bar-1.green .inner {
  background: linear-gradient(#c04fd8 70%, #8e2fae 70%) !important;
  border-color: #e07bf0 !important;
  box-shadow: 0 0 6px rgba(230, 95, 210, .6);
}
html.${ON_CLASS} .interface-element-progress-bar-1 .value { color: #fff !important; }
/* dolny pasek doświadczenia: pomarańcz → magenta (kula HP zostaje czerwona) */
html.${ON_CLASS} .interface-layer .exp-bar-wrapper .exp-progress .progress .inner {
  filter: hue-rotate(270deg) saturate(1.3) brightness(1.1);
}

/* ===== Czat (lewa kolumna) ===== */
html.${ON_CLASS} .interface-layer > .left-column.main-column,
html.${ON_CLASS} .new-chat-window {
  background: var(--cdz-haze), var(--cdz-tex), var(--cdz-bg) !important;
}
html.${ON_CLASS} .new-chat-window .chat-message-wrapper {
  border-top-color: var(--cdz-line) !important;
  border-bottom-color: var(--cdz-line) !important;
  box-shadow: inset 0 0 10px 3px #000 !important;
  background: rgba(5, 2, 10, .55) !important;
}
html.${ON_CLASS} .new-chat-window .chat-input-wrapper { background: linear-gradient(#150a20, #07040d) !important; }

/* ===== Dymki (tooltipy) ===== */
html.${ON_CLASS} .tip-wrapper .content { background-color: rgba(10, 4, 18, .94) !important; }
html.${ON_CLASS} .tip-wrapper .item-head { background-color: rgba(200, 110, 230, .09) !important; }
html.${ON_CLASS} .tip-wrapper:not([data-item-type]),
html.${ON_CLASS} .tip-wrapper[data-item-type="t-norm"] {
  box-shadow: 0 0 0 1px #000, 0 0 0 2px rgba(200, 110, 220, .6), 0 0 0 3px #0a0410, 0 0 12px rgba(230, 95, 210, .35) !important;
}
html.${ON_CLASS} .tip-wrapper .item-tip-section { border-bottom-color: var(--cdz-line) !important; }

/* ===== Wspólne elementy interfejsu (interface-element-*) ===== */
html.${ON_CLASS} .interface-element-bottom-bar-background,
html.${ON_CLASS} .interface-element-bottom-bar-background-stretch {
  border-image: none !important;
  border-color: transparent !important;
  background: url("${A}/separator.webp") top center / 100% 6px no-repeat, linear-gradient(#170b22, #07040d) !important;
}
html.${ON_CLASS} .interface-element-header-1-background,
html.${ON_CLASS} .interface-element-header-1-background-stretch,
html.${ON_CLASS} .interface-element-table-header-1-background {
  border-image: none !important;
  border-color: transparent !important;
  background: url("${A}/header.webp") center / 100% 100% no-repeat, #0b0612 !important;
}
html.${ON_CLASS} .interface-element-middle-1-background,
html.${ON_CLASS} .interface-element-middle-1-background-stretch,
html.${ON_CLASS} .interface-element-middle-3-background-stretch,
html.${ON_CLASS} .interface-element-middle-4-background {
  border-image: none !important;
  border-color: #1a0d24 !important;
  background-color: rgba(12, 6, 20, .88) !important;
  background-image: none !important;
  box-shadow: inset 0 0 0 1px rgba(150, 90, 200, .35), inset 0 0 12px rgba(0, 0, 0, .8);
}
html.${ON_CLASS} .interface-element-vertical-wood {
  background: linear-gradient(to right, #050208, #2a0f33 35%, rgba(230, 95, 210, .9) 50%, #2a0f33 65%, #050208) !important;
}
html.${ON_CLASS} .interface-element-line-1-background {
  background: linear-gradient(90deg, transparent, rgba(230, 95, 210, .9) 50%, transparent) !important;
}
html.${ON_CLASS} .interface-element-background-color-1 { background: #120818 !important; }
html.${ON_CLASS} .interface-element-background-color-3 { background: #150b1e !important; }
html.${ON_CLASS} .interface-element-wood-box-background {
  background: var(--cdz-haze), rgba(14, 7, 22, .95) !important;
  box-shadow: inset 0 0 0 1px rgba(170, 100, 210, .5);
}
html.${ON_CLASS} .interface-element-one-item-slot-2 {
  background: #150a1e !important;
  border-color: #3b2350 !important;
  outline-color: #1b0e26 !important;
}
html.${ON_CLASS} .interface-element-one-black-tile { background: linear-gradient(#22142c, #120a19) !important; }
html.${ON_CLASS} .interface-element-one-gray-tile { background: linear-gradient(#55306a, #2c1638) !important; }
html.${ON_CLASS} .interface-element-card-background,
html.${ON_CLASS} .interface-element-card-background-stretch {
  background: linear-gradient(#1d1027, #0d0714) !important;
}
html.${ON_CLASS} .interface-element-active-card-background,
html.${ON_CLASS} .interface-element-active-card-background-stretch {
  background: linear-gradient(#5a2a6e, #2a1036) !important;
}
html.${ON_CLASS} .interface-element-active-card-border-image {
  border-image: none !important;
  border-color: transparent !important;
  background: linear-gradient(#5a2a6e, #2a1036) !important;
  box-shadow: inset 0 0 0 1px rgba(230, 95, 210, .55);
}
/* tło siatki slotów w torbie (osobna warstwa pod przedmiotami) */
html.${ON_CLASS} .interface-element-item-slot-grid-stretch {
  filter: sepia(.5) hue-rotate(230deg) saturate(1.6) brightness(.75);
}
/* suwaki */
html.${ON_CLASS} .scrollbar-wrapper .track { background: rgba(5, 2, 10, .6) !important; }
html.${ON_CLASS} .scrollbar-wrapper .handle {
  background: linear-gradient(90deg, #5a2a6e, #a24bb8, #5a2a6e) !important;
  box-shadow: 0 0 4px rgba(230, 95, 210, .6);
}
`;

  let styleEl = null;
  const inject = () => {
    if (styleEl) return;
    const text = css(A);
    styleEl = typeof GM_addStyle === 'function' ? GM_addStyle(text) : null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.textContent = text;
      (document.head || document.documentElement).appendChild(styleEl);
    }
    if (styleEl) styleEl.id = 'cdz-theme-style';
  };

  const enabled = () => GM_getValue(KEY, true);
  const apply = () => {
    inject();
    document.documentElement.classList.toggle(ON_CLASS, enabled());
  };

  const toggle = () => {
    GM_setValue(KEY, !enabled());
    apply();
  };

  apply();
  GM_registerMenuCommand('Czarna Dziura: włącz / wyłącz', toggle);
  // Ctrl+Alt+B – szybkie włączanie/wyłączanie (inne motywy używają G, D, L)
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.altKey && !e.shiftKey && e.code === 'KeyB') {
      e.preventDefault();
      toggle();
    }
  }, true);

  console.info(`[Czarna Dziura] v${VERSION} ${enabled() ? 'włączony' : 'wyłączony'}`);
})();
