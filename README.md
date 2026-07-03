# Pebble Habit Card Generator

Bulk-generates 1206×1499 PNG marketing cards from the habit spreadsheet,
using the Pebble app's real color palettes, pebble day-shapes, and icons.

## Run it

Open **`pebble-habit-card-generator.html`** in Chrome, Edge, or Firefox
(double-click it, or drag it into a browser tab). It's a single
self-contained file — no server, no install, works offline, and can be
copied anywhere on its own.

(`index.html` + the separate `.js` files are the editable source; they only
work when all files sit together in this folder. After editing them, rebuild
the single file — see "Rebuilding" below.)

## What it does

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
   **Generate All as ZIP**.

**Icons** are real app icons: the icon catalog from the app's icon picker
(`components/IconPicker.tsx`, 316 Ionicons + MaterialCommunityIcons glyphs,
fonts embedded as subsets). Each habit's icon is chosen in three tiers:

1. **Your saved override** (highest priority) — under the preview there's an
   **Icon** row: click **Change icon** to search all 316 icons (by name or
   keyword) and click one to assign it to the current habit; **Auto** reverts.
   Overrides are saved in the browser (localStorage) and are used in both the
   preview and the ZIP export, so you can guarantee any icon.
2. A **curated fix** for ~140 habits where automatic matching is wrong or has
   no signal (baked into `app.js`).
3. A **name-weighted keyword match** against the catalog — the habit's name
   counts more than its description, and generic words ("fast", "day",
   "watch", "pick", …) are ignored so they don't cause cross-domain matches.
   If nothing matches cleanly, it falls back to a small on-theme icon set for
   the habit's category (so abstract habits still look intentional, never
   random).

## Export layout

- **Group into folders of 4** (checked by default): the ZIP is split into
  `set-01/`, `set-02/`, … folders of 4 cards each. Within every folder the
  four habits come from four **different categories** and are rendered in
  four **different colors**, and no habit repeats across folders. Any habits
  left once fewer than four categories remain go into a trailing `zz-mixed/`
  folder (with the real spreadsheet the split is exact — 244 habits → 61
  folders, no leftovers). Re-roll the **Seed** (Shuffle) for a different
  grouping.
- Unchecked: a flat ZIP of `001-morning-stretch.png`, `002-20-squats.png`, …

## Rebuilding the single file

After changing any source file, run this from the folder:

```bash
python3 - << 'EOF'
import re
html = open("index.html").read()
inline = ""
for f in ["vendor/jszip.min.js", "habits.js", "palettes.js", "icons.js", "render.js", "app.js"]:
    src = open(f).read().rstrip("\n").replace("</script>", "<\\/script>")
    inline += f"<script>\n// {f}\n{src}\n</script>\n"
block = re.search(r'<script src="vendor/jszip\.min\.js"></script>.*?</body>', html, re.S).group(0)
open("pebble-habit-card-generator.html", "w").write(html.replace(block, inline + "</body>"))
print("rebuilt")
EOF
```

## Files

- `pebble-habit-card-generator.html` — the built, self-contained app (use this).
- `index.html` — source markup + styles.
- `habits.js` — the ~244 habits from the spreadsheet.
- `palettes.js` — app color palettes, pebble day-shapes, and theme tokens.
- `icons.js` — app icon catalog + embedded subset icon fonts.
- `render.js` — canvas rendering engine (card, heatmap, background, captions).
- `app.js` — UI wiring, live preview, and ZIP export.
- `vendor/jszip.min.js` — ZIP library.
