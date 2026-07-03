# Pebble Habit Card Generator

Bulk-generates 1206×1499px PNG marketing cards, one per habit from the
[habit spreadsheet](https://docs.google.com/spreadsheets/d/1W3iLURcDfE8Ggcr0BntwtLrTl0WBs3oUqu8Pm3PWgYE),
styled with the real Pebble app color palettes and pebble shapes.

## Run it

Open **`pebble-habit-card-generator.html`** in Chrome, Edge, or Firefox
(double-click it, or drag it into a browser tab). It's a single
self-contained file — no server, no install, works offline, and can be
copied anywhere on its own.

(`index.html` + the separate `.js` files are the editable source; they only
work when all files sit together in this folder. After editing them, rebuild
the single file — see "Rebuilding" below.)

## What it does

Each card reproduces the app's habit row (icon, title, subtitle, checkbox,
18-week completion heatmap) inside a glass card, floating over a static
snapshot of the app's diagonal-stripe animated background. Below the card,
the 3 marketing caption texts from the spreadsheet are centered.

1. **Color palettes** — pick one or more of the app's 9 palettes (Default,
   Pastel, Vibrant, Earth, Sunset, Forest, Berry, Citrus, Midnight).
2. **Pebble shapes** — pick one or more of the app's 14 day-shapes.
3. **Habits to include** — filter by category, or generate all ~244.
4. **Style** — light/dark theme, and how palette/shape/color get assigned
   per habit: cycle through your selection in order, or randomize with a
   reproducible seed (same seed + same selections = same output).
5. **Card & text layout** — sliders for card size (scales the whole card,
   heatmap included), corner radius, vertical position, caption text size,
   card→text gap, spacing between captions, and text max width; plus a
   caption text color (or theme default).
6. **Background** — stripes / waves / none, a custom page color, and a
   custom card color (each with a theme-default toggle). The card is a
   solid fill, not translucent. Title, subtitle, heatmap empty cells, and
   captions recolor automatically to stay legible on whatever page/card
   colors you pick; the checkmark follows the theme (white in light mode).
   A **Background only** toggle hides the card and text so you can export
   just the page color + animation as a 1206×1499 PNG.
7. Preview any card before running the full batch (Prev/Next/Random), then
   **Generate All as ZIP** to render every selected habit and download one
   zip of PNGs, named `001-morning-stretch.png`, `002-20-squats.png`, etc.

**Icons** are real app icons: the icon catalog from the app's icon picker
(`components/IconPicker.tsx`, 316 Ionicons + MaterialCommunityIcons glyphs,
fonts embedded as subsets). Each habit gets its icon by keyword-matching the
habit's name/description against the catalog, falling back to a seeded-random
icon from the sections matching the habit's category.

## Updating the habit list

`habits.js` is a static snapshot of the spreadsheet (244 rows: category,
name, description, text1–3). If the sheet changes, re-export it and replace
that file — each entry has the shape:

```js
{ num, category, name, description, text1, text2, text3 }
```

## Rebuilding the single file

After changing any source file, run this from the folder:

```bash
python3 - << 'EOF'
import re
html = open("index.html").read()
inline = ""
for f in ["vendor/jszip.min.js", "habits.js", "palettes.js", "icons.js", "render.js", "app.js"]:
    src = open(f).read().replace("</script>", "<\\/script>")
    inline += f"<script>\n// {f}\n{src}\n</script>\n"
block = re.search(r'<script src="vendor/jszip\.min\.js"></script>.*?</body>', html, re.S).group(0)
open("pebble-habit-card-generator.html", "w").write(html.replace(block, inline + "</body>"))
print("rebuilt")
EOF
```

## Files

- `index.html` / `app.js` — UI: pickers, preview, bulk export (JSZip)
- `render.js` — the drawing engine (stripes background, glass card, pebble
  shapes via a small SVG-path interpreter, heatmap, captions)
- `palettes.js` — palettes + shapes + theme tokens, copied verbatim from the
  Pebble app repo (`constants/habitPalettes.ts`, `constants/habitDayShapes.ts`,
  `constants/theme.ts`) so colors/shapes stay pixel-identical to the app
- `habits.js` — the spreadsheet data
- `vendor/jszip.min.js` — bundled locally so this works fully offline
