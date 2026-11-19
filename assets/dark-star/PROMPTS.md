# Mroczna Gwiazda – prompty grafik

Każda grafika motywu jest generowana na **Hugging Face**, zawsze w dwóch wyraźnie różnych wariantach (A/B). Do repo trafia tylko wybrany wariant.

Obróbka po generowaniu (WIC w Windows PowerShell; usuwanie tła na HF – `not-lain/background-removal` – było niedostępne):
- tło usunięte **kluczowaniem czerni**: alfa = jasność piksela (szum tła poniżej progu → przezroczysty), kolor odwrócony z mieszania z czernią, więc poświata zostaje półprzezroczysta,
- przycięcie i skalowanie (pliki są ok. 2× większe niż na ekranie, więc ostre na ekranach 2x),
- tła nieprzezroczyste: JPEG, opcjonalnie przyciemnione (`Dim`), żeby nie przeszkadzały w czytaniu.

## Narożnik okna (`okno-naroznik`) – wybrany B

Model: Z-Image Turbo (`mcp-tools/Z-Image-Turbo`), 1024×1024, 8 kroków, shift 3.

### Wariant A – srebrna linia z gwiazdką
> Minimalist UI corner accent on pure black background. In the upper-left area: one thin straight silver-white hairline going horizontally to the right and one going vertically down, meeting at a sharp 90 degree corner, both lines gradually fading out toward their ends. A tiny four-pointed star sparkle sits exactly on the corner point with a faint lavender glow. Nothing else, lots of empty black space, flat 2D vector style, no text.

Seed: 49484 · przycięcie: x 168, y 138, bok 780 px

### Wariant B – fioletowa linia z rombem (wybrany)
> Minimalist UI corner accent on pure black background. In the upper-left area: a short thin muted violet line going horizontally to the right and one going vertically down, meeting at a sharp 90 degree corner, both short and fading out at the ends. At the corner point a small solid diamond (rhombus) in muted violet with a very subtle dim purple glow. Nothing else, lots of empty black space, flat 2D vector style, no text.

Seed: 619841 · przycięcie: x 196, y 158, bok 760 px · kluczowanie: próg 12, ramiona zanikają od 60%, wynik 256×256 PNG

**Pliki:** `okno-naroznik-tl.png` (+ lustrzane `-tr`, `-bl`, `-br`).

---

Pozostałe elementy: **FLUX.1 Krea-dev** (`mcp-tools/FLUX.1-Krea-dev`), guidance 4,5. Kwadraty 1024×1024 i 768×768 – 28 kroków (przy 40 space przekracza limit czasu), panoramy 1344×448 i pionowe 576×1344 – 40 kroków.

## Horyzont zdarzeń – pierścień kuli HP (`horyzont`) – seria 1, odrzucona (A i B)

- **A – pierścień fotonowy** (seed 332528351; przycięcie x/y 112, bok 800; próg 14; 240×240 PNG; w grze ok. 75 px, czarny środek dokładnie wokół kuli):
  > Professional game UI asset: black hole event horizon viewed face-on, a razor-thin luminous photon ring of violet and pale lavender light encircling a perfectly black void, a delicate fainter secondary lensed ring just inside it, soft accretion haze hugging the ring, centered and perfectly circular, isolated on pure black background, cinematic astrophysics render, ultra detailed, no stars, no text
- **B – dysk akrecyjny** (seed 1600353497; przycięcie x/y 32, bok 960; próg 14; 232×232 PNG; w grze ok. 140 px – wiry wychodzą poza dolną belkę):
  > Professional game UI asset: supermassive black hole seen from directly above, a swirling accretion disk of glowing violet, magenta and white-hot plasma spiralling into a perfectly black circular void in the exact center, fine filaments and motion streaks, bright inner rim fading to dark outer edge, centered composition, isolated on pure black background, cinematic render, ultra detailed, no text

## Osobliwość – wypełnienie kuli HP (`osobliwosc`) – seria 1, odrzucona (A i B)

Tekstura wypełnienia kuli (gra przycina ją do poziomu HP). JPEG 256×256, jakość 88.

- **A – wir plazmy z jasnym punktem** (seed 643000282; przycięcie x/y 192, bok 640):
  > Square texture filling the entire frame edge to edge: a cosmic singularity, deep crimson and dark violet plasma swirling in a tight logarithmic spiral toward a tiny brilliant white point at the exact center, glowing red energy filaments, dense liquid-like flow, rich blood red as the dominant color, cinematic render, ultra detailed, no black borders, no text
- **B – soczewkowanie gwiazd wokół czarnego jądra** (seed 2077652041; przycięcie x/y 262, bok 500):
  > Square texture filling the entire frame: a singularity made of starlight bent by extreme gravitational lensing, red and violet stars stretched into curved arcs spiralling inward toward a dark crimson core rimmed by a thin glowing red ring, blood red and deep purple dominant, astrophotography render, ultra detailed, no borders, no text

## Mgławica pod tabliczką z imieniem (`mglawica`) – wybrany B

- **A – szeroka wstęga mgławicy** (seed 1794657247; wycinek x 0, y 80, 1344×290; próg 8; 496 px szerokości PNG):
  > A long thin horizontal band of breathtaking cosmic nebula floating on pure black background, soft glowing violet and deep purple gas clouds dominant, delicate lavender highlights and a whisper of blue, tiny bright stars embedded in the clouds, intricate dust lanes, the band fades smoothly into black at both ends and at top and bottom, professional astrophotography, ultra detailed, wide panoramic, no text
- **B – wstążka z jasną gwiazdą w środku – wybrany → `mglawica.png`** (seed 1881437375; wycinek x 0, y 60, 1344×320; próg 8; 520 px szerokości PNG):
  > A slender horizontal ribbon of luminous violet nebula on pure black background, flowing like silk, a single brilliant white-violet star glowing at its center with soft diffraction spikes, magenta and indigo filaments trailing to both sides, fine dust lanes and sparkling star specks, violet dominant, fades smoothly to black at all edges, professional astrophotography, ultra detailed, wide panoramic, no text

## Tło bocznych kolumn (`tlo-kolumn`) – seria 1, odrzucona (A i B)

JPEG 288×672, przyciemnione.

- **A – odległa czarna dziura u dołu** (seed 908957077; Dim 0,6). Uwaga: model narysował ją z pierścieniami jak planetę:
  > Very dark vertical space background for a game UI panel, almost entirely black: in the lower third a distant black hole with a thin violet photon ring and a soft tilted accretion halo, faint gravitational lensing bending a few dim stars around it, the upper two thirds nearly empty deep black with sparse faint stars, muted and low contrast, elegant, professional cinematic render, no text
- **B – byt astralny z gwiezdnego pyłu** (seed 524171063; Dim 0,3):
  > Very dark vertical space background for a game UI panel, almost entirely black: a faint ghostly astral entity woven from drifting violet stardust and thin glowing threads, abstract and faceless, a tall flowing veil-like silhouette rising from the bottom, a small black void where its heart would be, barely visible against the darkness, muted and low contrast, ethereal, professional cinematic render, no text

## Gwiezdny pył na panelach (`pyl`) – seria 1, odrzucona (A i B)

Przezroczysty kafel nakładany na tła okien. PNG 384×384 (kafel w grze ok. 192 px), próg 10.

- **A – srebrne drobinki i gwiazdy** (seed 1270353620):
  > Seamless tileable texture of faint stardust on pure black background: sparse tiny silver-lavender specks of varying size and brightness scattered evenly, a few slightly brighter pinpoint stars with soft glow, very occasional faint violet glints, no clouds, no nebula, no large objects, elegant and minimal, ultra detailed, no text
- **B – fioletowy pył z czteroramiennymi iskrami** (seed 791383082):
  > Seamless tileable texture of fine cosmic dust on pure black background: extremely fine soft violet and lavender dust grains drifting in faint wispy diagonal streaks, a handful of tiny sharp four-pointed sparkles, subtle and delicate, low density, no large stars, no clouds, elegant and minimal, ultra detailed, no text

## Ikona przełącznika motywu (`ikona`) – seria 1, odrzucona (A i B)

PNG 96×96 (w grze 22 px).

- **A – czteroramienna gwiazda** (seed 1518490252; przycięcie x/y 130, bok 508; próg 14):
  > Small elegant game UI icon centered on pure black background: a single radiant four-pointed star of violet and white light with long thin sharp rays and a soft lavender glow, crisp and polished, symmetrical, lots of empty black space around it, professional icon design, ultra detailed, no text
- **B – mała czarna dziura** (seed 957010531; przycięcie x/y 150, bok 468; próg 45 – tło modelu nie było czyste):
  > Small elegant game UI icon centered on pure black background: a tiny black hole, a perfectly black sphere surrounded by a thin bright violet photon ring and a slim tilted glowing accretion disk, crisp and polished, lots of empty black space around it, professional icon design, ultra detailed, no text

## Odrzucone

- Narożnik: FLUX.1 Krea – srebrny filigran z zawijasami (seed 471057449) i odłamki obsydianu (seed 1373239555) – zbyt rozbudowane.
- Pierwsza seria pierścienia kuli, ozdoby pod tabliczką i tła kolumn (minimalistyczne linie i romby, Z-Image Turbo) – zastąpiona motywem czarnych dziur.
- Szkice horyzontu, osobliwości, mgławicy i tła w Z-Image Turbo (8 kroków) – zastąpione dopracowanymi wersjami z FLUX.1 Krea.
