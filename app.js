// UI wiring: selection state, live preview, bulk zip export.

// Per-habit icon overrides set from the icon picker, persisted across sessions.
const ICON_OVERRIDES_KEY = "pebbleHabitIconOverrides";
function loadIconOverrides() {
  try {
    return JSON.parse(localStorage.getItem(ICON_OVERRIDES_KEY)) || {};
  } catch {
    return {};
  }
}
function saveIconOverrides() {
  try {
    localStorage.setItem(ICON_OVERRIDES_KEY, JSON.stringify(state.iconOverrides));
  } catch {
    /* storage unavailable (e.g. file:// in some browsers) — overrides stay in-memory */
  }
}

const state = {
  selectedPalettes: new Set(["default"]),
  selectedShapes: new Set(["1"]),
  selectedColorRoles: new Set(HABIT_COLOR_ROLE_ORDER),
  selectedCategories: new Set(),
  theme: "light",
  assignMode: "cycle", // "cycle" | "random"
  seed: 1,
  previewIndex: 0,
  settings: { ...DEFAULT_SETTINGS },
  iconOverrides: loadIconOverrides(),
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

// ── Icon assignment ──
// Three tiers, most authoritative first: (1) user override saved from the
// icon picker, (2) a curated per-habit override for known matcher misses,
// (3) a name-weighted keyword match, falling back to a curated on-theme pool
// for the habit's category so abstract habits never look random.
const ALL_ICONS = ICON_SECTIONS.flatMap((s) => s.icons);
const ICON_NAME_SET = new Set(ALL_ICONS.map((i) => i.name));

// Specific habit → icon fixes for cases keyword matching gets wrong or has no
// signal for. Every value must be a real catalog icon (validated on load).
const CURATED_ICON_OVERRIDES = {
  "Take the stairs once": "footsteps-outline",
  "Posture reset": "accessibility-outline",
  "Dead hang": "mci:arm-flex",
  "Wall sit 45s": "mci:meditation",
  "Water before coffee": "cafe-outline",
  "No-screen first bite": "mci:monitor-off",
  "Kitchen close-down": "mci:stove",
  "Protein check": "egg-outline",
  "Worry parking": "mci:meditation",
  "Mental weather report": "partly-sunny-outline",
  "One-minute nothing": "mci:meditation",
  "Savor one moment": "sparkles-outline",
  "Win of the day": "trophy-outline",
  "Future thank-you": "gift-outline",
  "Wikipedia rabbit hole": "search-outline",
  "Read one news summary": "newspaper-outline",
  "Skill micro-rep": "mci:guitar-pick",
  "10 bad ideas": "bulb-outline",
  "Alternate uses game": "bulb-outline",
  "Haiku of the day": "mci:fountain-pen",
  "One metaphor": "mci:fountain-pen",
  "Remix a routine": "shapes-outline",
  "Top 3 for tomorrow": "list-outline",
  "2-minute rule": "timer-outline",
  "Single-tab minute": "laptop-outline",
  "Clear one surface": "sparkles-outline",
  "Close the loop": "checkmark-circle-outline",
  "One frog bite": "checkbox-outline",
  "Timebox one thing": "stopwatch-outline",
  "Eye contact hello": "eye-outline",
  "Listen without fixing": "chatbubble-outline",
  "Apology or appreciation": "heart-circle-outline",
  "Speak one boundary": "hand-left-outline",
  "Log every expense": "wallet-outline",
  "24-hour wish list": "pricetag-outline",
  "Check one subscription": "card-outline",
  "One money fact": "cash-outline",
  "Price-per-use check": "calculator-outline",
  "Round-up mental math": "calculator-outline",
  "Free-fun idea": "gift-outline",
  "Net worth minute": "stats-chart-outline",
  "Post nothing, notice": "eye-outline",
  "Reply, don't scroll": "chatbubble-outline",
  "Screen-time glance": "phone-portrait-outline",
  "One digital declutter": "mci:cellphone-off",
  "One-line brain dump": "create-outline",
  "3 lines in a journal": "journal-outline",
  "One-line diary": "journal-outline",
  "Values check": "shield-checkmark-outline",
  "One thing I'd redo": "mci:meditation",
  "Energy audit": "pulse-outline",
  "Future-self letter line": "mail-outline",
  "Name today's fear": "mci:emoticon-sad",
  "Progress photo/note": "camera-outline",
  "Identity vote": "checkbox-outline",
  "Weekly-goal glance": "flag-outline",
  "Question one assumption": "bulb-outline",
  "Invent a word": "language-outline",
  "60-second time travel": "time-outline",
  "Opposite opinion minute": "mci:drama-masks",
  "Message to future you": "mail-outline",
  "Reverse to-do": "list-outline",
  "One-minute alien view": "planet-outline",
  "Whisper a secret goal": "flag-outline",
  "End-of-work shutdown": "laptop-outline",
  "One process improvement": "construct-outline",
  "Pause before reacting": "mci:meditation",
  "Self-compassion line": "heart-outline",
  "Anxiety fact-check": "shield-checkmark-outline",
  "Celebrate tiny wins": "mci:party-popper",
  "Sit with discomfort 60s": "mci:meditation",
  "Say it out loud": "mic-outline",
  "Courage rep": "mci:arm-flex",
  "Let one thing go": "leaf-outline",
  "Mental math bite": "calculator-outline",
  "Memorize one line": "book-outline",
  "Recall your day backwards": "mci:meditation",
  "One puzzle a day": "mci:puzzle",
  "Name 5 in a category": "list-outline",
  "Visualize a route": "map-outline",
  "Left-right brain swap": "mci:atom",
  "Spot 3 differences": "search-outline",
  "Estimate then verify": "calculator-outline",
  "Speed-type one sentence": "laptop-outline",
  "Spin a pen": "mci:fountain-pen",
  "Solve one Rubik's step": "mci:puzzle",
  "One filler-free minute": "mic-outline",
  "Replace \"sorry\" once": "chatbubble-outline",
  "One slow sentence": "chatbubble-outline",
  "Voice memo a thought": "mic-outline",
  "Paraphrase before replying": "chatbubble-outline",
  "One text with warmth": "chatbubble-outline",
  "Practice a hard sentence": "mic-outline",
  "Tell one 30-second story": "mic-outline",
  "Plan one tiny treat": "gift-outline",
  "Try one new tiny thing": "sparkles-outline",
  "Collect one funny moment": "mci:emoticon-excited",
  "Game of your own rules": "dice-outline",
  "Look at old happy photos": "images-outline",
  "Practice power pose": "mci:arm-flex",
  "Reframe one complaint": "mci:drama-masks",
  "Cheer for a stranger": "mci:emoticon-happy",
  "Smile for 30 seconds": "mci:emoticon-happy",
  "Label the feeling": "mci:emoticon-neutral",
  "5-4-3-2-1 grounding": "mci:meditation",
  "Name 3 sounds": "mci:meditation",
  "3 gratitudes": "heart-outline",
  "Play with your pet": "paw-outline",
  "Watch stars 1 min": "moon-outline",
  "Watch 1 educational clip": "film-outline",
  "Watch one funny clip": "film-outline",
  "Pick up one piece of litter": "leaf-outline",
  "Take the stairs once": "footsteps-outline",
  "Make the bed": "bed-outline",
  "Make your bed": "bed-outline",
  "Check in on someone": "chatbubble-outline",
  "Log every expense": "wallet-outline",
  "Name a name": "person-outline",
  "Learn a name": "id-card-outline",
  "Run one errand": "walk-outline",
  // Verb/noun collisions caught in the full-catalog scan.
  "Morning sunlight": "sunny-outline",
  "Cold water face splash": "water-outline",
  "Sing in the shower": "musical-notes-outline",
  "One item out": "bag-outline",
  "Prep one thing for tomorrow": "bag-outline",
  "Smell the air outside": "leaf-outline",
  "Feel the temperature": "thermometer-outline",
  "Follow one scent": "flower-outline",
  "Wrong-hand minute": "hand-left-outline",
  "Eyes-closed routine": "eye-outline",
  "Name the machine's job": "hardware-chip-outline",
  "Update one skill note": "create-outline",
  "Prep one question": "chatbubble-outline",
  "Check on the quiet one": "chatbubble-outline",
  "Compliment the work, not looks": "thumbs-up-outline",
  "Practice juggling": "hand-left-outline",
  "Practice a card shuffle": "mci:cards-playing-outline",
  "Cool the room": "snow-outline",
  "Learn one shortcut": "laptop-outline",
};

// Curated, always-on-theme fallback icons per spreadsheet category, used when
// the habit's own words give no clear match — so the pick still reads as
// intentional rather than random.
const CATEGORY_FALLBACK_ICONS = {
  "Body & Movement": ["mci:run", "fitness-outline", "mci:arm-flex", "walk-outline", "mci:yoga"],
  "Food & Hydration": ["restaurant-outline", "nutrition-outline", "water-outline", "cafe-outline", "mci:pot-steam"],
  "Mind & Mindfulness": ["mci:meditation", "mci:lungs", "sparkles-outline", "mci:yoga", "moon-outline"],
  "Gratitude & Positivity": ["heart-outline", "mci:emoticon-happy", "sparkles-outline", "gift-outline", "thumbs-up-outline"],
  "Learning & Growth": ["book-outline", "school-outline", "bulb-outline", "language-outline", "reader-outline"],
  "Creativity": ["color-palette-outline", "brush-outline", "mci:draw", "bulb-outline", "musical-notes-outline"],
  "Productivity & Focus": ["checkmark-circle-outline", "list-outline", "timer-outline", "flag-outline", "rocket-outline"],
  "Relationships & Social": ["people-outline", "chatbubble-outline", "heart-circle-outline", "hand-left-outline", "person-add-outline"],
  "Money & Finance": ["wallet-outline", "cash-outline", "card-outline", "pricetag-outline", "cart-outline"],
  "Digital Wellbeing": ["phone-portrait-outline", "mci:cellphone-off", "mci:monitor-off", "notifications-outline", "wifi-outline"],
  "Sleep & Evening": ["bed-outline", "moon-outline", "mci:sleep", "alarm-outline", "cloudy-night-outline"],
  "Morning Rituals": ["sunny-outline", "cafe-outline", "alarm-outline", "partly-sunny-outline", "bed-outline"],
  "Home & Environment": ["home-outline", "mci:washing-machine", "construct-outline", "leaf-outline", "build-outline"],
  "Nature & Senses": ["leaf-outline", "earth-outline", "flower-outline", "paw-outline", "sunny-outline"],
  "Self-Reflection": ["journal-outline", "mci:meditation", "bulb-outline", "book-outline", "mci:emoticon-neutral"],
  "Out-of-the-Box Habits": ["sparkles-outline", "bulb-outline", "mci:puzzle", "dice-outline", "prism-outline"],
  "Work & Career": ["briefcase-outline", "business-outline", "laptop-outline", "stats-chart-outline", "document-text-outline"],
  "Emotional Fitness": ["heart-outline", "mci:meditation", "mci:emoticon-happy", "pulse-outline", "sparkles-outline"],
  "Brain Training": ["bulb-outline", "mci:puzzle", "calculator-outline", "mci:chess-knight", "book-outline"],
  "Kindness & Contribution": ["heart-circle-outline", "hand-left-outline", "gift-outline", "people-outline", "thumbs-up-outline"],
  "Speech & Communication": ["chatbubble-outline", "mic-outline", "megaphone-outline", "language-outline", "people-outline"],
  "Play & Joy": ["mci:party-popper", "game-controller-outline", "mci:emoticon-excited", "balloon-outline", "dice-outline"],
  "Bonus: Tiny Skill Practice": ["mci:puzzle", "mci:cards-playing-outline", "mci:guitar-pick", "dice-outline", "hand-left-outline"],
};

// Generic words that appear in most habit rows and produce misleading
// cross-domain matches ("fast" → cyclist, "day" → calendar, "bar" → chart).
const ICON_STOPWORDS = new Set([
  "day", "days", "daily", "once", "one", "two", "three", "four", "five", "ten",
  "min", "mins", "minute", "minutes", "second", "seconds", "hour", "time",
  "times", "any", "full", "tiny", "small", "big", "little", "bar", "sit",
  "add", "per", "fast", "slow", "quick", "speed", "clean", "line", "new",
  "old", "extra", "long", "short", "hard", "easy", "left", "right", "good",
  "bad", "high", "low", "first", "last", "next", "real", "whole", "free",
  "own", "each", "today", "tomorrow", "yesterday", "week", "month", "year",
  // Common verbs whose spelling collides with unrelated icon names
  // ("watch" → wristwatch, "pick" → guitar-pick, "check" → checkbox).
  "watch", "pick", "hold", "keep", "make", "take", "give", "put", "get",
  "spot", "name", "log", "check", "set", "try", "use", "let", "run",
]);

function tokenize(str) {
  return new Set(
    str.toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 2 && !ICON_STOPWORDS.has(w))
  );
}

/** Best keyword-matched icon for a habit, name weighted above description. */
function matchIconByKeywords(habit) {
  const nameTokens = tokenize(habit.name);
  const descTokens = tokenize(habit.description || "");
  let best = [];
  let bestScore = 0;
  for (const ic of ALL_ICONS) {
    let score = 0;
    const kwWords = new Set();
    for (const kw of ic.keywords) for (const w of kw.toLowerCase().split(/\s+/)) kwWords.add(w);
    for (const w of kwWords) {
      if (nameTokens.has(w)) score += 4;
      else if (descTokens.has(w)) score += 2;
    }
    for (const t of ic.name.replace(/^mci:/, "").replace(/-outline$/, "").split("-")) {
      if (t.length > 2) {
        if (nameTokens.has(t)) score += 6;
        else if (descTokens.has(t)) score += 3;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      best = [ic.name];
    } else if (score === bestScore && score > 0) {
      best.push(ic.name);
    }
  }
  // Require a name-level signal (>=4) so a lone weak description word doesn't
  // win over a clean on-theme category fallback.
  return bestScore >= 4 ? best : null;
}

/** The auto-chosen icon (ignoring user overrides), deterministic per habit. */
function autoIcon(habit) {
  if (CURATED_ICON_OVERRIDES[habit.name]) return CURATED_ICON_OVERRIDES[habit.name];
  const rng = mulberry32(hashString(`icon|${habit.name}`));
  const matches = matchIconByKeywords(habit);
  if (matches) return matches[Math.floor(rng() * matches.length)];
  const pool = CATEGORY_FALLBACK_ICONS[habit.category] || ALL_ICONS.map((i) => i.name);
  return pool[Math.floor(rng() * pool.length)];
}

/** Final icon for a habit: a saved user override wins, else the auto choice. */
function assignIcon(habit) {
  return state.iconOverrides[habit.name] || autoIcon(habit);
}

const categories = [...new Set(HABITS.map((h) => h.category))];
state.selectedCategories = new Set(categories);

function filteredHabits() {
  return HABITS.filter((h) => state.selectedCategories.has(h.category));
}

function shuffleInPlace(arr, rng) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Partition `list` into folders of 4 habits where, within each folder, all
 * four habits come from a different category (and — assigned separately at
 * render time — a different color). No habit repeats across folders.
 *
 * Greedy fill: bucket by category, then repeatedly take one habit from each
 * of the four largest remaining categories. This keeps buckets balanced so
 * we form as many complete folders as possible. Anything left once fewer
 * than four categories remain goes into a trailing "mixed" folder (it can't
 * satisfy the distinct-category rule).
 */
function buildFolderGroups(list, seed) {
  const rng = mulberry32(hashString(`${seed}|folders`));
  const byCat = new Map();
  for (const h of list) {
    if (!byCat.has(h.category)) byCat.set(h.category, []);
    byCat.get(h.category).push(h);
  }
  for (const arr of byCat.values()) shuffleInPlace(arr, rng);

  const groups = [];
  const leftovers = [];
  while (true) {
    const cats = [...byCat.values()].filter((a) => a.length > 0);
    if (cats.length < 4) {
      for (const a of cats) leftovers.push(...a);
      break;
    }
    cats.sort((a, b) => b.length - a.length);
    groups.push([cats[0].pop(), cats[1].pop(), cats[2].pop(), cats[3].pop()]);
  }
  return { groups, leftovers };
}

/**
 * The color roles allowed on cards: the enabled subset, kept in canonical
 * order. Falls back to the full order if the user has turned every color off
 * (so cards always have a color to use).
 */
function activeColorRoles() {
  const roles = HABIT_COLOR_ROLE_ORDER.filter((r) => state.selectedColorRoles.has(r));
  return roles.length ? roles : HABIT_COLOR_ROLE_ORDER;
}

/** Deterministic style assignment for the habit at `index` within `list`. */
function styleForIndex(index, list) {
  const palettes = [...state.selectedPalettes];
  const shapes = [...state.selectedShapes];
  const roles = activeColorRoles();
  if (palettes.length === 0) palettes.push("default");
  if (shapes.length === 0) shapes.push("1");

  if (state.assignMode === "random") {
    const rng = mulberry32(hashString(`${state.seed}|${list[index].name}`));
    return {
      paletteId: palettes[Math.floor(rng() * palettes.length)],
      shapeId: shapes[Math.floor(rng() * shapes.length)],
      colorRole: roles[Math.floor(rng() * roles.length)],
    };
  }
  return {
    paletteId: palettes[index % palettes.length],
    shapeId: shapes[index % shapes.length],
    colorRole: roles[index % roles.length],
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
  refreshColorSwatches();
  renderPreview();
});

// ── Build card-color (color-role) picker ──
// The 18 color roles are shared across every palette; disabling a role stops
// it from being assigned to any card. Swatches preview the role's hex in the
// first selected palette (or Default when none is selected).
const colorRoleGrid = document.getElementById("colorRoleGrid");
function swatchPaletteId() {
  const first = [...state.selectedPalettes][0];
  return first && HABIT_PALETTES[first] ? first : "default";
}
HABIT_COLOR_ROLE_ORDER.forEach((role) => {
  const chip = document.createElement("label");
  chip.className = "colorChip";
  chip.dataset.role = role;
  chip.innerHTML = `
    <input type="checkbox" data-role="${role}" ${state.selectedColorRoles.has(role) ? "checked" : ""} />
    <span class="colorDot" data-role="${role}"></span>
    ${role}
  `;
  colorRoleGrid.appendChild(chip);
});
function refreshColorSwatches() {
  const pal = HABIT_PALETTES[swatchPaletteId()].colors;
  colorRoleGrid.querySelectorAll(".colorChip").forEach((chip) => {
    const role = chip.dataset.role;
    chip.querySelector(".colorDot").style.background = pal[role] || "#ccc";
    chip.classList.toggle("off", !state.selectedColorRoles.has(role));
  });
}
colorRoleGrid.addEventListener("change", (e) => {
  const role = e.target.dataset.role;
  if (!role) return;
  if (e.target.checked) state.selectedColorRoles.add(role);
  else state.selectedColorRoles.delete(role);
  refreshColorSwatches();
  renderPreview();
});
document.getElementById("selectAllColors").addEventListener("click", () => {
  HABIT_COLOR_ROLE_ORDER.forEach((r) => state.selectedColorRoles.add(r));
  colorRoleGrid.querySelectorAll("input").forEach((i) => (i.checked = true));
  refreshColorSwatches();
  renderPreview();
});
document.getElementById("selectNoneColors").addEventListener("click", () => {
  state.selectedColorRoles.clear();
  colorRoleGrid.querySelectorAll("input").forEach((i) => (i.checked = false));
  refreshColorSwatches();
  renderPreview();
});
refreshColorSwatches();

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
  updateIconPickerHead(habit, icon);
}

// ── Icon picker ──
function glyphChar(name) {
  const g = ICON_GLYPHS[name];
  return g ? String.fromCodePoint(g.cp) : "";
}
function glyphFontFamily(name) {
  const g = ICON_GLYPHS[name];
  return g ? (g.family === "mci" ? "PebbleMCI" : "PebbleIonicons") : "inherit";
}

function updateIconPickerHead(habit, icon) {
  const glyph = document.getElementById("currentIconGlyph");
  glyph.textContent = glyphChar(icon);
  glyph.style.fontFamily = glyphFontFamily(icon);
  document.getElementById("currentIconName").textContent = icon;
  document.getElementById("iconOverrideTag").style.display =
    state.iconOverrides[habit.name] ? "inline-block" : "none";
  // Reflect the current selection in the (possibly open) grid.
  document.querySelectorAll("#iconGrid .iconBtn").forEach((b) => {
    b.classList.toggle("selected", b.dataset.icon === icon);
  });
}

function currentPreviewHabit() {
  const list = filteredHabits();
  if (list.length === 0) return null;
  const idx = ((state.previewIndex % list.length) + list.length) % list.length;
  return list[idx];
}

function buildIconGrid(query) {
  const q = (query || "").toLowerCase().trim();
  const grid = document.getElementById("iconGrid");
  grid.innerHTML = "";
  const habit = currentPreviewHabit();
  const activeIcon = habit ? assignIcon(habit) : null;
  const matches = ALL_ICONS.filter((ic) => {
    if (!q) return true;
    if (ic.name.toLowerCase().includes(q)) return true;
    return ic.keywords.some((k) => k.toLowerCase().includes(q));
  });
  const frag = document.createDocumentFragment();
  for (const ic of matches) {
    const b = document.createElement("button");
    b.className = "iconBtn" + (ic.name === activeIcon ? " selected" : "");
    b.title = ic.name;
    b.dataset.icon = ic.name;
    b.style.fontFamily = glyphFontFamily(ic.name);
    b.textContent = glyphChar(ic.name);
    b.addEventListener("click", () => {
      const h = currentPreviewHabit();
      if (!h) return;
      state.iconOverrides[h.name] = ic.name;
      saveIconOverrides();
      renderPreview();
    });
    frag.appendChild(b);
  }
  grid.appendChild(frag);
}

document.getElementById("toggleIconPicker").addEventListener("click", () => {
  const body = document.getElementById("iconPickerBody");
  const open = body.style.display === "none";
  body.style.display = open ? "block" : "none";
  if (open) {
    buildIconGrid(document.getElementById("iconSearch").value);
    document.getElementById("iconSearch").focus();
  }
});
document.getElementById("resetIcon").addEventListener("click", () => {
  const h = currentPreviewHabit();
  if (!h) return;
  delete state.iconOverrides[h.name];
  saveIconOverrides();
  renderPreview();
});
let iconSearchTimer = null;
document.getElementById("iconSearch").addEventListener("input", (e) => {
  clearTimeout(iconSearchTimer);
  const v = e.target.value;
  iconSearchTimer = setTimeout(() => buildIconGrid(v), 120);
});

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

  const groupFolders = document.getElementById("groupFolders").checked;
  const transparentLayers = document.getElementById("transparentLayers").checked;
  const palettes = [...state.selectedPalettes];
  const shapes = [...state.selectedShapes];
  if (palettes.length === 0) palettes.push("default");
  if (shapes.length === 0) shapes.push("1");
  const total = list.length;
  let done = 0;

  // Render one layer (or the full composite) of a habit to a PNG blob. `parts`
  // is null for the classic composite, or a { background, card, captions }
  // flag set for the transparent card / text layers.
  const renderToBlob = async (habit, style, parts) => {
    renderHabitCard(offCtx, {
      habit,
      icon: assignIcon(habit),
      theme: state.theme,
      seedOffset: state.seed,
      settings: state.settings,
      parts,
      ...style,
    });
    return await new Promise((resolve) => off.toBlob(resolve, "image/png"));
  };

  // Render one habit into the zip at `path` using the given style. With the
  // transparent-layers toggle on, the single PNG becomes two: `<name>-card.png`
  // (just the card, transparent bg) and `<name>-text.png` (just the captions,
  // transparent bg) — both keep the exact positions of the composite so they
  // layer back together.
  const emit = async (habit, style, path) => {
    if (transparentLayers) {
      const cardBlob = await renderToBlob(habit, style, { background: false, card: true, captions: false });
      zip.file(path.replace(/\.png$/i, "-card.png"), cardBlob);
      const textBlob = await renderToBlob(habit, style, { background: false, card: false, captions: true });
      zip.file(path.replace(/\.png$/i, "-text.png"), textBlob);
    } else {
      const blob = await renderToBlob(habit, style, null);
      zip.file(path, blob);
    }
    done++;
    progressBar.style.width = `${Math.round((done / total) * 100)}%`;
    progressText.textContent = `Rendering ${done} / ${total} — ${habit.name}`;
    if (done % 4 === 0) await new Promise((r) => requestAnimationFrame(r));
  };

  // Only the enabled colors are assigned; within a folder we still rotate
  // through them to keep the four cards distinct when 4+ colors are enabled.
  const order = activeColorRoles();

  if (groupFolders) {
    const { groups, leftovers } = buildFolderGroups(list, state.seed);
    let cardIndex = 0;
    // Within a folder, palette/shape follow the selection while colorRole is
    // forced to four distinct roles so every card in the folder differs in
    // color as well as category.
    const folderStyle = (colorRole) => ({
      paletteId: palettes[cardIndex % palettes.length],
      shapeId: shapes[cardIndex % shapes.length],
      colorRole,
    });
    for (let g = 0; g < groups.length; g++) {
      const folder = `set-${String(g + 1).padStart(2, "0")}`;
      // Four consecutive roles from the canonical order → four distinct
      // colors; the base rotates per folder so sets don't all look alike.
      const roleBase = (g * 4) % order.length;
      for (let j = 0; j < groups[g].length; j++) {
        const role = order[(roleBase + j) % order.length];
        const name = `${j + 1}-${slugify(groups[g][j].name)}.png`;
        await emit(groups[g][j], folderStyle(role), `${folder}/${name}`);
        cardIndex++;
      }
    }
    // Habits that couldn't complete a distinct-category folder.
    for (let j = 0; j < leftovers.length; j++) {
      const name = `${j + 1}-${slugify(leftovers[j].name)}.png`;
      await emit(leftovers[j], folderStyle(order[j % order.length]), `zz-mixed/${name}`);
      cardIndex++;
    }
    progressText.textContent = `Zipping… (${groups.length} folders of 4${leftovers.length ? ` + ${leftovers.length} mixed` : ""})`;
  } else {
    for (let i = 0; i < list.length; i++) {
      const name = `${String(i + 1).padStart(3, "0")}-${slugify(list[i].name)}.png`;
      await emit(list[i], styleForIndex(i, list), name);
    }
    progressText.textContent = "Zipping…";
  }

  const content = await zip.generateAsync({ type: "blob" }, (meta) => {
    progressBar.style.width = `${Math.round(meta.percent)}%`;
  });
  downloadBlob(content, `habit-cards-${Date.now()}.zip`);
  const fileCount = transparentLayers ? done * 2 : done;
  progressText.textContent =
    `Done — ${fileCount} PNGs exported${transparentLayers ? ` (${done} card + ${done} text)` : ""}.`;
  bulkBtn.disabled = false;
});

// Init — load the icon fonts first so glyphs render on the first paint.
updateCount();
document.getElementById("seedInput").value = state.seed;
loadIconFonts()
  .catch((e) => console.error("icon font load failed:", e))
  .finally(renderPreview);

