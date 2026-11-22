# Oni – prompty grafik

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
