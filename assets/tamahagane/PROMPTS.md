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
