// ─── Fusion Engine: 128-dim Vector Fusion + Archetype Matching ───

import type { ArchetypeCentroid, ArchetypeResult } from "../types";

// ─── 8 Pre-defined Archetype Centroids ───
// Each has a 128-dim vector encoding characteristic taste patterns.
// In practice these are learned; here we define them as interpretable seed vectors.

function generateCentroid(seed: number, bias: number[]): number[] {
  const vec: number[] = [];
  for (let i = 0; i < 128; i++) {
    const x = Math.sin(seed * 9999.13 + i * 7.7 + (bias[i % bias.length] || 0) * 3.3) * 43758.5453;
    vec.push((x - Math.floor(x)) * 2 - 1); // normalize to [-1, 1]
  }
  return vec;
}

export const ARCHETYPE_CENTROIDS: ArchetypeCentroid[] = [
  {
    name: "The Cosmic Dreamer",
    vector: generateCentroid(1, [0.8, 0.2, 0.7, 0.9, 0.1]),
    blurb: "You seek films that render the infinite human condition against vast, indifferent backdrops. Isolation is not a punishment — it is a philosophical condition you return to. You believe in beauty inside entropy.",
    films: ["Blade Runner 2049", "Annihilation", "Interstellar"],
  },
  {
    name: "The Social Analyst",
    vector: generateCentroid(2, [0.3, 0.9, 0.4, 0.2, 0.8]),
    blurb: "You dissect power structures through cinema. Every frame is evidence of class, corruption, or quiet rebellion. Films are your sociology textbooks.",
    films: ["Parasite", "Joker", "The Dark Knight"],
  },
  {
    name: "The Adrenaline Purist",
    vector: generateCentroid(3, [0.1, 0.1, 0.9, 0.8, 0.9]),
    blurb: "Precision in chaos. You seek films where every action beat is choreographed to perfection. Narrative is the vehicle, but kinetic energy is the destination.",
    films: ["Tenet", "The Dark Knight", "Drive"],
  },
  {
    name: "The Melancholy Romantic",
    vector: generateCentroid(4, [0.7, 0.8, 0.2, 0.6, 0.3]),
    blurb: "You chase the ache. Your favorite films don't end happily — they end honestly. You find more truth in a single tear than in a thousand explosions.",
    films: ["Arrival", "Nocturnal Animals", "Mulholland Drive"],
  },
  {
    name: "The Tactical Mind",
    vector: generateCentroid(5, [0.4, 0.3, 0.8, 0.5, 0.7]),
    blurb: "Every film is a chess game. You admire precision, planning, and the elegant dismantling of systems. The heist is your symphony.",
    films: ["Inception", "Tenet", "Prisoners"],
  },
  {
    name: "The Chaos Architect",
    vector: generateCentroid(6, [0.2, 0.5, 0.6, 0.9, 0.4]),
    blurb: "You don't just watch destruction — you study it. In the fracture of order, you see art. Your cinema is a controlled detonation of expectations.",
    films: ["Hereditary", "Midsommar", "The Dark Knight"],
  },
  {
    name: "The Silent Observer",
    vector: generateCentroid(7, [0.9, 0.4, 0.1, 0.3, 0.6]),
    blurb: "You are drawn to films where the camera lingers. Where silence speaks louder than dialogue. Patience is your superpower, and slow cinema is your domain.",
    films: ["Arrival", "Blade Runner 2049", "Mulholland Drive"],
  },
  {
    name: "The Vintage Soul",
    vector: generateCentroid(8, [0.5, 0.7, 0.3, 0.4, 0.5]),
    blurb: "You carry the weight of cinema history. Every modern film is measured against the golden age. You see echoes of Hitchcock in every thriller and Kubrick in every frame.",
    films: ["Mulholland Drive", "Ghost in the Shell", "Drive"],
  },
];

// ─── Vector Math ───

/** Cosine similarity between two vectors */
export function cosineSimilarity(a: number[], b: number[]): number {
  const len = Math.min(a.length, b.length);
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

/** Euclidean distance between two vectors */
export function euclideanDistance(a: number[], b: number[]): number {
  const len = Math.min(a.length, b.length);
  let sum = 0;
  for (let i = 0; i < len; i++) sum += (a[i] - b[i]) ** 2;
  return Math.sqrt(sum);
}

// ─── Fusion ───

/** Fuse visual (42d), textual (44d), and acoustic (42d) vectors into 128d */
export function fuseVectors(
  visualVec: number[],
  textualVec: number[],
  acousticVec: number[]
): number[] {
  // Pad/trim each to target length
  const v = [...visualVec, ...Array(42).fill(0)].slice(0, 42);
  const t = [...textualVec, ...Array(44).fill(0)].slice(0, 44);
  const a = [...acousticVec, ...Array(42).fill(0)].slice(0, 42);
  return [...v, ...t, ...a]; // 42 + 44 + 42 = 128
}

/** Calculate match score between user vector and movie vector */
export function calculateMatchScore(
  userVector: number[],
  movieVector: number[],
  weights: { visual: number; textual: number; acoustic: number }
): number {
  const totalWeight = weights.visual + weights.textual + weights.acoustic;
  if (totalWeight === 0) return 50;

  // Split vectors into their component parts
  const uV = userVector.slice(0, 42);
  const uT = userVector.slice(42, 86);
  const uA = userVector.slice(86, 128);
  const mV = movieVector.slice(0, 42);
  const mT = movieVector.slice(42, 86);
  const mA = movieVector.slice(86, 128);

  const simV = (cosineSimilarity(uV, mV) + 1) / 2; // normalize to 0..1
  const simT = (cosineSimilarity(uT, mT) + 1) / 2;
  const simA = (cosineSimilarity(uA, mA) + 1) / 2;

  const weighted = (simV * weights.visual + simT * weights.textual + simA * weights.acoustic) / totalWeight;
  return Math.round(weighted * 100);
}

// ─── Archetype Matching ───

/** Find closest archetype centroid to user's fused vector */
export function matchArchetype(userVector: number[]): ArchetypeResult {
  let closest: ArchetypeCentroid = ARCHETYPE_CENTROIDS[0];
  let minDist = Infinity;

  for (const centroid of ARCHETYPE_CENTROIDS) {
    const dist = euclideanDistance(userVector, centroid.vector);
    if (dist < minDist) {
      minDist = dist;
      closest = centroid;
    }
  }

  // Confidence: inverse of distance, scaled to 0..100
  const maxDist = Math.sqrt(128 * 4); // theoretical max
  const confidence = Math.round(Math.max(50, (1 - minDist / maxDist) * 100));

  return {
    name: closest.name,
    confidence,
    blurb: closest.blurb,
    films: closest.films,
    distance: minDist,
  };
}

// ─── Galaxy Position Projection ───

/** Project 128d vectors into 3D positions for the galaxy visualization */
export function projectToGalaxy(
  movies: { id: string; fusedVector: number[]; genre: string }[]
): Record<string, { x: number; y: number; z: number }> {
  // Simple approach: Use genre clusters as base positions, then offset by vector properties
  const clusters: Record<string, [number, number]> = {
    "Sci-Fi": [-0.55, 0.55], Thriller: [0.6, 0.45], Drama: [0.4, -0.4],
    Horror: [-0.6, -0.5], Mystery: [0.05, -0.6], Action: [0.55, -0.05],
    Noir: [-0.3, 0.0], Comedy: [0.3, 0.5], Romance: [-0.2, 0.3],
    Animation: [0.1, 0.6], Crime: [0.5, -0.3], War: [0.6, -0.5],
    Adventure: [-0.4, 0.3], Fantasy: [-0.1, 0.4], Documentary: [0.2, -0.2],
  };

  const positions: Record<string, { x: number; y: number; z: number }> = {};

  for (let i = 0; i < movies.length; i++) {
    const m = movies[i];
    const [cx, cy] = clusters[m.genre] || [0, 0];
    // Use vector components for jitter
    const jx = (m.fusedVector[0] || 0) * 0.2;
    const jy = (m.fusedVector[1] || 0) * 0.2;
    const jz = (m.fusedVector[2] || 0) * 0.2;
    positions[m.id] = { x: cx + jx, y: cy + jy, z: jz };
  }

  return positions;
}
