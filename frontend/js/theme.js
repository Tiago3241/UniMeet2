/**
 * Centralized theme & secondary color customization engine for UniMeet.
 * Persists user preferences in localStorage and applies CSS custom properties on <html>.
 */

const THEME_STORAGE_KEY = "unimeet_theme_mode";
const SECONDARY_STORAGE_KEY = "unimeet_secondary_color";

export const SECONDARY_COLORS = [
  {
    id: "coral",
    name: "Terracotta Sienna",
    hex: "#c6522f",
    hover: "#a84222",
    tintLight: "#fbf0ec",
    tintDark: "rgba(198, 82, 47, 0.22)",
    textLight: "#9c381a",
    textDark: "#f09578",
    borderLight: "rgba(198, 82, 47, 0.36)",
    borderDark: "rgba(240, 149, 120, 0.42)",
  },
  {
    id: "sunset",
    name: "Warm Ochre",
    hex: "#c27018",
    hover: "#a25c10",
    tintLight: "#fdf5ea",
    tintDark: "rgba(194, 112, 24, 0.22)",
    textLight: "#96530d",
    textDark: "#f3b56c",
    borderLight: "rgba(194, 112, 24, 0.36)",
    borderDark: "rgba(243, 181, 108, 0.42)",
  },
  {
    id: "teal",
    name: "Adriatic Teal",
    hex: "#17736e",
    hover: "#115955",
    tintLight: "#ecf7f6",
    tintDark: "rgba(23, 115, 110, 0.24)",
    textLight: "#125c58",
    textDark: "#6ad1ca",
    borderLight: "rgba(23, 115, 110, 0.34)",
    borderDark: "rgba(106, 209, 202, 0.4)",
  },
  {
    id: "sky",
    name: "Cobalt Ink",
    hex: "#285496",
    hover: "#1e4176",
    tintLight: "#eef3fa",
    tintDark: "rgba(40, 84, 150, 0.24)",
    textLight: "#21467d",
    textDark: "#8eb5ef",
    borderLight: "rgba(40, 84, 150, 0.34)",
    borderDark: "rgba(142, 181, 239, 0.42)",
  },
  {
    id: "berry",
    name: "Fig Mulberry",
    hex: "#9c355c",
    hover: "#7e2849",
    tintLight: "#faf0f4",
    tintDark: "rgba(156, 53, 92, 0.24)",
    textLight: "#82294b",
    textDark: "#e696b3",
    borderLight: "rgba(156, 53, 92, 0.34)",
    borderDark: "rgba(230, 150, 179, 0.42)",
  },
  {
    id: "emerald",
    name: "Forest Sage",
    hex: "#2c6e49",
    hover: "#215538",
    tintLight: "#edf6f0",
    tintDark: "rgba(44, 110, 73, 0.24)",
    textLight: "#22593a",
    textDark: "#7fd1a2",
    borderLight: "rgba(44, 110, 73, 0.34)",
    borderDark: "rgba(127, 209, 162, 0.42)",
  },
];

export function getThemePreferences() {
  let mode = "light";
  let secondaryId = "coral";
  try {
    const storedMode = localStorage.getItem(THEME_STORAGE_KEY);
    if (storedMode === "dark" || storedMode === "light") {
      mode = storedMode;
    }
    const storedSecondary = localStorage.getItem(SECONDARY_STORAGE_KEY);
    if (storedSecondary && SECONDARY_COLORS.some((c) => c.id === storedSecondary)) {
      secondaryId = storedSecondary;
    }
  } catch {
    // Ignore storage restriction
  }
  return { mode, secondaryId };
}

export function applyThemePreferences({ mode, secondaryId } = getThemePreferences()) {
  const safeMode = mode === "dark" ? "dark" : "light";
  const swatch = SECONDARY_COLORS.find((c) => c.id === secondaryId) || SECONDARY_COLORS[0];

  const root = document.documentElement;
  root.setAttribute("data-theme", safeMode);
  root.setAttribute("data-secondary", swatch.id);

  const isDark = safeMode === "dark";
  const tint = isDark ? swatch.tintDark : swatch.tintLight;
  const text = isDark ? swatch.textDark : swatch.textLight;
  const border = isDark ? swatch.borderDark : swatch.borderLight;

  root.style.setProperty("--color-secondary", swatch.hex);
  root.style.setProperty("--color-secondary-hover", swatch.hover);
  root.style.setProperty("--color-secondary-tint", tint);
  root.style.setProperty("--color-secondary-text", text);
  root.style.setProperty("--color-secondary-border", border);
  root.style.setProperty("--color-coral", swatch.hex);
  root.style.setProperty("--color-coral-hover", swatch.hover);
  root.style.setProperty("--color-coral-tint", tint);

  const themeMeta = document.querySelector('meta[name="theme-color"]');
  if (themeMeta) {
    themeMeta.setAttribute("content", isDark ? "#111412" : "#f6f5f1");
  }
}

export function setThemeMode(mode) {
  const safeMode = mode === "dark" ? "dark" : "light";
  try {
    localStorage.setItem(THEME_STORAGE_KEY, safeMode);
  } catch {
    // Ignore
  }
  const prefs = getThemePreferences();
  applyThemePreferences({ mode: safeMode, secondaryId: prefs.secondaryId });
  return { mode: safeMode, secondaryId: prefs.secondaryId };
}

export function setSecondaryColor(secondaryId) {
  const swatch = SECONDARY_COLORS.find((c) => c.id === secondaryId) || SECONDARY_COLORS[0];
  try {
    localStorage.setItem(SECONDARY_STORAGE_KEY, swatch.id);
  } catch {
    // Ignore
  }
  const prefs = getThemePreferences();
  applyThemePreferences({ mode: prefs.mode, secondaryId: swatch.id });
  return { mode: prefs.mode, secondaryId: swatch.id };
}

export function resetThemePreferences() {
  try {
    localStorage.removeItem(THEME_STORAGE_KEY);
    localStorage.removeItem(SECONDARY_STORAGE_KEY);
  } catch {
    // Ignore
  }
  const defaults = { mode: "light", secondaryId: "coral" };
  applyThemePreferences(defaults);
  return defaults;
}

// Apply immediately when module loads
applyThemePreferences();
