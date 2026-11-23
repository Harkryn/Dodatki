# Tamahagane – prompty grafik

Generowane w Hugging Face (Z-Image Turbo), dalej obrobione lokalnie (Pillow).

## ciecz-orba.webp (256×256, bezszwowa)
Abstract texture of glowing deep red liquid fire swirling in black water, slow spiralling currents of dark blood red and crimson light, tiny glowing ember specks suspended in the liquid, soft focus, no solid objects, no coals, fills the entire frame, no text

Obróbka: kadr 768×768 ze środka, jasność → paleta (#140202 … #c42a2a), przenikanie krawędzi w obu osiach (kafel bez szwów), zmniejszenie do 256 px.

## maska-oni.webp (179×256, przezroczyste tło) – ornament na końcach dolnego paska
Model: Qwen-Image (mcp-tools/Qwen-Image), negative prompt: photorealistic, photo, realistic, text, watermark, blurry, low resolution
Stylized hand-painted dark fantasy game art illustration of a Japanese oni demon mask, front view, RPG interface ornament, nearly black charcoal mask with a subtle dark red tint, glowing red ember eyes, two short dark horns, snarling fanged mouth, painterly brush strokes, soft red rim light, simple bold shapes readable at small size, not photorealistic, isolated on plain flat light grey background

Obróbka: tło usunięte BiRefNet (Upsampler/birefnet-background-removal), krawędzie oczyszczone z koloru tła, kadr i zmniejszenie z premultiplikacją.

## Dolny pasek – Qwen-Image (mcp-tools/Qwen-Image), negative prompt: photorealistic, photo, realistic, text, watermark, blurry, low resolution
Tło usuwane BiRefNet (Upsampler/birefnet-background-removal), krawędzie oczyszczone z koloru tła, zmniejszanie z premultiplikacją.

### pasek-tlo.webp (kafel 107×120, bez szwów)
Stylized hand-painted dark fantasy game UI texture, seamless tileable horizontal strip, black lacquered wood with grain running horizontally, soft painted glossy highlight band near the top, darker toward the bottom, one thin dim dark red line close to the top edge and one close to the bottom edge, fills the entire image edge to edge with no background, uniform, painterly, not photorealistic
Obróbka: kadr środka (równe światło), jasność 90 %, przenikanie krawędzi w poziomie.

### ramka-slotu.webp (74×80)
Stylized hand-painted dark fantasy game UI item slot frame, a single square frame of dark rough iron with a thin glowing dark red inner edge like smouldering embers, the center of the frame is completely empty plain light grey, front view, game interface asset, painterly, not photorealistic, isolated on plain flat light grey background
Obróbka: jasny cień w środku usunięty. W grze każdy slot ma inne ułożenie (obrót/odbicie), jasność i rytm żaru.

### rama-orba.webp (248×264, otwór r 72 px w (127, 134))
Stylized hand-painted dark fantasy game UI frame for a round health orb, a thick ring of dark iron carved with swirling clouds, glowing red ember cracks running through the metal, two small demon horns on top of the ring, the large circular center is completely empty plain light grey, front view, game interface asset, painterly, not photorealistic, isolated on plain flat light grey background

### separator.webp (50×120)
Negative prompt: text, letters, characters, seal, stamp, feather, objects, watermark
A single vertical brush stroke of dark crimson red ink painted from top to bottom, sumi-e calligraphy style, dry brush streaks, tapered ends, a few tiny ink splatter dots, centered on plain white paper with lots of empty space, minimal, nothing else
Obróbka: przezroczystość liczona z jasności tuszu na białym papierze.

## Górna tabliczka – Qwen-Image (negative jak wyżej; ikony dodatkowo: pixel art, pixelated, 8-bit, kanji, square background)
### maska-boczna.webp (175×256, patrzy w lewo; prawa strona = odbicie w CSS)
Stylized hand-painted dark fantasy game art illustration of a Japanese oni demon mask in three-quarter side view facing left, looking to the left, RPG interface ornament, nearly black charcoal mask with a subtle dark red tint, glowing red ember eyes, two short dark horns, snarling fanged mouth, painterly brush strokes, soft red rim light, simple bold shapes readable at small size, not photorealistic, isolated on plain flat light grey background
### ikona-zlota.webp (64×51)
Stylized hand-painted dark fantasy game currency icon, a small neat stack of three oval Japanese koban gold coins with simple engraved horizontal lines, warm aged gold with soft painted highlights and dark outline, painterly brush strokes, bold simple silhouette, not photorealistic, isolated on plain flat light grey background
### ikona-smoczych-lez.webp (47×64)
Stylized hand-painted dark fantasy game currency icon, a single smooth crimson red teardrop crystal, a dragon's tear, glowing ember light inside, bright painted highlight near the top, dark outline, painterly brush strokes, bold simple silhouette, not photorealistic, isolated on plain flat light grey background
### rama-tabliczki.webp (600×205; wnętrze 141/45 – 458/144 px, 9-slice)
Negative: photorealistic, photo, realistic, text, letters, watermark, blurry, low resolution, anything inside the frame, mask, face, helmet, torii
Stylized hand-painted dark fantasy game UI nameplate frame, a very long and low horizontal frame of dark rough iron with glowing red ember cracks, perfectly flat straight top edge, both the left and the right end widen into a large round iron medallion socket, the bottom edge has a small downward pointed ornament in the center, the long inside of the frame is completely empty plain light grey, front view, game interface asset, painterly, not photorealistic, isolated on plain flat light grey background
Obróbka: szare wnętrze wycięte (zalanie od środka), szpic ze środka dołu usunięty (w tym miejscu wisi medalion PvP), jasny rąbek przy wnętrzu przygaszony.

## Okna, przyciski, kolumny – Qwen-Image (negative: photorealistic, photo, realistic, text, letters, watermark, blurry, low resolution)
### okno-rama.webp (256×258, 9-slice: wycinek 32)
Stylized hand-painted dark fantasy game UI window frame, a large square frame with a thin border of dark rough iron stones with glowing red ember cracks, slightly thicker ornamented corners with small iron spikes, the whole inside of the frame is completely empty plain light grey, front view, game interface asset, painterly, not photorealistic, isolated on plain flat light grey background
### okno-tytul.webp (300×130, końce 62 px)
Stylized hand-painted dark fantasy game UI window title plate, a long narrow horizontal plaque of dark iron with glowing red ember cracks, pointed tapered ends, flat blank face for text, front view, game interface asset, painterly, not photorealistic, isolated on plain flat light grey background
### przycisk.webp (150×78, 9-slice: wycinek 22, fill)
Stylized hand-painted dark fantasy game UI button, a single wide rectangular button of glossy black lacquer with a forged iron rim and small iron rivets in the corners, a faint red ember glow along the bottom edge, blank flat face for a label, front view, game interface asset, painterly, not photorealistic, isolated on plain flat light grey background
### kolumna-tlo.webp (384×384, zakotwiczona u dołu kolumn)
Negative: photorealistic, photo, realistic, text, watermark, objects, bright, high contrast, blurry
Stylized hand-painted dark fantasy game UI background texture, seamless tileable panel of black lacquered wood with subtle vertical grain and faint drifting dark red smoke, very dark overall, low contrast so text stays readable on top, fills the entire image, painterly, not photorealistic

## ramka-cienka.webp (Qwen-Image, BiRefNet, 128×131, 9-slice 9 10 10 9)
Stylized hand-painted dark fantasy game UI panel border, a simple square frame made of a very thin strip of dark forged iron with a faint glowing red ember line along the inner edge and tiny cracks at the corners, empty center, isolated on plain light grey background, game asset, painterly

## przelacznik.webp (Qwen-Image, BiRefNet, 64×64)
Stylized hand-painted small Japanese tsuba sword guard of dark rough iron with glowing red ember cracks, openwork flame cut-outs, a glowing ember slot in the center, top view, isolated on plain light grey background, game icon, painterly

## medalion-pvp.webp (Qwen-Image, BiRefNet, 48×61, otwór wycięty)
Stylized hand-painted small round dark iron ring with glowing red ember cracks, a small pointed iron hook on top, the center is an empty round socket, isolated on plain light grey background, game UI ornament, painterly

## podkreslenie.webp (Z-Image Turbo 21:9; alfa z jasności na czerni, wygaszone końce, 400×22)
Stylized painterly illustration: a pure black empty background with one single hair-thin horizontal crack line in the middle, slightly jagged, glowing faintly with deep red magma, a few tiny hairline branches, the line tapers and fades out at both ends. Minimal, subtle, lots of empty black space, no rocks, no fire.

## tooltip-rama.webp (Qwen-Image 1:1, BiRefNet, wnętrze uzupełnione z oryginału, 256×255, 9-slice 40 + fill)
Stylized hand-painted dark fantasy game UI tooltip panel, front view, square, a thin frame of dark forged iron with fine glowing red lava cracks, small sharp iron spike ornaments on the four corners, the inside is a flat very dark charcoal black panel with a faint smoky texture and a subtle dark red glow near the top edge, empty, no text, isolated on plain flat light grey background, painterly game asset, symmetric

## tooltip-tlo.webp (Z-Image Turbo 4:3, przyciemniony lokalnie, 640×480; skrypt przebarwia chmury na kolor rangi)
Full-frame flat texture, hand-painted stylized: deep warm black lacquer surface (#0b0707) with very faint soft drifting smoke wisps in dark warm grey and a subtle hint of deep crimson, like diluted sumi-e ink wash clouds spread across the whole surface, very low contrast, no blue, no teal, no frame, no border, no objects, no symbols, no letters, fills the whole image edge to edge

## kolumna-kafel.webp (pochodna kolumna-tlo.webp, bez nowego promptu)
Górne 150 px kolumna-tlo (samo drewno) z przenikaniem 46 px, żeby kafel łączył się bez szwu w pionie. kolumna-tlo.webp dostał wygaszoną alfą górę (90 px), więc przechodzi w kafel – tło kolumn sięga pełnej wysokości ekranu.

## guzik-hud.webp (kafel B2 z arkusza Qwen-Image, BiRefNet; arkusz 4 obrotów 512×128)
Game UI asset sheet, 2 by 2 grid of four square button plates on plain flat light grey background, evenly spaced, same size, all glossy black lacquer square plates with a thin dark forged iron rim and a faint red ember line inside, each with a different small iron corner fitting: first with small square corner caps, second with round rivets, third with small angular kanagu brackets on two opposite corners, fourth with tiny flame-shaped iron corners; compact, fittings stay within the plate outline, each with an empty flat black square center, front view, stylized hand-painted painterly dark fantasy
(wybrany kafel 2 – żelazna obręcz z rombowym nitem; obrócony 4 razy, nit: dół, góra, lewo, prawo)

## premium-ikony.webp (Qwen-Image 4:3, 2 arkusze 3×2, BiRefNet; siatka 4×3 po 72 px, ikony 60 px z żarzącą się poświatą)
Game icon sheet, 3 columns by 2 rows grid of six separate icons on plain flat light grey background, evenly spaced, same style: stylized hand-painted dark fantasy objects made of dark forged iron with glowing red-orange ember details. Top row: a small treasure chest with iron bands and ember glow in the keyhole; a price tag with a percent sign cut out glowing like embers; a burning flame inside an iron hourglass. Bottom row: a round glass potion bottle with glowing red liquid and iron stopper; a cut gemstone with a glowing upward arrow above it; a stack of three dark gold ingots with ember edge glow. Painterly, bold readable silhouettes, front view
Drugi arkusz (ten sam początek): Top row: a radiant sun emblem of iron with glowing ember rays; a swirling glowing ember portal ring; a small black raven bird with ember eyes. Bottom row: a samurai armor chest plate of dark iron with red cords; a tied leather sack bag with an ember glow at the knot; a rolled parchment scroll with iron end caps and a red ember seal.

## markiza.webp (Qwen-Image 16:9, BiRefNet; dolny pas 271×44 + jego odbicie)
Stylized hand-painted dark fantasy game UI element: a wide straight horizontal shop awning seen from the front, made of dark forged iron plates riveted together with a scalloped lower edge of pointed iron spikes, thin glowing red lava cracks between the plates, alternating darker and lighter iron segments, spans the full image width from left edge to right edge, short height, plain flat light grey background below, front view, painterly

## Przyciemnienie (2.17.0, bez nowych promptów)
Wszystkie grafiki motywu oprócz ikon i cieczy kuli HP przyciemnione lokalnie: piksele poza lawą × 0,68, lawa/żar (ciepły jasny kolor silniejszy od błękitu) bez zmian.
2.17.1: kamień i żelazo w ramach, przyciskach, guzikach HUD, markizie, tooltipie, medalionie i tsubie jeszcze raz × 0,62 (razem ~0,42 pierwotnej jasności), lawa bez zmian.

## rama-tabliczki-{chmury,szpice,rogi,habaki}.webp – smukłe style górnej ramki (Qwen-Image 16:9, wybór: Ctrl+Alt+R)
Wspólny początek: Stylized hand-painted dark fantasy game UI nameplate frame, a very long low horizontal (rectangular) frame ... ; koniec: the long inside of the frame is completely empty plain light grey, front view, game interface asset, painterly, not photorealistic, isolated on plain flat light grey background
Negative: photorealistic, photo, realistic, text, letters, watermark, blurry, low resolution, thick, massive, bulky, medallion, anything inside the frame
- chmury (seed 1376060487): made of a THIN slim band of dark forged iron, delicate and light, small carved swirling cloud scroll ornaments only at the left and right ends, a few hair-thin glowing red ember cracks
- szpice (seed 1633156813, negative + sword, blade, weapon, knife): of a slim dark iron band, the left and right short sides taper outward into a single sharp elegant point, one thin glowing red lava crack running along the top band, minimal and light
- rogi (seed 2100265740): of thin glossy black lacquer with a fine dark iron edging, two small curved demon horns rising at the top left and top right corners, faint red ember glow at the horn bases
- habaki (seed 1512321190, negative + sword): shaped like a katana blade collar, a thin dark steel band with small flared brass-and-iron clips at the left and right ends like a habaki, subtle red ember glow at the clips, slim and refined
Obróbka: klucz jasnego tła i szarego wnętrza (ciemność + nasycenie), odkażenie krawędzi, otwór wyznaczony zalaniem od środka; żelazo ×0,5 (żar bez zmian); zapis w 2× skali wyświetlania (otwór = 124 px wysokości).
