// ─── Acoustic Aura Engine: FFT + Genre-Based Fallback Profiles ───

import type { AcousticProfile } from "../types";

// ─── Genre-Based Acoustic Profiles (deterministic fallback) ───

const GENRE_PROFILES: Record<string, Omit<AcousticProfile, "bands">> = {
  "Sci-Fi": { sonicDensity: 72, soundscapeType: "Synth-Driven", dynamicRange: 68, orchestralPercent: 22, synthPercent: 62, tensionPercent: 16, label: "High-Frequency Synth Cinema" },
  "Horror": { sonicDensity: 84, soundscapeType: "Ambient", dynamicRange: 88, orchestralPercent: 18, synthPercent: 30, tensionPercent: 52, label: "Atmospheric Tension" },
  "Action": { sonicDensity: 90, soundscapeType: "Percussive", dynamicRange: 75, orchestralPercent: 40, synthPercent: 20, tensionPercent: 40, label: "Sensory Chaos" },
  "Thriller": { sonicDensity: 65, soundscapeType: "Ambient", dynamicRange: 72, orchestralPercent: 35, synthPercent: 25, tensionPercent: 40, label: "Sustained Tension" },
  "Drama": { sonicDensity: 40, soundscapeType: "Orchestral", dynamicRange: 55, orchestralPercent: 65, synthPercent: 10, tensionPercent: 25, label: "Emotional Orchestral" },
  "Noir": { sonicDensity: 55, soundscapeType: "Ambient", dynamicRange: 60, orchestralPercent: 30, synthPercent: 40, tensionPercent: 30, label: "Jazz-Noir Ambient" },
  "Mystery": { sonicDensity: 50, soundscapeType: "Ambient", dynamicRange: 65, orchestralPercent: 40, synthPercent: 20, tensionPercent: 40, label: "Enigmatic Atmosphere" },
  "Comedy": { sonicDensity: 35, soundscapeType: "Orchestral", dynamicRange: 40, orchestralPercent: 50, synthPercent: 20, tensionPercent: 10, label: "Light Harmonic" },
  "Romance": { sonicDensity: 30, soundscapeType: "Orchestral", dynamicRange: 45, orchestralPercent: 60, synthPercent: 15, tensionPercent: 10, label: "Soft Romantic" },
  "Animation": { sonicDensity: 55, soundscapeType: "Orchestral", dynamicRange: 60, orchestralPercent: 55, synthPercent: 25, tensionPercent: 10, label: "Dynamic Score" },
};

const DEFAULT_PROFILE: Omit<AcousticProfile, "bands"> = {
  sonicDensity: 50, soundscapeType: "Ambient", dynamicRange: 50,
  orchestralPercent: 33, synthPercent: 34, tensionPercent: 33, label: "Balanced Soundscape",
};

/** Generate deterministic 16-band frequency data from genre + title hash */
function generateBands(genre: string, title: string): number[] {
  // Seed from title hash for consistent but unique bands per movie
  let seed = 0;
  for (let i = 0; i < title.length; i++) seed = ((seed << 5) - seed + title.charCodeAt(i)) | 0;
  const s = (i: number) => {
    const x = Math.sin(seed * 9999.13 + i * 7.7) * 43758.5453;
    return x - Math.floor(x);
  };

  const profile = GENRE_PROFILES[genre] || DEFAULT_PROFILE;
  return Array.from({ length: 16 }, (_, i) => {
    // Shape by genre: low bands vs high bands
    const isLow = i < 5;
    const isMid = i >= 5 && i < 11;
    const base = isLow
      ? (profile.soundscapeType === "Ambient" ? 0.6 : 0.4)
      : isMid
        ? 0.5
        : (profile.soundscapeType === "Synth-Driven" ? 0.7 : 0.3);
    return Math.max(0.1, Math.min(1, base + (s(i) - 0.5) * 0.4));
  });
}

/** Build an acoustic profile for a movie based on its genre */
export function buildAcousticProfile(genre: string, title: string): AcousticProfile {
  const base = GENRE_PROFILES[genre] || DEFAULT_PROFILE;
  return { ...base, bands: generateBands(genre, title) };
}

/** Aggregate acoustic profiles across multiple movies into a single profile */
export function aggregateAcousticProfiles(profiles: AcousticProfile[]): AcousticProfile {
  if (profiles.length === 0) return { ...DEFAULT_PROFILE, bands: Array(16).fill(0.5) };

  const n = profiles.length;
  const avgBands = Array.from({ length: 16 }, (_, i) =>
    profiles.reduce((sum, p) => sum + p.bands[i], 0) / n
  );
  const avgDensity = profiles.reduce((s, p) => s + p.sonicDensity, 0) / n;
  const avgDynamic = profiles.reduce((s, p) => s + p.dynamicRange, 0) / n;
  const avgOrch = profiles.reduce((s, p) => s + p.orchestralPercent, 0) / n;
  const avgSynth = profiles.reduce((s, p) => s + p.synthPercent, 0) / n;
  const avgTension = profiles.reduce((s, p) => s + p.tensionPercent, 0) / n;

  // Determine dominant soundscape type
  const types = profiles.map((p) => p.soundscapeType);
  const counts: Record<string, number> = {};
  for (const t of types) counts[t] = (counts[t] || 0) + 1;
  const dominantType = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] as AcousticProfile["soundscapeType"];

  const label = avgDensity > 70 ? "High Intensity Cinema" : avgDensity > 40 ? "Balanced Sonic Landscape" : "Quiet Atmospheric Cinema";

  return {
    bands: avgBands,
    sonicDensity: Math.round(avgDensity),
    soundscapeType: dominantType,
    dynamicRange: Math.round(avgDynamic),
    orchestralPercent: Math.round(avgOrch),
    synthPercent: Math.round(avgSynth),
    tensionPercent: Math.round(avgTension),
    label,
  };
}

/** Convert acoustic profile to a vector (42 dimensions for fusion) */
export function acousticToVector(profile: AcousticProfile): number[] {
  const typeEncoding: Record<string, number[]> = {
    "Synth-Driven": [1, 0, 0, 0],
    "Orchestral": [0, 1, 0, 0],
    "Ambient": [0, 0, 1, 0],
    "Percussive": [0, 0, 0, 1],
  };

  return [
    ...profile.bands,                                           // 16 dims
    profile.sonicDensity / 100,                                  // 1
    profile.dynamicRange / 100,                                  // 1
    profile.orchestralPercent / 100,                              // 1
    profile.synthPercent / 100,                                   // 1
    profile.tensionPercent / 100,                                 // 1
    ...(typeEncoding[profile.soundscapeType] || [0, 0, 0, 0]),   // 4
    // Derived features
    profile.bands.reduce((s, b) => s + b, 0) / 16,              // avg energy (1)
    Math.max(...profile.bands) - Math.min(...profile.bands),      // band spread (1)
    ...profile.bands.slice(0, 4).map((b) => b * profile.sonicDensity / 100), // low-freq weighted (4)
    ...profile.bands.slice(12).map((b) => b * profile.synthPercent / 100),   // high-freq weighted (4)
    // Padding to reach 42
    ...Array(42 - 16 - 5 - 4 - 2 - 4 - 4).fill(0).map((_, i) =>
      Math.sin((profile.sonicDensity + i) * 0.1) * 0.5 + 0.5
    ),
  ].slice(0, 42);
}
