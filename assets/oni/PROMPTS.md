# Oni – prompty grafik

Generowane w Hugging Face (Z-Image Turbo), dalej obrobione lokalnie (Pillow).

## ciecz-orba.webp (256×256, bezszwowa)
Abstract texture of glowing deep red liquid fire swirling in black water, slow spiralling currents of dark blood red and crimson light, tiny glowing ember specks suspended in the liquid, soft focus, no solid objects, no coals, fills the entire frame, no text

Obróbka: kadr 768×768 ze środka, jasność → paleta (#140202 … #c42a2a), przenikanie krawędzi w obu osiach (kafel bez szwów), zmniejszenie do 256 px.

## maska-oni.webp (179×256, przezroczyste tło) – ornament na końcach dolnego paska
Model: Qwen-Image (mcp-tools/Qwen-Image), negative prompt: photorealistic, photo, realistic, text, watermark, blurry, low resolution
Stylized hand-painted dark fantasy game art illustration of a Japanese oni demon mask, front view, RPG interface ornament, nearly black charcoal mask with a subtle dark red tint, glowing red ember eyes, two short dark horns, snarling fanged mouth, painterly brush strokes, soft red rim light, simple bold shapes readable at small size, not photorealistic, isolated on plain flat light grey background

Obróbka: tło usunięte BiRefNet (Upsampler/birefnet-background-removal), krawędzie oczyszczone z koloru tła, kadr i zmniejszenie z premultiplikacją.
