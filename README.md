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

Czarny, elegancki motyw z kotami dla **nowego interfejsu (NI)** gry Margonem. Tła są czarne wszędzie, gdzie się da, a fiolet spina całość — obwódki okien, przycisków i slotów, kratki torby, linie belek, poświata przy najechaniu i aktywne zakładki. Okna to jednolite czarne bryły z tytułem leżącym bezpośrednio na oknie.

Kocie detale:
- **ekran wczytywania gry** — czarne niebo, księżyc i kot na dachu z mrugającymi oczami (kliknięcie lub Esc pomija),
- **efekt legendy** — gdy w łupie albo w torbie pojawi się nowy przedmiot legendarny, w ciemności otwierają się wielkie kocie oczy w kolorze legendy, mrugają, a wokół rozbiegają się łapki,
- **kula HP w kształcie odcisku kociej łapy** — wypełniona fioletowym płynem z przesuwającym się połyskiem i losowo unoszącymi się bąbelkami, z pulsującą poświatą; siedzi w księżycowym kręgu, a po bokach drgają kocie wąsy,
- **górna tabliczka** (imię, lokacja, złoto) z podwójną ramą, fioletową poświatą i ornamentem z medalionem, w którym mruga kot,
- **torba** z czarnymi kratkami i fioletowymi liniami, **panele interfejsu** (np. Statystyki) w fiolecie,
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
- **Alt+K** — włącz/wyłącz animacje (kot, oczy w ciemności, płyn, bąbelki i puls kuli HP, wąsy, medalion),
- **Alt+L** — podgląd efektu legendy.

Interfejs jest rozpoznawany po ciasteczku gry `interface`, więc ekran wczytywania pojawia się od razu, a na starym interfejsie (SI) skrypt nic nie robi. Motyw działa na margonem.pl i margonem.com, wyłącznie na stronach światów gry (nie na forum ani stronie głównej).

Dostosowanie: paleta to zmienne CSS `--mkn-*` w funkcji `buildCss()`, selektory gry są w obiekcie `SELECTORS`, a poszczególne funkcje wyłączysz w obiekcie `FEATURES` (uszy, ekran wczytywania, efekt legendy, oczy, poświata kuli HP, kształt łapki `pawOrb`, zdobienia kuli `orbDecor`, tabliczka `hudDecor`). Pozycję kota zmienisz w regule `right: 230px` w sekcji „KOT-MASKOTKA”.

Coś wygląda po staremu? Uruchom w konsoli gry (F12 → Console) [diagnostyka.js](margonem-kocia-noc/diagnostyka.js), a potem najedź na przedmiot i przytrzymaj kursor — skrypt przechwyci tooltip i skopiuje wynik do schowka. Niczego nie zmienia w grze.

## Margonem — Crimson Knight

Mroczny, rycerski motyw dla **nowego interfejsu (NI)** gry Margonem. Przeważa czerń i bardzo ciemne grafity, a kolor wariantu jest tylko akcentem. Okna wyglądają jak kute, poobijane żelazo z nitami w narożnikach i przebarwieniami przy krawędziach. Powierzchnie mają brud, szum i rysy (generowane w CSS).

Dwa warianty kolorystyczne:
- **Szkarłat** (domyślny) — czerń i brudna, zaschnięta czerwień, krew w strużkach, rdzawy metal,
- **Butelkowa Zieleń** — czerń i głęboka, szklista zieleń starego szkła, gęsta zielona ciecz (jad, trucizna), metal z patyną i śniedzią, chłodny przygaszony blask.

Rycerskie detale:
- **skrzyżowane miecze** po bokach tytułów okien i pod górną tabliczką, **miecz poziomo** jako separator pod nagłówkiem, **łańcuch** na dolnych paskach okien,
- **strużki cieczy** skapujące z górnych krawędzi wybranych okien i spod górnej belki — co kilka sekund w kilku miejscach odrywa się kropla,
- **tarcza z mieczem** jako ledwo widoczny znak wodny w dużych oknach i bocznych kolumnach,
- **przyciski jak żelazne tabliczki** — przy najechaniu kolor wariantu rozlewa się od krawędzi,
- **poświata aktywnego okna** (ostatnio klikniętego) delikatnie pulsuje; przy niskim HP (poniżej 30%) pulsuje zawsze na czerwono,
- **tooltipy** jak ciemny, brudny pergamin w żelaznej ramce z nitami, rzadkość na górnej krawędzi,
- subtelna **mgła** na dole mapy (w wariancie zielonym zielonkawa).

**Kolory rzadkości przedmiotów są stałe i takie same w obu wariantach.** Pasek HP jest zawsze czerwony, mana zawsze w zimnym, ciemnym błękicie, a doświadczenie w przyciemnionym mosiądzu. Kanały czatu zachowują swoje kolory, tylko lekko przytłumione. Wszystkie grafiki są rysowane w kodzie (SVG/CSS), bez zewnętrznych obrazków. Animacje są spokojne, korzystają tylko z `transform` i `opacity` i wyłączają się same przy systemowym ustawieniu „ogranicz ruch”.

Zmienia wyłącznie wygląd UI — nie dotyka mapy, logiki gry ani komunikacji z serwerem. Na starym interfejsie (SI) skrypt nic nie robi.

**Link instalacyjny:** https://raw.githubusercontent.com/Harkryn/Dodatki/main/margonem-crimson-knight/margonem-crimson-knight.user.js

Instalacja:
1. Zainstaluj rozszerzenie [Tampermonkey](https://www.tampermonkey.net/).
2. Otwórz link instalacyjny powyżej i kliknij **Zainstaluj**.
3. Wyłącz w Tampermonkey inne motywy interfejsu (np. Kocią Noc albo nitheme) — zmieniają te same elementy. Jeśli Kocia Noc jest włączona jednocześnie, motyw raz wyświetli o tym informację.
4. Odśwież grę. Nowe wersje Tampermonkey pobiera sam.

Przełączanie (ikonka skrzyżowanych mieczy w lewym dolnym rogu otwiera panel z tymi samymi opcjami):
- **Alt+T** — włącz/wyłącz motyw (gdy zainstalowana jest też Kocia Noc, która używa Alt+T: **Alt+Shift+T**),
- **Alt+V** — przełącz wariant Szkarłat ↔ Butelkowa Zieleń (od razu, bez przeładowania, z płynnym przejściem kolorów),
- **Alt+A** — włącz/wyłącz animacje (krople, pulsowanie, mgła).

Ustawienia są zapamiętywane i wracają po przeładowaniu. Interfejs jest rozpoznawany tak samo jak w Kociej Nocy (ciasteczko gry `interface`). Motyw działa na margonem.pl i margonem.com, wyłącznie na stronach światów gry.

Dostosowanie: kolory wariantów to zmienne CSS `--ck-*` w blokach `html[data-ck-variant="crimson"]` i `html[data-ck-variant="green"]` w funkcji `buildCss()`, selektory gry są w obiekcie `SELECTORS` (oznaczone `[KN]` — sprawdzone w Kociej Nocy, `[NOWY]` — do weryfikacji), a poszczególne funkcje wyłączysz w obiekcie `FEATURES` (strużki, tarcze, mgła, czerwony puls przy niskim HP).
