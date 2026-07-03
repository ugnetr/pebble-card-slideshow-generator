// UI wiring: selection state, live preview, bulk zip export.

const state = {
  selectedPalettes: new Set(["default"]),
  selectedShapes: new Set(["1"]),
  selectedCategories: new Set(),
  theme: "light",
  assignMode: "cycle", // "cycle" | "random"
  seed: 1,
  previewIndex: 0,
  settings: { ...DEFAULT_SETTINGS },
};

// ── Icon fonts (subset Ionicons + MaterialCommunityIcons from the app) ──
let iconFontsReady = false;
async function loadIconFonts() {
  const toBuf = (b64) => {
    const bin = atob(b64);
    const buf = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
    return buf.buffer;
  };
  const faces = [
    new FontFace("PebbleIonicons", toBuf(ICON_FONTS_B64.ion)),
    new FontFace("PebbleMCI", toBuf(ICON_FONTS_B64.mci)),
  ];
  await Promise.all(faces.map((f) => f.load()));
  faces.forEach((f) => document.fonts.add(f));
  iconFontsReady = true;
}

// ── Icon assignment: keyword-match the habit against the app's icon catalog ──
const ALL_ICONS = ICON_SECTIONS.flatMap((s) => s.icons);

// Spreadsheet category → icon-picker sections to draw from when the habit's
// own words don't match any icon keywords.
const CATEGORY_ICON_SECTIONS = {
  "Body & Movement": ["Fitness & Gym"],
  "Food & Hydration": ["Food & Drink"],
  "Mind & Mindfulness": ["Health & Wellness"],
  "Gratitude & Positivity": ["Health & Wellness", "People & Social"],
  "Learning & Growth": ["Study & Work"],
  "Creativity": ["Hobbies & Entertainment"],
  "Productivity & Focus": ["Productivity & Goals"],
  "Relationships & Social": ["People & Social"],
  "Money & Finance": ["Shopping & Money"],
  "Digital Wellbeing": ["Tech & Devices"],
  "Sleep & Evening": ["Health & Wellness"],
  "Morning Rituals": ["Health & Wellness", "Home & Tools"],
  "Home & Environment": ["Home & Tools"],
  "Nature & Senses": ["Nature & Animals", "Weather"],
  "Self-Reflection": ["Health & Wellness", "Study & Work"],
  "Out-of-the-Box Habits": ["Hobbies & Entertainment"],
  "Work & Career": ["Study & Work", "Productivity & Goals"],
  "Emotional Fitness": ["Health & Wellness"],
  "Brain Training": ["Study & Work", "Productivity & Goals"],
  "Kindness & Contribution": ["People & Social"],
  "Speech & Communication": ["People & Social"],
  "Play & Joy": ["Hobbies & Entertainment"],
  "Bonus: Tiny Skill Practice": ["Hobbies & Entertainment"],
};

// Generic words that appear in most habit rows and produce misleading
// single-keyword icon matches ("day" → calendar, "bar" → bar-chart, …).
const ICON_STOPWORDS = new Set([
  "day", "days", "daily", "once", "one", "two", "three", "five", "ten",
  "min", "mins", "minute", "minutes", "second", "seconds", "hour", "time",
  "times", "any", "full", "tiny", "small", "bar", "sit", "add", "per",
]);

function assignIcon(habit) {
  // Primary signal: the habit's own words. Category is only a fallback pool.
  const text = `${habit.name} ${habit.description}`.toLowerCase();
  const tokens = new Set(
    text.split(/[^a-z]+/).filter((w) => w.length > 2 && !ICON_STOPWORDS.has(w))
  );

  let bestScore = 0;
  let ties = [];
  for (const ic of ALL_ICONS) {
    let score = 0;
    for (const kw of ic.keywords) {
      for (const w of kw.toLowerCase().split(/\s+/)) {
        if (tokens.has(w)) score += 2;
      }
    }
    for (const t of ic.name.replace(/^mci:/, "").replace(/-outline$/, "").split("-")) {
      if (t.length > 2 && tokens.has(t)) score += 3;
    }
    if (score > bestScore) {
      bestScore = score;
      ties = [ic.name];
    } else if (score === bestScore && score > 0) {
      ties.push(ic.name);
    }
  }

  const rng = mulberry32(hashString(`${state.seed}|icon|${habit.name}`));
  if (ties.length > 0) return ties[Math.floor(rng() * ties.length)];

  // No word match — seeded random from the sections matching the category.
  const sectionNames = CATEGORY_ICON_SECTIONS[habit.category];
  const pool = sectionNames
    ? ICON_SECTIONS.filter((s) => sectionNames.includes(s.label)).flatMap((s) => s.icons)
    : ALL_ICONS;
  return pool[Math.floor(rng() * pool.length)].name;
}

const categories = [...new Set(HABITS.map((h) => h.category))];
state.selectedCategories = new Set(categories);

function filteredHabits() {
  return HABITS.filter((h) => state.selectedCategories.has(h.category));
}

/** Deterministic style assignment for the habit at `index` within `list`. */
function styleForIndex(index, list) {
  const palettes = [...state.selectedPalettes];
  const shapes = [...state.selectedShapes];
  if (palettes.length === 0) palettes.push("default");
  if (shapes.length === 0) shapes.push("1");

  if (state.assignMode === "random") {
    const rng = mulberry32(hashString(`${state.seed}|${list[index].name}`));
    return {
      paletteId: palettes[Math.floor(rng() * palettes.length)],
      shapeId: shapes[Math.floor(rng() * shapes.length)],
      colorRole: HABIT_COLOR_ROLE_ORDER[Math.floor(rng() * HABIT_COLOR_ROLE_ORDER.length)],
    };
  }
  return {
    paletteId: palettes[index % palettes.length],
    shapeId: shapes[index % shapes.length],
    colorRole: HABIT_COLOR_ROLE_ORDER[index % HABIT_COLOR_ROLE_ORDER.length],
  };
}

// ── Build palette picker ──
const paletteGrid = document.getElementById("paletteGrid");
HABIT_PALETTE_ORDER.forEach((id) => {
  const p = HABIT_PALETTES[id];
  const card = document.createElement("label");
  card.className = "swatchCard";
  const swatches = HABIT_COLOR_ROLE_ORDER.slice(0, 9)
    .map((role) => `<span class="dot" style="background:${p.colors[role]}"></span>`)
    .join("");
  card.innerHTML = `
    <input type="checkbox" data-palette="${id}" ${state.selectedPalettes.has(id) ? "checked" : ""} />
    <div class="swatchCardBody">
      <div class="swatchDots">${swatches}</div>
      <div class="swatchLabel">${p.label}</div>
      <div class="swatchDesc">${p.description}</div>
    </div>
  `;
  paletteGrid.appendChild(card);
});
paletteGrid.addEventListener("change", (e) => {
  const id = e.target.dataset.palette;
  if (!id) return;
  if (e.target.checked) state.selectedPalettes.add(id);
  else state.selectedPalettes.delete(id);
  renderPreview();
});

// ── Build shape picker ──
const shapeGrid = document.getElementById("shapeGrid");
HABIT_DAY_SHAPE_DEFINITIONS.forEach((s) => {
  const card = document.createElement("label");
  card.className = "shapeCard";
  card.innerHTML = `
    <input type="checkbox" data-shape="${s.id}" ${state.selectedShapes.has(s.id) ? "checked" : ""} />
    <svg viewBox="${s.viewBox}" width="40" height="40"><path d="${s.d}" fill="#5A6B63" fill-rule="evenodd"/></svg>
    <div class="shapeLabel">${s.label}</div>
  `;
  shapeGrid.appendChild(card);
});
shapeGrid.addEventListener("change", (e) => {
  const id = e.target.dataset.shape;
  if (!id) return;
  if (e.target.checked) state.selectedShapes.add(id);
  else state.selectedShapes.delete(id);
  renderPreview();
});

// ── Category filter ──
const categoryGrid = document.getElementById("categoryGrid");
categories.forEach((cat) => {
  const count = HABITS.filter((h) => h.category === cat).length;
  const label = document.createElement("label");
  label.className = "categoryChip";
  label.innerHTML = `<input type="checkbox" data-category="${cat}" checked /> ${cat} <span class="count">${count}</span>`;
  categoryGrid.appendChild(label);
});
categoryGrid.addEventListener("change", (e) => {
  const cat = e.target.dataset.category;
  if (!cat) return;
  if (e.target.checked) state.selectedCategories.add(cat);
  else state.selectedCategories.delete(cat);
  state.previewIndex = 0;
  renderPreview();
  updateCount();
});

document.getElementById("selectAllCategories").addEventListener("click", () => {
  categories.forEach((c) => state.selectedCategories.add(c));
  categoryGrid.querySelectorAll("input").forEach((i) => (i.checked = true));
  renderPreview();
  updateCount();
});
document.getElementById("selectNoneCategories").addEventListener("click", () => {
  state.selectedCategories.clear();
  categoryGrid.querySelectorAll("input").forEach((i) => (i.checked = false));
  renderPreview();
  updateCount();
});

// ── Theme + assignment mode ──
document.getElementById("themeSelect").addEventListener("change", (e) => {
  state.theme = e.target.value;
  // Seed the color pickers that are still on "theme default" so unchecking
  // them starts from the right theme color instead of a stale one.
  const t = APP_THEME[state.theme];
  if (document.getElementById("bgColorAuto").checked)
    document.getElementById("bgColor").value = t.background;
  if (document.getElementById("cardBackgroundAuto").checked)
    document.getElementById("cardBackground").value = t.cardBackground;
  if (document.getElementById("captionColorAuto").checked)
    document.getElementById("captionColor").value = t.text;
  renderPreview();
});
document.getElementById("assignMode").addEventListener("change", (e) => {
  state.assignMode = e.target.value;
  renderPreview();
});
document.getElementById("seedInput").addEventListener("input", (e) => {
  state.seed = Number(e.target.value) || 1;
  renderPreview();
});
document.getElementById("shuffleSeed").addEventListener("click", () => {
  state.seed = Math.floor(Math.random() * 1e6);
  document.getElementById("seedInput").value = state.seed;
  renderPreview();
});

// ── Layout / background adjustments ──
// Each slider maps 1:1 onto a DEFAULT_SETTINGS key; label shows live value.
const SLIDERS = [
  { id: "cardScale", key: "cardScale", scale: 100, suffix: "%" },
  { id: "cardRadius", key: "cardRadius", scale: 1, suffix: "px" },
  { id: "offsetY", key: "offsetY", scale: 1, suffix: "px" },
  { id: "captionSize", key: "captionSize", scale: 1, suffix: "px" },
  { id: "captionGap", key: "captionGap", scale: 1, suffix: "px" },
  { id: "captionSpacing", key: "captionSpacing", scale: 1, suffix: "px" },
  { id: "captionMaxWidth", key: "captionMaxWidth", scale: 1, suffix: "px" },
];
SLIDERS.forEach(({ id, key, scale, suffix }) => {
  const input = document.getElementById(id);
  const label = document.getElementById(`${id}Value`);
  input.value = state.settings[key] * scale;
  label.textContent = `${Math.round(state.settings[key] * scale)}${suffix}`;
  input.addEventListener("input", () => {
    state.settings[key] = Number(input.value) / scale;
    label.textContent = `${Math.round(Number(input.value))}${suffix}`;
    renderPreview();
  });
});
document.getElementById("resetLayout").addEventListener("click", () => {
  // Reset layout + text, but keep background choices (their own section).
  state.settings = {
    ...DEFAULT_SETTINGS,
    bgAnimation: state.settings.bgAnimation,
    bgColor: state.settings.bgColor,
    cardBackground: state.settings.cardBackground,
  };
  SLIDERS.forEach(({ id, key, scale, suffix }) => {
    const input = document.getElementById(id);
    input.value = state.settings[key] * scale;
    document.getElementById(`${id}Value`).textContent = `${Math.round(state.settings[key] * scale)}${suffix}`;
  });
  // Caption color back to theme default.
  captionColorAuto.checked = true;
  captionColorInput.disabled = true;
  renderPreview();
});

// ── Caption text color ──
const captionColorInput = document.getElementById("captionColor");
const captionColorAuto = document.getElementById("captionColorAuto");
captionColorAuto.addEventListener("change", () => {
  state.settings.captionColor = captionColorAuto.checked ? null : captionColorInput.value;
  captionColorInput.disabled = captionColorAuto.checked;
  renderPreview();
});
captionColorInput.addEventListener("input", () => {
  if (!captionColorAuto.checked) {
    state.settings.captionColor = captionColorInput.value;
    renderPreview();
  }
});

document.getElementById("bgAnimation").addEventListener("change", (e) => {
  state.settings.bgAnimation = e.target.value;
  renderPreview();
});
const bgColorInput = document.getElementById("bgColor");
const bgColorAuto = document.getElementById("bgColorAuto");
bgColorAuto.addEventListener("change", () => {
  state.settings.bgColor = bgColorAuto.checked ? null : bgColorInput.value;
  bgColorInput.disabled = bgColorAuto.checked;
  renderPreview();
});
bgColorInput.addEventListener("input", () => {
  if (!bgColorAuto.checked) {
    state.settings.bgColor = bgColorInput.value;
    renderPreview();
  }
});
const cardBgInput = document.getElementById("cardBackground");
const cardBgAuto = document.getElementById("cardBackgroundAuto");
cardBgAuto.addEventListener("change", () => {
  state.settings.cardBackground = cardBgAuto.checked ? null : cardBgInput.value;
  cardBgInput.disabled = cardBgAuto.checked;
  renderPreview();
});
cardBgInput.addEventListener("input", () => {
  if (!cardBgAuto.checked) {
    state.settings.cardBackground = cardBgInput.value;
    renderPreview();
  }
});
document.getElementById("backgroundOnly").addEventListener("change", (e) => {
  state.settings.showCard = !e.target.checked;
  renderPreview();
});

// ── Preview ──
const canvas = document.getElementById("previewCanvas");
canvas.width = CANVAS_W;
canvas.height = CANVAS_H;
const ctx = canvas.getContext("2d");

function renderPreview() {
  const list = filteredHabits();
  updateCount();
  if (list.length === 0) {
    ctx.fillStyle = "#eee";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = "#999";
    ctx.textAlign = "center";
    ctx.font = "32px sans-serif";
    ctx.fillText("No habits match the current filters", CANVAS_W / 2, CANVAS_H / 2);
    return;
  }
  state.previewIndex = ((state.previewIndex % list.length) + list.length) % list.length;
  const habit = list[state.previewIndex];
  const style = styleForIndex(state.previewIndex, list);
  const icon = assignIcon(habit);
  renderHabitCard(ctx, {
    habit,
    icon,
    theme: state.theme,
    seedOffset: state.seed,
    settings: state.settings,
    ...style,
  });
  document.getElementById("previewMeta").textContent =
    `#${state.previewIndex + 1} / ${list.length} — "${habit.name}" (${habit.category}) — palette: ${HABIT_PALETTES[style.paletteId].label}, shape: ${style.shapeId}, color: ${style.colorRole}, icon: ${icon}`;
}

document.getElementById("prevHabit").addEventListener("click", () => {
  state.previewIndex -= 1;
  renderPreview();
});
document.getElementById("nextHabit").addEventListener("click", () => {
  state.previewIndex += 1;
  renderPreview();
});
document.getElementById("randomHabit").addEventListener("click", () => {
  const list = filteredHabits();
  state.previewIndex = Math.floor(Math.random() * list.length);
  renderPreview();
});
document.getElementById("downloadOne").addEventListener("click", () => {
  const list = filteredHabits();
  const habit = list[state.previewIndex];
  canvas.toBlob((blob) => {
    downloadBlob(blob, `${String(state.previewIndex + 1).padStart(3, "0")}-${slugify(habit.name)}.png`);
  }, "image/png");
});

function downloadBlob(blob, filename) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

function updateCount() {
  document.getElementById("habitCount").textContent = `${filteredHabits().length} habit(s) selected`;
}

// ── Bulk export ──
const bulkBtn = document.getElementById("bulkGenerate");
const progressWrap = document.getElementById("progressWrap");
const progressBar = document.getElementById("progressBar");
const progressText = document.getElementById("progressText");

bulkBtn.addEventListener("click", async () => {
  const list = filteredHabits();
  if (list.length === 0) {
    alert("No habits match the current category filters.");
    return;
  }
  if (state.selectedPalettes.size === 0 || state.selectedShapes.size === 0) {
    alert("Select at least one color palette and one pebble shape first.");
    return;
  }

  bulkBtn.disabled = true;
  progressWrap.style.display = "block";
  const zip = new JSZip();
  const off = document.createElement("canvas");
  off.width = CANVAS_W;
  off.height = CANVAS_H;
  const offCtx = off.getContext("2d");

  for (let i = 0; i < list.length; i++) {
    const habit = list[i];
    const style = styleForIndex(i, list);
    renderHabitCard(offCtx, {
      habit,
      icon: assignIcon(habit),
      theme: state.theme,
      seedOffset: state.seed,
      settings: state.settings,
      ...style,
    });

    const blob = await new Promise((resolve) => off.toBlob(resolve, "image/png"));
    const filename = `${String(i + 1).padStart(3, "0")}-${slugify(habit.name)}.png`;
    zip.file(filename, blob);

    const pct = Math.round(((i + 1) / list.length) * 100);
    progressBar.style.width = `${pct}%`;
    progressText.textContent = `Rendering ${i + 1} / ${list.length} — ${habit.name}`;
    // Yield to the UI thread every few frames so the tab stays responsive.
    if (i % 4 === 0) await new Promise((r) => requestAnimationFrame(r));
  }

  progressText.textContent = "Zipping…";
  const content = await zip.generateAsync({ type: "blob" }, (meta) => {
    progressBar.style.width = `${Math.round(meta.percent)}%`;
  });
  downloadBlob(content, `habit-cards-${Date.now()}.zip`);
  progressText.textContent = `Done — ${list.length} PNGs exported.`;
  bulkBtn.disabled = false;
});

// Init — load the icon fonts first so glyphs render on the first paint.
updateCount();
document.getElementById("seedInput").value = state.seed;
loadIconFonts()
  .catch((e) => console.error("icon font load failed:", e))
  .finally(renderPreview);
