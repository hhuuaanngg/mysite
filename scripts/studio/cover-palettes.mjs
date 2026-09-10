export const COVER_PALETTES = [
  { id: "peach", label: "暖橙", from: "#fde8d8", to: "#f7c9b4", accent: "#c4552a" },
  { id: "apricot", label: "杏色", from: "#fde8d8", to: "#f5c9a8", accent: "#c2410c" },
  { id: "mint", label: "薄荷绿", from: "#d8f3ea", to: "#b7e4d4", accent: "#0f7b6c" },
  { id: "gold", label: "柠檬黄", from: "#fff3d6", to: "#ffe08a", accent: "#c19100" },
  { id: "sky", label: "天空蓝", from: "#d6eaf8", to: "#b7d8f5", accent: "#2383e2" },
  { id: "leaf", label: "嫩绿", from: "#e8f4d8", to: "#cfe8b4", accent: "#4d7c0f" },
  { id: "lilac", label: "丁香紫", from: "#efe4fb", to: "#d9c4f5", accent: "#7c3aed" },
  { id: "ink", label: "靛蓝", from: "#dbeafe", to: "#bfdbfe", accent: "#1d4ed8" },
];

export const DEFAULT_PALETTE_ID = "peach";

function norm(value) {
  return String(value || "").trim().toLowerCase();
}

export function paletteById(id) {
  return COVER_PALETTES.find((item) => item.id === id) || null;
}

export function resolveCoverPalette(cover = {}) {
  const byId = paletteById(cover.palette);
  if (byId) return byId;

  const from = norm(cover.from);
  const to = norm(cover.to);
  const accent = norm(cover.accent);
  const matched = COVER_PALETTES.find(
    (item) => item.from === from && item.to === to && item.accent === accent,
  );
  if (matched) return matched;

  if (!from && !to && !accent) {
    return paletteById(DEFAULT_PALETTE_ID);
  }

  throw new Error("请选择一套封面配色");
}
