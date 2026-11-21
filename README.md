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

Mroczny, spójny motyw dla **nowego interfejsu (NI)** gry Margonem, zbudowany z **własnych rastrowych grafik**: spękany, okopcony kamień z wytartymi runami, poniszczone maski demonów, runiczny pierścień kuli HP. Prawie wszystko jest czarne, a czerwień to tylko stłumiony akcent. Paleta: `#050405`/`#09080a`/`#110e10`, przygaszona czerwień `#43080c`/`#6e0f14`/`#8f1a1f`, popiół `#8d878c`, kość `#cbc2b6`.

Co jest ostylowane:
- **tabliczka HUD** (imię, mapa z koordynatami, świat, złoto i smocze łzy — zagęszczona, żeby nie zasłaniała mapy) — imię w przygaszonej czerwieni na spękanym granicie, **poniszczone głowy demonów** po obu stronach, pod napisami ciemna kamienna listwa, w której **runy pulsują na czerwono** jak w pierścieniu kuli HP, a kropla w medalionie przyjmuje kolor trybu PvP mapy,
- **siatka slotów** (torba, sklep) — linie w bardzo ciemnej czerwieni, po których co kilka sekund przesuwa się delikatny połysk,
- **statystyki** — na runicznej płycie, z własnymi prostymi ikonkami (atak, szybkość ataku, obrona, odporności),
- **kula HP** — **runiczny pierścień** ze spękanego żelaza, który powoli się obraca, a żar w rowkach run pulsuje (animacja wyłącza się przy systemowym „ogranicz ruch”); gra dalej pokazuje w środku swój poziom HP i procent,
- **dolny panel** — poczerniała oprawa, EXP w ciemnym karmazynie, ciemne sloty, a po bokach kuli **głowy kamiennych posągów demonów** patrzące na wprost (w całości w dolnej belce); **gdy w łupie albo w torbie pojawi się nowa legenda, ich oczy płoną na czerwono ogniem przez kilka sekund** (podgląd: **Ctrl+Alt+L**; legenda jest rozpoznawana wyłącznie po wyglądzie przedmiotów, jak w Kociej Nocy),
- **górna i dolna belka** — czerń z cienką kamienną krawędzią,
- **przyciski HUD** — **12 kamiennych kafli o różnym stopniu zniszczenia** (każdy pasek zaczyna od innego, więc sąsiednie przyciski się różnią), ikony w szarości, kolor gry (fiolet, niebieski) zostaje jako słaby poblask,
- **okna z ramką** — cienka (6 px) kamienna ramka 9-slice (`border-image`, skaluje się do każdego rozmiaru) z subtelnymi narożnikami w kształcie sierpowatych rogów z runą, mocno przygaszona ściana z płaskorzeźbą demona w tle, tytuł kapitalikami na czerni,
- **okna przezroczyste** (śledzone questy, sorter) — czerń z cienką obwódką,
- **dialog z NPC** — ta sama cienka rama z narożnikami,
- **sklep** — markiza przyciemniona do brązowej czerni, kamienna krawędź zamiast drewnianej belki,
- **ekwipunek, torby, statystyki, czat** — ciemna ilustracja w tle kolumn (spękana ściana z płaskorzeźbą demona, łańcuchami, runami i czaszkami, przyciemniona tak, by nie przeszkadzała w czytaniu), aktywne zakładki z cienką czerwoną kreską, kolory kanałów bez zmian,
- **tooltipy przedmiotów** — cienka kamienna ramka, ciemny nagłówek, kolory rzadkości bez zmian,
- **przyciski tekstowe** — kamienna oprawa; czerwony, niebieski i fioletowy przycisk gry zachowują znaczenie (stonowane),
- **paski postępu, scrollbary**,
- **wszystkie pozostałe okna gry** (dziennik zadań, gildia, społeczność, ustawienia, Premium, mapa świata i inne) — patrz niżej.

**Przemalowanie grafik gry w locie.** Gra rysuje większość interfejsu z kilkudziesięciu plików `/img/gui/*` (sam atlas `buttony.png` jest w ok. 180 regułach CSS). Skrypt pobiera te pliki z serwera gry, przemalowuje je w przeglądarce — drewno, brąz, pergamin i szarości zamienia w okopcony czarny kamień, a kolory znaczeniowe (złoto, zieleń statusów, błękit, czerwone znaczniki, jasne ikony) zostawia — i podmienia je w regułach CSS gry (ok. 320 reguł). Jasne, pergaminowe i szare tła w regułach są przyciemniane, a skaner w oknach rozjaśnia tekst, który był ciemny na pergaminie (neutralny → kość, kolorowy → ten sam odcień, jaśniej). Kopie grafik gry nie trafiają do repo — wszystko dzieje się lokalnie. Kursory, ramki rzadkości przedmiotów, ikony umiejętności i mapy zostają oryginalne. Wyłączenie motywu przywraca oryginalne grafiki i kolory bez przeładowania strony.

Mapa (canvas) i logika gry pozostają nietknięte — skrypt zmienia wyłącznie wygląd (CSS i grafiki interfejsu).

**Link instalacyjny:** https://raw.githubusercontent.com/Harkryn/Dodatki/main/margonem-dark-gothic/dark-gothic.user.js

Instalacja:
1. Zainstaluj rozszerzenie [Tampermonkey](https://www.tampermonkey.net/).
2. Otwórz link instalacyjny powyżej i kliknij **Zainstaluj**.
3. Wyłącz w Tampermonkey inne motywy interfejsu (Crimson Knight, Kocia Noc, nitheme) — zmieniają te same elementy.
4. Odśwież grę.

Aktualizacje: Tampermonkey sam pobiera nowe wersje z tego repo (albo ręcznie: Tampermonkey → Panel → „Sprawdź aktualizacje”).

Wyłączanie: **Ctrl+Alt+G** albo ikona Tampermonkey → „Dark Gothic: włącz / wyłącz” (wybór jest zapamiętywany).

Grafiki leżą w [assets/dark-gothic/](assets/dark-gothic/) (38 plików WebP, razem ok. 333 KB, każdy poniżej 40 KB) i są ładowane przez jsDelivr. Zostały wygenerowane modelem FLUX.1 Krea jako osobne elementy i zaakceptowane pojedynczo; tło wycięte kluczowaniem czerni, środek pierścienia kuli HP wycięty pod kulę gry, żar run wydzielony na osobną warstwę do animacji, kafle ujednolicone pod jasność. Zrzuty przed/po: [margonem-dark-gothic/screenshots/](margonem-dark-gothic/screenshots/).

## Margonem — Mroczna Gwiazda

Motyw w klimacie kosmicznej pustki: głęboka czerń przechodząca w przydymioną śliwkę, łososiowo-koralowe światło jako akcent, srebrny tekst z różowym odcieniem i ledwo widoczny gwiezdny pył na panelach. Inspirowany estetyką „mrocznej gwiazdy”, bez cudzych grafik i logo – grafiki są wygenerowane na Hugging Face (FLUX.1 Krea).

Paleta (zmienne CSS `--mds-*` w `:root` na początku bloku `css`) – czerń przechodząca w przydymioną śliwkę, światło łososiowo-koralowe: tła `#09060a` / `#120b13` / `#1c121e`, śliwka `#7a4878` (akcent), łososiowy koral `#ec8c80` (podświetlenia), ciemna śliwka `#3e2440` (obramowania), tekst `#dccbd6`, oszczędny błękit `#5a7bd8` (mana).

Funkcje:
- **okna i panele**: czarne tło z gwiezdnym pyłem, cienka śliwkowa krawędź, delikatna poświata, nagłówki z lekkim odstępem liter i śliwkową linią,
- **minimalistyczne narożniki** okien, dialogu z NPC i tooltipów: krótka linia z małym rombem dokładnie na krawędzi,
- **kolumna ekwipunku**: pola ekwipunku, torby i statystyki są półprzezroczyste z lekko przezroczystymi ramkami w śliwce,
- **kula HP jako czarna dziura**: wnętrze kuli jest czarne, płyną w nim dwie warstwy subtelnej mgławicy w śliwce i łososiowym koralu, a co kilka sekund przechodzi przez nie delikatny rozbłysk; poziom HP pokazuje cienka, jasna linia; wokół kuli w 3D krąży łososiowy pierścień cząstek (tylna połowa za kulą, przednia przed nią); przy HP poniżej 30% pierścień przechodzi w głęboką czerwień,
- **przemalowanie grafik gry w locie**: drewno, brąz i pergamin z plików `/img/gui/*` zamieniają się w śliwkową czerń, złote obszycia w śliwkę przechodzącą w róż; kolory znaczeniowe (złoto, zielone statusy, błękit, czerwone powiadomienia) zostają. Kopie grafik gry nie trafiają do repo,
- **przyciski**: ciemne, ze śliwkową obwódką i spokojnie pulsującą koralową poświatą po najechaniu; czerwone, zielone i niebieskie przyciski gry zachowują znaczenie,
- **zakładki, dialog z NPC, sklep, pola tekstowe, scrollbary, zaznaczenie tekstu** w stylu motywu,
- animacje są lekkie i wyłączają się przy systemowym „ogranicz ruch”.

Interfejsy: **NI** – pełne wsparcie. **SI** – podstawowe (okna, przyciski, pola tekstowe); selektory SI nie były jeszcze sprawdzone w grze i są oznaczone w kodzie `TODO: zweryfikuj selektor`. Mapa i sprite'y postaci nie są zmieniane.

**Link instalacyjny:** https://raw.githubusercontent.com/Harkryn/Dodatki/main/margonem-dark-star/margonem-dark-star.user.js

Instalacja:
1. Zainstaluj rozszerzenie [Tampermonkey](https://www.tampermonkey.net/).
2. Otwórz link instalacyjny powyżej i kliknij **Zainstaluj**.
3. Wyłącz w Tampermonkey inne motywy interfejsu (Dark Gothic, Crimson Knight, Kocia Noc, nitheme) — zmieniają te same elementy.
4. Odśwież grę. Nowe wersje Tampermonkey pobiera sam.

Wyłączanie: **Ctrl+Alt+D** albo ikona Tampermonkey → „Mroczna Gwiazda: włącz / wyłącz” (wybór jest zapamiętywany).

Grafiki leżą w [assets/dark-star/](assets/dark-star/) (PNG, do ok. 100 KB każdy) i są dołączane przez `@resource`, więc Tampermonkey aktualizuje je razem ze skryptem. Każdy element powstał w dwóch wariantach, z których wybrany jeden; prompty i parametry obróbki są w [PROMPTS.md](assets/dark-star/PROMPTS.md).

## Margonem — Czarna Dziura

Mroczny motyw interfejsu: głęboka czerń z lekkimi fioletowymi akcentami, kula HP jako czarna dziura z animowanym horyzontem zdarzeń, a w wybranych miejscach naturalny kamień z pęknięciami, które mienią się na fioletowo. Tekst, ikony przedmiotów, paski i czat zostają czytelne. Grafiki wygenerowane na Hugging Face (FLUX.1 Krea, seed 666) i obrobione lokalnie.

Co jest ostylowane:
- **kula HP** — sama kula jest cieniem czarnej dziury; wokół niej różowa korona, pierścień fotonowy i dysk akrecyjny widziany z boku. Bez obrotu: światło płynie wzdłuż dysku, jedna strona jaśnieje (efekt Dopplera), korona migocze. Poziom HP świeci w kuli jako ciemnoczerwona plazma, procent zostaje czytelny,
- **naturalny kamień** — każdy przycisk HUD (górny i dolny pasek) ma własny kafel szorstkiej skały z innym układem pęknięć (18 wariantów), a statystyki leżą na kamiennej płycie; w szczelinach przesuwa się fioletowy błysk (każdy przycisk w innej fazie),
- **okna z ramką** — cienka ramka 9-slice, czarne tło z ledwo widocznym pyłem, ciemna tabliczka tytułu (9-slice z outsetem, układ okna bez zmian), obsydianowy dysk zamykania z „X”, zakładki, panele, dolny pasek okna,
- **okna przezroczyste** (minimapa, obserwowane zadania) i **dialog z NPC** — czerń z cienką fioletową obwódką,
- **przyciski tekstowe** — czarna, szklista płytka z cienkim brzegiem (także fioletowe przyciski gry, np. „Kup złoto”); czerwone, złote i smocze przyciski gry bez zmian,
- **górna i dolna belka**, **tabliczka z imieniem (HUD)**, **listwa dolnego panelu** — czarny obsydian,
- **kolumny czatu i ekwipunku** — przygaszona ilustracja czarnej dziury z mgławicą (pod czatem dodatkowo przyciemniona),
- **ekwipunek, torba, sklep** — własne sloty, ciemne siatki, markiza sklepu przyciemniona do popielatych pasów,
- **paski** — HP w ciemnym szkarłacie, EXP w przygaszonym fiolecie (także dolny pasek EXP),
- **tooltipy przedmiotów** — czarna karta z cienką obwódką, kolory rzadkości bez zmian,
- **ekran ładowania** — przyciemniona czarna dziura z koroną zaćmienia, logo gry w jej środku,
- **suwaki** i wspólne elementy `interface-element-*` (nagłówki tabel i sekcji, linie, karty, kafle).

Animacje są lekkie i wyłączają się przy systemowym „ogranicz ruch”. Nie ruszane: ikony gry, podświetlenia przedmiotów do zadań. Dialog z NPC nie był jeszcze sprawdzony w grze. Mapa (canvas) i logika gry pozostają nietknięte.

**Link instalacyjny:** https://raw.githubusercontent.com/Harkryn/Dodatki/main/margonem-czarna-dziura/czarna-dziura.user.js

Instalacja:
1. Zainstaluj rozszerzenie [Tampermonkey](https://www.tampermonkey.net/).
2. Otwórz link instalacyjny powyżej i kliknij **Zainstaluj**.
3. Wyłącz w Tampermonkey inne motywy interfejsu (Dark Gothic, Mroczna Gwiazda, Crimson Knight, Kocia Noc) — zmieniają te same elementy.
4. Odśwież grę. Nowe wersje Tampermonkey pobiera sam.

Wyłączanie: **Ctrl+Alt+B** albo ikona Tampermonkey → „Czarna Dziura: włącz / wyłącz” (działa od razu, wybór jest zapamiętywany).

Grafiki leżą w [assets/czarna-dziura/](assets/czarna-dziura/) (56 plików WebP, razem ok. 140 KB) i są ładowane przez jsDelivr spod tagu wersji (`czarna-dziura-X.Y.Z`), więc po aktualizacji nie ma starych grafik z cache. Zrzuty przed/po: [margonem-czarna-dziura/screenshots/](margonem-czarna-dziura/screenshots/).

## Margonem — Fioletowa Pustka (Violet Void)

Mroczny motyw interfejsu w klimacie kosmicznej otchłani, w którym fiolet dominuje w całym UI: warstwy fioletowych teł, światło sączące się z wnętrza pustki (gradienty radialne w oknach), świecące krawędzie paneli i delikatne gwiezdne iskry w tle. Wszystkie elementy są oryginalne, bez grafik i motywów z innych gier. Najważniejsza jest czytelność: tekst czatu i tooltipów ma kontrast co najmniej WCAG AA, a poświaty nie leżą na treści.

Paleta (zmienne CSS `--vv-*` w sekcji „ZMIENNE”): tła `#0b0614` / `#140a24` / `#1c0f33`, fiolety `#4a1f7a` / `#6d2fb3` / `#8f45e6`, energia `#b57cff` / `#d9b8ff`, oszczędny akcent `#ff4fd8`, tekst `#e8ddff` i przygaszony `#9d8cc2`.

Funkcje:
- **okna** — fioletowe warstwy z poświatą od góry i od dołu, gwiezdne iskry, świecąca krawędź (rysowana cieniem, układ okien bez zmian), plakietka tytułu z poświatą, okrągły przycisk zamknięcia, zakładki,
- **okna przezroczyste** (minimapa, obserwowane zadania) i **dialog z NPC** — półprzezroczysta pustka z fioletową obwódką, podświetlenie odpowiedzi,
- **przyciski** — fioletowe płytki, które przy najechaniu rozświetlają się energią; czerwone, złote i smocze przyciski gry bez zmian,
- **wspólne panele** `interface-element-*` (nagłówki, karty, linie, dolne paski okien),
- **scrollbary, zaznaczenie tekstu, focus pól tekstowych** w kolorach motywu,
- **intensywność świecenia** — niska / średnia / wysoka, zapamiętywana,
- **przełącznik** — mały okrągły przycisk w lewym dolnym rogu (klik: włącz/wyłącz, prawy klik: intensywność), skróty i menu Tampermonkey; stan zapamiętywany.

Interfejsy: **NI** ma pełne wsparcie. **SI** ma na razie tylko podstawowe style (scrollbary, pola, zaznaczenie, główne okna), a jego selektory czekają na sprawdzenie w grze. Interfejs jest rozpoznawany po ciasteczku gry `interface`, potem po elementach strony. Mapa (canvas), sprite'y i logika gry pozostają nietknięte.

**Link instalacyjny:** https://raw.githubusercontent.com/Harkryn/Dodatki/main/margonem-violet-void/margonem-violet-void.user.js

Instalacja:
1. Zainstaluj rozszerzenie [Tampermonkey](https://www.tampermonkey.net/).
2. Otwórz link instalacyjny powyżej i kliknij **Zainstaluj**.
3. Wyłącz w Tampermonkey inne motywy interfejsu (Czarna Dziura, Mroczna Gwiazda, Dark Gothic, Crimson Knight, Kocia Noc) — zmieniają te same elementy.
4. Odśwież grę. Nowe wersje Tampermonkey pobiera sam.

Skróty:
- **Ctrl+Alt+V** — włącz/wyłącz motyw,
- **Ctrl+Alt+I** — intensywność świecenia (niska → średnia → wysoka).

Animacje są lekkie i wyłączają się przy systemowym „ogranicz ruch” (`prefers-reduced-motion`).
