// ─── Shared TypeScript Interfaces for Cine-Brain Engine ───

// ─── Core Movie Types ───
export interface RawTitle {
  title: string;
  year?: number;
  rating?: number;
  watchDate?: string;
  sentiment?: "like" | "dislike" | "neutral";
  source: "csv" | "pdf" | "json";
}

export interface EnrichedMovie {
  id: string;
  tmdbId?: number;
  title: string;
  year: number;
  genre: string;
  genres: string[];
  themes: string[];
  overview: string;
  posterUrl: string | null;
  posterColors: string[]; // Top 5 hex codes from k-Means
  visual: number;   // 0..100
  textual: number;
  acoustic: number;
  match: number;
  watched: boolean;
  sentiment: "like" | "dislike" | "neutral";
  sentimentMultiplier: number; // 1.0 normal, 1.5 for like, 0.0 for dislike
  evidence: string[];
  // Galaxy coordinates
  x: number;
  y: number;
  z: number;
  // Raw vector components
  visualVector: number[];
  textualVector: number[];
  acousticVector: number[];
  fusedVector: number[];
}

// ─── Ingestion Types ───
export type FileFormat = "netflix-csv" | "letterboxd-csv" | "imdb-csv" | "generic-csv" | "pdf" | "json";

export interface IngestionResult {
  titles: RawTitle[];
  format: FileFormat;
  rawCount: number;
  crossMatchCount: number;
}

export interface AuditReceipt {
  titlesProcessed: number;
  rawStringsDestroyed: number;
  vectorDimensions: number;
  identityStored: string;
  sha256Hash: string;
  timestamp: number;
}

// ─── Acoustic Types ───
export interface AcousticProfile {
  bands: number[];           // 16-band frequency data (0..1)
  sonicDensity: number;      // 0..100 — Quiet Void to Sensory Chaos
  soundscapeType: "Synth-Driven" | "Orchestral" | "Ambient" | "Percussive";
  dynamicRange: number;      // 0..100
  orchestralPercent: number;
  synthPercent: number;
  tensionPercent: number;
  label: string;             // "High Intensity Cinema" etc.
}

// ─── Vision Types ───
export interface VisualTraits {
  darkness: number;      // 0..1
  contrast: number;
  saturation: number;
  warmth: number;
  symmetry: number;
  complexity: number;
}

export interface InspirationMatch {
  movieId: string;
  matchPercent: number;
  matchedHueRange: [number, number]; // HSL hue range that matched
}

// ─── NLP Types ───
export interface ThemeWeight {
  name: string;
  weight: number; // 0..100
}

export interface ParadoxCard {
  text: string;
  trigger: string;
  confidence: number;
  genrePair: [string, string];
}

export interface SentimentSegment {
  label: "Dark" | "Tense" | "Ambiguous" | "Uplifting";
  val: number; // 0..1
  color: string;
}

export interface DriftPoint {
  year: number;
  mood: string;
  value: number; // 0..1
}

// ─── Fusion Types ───
export interface ArchetypeCentroid {
  name: string;
  vector: number[];
  blurb: string;
  films: string[];
}

export interface ArchetypeResult {
  name: string;
  confidence: number;
  blurb: string;
  films: string[];
  distance: number;
}

// ─── Negative Sentiment Seeds ───
export interface NegativeSeed {
  id: string;
  label: string;
  description: string;
  weight: number;         // Negative weight, e.g., -5.0
  keywords: string[];     // Keywords in overview that trigger this
  genres: string[];       // Genres where this applies
}

// ─── Store State Types ───
export interface CineBrainState {
  // Ingestion
  rawTitles: RawTitle[];
  ingestionProgress: number;
  ingestionFormat: FileFormat | null;
  isIngesting: boolean;

  // Movies (enriched)
  movies: EnrichedMovie[];
  isEnriching: boolean;

  // Acoustic
  acousticProfile: AcousticProfile;

  // Vision
  aggregatePalette: string[];
  paletteNames: string[];
  visualTraits: VisualTraits;
  inspirationMatches: InspirationMatch[];

  // NLP
  themeWeights: ThemeWeight[];
  paradoxCards: ParadoxCard[];
  sentimentSegments: SentimentSegment[];
  driftPoints: DriftPoint[];

  // Fusion
  fusedVector: number[];
  archetype: ArchetypeResult;

  // Privacy / Audit
  audit: AuditReceipt;
  ghostMode: boolean;

  // UI
  selectedMovieId: string;
  weights: { visual: number; textual: number; acoustic: number; mystery: number; dread: number; pacing: number };
  convo: { q: string; a: string }[];
  isLLMLoading: boolean;

  // Actions
  ingestFile: (file: File) => Promise<void>;
  setGhostMode: (enabled: boolean) => void;
  selectMovie: (id: string) => void;
  setWeights: (w: Partial<CineBrainState["weights"]>) => void;
  rerank: () => void;
  sendMessage: (message: string) => Promise<void>;
  uploadInspiration: (file: File) => Promise<void>;
  reset: () => void;
}
