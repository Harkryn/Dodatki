# Fioletowa Pustka — prompty grafik

Model: FLUX.1 Krea-dev (Hugging Face, `mcp-tools/FLUX.1-Krea-dev`), domyślne ustawienia (24 kroki, guidance 4.5).
Wszystkie grafiki generowane na czystej czerni. Obróbka lokalna (Pillow): alfa = jasność najjaśniejszego kanału,
kolor odzyskany przez podzielenie przez alfę, przycięcie do treści, zmniejszenie, zapis jako WebP.
W repo trafia tylko wybrany wariant; odrzucone zostają poza repo (`assets/_propozycje/` jest w `.gitignore`).

## Runda 1 (odrzucona – za dużo fioletu, wiry, luźne ramki)

### ramka (9-slice okien) — 768×768
- **A** (seed 1253033098): Isolated UI corner ornament on pure black background, L-shaped fantasy window frame corner made of sharp jagged dark violet crystal shards and obsidian splinters, edges glowing intense bright lilac energy #b57cff, small cracks leaking violet light, strong glow, flat game interface asset, centered, no text, no characters, symmetrical diagonal composition, pure black #000000 empty background
- **B** (seed 402802893): Isolated UI corner ornament on pure black background, elegant L-shaped window frame corner of thin curling filigree that spirals into a small swirling galaxy vortex, dark purple metal lines with soft faint lavender glow, delicate tiny stars along the curls, subtle and refined, flat game interface asset, no text, no characters, pure black #000000 empty background

### wir-naglowka (poświata za tytułem okna) — 1024×384
- **A** (seed 2072429108): Wide horizontal elliptical gravitational vortex seen at an angle, swirling accretion disk of violet and lilac light spiraling into a dark center, purple #8f45e6 and pale lavender #d9b8ff streaks, cosmic energy swirl, game UI header decoration, isolated on pure black #000000 background, no text, no characters, no planets
- **B** (seed 1479475573): Compact collapsing star implosion, small bright white-violet core with sharp radial light rays and thin shockwave rings pulled inward, deep purple and magenta-tinted lilac glow, starburst emblem, game UI header decoration, isolated on pure black #000000 background, no text, no characters

### separator — 1280×256
- **A** (seed 749418856): Thin horizontal divider line for a fantasy game interface, a razor-thin glowing violet beam fading out at both ends with a single small bright four-pointed lilac star in the exact center, tiny sparkles, minimal elegant, isolated on pure black #000000 background, no text
- **B** (seed 2000782372): Horizontal divider for a fantasy game interface, a wavy flowing ribbon of purple void energy like a sine wave with three small glowing violet orbs strung along it, dark purple #4a1f7a to bright lilac #b57cff, plasma wisps, isolated on pure black #000000 background, no text

## Runda 2 — kryształy, ciasno dopasowane, mrok z fioletowym akcentem

Obróbka: alfa liczona dla ciemnych, litych obiektów (jasność ≥ 40 = pełne krycie); ramki składane z lewej górnej
ćwiartki odbitej na cztery strony (identyczne narożniki), 192×192 px, 9-slice: wycinek 30 px → krawędź 15 px.

### ramka-krysztal (9-slice okien) — 768×768
- **A** (seed 505583348): Flat front view of an empty square game UI window frame on pure black background. The frame band is very thin and tightly fitted, made of small dark obsidian crystal facets packed edge to edge in a narrow even strip. In each of the four corners a compact cluster of three short black crystal shards. Faint violet light only along a few facet edges and corner tips. Dark, mostly black and charcoal, no glow fill, empty black center, no text
- **B** (seed 1995743975, przyciemniona do 55%): Flat front view of an empty square game UI window frame on pure black background. A thin smooth bevelled band of polished black volcanic glass, very narrow and straight, with one hairline crack along it that glows faint violet. Only the four corners are decorated: sharp angular amethyst-black crystal points growing diagonally outward from each corner, dark with violet inner light. Mostly black, minimal, empty black center, no text

### tabliczka-tytulu — 1024×256
- **A** (seed 674300731): Wide flat game UI title plate on pure black background, a long narrow horizontal plaque of dark obsidian crystal with faceted edges, ends terminating in small sharp crystal shards pointing sideways, a thin faint violet line running along the bottom edge, empty dark center for text, mostly black and charcoal, subtle, no text, no glow cloud
- **B** (seed 1556598933): Wide flat game UI title plate on pure black background, a narrow horizontal bar of matte black stone with a row of tiny dark crystal studs set into its top and bottom edges, and at the centre top a single small upright violet-tinted crystal gem, sharp angular silhouette with clipped corners, very dark, empty middle for text, no text, no glow cloud
