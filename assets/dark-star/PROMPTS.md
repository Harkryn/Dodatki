# Mroczna Gwiazda – prompty grafik

Każdy element jest generowany w dwóch wyraźnie różnych wariantach (A/B). Do repo trafia tylko wybrany wariant.
Styl: **minimalistyczny** – cienkie linie, jeden mały akcent, dużo pustej przestrzeni.

Obróbka (bez zewnętrznych narzędzi, WIC w Windows PowerShell):
- tło usunięte **kluczowaniem czerni**: alfa = jasność piksela (szum tła poniżej 12/255 → przezroczysty), kolor odwrócony z mieszania z czernią, więc poświata zostaje półprzezroczysta,
- przycięcie do narożnika, ramiona dodatkowo zanikają w ostatnich 40% rozmiaru (smoothstep),
- skalowanie do 256×256 PNG (wyświetlane ok. 64 px, więc ostre na ekranach 2x),
- jeden plik na lewy górny róg, pozostałe rogi to lustrzane odbicia w CSS.

## Narożnik okna (`okno-naroznik`)

Model: **Z-Image Turbo** (Hugging Face, `mcp-tools/Z-Image-Turbo`), 1024×1024, 8 kroków, shift 3.

### Wariant A – srebrna linia z gwiazdką
> Minimalist UI corner accent on pure black background. In the upper-left area: one thin straight silver-white hairline going horizontally to the right and one going vertically down, meeting at a sharp 90 degree corner, both lines gradually fading out toward their ends. A tiny four-pointed star sparkle sits exactly on the corner point with a faint lavender glow. Nothing else, lots of empty black space, flat 2D vector style, no text.

Seed: 49484 · przycięcie: x 168, y 138, bok 780 px

### Wariant B – fioletowa linia z rombem
> Minimalist UI corner accent on pure black background. In the upper-left area: a short thin muted violet line going horizontally to the right and one going vertically down, meeting at a sharp 90 degree corner, both short and fading out at the ends. At the corner point a small solid diamond (rhombus) in muted violet with a very subtle dim purple glow. Nothing else, lots of empty black space, flat 2D vector style, no text.

Seed: 619841 · przycięcie: x 196, y 158, bok 760 px

### Odrzucone (zbyt rozbudowane)
FLUX.1 Krea-dev: srebrny filigran z zawijasami (seed 471057449) i odłamki obsydianu (seed 1373239555).
FLUX przy „minimalist” dawał wygięte linie albo neon – do prostych form lepiej sprawdza się Z-Image Turbo.
