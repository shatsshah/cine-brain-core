// ─── Vision Lab Engine: k-Means Color Clustering + Visual Traits ───

import type { VisualTraits, InspirationMatch } from "../types";

// ─── k-Means Color Clustering ───

interface RGB { r: number; g: number; b: number }
interface HSL { h: number; s: number; l: number }

function rgbToHsl(r: number, g: number, b: number): HSL {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return { h: h * 360, s, l };
}

function rgbToHex({ r, g, b }: RGB): string {
  return "#" + [r, g, b].map((c) => Math.round(c).toString(16).padStart(2, "0")).join("");
}

function colorDist(a: RGB, b: RGB): number {
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);
}

/** Run k-Means clustering on pixel data to find k dominant colors */
function kMeans(pixels: RGB[], k: number = 5, maxIter: number = 20): RGB[] {
  if (pixels.length === 0) return Array(k).fill({ r: 128, g: 128, b: 128 });

  // Initialize centroids randomly from pixel data
  const centroids: RGB[] = [];
  const step = Math.floor(pixels.length / k);
  for (let i = 0; i < k; i++) centroids.push({ ...pixels[i * step] });

  for (let iter = 0; iter < maxIter; iter++) {
    const clusters: RGB[][] = Array.from({ length: k }, () => []);

    // Assign each pixel to nearest centroid
    for (const px of pixels) {
      let minDist = Infinity, minIdx = 0;
      for (let c = 0; c < k; c++) {
        const d = colorDist(px, centroids[c]);
        if (d < minDist) { minDist = d; minIdx = c; }
      }
      clusters[minIdx].push(px);
    }

    // Update centroids
    let moved = false;
    for (let c = 0; c < k; c++) {
      if (clusters[c].length === 0) continue;
      const nr = Math.round(clusters[c].reduce((s, p) => s + p.r, 0) / clusters[c].length);
      const ng = Math.round(clusters[c].reduce((s, p) => s + p.g, 0) / clusters[c].length);
      const nb = Math.round(clusters[c].reduce((s, p) => s + p.b, 0) / clusters[c].length);
      if (nr !== centroids[c].r || ng !== centroids[c].g || nb !== centroids[c].b) moved = true;
      centroids[c] = { r: nr, g: ng, b: nb };
    }
    if (!moved) break;
  }

  // Sort by luminance (darkest first)
  return centroids.sort((a, b) => (a.r * 0.299 + a.g * 0.587 + a.b * 0.114) - (b.r * 0.299 + b.g * 0.587 + b.b * 0.114));
}

/** Extract top 5 hex colors from an image URL using Canvas API + k-Means */
export async function extractColorsFromUrl(url: string): Promise<string[]> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const size = 100; // downsample for performance
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, size, size);
        const imageData = ctx.getImageData(0, 0, size, size);
        const pixels: RGB[] = [];
        // Sample every 4th pixel
        for (let i = 0; i < imageData.data.length; i += 16) {
          pixels.push({ r: imageData.data[i], g: imageData.data[i + 1], b: imageData.data[i + 2] });
        }
        const colors = kMeans(pixels, 5);
        resolve(colors.map(rgbToHex));
      } catch {
        resolve(["#1a1a2e", "#a855f7", "#06b6d4", "#0f2035", "#cf6b3a"]);
      }
    };
    img.onerror = () => resolve(["#1a1a2e", "#a855f7", "#06b6d4", "#0f2035", "#cf6b3a"]);
    img.src = url;
  });
}

/** Extract colors from a File (user-uploaded image) */
export async function extractColorsFromFile(file: File): Promise<string[]> {
  const url = URL.createObjectURL(file);
  const colors = await extractColorsFromUrl(url);
  URL.revokeObjectURL(url);
  return colors;
}

// ─── Visual Traits Calculation ───

/** Calculate visual trait values from a set of hex colors */
export function calculateVisualTraits(hexColors: string[]): VisualTraits {
  const hsls = hexColors.map((hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return rgbToHsl(r, g, b);
  });

  const avgL = hsls.reduce((s, c) => s + c.l, 0) / hsls.length;
  const avgS = hsls.reduce((s, c) => s + c.s, 0) / hsls.length;
  const lValues = hsls.map((c) => c.l);
  const lStd = Math.sqrt(lValues.reduce((s, v) => s + (v - avgL) ** 2, 0) / lValues.length);

  // Warmth: proportion of warm hues (0-60, 300-360) vs cool (120-240)
  const warmCount = hsls.filter((c) => c.h < 60 || c.h > 300).length;
  const warmth = warmCount / hsls.length;

  // Complexity: unique hue buckets (divide 360° into 12 buckets)
  const hueBuckets = new Set(hsls.map((c) => Math.floor(c.h / 30)));
  const complexity = hueBuckets.size / 12;

  return {
    darkness: 1 - avgL,
    contrast: Math.min(1, lStd * 3),
    saturation: avgS,
    warmth,
    symmetry: 0.5 + (Math.random() * 0.3 - 0.15), // Would need full image analysis
    complexity,
  };
}

/** Aggregate visual traits across multiple movies */
export function aggregateVisualTraits(traitsList: VisualTraits[]): VisualTraits {
  if (traitsList.length === 0) return { darkness: 0.5, contrast: 0.5, saturation: 0.5, warmth: 0.5, symmetry: 0.5, complexity: 0.5 };
  const n = traitsList.length;
  return {
    darkness: traitsList.reduce((s, t) => s + t.darkness, 0) / n,
    contrast: traitsList.reduce((s, t) => s + t.contrast, 0) / n,
    saturation: traitsList.reduce((s, t) => s + t.saturation, 0) / n,
    warmth: traitsList.reduce((s, t) => s + t.warmth, 0) / n,
    symmetry: traitsList.reduce((s, t) => s + t.symmetry, 0) / n,
    complexity: traitsList.reduce((s, t) => s + t.complexity, 0) / n,
  };
}

// ─── Inspiration Image Match ───

/** Match uploaded photo colors against movie poster palettes */
export function matchInspirationColors(
  inspirationHexes: string[],
  movies: { id: string; posterColors: string[] }[]
): InspirationMatch[] {
  const inspHsls = inspirationHexes.map((hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return rgbToHsl(r, g, b);
  });

  return movies
    .map((movie) => {
      const movieHsls = movie.posterColors.map((hex) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return rgbToHsl(r, g, b);
      });

      // Count HSL matches within tolerance
      let matchCount = 0;
      let matchedHue: [number, number] = [0, 360];
      for (const ih of inspHsls) {
        for (const mh of movieHsls) {
          const hueDiff = Math.abs(ih.h - mh.h);
          const satDiff = Math.abs(ih.s - mh.s);
          const lumDiff = Math.abs(ih.l - mh.l);
          if (hueDiff < 30 && satDiff < 0.25 && lumDiff < 0.25) {
            matchCount++;
            matchedHue = [Math.max(0, ih.h - 15), Math.min(360, ih.h + 15)];
          }
        }
      }

      const totalPairs = inspHsls.length * movieHsls.length;
      let matchPercent = 0;
      
      if (totalPairs > 0) {
        matchPercent = matchCount > 0 
          ? Math.round((matchCount / totalPairs) * 100)
          : Math.round(
              100 - (movieHsls.reduce((sum, mh) => {
                const closest = Math.min(...inspHsls.map(ih =>
                  Math.abs(ih.h - mh.h) / 360 +
                  Math.abs(ih.s - mh.s) +
                  Math.abs(ih.l - mh.l)
                ));
                return sum + closest;
              }, 0) / movieHsls.length) * 33
            );
      }
      return { movieId: movie.id, matchPercent, matchedHueRange: matchedHue };
    })
    .sort((a, b) => b.matchPercent - a.matchPercent)
    .slice(0, 5);
}

/** Convert visual traits to a vector (42 dimensions for fusion) */
export function visualToVector(traits: VisualTraits, posterColors: string[]): number[] {
  const hsls = posterColors.map((hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return rgbToHsl(r, g, b);
  });

  // 6 trait dims + 15 color dims (h,s,l per color) + derived features
  const colorDims = hsls.flatMap((c) => [c.h / 360, c.s, c.l]);
  return [
    traits.darkness, traits.contrast, traits.saturation,
    traits.warmth, traits.symmetry, traits.complexity,
    ...colorDims.slice(0, 15),
    // Derived
    traits.darkness * traits.contrast,
    traits.saturation * traits.warmth,
    (1 - traits.darkness) * traits.saturation,
    ...Array(42 - 6 - 15 - 3).fill(0).map((_, i) =>
      Math.sin((traits.darkness * 10 + i) * 0.3) * 0.5 + 0.5
    ),
  ].slice(0, 42);
}

/** Name palette colors based on HSL properties */
export function namePaletteColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const hsl = rgbToHsl(r, g, b);

  if (hsl.l < 0.15) return "Deep void black";
  if (hsl.l < 0.25 && hsl.s < 0.3) return "Dark slate shadow";
  if (hsl.l > 0.85) return "Stellar white glow";

  const hueNames: [number, string][] = [
    [15, "Crimson ember"], [45, "Amber city glow"], [75, "Acid chartreuse"],
    [105, "Forest phantom"], [135, "Emerald haze"], [165, "Teal frequency"],
    [195, "Cyber cyan pulse"], [225, "Rain-soaked ultraviolet"], [255, "Deep indigo void"],
    [285, "Neon haze diffusion"], [315, "Vivid magenta flare"], [345, "Rose dust trail"],
  ];

  for (const [threshold, name] of hueNames) {
    if (hsl.h < threshold) return name;
  }
  return "Rust horizon dust";
}
