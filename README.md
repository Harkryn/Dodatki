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

Mroczny, gotycko-rycerski motyw dla **nowego interfejsu (NI)** gry Margonem — brudne, mroczne średniowiecze. Przeważa czerń i okopcone grafity, a kolor wariantu jest tylko akcentem, inkrustowanym w żelazo. Wszystko jest kanciaste, bez zaokrągleń, i bogato zdobione jak gotycka budowla. Powierzchnie mają brud, sadzę, szum i rysy (generowane w CSS).

Dwa warianty kolorystyczne:
- **Szkarłat** (domyślny) — mega mroczny, w duchu mrocznego gotyckiego action-RPG: czarne powierzchnie z subtelnym czerwonym dymem, żarząca się krwista czerwień tylko na liniach i aktywnych elementach, **ciernie** oplatające okna, belki i tabliczkę, **czaszki** nad oknami i w narożnikach, **świece z migoczącym płomieniem** w dolnych rogach mapy, czerwony żar w narożnikach ram, **kula HP z krwią** w kutej oprawie z koroną sterczyn, paski EXP z grotami włóczni, kanciaste przyciski z krwistymi ikonami i tytuły kapitalikami,
- **Butelkowa Zieleń** — czerń i głęboka, szklista zieleń starego szkła, metal z patyną i śniedzią, chłodny przygaszony blask.

Gotyckie i rycerskie zdobienia:
- **okna** jak kute żelazo: podwójna rama z inkrustowaną linią w kolorze wariantu, **okute narożniki ze sterczynami i żabkami** oraz czwórliściem,
- **szczyt z kwiatonem** (ośli grzbiet, sterczyny) nad tytułem okna, tytuły **frakturą**, po bokach **ślepe ostrołuki z trójliściem**, pod tytułem separator z medalionem,
- **koronka wiszących ostrołuków** pod oknami i pod górną belką, **blanki z otworami strzelniczymi** nad dolną belką, ślepa arkada na belkach,
- **rozeta** jako ledwo widoczny znak wodny w dużych oknach i **ostrołukowe okno z maswerkiem** w bocznych kolumnach,
- pod górną tabliczką **rozeta ze skrzyżowanymi mieczami**,
- **przyciski jak okute tabliczki** z inkrustowaną listwą — przy najechaniu kolor wariantu rozlewa się od krawędzi,
- **poświata aktywnego okna** (ostatnio klikniętego) delikatnie pulsuje; przy niskim HP (poniżej 30%) pulsuje zawsze na czerwono,
- **tooltipy** jak ciemny, brudny pergamin w żelaznej ramie z okutymi narożnikami, rzadkość na górnej krawędzi,
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
- **Alt+A** — włącz/wyłącz animacje (pulsowanie poświaty, mgła).

Ustawienia są zapamiętywane i wracają po przeładowaniu. Interfejs jest rozpoznawany tak samo jak w Kociej Nocy (ciasteczko gry `interface`). Motyw działa na margonem.pl i margonem.com, wyłącznie na stronach światów gry.

Dostosowanie: kolory wariantów to zmienne CSS `--ck-*` w blokach `html[data-ck-variant="crimson"]` i `html[data-ck-variant="green"]` w funkcji `buildCss()`, selektory gry są w obiekcie `SELECTORS` (oznaczone `[GRA]` — sprawdzone w grze, `[KN]` — sprawdzone w Kociej Nocy, `[NOWY]` — do weryfikacji), a poszczególne funkcje wyłączysz w obiekcie `FEATURES` (gotyckie ramy, ozdoby belek, znaki wodne, mgła, czerwony puls przy niskim HP).

## Margonem — Dark Gothic

Mroczny, demoniczny motyw dla **nowego interfejsu (NI)** gry Margonem, zbudowany z **własnych rastrowych grafik**: rogate głowy demonów, czarne żelazo z runami i żarem, krwawy dym, pierścień kuli HP z rogami. Paleta: prawie czarny `#070607`/`#0b0b0d`, bordo i ciemna czerwień `#3a0508`/`#5a0a0f`/`#8b0000`, żar `#c0262d`, kość `#d8cfc0`.

Co jest ostylowane:
- **tabliczka HUD** (imię, lokacja, złoto) — kuta tabliczka z rogami, imię czerwonymi kapitalikami, **głowy demonów** po obu stronach,
- **kula HP** — żelazny pierścień z rogami i kolcami, krwawa poświata; gra dalej pokazuje w środku swój poziom HP i procent,
- **dolny panel** — poczerniała oprawa pasków EXP (karmazyn), głowy demonów na końcach, ciemne sloty,
- **górna i dolna belka** — czerń z belką z runami i żarem na krawędzi,
- **przyciski HUD** — ciemne obsydianowe kafle z czerwoną poświatą, ikony w szarości (kolor przy najechaniu), kolor gry (fiolet, niebieski) zostaje jako delikatna poświata,
- **okna z ramką** — ramka 9-slice z belki z runami i żelaznymi guzami z żarem (`border-image`, skaluje się do każdego rozmiaru), krwawy dym w tle, **baner tytułu z rogami**, czaszka demona pod oknem,
- **okna przezroczyste** (śledzone questy, sorter) — czerń z czerwoną obwódką,
- **dialog z NPC** — ta sama rama i głowa demona nad oknem,
- **sklep** — markiza w ciemnym bordo, krata zamiast drewnianej belki,
- **ekwipunek, torby, statystyki, czat** — czarne tło z krwawym dymem od dołu, czerwone aktywne zakładki, kolory kanałów bez zmian,
- **tooltipy przedmiotów** — żelazna ramka, czerwony nagłówek, kolory rzadkości bez zmian,
- **przyciski tekstowe** — obsydianowe kafle; czerwony, niebieski i fioletowy przycisk gry zachowują znaczenie,
- **paski postępu, scrollbary**.

Mapa (canvas) i logika gry pozostają nietknięte — skrypt wstrzykuje wyłącznie CSS.

**Link instalacyjny:** https://raw.githubusercontent.com/Harkryn/Dodatki/main/margonem-dark-gothic/dark-gothic.user.js

Instalacja:
1. Zainstaluj rozszerzenie [Tampermonkey](https://www.tampermonkey.net/).
2. Otwórz link instalacyjny powyżej i kliknij **Zainstaluj**.
3. Wyłącz w Tampermonkey inne motywy interfejsu (Crimson Knight, Kocia Noc, nitheme) — zmieniają te same elementy.
4. Odśwież grę.

Wyłączanie: **Ctrl+Alt+G** albo ikona Tampermonkey → „Dark Gothic: włącz / wyłącz” (wybór jest zapamiętywany).

Grafiki leżą w [assets/dark-gothic/](assets/dark-gothic/) (10 plików WebP, razem ok. 140 KB, każdy poniżej 40 KB) i są ładowane przez jsDelivr. Zostały wygenerowane modelem FLUX.1 Krea (seed 1337) jako osobne elementy, tło wycięte kluczowaniem czerni, środek pierścienia kuli HP wycięty pod kulę gry, belka dopasowana do bezszwowego powtarzania. Zrzuty przed/po: [margonem-dark-gothic/screenshots/](margonem-dark-gothic/screenshots/).
