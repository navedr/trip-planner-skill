/**
 * Destination-adaptive color system.
 *
 * Each destination maps to a palette that shifts the UI accent
 * to evoke the spirit of that place — desert warmth for SLC,
 * cherry blossom pinks for Tokyo, tropical greens for Bali.
 */

export interface DestinationPalette {
  /** Primary accent color */
  accent: string;
  /** Secondary/complement color */
  complement: string;
  /** Subtle background tint (very low opacity) */
  tint: string;
  /** CSS gradient for hero sections */
  gradient: string;
}

const palettes: Record<string, DestinationPalette> = {
  // Desert / Mountain West
  "salt lake city": {
    accent: "#c2703e",
    complement: "#7c9a72",
    tint: "hsla(24, 52%, 50%, 0.06)",
    gradient:
      "radial-gradient(ellipse at 30% 40%, hsla(24, 52%, 50%, 0.12) 0%, transparent 60%), radial-gradient(ellipse at 70% 60%, hsla(135, 16%, 53%, 0.08) 0%, transparent 50%)",
  },
  slc: {
    accent: "#c2703e",
    complement: "#7c9a72",
    tint: "hsla(24, 52%, 50%, 0.06)",
    gradient:
      "radial-gradient(ellipse at 30% 40%, hsla(24, 52%, 50%, 0.12) 0%, transparent 60%), radial-gradient(ellipse at 70% 60%, hsla(135, 16%, 53%, 0.08) 0%, transparent 50%)",
  },

  // Japan
  tokyo: {
    accent: "#c75b7a",
    complement: "#5c6bc0",
    tint: "hsla(345, 45%, 57%, 0.06)",
    gradient:
      "radial-gradient(ellipse at 25% 30%, hsla(345, 45%, 57%, 0.12) 0%, transparent 60%), radial-gradient(ellipse at 75% 50%, hsla(232, 36%, 56%, 0.08) 0%, transparent 50%)",
  },
  kyoto: {
    accent: "#c75b7a",
    complement: "#8b7355",
    tint: "hsla(345, 45%, 57%, 0.06)",
    gradient:
      "radial-gradient(ellipse at 40% 30%, hsla(345, 45%, 57%, 0.10) 0%, transparent 60%), radial-gradient(ellipse at 60% 70%, hsla(30, 25%, 44%, 0.08) 0%, transparent 50%)",
  },

  // Tropical
  bali: {
    accent: "#2e9e6e",
    complement: "#d4a843",
    tint: "hsla(155, 55%, 40%, 0.06)",
    gradient:
      "radial-gradient(ellipse at 20% 60%, hsla(155, 55%, 40%, 0.12) 0%, transparent 60%), radial-gradient(ellipse at 80% 30%, hsla(40, 56%, 55%, 0.08) 0%, transparent 50%)",
  },

  // Coastal
  barcelona: {
    accent: "#d97706",
    complement: "#5b9bd5",
    tint: "hsla(38, 92%, 50%, 0.06)",
    gradient:
      "radial-gradient(ellipse at 30% 50%, hsla(38, 92%, 50%, 0.10) 0%, transparent 60%), radial-gradient(ellipse at 70% 30%, hsla(210, 55%, 60%, 0.08) 0%, transparent 50%)",
  },
  lisbon: {
    accent: "#e8a838",
    complement: "#5b9bd5",
    tint: "hsla(38, 78%, 56%, 0.06)",
    gradient:
      "radial-gradient(ellipse at 40% 40%, hsla(38, 78%, 56%, 0.10) 0%, transparent 60%), radial-gradient(ellipse at 60% 60%, hsla(210, 55%, 60%, 0.08) 0%, transparent 50%)",
  },

  // Mediterranean
  santorini: {
    accent: "#5b9bd5",
    complement: "#e0e0e0",
    tint: "hsla(210, 55%, 60%, 0.06)",
    gradient:
      "radial-gradient(ellipse at 50% 30%, hsla(210, 55%, 60%, 0.14) 0%, transparent 60%), radial-gradient(ellipse at 50% 70%, hsla(0, 0%, 90%, 0.04) 0%, transparent 50%)",
  },

  // Nordic
  reykjavik: {
    accent: "#7aa2c4",
    complement: "#8b9a72",
    tint: "hsla(210, 35%, 62%, 0.06)",
    gradient:
      "radial-gradient(ellipse at 30% 30%, hsla(210, 35%, 62%, 0.10) 0%, transparent 60%), radial-gradient(ellipse at 70% 70%, hsla(90, 16%, 53%, 0.06) 0%, transparent 50%)",
  },

  // Urban
  "new york": {
    accent: "#8c8c8c",
    complement: "#d4a843",
    tint: "hsla(0, 0%, 55%, 0.04)",
    gradient:
      "radial-gradient(ellipse at 50% 40%, hsla(0, 0%, 55%, 0.08) 0%, transparent 60%), radial-gradient(ellipse at 50% 60%, hsla(40, 56%, 55%, 0.06) 0%, transparent 50%)",
  },
  paris: {
    accent: "#b8860b",
    complement: "#7c7c8a",
    tint: "hsla(43, 87%, 38%, 0.06)",
    gradient:
      "radial-gradient(ellipse at 40% 30%, hsla(43, 87%, 38%, 0.12) 0%, transparent 60%), radial-gradient(ellipse at 60% 60%, hsla(240, 5%, 52%, 0.06) 0%, transparent 50%)",
  },
};

/** Default palette when destination doesn't match any known entry */
const defaultPalette: DestinationPalette = {
  accent: "#c2703e",
  complement: "#7c9a72",
  tint: "hsla(24, 52%, 50%, 0.04)",
  gradient:
    "radial-gradient(ellipse at 20% 50%, hsla(24, 52%, 50%, 0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, hsla(40, 56%, 55%, 0.06) 0%, transparent 50%)",
};

/**
 * Get the color palette for a destination.
 * Matches case-insensitively against known destinations.
 */
export function getDestinationPalette(
  destination: string,
): DestinationPalette {
  const key = destination.toLowerCase().trim();
  // Exact match
  if (palettes[key]) return palettes[key];
  // Partial match — check if destination contains a known key
  for (const [name, palette] of Object.entries(palettes)) {
    if (key.includes(name) || name.includes(key)) return palette;
  }
  return defaultPalette;
}

/**
 * Apply a destination palette as CSS custom properties to an element.
 */
export function applyPalette(
  el: HTMLElement,
  palette: DestinationPalette,
): void {
  el.style.setProperty("--dest-accent", palette.accent);
  el.style.setProperty("--dest-complement", palette.complement);
  el.style.setProperty("--dest-tint", palette.tint);
}
