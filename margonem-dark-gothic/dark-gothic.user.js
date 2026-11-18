// ==UserScript==
// @name         Margonem – Dark Gothic Theme
// @namespace    https://github.com/Harkryn/Dodatki
// @version      1.0.0
// @description  Mroczny gotycki motyw interfejsu Margonem: kute żelazo, czaszki, poczerniałe srebro i zaschnięta krew. Tylko wygląd – bez zmian w logice gry.
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

  // Każda reguła jest pod html.dg-on i wewnątrz .game-window-positioner,
  // więc wyłączenie motywu = zdjęcie jednej klasy, a strony poza grą (forum itp.) są nietknięte.
  const R = 'html.' + ON_CLASS + ' .game-window-positioner';

  const css = `
html.${ON_CLASS} {
  --dg-bg0: #0b0b0d;
  --dg-bg1: #141012;
  --dg-blood: #3a0508;
  --dg-bordo: #5a0a0f;
  --dg-red: #8b0000;
  --dg-bone: #d8cfc0;
  --dg-silver: #8a8a90;
  --dg-iron: #2a2628;
  --dg-tex: url("${A}panel-bg.webp");
  --dg-frame: url("${A}frame.webp");
  --dg-rim: 0 0 0 1px #050506, 0 0 0 2px #4a4a50, 0 0 0 3px #0b0b0d;
}

/* ───────────── Okna z ramką (.border-window) ───────────── */
${R} .border-window:not(.transparent) {
  border-image: var(--dg-frame) 36 / 18px / 0 round;
  background: var(--dg-tex) repeat, var(--dg-bg1);
  /* tekstura także pod kratą ramki – inaczej w górnym pasie (32px) prześwituje mapa */
  background-clip: border-box;
  background-origin: border-box;
  box-shadow: 0 6px 18px rgba(0,0,0,.75);
  color: var(--dg-bone);
}

${R} .border-window:not(.transparent) > .content {
  background: rgba(11, 11, 13, .55);
  color: var(--dg-bone);
  box-shadow: inset 0 0 0 1px rgba(138,138,144,.18), inset 0 0 24px rgba(0,0,0,.8);
}
${R} .border-window .content a { color: #c9a227; }

/* nagłówek okna */
${R} .border-window .header-label-positioner .header-label {
  background: linear-gradient(#5a0a0f, #3a0508 55%, #1a0305);
  box-shadow: inset 0 1px 0 #8a8a90, inset 0 2px 0 #1a1a1c, inset 0 -1px 0 #8a8a90, inset 0 -2px 0 #0b0b0d, 0 2px 6px rgba(0,0,0,.7);
}
${R} .border-window .header-label-positioner .header-label .text {
  color: var(--dg-bone);
  font-family: Georgia, "Times New Roman", serif;
  font-variant: small-caps;
  letter-spacing: .06em;
  text-shadow: 0 1px 2px #000, 0 0 6px rgba(139,0,0,.6);
}
${R} .border-window:not(.transparent) .header-label-positioner .header-label .left-decor,
${R} .border-window:not(.transparent) .header-label-positioner .header-label .right-decor {
  background: url("${A}separator.webp") no-repeat;
  background-size: 120px auto;
}
${R} .border-window:not(.transparent) .header-label-positioner .header-label .left-decor { background-position: 0 50%; }
${R} .border-window:not(.transparent) .header-label-positioner .header-label .right-decor { background-position: 100% 50%; }

/* przycisk zamknięcia – zakrwawione żelazo */
${R} .border-window:not(.transparent) .close-button-corner-decor { background: none; }
${R} .border-window:not(.transparent) .close-button-corner-decor .close-button {
  filter: grayscale(1) sepia(1) hue-rotate(-50deg) saturate(4) brightness(.75);
}
${R} .border-window:not(.transparent) .close-button-corner-decor .close-button:hover { filter: grayscale(1) sepia(1) hue-rotate(-50deg) saturate(5) brightness(1); }

/* okna przezroczyste (śledzone questy, sorter…) */
${R} .border-window.transparent .border-image {
  background: rgba(11, 11, 13, .82);
  box-shadow: 0 0 0 1px #050506, 0 0 0 2px rgba(138,138,144,.55), 0 0 0 3px #0b0b0d, inset 0 0 18px rgba(90,10,15,.45);
}
${R} .border-window.transparent .header-label-positioner .header-label .text { color: var(--dg-bone); }

/* ───────────── Zakładki (okna, czat) ───────────── */
${R} .tabs-nav .card,
${R} .chat-channel-card {
  background-image: linear-gradient(#1c1719, #0e0b0c);
  color: #8a8a90;
  box-shadow: inset 0 0 0 1px #2e2a2c;
}
${R} .tabs-nav .card.active,
${R} .chat-channel-card.active {
  background-image: linear-gradient(#6b0d13, #3a0508);
  color: var(--dg-bone);
  box-shadow: inset 0 0 0 1px #8a8a90, inset 0 0 8px rgba(0,0,0,.6);
}

/* ───────────── Przyciski ───────────── */
/* border-width: 0 + jawna border-image-width → oprawa rysuje się na przycisku, nie zmieniając jego układu */
${R} .button {
  border-style: solid;
  border-width: 0;
  border-image: url("${A}button.webp") 28 60 / 6px 14px / 0 stretch;
  box-shadow: none;
}
${R} .button:hover { border-image-source: url("${A}button-hover.webp"); }
/* przycisk domyślny (zielony w grze) → bordowa skóra w żelaznej oprawie */
${R} .button.green,
${R} .button:not(.red):not(.blue):not(.violet):not(.purple):not(.orange):not(.blink-violet):not(.transparent):not(.pressed) {
  background-color: var(--dg-bg0);
  background-image: linear-gradient(#5a0a0f, #2a0406);
}
${R} .button.green:hover { background-image: linear-gradient(#7d1017, #3a0508); }
/* pozostałe kolory zachowują znaczenie (czerwony = uwaga, niebieski, fiolet…), tylko ciemniej */
${R} .button.red { background-image: linear-gradient(#a3161b, #4a0709); }
${R} .button.transparent { background-image: linear-gradient(#2e2a2c, #0e0b0c); }
${R} .button::before { box-shadow: inset 0 0 0 1px rgba(216,207,192,.18); }
${R} .button .label { color: var(--dg-bone); text-shadow: 0 1px 2px #000; }

/* przyciski paska HUD (kwadratowe ikony) */
${R} .widget-button.green {
  background-image: linear-gradient(#4a0a0f, #160304);
}
${R} .widget-button {
  box-shadow: inset 0 0 0 1px #8a8a90, inset 0 0 0 3px #0b0b0d, inset 0 0 10px rgba(0,0,0,.7);
}
${R} .widget-button::before { box-shadow: inset 0 0 0 1px rgba(216,207,192,.22); }
${R} .widget-button:hover { filter: brightness(1.18); }

/* ───────────── Górna i dolna belka ───────────── */
${R} .top.positioner > .bg,
${R} .bottom.positioner > .bg {
  background: linear-gradient(rgba(58,5,8,.35), rgba(11,11,13,.2)), var(--dg-tex) repeat, var(--dg-bg0);
  box-sizing: border-box;
  border-style: solid;
  border-image: var(--dg-frame) 36 / 0 / 0 round;
}
${R} .top.positioner > .bg { border-width: 0 0 10px; border-image-width: 0 0 10px 0; }
${R} .bottom.positioner > .bg { border-width: 10px 0 0; border-image-width: 10px 0 0 0; }

/* ───────────── Boczne kolumny ───────────── */
${R} .layer.interface-layer .main-column {
  background: linear-gradient(rgba(11,11,13,.35), rgba(11,11,13,.35)), var(--dg-tex) repeat, var(--dg-bg0);
}
${R} .layer.interface-layer .main-column > .border {
  background: none;
  box-sizing: border-box;
  border-style: solid;
  border-width: 0 0 0 10px;
  border-image: var(--dg-frame) 36 / 0 0 0 10px / 0 round;
}
${R} .left-column .new-chat-window,
${R} .left-column .chat-input-wrapper { background: transparent; }
${R} .left-column .chat-channel-card-wrapper {
  background: linear-gradient(rgba(58,5,8,.35), transparent);
  box-shadow: inset 0 -1px 0 rgba(138,138,144,.25);
}
${R} .left-column .chat-input-wrapper {
  background: rgba(11,11,13,.75);
  box-shadow: inset 0 1px 0 rgba(138,138,144,.3);
}
${R} .left-column .magic-input-wrapper { background: rgba(0,0,0,.45); }

/* ───────────── Ekwipunek, sloty, torby ───────────── */
${R} .interface-element-item-slot-grid-stretch { filter: brightness(.62) sepia(.35) hue-rotate(-28deg) saturate(1.3); }
${R} .interface-element-grid-border {
  outline-color: #050506;
  box-shadow: 0 0 0 1px #4a4a50, 0 0 0 2px #1a0305, 0 0 0 3px #5a0a0f;
}
${R} .interface-element-one-black-tile { background: linear-gradient(#1c1719, #0b0b0d); }
${R} .interface-element-one-item-slot-2 {
  background: #141012;
  border-color: #3a0508;
  outline-color: #0b0b0d;
}
${R} .interface-element-background-color-3,
${R} .interface-element-middle-3-background,
${R} .interface-element-middle-3-background-stretch {
  background: rgba(20,16,18,.92);
}
${R} .interface-element-background-color-1,
${R} .interface-element-middle-1-background,
${R} .interface-element-middle-1-background-stretch {
  background: var(--dg-tex) repeat, var(--dg-bg1);
}
${R} .interface-element-box-shadow-2 { box-shadow: inset 0 0 0 1px #3a0508, inset 0 0 14px #000; }
${R} .interface-element-active-card-background-stretch,
${R} .interface-element-active-card-border-image {
  border-image: none;
  background: linear-gradient(#5a0a0f, #3a0508);
  box-shadow: inset 0 1px 0 rgba(216,207,192,.35), inset 0 -1px 0 #0b0b0d;
}
${R} .interface-element-line-1-background { background: linear-gradient(90deg, transparent, #8a8a90 30%, #d8cfc0 50%, #8a8a90 70%, transparent); }

/* ───────────── Paski postępu / EXP ───────────── */
${R} .interface-element-progress-bar-1,
${R} .interface-element-progress-bar-0 { background: #0b0b0d; box-shadow: inset 0 0 0 1px #3a3a40; }
${R} .interface-element-progress-bar-0 .inner,
${R} .interface-element-progress-bar-1 .inner {
  background: linear-gradient(#b3141c 0%, #8b0000 65%, #5a0a0f 66%);
  border-color: #b3141c;
}
${R} .interface-element-progress-bar-0 .value,
${R} .interface-element-progress-bar-1 .value { color: #f1ebe0; }
/* pasek EXP w dolnym panelu: karmazyn zamiast pomarańczu (bez EXP zostaje srebrny) */
${R} .bottom-panel-of-bottom-positioner .exp-bar-wrapper .exp-progress .progress .inner {
  background: linear-gradient(#0f0f0f 0%, #c0262d 25%, #8b0000 60%, #0f0f0f 100%);
}
${R} .bottom-panel-of-bottom-positioner .exp-bar-wrapper .exp-progress .progress.noexp .inner {
  background: linear-gradient(#0f0f0f 0%, #8a8a90 25%, #8a8a90 60%, #0f0f0f 100%);
}

/* ───────────── Tooltipy przedmiotów ───────────── */
${R} .tip-wrapper.normal-tip {
  border: 9px solid transparent;
  border-image: var(--dg-frame) 36 / 9px / 0 round;
  background: var(--dg-tex) repeat, var(--dg-bg0);
  background-clip: padding-box;
  box-shadow: 0 6px 16px rgba(0,0,0,.85);
}
${R} .tip-wrapper.normal-tip > .content { background: rgba(11,11,13,.82); }
${R} .tip-wrapper .item-head {
  background: linear-gradient(rgba(90,10,15,.55), rgba(58,5,8,.15));
  box-shadow: inset 0 -1px 0 rgba(138,138,144,.3);
}
${R} .tip-wrapper .item-tip-section { border-color: rgba(138,138,144,.28) !important; }

/* ───────────── Dialog z NPC ───────────── */
${R} .dialogue-window .border-image {
  border: 18px solid transparent;
  border-image: var(--dg-frame) 36 / 18px / 0 round;
  background: var(--dg-tex) repeat, var(--dg-bg0);
  background-clip: padding-box;
  box-shadow: 0 8px 22px rgba(0,0,0,.85);
  inset: -12px;
}
/* duże kute narożniki z czaszką na górnych rogach dialogu (przykrywają małe czaszki z 9-slice) */
${R} .dialogue-window .border-image::before,
${R} .dialogue-window .border-image::after {
  content: "";
  position: absolute;
  top: -24px;
  width: 72px; height: 72px;
  background: url("${A}corner-skull.webp") 0 0 / 100% 100% no-repeat;
  pointer-events: none;
  filter: drop-shadow(0 2px 2px rgba(0,0,0,.8));
}
${R} .dialogue-window .border-image::before { left: -24px; }
${R} .dialogue-window .border-image::after { right: -24px; transform: scaleX(-1); }
${R} .dialogue-window .dialogue-background-color { background: rgba(11,11,13,.72); }
${R} .dialogue-window .content .npc-message { color: var(--dg-bone); }

/* ───────────── Scrollbary ───────────── */
${R} .scrollbar-wrapper .track { background: rgba(0,0,0,.35); box-shadow: inset 0 0 0 1px rgba(138,138,144,.15); }
${R} .scrollbar-wrapper .handle { background: linear-gradient(90deg, #5a0a0f, #8b0000, #5a0a0f); box-shadow: 0 0 0 1px #0b0b0d; }
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
