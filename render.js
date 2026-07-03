// Rendering engine: draws one Pebble-style habit card + 3 caption texts
// onto a canvas, at exactly 1206 x 1499 px.

const CANVAS_W = 1206;
const CANVAS_H = 1499;
const SCALE = CANVAS_W / 400; // design reference: ~400pt-wide phone layout

// Baseline layout, in canvas px. Sizes derived from the app's components at
// SCALE≈3: icon container 40pt, icon glyph 26pt, title 15pt/600, subtitle
// 13pt (Paragraph small), checkbox 40pt ("medium" CheckboxButton).
const LAYOUT = {
  cardMarginX: 100,
  cardPadding: 48,
  iconBox: 120,
  iconGlyph: 78,
  gapIconText: 36,
  titleFontSize: 45,
  subtitleFontSize: 39,
  titleSubtitleGap: 8,
  checkboxSize: 120,
  checkmarkSize: 66,
  topRowToHeatmapGap: 30,
  heatmapCols: 18,
  heatmapRows: 7,
  heatmapGap: 9,
  cardRadius: 36,
  cardBorderWidth: 1.5,
};

// User-adjustable settings and their defaults. `cardScale` scales the whole
// card block; caption values are absolute canvas px.
const DEFAULT_SETTINGS = {
  cardScale: 1,
  cardRadius: 36,      // corner roundedness (base px, scales with cardScale)
  offsetY: 0,          // shifts the whole card+text group vertically
  captionSize: 34,
  captionGap: 80,      // card bottom → first caption
  captionSpacing: 36,  // between captions
  captionMaxWidth: 960,
  captionColor: null,  // null → theme text/secondary split
  bgAnimation: "stripes", // "stripes" | "waves" | "none"
  bgColor: null,          // null → theme background
  cardBackground: null,   // null → theme card background (solid)
  showCard: true,         // false → export just the background (color + animation)
};

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function hexToRgb(hex) {
  const n = hex.replace("#", "");
  const num = parseInt(n, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function hexToRgba(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

// WCAG relative luminance, used to keep text/marks legible on any chosen
// card or page color regardless of the selected light/dark theme.
function relLuminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  const lin = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}
function isDarkColor(hex) {
  return relLuminance(hex) < 0.4;
}

// Content palette (title / subtitle / empty heatmap cell) chosen to read on a
// surface of the given background color.
function contentColorsFor(bgHex) {
  return isDarkColor(bgHex)
    ? { text: "#ECEDEE", textSecondary: "#9BA1A6", empty: "#3A3D40" }
    : { text: "#11181C", textSecondary: "#6B7280", empty: "#ECECEC" };
}

function drawRoundedRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// ─── Animated background, frozen as a static frame (components/AnimatedBackground.tsx) ──
function drawStripesBackground(ctx, w, h, theme, phase) {
  const spacing = 46 * SCALE;
  const strokeWidth = Math.max(1, 0.8 * SCALE);
  const count = Math.ceil((w + h) / spacing) + 4;
  const offset = ((phase % spacing) + spacing) % spacing;

  ctx.save();
  ctx.strokeStyle = hexToRgba(theme.stripeColor, theme.stripeOpacity * 1.6);
  ctx.lineWidth = strokeWidth;
  ctx.beginPath();
  for (let i = -2; i < count; i++) {
    const startX = i * spacing - h + offset;
    ctx.moveTo(startX, 0);
    ctx.lineTo(startX + h, h);
  }
  ctx.stroke();
  ctx.restore();
}

function drawWavesBackground(ctx, w, h, theme, phase) {
  const spacing = 46 * SCALE;
  const amp = 14 * SCALE;
  const freq = 0.022 / SCALE;
  const yStep = 8 * SCALE;
  const count = Math.ceil((w + h) / spacing) + 2;
  const offset = ((phase % spacing) + spacing) % spacing;

  ctx.save();
  ctx.strokeStyle = hexToRgba(theme.stripeColor, theme.stripeOpacity * 1.8);
  ctx.lineWidth = Math.max(1, 1 * SCALE * 0.5);
  ctx.beginPath();
  for (let i = -1; i < count; i++) {
    const base = i * spacing + offset - h;
    ctx.moveTo(base + amp * Math.sin(phase), 0);
    for (let y = yStep; y <= h + yStep; y += yStep) {
      ctx.lineTo(base + y + amp * Math.sin(y * freq + phase), y);
    }
  }
  ctx.stroke();
  ctx.restore();
}

// ─── Pebble day-shape silhouette (constants/habitDayShapes.ts) ──
// Hand-rolled SVG path parser: every pebble shape only uses M / C / Z
// (verified against the app source), and compiling to plain draw ops keeps
// this portable across canvas implementations without Path2D-from-string.
function parsePathD(d) {
  const tokens = d.match(/[MCZ]|-?\d*\.?\d+/g) || [];
  const ops = [];
  let i = 0;
  let cmd = null;
  while (i < tokens.length) {
    const t = tokens[i];
    if (t === "M" || t === "C" || t === "Z") {
      cmd = t;
      i++;
      if (cmd === "Z") ops.push({ type: "Z" });
      continue;
    }
    if (cmd === "M") {
      ops.push({ type: ops.some((o) => o.type === "M") ? "L" : "M", x: +tokens[i], y: +tokens[i + 1] });
      i += 2;
    } else if (cmd === "C") {
      ops.push({
        type: "C",
        x1: +tokens[i], y1: +tokens[i + 1],
        x2: +tokens[i + 2], y2: +tokens[i + 3],
        x: +tokens[i + 4], y: +tokens[i + 5],
      });
      i += 6;
    } else {
      i++; // stray numeral before any command; ignore defensively
    }
  }
  return ops;
}

const _shapePathCache = new Map();
function getShapeOps(shapeDef) {
  if (!_shapePathCache.has(shapeDef.id)) {
    _shapePathCache.set(shapeDef.id, parsePathD(shapeDef.d));
  }
  return _shapePathCache.get(shapeDef.id);
}

function parseViewBox(vb) {
  const parts = vb.split(/\s+/).map(Number);
  return { x: parts[0], y: parts[1], w: parts[2], h: parts[3] };
}

/** Draws a single pebble shape, filled with `color`, fit inside a `size`x`size` box. */
function drawShape(ctx, shapeDef, x, y, size, color) {
  const vb = parseViewBox(shapeDef.viewBox);
  const scale = Math.min(size / vb.w, size / vb.h);
  const drawW = vb.w * scale;
  const drawH = vb.h * scale;
  const offsetX = x + (size - drawW) / 2;
  const offsetY = y + (size - drawH) / 2;

  ctx.save();
  ctx.translate(offsetX, offsetY);
  ctx.scale(scale, scale);
  ctx.translate(-vb.x, -vb.y);

  ctx.beginPath();
  for (const op of getShapeOps(shapeDef)) {
    if (op.type === "M") ctx.moveTo(op.x, op.y);
    else if (op.type === "L") ctx.lineTo(op.x, op.y);
    else if (op.type === "C") ctx.bezierCurveTo(op.x1, op.y1, op.x2, op.y2, op.x, op.y);
    else if (op.type === "Z") ctx.closePath();
  }
  ctx.fillStyle = color;
  ctx.fill("evenodd");
  ctx.restore();
}

// ─── App icon glyphs (components/HabitIcon.tsx families, fonts embedded) ──
const ICON_FONT_FAMILY = { ion: "PebbleIonicons", mci: "PebbleMCI" };

/** Draws an app icon (Ionicons / MaterialCommunityIcons glyph) centered at (cx, cy). */
function drawIconGlyph(ctx, iconName, cx, cy, sizePx, color) {
  const glyph = ICON_GLYPHS[iconName];
  if (!glyph) {
    // Unknown icon — draw a filled circle placeholder rather than failing.
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx, cy, sizePx / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }
  ctx.save();
  ctx.font = `${sizePx}px ${ICON_FONT_FAMILY[glyph.family]}`;
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String.fromCodePoint(glyph.cp), cx, cy);
  ctx.restore();
}

// ─── Dummy completion grid (18 weeks x 7 days) ──
function generateDummyCompletions(rng, cols, rows) {
  // Habits look "alive": mostly filled, denser toward the most recent weeks,
  // with a few gaps and partial days scattered in — reads as a real streak.
  const grid = [];
  for (let c = 0; c < cols; c++) {
    const recency = c / (cols - 1);
    const fillChance = 0.55 + recency * 0.4;
    const col = [];
    for (let r = 0; r < rows; r++) {
      const roll = rng();
      let intensity, ratio;
      if (roll < fillChance * 0.78) {
        intensity = 2;
        ratio = 1;
      } else if (roll < fillChance) {
        intensity = 1;
        ratio = 0.35 + rng() * 0.4;
      } else {
        intensity = 0;
        ratio = 0;
      }
      col.push({ intensity, ratio });
    }
    grid.push(col);
  }
  // Force the final (today) cell to a satisfying "complete" state.
  grid[cols - 1][rows - 1] = { intensity: 2, ratio: 1 };
  return grid;
}

function intensityColor(cell, baseColor, emptyColor) {
  if (cell.intensity === 2) return baseColor;
  if (cell.intensity === 1) {
    const step = cell.ratio <= 0.35 ? 1 : cell.ratio <= 0.75 ? 2 : 3;
    const hexOpacity = Math.round((step / 4) * 255).toString(16).padStart(2, "0");
    return `${baseColor}${hexOpacity}`;
  }
  return emptyColor;
}

// ─── Text helpers ──
function truncateToWidth(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  const ellipsis = "…";
  let lo = 0, hi = text.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    const candidate = text.slice(0, mid).trimEnd() + ellipsis;
    if (ctx.measureText(candidate).width <= maxWidth) lo = mid;
    else hi = mid - 1;
  }
  return text.slice(0, lo).trimEnd() + ellipsis;
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";
  for (const word of words) {
    const attempt = current ? `${current} ${word}` : word;
    if (ctx.measureText(attempt).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = attempt;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * Renders one full habit-card marketing image onto `ctx` (sized CANVAS_W x
 * CANVAS_H). `opts`:
 *   habit: { name, description, text1, text2, text3 }
 *   icon: app icon name (e.g. "barbell-outline" or "mci:yoga")
 *   paletteId, colorRole, shapeId, theme ("light"|"dark"), seedOffset
 *   settings: overrides merged over DEFAULT_SETTINGS
 */
function renderHabitCard(ctx, opts) {
  const { habit, icon, paletteId, colorRole, shapeId, theme: themeName, seedOffset = 0 } = opts;
  const S = { ...DEFAULT_SETTINGS, ...(opts.settings || {}) };
  const theme = APP_THEME[themeName] || APP_THEME.light;
  const palette = HABIT_PALETTES[paletteId] || HABIT_PALETTES.default;
  const habitColor = palette.colors[colorRole] || palette.colors.teal;
  const shapeDef = HABIT_DAY_SHAPE_DEFINITIONS.find((s) => s.id === shapeId) || HABIT_DAY_SHAPE_DEFINITIONS[0];
  const rng = mulberry32(hashString(habit.name + "|" + seedOffset));

  // Card-block layout scaled by cardScale. Every metric (padding, icon,
  // fonts, heatmap gap) scales by k, and the card's overall width is a scaled
  // fraction of the canvas, centered — so the whole card (heatmap included)
  // grows and shrinks uniformly.
  const k = S.cardScale;
  const L = {};
  for (const key of Object.keys(LAYOUT)) L[key] = LAYOUT[key] * k;
  L.heatmapCols = LAYOUT.heatmapCols;
  L.heatmapRows = LAYOUT.heatmapRows;

  const baseCardWidth = CANVAS_W - LAYOUT.cardMarginX * 2;
  const cardWidth = baseCardWidth * k;
  const cardX = (CANVAS_W - cardWidth) / 2;
  const cardRadius = S.cardRadius * k;
  const innerWidth = cardWidth - L.cardPadding * 2;

  // ── Measure dynamic pieces first so we can vertically center the group ──
  const titleMaxW = innerWidth - L.iconBox - L.gapIconText - L.checkboxSize - 24 * k;
  ctx.font = `600 ${L.titleFontSize}px ${FONT_STACK}`;
  const titleText = truncateToWidth(ctx, habit.name, titleMaxW);

  ctx.font = `400 ${L.subtitleFontSize}px ${FONT_STACK}`;
  const subtitleText = habit.description ? truncateToWidth(ctx, habit.description, titleMaxW) : "";

  const topRowTextHeight =
    L.titleFontSize + (subtitleText ? L.titleSubtitleGap + L.subtitleFontSize : 0);
  const topRowHeight = Math.max(L.iconBox, L.checkboxSize, topRowTextHeight);

  const heatmapCubeSize = (innerWidth - (L.heatmapCols - 1) * L.heatmapGap) / L.heatmapCols;
  const heatmapHeight = L.heatmapRows * heatmapCubeSize + (L.heatmapRows - 1) * L.heatmapGap;

  const cardHeight = L.cardPadding + topRowHeight + L.topRowToHeatmapGap + heatmapHeight + L.cardPadding;

  const captionLineHeight = Math.round(S.captionSize * 1.38);
  ctx.font = `500 ${S.captionSize}px ${FONT_STACK}`;
  const captionTexts = [habit.text1, habit.text2, habit.text3].filter((t) => t && t.trim());
  const captionBlocks = captionTexts.map((t) => wrapText(ctx, t, S.captionMaxWidth));
  const captionHeights = captionBlocks.map((lines) => lines.length * captionLineHeight);
  const captionsTotalHeight =
    captionHeights.reduce((a, b) => a + b, 0) + S.captionSpacing * Math.max(0, captionBlocks.length - 1);

  const groupHeight = cardHeight + (captionsTotalHeight > 0 ? S.captionGap + captionsTotalHeight : 0);
  const groupTop = Math.max(40, (CANVAS_H - groupHeight) / 2 + S.offsetY);

  // Effective surface colors + legible content colors derived from them, so
  // any chosen page/card color keeps text and marks readable.
  const pageBg = S.bgColor || theme.background;
  const cardBg = S.cardBackground || theme.cardBackground;
  const pageDark = isDarkColor(pageBg);
  const content = contentColorsFor(cardBg);
  const cardBorder = isDarkColor(cardBg)
    ? "rgba(255,255,255,0.12)"
    : "rgba(17,24,28,0.1)";

  // ── Background ──
  ctx.fillStyle = pageBg;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  const bgPhase = rng() * 400;
  // Stripe/wave lines follow the page luminance (light lines on dark pages).
  const bgTheme = {
    stripeColor: pageDark ? "#FFFFFF" : "#000000",
    stripeOpacity: pageDark ? 0.09 : 0.06,
  };
  if (S.bgAnimation === "stripes") drawStripesBackground(ctx, CANVAS_W, CANVAS_H, bgTheme, bgPhase);
  else if (S.bgAnimation === "waves") drawWavesBackground(ctx, CANVAS_W, CANVAS_H, bgTheme, bgPhase);

  // Background-only export: stop here, leaving just the color + animation.
  if (!S.showCard) return;

  // ── Card surface (solid fill) ──
  const cardY = groupTop;
  drawRoundedRectPath(ctx, cardX, cardY, cardWidth, cardHeight, cardRadius);
  ctx.fillStyle = cardBg;
  ctx.fill();
  drawRoundedRectPath(ctx, cardX, cardY, cardWidth, cardHeight, cardRadius);
  ctx.lineWidth = L.cardBorderWidth;
  ctx.strokeStyle = cardBorder;
  ctx.stroke();

  // ── Top row: icon, title/subtitle, checkbox ──
  const rowX = cardX + L.cardPadding;
  const rowY = cardY + L.cardPadding;

  drawIconGlyph(
    ctx,
    icon,
    rowX + L.iconBox / 2,
    rowY + topRowHeight / 2,
    L.iconGlyph,
    habitColor
  );

  const textX = rowX + L.iconBox + L.gapIconText;
  const textBlockY = rowY + (topRowHeight - topRowTextHeight) / 2;

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = content.text;
  ctx.font = `600 ${L.titleFontSize}px ${FONT_STACK}`;
  ctx.fillText(titleText, textX, textBlockY + L.titleFontSize * 0.82);

  if (subtitleText) {
    ctx.fillStyle = content.textSecondary;
    ctx.font = `400 ${L.subtitleFontSize}px ${FONT_STACK}`;
    ctx.fillText(
      subtitleText,
      textX,
      textBlockY + L.titleFontSize + L.titleSubtitleGap + L.subtitleFontSize * 0.78
    );
  }

  // Checkbox — "completed" state of the app's medium CheckboxButton: solid
  // habit-color circle + Ionicons checkmark glyph.
  const cbSize = L.checkboxSize;
  const cbCx = cardX + cardWidth - L.cardPadding - cbSize / 2;
  const cbCy = rowY + topRowHeight / 2;
  ctx.beginPath();
  ctx.arc(cbCx, cbCy, cbSize / 2, 0, Math.PI * 2);
  ctx.fillStyle = habitColor;
  ctx.fill();
  ctx.save();
  ctx.font = `${L.checkmarkSize}px ${ICON_FONT_FAMILY.ion}`;
  // Checkmark follows the theme (matches the app): white in light mode,
  // near-black in dark mode — regardless of the habit color's lightness.
  ctx.fillStyle = themeName === "dark" ? "#0A0A0A" : "#FFFFFF";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String.fromCodePoint(CHECKMARK_CP), cbCx, cbCy);
  ctx.restore();

  // ── Heatmap ──
  const heatmapY = rowY + topRowHeight + L.topRowToHeatmapGap;
  const grid = generateDummyCompletions(rng, L.heatmapCols, L.heatmapRows);
  for (let c = 0; c < L.heatmapCols; c++) {
    for (let r = 0; r < L.heatmapRows; r++) {
      const cell = grid[c][r];
      const color = intensityColor(cell, habitColor, content.empty);
      const cx = rowX + c * (heatmapCubeSize + L.heatmapGap);
      const cy = heatmapY + r * (heatmapCubeSize + L.heatmapGap);
      drawShape(ctx, shapeDef, cx, cy, heatmapCubeSize, color);
    }
  }

  // ── Captions below the card (sit on the page, so they contrast with it) ──
  let ty = cardY + cardHeight + S.captionGap;
  ctx.textAlign = "center";
  const pageContent = contentColorsFor(pageBg);
  const capColors = [pageContent.text, pageContent.textSecondary, pageContent.textSecondary];
  captionBlocks.forEach((lines, i) => {
    ctx.font = `500 ${S.captionSize}px ${FONT_STACK}`;
    ctx.fillStyle = S.captionColor || capColors[i] || pageContent.textSecondary;
    lines.forEach((line, li) => {
      ctx.fillText(line, CANVAS_W / 2, ty + S.captionSize * 0.82 + li * captionLineHeight);
    });
    ty += lines.length * captionLineHeight + S.captionSpacing;
  });
}

const FONT_STACK =
  "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
