// ==UserScript==
// @name         Margonem Forum – Nowy Wygląd
// @namespace    margonem-forum-modern
// @version      1.4.1
// @description  Wygląd forum Margonem w stylu strony głównej – tryb Klasyczny (drewno, pergamin) lub Bloodmoon (czerń i karmazyn). Zmienia wyłącznie wygląd – wszystkie funkcje forum działają jak dotąd.
// @match        https://forum.margonem.pl/*
// @noframes
// @run-at       document-start
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @updateURL    https://raw.githubusercontent.com/Harkryn/Dodatki/main/margonem-forum-modern/margonem-forum-modern.user.js
// @downloadURL  https://raw.githubusercontent.com/Harkryn/Dodatki/main/margonem-forum-modern/margonem-forum-modern.user.js
// @supportURL   https://github.com/Harkryn/Dodatki
// ==/UserScript==

/*
 * Zasady działania:
 *  - Wszystkie style są ograniczone klasą `mfm` na <html>; po wyłączeniu motywu
 *    klasa, arkusz i dodane elementy znikają, a forum wraca do oryginału bez odświeżania.
 *  - Skrypt nie usuwa, nie klonuje i nie przenosi elementów forum. Jedyne zmiany DOM:
 *      * meta viewport (żeby układ mobilny działał na telefonach),
 *      * pasek nawigacji jak na stronie głównej (zwykłe linki do www.margonem.pl),
 *      * owinięcie tekstowych znaczników typu "[przybity]" w <span> (tekst bez zmian),
 *      * atrybuty data-* na numerach stron (tekst linków bez zmian),
 *      * tabindex/role na elementach klikalnych bez dostępu z klawiatury.
 *  - Grafiki (tło z miasteczkiem, małe logo) są wczytywane ze strony głównej www.margonem.pl
 *    jak zwykłe obrazki; faktura pergaminu jest wbudowana. Bez grafik motyw nadal wygląda spójnie.
 *  - Tryb Bloodmoon (przełącznik w menu Tampermonkey) odwzorowuje motyw strony głównej z dodatku
 *    BloodMoon; jego tło jest wczytywane z nitheme.pl (to samo, którego używa ten motyw).
 *    W tym trybie zbyt ciemne kolory tekstu w postach dostają jaśniejszy odpowiednik (tylko wygląd).
 *  - @noframes: skrypt nie działa w forum osadzonym w grze (iframe).
 *  - Skrypt nie wysyła żadnych danych i niczego nie zbiera.
 */

(function () {
  'use strict';

  const STORE_KEY = 'mfm-enabled';
  const STYLE_ID = 'mfm-style';
  const META_ID = 'mfm-viewport';
  const NAV_ID = 'mfm-topnav';
  const ROOT_CLASS = 'mfm';
  const HOME = 'https://www.margonem.pl';

  const CSS = String.raw`
/* =========================================================
   Tokeny – wartości odczytane ze strony głównej Margonem
   ========================================================= */
html.mfm {
  /* tła */
  --mfm-bg: #1d130c;                /* .background-logged-wrapper */
  --mfm-bg-deep: #100e0a;           /* body strony głównej */
  --mfm-box-dark: #180a00;          /* .brown-box */
  --mfm-parch: #d3b37c;             /* .light-brown-box */
  --mfm-parch-dark: #b8955c;
  --mfm-header-img: url("https://www.margonem.pl/_i/pl/WebsiteJumbotron/fall23/header.webp");
  --mfm-logo-small: url("https://www.margonem.pl/_i/pl/logo-small-1x.webp");
  --mfm-header-h: 528px;            /* wysokość grafiki nagłówka */
  --mfm-top: 246px;                 /* gdzie zaczyna się treść = dół kamiennego pasa */

  /* tekst i akcenty */
  --mfm-gold: #dfcaa2;
  --mfm-gold-soft: #ebddc7;
  --mfm-gold-line: #dec395;
  --mfm-ink: #000;
  --mfm-ink-soft: #2e1f10;
  --mfm-ink-muted: #4e3a24;
  --mfm-link-parch: #000;
  --mfm-link-parch-hover: #7a1f00;
  --mfm-red: #9b0f0f;
  --mfm-rust: #b9320a;

  /* przyciski (c-btn i przyciski cookies ze strony głównej) */
  --mfm-btn-green: rgba(23, 99, 0, .7);
  --mfm-btn-green-hover: rgba(35, 130, 0, .85);
  --mfm-btn-green-line: rgba(35, 150, 0, .7);
  --mfm-btn-brown: linear-gradient(#5f4535 40%, #483428 80%);
  --mfm-btn-brown-line: rgba(105, 76, 58, .9);

  /* pola formularzy jak na stronie głównej */
  --mfm-input-bg: rgba(0, 0, 0, .5);
  --mfm-input-line: rgba(255, 255, 255, .25);
  --mfm-input-shadow: inset 0 3px 6px #000;

  --mfm-focus: #f0b429;
  --mfm-line-dark: rgba(0, 0, 0, .35);
  --mfm-line-light: rgba(255, 255, 255, .12);

  --mfm-font: Arimo, Arial, "Helvetica Neue", Helvetica, sans-serif;
  --mfm-fs: 14px;
  --mfm-fs-sm: 13px;
  --mfm-fs-xs: 12px;

  --mfm-s1: 4px;
  --mfm-s2: 8px;
  --mfm-s3: 12px;
  --mfm-s4: 16px;
  --mfm-s5: 23px;
  --mfm-s6: 32px;

  --mfm-r: 3px;                     /* promień pudełek na stronie głównej */
  --mfm-r-btn: 5px;
  --mfm-r-nav: 16px;

  /* cienie pudełek ze strony głównej */
  --mfm-shadow-parch: inset 0 0 3px rgba(255, 255, 255, .35), inset 0 0 25px 8px rgba(98, 74, 33, .9), 0 0 8px 2px #000;
  --mfm-shadow-parch-soft: inset 0 0 3px rgba(255, 255, 255, .35), inset 0 0 18px 4px rgba(98, 74, 33, .7), 0 0 6px 1px rgba(0, 0, 0, .85);
  --mfm-shadow-dark: inset 0 0 3px rgba(255, 255, 255, .2), inset 0 0 25px 8px rgba(24, 10, 0, .6), 0 0 8px 2px #000;
  --mfm-gold-rule: linear-gradient(to right, rgba(200, 175, 133, 0) 2%, var(--mfm-gold-line) 30%, var(--mfm-gold-line) 70%, rgba(200, 175, 133, 0) 98%);
  --mfm-nav-grad: linear-gradient(to right, rgba(24, 40, 9, .85) 0%, rgba(44, 70, 19, .85) 50%, rgba(24, 40, 9, .85) 100%);

  /* faktura pergaminu/drewna – ta sama co na stronie głównej */
  --mfm-noise: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAMAAAAp4XiDAAAAUVBMVEWFhYWDg4N3d3dtbW17e3t1dXWBgYGHh4d5eXlzc3OLi4ubm5uVlZWPj4+NjY19fX2JiYl/f39ra2uRkZGZmZlpaWmXl5dvb29xcXGTk5NnZ2c8TV1mAAAAG3RSTlNAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEAvEOwtAAAFVklEQVR4XpWWB67c2BUFb3g557T/hRo9/WUMZHlgr4Bg8Z4qQgQJlHI4A8SzFVrapvmTF9O7dmYRFZ60YiBhJRCgh1FYhiLAmdvX0CzTOpNE77ME0Zty/nWWzchDtiqrmQDeuv3powQ5ta2eN0FY0InkqDD73lT9c9lEzwUNqgFHs9VQce3TVClFCQrSTfOiYkVJQBmpbq2L6iZavPnAPcoU0dSw0SUTqz/GtrGuXfbyyBniKykOWQWGqwwMA7QiYAxi+IlPdqo+hYHnUt5ZPfnsHJyNiDtnpJyayNBkF6cWoYGAMY92U2hXHF/C1M8uP/ZtYdiuj26UdAdQQSXQErwSOMzt/XWRWAz5GuSBIkwG1H3FabJ2OsUOUhGC6tK4EMtJO0ttC6IBD3kM0ve0tJwMdSfjZo+EEISaeTr9P3wYrGjXqyC1krcKdhMpxEnt5JetoulscpyzhXN5FRpuPHvbeQaKxFAEB6EN+cYN6xD7RYGpXpNndMmZgM5Dcs3YSNFDHUo2LGfZuukSWyUYirJAdYbF3MfqEKmjM+I2EfhA94iG3L7uKrR+GdWD73ydlIB+6hgref1QTlmgmbM3/LeX5GI1Ux1RWpgxpLuZ2+I+IjzZ8wqE4nilvQdkUdfhzI5QDWy+kw5Wgg2pGpeEVeCCA7b85BO3F9DzxB3cdqvBzWcmzbyMiqhzuYqtHRVG2y4x+KOlnyqla8AoWWpuBoYRxzXrfKuILl6SfiWCbjxoZJUaCBj1CjH7GIaDbc9kqBY3W/Rgjda1iqQcOJu2WW+76pZC9QG7M00dffe9hNnseupFL53r8F7YHSwJWUKP2q+k7RdsxyOB11n0xtOvnW4irMMFNV4H0uqwS5ExsmP9AxbDTc9JwgneAT5vTiUSm1E7BSflSt3bfa1tv8Di3R8n3Af7MNWzs49hmauE2wP+ttrq+AsWpFG2awvsuOqbipWHgtuvuaAE+A1Z/7gC9hesnr+7wqCwG8c5yAg3AL1fm8T9AZtp/bbJGwl1pNrE7RuOX7PeMRUERVaPpEs+yqeoSmuOlokqw49pgomjLeh7icHNlG19yjs6XXOMedYm5xH2YxpV2tc0Ro2jJfxC50ApuxGob7lMsxfTbeUv07TyYxpeLucEH1gNd4IKH2LAg5TdVhlCafZvpskfncCfx8pOhJzd76bJWeYFnFciwcYfubRc12Ip/ppIhA1/mSZ/RxjFDrJC5xifFjJpY2Xl5zXdguFqYyTR1zSp1Y9p+tktDYYSNflcxI0iyO4TPBdlRcpeqjK/piF5bklq77VSEaA+z8qmJTFzIWiitbnzR794USKBUaT0NTEsVjZqLaFVqJoPN9ODG70IPbfBHKK+/q/AWR0tJzYHRULOa4MP+W/HfGadZUbfw177G7j/OGbIs8TahLyynl4X4RinF793Oz+BU0saXtUHrVBFT/DnA3ctNPoGbs4hRIjTok8i+algT1lTHi4SxFvONKNrgQFAq2/gFnWMXgwffgYMJpiKYkmW3tTg3ZQ9Jq+f8XN+A5eeUKHWvJWJ2sgJ1Sop+wwhqFVijqWaJhwtD8MNlSBeWNNWTa5Z5kPZw5+LbVT99wqTdx29lMUH4OIG/D86ruKEauBjvH5xy6um/Sfj7ei6UUVk4AIl3MyD4MSSTOFgSwsH/QJWaQ5as7ZcmgBZkzjjU1UrQ74ci1gWBCSGHtuV1H2mhSnO3Wp/3fEV5a+4wz//6qy8JxjZsmxxy5+4w9CDNJY09T072iKG0EnOS0arEYgXqYnXcYHwjTtUNAcMelOd4xpkoqiTYICWFq0JSiPfPDQdnt+4/wuqcXY47QILbgAAAABJRU5ErkJggg==");

  --mfm-max: 1240px;
  --mfm-user-col: 168px;

  color-scheme: dark;
  -webkit-text-size-adjust: 100%;
  text-size-adjust: 100%;
}

/* =========================================================
   Tło strony – grafika nagłówka strony głównej (miasteczko + kamienny pas)
   ========================================================= */
html.mfm,
html.mfm body {
  background-color: var(--mfm-bg) !important;
}
html.mfm body {
  background-image: var(--mfm-header-img) !important;
  background-repeat: no-repeat !important;
  background-position: 50% calc(var(--mfm-top) - var(--mfm-header-h)) !important;
  background-size: auto !important;
  margin: 0 var(--mfm-s4) !important;
  /* czarny jak w oryginale: luźny tekst serwera pod stopką ("AND grp=0") ma zostać niewidoczny;
     wszystkie elementy forum mają własne kolory */
  color: #000;
  font-family: var(--mfm-font);
}

/* Ozdoby starej ramki (bez funkcji) */
html.mfm #side-left,
html.mfm #ornlu, html.mfm #ornld, html.mfm #ornru, html.mfm #ornrd,
html.mfm #ornbl, html.mfm #ornbr {
  display: none !important;
}

/* =========================================================
   Pasek nawigacji jak na stronie głównej
   ========================================================= */
#mfm-topnav {
  display: none;
}
html.mfm #mfm-topnav {
  display: flex;
  align-items: center;
  gap: var(--mfm-s2);
  max-width: var(--mfm-max);
  height: 64px;
  margin: 12px auto 0;
  padding: 0 var(--mfm-s5);
  background: var(--mfm-nav-grad);
  border-radius: var(--mfm-r-nav);
  box-shadow: 0 4px 18px rgba(0, 0, 0, .55), inset 0 1px 0 rgba(255, 255, 255, .08);
  font: 700 18px/1 var(--mfm-font);
  position: relative;
  z-index: 5;
  -webkit-backdrop-filter: blur(4px);
  backdrop-filter: blur(4px);
}
html.mfm #mfm-topnav a {
  color: #ecebe4;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  height: 40px;
  padding: 0 14px;
  border-radius: 8px;
  white-space: nowrap;
}
html.mfm #mfm-topnav a:hover { background: rgba(255, 255, 255, .1); color: #fff; }
html.mfm #mfm-topnav a[aria-current="page"] { background: rgba(0, 0, 0, .28); color: var(--mfm-gold); }
html.mfm #mfm-topnav .mfm-topnav__logo {
  padding: 0 10px 0 0;
  margin-right: var(--mfm-s3);
}
html.mfm #mfm-topnav .mfm-topnav__logo:hover { background: none; }
html.mfm #mfm-topnav .mfm-topnav__logo img {
  display: block;
  height: 28px;
  width: auto;
  color: var(--mfm-gold);            /* tekst alt, gdy grafika się nie wczyta */
  font: 700 20px/28px var(--mfm-font);
}
html.mfm #mfm-topnav ul {
  display: flex;
  align-items: center;
  gap: 4px;
  list-style: none;
  margin: 0;
  padding: 0;
  min-width: 0;
  overflow-x: auto;
  scrollbar-width: none;
}
html.mfm #mfm-topnav ul::-webkit-scrollbar { display: none; }

/* =========================================================
   Rama strony (stara tabela .main) – przezroczysta, nad grafiką
   ========================================================= */
html.mfm table.main {
  max-width: var(--mfm-max);
  margin: 0 auto;
  font-family: var(--mfm-font);
  border-collapse: separate;
  border-spacing: 0;
}
html.mfm table.main > tbody > tr > td.ver,
html.mfm table.main > tbody > tr > td.tdhide {
  background: none !important;
  width: 0 !important;
  padding: 0 !important;
  font-size: 0 !important;
  line-height: 0 !important;
}
/* pusty pasek menu – ta sama kolumna co treść, więc bez zerowania szerokości */
html.mfm table.main td[style*="menuback.png"] {
  background: none !important;
  padding: 0 !important;
  font-size: 0 !important;
  line-height: 0 !important;
}
html.mfm table.main > tbody > tr > td.hor {
  background: none !important;
  height: 0 !important;
  font-size: 0 !important;
  line-height: 0 !important;
}
html.mfm table.main > tbody > tr:last-child > td.hor {
  background: var(--mfm-gold-rule) !important;
  height: 1px !important;
  opacity: .5;
}

/* Duże logo forum nad miasteczkiem (dalej jest linkiem do strony głównej) */
html.mfm td.logo {
  background: none !important;
  height: calc(var(--mfm-top) - 76px) !important;
  vertical-align: middle;
  padding: 0 var(--mfm-s4) !important;
}
html.mfm td.logo a {
  display: block !important;
  width: auto !important;
  max-width: 100% !important;
  height: auto !important;
}
html.mfm td.logo img {
  width: 100% !important;
  max-width: 640px !important;
  height: auto !important;
  margin: 0 auto !important;
  display: block;
  filter: drop-shadow(0 3px 6px rgba(0, 0, 0, .9)) drop-shadow(0 0 18px rgba(0, 0, 0, .55));
}
html.mfm td.logo .firefly1, html.mfm td.logo .firefly2, html.mfm td.logo .firefly3 { display: none; }

/* Główny panel – ciemne pudełko jak .brown-box */
html.mfm #paper {
  width: 100% !important;
  table-layout: fixed;
  background: var(--mfm-box-dark) var(--mfm-noise) !important;
  border-collapse: separate !important;
  border-spacing: 0;
  border-radius: var(--mfm-r);
  box-shadow: var(--mfm-shadow-dark);
  color: var(--mfm-gold-soft);
  margin: 0 0 var(--mfm-s5);
  height: auto;
  min-height: 60vh;
}
html.mfm #paper > tbody > tr > td[style*="paper_0"] {
  background: none !important;
  height: 0 !important;
  padding: 0 !important;
}
html.mfm #paper > tbody > tr > td:first-child:not(:only-child),
html.mfm #paper > tbody > tr > td:last-child:not(:only-child) {
  width: 0 !important;
}
html.mfm #mainbox {
  padding: var(--mfm-s5) !important;
  font-size: var(--mfm-fs);
  line-height: 1.5;
}

/* Stopka */
html.mfm #footer {
  background: transparent !important;
  color: #9c8a70 !important;
  height: auto !important;
  padding: var(--mfm-s3) 0 var(--mfm-s5);
  font: var(--mfm-fs-xs)/1.6 var(--mfm-font) !important;
}
html.mfm #footer a { color: var(--mfm-gold) !important; }

/* =========================================================
   Typografia na ciemnym panelu
   ========================================================= */
html.mfm #forum {
  font-family: var(--mfm-font);
  color: var(--mfm-gold-soft);
}
html.mfm #forum a { color: var(--mfm-gold); text-decoration: none; }
html.mfm #forum a:hover { color: #fff; text-decoration: underline; text-underline-offset: 2px; }

html.mfm #forum h2 {
  font: 700 22px/1.3 var(--mfm-font);
  color: var(--mfm-gold);
  margin: 0 0 var(--mfm-s4) !important;
  padding-bottom: var(--mfm-s3);
  background: var(--mfm-gold-rule) no-repeat left bottom / 100% 1px;
  overflow-wrap: anywhere;
}
html.mfm #forum h2 > a { color: #fff; }
html.mfm #forum h2 > a:hover { color: var(--mfm-gold); }
html.mfm #forum h2[style*="font-size:80%"] {
  font-size: var(--mfm-fs-sm) !important;
  font-weight: 700;
  color: var(--mfm-gold-soft);
  margin-top: var(--mfm-s5) !important;
  padding: var(--mfm-s3) 0 0;
  background: var(--mfm-gold-rule) no-repeat left top / 100% 1px;
}
html.mfm #forum h2 > span[style*="font-size"] {
  font-size: var(--mfm-fs-xs) !important;
  font-weight: 700;
  color: var(--mfm-gold-soft);
  background: rgba(0, 0, 0, .45);
  border: 1px solid var(--mfm-input-line);
  border-radius: 999px;
  padding: 2px 9px;
  vertical-align: middle;
  white-space: nowrap;
}
/* Kremowa tabliczka "Forum" gryzie się z ciemnym motywem; nazwę forum pokazuje pasek nawigacji */
html.mfm #forum > center > img[src*="forum-title"] { display: none; }

/* =========================================================
   Przyciski i kontrolki
   ========================================================= */
html.mfm #forum .addbutton,
html.mfm #forum center > a[href*="show=topics"][href*="&p="],
html.mfm #forum > center > a[href^="javascript:history"] {
  display: inline-flex;
  align-items: center;
  margin: 0 0 var(--mfm-s2) var(--mfm-s2) !important;
  padding: 8px 16px;
  border-radius: var(--mfm-r-btn);
  background: var(--mfm-btn-green);
  border: 1px solid var(--mfm-btn-green-line);
  color: var(--mfm-gold) !important;
  font: 700 var(--mfm-fs)/1.2 var(--mfm-font);
  text-decoration: none !important;
  white-space: nowrap;
}
html.mfm #forum .addbutton:hover,
html.mfm #forum center > a[href*="show=topics"][href*="&p="]:hover,
html.mfm #forum > center > a[href^="javascript:history"]:hover {
  background: var(--mfm-btn-green-hover);
  color: #fff !important;
}
html.mfm #forum center > a[href*="show=topics"][href*="&p="] { margin: var(--mfm-s4) var(--mfm-s1) 0 !important; }

html.mfm #forum input[type="submit"],
html.mfm #forum input[type="button"],
html.mfm #forum input[type="reset"],
html.mfm #forum button:not([rollover]):not([style*="url("]):not(#votebut),
html.mfm .cfgbox button:not([rollover]):not([style*="url("]),
html.mfm #alert button {
  font: 700 var(--mfm-fs)/1.2 var(--mfm-font);
  color: var(--mfm-gold);
  background: var(--mfm-btn-brown);
  border: 1px solid var(--mfm-btn-brown-line);
  border-radius: var(--mfm-r-btn);
  padding: 8px 16px;
  min-height: 34px;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, .6);
}
html.mfm #forum input[type="submit"],
html.mfm .cfgbox button:first-of-type:not([rollover]):not([style*="url("]),
html.mfm #forum .cfgbox button:first-of-type:not([rollover]):not([style*="url("]):not(#votebut) {
  background: var(--mfm-btn-green);
  border-color: var(--mfm-btn-green-line);
}
html.mfm #forum input[type="submit"]:hover,
html.mfm .cfgbox button:first-of-type:not([rollover]):not([style*="url("]):hover,
html.mfm #forum .cfgbox button:first-of-type:not([rollover]):not([style*="url("]):not(#votebut):hover {
  background: var(--mfm-btn-green-hover);
  color: #fff;
}
html.mfm #forum input[type="button"]:hover,
html.mfm #forum input[type="reset"]:hover,
html.mfm #forum button:not([rollover]):not([style*="url("]):not(#votebut):hover,
html.mfm .cfgbox button:not([rollover]):not([style*="url("]):hover,
html.mfm #alert button:hover {
  filter: brightness(1.2);
  color: #fff;
}
html.mfm #forum input[type="submit"]:active,
html.mfm #forum button:active { transform: translateY(1px); }
html.mfm #forum input:disabled,
html.mfm #forum button:disabled { opacity: .5; cursor: not-allowed; }

html.mfm #forum input[type="text"],
html.mfm #forum input[type="search"],
html.mfm #forum input[type="number"],
html.mfm #forum input[type="email"],
html.mfm #forum input[type="password"],
html.mfm #forum input:not([type]),
html.mfm #forum select,
html.mfm #forum textarea,
html.mfm .cfgbox textarea,
html.mfm .cfgbox input[type="text"] {
  font: var(--mfm-fs)/1.45 var(--mfm-font);
  color: #fff;
  background: var(--mfm-input-bg);
  border: 1px solid var(--mfm-input-line);
  border-radius: var(--mfm-r-btn);
  padding: 8px 10px;
  max-width: 100%;
  box-shadow: var(--mfm-input-shadow);
}
html.mfm #forum select option { background: #241910; color: #fff; }
html.mfm #forum textarea,
html.mfm .cfgbox textarea {
  min-height: 6em;
  resize: vertical;
}
html.mfm #forum input::placeholder,
html.mfm #forum textarea::placeholder { color: rgba(255, 255, 255, .45); }
html.mfm #forum input[type="text"]:focus,
html.mfm #forum input:not([type]):focus,
html.mfm #forum select:focus,
html.mfm #forum textarea:focus,
html.mfm .cfgbox textarea:focus {
  border-color: var(--mfm-gold);
  box-shadow: var(--mfm-input-shadow), 0 0 0 2px rgba(223, 202, 162, .35);
  outline: none;
}
html.mfm #forum input[type="checkbox"],
html.mfm #forum input[type="radio"] {
  accent-color: #2f8a0c;
  width: 16px;
  height: 16px;
  vertical-align: middle;
}

/* Widoczny fokus klawiatury */
html.mfm :focus-visible {
  outline: 3px solid var(--mfm-focus) !important;
  outline-offset: 2px;
  border-radius: var(--mfm-r);
}

/* Klikalne napisy bez wyglądu przycisku, np. [Przeszukaj temat] */
html.mfm #forum span[onclick] {
  display: inline-block;
  font: 700 var(--mfm-fs-sm)/1.2 var(--mfm-font);
  color: var(--mfm-gold);
  background: var(--mfm-btn-brown);
  border: 1px solid var(--mfm-btn-brown-line);
  border-radius: var(--mfm-r-btn);
  padding: 6px 12px;
  margin: 0 var(--mfm-s1) var(--mfm-s2) 0;
  cursor: pointer;
  user-select: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, .6);
}
html.mfm #forum span[onclick]:hover { filter: brightness(1.2); color: #fff; }

/* =========================================================
   Strona główna forum – działy jako pergaminowe pudełka
   ========================================================= */
html.mfm #forum .ncatg {
  width: 100% !important;
  max-width: none !important;
  table-layout: auto !important;
  border-collapse: separate !important;
  border-spacing: 0;
}
html.mfm #forum .ncatg col { width: auto !important; }
html.mfm #forum .ncatg tr.ncatbar { background: none !important; }
html.mfm #forum .ncatg tr.ncatbar > th {
  background: none !important;
  height: auto !important;
  width: auto !important;
  padding: 0 !important;
}
html.mfm #forum .ncatg tr.ncatbar > th:first-child,
html.mfm #forum .ncatg tr.ncatbar > th:last-child { display: none; }
html.mfm #forum .ncatg tr.ncatbar > th:nth-child(2) {
  font: 700 22px/1.3 var(--mfm-font) !important;
  color: var(--mfm-gold) !important;
  text-align: left !important;
  padding: var(--mfm-s5) 0 var(--mfm-s3) !important;
  background: var(--mfm-gold-rule) no-repeat left bottom / 100% 1px !important;
}
html.mfm #forum .ncatg tr.ncatbar:first-child > th:nth-child(2) { padding-top: 0 !important; }
html.mfm #forum .ncatg tr:not(.ncatbar) > td {
  display: grid !important;
  /* serwer układa działy parami w wierszach tabeli */
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--mfm-s4);
  padding: var(--mfm-s4) 0 0 !important;
}
html.mfm #forum .ncatg td > div[onclick] {
  float: none !important;
  width: auto !important;
  height: auto !important;
  margin: 0 !important;
  position: relative;
  min-width: 0;
  background: var(--mfm-parch) var(--mfm-noise) !important;
  border-radius: var(--mfm-r);
  box-shadow: var(--mfm-shadow-parch-soft);
  color: var(--mfm-ink);
}
html.mfm #forum .ncatg td > div[onclick]:hover {
  box-shadow: var(--mfm-shadow-parch-soft), 0 0 0 2px rgba(223, 202, 162, .55);
  filter: brightness(1.05);
}
html.mfm #forum .ncatg td > div[onclick]:focus-within {
  outline: 3px solid var(--mfm-focus);
  outline-offset: 2px;
}
html.mfm #forum .ncatg td > div[onclick] > div {
  position: static !important;
  width: auto !important;
  margin: 0 !important;
  display: flex;
  align-items: center;
  gap: var(--mfm-s4);
  padding: var(--mfm-s4) var(--mfm-s5);
  min-height: 84px;
}
html.mfm #forum .ncatg td > div[onclick] > div > div:first-child {
  float: none !important;
  flex: 0 0 auto;
  border-radius: var(--mfm-r);
  box-shadow: 0 0 0 1px rgba(0, 0, 0, .55), 0 2px 5px rgba(0, 0, 0, .45);
  overflow: hidden;
}
html.mfm #forum .ncatg td > div[onclick] > div > div:nth-child(2) {
  margin: 0 !important;
  width: auto !important;
  min-width: 0;
  flex: 1 1 auto;
}
html.mfm #forum .ncatg td > div[onclick] > div > div:nth-child(2) > div {
  height: auto !important;
  text-align: left !important;
}
html.mfm #forum .ncatg td > div[onclick] > div > div:nth-child(2) > div:first-child a {
  font: 700 19px/1.25 var(--mfm-font);
  color: var(--mfm-ink) !important;
}
html.mfm #forum .ncatg td > div[onclick] > div > div:nth-child(2) > div:first-child {
  padding-bottom: 6px;
  margin-bottom: 6px;
  border-bottom: 1px solid rgba(0, 0, 0, .55);
}
html.mfm #forum .ncatg td > div[onclick] small,
html.mfm #forum .ncatg td > div[onclick] small a {
  display: block;
  font: italic var(--mfm-fs-sm)/1.4 var(--mfm-font) !important;
  color: var(--mfm-ink-soft) !important;
}
html.mfm #forum .ncatg td > div[onclick] a:hover { text-decoration: underline !important; color: var(--mfm-link-parch-hover) !important; }

/* =========================================================
   Lista działów w widoku listy ("Przełącz wygląd forum", po zalogowaniu)
   Klasy z oryginalnego forum.css: .catg (tabela), .catbar (nagłówek grupy), .cat2 (licznik).
   ========================================================= */
html.mfm #forum table.catg {
  width: 100% !important;
  border-collapse: separate !important;
  border-spacing: 0;
  background: var(--mfm-parch) var(--mfm-noise);
  border-radius: var(--mfm-r);
  overflow: hidden;
  box-shadow: var(--mfm-shadow-parch);
  margin-top: var(--mfm-s2);
}
html.mfm #forum table.catg tr.catbar,
html.mfm #forum table.catg tr.catbar > th {
  background: none !important;
}
html.mfm #forum table.catg tr.catbar {
  background: var(--mfm-box-dark) var(--mfm-noise) !important;
}
html.mfm #forum table.catg tr.catbar > th {
  height: auto !important;
  padding: 11px var(--mfm-s5) !important;
  border: 0 !important;
  border-bottom: 1px solid #000 !important;
  font: 700 17px/1.3 var(--mfm-font) !important;
  color: var(--mfm-gold) !important;
  text-align: left !important;
  text-shadow: 0 1px 2px #000;
}
/* ozdobne końcówki paska (puste komórki z obrazkiem) */
html.mfm #forum table.catg tr.catbar > th:empty {
  padding: 0 !important;
  width: 0 !important;
}
html.mfm #forum table.catg tr.catbar:not(:first-child) > th {
  border-top: 2px solid #000 !important;
}
html.mfm #forum table.catg td {
  border: 0 !important;
  border-top: 1px solid rgba(0, 0, 0, .28) !important;
  padding: 10px var(--mfm-s3) !important;
  color: var(--mfm-ink) !important;
  font: 400 var(--mfm-fs)/1.35 var(--mfm-font);
  vertical-align: middle;
  overflow-wrap: anywhere;
}
html.mfm #forum table.catg td:first-child { padding-left: var(--mfm-s5) !important; }
html.mfm #forum table.catg tr.catbar + tr > td { border-top: 0 !important; }
html.mfm #forum table.catg tr:not(.catbar):hover > td { background-color: rgba(255, 255, 255, .16); }
html.mfm #forum table.catg td a {
  color: var(--mfm-link-parch) !important;
  font-weight: 700;
  font-size: 15px;
}
html.mfm #forum table.catg td a:hover { color: var(--mfm-link-parch-hover) !important; }
/* wymagania działu "(lvl: 40, rep: 15, ...)" i opis */
html.mfm #forum table.catg td span {
  color: var(--mfm-ink-muted) !important;
  font-size: var(--mfm-fs-xs) !important;
  font-weight: 700;
}
html.mfm #forum table.catg td small,
html.mfm #forum table.catg td small * {
  display: block;
  margin-top: 2px;
  color: var(--mfm-ink-soft) !important;
  font: italic var(--mfm-fs-xs)/1.4 var(--mfm-font) !important;
}
html.mfm #forum table.catg td img {
  vertical-align: middle;
  margin-right: 6px;
  filter: drop-shadow(0 1px 1px rgba(0, 0, 0, .5));
}
/* licznik tematów */
html.mfm #forum table.catg td.cat2 {
  width: 90px;
  padding-left: var(--mfm-s3) !important;
  text-align: center;
  font: 700 15px/1 var(--mfm-font);
  font-variant-numeric: tabular-nums;
  border-left: 1px solid rgba(0, 0, 0, .2) !important;
}

/* =========================================================
   Lista tematów – pergaminowe pudełko
   ========================================================= */
html.mfm #forum table.topics {
  border-collapse: separate !important;
  border-spacing: 0;
  background: var(--mfm-parch) var(--mfm-noise);
  border-radius: var(--mfm-r);
  overflow: hidden;
  box-shadow: var(--mfm-shadow-parch);
  margin-top: var(--mfm-s2);
}
html.mfm #forum table.topics > tbody > tr:first-child {
  background: var(--mfm-box-dark) var(--mfm-noise) !important;
  height: auto !important;
}
html.mfm #forum table.topics > tbody > tr:first-child > th {
  background: none !important;
  color: var(--mfm-gold) !important;
  font: 700 var(--mfm-fs-sm)/1 var(--mfm-font);
  letter-spacing: .05em;
  text-transform: uppercase;
  height: 42px !important;
  padding: 0 var(--mfm-s3) !important;
  border-bottom: 1px solid #000;
}
html.mfm #forum table.topics > tbody > tr:first-child > th:first-child,
html.mfm #forum table.topics > tbody > tr:first-child > th:last-child {
  width: 1px !important;
  padding: 0 !important;
}
html.mfm #forum table.topics > tbody > tr:first-child > th:nth-child(2) { text-align: left; padding-left: var(--mfm-s5) !important; }
html.mfm #forum table.topics > tbody > tr:first-child > th:nth-child(3) { width: 84px !important; }
html.mfm #forum table.topics > tbody > tr:first-child > th:nth-child(4) { width: 150px !important; }
html.mfm #forum table.topics > tbody > tr:first-child > th:nth-child(5) { width: 170px !important; }

html.mfm #forum table.topics td {
  border: 0 !important;
  border-top: 1px solid rgba(0, 0, 0, .28) !important;
  padding: 11px var(--mfm-s3) !important;
  font-size: var(--mfm-fs-sm);
  color: var(--mfm-ink);
  vertical-align: middle;
}
html.mfm #forum table.topics > tbody > tr:nth-child(2) > td { border-top: 0 !important; }
html.mfm #forum table.topics tr:hover { background: transparent; }
html.mfm #forum table.topics > tbody > tr:not(:first-child):hover > td { background-color: rgba(255, 255, 255, .16); }
html.mfm #forum table.topics td.topname {
  text-align: left;
  font-size: var(--mfm-fs);
  line-height: 1.35;
  padding-left: var(--mfm-s5) !important;
  overflow-wrap: anywhere;
}
html.mfm #forum table.topics td a { color: var(--mfm-link-parch); }
html.mfm #forum table.topics td.topname > a:not([title]) {
  color: var(--mfm-link-parch);
  font-weight: 700;
  font-size: 15px;
}
html.mfm #forum table.topics td.topname > a:not([title]):hover { color: var(--mfm-link-parch-hover); }
html.mfm #forum table.topics td.topname > a:not([title]):visited { color: #3d2a17; }
html.mfm #forum table.topics td.topname small {
  display: block;
  font: italic var(--mfm-fs-xs)/1.4 var(--mfm-font) !important;
  color: var(--mfm-ink-muted);
  margin-top: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
html.mfm #forum table.topics td:not(.topname) small {
  display: block;
  font-size: var(--mfm-fs-xs) !important;
  line-height: 1.4;
  color: var(--mfm-ink-soft);
  overflow-wrap: anywhere;
}
html.mfm #forum table.topics td:not(.topname) { font-variant-numeric: tabular-nums; }
html.mfm #forum table.topics > tbody > tr > td:nth-child(2) { font-weight: 700; font-size: 15px; }

/* Tematy przypięte */
html.mfm #forum table.topics tr.sticky { background: transparent !important; }
html.mfm #forum table.topics tr.sticky > td { background-color: rgba(98, 74, 33, .2); }
html.mfm #forum table.topics tr.sticky > td.topname { box-shadow: inset 4px 0 0 #6b3d0e; }
html.mfm #forum table.topics tr.sticky + tr:not(.sticky) > td { border-top: 2px solid rgba(0, 0, 0, .55) !important; }

/* Link do ostatniej strony tematu */
html.mfm #forum table.topics td.topname a[title="Ostatnia strona"] {
  display: inline-block;
  font: 700 var(--mfm-fs-xs)/18px var(--mfm-font);
  margin-left: 6px;
  padding: 0 8px;
  border-radius: var(--mfm-r-btn);
  background: var(--mfm-box-dark);
  color: var(--mfm-gold);
  vertical-align: 1px;
}
html.mfm #forum table.topics td.topname a[title="Ostatnia strona"]:hover { color: #fff; text-decoration: none; }
html.mfm #forum table.topics td.topname a[title="Ostatnia strona"][data-mfm-page] { font-size: 0; }
html.mfm #forum table.topics td.topname a[title="Ostatnia strona"][data-mfm-page]::before {
  content: "str. " attr(data-mfm-page) " »";
  font-size: var(--mfm-fs-xs);
}

/* Znaczniki stanu tematu: [przybity], [zamknięty] itp. */
html.mfm .mfm-badge {
  display: inline-block;
  font-size: 0;
  line-height: 0;
  margin-right: 6px;
  vertical-align: 2px;
}
html.mfm .mfm-badge::before {
  content: attr(data-mfm-label);
  display: inline-block;
  font: 700 10.5px/1 var(--mfm-font);
  letter-spacing: .04em;
  text-transform: uppercase;
  padding: 4px 7px;
  border-radius: var(--mfm-r-btn);
  color: var(--mfm-gold);
  background: #3a2a1c;
}
html.mfm .mfm-badge[data-mfm-kind="pin"]::before { content: "📌 " attr(data-mfm-label); background: #1f5200; color: #f2e6c9; }
html.mfm .mfm-badge[data-mfm-kind="lock"]::before { content: "🔒 " attr(data-mfm-label); background: #3a2a1c; }

/* =========================================================
   Paginacja (na ciemnym panelu)
   ========================================================= */
html.mfm #forum .fpages {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  font-size: var(--mfm-fs-sm);
  color: var(--mfm-gold-soft);
  margin: var(--mfm-s2) 0 var(--mfm-s4) !important;
  text-align: right;
}
html.mfm #forum .fpages > a[href^="#"] {
  float: none !important;
  order: -1;
  margin-right: auto;
  font-weight: 700;
}
html.mfm #forum .fpages > a[data-mfm-page],
html.mfm #forum .fpages > b[data-mfm-page] {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 34px;
  height: 34px;
  padding: 0 8px;
  border-radius: var(--mfm-r-btn);
  font-size: 0;
  text-decoration: none !important;
}
html.mfm #forum .fpages > a[data-mfm-page]::before,
html.mfm #forum .fpages > b[data-mfm-page]::before {
  content: attr(data-mfm-page);
  font: 700 var(--mfm-fs-sm)/1 var(--mfm-font);
}
html.mfm #forum .fpages > a[data-mfm-page] {
  background: var(--mfm-input-bg);
  border: 1px solid var(--mfm-input-line);
  color: var(--mfm-gold);
}
html.mfm #forum .fpages > a[data-mfm-page]:hover { border-color: var(--mfm-gold); color: #fff; }
html.mfm #forum .fpages > b[data-mfm-page] {
  background: var(--mfm-btn-green);
  border: 1px solid var(--mfm-btn-green-line);
  color: var(--mfm-gold);
}

/* =========================================================
   Widok tematu
   ========================================================= */
html.mfm #forum #tsearch {
  border: 1px solid var(--mfm-input-line) !important;
  background: rgba(0, 0, 0, .35);
  border-radius: var(--mfm-r-btn);
  padding: var(--mfm-s3) !important;
  margin: var(--mfm-s1) 0 var(--mfm-s3) !important;
  font-size: var(--mfm-fs-sm);
}
html.mfm #forum #tsearch form { display: flex; flex-wrap: wrap; align-items: center; gap: var(--mfm-s2); margin-bottom: var(--mfm-s2); }
html.mfm #forum #tsearch form:last-of-type { margin-bottom: 0; }
html.mfm #forum #tsearch > br { display: none; }
html.mfm #forum #tsearch input[type="text"] { flex: 1 1 200px; width: auto !important; }

html.mfm #posts {
  width: 100%;
  table-layout: fixed;
  border-collapse: separate !important;
  border-spacing: 0;
}
html.mfm #posts > tbody > tr > td { border: 0 !important; }

/* Kolumna autora – ciemniejszy pergamin */
html.mfm #posts > tbody > tr > td.puser {
  width: var(--mfm-user-col) !important;
  padding: var(--mfm-s3) var(--mfm-s2) !important;
  background: linear-gradient(rgba(70, 45, 15, .3), rgba(70, 45, 15, .3)), var(--mfm-noise), var(--mfm-parch) !important;
  color: var(--mfm-ink) !important;
  border-radius: var(--mfm-r) 0 0 0;
  border-right: 1px solid rgba(0, 0, 0, .35) !important;
  box-shadow: inset 0 0 18px 2px rgba(98, 74, 33, .6);
  text-align: center;
  font-size: var(--mfm-fs-xs);
}

/* Nick – mała ciemna tabliczka */
html.mfm #posts .nickwood {
  width: auto !important;
  background: none !important;
  margin-bottom: var(--mfm-s2);
}
html.mfm #posts .nickwood b.fr1,
html.mfm #posts .nickwood b.fr2 { display: none !important; }
html.mfm #forum #posts .nickwood h3 {
  width: auto !important;
  background: var(--mfm-box-dark) var(--mfm-noise) !important;
  border-radius: var(--mfm-r);
  box-shadow: inset 0 0 3px rgba(255, 255, 255, .2), 0 1px 3px rgba(0, 0, 0, .6);
  font: 700 14px/1.25 var(--mfm-font);
  color: var(--mfm-gold);
  padding: 6px !important;
  overflow-wrap: anywhere;
}
html.mfm #forum #posts .nickwood h3:hover { color: #fff; }

/* Awatar – tło awatara (fback) wybrane przez gracza zostaje */
html.mfm #posts .puser center {
  width: 130px !important;
  max-width: 100%;
  margin: 0 auto;
  border-radius: var(--mfm-r);
  overflow: hidden;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, .7), 0 2px 6px rgba(0, 0, 0, .5);
}
html.mfm #posts .puser center > div[style*="frame_av"] {
  background: none !important;
  padding: var(--mfm-s2) 0;
}
html.mfm #posts .puser center b.fr1,
html.mfm #posts .puser center b.fr2 { display: none !important; }
html.mfm #posts .pavatar_new img { image-rendering: pixelated; }

/* Lvl / Rep / Posty – etykiety z CSS zamiast obrazka */
html.mfm #posts table.repbar {
  display: block;
  width: auto !important;
  height: auto !important;
  background: none !important;
  margin: var(--mfm-s2) auto var(--mfm-s1);
}
html.mfm #posts table.repbar > tbody {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 4px;
}
html.mfm #posts table.repbar > tbody > tr { display: contents; }
html.mfm #forum #posts table.repbar td {
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
  width: auto !important;
  padding: 2px 7px !important;
  border-radius: var(--mfm-r-btn);
  background: rgba(24, 10, 0, .88);
  font: 700 11.5px/1.4 var(--mfm-font);
  font-variant-numeric: tabular-nums;
  text-align: center;
  color: var(--mfm-gold-soft);
}
html.mfm #forum #posts table.repbar td:empty { display: none; }
html.mfm #forum #posts table.repbar td > span { padding: 0 !important; }
html.mfm #forum #posts table.repbar td::before {
  font-weight: 400;
  font-size: 10.5px;
  color: rgba(235, 221, 199, .7);
}
html.mfm #forum #posts table.repbar tr:nth-child(1) > td:nth-child(1)::before { content: "Lvl"; }
html.mfm #forum #posts table.repbar tr:nth-child(1) > td:nth-child(2)::before { content: "Rep"; }
html.mfm #forum #posts table.repbar tr:nth-child(2) > td:nth-child(2)::before { content: "Posty"; }
html.mfm #posts .puser > img { max-width: 100%; height: auto; margin-top: var(--mfm-s1); }
html.mfm #posts td.puser a { color: var(--mfm-ink); }

/* Treść posta – pergamin jak .light-brown-box */
html.mfm #posts > tbody > tr > td.pcont {
  background: var(--mfm-noise), var(--mfm-parch) !important;
  color: var(--mfm-ink);
  padding: var(--mfm-s4) var(--mfm-s5) !important;
  border-radius: 0 var(--mfm-r) 0 0;
  box-shadow: inset 0 0 3px rgba(255, 255, 255, .35), inset 0 0 22px 6px rgba(98, 74, 33, .75);
  font-size: 14.5px;
  line-height: 1.6;
  overflow-wrap: anywhere;
  word-break: normal;
  min-width: 0;
}
html.mfm #posts td.pcont[style*="color:#500"] { color: #500 !important; }
html.mfm #posts td.pcont a {
  color: var(--mfm-link-parch);
  font-weight: 700;
  text-decoration: underline;
  word-break: normal;
  overflow-wrap: anywhere;
}
html.mfm #posts td.pcont a:hover { color: var(--mfm-link-parch-hover); }
html.mfm #posts td.pcont img,
html.mfm #posts td.pcont video,
html.mfm #posts td.pcont iframe,
html.mfm #posts td.pcont embed,
html.mfm #posts td.pcont object {
  max-width: 100% !important;
  height: auto;
}
html.mfm #posts td.pcont iframe { aspect-ratio: 16 / 9; height: auto !important; }
html.mfm #posts td.pcont table {
  display: block;
  max-width: 100%;
  overflow-x: auto;
}
html.mfm #posts td.pcont pre,
html.mfm #forum code {
  max-width: 100%;
  overflow-x: auto;
  white-space: pre-wrap !important;
  overflow-wrap: anywhere;
  font: 13px/1.45 Consolas, "Cascadia Mono", "DejaVu Sans Mono", monospace !important;
  color: #f1e6cf;
  background: rgba(24, 10, 0, .9) !important;
  border: 0 !important;
  border-radius: var(--mfm-r);
  padding: var(--mfm-s2) var(--mfm-s3) !important;
  margin: var(--mfm-s2) 0;
}
html.mfm #forum blockquote {
  width: auto !important;
  max-width: 100%;
  margin: var(--mfm-s1) 0 var(--mfm-s3) !important;
  padding: var(--mfm-s2) var(--mfm-s3) !important;
  background: rgba(255, 244, 220, .32) !important;
  border: 0 !important;
  border-left: 3px solid #5a3a14 !important;
  border-radius: 0 var(--mfm-r) var(--mfm-r) 0;
  color: #1e140a;
  font-size: 14px;
  font-style: italic;
  overflow: auto;
  overflow-wrap: anywhere;
}
html.mfm #forum blockquote blockquote { background: rgba(98, 74, 33, .16) !important; }
html.mfm #posts td.pcont > b:has(+ br + blockquote),
html.mfm #posts td.pcont blockquote > b:has(+ br + blockquote) {
  display: inline-block;
  font-size: var(--mfm-fs-xs);
  color: var(--mfm-ink-muted);
  margin-top: 2px;
}
html.mfm #posts td.pcont br { line-height: 1.6em; }
html.mfm #forum hr {
  border: 0;
  height: 1px;
  background: rgba(0, 0, 0, .55);
  margin: var(--mfm-s3) 0;
}

/* Stopka posta: data (ciemne drewno) i akcje (ciemniejszy pergamin) */
html.mfm #posts > tbody > tr > td.postid {
  background: var(--mfm-box-dark) var(--mfm-noise) !important;
  color: var(--mfm-gold-soft) !important;
  border-radius: 0 0 0 var(--mfm-r);
  font-size: 11.5px !important;
  font-variant-numeric: tabular-nums;
  padding: var(--mfm-s2) !important;
  vertical-align: middle;
}
html.mfm #forum #posts > tbody > tr > td.pbar {
  background: linear-gradient(rgba(70, 45, 15, .32), rgba(70, 45, 15, .32)), var(--mfm-noise), var(--mfm-parch) !important;
  color: var(--mfm-ink-soft) !important;
  border-radius: 0 0 var(--mfm-r) 0;
  border-top: 1px solid rgba(0, 0, 0, .55) !important;
  font-size: var(--mfm-fs-xs) !important;
  line-height: 1.6;
  padding: 6px var(--mfm-s4) !important;
  vertical-align: middle;
}
html.mfm #forum #posts td.pbar a { color: var(--mfm-link-parch) !important; font-weight: 700; }
html.mfm #forum #posts td.pbar a:hover { color: var(--mfm-link-parch-hover) !important; }
html.mfm #posts .repgive { display: inline-flex; align-items: center; gap: 2px; flex-wrap: wrap; margin-right: var(--mfm-s3); }
html.mfm #posts .repgive img { border-radius: var(--mfm-r); padding: 2px; }
html.mfm #posts .repgive img:hover { background: rgba(255, 255, 255, .3); }
html.mfm #posts .repgive span[ctip] {
  font-weight: 700;
  color: var(--mfm-gold);
  background: var(--mfm-box-dark);
  border-radius: var(--mfm-r-btn);
  padding: 1px 7px;
  margin-right: 4px;
}

/* =========================================================
   Posty ekipy – wyraźne kolory rang
   Klasy nadaje forum: mod (Moderator albo Twórca Gry – rozróżnia je plakietka pod awatarem),
   smg (Twórca Gry, czerwona plakietka), zsp (Zarządca Świata Prywatnego),
   pns (Zasłużony emeryt), system (wiadomość systemowa).
   Komórki .puser/.postid/.pbar mają klasę rangi; .pcont dostaje kolor przez :has().
   ========================================================= */
html.mfm #posts td.mod,
html.mfm #posts tr:has(> td.puser.mod) > td.pcont {
  --mfm-role: #3b7ddd;        /* Moderator – niebieski */
  --mfm-role-dark: #0e2a55;
  --mfm-role-text: #dbe9ff;
}
html.mfm #posts tr:has(> td.puser.mod > img[src*="forum-mg-new"]) > td,
html.mfm #posts tr:has(> td.puser.mod > img[src*="forum-mg-new"]) + tr > td {
  --mfm-role: #1fa08b;        /* Twórca Gry (MG) – morski, jak plakietka */
  --mfm-role-dark: #063a33;
  --mfm-role-text: #d2fbf2;
}
html.mfm #posts td.smg,
html.mfm #posts tr:has(> td.puser.smg) > td.pcont {
  --mfm-role: #d23a2a;        /* SMG – czerwony */
  --mfm-role-dark: #430a06;
  --mfm-role-text: #ffd8cf;
}
html.mfm #posts td.zsp,
html.mfm #posts tr:has(> td.puser.zsp) > td.pcont {
  --mfm-role: #9a5fd6;        /* ZŚP – fioletowy */
  --mfm-role-dark: #2c1247;
  --mfm-role-text: #eedcff;
}
html.mfm #posts td.pns,
html.mfm #posts tr:has(> td.puser.pns) > td.pcont {
  --mfm-role: #c09440;        /* Zasłużony emeryt – brązowo-złoty */
  --mfm-role-dark: #3b2c0f;
  --mfm-role-text: #f8e7bf;
}
html.mfm #posts td.system,
html.mfm #posts tr:has(> td.puser.system) > td.pcont {
  --mfm-role: #7089a8;        /* Wiadomość systemowa – stalowy */
  --mfm-role-dark: #1a2533;
  --mfm-role-text: #e3ebf5;
}

/* Kolumna autora w kolorze rangi */
html.mfm #posts > tbody > tr > td.puser:is(.mod, .smg, .zsp, .pns, .system) {
  background: var(--mfm-noise), linear-gradient(180deg, var(--mfm-role) -40%, var(--mfm-role-dark) 70%) !important;
  color: var(--mfm-role-text) !important;
  border-top: 3px solid var(--mfm-role) !important;
  border-left: 3px solid var(--mfm-role) !important;
  border-right: 0 !important;
  box-shadow: inset 0 0 20px rgba(0, 0, 0, .45);
}
html.mfm #forum #posts > tbody > tr > td.puser:is(.mod, .smg, .zsp, .pns, .system) .nickwood h3 {
  background: rgba(0, 0, 0, .42) !important;
  border: 1px solid var(--mfm-role);
  color: #fff;
  text-shadow: 0 1px 2px #000;
}
html.mfm #posts > tbody > tr > td.puser:is(.mod, .smg, .zsp, .pns, .system) center {
  box-shadow: 0 0 0 2px var(--mfm-role), 0 2px 8px rgba(0, 0, 0, .6);
}
html.mfm #forum #posts > tbody > tr > td.puser:is(.mod, .smg, .zsp, .pns, .system) table.repbar td {
  background: rgba(0, 0, 0, .45);
  color: #fff;
}
html.mfm #posts > tbody > tr > td.puser:is(.mod, .smg, .zsp, .pns, .system) a { color: var(--mfm-role-text); }
/* Plakietka rangi pod awatarem (MODERATOR, TWÓRCA GRY, ...) */
html.mfm #posts > tbody > tr > td.puser > img {
  display: block;
  margin: var(--mfm-s2) auto 0;
  border-radius: var(--mfm-r);
  box-shadow: 0 0 0 1px var(--mfm-role, rgba(0, 0, 0, .6)), 0 2px 6px rgba(0, 0, 0, .6);
}

/* Treść: pergamin z odcieniem rangi i kolorową ramką */
html.mfm #posts > tbody > tr:has(> td.puser:is(.mod, .smg, .zsp, .pns, .system)) > td.pcont {
  background:
    linear-gradient(color-mix(in srgb, var(--mfm-role) 13%, transparent), color-mix(in srgb, var(--mfm-role) 13%, transparent)),
    var(--mfm-noise), var(--mfm-parch) !important;
  border-top: 3px solid var(--mfm-role) !important;
  border-right: 3px solid var(--mfm-role) !important;
}

/* Data i pasek akcji */
html.mfm #posts > tbody > tr > td.postid:is(.mod, .smg, .zsp, .pns, .system) {
  background: var(--mfm-noise), var(--mfm-role-dark) !important;
  color: var(--mfm-role-text) !important;
  border-left: 3px solid var(--mfm-role) !important;
  border-bottom: 3px solid var(--mfm-role) !important;
}
html.mfm #forum #posts > tbody > tr > td.pbar:is(.mod, .smg, .zsp, .pns, .system) {
  background:
    linear-gradient(color-mix(in srgb, var(--mfm-role) 24%, transparent), color-mix(in srgb, var(--mfm-role) 24%, transparent)),
    linear-gradient(rgba(70, 45, 15, .25), rgba(70, 45, 15, .25)),
    var(--mfm-noise), var(--mfm-parch) !important;
  border-top: 1px solid var(--mfm-role) !important;
  border-right: 3px solid var(--mfm-role) !important;
  border-bottom: 3px solid var(--mfm-role) !important;
}

/* =========================================================
   TRYB BLOODMOON – odwzorowanie strony głównej z motywem Krwawego Księżyca
   (czarne pudełka z gradientem radialnym, ciemnoczerwone obwódki, karmazynowe akcenty,
   biały tekst, beżowe linki). Włączany klasą .mfm-blood na <html>.
   ========================================================= */
html.mfm.mfm-blood {
  --mfm-bg: #0b0606;
  --mfm-box-dark: #0e0000;
  --mfm-parch: #0b0707;
  --mfm-noise: none;
  --mfm-header-img: url("https://nitheme.pl/graphs/BloodMoon/tlo.png");

  --mfm-gold: #f5f5dc;
  --mfm-gold-soft: #e9e4dc;
  --mfm-gold-line: #5a0d0b;
  --mfm-ink: #f1ece6;
  --mfm-ink-soft: #cfc6bd;
  --mfm-ink-muted: #a2968b;
  --mfm-link-parch: #f5f5dc;
  --mfm-link-parch-hover: #ff6070;
  --mfm-crimson: #dc143c;
  --mfm-blood-line: #370807;
  --mfm-blood-line-2: #3f0000;

  --mfm-btn-green: radial-gradient(circle, rgba(0, 0, 0, .9) 20%, rgba(120, 6, 18, .75) 100%);
  --mfm-btn-green-hover: radial-gradient(circle, rgba(0, 0, 0, .8) 10%, rgba(170, 10, 30, .85) 100%);
  --mfm-btn-green-line: #8b1020;
  --mfm-btn-brown: radial-gradient(circle, rgba(0, 0, 0, .9) 20%, rgba(33, 1, 0, .58) 100%);
  --mfm-btn-brown-line: #370807;

  --mfm-input-bg: rgba(0, 0, 0, .65);
  --mfm-input-line: #3a1512;
  --mfm-focus: #ff4d5e;

  --mfm-box-blood: radial-gradient(circle, rgba(0, 0, 0, .9) 20%, rgba(0, 0, 0, .11) 100%);
  --mfm-shadow-parch: inset 0 0 20px 1px #000, 0 2px 3px 1px rgba(0, 0, 0, .44), 0 0 0 1px var(--mfm-blood-line);
  --mfm-shadow-parch-soft: inset 0 0 20px 1px #000, 0 2px 3px 1px rgba(0, 0, 0, .44), 0 0 0 1px var(--mfm-blood-line);
  --mfm-shadow-dark: inset 0 0 20px 1px #000, 0 2px 3px 1px rgba(0, 0, 0, .44), 0 0 0 1px #161616;
  --mfm-nav-grad: #0e0000;

  --mfm-font: Ubuntu, "Segoe UI", Arimo, Arial, sans-serif;
}

/* Tło: grafika z motywu Bloodmoon, przypięta do okna */
html.mfm.mfm-blood body {
  background: var(--mfm-bg) var(--mfm-header-img) no-repeat 50% 0 / cover fixed !important;
}
html.mfm.mfm-blood #mfm-topnav {
  background: #0e0000;
  box-shadow: 0 0 15px -3px #290000, 0 0 1px 1px #232323;
  -webkit-backdrop-filter: none;
  backdrop-filter: none;
}
html.mfm.mfm-blood #mfm-topnav a { color: #f5f5dc; }
html.mfm.mfm-blood #mfm-topnav a:hover { background: rgba(220, 20, 60, .14); color: #fff; }
html.mfm.mfm-blood #mfm-topnav a[aria-current="page"] { background: rgba(63, 0, 0, .7); color: #fff; }
html.mfm.mfm-blood td.logo img { filter: drop-shadow(0 3px 6px #000) drop-shadow(0 0 22px rgba(120, 0, 0, .55)) saturate(.85); }

/* Panel główny i pudełka */
html.mfm.mfm-blood #paper {
  background: var(--mfm-box-blood) !important;
  border: 1px solid #161616;
  box-shadow: var(--mfm-shadow-dark);
}
html.mfm.mfm-blood #forum h2,
html.mfm.mfm-blood #forum .ncatg tr.ncatbar > th:nth-child(2) {
  color: #fff !important;
  font-weight: 300 !important;
  text-shadow: -3px 2px 2px #000;
}
html.mfm.mfm-blood #forum h2 > a { color: #f5f5dc; font-weight: 700; }
html.mfm.mfm-blood #forum h2 > a:hover { color: var(--mfm-crimson); }
html.mfm.mfm-blood #forum a:hover { color: #ff6070; }
html.mfm.mfm-blood #forum h2 > span[style*="font-size"] { border-color: var(--mfm-blood-line); background: rgba(0, 0, 0, .6); }

/* Karty działów */
html.mfm.mfm-blood #forum .ncatg td > div[onclick] {
  background: var(--mfm-box-blood) !important;
  border: 1px solid var(--mfm-blood-line);
}
html.mfm.mfm-blood #forum .ncatg td > div[onclick]:hover {
  border-color: var(--mfm-crimson);
  box-shadow: var(--mfm-shadow-parch-soft), 0 0 14px rgba(220, 20, 60, .35);
  filter: none;
}
html.mfm.mfm-blood #forum .ncatg td > div[onclick] > div > div:nth-child(2) > div:first-child { border-bottom-color: var(--mfm-blood-line-2); }
html.mfm.mfm-blood #forum .ncatg td > div[onclick] > div > div:nth-child(2) > div:first-child a { color: #f5f5dc !important; }
html.mfm.mfm-blood #forum .ncatg td > div[onclick] a:hover { color: #ff6070 !important; }

/* Lista tematów i lista działów */
html.mfm.mfm-blood #forum table.topics,
html.mfm.mfm-blood #forum table.catg {
  background: var(--mfm-box-blood);
}
html.mfm.mfm-blood #forum table.topics > tbody > tr:first-child,
html.mfm.mfm-blood #forum table.catg tr.catbar {
  background: #0e0000 !important;
}
html.mfm.mfm-blood #forum table.topics > tbody > tr:first-child > th,
html.mfm.mfm-blood #forum table.catg tr.catbar > th {
  border-bottom: 1px solid var(--mfm-blood-line-2) !important;
  color: #f5f5dc !important;
}
html.mfm.mfm-blood #forum table.topics td,
html.mfm.mfm-blood #forum table.catg td {
  border-top-color: rgba(90, 13, 11, .55) !important;
}
html.mfm.mfm-blood #forum table.topics > tbody > tr:not(:first-child):hover > td,
html.mfm.mfm-blood #forum table.catg tr:not(.catbar):hover > td { background-color: rgba(220, 20, 60, .07); }
html.mfm.mfm-blood #forum table.topics tr.sticky > td { background-color: rgba(63, 0, 0, .38); }
html.mfm.mfm-blood #forum table.topics tr.sticky > td.topname { box-shadow: inset 4px 0 0 var(--mfm-crimson); }
html.mfm.mfm-blood #forum table.topics tr.sticky + tr:not(.sticky) > td { border-top-color: var(--mfm-blood-line-2) !important; }
html.mfm.mfm-blood #forum table.topics td.topname > a:not([title]):visited { color: #cbbfae; }
html.mfm.mfm-blood #forum table.topics td.topname a[title="Ostatnia strona"] { background: rgba(63, 0, 0, .8); color: #f5f5dc; }
html.mfm.mfm-blood #forum table.catg td.cat2 { border-left-color: rgba(90, 13, 11, .55) !important; }
html.mfm.mfm-blood .mfm-badge[data-mfm-kind="pin"]::before { background: #8b0f1c; color: #fff; }
html.mfm.mfm-blood .mfm-badge[data-mfm-kind="lock"]::before,
html.mfm.mfm-blood .mfm-badge::before { background: #2a0806; color: #f5f5dc; }

/* Paginacja: bieżąca strona karmazynowa */
html.mfm.mfm-blood #forum .fpages > b[data-mfm-page] { border-color: var(--mfm-crimson); color: #fff; }

/* Posty */
/* posty zwykłych graczy; posty ekipy zachowują kolory rang (zob. wyżej) */
html.mfm.mfm-blood #posts > tbody > tr > td.puser:not(.mod, .smg, .zsp, .pns, .system) {
  background: linear-gradient(rgba(63, 0, 0, .28), rgba(0, 0, 0, .6)) !important;
  color: var(--mfm-ink) !important;
  border-right: 1px solid var(--mfm-blood-line) !important;
  box-shadow: inset 0 0 20px 1px #000, 0 0 0 1px var(--mfm-blood-line);
}
html.mfm.mfm-blood #forum #posts .nickwood h3 {
  background: rgba(14, 0, 0, .9) !important;
  border: 1px solid var(--mfm-blood-line);
  color: #f5f5dc;
}
html.mfm.mfm-blood #posts .puser:not(.mod, .smg, .zsp, .pns, .system) center { box-shadow: 0 0 0 1px var(--mfm-blood-line), 0 2px 6px #000; }
html.mfm.mfm-blood #forum #posts table.repbar td { background: rgba(14, 0, 0, .95); border: 1px solid var(--mfm-blood-line); }
html.mfm.mfm-blood #posts td.puser:not(.mod, .smg, .zsp, .pns, .system) a { color: #f5f5dc; }
html.mfm.mfm-blood #posts > tbody > tr > td.pcont {
  background: var(--mfm-box-blood) !important;
  color: var(--mfm-ink);
  box-shadow: inset 0 0 20px 1px #000, 0 0 0 1px var(--mfm-blood-line);
}
/* domyślny ciemnoczerwony kolor postów ekipy (#500) – czytelny wariant na czerni */
html.mfm.mfm-blood #posts td.pcont[style*="color:#500"] { color: #ff9a8c !important; }
html.mfm.mfm-blood #posts td.pcont a { color: #f5f5dc; }
html.mfm.mfm-blood #posts td.pcont a:hover { color: #ff6070; }
html.mfm.mfm-blood #forum blockquote {
  background: rgba(255, 255, 255, .045) !important;
  border-left-color: var(--mfm-crimson) !important;
  color: #ddd5cc;
}
html.mfm.mfm-blood #forum blockquote blockquote { background: rgba(63, 0, 0, .3) !important; }
html.mfm.mfm-blood #forum hr { background: var(--mfm-blood-line-2); }
html.mfm.mfm-blood #posts > tbody > tr > td.postid:not(.mod, .smg, .zsp, .pns, .system) {
  background: #0e0000 !important;
  color: var(--mfm-crimson) !important;
}
html.mfm.mfm-blood #forum #posts > tbody > tr > td.pbar:not(.mod, .smg, .zsp, .pns, .system) {
  background: radial-gradient(circle, rgba(0, 0, 0, .9) 20%, rgba(33, 1, 0, .58) 100%) !important;
  color: var(--mfm-ink-muted) !important;
  border-top-color: var(--mfm-blood-line) !important;
}
html.mfm.mfm-blood #posts .repgive span[ctip] { background: #2a0806; color: #f5f5dc; }
html.mfm.mfm-blood #posts .repgive img:hover { background: rgba(220, 20, 60, .25); }
/* kolory zbyt ciemne na czarnym tle – rozjaśniane przez skrypt (data-mfm-lc) */
html.mfm.mfm-blood [data-mfm-lc] { color: var(--mfm-lc) !important; }

/* Zasady, okna, komunikaty */
html.mfm.mfm-blood #forum .rules {
  background: var(--mfm-box-blood) !important;
  color: var(--mfm-ink) !important;
}
html.mfm.mfm-blood .cfgbox,
html.mfm.mfm-blood #vote,
html.mfm.mfm-blood #ajaxWait {
  background: radial-gradient(circle, rgba(0, 0, 0, .95) 30%, rgba(33, 1, 0, .92) 100%), #050202 !important;
  box-shadow: inset 0 0 20px 1px #000, 0 0 0 1px var(--mfm-blood-line), 0 10px 40px rgba(0, 0, 0, .8);
}
html.mfm.mfm-blood #alert {
  background: #0a0505 !important;
  color: var(--mfm-ink) !important;
  box-shadow: 0 0 0 1px var(--mfm-blood-line), 0 10px 40px rgba(0, 0, 0, .8);
}
html.mfm.mfm-blood #alert h3 { background: #0e0000 !important; color: #fff !important; border-bottom: 1px solid var(--mfm-blood-line-2); }
html.mfm.mfm-blood #msgbox { border-color: var(--mfm-crimson) !important; color: #fff !important; }
html.mfm.mfm-blood #footer { color: #8a7f76 !important; }
html.mfm.mfm-blood #footer a { color: #f5f5dc !important; }
html.mfm.mfm-blood table.main > tbody > tr:last-child > td.hor { opacity: 1; }

/* Odstęp między postami */
html.mfm #posts > tbody > tr.sepbar { background: none !important; height: var(--mfm-s4) !important; }
html.mfm #posts > tbody > tr.sepbar > td { background: none !important; padding: 0 !important; box-shadow: none !important; height: var(--mfm-s4) !important; }

/* =========================================================
   Komunikaty, zasady, okna dialogowe
   ========================================================= */
html.mfm #forum .msg,
html.mfm #forum center.msg,
html.mfm #paper h4,
html.mfm .topmsg {
  display: block;
  background: linear-gradient(#6e1414 40%, #4a0c0c 90%) !important;
  color: #ffe7a8 !important;
  border: 1px solid #a8341f !important;
  border-radius: var(--mfm-r);
  box-shadow: 0 0 8px 2px #000, inset 0 0 3px rgba(255, 255, 255, .2);
  padding: var(--mfm-s3) var(--mfm-s4) !important;
  margin: var(--mfm-s4) auto !important;
  max-width: 760px;
  text-align: center;
  font: 700 var(--mfm-fs)/1.5 var(--mfm-font);
}
html.mfm .topmsg_good {
  background: var(--mfm-btn-green) !important;
  border: 1px solid var(--mfm-btn-green-line) !important;
  color: var(--mfm-gold) !important;
  border-radius: var(--mfm-r);
  padding: var(--mfm-s3) var(--mfm-s4) !important;
}
html.mfm #forum .msg a, html.mfm .topmsg a { color: #fff !important; text-decoration: underline; }

html.mfm #forum > table:has(.rules) { width: 100%; border-spacing: var(--mfm-s2); }
html.mfm #forum .rules {
  background: var(--mfm-parch) var(--mfm-noise) !important;
  border: 0 !important;
  border-radius: var(--mfm-r);
  box-shadow: var(--mfm-shadow-parch);
  color: var(--mfm-ink) !important;
  padding: var(--mfm-s5) !important;
  margin: 0 0 var(--mfm-s3) !important;
  font-size: 14px !important;
  line-height: 1.6;
  overflow-wrap: anywhere;
}
html.mfm #forum .rules a { color: var(--mfm-link-parch); font-weight: 700; text-decoration: underline; }
html.mfm #forum .rules a:hover { color: var(--mfm-link-parch-hover); }

html.mfm .cfgbox,
html.mfm #vote {
  background: var(--mfm-box-dark) var(--mfm-noise) !important;
  color: var(--mfm-gold-soft) !important;
  border: 0 !important;
  border-radius: var(--mfm-r);
  box-shadow: var(--mfm-shadow-dark), 0 10px 40px rgba(0, 0, 0, .7);
  padding: var(--mfm-s5) !important;
  max-width: calc(100vw - 32px);
  font-family: var(--mfm-font);
}
html.mfm .cfgbox { width: min(640px, calc(100vw - 32px)); }
html.mfm .cfgbox h2 {
  font: 700 18px/1.35 var(--mfm-font) !important;
  color: var(--mfm-gold) !important;
  margin: 0 0 var(--mfm-s3) !important;
  padding-bottom: var(--mfm-s3);
  background: var(--mfm-gold-rule) no-repeat left bottom / 100% 1px !important;
}
html.mfm .cfgbox a { color: var(--mfm-gold) !important; }
html.mfm .cfgbox textarea { width: 100%; max-width: 100%; }

html.mfm #alert {
  background: var(--mfm-parch) var(--mfm-noise) !important;
  border: 0 !important;
  border-radius: var(--mfm-r);
  box-shadow: var(--mfm-shadow-parch), 0 10px 40px rgba(0, 0, 0, .7);
  color: var(--mfm-ink) !important;
  padding: 0 0 var(--mfm-s4) !important;
  overflow: hidden;
  max-width: calc(100vw - 32px);
  font: var(--mfm-fs)/1.5 var(--mfm-font);
}
html.mfm #alert h3 {
  background: var(--mfm-box-dark) var(--mfm-noise) !important;
  color: var(--mfm-gold) !important;
  font: 700 18px/1.3 var(--mfm-font);
  padding: var(--mfm-s3) !important;
  margin: 0 0 var(--mfm-s3) !important;
}
html.mfm #alert span { padding: 0 var(--mfm-s4); }
html.mfm #alert button { width: auto !important; margin: var(--mfm-s3) auto 0 !important; display: block; }

html.mfm #ajaxWait {
  background: var(--mfm-box-dark) var(--mfm-noise) !important;
  color: var(--mfm-gold-soft) !important;
  border: 0 !important;
  border-radius: var(--mfm-r);
  box-shadow: var(--mfm-shadow-dark), 0 10px 40px rgba(0, 0, 0, .7);
  padding: var(--mfm-s3);
  font: var(--mfm-fs-sm)/1.5 var(--mfm-font);
}
html.mfm #ajaxWait h2 { font: 700 20px/1.3 var(--mfm-font); color: var(--mfm-gold); margin: var(--mfm-s3) 0 var(--mfm-s1); }

html.mfm #msgbox {
  background: var(--mfm-btn-green) !important;
  color: var(--mfm-gold) !important;
  border: 1px solid var(--mfm-btn-green-line) !important;
  border-radius: var(--mfm-r-btn);
  box-shadow: 0 10px 30px rgba(0, 0, 0, .7);
  font: 700 18px/1.4 var(--mfm-font) !important;
  padding: var(--mfm-s3) var(--mfm-s6) !important;
}

/* Powiadomienie przełącznika motywu */
#mfm-toast {
  position: fixed;
  z-index: 2147483000;
  left: 50%;
  bottom: 24px;
  transform: translateX(-50%);
  max-width: calc(100vw - 32px);
  background: #180a00;
  color: #ebddc7;
  border-radius: 5px;
  box-shadow: 0 0 8px 2px #000, inset 0 0 3px rgba(255, 255, 255, .2);
  padding: 10px 16px;
  font: 700 14px/1.45 Arimo, Arial, sans-serif;
  text-align: center;
}

/* =========================================================
   Animacje – tylko gdy użytkownik ich nie ogranicza
   ========================================================= */
@media (prefers-reduced-motion: no-preference) {
  html.mfm #forum a,
  html.mfm #mfm-topnav a,
  html.mfm #forum .addbutton,
  html.mfm #forum input,
  html.mfm #forum button,
  html.mfm #forum span[onclick],
  html.mfm #forum .ncatg td > div[onclick],
  html.mfm #forum table.topics td,
  html.mfm #posts .repgive img,
  html.mfm #forum .fpages > a {
    transition: background-color .15s ease, border-color .15s ease, color .15s ease, box-shadow .15s ease, filter .15s ease, transform .15s ease;
  }
  html.mfm #forum .ncatg td > div[onclick]:hover { transform: translateY(-2px); }
}
@media (prefers-reduced-motion: reduce) {
  html.mfm *, html.mfm *::before, html.mfm *::after {
    transition: none !important;
    scroll-behavior: auto !important;
  }
}

/* =========================================================
   Mniejsze ekrany
   ========================================================= */
@media (max-width: 900px) {
  html.mfm { --mfm-user-col: 140px; --mfm-top: 210px; }
  html.mfm #mfm-topnav { font-size: 16px; padding: 0 var(--mfm-s4); }
  html.mfm #mfm-topnav a { padding: 0 10px; }
  html.mfm #mainbox { padding: var(--mfm-s4) !important; }
  html.mfm #forum table.topics > tbody > tr:first-child > th:nth-child(4) { width: 120px !important; }
  html.mfm #forum table.topics > tbody > tr:first-child > th:nth-child(5) { width: 130px !important; }
}

@media (max-width: 720px) {
  html.mfm { --mfm-top: 150px; }
  html.mfm body { margin: 0 var(--mfm-s2) !important; }
  html.mfm #mfm-topnav {
    height: 52px;
    margin-top: 8px;
    padding: 0 var(--mfm-s2) 0 var(--mfm-s3);
    border-radius: 12px;
    font-size: 15px;
  }
  /* duże logo jest tuż pod paskiem, więc małe chowamy, żeby zmieściły się wszystkie linki */
  html.mfm #mfm-topnav .mfm-topnav__logo { display: none; }
  html.mfm #mfm-topnav ul { flex: 1 1 auto; justify-content: space-between; }
  html.mfm #mfm-topnav a { height: 36px; padding: 0 8px; }
  html.mfm td.logo { height: calc(var(--mfm-top) - 60px) !important; }
  html.mfm #mainbox { padding: var(--mfm-s3) var(--mfm-s2) var(--mfm-s4) !important; }
  html.mfm #forum h2 { font-size: 19px; }
  html.mfm #forum .ncatg tr:not(.ncatbar) > td { grid-template-columns: minmax(0, 1fr); gap: var(--mfm-s3); }
  html.mfm #forum .ncatg td > div[onclick] > div { padding: var(--mfm-s3) var(--mfm-s4); gap: var(--mfm-s3); }
  html.mfm #forum .ncatg td > div[onclick] > div > div:first-child { transform: scale(.85); transform-origin: left center; margin-right: -12px; }
  html.mfm #forum table.catg tr.catbar > th { padding: 10px var(--mfm-s3) !important; font-size: 16px !important; }
  html.mfm #forum table.catg td:first-child { padding-left: var(--mfm-s3) !important; }
  html.mfm #forum table.catg td.cat2 { width: 56px; padding: 10px 6px !important; }

  /* Lista tematów jako karty */
  html.mfm #forum table.topics,
  html.mfm #forum table.topics > tbody { display: block; }
  html.mfm #forum table.topics > tbody > tr:first-child { display: none; }
  html.mfm #forum table.topics > tbody > tr {
    display: grid;
    grid-template-columns: auto 1fr 1fr;
    border-top: 1px solid rgba(0, 0, 0, .3);
  }
  html.mfm #forum table.topics > tbody > tr:nth-child(2) { border-top: 0; }
  html.mfm #forum table.topics > tbody > tr > td { border-top: 0 !important; padding: 6px var(--mfm-s3) !important; }
  html.mfm #forum table.topics > tbody > tr > td.topname { grid-column: 1 / -1; padding: 12px var(--mfm-s3) 4px !important; }
  html.mfm #forum table.topics > tbody > tr > td.topname small { white-space: normal; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
  html.mfm #forum table.topics > tbody > tr > td:not(.topname) { text-align: left; padding-bottom: 12px !important; }
  html.mfm #forum table.topics > tbody > tr > td:not(.topname)::before {
    display: block;
    font-size: 10.5px;
    font-weight: 700;
    letter-spacing: .04em;
    text-transform: uppercase;
    color: var(--mfm-ink-muted);
  }
  html.mfm #forum table.topics > tbody > tr > td:nth-child(2)::before { content: "Postów"; }
  html.mfm #forum table.topics > tbody > tr > td:nth-child(3)::before { content: "Autor"; }
  html.mfm #forum table.topics > tbody > tr > td:nth-child(4)::before { content: "Ostatnio"; }
  html.mfm #forum table.topics tr.sticky > td.topname { box-shadow: inset 4px 0 0 #6b3d0e; }

  /* Posty: autor nad treścią */
  html.mfm #posts,
  html.mfm #posts > tbody { display: block; width: 100%; }
  html.mfm #posts > tbody > tr { display: block; }
  html.mfm #posts > tbody > tr > td { display: block; width: auto !important; }
  html.mfm #posts > tbody > tr > td.puser {
    width: auto !important;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--mfm-s2) var(--mfm-s3);
    text-align: left;
    border-radius: var(--mfm-r) var(--mfm-r) 0 0;
    border-right: 0 !important;
    border-bottom: 1px solid rgba(0, 0, 0, .45) !important;
    padding: var(--mfm-s2) var(--mfm-s3) !important;
  }
  html.mfm #posts .nickwood { order: 2; flex: 1 1 140px; margin: 0; min-width: 0; }
  html.mfm #posts .puser center { order: 1; width: 64px !important; flex: 0 0 auto; }
  html.mfm #posts .puser center > div[style*="frame_av"] { padding: var(--mfm-s1) 0; }
  html.mfm #posts table.repbar { order: 3; flex: 1 1 100%; margin: 0; }
  html.mfm #posts table.repbar > tbody { justify-content: flex-start; }
  html.mfm #posts .puser > img { order: 4; }
  html.mfm #posts > tbody > tr > td.pcont {
    display: flow-root;
    border-radius: 0;
    padding: var(--mfm-s3) var(--mfm-s4) !important;
  }
  html.mfm #posts > tbody > tr > td.postid {
    border-radius: 0;
    text-align: left;
    padding: 4px var(--mfm-s3) !important;
  }
  html.mfm #forum #posts > tbody > tr > td.pbar {
    border-radius: 0 0 var(--mfm-r) var(--mfm-r);
    border-top: 0 !important;
    text-align: left;
    padding: var(--mfm-s2) var(--mfm-s3) !important;
  }
  /* posty ekipy: ramka w kolorze rangi wokół ułożonej pionowo karty */
  html.mfm #posts > tbody > tr > td.puser:is(.mod, .smg, .zsp, .pns, .system) {
    border-right: 3px solid var(--mfm-role) !important;
    border-bottom: 1px solid var(--mfm-role) !important;
  }
  html.mfm #posts > tbody > tr > td.puser:is(.mod, .smg, .zsp, .pns, .system) > img { margin: 0; order: 4; }
  html.mfm #posts > tbody > tr:has(> td.puser:is(.mod, .smg, .zsp, .pns, .system)) > td.pcont {
    border-top: 0 !important;
    border-left: 3px solid var(--mfm-role) !important;
  }
  html.mfm #posts > tbody > tr > td.postid:is(.mod, .smg, .zsp, .pns, .system) {
    border-bottom: 0 !important;
    border-right: 3px solid var(--mfm-role) !important;
  }
  html.mfm #forum #posts > tbody > tr > td.pbar:is(.mod, .smg, .zsp, .pns, .system) {
    border-top: 0 !important;
    border-left: 3px solid var(--mfm-role) !important;
  }
  html.mfm #posts .repgive { float: none !important; display: flex; margin: 0 0 4px; }
  html.mfm #forum #posts td.pbar a { display: inline-block; padding: 4px 2px; }
  html.mfm #posts > tbody > tr.sepbar { display: block; height: var(--mfm-s3) !important; }
  html.mfm #posts > tbody > tr.sepbar > td { display: none; }

  /* Zasady działu jedna pod drugą */
  html.mfm #forum > table:has(.rules) > tbody > tr > td { display: block; width: auto !important; }

  html.mfm #forum .addbutton { padding: 8px 12px; }
  html.mfm #forum .fpages { justify-content: flex-start; }
  html.mfm #forum .fpages > a[href^="#"] { flex: 1 1 100%; text-align: left; }
}
`;

  /* ---------------------------------------------------------
     Stan i przełącznik
     --------------------------------------------------------- */
  const MODE_KEY = 'mfm-mode';
  const BLOOD_CLASS = 'mfm-blood';
  const MODES = { classic: 'Klasyczny', blood: 'Bloodmoon' };

  let enabled = GM_getValue(STORE_KEY, true) !== false;
  let mode = GM_getValue(MODE_KEY, 'classic') === 'blood' ? 'blood' : 'classic';
  let menuId = null;
  let modeMenuId = null;
  let keyHandlerBound = false;

  function applyMode() {
    document.documentElement.classList.toggle(BLOOD_CLASS, mode === 'blood');
  }

  function addStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = CSS;
    (document.head || document.documentElement).appendChild(style);
  }

  function ensureViewport() {
    if (document.querySelector('meta[name="viewport"]')) return;
    const head = document.head || document.querySelector('head');
    if (!head) return;
    const meta = document.createElement('meta');
    meta.name = 'viewport';
    meta.id = META_ID;
    meta.content = 'width=device-width, initial-scale=1';
    head.appendChild(meta);
  }

  // Pasek nawigacji z tymi samymi odnośnikami co na stronie głównej Margonem.
  function ensureTopNav() {
    if (!document.body || document.getElementById(NAV_ID)) return;
    const nav = document.createElement('nav');
    nav.id = NAV_ID;
    nav.setAttribute('aria-label', 'Margonem');

    const logo = document.createElement('a');
    logo.className = 'mfm-topnav__logo';
    logo.href = HOME + '/';
    const img = document.createElement('img');
    img.src = HOME + '/_i/pl/logo-small-1x.webp';
    img.alt = 'Margonem';
    img.width = 156;
    img.height = 28;
    logo.appendChild(img);
    nav.appendChild(logo);

    const ul = document.createElement('ul');
    [
      ['Świat', HOME + '/art/world'],
      ['Rankingi', HOME + '/ladder'],
      ['Support', 'https://support.garmory.pl/s/margonem.pl/pl'],
      ['Forum', 'https://forum.margonem.pl/', true],
    ].forEach(([label, href, current]) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = href;
      a.textContent = label;
      if (current) a.setAttribute('aria-current', 'page');
      li.appendChild(a);
      ul.appendChild(li);
    });
    nav.appendChild(ul);
    document.body.insertBefore(nav, document.body.firstChild);
  }

  function enableTheme() {
    document.documentElement.classList.add(ROOT_CLASS);
    applyMode();
    addStyle();
    ensureViewport();
  }

  function disableTheme() {
    document.documentElement.classList.remove(ROOT_CLASS, BLOOD_CLASS);
    [STYLE_ID, META_ID, NAV_ID].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.remove();
    });
  }

  /* ---------------------------------------------------------
     Drobne usprawnienia DOM (idempotentne, bez zmiany treści)
     --------------------------------------------------------- */
  const BADGES = {
    'przybity': { kind: 'pin', label: 'Przypięty' },
    'zamknięty': { kind: 'lock', label: 'Zamknięty' },
  };

  // Owija tekstowe znaczniki "[przybity][zamknięty]" w spany. Tekst pozostaje identyczny.
  function decorateTopicBadges(root) {
    root.querySelectorAll('#forum table.topics td.topname:not([data-mfm-badges])').forEach((td) => {
      td.setAttribute('data-mfm-badges', '');
      Array.from(td.childNodes).forEach((node) => {
        if (node.nodeType !== Node.TEXT_NODE || !/\[[^\[\]\n]{1,24}\]/.test(node.nodeValue)) return;
        const frag = document.createDocumentFragment();
        const parts = node.nodeValue.split(/(\[[^\[\]\n]{1,24}\])/);
        parts.forEach((part) => {
          if (!part) return;
          const m = /^\[([^\[\]\n]{1,24})\]$/.exec(part);
          if (!m) { frag.appendChild(document.createTextNode(part)); return; }
          const key = m[1].trim().toLowerCase();
          const info = BADGES[key] || { kind: 'other', label: m[1].trim() };
          const span = document.createElement('span');
          span.className = 'mfm-badge';
          span.setAttribute('data-mfm-kind', info.kind);
          span.setAttribute('data-mfm-label', info.label);
          span.textContent = part;
          frag.appendChild(span);
        });
        node.parentNode.replaceChild(frag, node);
      });
    });
  }

  // Numery stron "[12]" dostają atrybut z samą liczbą – CSS wyświetla liczbę, tekst linku bez zmian.
  function decoratePagination(root) {
    root.querySelectorAll('#forum .fpages > a, #forum .fpages > b, #forum td.topname a[title="Ostatnia strona"]').forEach((el) => {
      if (el.hasAttribute('data-mfm-page')) return;
      const m = /^\s*\[(\d+)\]\s*$/.exec(el.textContent);
      if (m) el.setAttribute('data-mfm-page', m[1]);
    });
    root.querySelectorAll('#forum .fpages > b[data-mfm-page]').forEach((b) => b.setAttribute('aria-current', 'page'));
  }

  // Elementy z onclick bez dostępu z klawiatury (np. [Przeszukaj temat], kciuki oceny).
  function improveKeyboardAccess(root) {
    root.querySelectorAll('#forum [onclick]:not(a):not(button):not(input):not(select):not(textarea):not(label):not([tabindex])').forEach((el) => {
      if (el.querySelector('a[href], button, input')) return; // np. karty działów – mają własne linki
      el.setAttribute('tabindex', '0');
      if (!el.hasAttribute('role')) el.setAttribute('role', 'button');
      el.setAttribute('data-mfm-kbd', '');
    });
    if (!keyHandlerBound) {
      keyHandlerBound = true;
      document.addEventListener('keydown', (e) => {
        if (!enabled) return;
        const t = e.target;
        if (!(t instanceof Element) || !t.hasAttribute('data-mfm-kbd')) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          t.click();
        }
      });
    }
  }

  /* W trybie Bloodmoon treść leży na czerni. Kolory ustawione przez autorów postów pod jasny
     pergamin (np. ciemnogranatowy, czarny) byłyby nieczytelne – dostają rozjaśniony odpowiednik
     przez zmienną CSS --mfm-lc dopisaną do elementu. Treść i kolor ustawiony przez autora
     zostają bez zmian; podmiana koloru działa tylko w trybie Bloodmoon. */
  function parseRgb(str) {
    const m = /rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/.exec(str);
    return m ? [+m[1], +m[2], +m[3]] : null;
  }
  function luminance([r, g, b]) {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  }
  function fixLowContrast(root) {
    if (mode !== 'blood') return;
    root.querySelectorAll('#forum td.pcont [style*="color"], #forum td.pcont font[color], #forum .rules [style*="color"], #forum .rules font[color]').forEach((el) => {
      if (el.hasAttribute('data-mfm-lc-checked')) return;
      el.setAttribute('data-mfm-lc-checked', '');
      const rgb = parseRgb(getComputedStyle(el).color);
      if (!rgb || luminance(rgb) >= 0.12) return;
      // mieszamy z bielą, aż kontrast z czarnym tłem będzie wystarczający (luminancja ≥ 0.3)
      let out = rgb;
      for (let t = 0.3; t <= 0.9 && luminance(out) < 0.3; t += 0.1) {
        out = rgb.map((v) => Math.round(v + (255 - v) * t));
      }
      el.style.setProperty('--mfm-lc', `rgb(${out.join(', ')})`);
      el.setAttribute('data-mfm-lc', '');
    });
  }

  function enhance() {
    if (!enabled) return;
    ensureViewport();
    ensureTopNav();
    if (!document.getElementById('forum')) return;
    decorateTopicBadges(document);
    decoratePagination(document);
    improveKeyboardAccess(document);
    fixLowContrast(document);
  }

  function onReady(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once: true });
    else fn();
  }

  function toast(text) {
    onReady(() => {
      let el = document.getElementById('mfm-toast');
      if (!el) {
        el = document.createElement('div');
        el.id = 'mfm-toast';
        el.setAttribute('role', 'status');
        el.setAttribute('aria-live', 'polite');
        document.body.appendChild(el);
      }
      // Gdy motyw jest wyłączony, arkusza nie ma – minimalny styl inline.
      if (!document.getElementById(STYLE_ID)) {
        el.style.cssText = 'position:fixed;z-index:2147483000;left:50%;bottom:24px;transform:translateX(-50%);max-width:calc(100vw - 32px);background:#180a00;color:#ebddc7;border-radius:5px;box-shadow:0 0 8px 2px #000;padding:10px 16px;font:700 14px/1.45 Arial,sans-serif;text-align:center;';
      } else {
        el.style.cssText = '';
      }
      el.textContent = text;
      clearTimeout(toast.timer);
      toast.timer = setTimeout(() => el.remove(), 4500);
    });
  }

  function registerMenu() {
    if (menuId !== null && typeof GM_unregisterMenuCommand === 'function') {
      try { GM_unregisterMenuCommand(menuId); } catch (_) { /* starsze wersje */ }
    }
    if (modeMenuId !== null && typeof GM_unregisterMenuCommand === 'function') {
      try { GM_unregisterMenuCommand(modeMenuId); } catch (_) { /* starsze wersje */ }
    }
    const label = enabled
      ? '🟢 Nowy wygląd forum: WŁĄCZONY – kliknij, aby wyłączyć'
      : '⚪ Nowy wygląd forum: WYŁĄCZONY – kliknij, aby włączyć';
    menuId = GM_registerMenuCommand(label, toggle);
    const other = mode === 'blood' ? 'classic' : 'blood';
    modeMenuId = GM_registerMenuCommand(
      (mode === 'blood' ? '🩸' : '🌿') + ` Tryb: ${MODES[mode]} – kliknij, aby przełączyć na ${MODES[other]}`,
      toggleMode
    );
  }

  function toggleMode() {
    mode = mode === 'blood' ? 'classic' : 'blood';
    GM_setValue(MODE_KEY, mode);
    if (enabled) {
      applyMode();
      onReady(() => fixLowContrast(document));
      toast(`Tryb ${MODES[mode]} włączony. Odświeżanie strony nie jest potrzebne.`);
    } else {
      toast(`Wybrano tryb ${MODES[mode]}. Zobaczysz go po włączeniu nowego wyglądu forum.`);
    }
    registerMenu();
  }

  function toggle() {
    enabled = !enabled;
    GM_setValue(STORE_KEY, enabled);
    if (enabled) {
      enableTheme();
      onReady(enhance);
      toast('Nowy wygląd forum włączony. Odświeżanie strony nie jest potrzebne.');
    } else {
      disableTheme();
      toast('Nowy wygląd forum wyłączony – przywrócono oryginalny wygląd. Odświeżanie nie jest potrzebne.');
    }
    registerMenu();
  }

  /* ---------------------------------------------------------
     Start
     --------------------------------------------------------- */
  if (enabled) {
    enableTheme();
    onReady(enhance);
  }
  registerMenu();
})();
