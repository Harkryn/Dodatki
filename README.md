# Dodatki

Dodatki (userscripty) do Margonem.

## Margonem — Legendary Frame Plus

Ramki i efekty żywiołów wokół ekranu przy pojawieniu się legendarnego przedmiotu.

Instalacja: zainstaluj Tampermonkey, otwórz [legendary-frame-plus.user.js](legendary-frame-plus/legendary-frame-plus.user.js) i kliknij **Raw** — Tampermonkey zaproponuje instalację. Później Tampermonkey sam pobiera nowe wersje z tego repo.

## Margonem — Forum: Nowy Wygląd

Nowoczesny, czytelny wygląd [forum Margonem](https://forum.margonem.pl/) w stylu strony głównej. Dwa tryby: **Klasyczny** (ciemne drewno i pergamin) oraz **Bloodmoon** (czerń i karmazyn). Posty ekipy są wyróżnione kolorem rangi. Zmienia wyłącznie wygląd — wszystkie funkcje forum działają jak dotąd.

Instalacja: zainstaluj Tampermonkey, otwórz [margonem-forum-modern.user.js](margonem-forum-modern/margonem-forum-modern.user.js) i kliknij **Raw** — Tampermonkey zaproponuje instalację. Później Tampermonkey sam pobiera nowe wersje z tego repo.

Włączanie, wyłączanie i wybór trybu: ikona Tampermonkey na stronie forum → pozycje „Nowy wygląd forum” oraz „Tryb”.

## Margonem — Kocia Noc

Czarny, elegancki motyw z kotami dla **nowego interfejsu (NI)** gry Margonem. Tła są czarne wszędzie, gdzie się da, a fiolet pojawia się subtelnie — w cienkich liniach, poświacie przy najechaniu i aktywnych zakładkach. Okna to jednolite czarne bryły z tytułem leżącym bezpośrednio na oknie.

Kocie detale:
- **ekran wczytywania gry** — czarne niebo, księżyc i kot na dachu z mrugającymi oczami (kliknięcie lub Esc pomija),
- **efekt legendy** — gdy w łupie albo w torbie pojawi się nowy przedmiot legendarny, w ciemności otwierają się wielkie kocie oczy w kolorze legendy, mrugają, a wokół rozbiegają się łapki,
- **kotki w kuli HP** — co około 30 sekund dwa kotki przebiegają przez kulę, goniąc kłębek włóczki,
- **oczy w ciemności** — co jakiś czas w czarnej kolumnie otwiera się para świecących oczu, mruga i znika,
- uszy na oknach (lekko się przechylają przy najechaniu), łapki w nagłówkach i tooltipach, ledwo widoczny wzór łapek w tle,
- czarny kot-maskotka siedzący na dolnej belce i kocia ikonka przełącznika.

Wnętrza okien (drewniane paski, pergamin, jasne panele, brązowe ramki) są automatycznie przemalowywane na czerń — skrypt sprawdza wygląd nowych elementów w oknach, więc działa też w oknach, których nie znał wcześniej.

Tooltipy przedmiotów to czarne karty z kolorem rzadkości na górnej krawędzi i delikatną poświatą w tym kolorze. **Kolory rzadkości, bonusów i kanałów czatu zostają rozpoznawalne.** Wszystkie grafiki motywu są rysowane w kodzie (SVG/CSS), bez zewnętrznych obrazków.

Zmienia wyłącznie wygląd UI — nie dotyka mapy, logiki gry ani komunikacji z serwerem (legendę rozpoznaje wyłącznie po wyglądzie przedmiotów na ekranie). Na starym interfejsie (SI) skrypt nic nie robi.

**Link instalacyjny:** https://raw.githubusercontent.com/Harkryn/Dodatki/main/margonem-kocia-noc/margonem-kocia-noc.user.js

Instalacja:
1. Zainstaluj rozszerzenie [Tampermonkey](https://www.tampermonkey.net/).
2. Otwórz link instalacyjny powyżej i kliknij **Zainstaluj**.
3. Wyłącz w Tampermonkey inne motywy interfejsu (np. nitheme) — podmieniają te same grafiki.
4. Odśwież grę. Nowe wersje Tampermonkey pobiera sam.

Skróty:
- **Alt+T** — włącz/wyłącz motyw (albo kliknij kocią ikonkę w lewym dolnym rogu),
- **Alt+K** — włącz/wyłącz kocie animacje (kot, kotki w kuli HP, oczy w ciemności),
- **Alt+L** — podgląd efektu legendy.

Ekran wczytywania pojawia się od drugiego wejścia na dany świat (skrypt musi najpierw zobaczyć, że to nowy interfejs).

Dostosowanie: paleta to zmienne CSS `--mkn-*` w funkcji `buildCss()`, selektory gry są w obiekcie `SELECTORS`, a poszczególne funkcje wyłączysz w obiekcie `FEATURES` (uszy, ekran wczytywania, efekt legendy, oczy, kotki w HP). Pozycję kota zmienisz w regule `right: 230px` w sekcji „KOT-MASKOTKA”.

Coś wygląda po staremu? Uruchom w konsoli gry (F12 → Console) [diagnostyka.js](margonem-kocia-noc/diagnostyka.js), a potem najedź na przedmiot i przytrzymaj kursor — skrypt przechwyci tooltip i skopiuje wynik do schowka. Niczego nie zmienia w grze.
