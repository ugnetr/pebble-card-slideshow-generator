// Extracted verbatim from Pebble app: constants/habitPalettes.ts
const HABIT_COLOR_ROLE_ORDER = [
  "red", "coral", "orange", "amber", "yellow", "lime", "green", "emerald",
  "teal", "cyan", "blue", "indigo", "lavender", "purple", "rose", "pink",
  "grey", "brown",
];

const HABIT_PALETTES = {
  default: {
    id: "default", label: "Default", description: "Warm terracotta and calm sage.",
    colors: { red: "#CB5B4A", coral: "#DC7A6A", orange: "#E5986E", amber: "#E7B07F", yellow: "#E8C890", lime: "#94B07A", green: "#63A090", emerald: "#4F8E78", teal: "#3E6F7A", cyan: "#5698A3", blue: "#6890C8", indigo: "#5A6898", lavender: "#9A8AB8", purple: "#9B72A3", rose: "#C77A95", pink: "#D88DA5", grey: "#798380", brown: "#6B5645" },
  },
  pastel: {
    id: "pastel", label: "Pastel", description: "Soft tints with airy contrast.",
    colors: { red: "#FFB3BA", coral: "#FFD0CC", orange: "#FFDCC4", amber: "#FFECC8", yellow: "#FFF2A8", lime: "#E2F5CC", green: "#C8EFC4", emerald: "#BEE8D8", teal: "#B8EDE4", cyan: "#CDF5F2", blue: "#CDE0FF", indigo: "#E0E9FF", lavender: "#EDE5FF", purple: "#DDD4FF", rose: "#FFD6EB", pink: "#FFDDF5", grey: "#DFE4EB", brown: "#EADAD0" },
  },
  vibrant: {
    id: "vibrant", label: "Vibrant", description: "Saturated and cleanly separated.",
    colors: { red: "#FA4D4D", coral: "#FF7878", orange: "#FF922B", amber: "#FAB005", yellow: "#FFD43B", lime: "#82C91E", green: "#51CF66", emerald: "#37B24D", teal: "#12B89A", cyan: "#15C2D4", blue: "#339AF0", indigo: "#4C6EF5", lavender: "#9775FA", purple: "#7950F2", rose: "#F06595", pink: "#E64980", grey: "#868E96", brown: "#8B5A2B" },
  },
  earth: {
    id: "earth", label: "Earth", description: "Clay, bark, and stone.",
    colors: { red: "#A34A2D", coral: "#AE5C45", orange: "#C0783A", amber: "#AA7B3D", yellow: "#BE9A3A", lime: "#6E7C3D", green: "#4F6B3F", emerald: "#3F5C36", teal: "#465A50", cyan: "#4F6560", blue: "#556B7A", indigo: "#4A5560", lavender: "#665A63", purple: "#624662", rose: "#895150", pink: "#9F6A58", grey: "#595248", brown: "#4A3528" },
  },
  sunset: {
    id: "sunset", label: "Sunset", description: "Magenta dusk and amber light.",
    colors: { red: "#CC2936", coral: "#E85D6F", orange: "#F48C18", amber: "#F0A020", yellow: "#FAC84A", lime: "#94B84A", green: "#75904C", emerald: "#5F7A3A", teal: "#2B6F9E", cyan: "#188C8A", blue: "#173A5E", indigo: "#3A4A8F", lavender: "#AB5BC4", purple: "#7E22B8", rose: "#EA4C89", pink: "#DB2777", grey: "#57535E", brown: "#614A3A" },
  },
  forest: {
    id: "forest", label: "Forest", description: "Moss, fern, and woodland berry.",
    colors: { red: "#9B2C2C", coral: "#B54848", orange: "#C26A37", amber: "#A67C35", yellow: "#BFA243", lime: "#6BA86C", green: "#348C68", emerald: "#287359", teal: "#2B6E73", cyan: "#2A9385", blue: "#2D6288", indigo: "#3D5570", lavender: "#6B7A94", purple: "#4E4070", rose: "#A24052", pink: "#AE6B82", grey: "#5F6E62", brown: "#544430" },
  },
  berry: {
    id: "berry", label: "Berry", description: "Plum, raspberry, and jewel tones.",
    colors: { red: "#9D174D", coral: "#D4387A", orange: "#E0315C", amber: "#E8590C", yellow: "#FBBF24", lime: "#65A30D", green: "#059669", emerald: "#047857", teal: "#0D9488", cyan: "#0891B2", blue: "#2563EB", indigo: "#4F46E5", lavender: "#8B5CF6", purple: "#7C3AED", rose: "#DB2777", pink: "#EC4899", grey: "#78716C", brown: "#713F12" },
  },
  citrus: {
    id: "citrus", label: "Citrus", description: "Fresh citrus and tropical brights.",
    colors: { red: "#F5222D", coral: "#FF7A45", orange: "#FA8C16", amber: "#F5D000", yellow: "#FFEC8A", lime: "#BAE637", green: "#52C41A", emerald: "#389E0D", teal: "#13C2C2", cyan: "#36CFC9", blue: "#1890FF", indigo: "#597EF7", lavender: "#B37FEB", purple: "#9254DE", rose: "#FF85C0", pink: "#FFADD2", grey: "#8C8C8C", brown: "#AD7D4D" },
  },
  midnight: {
    id: "midnight", label: "Midnight", description: "Deep jewel tones, strong contrast.",
    colors: { red: "#7F1D1D", coral: "#9B3C3F", orange: "#B45309", amber: "#B8860B", yellow: "#A88C37", lime: "#3F6212", green: "#14532D", emerald: "#0F3D26", teal: "#134E6F", cyan: "#0E7490", blue: "#1E3A5F", indigo: "#312E81", lavender: "#5B21B6", purple: "#4C1D95", rose: "#831843", pink: "#9D174D", grey: "#3F3F46", brown: "#422006" },
  },
};

const HABIT_PALETTE_ORDER = ["default", "citrus", "earth", "pastel", "vibrant", "sunset", "forest", "berry", "midnight"];

// Extracted verbatim from Pebble app: constants/habitDayShapes.ts
const HABIT_DAY_SHAPE_DEFINITIONS = [
  { id: "1", label: "Shape 1", viewBox: "0 0 142 145", d: "M46.6 1.9C21.2 6.9 5.3 23 1 47.9C-1 59.5 0.1 87.4 3 98.2C9.5 122.7 24.5 137.3 48.8 143.1C59.6 145.6 83.7 145.6 94.4 143.1C117.5 137.7 132.7 122.8 138.9 99.4C141.8 88.5 143 59 141 48.5C135.7 21.5 121 6.9 94.3 1.8C81.6 -0.6 59 -0.6 46.6 1.9Z" },
  { id: "2", label: "Shape 2", viewBox: "0 0 112 117", d: "M44.5 1.4C27.9 6 12.9 18.3 6 33C-2.3 50.8 -2 68.4 6.9 86.4C16.1 105.2 35.1 116.9 56.5 116.9C83.8 116.8 105.2 100.2 110.6 74.7C112.9 63.7 112 44.6 108.7 35.7C102.4 18.7 89.6 6.4 73 1.5C66.4 -0.5 51.5 -0.5 44.5 1.4Z" },
  { id: "3", label: "Shape 3", viewBox: "0 0 130 125", d: "M62.6 0.5C56.6 2.1 50.6 10.5 44 26.6C42.2 31 39.9 34.9 38.8 35.5C37.7 36.1 32.5 37.6 27.1 38.9C6.9 43.8 0 48.2 0 56.4C0 61.6 3.8 65.9 13.8 72C18.1 74.6 22.6 77.7 23.9 78.8C26.5 81.1 26.5 80.7 23.6 101.7C21.9 114.1 22.3 118.4 25.6 121.9C27.4 123.9 28.9 124.4 32.8 124.4C38.3 124.4 44.1 121.3 56 112C60 108.9 64.1 106.4 65.2 106.4C66.4 106.4 72.5 109.5 78.9 113.2C93.2 121.7 98.6 123.8 104.1 123.1C114 121.8 116 114.1 111.6 94C110.2 87.5 109 81.3 109 80.2C109 79.1 112.9 74.1 118.1 68.7C127.9 58.4 130.5 53.9 129.6 48.9C128.3 42.2 122.5 39.3 105.5 36.8C98.9 35.9 92.7 34.7 91.8 34.2C90.8 33.7 87.2 27.4 83.6 20.1C75.3 2.9 70.4 -1.6 62.6 0.5Z" },
  { id: "4", label: "Shape 4", viewBox: "0 0 107 114", d: "M36.3 0.5C16.6 2.8 6.3 10.2 2.3 25C0.2 32.9 -0.8 68.5 0.7 80.9C3.9 106.8 17.1 114.5 56.4 113.2C67.5 112.9 75.4 112.1 79.4 111.1C96.4 106.4 104.7 97.2 106.4 80.9C107.4 70.4 105.3 27.6 103.4 22.3C99.8 12.3 89.9 4.9 76.1 2C67.7 0.2 45.7 -0.6 36.3 0.5Z" },
  { id: "5", label: "Shape 5", viewBox: "0 0 116 113", d: "M49.4 0.6C25.1 4.2 4.5 25 0.5 49.9C-2.9 71.1 11.5 95.8 33.5 106.3C56.1 117.2 80.4 113.8 97.9 97.4C109.5 86.6 115.6 72.6 115.7 57C115.7 45.5 113.1 37.2 106.4 27.1C93.7 8 70.8 -2.6 49.4 0.6Z" },
  { id: "6", label: "Shape 6", viewBox: "0 0 121 104", d: "M24.4 0.6C4.7 5.7 -4.8 25.7 2.4 47.2C9 67.1 26.9 86.7 49.7 99C56.5 102.7 58.2 103.2 63.9 103.2C73.4 103.2 78.3 100.4 91 87.8C116.2 62.7 126.1 36.9 117.9 17.8C113.4 7.3 103.4 1.2 90.7 1.2C83.4 1.2 82.5 1.5 72.7 6.5C67.1 9.4 61.8 11.7 61.1 11.7C60.4 11.7 57.2 10.1 54 8.2C43.5 1.6 31.8 -1.3 24.4 0.6Z" },
  { id: "7", label: "Shape 7", viewBox: "0 0 83 82", d: "M32.1 2.3C26.2 5.2 5.4 26 2.4 32.1C-2.8 42.8 0 50.1 15.6 65.6C37.6 87.4 44.9 87.4 66.9 65.4C88.3 44.2 88.1 36.9 66 15.5C50.1 0.2 42.6 -2.8 32.1 2.3Z" },
  { id: "8", label: "Shape 8", viewBox: "0 0 107 105", d: "M46.9 0.9C34 4.6 20 21.3 8.5 47.2C-4.2 75.3 -2.6 93.7 12.9 101.4C18.1 103.9 19.3 104.1 31.4 104.1C62.7 104.1 96.5 90.8 104.5 75.5C105.6 73.4 106.5 69 106.8 63.8C107.1 56.7 106.8 54.3 104.4 47C101.5 38 94.6 25.5 88.7 18.7C76.7 4.6 59.6 -2.7 46.9 0.9Z" },
  { id: "9", label: "Shape 9", viewBox: "0 0 129 93", d: "M42.4 1.6C33.4 3.5 26.7 6.2 20.1 10.6C-9.1 30 -5.9 71.7 26 86.4C35.9 91 46.3 92.9 60.6 92.9C85.9 92.9 104.7 86.1 117.8 72.2C124.7 64.9 127.8 57.6 128.5 47.3C130.1 24.3 114.2 8.1 83.8 1.9C72 -0.5 52.7 -0.7 42.4 1.6Z" },
  { id: "10", label: "Shape 10", viewBox: "0 0 121 100", d: "M46.1 0.9C13.3 6.4 -4.2 25.4 0.9 49.9C2.9 59.8 6.7 66.2 15.9 75.4C25.1 84.5 31.8 88.8 44.6 93.6C69.7 103 94.4 100.7 107.3 87.8C121.7 73.3 125 42.2 114.1 23.6C108 13.1 94.6 4.6 79.2 1.4C71.1 -0.2 54.5 -0.5 46.1 0.9Z" },
  { id: "11", label: "Shape 11", viewBox: "0 0 79 76", d: "M6.7 1.8C-1.2 6.7 -2 14.3 3.7 26.5C8.1 35.6 8.3 39.3 4.8 47.9C-0.3 60.4 0.8 68.6 8.4 73.7C13.2 77 20.6 76.4 29.6 72.1C37.8 68.1 41.2 68.1 50.7 71.9C60.1 75.6 66.6 75.8 71.5 72.6C78.5 67.9 79.5 59.5 74.4 48C72.7 44.2 71.4 39.6 71.4 37.9C71.4 36.2 73 31.4 75 27.1C81.1 14.2 79.7 5.6 70.7 1.4C65.7 -1 58.1 -0.1 49.7 3.8C41.4 7.7 38 7.7 29 3.7C19.8 -0.4 11.3 -1.1 6.7 1.8Z" },
  { id: "12", label: "Shape 12", viewBox: "0 0 65 81", d: "M24.7 1C11.2 4.8 2.9 15.8 0.7 32.8C-0.8 43.9 0.3 71.9 2.3 75.8C4.5 80 8.8 80.7 32.3 80.7C55.3 80.7 59.9 80 62.5 75.9C65.1 72 65.1 30.9 62.6 22.7C57.5 6.8 40 -3.3 24.7 1Z" },
  { id: "13", label: "Shape 13", viewBox: "0 0 86 67", d: "M21.7 0.6C11.4 1.6 5.6 4.3 2.5 9.6C0.6 12.7 0.4 15.1 0.1 31.2C-0.3 50.9 0.4 55.7 4.5 60.5C9.3 66.3 13.4 67 37.3 66.3C73.5 65.2 78.6 63.9 83.2 54.6C85.1 50.8 85.4 48.1 85.7 35.6C86.2 18.6 85 11.1 81.1 6.5C76.4 0.9 73.6 0.3 50.9 0C39.6 -0.1 26.5 0.2 21.7 0.6Z" },
  { id: "14", label: "Shape 14", viewBox: "0 0 110 104", d: "M47.2 1.1C41.7 3.2 36.6 6.6 34.3 9.8C31.2 14.2 3 63.8 1.3 67.8C-0.8 72.9 -0.3 81.4 2.3 87.6C4.9 93.5 9.6 98.1 16.3 101.2C20.6 103.2 22.4 103.3 54.9 103.3C87.3 103.3 89.1 103.2 93.4 101.2C103.8 96.4 109.4 88 109.4 77.1C109.4 73.6 108.7 69.1 107.8 67.1C104.8 59.8 76.1 10.7 73.2 7.8C66.6 1.2 55 -1.8 47.2 1.1Z" },
];

// Extracted from constants/theme.ts (light + dark chrome tokens relevant to the card)
const APP_THEME = {
  light: {
    text: "#11181C",
    textSecondary: "#6B7280",
    background: "#FFFFFF",
    backgroundSecondary: "#F0F0F0",
    border: "#E5E7EB",
    cardBackground: "#FFFFFF",
    glassBorder: "rgba(17, 24, 28, 0.1)",
    stripeColor: "#000000",
    stripeOpacity: 0.06,
  },
  dark: {
    text: "#ECEDEE",
    textSecondary: "#9BA1A6",
    background: "#151718",
    backgroundSecondary: "#2C2C2E",
    border: "#374151",
    cardBackground: "#1F2225",
    glassBorder: "rgba(255, 255, 255, 0.12)",
    stripeColor: "#FFFFFF",
    stripeOpacity: 0.09,
  },
};
