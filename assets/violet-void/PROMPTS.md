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

## Runda 3 — przyciski HUD (44×44 w grze, plik 88×88) – A, B, C, D odrzucone (za jasne)

Obróbka jak w rundzie 2 + przyciemnienie szarości (fiolet bez zmian), wnętrze kształtu wypełnione `#0c0a10`.

### przycisk-hud — 768×768
- **A** (seed 1619217288): Single square game UI button tile, top-down flat view on pure black background. A bevelled square of polished black volcanic glass with a wide flat matte dark center left completely empty. Narrow raised rim with sharp clean bevel. In each of the four corners one tiny dark amethyst crystal shard set into the rim, faint violet inner light. Mostly black and charcoal, symmetrical, no icon, no text, no glow cloud
- **B** (seed 252762227): Single octagonal game UI button tile with clipped corners, top-down flat view on pure black background. Rim cut like a dark gemstone: many small sharp obsidian facets radiating around a flat smooth black center that is left completely empty. One hairline crack in the rim glowing faint violet. No corner decorations, mostly black and dark graphite, symmetrical, no icon, no text, no glow cloud
- **C** (seed 1839704300): Single square game UI button tile, top-down flat view on pure black background. Matte rough black stone slab with slightly chipped edges, a row of tiny dark pyramid crystal studs set along all four edges of the rim, flat smooth dark recessed center left completely empty. Very dark charcoal, only a faint violet sheen on a few studs. Symmetrical, no icon, no text, no glow
- **D** (seed 969616485): Top-down view of a single hexagonal crystal cross-section used as a game UI button, dark smoky quartz, flat polished black hexagonal face in the middle left completely empty, surrounded by a thin ring of six angled crystal facets whose inner edges catch a faint amethyst violet light. Pure black background, very dark, symmetrical, no icon, no text, no glow cloud
- **E** (seed 137537435, przyciemniona mocniej): Single square game UI button tile, top-down flat view on pure black background. Almost pitch black obsidian slab, the rim only barely distinguishable by a hairline dark grey bevel catching very faint light, flat pure black center left empty. In one corner a single tiny dim amethyst sliver embedded in the rim. Extremely dark, low key lighting, minimal, no icon, no text, no glow
- **F** (seed 980621447, przyciemniona mocniej): Single square game UI button tile, top-down flat view on pure black background. Rough charred black basalt stone block with deep shadowed cracks along its edges, a very faint dim violet light seeping from inside one thin crack only. Flat dark center left empty. Extremely dark, low key lighting, gloomy, mostly pure black with dark charcoal texture, no icon, no text, no glow cloud

**Wybrany: F.** Na prośbę o mniej monotonne przyciski dogenerowane 5 kolejnych kamieni w tym stylu; wszystkie 6 × 4 obroty
trafiły do atlasu `hud-buttons.webp` (352×528, kafel 88×88, kolumny = obrót 0/90/180/270°, wiersze = kamień).
Prompty dodatkowych kamieni (ta sama obróbka co F):
- **F2** (seed 852563594): … Rough charred black basalt stone block with deep shadowed cracks along its edges, a very faint dim violet light seeping from a short thin crack in the top right corner only …
- **F3** (seed 1301363551): … Weathered black volcanic basalt slab with chipped broken corners and a network of shadowed cracks, a very faint dim violet glow inside a thin crack running along the bottom edge only …
- **F4** (seed 1978154897): … Charred black basalt block, rough uneven edges, two tiny forked cracks in opposite corners leaking a very faint dim violet light …
- **F5** (seed 835741469): … Heavy black basalt stone with a deep diagonal split across one corner, faint dim violet light glowing deep inside the split, other edges rough and dark …
- **F6** (seed 82186131): … Rough charred black basalt block with crumbled edges and fine hairline cracks, only a few tiny specks of dim violet light visible deep in the cracks along the right edge …

(Pominięte „…” to wspólny początek i koniec promptu F: „Single square game UI button tile, top-down flat view on pure black background.” oraz „Flat dark center left empty. Extremely dark, low key lighting, gloomy, mostly pure black with dark charcoal texture, no icon, no text, no glow cloud”.)
