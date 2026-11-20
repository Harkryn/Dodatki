// ==UserScript==
// @name         Margonem – Czarna Dziura
// @namespace    https://github.com/Harkryn/Dodatki
// @author       Harkryn
// @version      1.2.1
// @description  Mroczny motyw interfejsu Margonem w barwach czarnej dziury: głęboka czerń, popiel i przygaszona śliwka. Tylko wygląd – bez zmian w logice gry i mapie.
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

  const VERSION = '1.2.1';
  // Grafiki: assets/czarna-dziura/ w repo, serwowane przez jsDelivr spod tagu wersji
  // (tag czarna-dziura-X.Y.Z), żeby po aktualizacji CDN nie podawał starych plików z cache @main.
  const A = `https://cdn.jsdelivr.net/gh/Harkryn/Dodatki@czarna-dziura-${VERSION}/assets/czarna-dziura`;
  const ON_CLASS = 'cdz-on';
  const KEY = 'cdz-enabled';

  const css = (A) => `
:root {
  --cdz-bg: #040305;
  --cdz-panel: rgba(7, 6, 9, .94);
  --cdz-plum: #3a2238;
  --cdz-mauve: #6a3d63;
  --cdz-glow: rgba(120, 50, 105, .22);
  --cdz-line: rgba(95, 65, 90, .4);
  --cdz-text: #cfc7cc;
  --cdz-title: #d8ccd3;
  --cdz-tex: url("${A}/panel-bg.webp");
  --cdz-haze: radial-gradient(ellipse 90% 55% at 50% 0%, rgba(70, 30, 65, .16), transparent 70%);
}

/* ===== Okna (zwykłe) ===== */
html.${ON_CLASS} .border-window:not(.transparent):not(.tip-window) {
  border-image: url("${A}/frame.webp") 16 / 16px / 0 stretch !important;
  background: var(--cdz-haze), var(--cdz-tex), var(--cdz-bg) !important;
  background-clip: border-box !important;
  box-shadow: 0 0 0 1px #000, 0 0 14px var(--cdz-glow), 0 8px 26px rgba(0, 0, 0, .9);
}
html.${ON_CLASS} .border-window:not(.transparent):not(.tip-window) > .content {
  background: transparent !important;
  color: var(--cdz-text);
}
/* nagłówek okna: tabliczka 9-slice z outsetem (rysuje się poza elementem, układ okna bez zmian) */
html.${ON_CLASS} .border-window:not(.transparent):not(.tip-window) .header-label-positioner .header-label {
  background: none !important;
  border-style: solid !important;
  border-width: 0 !important;
  border-image: url("${A}/title-plate.webp") 30 80 30 80 fill / 9px 30px 9px 30px / 7px 30px 5px 30px stretch !important;
  box-shadow: none !important;
}
html.${ON_CLASS} .border-window:not(.transparent):not(.tip-window) .header-label-positioner .header-label .text {
  color: var(--cdz-title) !important;
  text-shadow: 0 1px 2px #000, 0 0 4px rgba(0, 0, 0, .9) !important;
}
/* boczne ozdobniki nagłówka gry – ukryte */
html.${ON_CLASS} .border-window:not(.transparent):not(.tip-window) .header-label-positioner .header-label .left-decor,
html.${ON_CLASS} .border-window:not(.transparent):not(.tip-window) .header-label-positioner .header-label .right-decor {
  background: none !important;
}
/* przycisk zamknięcia: oryginalny „X”, przygaszony do grafitu */
html.${ON_CLASS} .border-window:not(.transparent):not(.tip-window) .close-button-corner-decor {
  filter: grayscale(.9) brightness(.7) contrast(1.1);
}
html.${ON_CLASS} .border-window:not(.transparent):not(.tip-window) .close-button-corner-decor .close-button:hover {
  filter: brightness(1.4);
}
/* zakładki */
html.${ON_CLASS} .border-window .card {
  background-image: linear-gradient(#141015, #0a080b) !important;
  color: #8c8389 !important;
}
html.${ON_CLASS} .border-window .card.active {
  background-image: linear-gradient(#2a1a28, #150e15) !important;
  color: #e2d8dd !important;
  box-shadow: inset 0 -2px 0 var(--cdz-mauve);
}

/* ===== Okna przezroczyste (minimapa, obserwowane zadania) ===== */
html.${ON_CLASS} .border-window.transparent .border-image {
  background: rgba(5, 4, 6, .82);
  box-shadow: 0 0 0 1px #000, 0 0 0 2px rgba(80, 55, 76, .7), 0 0 0 3px #050405 !important;
}

/* ===== Okno dialogu NPC ===== */
html.${ON_CLASS} .dialogue-window .border-image {
  background: rgba(5, 4, 6, .86);
  box-shadow: 0 0 0 1px #000, 0 0 0 2px rgba(80, 55, 76, .75), 0 0 0 3px #050405, 0 0 14px var(--cdz-glow) !important;
}
html.${ON_CLASS} .dialogue-window .dialogue-background-color { background: rgba(5, 4, 6, .75) !important; }
html.${ON_CLASS} .dialogue-window .content .npc-dialogue-wrapper .h_content { color: var(--cdz-title) !important; }
html.${ON_CLASS} .dialogue-window .content .answers li { border-bottom-color: var(--cdz-line) !important; }
html.${ON_CLASS} .dialogue-window .content .answers li:hover { background: rgba(90, 50, 85, .22) !important; }

/* ===== Sklep ===== */
/* biało-zielona markiza → ciemne, popielate pasy */
html.${ON_CLASS} .shop-wrapper .shop-background .canopy {
  filter: grayscale(1) brightness(.32) contrast(1.15);
}
html.${ON_CLASS} .shop-wrapper .shop-background .paper-1,
html.${ON_CLASS} .shop-wrapper .shop-background .paper-2 {
  background: #0a080b !important;
  box-shadow: inset 0 0 6px #000, inset 0 0 0 1px rgba(70, 50, 68, .55) !important;
}
html.${ON_CLASS} .shop-wrapper .shop-content .items-grid .label { background: #0d0a0d !important; color: #b9afb5 !important; }
html.${ON_CLASS} .shop-wrapper .shop-content .shop-balance::after { background: var(--cdz-line) !important; }

/* ===== Przyciski ===== */
html.${ON_CLASS} .button.green:not(.background-gold):not(.background-draconite) {
  background: url("${A}/button.webp") center / 100% 100% no-repeat, #070608 !important;
  box-shadow: 0 0 0 1px #000 !important;
}
html.${ON_CLASS} .button.green:not(.background-gold):not(.background-draconite):not(.disable):not(.no-hover):hover {
  background-image: url("${A}/button-hover.webp") !important;
  box-shadow: 0 0 0 1px #000, 0 0 6px var(--cdz-glow) !important;
}
html.${ON_CLASS} .button.green::before { box-shadow: none !important; }
html.${ON_CLASS} .button.green .label { color: #ddd4d9 !important; text-shadow: 0 1px 2px #000; }
html.${ON_CLASS} .widget-button.green {
  background: url("${A}/widget.webp") center / 100% 100% no-repeat, #050405 !important;
  box-shadow: none !important;
}
html.${ON_CLASS} .widget-button.green::before { box-shadow: none !important; }
html.${ON_CLASS} .widget-button.green:not(.disabled):hover { background-image: url("${A}/widget-hover.webp") !important; }
html.${ON_CLASS} .widget-button.green.window-is-open::before { background-color: rgba(90, 50, 85, .18) !important; }

/* ===== Górny i dolny pasek interfejsu ===== */
html.${ON_CLASS} .interface-layer > .top.positioner > .bg {
  background: url("${A}/bar-top.webp") left bottom / auto 100% repeat-x, var(--cdz-bg) !important;
}
html.${ON_CLASS} .interface-layer > .bottom.positioner > .bg {
  background: url("${A}/bar-bottom.webp") left top / auto 100% repeat-x, var(--cdz-bg) !important;
}
html.${ON_CLASS} .interface-layer .bottom-panel-graphic,
html.${ON_CLASS} .interface-layer .hud-container {
  filter: grayscale(.75) brightness(.72) contrast(1.05);
}
/* ledwo widoczna, wolno pulsująca poświata wokół kuli HP (sama kula bez zmian) */
html.${ON_CLASS} .bottom-panel-of-bottom-positioner .glass {
  filter: drop-shadow(0 0 6px rgba(110, 40, 95, .45));
  animation: cdz-corona 5s ease-in-out infinite;
}
@keyframes cdz-corona {
  50% { filter: drop-shadow(0 0 9px rgba(130, 50, 110, .6)); }
}
@media (prefers-reduced-motion: reduce) {
  html.${ON_CLASS} .bottom-panel-of-bottom-positioner .glass { animation: none; }
}

/* ===== Ekran ładowania ===== */
html.${ON_CLASS} .layer.loader-layer {
  background: url("${A}/loading.webp") center / cover no-repeat, #000 !important;
}
html.${ON_CLASS} .layer.loader-layer .progress-bar .progress-bar-and-image-wrapper .inner-wrapper { background: #1a1219 !important; }
html.${ON_CLASS} .layer.loader-layer .progress-bar .progress-bar-and-image-wrapper .inner-wrapper .inner { background: #7a4670 !important; }

/* ===== Prawa kolumna (postać, ekwipunek, torby) ===== */
html.${ON_CLASS} .interface-layer > .right-column.main-column {
  background: url("${A}/column.webp") center top / 100% auto no-repeat, var(--cdz-tex), var(--cdz-bg) !important;
}
html.${ON_CLASS} .interface-layer > .right-column.main-column > .border {
  background: linear-gradient(to right, #020102, #140c13 35%, #4a2a45 50%, #140c13 65%, #020102) !important;
}
html.${ON_CLASS} .interface-element-grid-border,
html.${ON_CLASS} .interface-element-grid-border-light {
  outline-color: #050405 !important;
  box-shadow: 0 0 0 1px rgba(70, 50, 68, .8), 0 0 0 2px #0a080b, 0 0 0 3px rgba(50, 34, 48, .8) !important;
}
html.${ON_CLASS} .interface-layer .stats-wrapper { background-color: rgba(8, 7, 9, .94) !important; }
html.${ON_CLASS} .interface-layer .equipment-outline-2,
html.${ON_CLASS} .interface-layer .equipment-outline-3 { background-color: #2b222a !important; }

/* ===== Paski HP / EXP ===== */
html.${ON_CLASS} .interface-element-progress-bar-1 {
  background: #070608 !important;
  box-shadow: inset 0 0 0 1px rgba(70, 50, 68, .6);
}
html.${ON_CLASS} .interface-element-progress-bar-1 .inner {
  background: linear-gradient(#8e1a2a 70%, #66111e 70%) !important;
  border-color: #9c2434 !important;
}
html.${ON_CLASS} .interface-element-progress-bar-1.green .inner {
  background: linear-gradient(#6e3a68 70%, #4f284b 70%) !important;
  border-color: #7d4677 !important;
}
html.${ON_CLASS} .interface-element-progress-bar-1 .value { color: #eee6ea !important; }
/* dolny pasek doświadczenia: pomarańcz → przygaszona śliwka (kula HP zostaje czerwona) */
html.${ON_CLASS} .interface-layer .exp-bar-wrapper .exp-progress .progress .inner {
  filter: hue-rotate(280deg) saturate(.55) brightness(.7);
}

/* ===== Czat (lewa kolumna) ===== */
html.${ON_CLASS} .interface-layer > .left-column.main-column,
html.${ON_CLASS} .new-chat-window {
  background: url("${A}/column.webp") center top / 100% auto no-repeat, var(--cdz-tex), var(--cdz-bg) !important;
}
html.${ON_CLASS} .new-chat-window .chat-message-wrapper {
  border-top-color: var(--cdz-line) !important;
  border-bottom-color: var(--cdz-line) !important;
  box-shadow: inset 0 0 10px 3px #000 !important;
  background: rgba(3, 2, 4, .6) !important;
}
html.${ON_CLASS} .new-chat-window .chat-input-wrapper { background: linear-gradient(#0d0a0d, #040305) !important; }

/* ===== Dymki (tooltipy) ===== */
html.${ON_CLASS} .tip-wrapper .content { background-color: rgba(5, 4, 6, .96) !important; }
html.${ON_CLASS} .tip-wrapper .item-head { background-color: rgba(120, 90, 115, .08) !important; }
html.${ON_CLASS} .tip-wrapper:not([data-item-type]),
html.${ON_CLASS} .tip-wrapper[data-item-type="t-norm"] {
  box-shadow: 0 0 0 1px #000, 0 0 0 2px rgba(80, 55, 76, .75), 0 0 0 3px #050405 !important;
}
html.${ON_CLASS} .tip-wrapper .item-tip-section { border-bottom-color: var(--cdz-line) !important; }

/* ===== Wspólne elementy interfejsu (interface-element-*) ===== */
html.${ON_CLASS} .interface-element-bottom-bar-background,
html.${ON_CLASS} .interface-element-bottom-bar-background-stretch {
  border-image: none !important;
  border-color: transparent !important;
  background: url("${A}/separator.webp") top center / 100% 6px no-repeat, linear-gradient(#0e0b0e, #040305) !important;
}
html.${ON_CLASS} .interface-element-header-1-background,
html.${ON_CLASS} .interface-element-header-1-background-stretch,
html.${ON_CLASS} .interface-element-table-header-1-background {
  border-image: none !important;
  border-color: transparent !important;
  background: url("${A}/header.webp") center / 100% 100% no-repeat, #070608 !important;
}
html.${ON_CLASS} .interface-element-middle-1-background,
html.${ON_CLASS} .interface-element-middle-1-background-stretch,
html.${ON_CLASS} .interface-element-middle-3-background-stretch,
html.${ON_CLASS} .interface-element-middle-4-background {
  border-image: none !important;
  border-color: #0d0a0d !important;
  background-color: rgba(6, 5, 7, .9) !important;
  background-image: none !important;
  box-shadow: inset 0 0 0 1px rgba(70, 50, 68, .55), inset 0 0 14px rgba(0, 0, 0, .85);
}
html.${ON_CLASS} .interface-element-header-3,
html.${ON_CLASS} .interface-element-table-header-3-background {
  background: linear-gradient(90deg, #0c090c, #2a1c28 50%, #0c090c) !important;
  box-shadow: inset 0 -1px 0 rgba(95, 65, 90, .6);
}
html.${ON_CLASS} .interface-element-vertical-wood {
  background: linear-gradient(to right, #020102, #140c13 35%, #4a2a45 50%, #140c13 65%, #020102) !important;
}
html.${ON_CLASS} .interface-element-line-1-background {
  background: linear-gradient(90deg, transparent, rgba(110, 70, 100, .8) 50%, transparent) !important;
}
html.${ON_CLASS} .interface-element-background-color-1 { background: #0a080a !important; }
html.${ON_CLASS} .interface-element-background-color-3 { background: #0c0a0c !important; }
html.${ON_CLASS} .interface-element-wood-box-background {
  background: var(--cdz-haze), rgba(8, 7, 9, .96) !important;
  box-shadow: inset 0 0 0 1px rgba(70, 50, 68, .6);
}
html.${ON_CLASS} .interface-element-one-item-slot-2 {
  background: #0b090b !important;
  border-color: #2a2029 !important;
  outline-color: #0f0c0f !important;
}
html.${ON_CLASS} .interface-element-one-black-tile { background: linear-gradient(#151215, #0b090b) !important; }
html.${ON_CLASS} .interface-element-one-gray-tile { background: linear-gradient(#2e232c, #181217) !important; }
html.${ON_CLASS} .interface-element-card-background,
html.${ON_CLASS} .interface-element-card-background-stretch {
  background: linear-gradient(#141015, #0a080b) !important;
}
html.${ON_CLASS} .interface-element-active-card-background,
html.${ON_CLASS} .interface-element-active-card-background-stretch {
  background: linear-gradient(#2a1a28, #150e15) !important;
}
html.${ON_CLASS} .interface-element-active-card-border-image {
  border-image: none !important;
  border-color: transparent !important;
  background: linear-gradient(#2a1a28, #150e15) !important;
  box-shadow: inset 0 0 0 1px rgba(95, 65, 90, .6);
}
/* sloty torby i ekwipunku (osobna warstwa pod przedmiotami) */
html.${ON_CLASS} .interface-element-item-slot-grid-stretch,
html.${ON_CLASS} .interface-element-one-item-slot-background-to-repeat {
  background-image: url("${A}/slot.webp") !important;
}
/* suwaki */
html.${ON_CLASS} .scrollbar-wrapper .track { background: rgba(3, 2, 4, .7) !important; }
html.${ON_CLASS} .scrollbar-wrapper .handle {
  background: linear-gradient(90deg, #241a23, #4a3446, #241a23) !important;
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
