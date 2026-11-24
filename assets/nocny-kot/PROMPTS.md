# Nocny Kot – prompty grafik

Styl: malowany (wybrany 2026-11-24 zamiast kreskówki). Model: Qwen-Image (mcp-tools/Qwen-Image), 16 kroków.
Negative prompt (wspólny): photorealistic, photo, realistic, 3d render, cartoon, chibi, thick outline, flat colors, text, letters, watermark, pixel art, busy background, logo (+ dopiski przy elementach).
Od 2026-11-24 nowe grafiki powstają wyłącznie lokalnie w ComfyUI (RX 7900 XT).
Tło: jasne, płaskie → usuwane lokalnie (alfa z różnicy koloru względem tła z miękkim przejściem, oczyszczenie koloru krawędzi), kadr i zmniejszenie z premultiplikacją (Pillow). Oczy: alfa z jasności na czarnym tle. Ekran wczytywania: malowany od razu na czerni, brzegi wygaszone.

## spiacy-kot.png (240×123) – kot śpiący na krawędzi czatu
Stylized hand-painted game art illustration of a black cat sleeping stretched out on its belly along the top of a thin flat horizontal ledge, one front paw and the tail hanging lazily down over the front edge, eyes closed, natural cat proportions, soft painterly shading, subtle fur texture, glossy charcoal black fur with a soft violet rim light along the back, small violet collar, elegant and cozy, not cartoon, not photorealistic, side view, centered, isolated on plain flat light grey background
Negative +: bread, food, pillow, furniture

## kot-minimapa.png (160×118) – kot zaglądający zza krawędzi minimapy
Stylized hand-painted game art illustration of a black cat peeking up from behind a straight horizontal edge, only its head and two front paws resting on the edge visible, curious big amber-yellow eyes, natural cat proportions, soft painterly shading, subtle fur texture, glossy charcoal black fur with a soft violet rim light, elegant and cute, not cartoon, not photorealistic, front view, centered, isolated on plain flat light grey background
Obróbka (2026-11-24, lokalne ComfyUI): przeskalowany do 1168×880 i przepuszczony przez RMBG 3.0 razem z klatką liżącą, przycięty tym samym prostokątem – obie klatki pokrywają się co do piksela.

## ogonek.png (81×180) – ogon na krawędzi kolumny
Stylized hand-painted game art illustration of one long black cat tail only, hanging straight down from the top edge of the image, gently swaying, its lower end curling into a soft hook, fluffy rounded tip, soft painterly shading, subtle fur texture, glossy charcoal black fur with a soft violet rim light on one side, elegant, not cartoon, not photorealistic, centered, isolated on plain flat light grey background
Negative +: cat body, head, ears, eyes, paws

## odcisk.png (48×42) – odcisk łapki
Game UI icon: a single cat paw print made of one main pad and four toe pads, each pad painted as a soft glossy dark charcoal bean with a gentle violet glow and violet rim highlight on its top edge, stylized hand-painted, soft painterly shading, readable at small size, not cartoon, not photorealistic, centered, isolated on plain flat light grey background

## lapka-hp.png (200×217) – łapka HP
Game HUD element: the underside of a black cat paw seen straight from below, one rounded paw shape with four toe bumps along the top, soft dusty-pink toe beans and a large pink main pad, short glossy black fur between and around the pads, stylized hand-painted, soft painterly shading, subtle fur texture, soft violet rim light, symmetric, not cartoon, not photorealistic, centered, isolated on plain flat light grey background
Negative +: claws, arm, leg, face, eyes

## uszko-l.png, uszko-p.png (58×72, 57×72) – uszy nad oknami
Two separate fluffy black cat ears drawn as standalone shapes far apart: one ear at the far left and one ear at the far right of the image, with completely empty space between them and nothing connecting them, each ear slightly rounded with a long lynx-like black fur tuft on its tip and soft lavender fluffy inner fur, straight flat bottom edge, stylized hand-painted with soft painterly shading and fur texture, glossy charcoal black with violet sheen, not cartoon, not photorealistic, isolated on plain flat light grey background
Negative +: head, face, eyes, nose, cat body, headband, hair, band, arc. Obróbka: obraz rozcięty na lewe i prawe ucho.

## przelacznik.png (64×64) – przełącznik motywu
Game UI button icon: an elegant black cat sitting upright seen from behind, looking back over its shoulder, tail curled around its paws, in front of a small glowing violet crescent moon, natural cat proportions, stylized hand-painted with soft painterly shading and subtle fur texture, glossy charcoal black fur with soft violet rim light, readable at small size, not cartoon, not photorealistic, centered, isolated on plain flat light grey background
Obróbka: przycięty do fioletowego kafelka.

## ekran-ladowania.webp (480×480) – ekran wczytywania
Stylized hand-painted game loading screen illustration on a near-black night background: an elegant black cat seen from behind sitting on a thin straight stone ledge, looking up at a large softly glowing violet crescent moon above it, its long tail hanging down below the ledge, a few tiny faint violet stars, the cat's fur lit by violet moonlight rim light, natural cat proportions, soft painterly shading, subtle fur texture, calm and dreamy, not cartoon, not photorealistic, the edges of the image fade smoothly into pure black vignette, centered composition
Negative +: roof, house, buildings, city, second cat, bright sky, blue sky, yellow, clouds

## oczy.png (120×47) – oczy na ekranie wczytywania
Stylized hand-painted game art illustration of only a pair of glowing cat eyes in total darkness, two almond-shaped eyes side by side, luminous amber-gold irises with narrow vertical slit pupils, soft wet highlight, faint violet glow around them, a barely visible hint of black fur around the eyes, mysterious, not cartoon, not photorealistic, centered, wide image, on plain solid black background

## ikony-hud.png (1200×60) – 20 ikon przycisków HUD (lokalne ComfyUI)
Model: Z-Image Turbo (zimage_api, 8 kroków, CFG 1, 768×768, batch 2), tło: RMBG 3.0, kadr i zmniejszenie z premultiplikacją do 56 px w polu 60×60.
Wspólny szablon: `Game UI icon of <PRZEDMIOT>, with a small cute black cat detail integrated into it (tiny cat ears on top, or a cat paw, or a curled cat tail), stylized hand-painted, soft painterly shading, dark charcoal and soft lavender silver with gentle violet glow highlights, simple bold silhouette readable at small size, elegant, not cartoon, not photorealistic, centered, isolated on a plain flat light grey background, no text, no letters`
Przedmioty w kolejności arkusza: exit – an arched wooden door standing ajar with a small arrow pointing out of it; world-icon – a small floating planet with a thin orbit ring and tiny stars; config – a single gear cog; rewards-calendar-icon – a small calendar page tied with a ribbon bow like a gift; clans – a heraldic kite shield with two crossed swords behind it; globe – a terrestrial globe on a small stand; party – three small hooded adventurer figures standing together; inventory-browser-icon – a magnifying glass over a small leather backpack; matchmaking-icon – two crossed swords; chat – a rounded speech bubble with three dots; photo – an old-fashioned camera; portable-map-icon – a folded parchment map with a dotted path; compass – a round compass with a needle; loot-filter-icon – a funnel with a few coins falling into it; timer-icon – an hourglass with flowing sand; star – a five-pointed star; skills – an open spell book with a glowing rune above it; friends – two small hearts overlapping; scroll – a rolled parchment quest scroll with a wax seal; news-icon – a small hand bell.

## rama-hud.png (100×104) – ramka przycisku HUD z uszkami (lokalne ComfyUI)
Model: Z-Image Turbo, tło: RMBG 3.0, środek wycięty (wypełnienie od środka), szerokość 100 px.
Square game UI button frame with softly rounded corners, smooth dark charcoal lacquer border with a thin glowing violet inner rim and two tiny black cat ears sticking up from the top edge, the center is completely empty plain light grey, stylized hand-painted, soft painterly shading, elegant, not cartoon, not photorealistic, front view, centered, isolated on a plain flat light grey background, no text, no letters

## zloto.png (42×42) – złoto (lokalne ComfyUI)
Model: Z-Image Turbo, tło: RMBG 3.0.
Game currency icon: a small neat stack of round gold coins, the top coin engraved with a cat paw print, warm aged gold with soft painterly highlights and a faint violet rim light, stylized hand-painted, bold simple silhouette readable at small size, not cartoon, not photorealistic, centered, isolated on a plain flat light grey background, no text, no letters

## smocze-lzy.png (42×42) – smocze łzy (lokalne ComfyUI)
Model: Z-Image Turbo, tło: RMBG 3.0.
Game currency icon: a single glowing teardrop-shaped crystal gem, deep crimson red fading to violet inside with a bright inner sparkle, faceted, stylized hand-painted, soft painterly shading, bold simple silhouette readable at small size, not cartoon, not photorealistic, centered, isolated on a plain flat light grey background, no text, no letters

## futro.png (240×237) – futrzana ramka okien (lokalne ComfyUI)
Model: Z-Image Turbo (1024×1024), tło: RMBG 3.0. Używana jako border-image (sierść ~20% boku).
Square picture frame made entirely of soft fluffy black cat fur, thick even fur border with short wispy hairs sticking out on the outer and inner edges, subtle violet sheen on the fur, the center is completely empty plain light grey, front view, symmetric, stylized hand-painted, soft painterly shading, elegant, not cartoon, not photorealistic, centered, isolated on a plain flat light grey background, no text, no letters

## zdobienie-hp.png (1180×216) – zdobienie wokół łapki HP (lokalne ComfyUI)
Model: Z-Image Turbo (1536×384), tło: RMBG 3.0, szarość w gnieździe i spiralach wycięta.
Wide horizontal game HUD ornament, in the middle an empty round socket ring for a health orb, on both sides two long fluffy black cat tails curling outward into elegant spirals along a thin dark charcoal metal bar with violet glow accents, symmetric, front view, stylized hand-painted, soft painterly shading, elegant, not cartoon, not photorealistic, centered, isolated on a plain flat light grey background, no text, no letters

## pasek-exp.png (500×43) – ramka paska expa (lokalne ComfyUI)
Model: Z-Image Turbo (1536×192), tło: RMBG 3.0, kanał w środku wycięty. Wypełnienie (żółte, z połyskiem) rysuje CSS.
Long thin horizontal progress bar frame, dark charcoal lacquer border with a thin glowing violet rim, the empty inner channel is plain light grey, a small cat paw print emblem at the left end, front view, stylized hand-painted, soft painterly shading, elegant, not cartoon, not photorealistic, centered, isolated on a plain flat light grey background, no text, no letters
