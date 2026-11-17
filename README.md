# Dodatki

Dodatki (userscripty) do Margonem.

## Margonem — Legendary Frame Plus

Ramki i efekty żywiołów wokół ekranu przy pojawieniu się legendarnego przedmiotu.

Instalacja: zainstaluj Tampermonkey, otwórz [legendary-frame-plus.user.js](legendary-frame-plus/legendary-frame-plus.user.js) i kliknij **Raw** — Tampermonkey zaproponuje instalację. Później Tampermonkey sam pobiera nowe wersje z tego repo.

## Margonem — Forum: Nowy Wygląd

Nowoczesny, czytelny wygląd [forum Margonem](https://forum.margonem.pl/) w stylu strony głównej. Dwa tryby: **Klasyczny** (ciemne drewno i pergamin) oraz **Bloodmoon** (czerń i karmazyn). Posty ekipy są wyróżnione kolorem rangi. Zmienia wyłącznie wygląd — wszystkie funkcje forum działają jak dotąd.

Instalacja: zainstaluj Tampermonkey, otwórz [margonem-forum-modern.user.js](margonem-forum-modern/margonem-forum-modern.user.js) i kliknij **Raw** — Tampermonkey zaproponuje instalację. Później Tampermonkey sam pobiera nowe wersje z tego repo.

Włączanie, wyłączanie i wybór trybu: ikona Tampermonkey na stronie forum → pozycje „Nowy wygląd forum” oraz „Tryb”.

## Margonem — Dark Fantasy Theme

Mroczny motyw graficzny dla **nowego interfejsu (NI)** gry Margonem: czerń i grafit, stare drewno, zgaszone złoto, krwista czerwień i upiorne podświetlenia. Okna z fakturą i ramką z kutego metalu, przyciski jak runiczne tabliczki, paski HP/MP/EXP z połyskiem (HP jak krew, mana jak mistyczny fiolet), przytłumiony, czytelny czat, tooltipy w stylu ciemnego pergaminu ze złotą ramką — **kolory rzadkości przedmiotów zostają rozpoznawalne**. Fonty: Cinzel (nagłówki) i Crimson Text / IM Fell English (tekst).

Zmienia wyłącznie wygląd UI — nie dotyka mapy (canvasu), logiki gry ani komunikacji z serwerem. Na starym interfejsie (SI) skrypt nic nie robi.

**Link instalacyjny:** https://raw.githubusercontent.com/Harkryn/Dodatki/main/margonem-dark-fantasy/margonem-dark-fantasy.user.js

Instalacja:
1. Zainstaluj rozszerzenie [Tampermonkey](https://www.tampermonkey.net/).
2. Otwórz link instalacyjny powyżej (albo [margonem-dark-fantasy.user.js](margonem-dark-fantasy/margonem-dark-fantasy.user.js) → **Raw**) — Tampermonkey zaproponuje instalację. Kliknij **Zainstaluj**.
3. Odśwież grę. Później Tampermonkey sam pobiera nowe wersje z tego repo.

Włączanie / wyłączanie: **Alt+T** albo mała ikonka ✠ w lewym dolnym rogu ekranu. Stan jest zapamiętywany.

Nie działa? Otwórz konsolę (F12 → Console) — skrypt wypisuje tam `[Dark Fantasy] … aktywny` albo powód, dla którego się nie włączył. W Operze / Operze GX sprawdź w `opera://extensions` → Tampermonkey → **Szczegóły**, czy włączone jest **Zezwalaj na skrypty użytkownika** i dostęp **Na wszystkich witrynach**. Jeśli równolegle używasz innego motywu interfejsu (np. nitheme), wyłącz go — oba podmieniają te same grafiki.

Diagnostyka: [diagnostyka.js](margonem-dark-fantasy/diagnostyka.js) — wklej do konsoli w grze, a skopiuje do schowka listę klas i grafik interfejsu (pomaga poprawić selektory). Niczego nie zmienia w grze.

Dostosowanie: paleta kolorów to zmienne CSS (`--mdf-gold`, `--mdf-blood`, `--mdf-ghost`, `--mdf-arcane`, `--mdf-rar-*` …) w funkcji `buildCss()`, a selektory elementów gry są zebrane w obiekcie `SELECTORS` na początku pliku. Selektory oznaczone `// ?` to przypuszczenia — sprawdź je w DevTools (F12) i popraw w razie potrzeby.
