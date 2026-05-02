// ─── Zustand Global Store: The Cine-Brain Nervous System ───
// Ghost Mode: stores data in a JS Map (RAM-only), vaporizes on tab close.
// Standard Mode: stores in Zustand (in-memory by default, no localStorage).

import { create } from "zustand";
import type {
  RawTitle, EnrichedMovie, AcousticProfile, VisualTraits,
  ThemeWeight, ParadoxCard, SentimentSegment, DriftPoint,
  ArchetypeResult, AuditReceipt, InspirationMatch,
} from "./types";
import { ingestFile as parseFile, crossJoinTitles } from "./engine/ingest";
import { searchMovie } from "./engine/omdb";
import { buildAcousticProfile, aggregateAcousticProfiles, acousticToVector } from "./engine/acoustic";
import { extractColorsFromUrl, extractColorsFromFile, calculateVisualTraits, aggregateVisualTraits, matchInspirationColors, visualToVector, namePaletteColor } from "./engine/vision";
import { extractThemes, detectParadoxes, calculateSentiment, calculateDrift, nlpToVector, applyNegativeSeeds } from "./engine/nlp";
import { askCineBrain, getDominantGenre } from "./engine/llm";
import { fuseVectors, matchArchetype, calculateMatchScore, projectToGalaxy } from "./engine/fusion";
import { generateAnonId, buildAuditReceipt, addLaplaceNoise, vaporize } from "./engine/privacy";

// ─── Fallback Data (from original data.ts) ───
import { movies as fallbackMovies, archetype as fallbackArchetype, themes as fallbackThemes, driftPoints as fallbackDrift, aggregatePalette as fallbackPalette, paletteNames as fallbackPaletteNames } from "./data";

// ─── Ghost Mode Session Map ───
const ghostSessionMap = new Map<string, unknown>();

// ─── Default State ───

const defaultAcoustic: AcousticProfile = {
  bands: Array(16).fill(0.5),
  sonicDensity: 50, soundscapeType: "Synth-Driven", dynamicRange: 50,
  orchestralPercent: 34, synthPercent: 52, tensionPercent: 14, label: "High Intensity Cinema",
};

const defaultAudit: AuditReceipt = {
  titlesProcessed: 0, rawStringsDestroyed: 0, vectorDimensions: 128,
  identityStored: "Anon UUID", sha256Hash: "", timestamp: Date.now(),
};

const defaultArchetype: ArchetypeResult = {
  name: fallbackArchetype.name, confidence: fallbackArchetype.confidence,
  blurb: fallbackArchetype.blurb, films: fallbackArchetype.films, distance: 0,
};

// ─── Store Interface ───

interface CineBrainStore {
  // State
  rawTitles: RawTitle[];
  streamingTitles: { title: string; status: "incoming" | "scrubbing" | "secured" }[];
  fileCount: number;
  ingestionProgress: number;
  isIngesting: boolean;
  movies: EnrichedMovie[];
  isEnriching: boolean;
  enrichProgress: number;
  acousticProfile: AcousticProfile;
  aggregatePalette: string[];
  paletteNames: string[];
  visualTraits: VisualTraits;
  inspirationMatches: InspirationMatch[];
  themeWeights: ThemeWeight[];
  paradoxCards: ParadoxCard[];
  sentimentSegments: SentimentSegment[];
  driftPoints: DriftPoint[];
  fusedVector: number[];
  archetype: ArchetypeResult;
  audit: AuditReceipt;
  ghostMode: boolean;
  selectedMovieId: string;
  weights: { visual: number; textual: number; acoustic: number; mystery: number; dread: number; pacing: number };
  convo: { q: string; a: string }[];
  isLLMLoading: boolean;
  hasIngested: boolean;

  // Actions
  ingestBatch: (files: File[]) => Promise<void>;
  setGhostMode: (enabled: boolean) => void;
  selectMovie: (id: string) => void;
  setWeights: (w: Partial<CineBrainStore["weights"]>) => void;
  rerank: () => void;
  sendMessage: (message: string) => Promise<void>;
  uploadInspiration: (file: File) => Promise<void>;
  reset: () => void;
}

// ─── The Store ───

export const useCineBrainStore = create<CineBrainStore>((set, get) => ({
  // Initial state — uses fallback data
  rawTitles: [],
  streamingTitles: [],
  fileCount: 0,
  ingestionProgress: 0,
  isIngesting: false,
  movies: fallbackMovies.map((m) => ({
    id: m.id, title: m.title, year: m.year, genre: m.genre, genres: [m.genre],
    themes: m.themes, overview: "", posterUrl: null,
    posterColors: m.posterColors, visual: m.visual, textual: m.textual,
    acoustic: m.acoustic, match: m.match, watched: m.watched || false,
    sentiment: "neutral" as const, sentimentMultiplier: 1.0,
    evidence: m.evidence, x: m.x, y: m.y, z: m.z,
    visualVector: [], textualVector: [], acousticVector: [], fusedVector: [],
  })),
  isEnriching: false,
  enrichProgress: 0,
  acousticProfile: defaultAcoustic,
  aggregatePalette: fallbackPalette,
  paletteNames: fallbackPaletteNames,
  visualTraits: { darkness: 0.78, contrast: 0.92, saturation: 0.66, warmth: 0.4, symmetry: 0.54, complexity: 0.81 },
  inspirationMatches: [],
  themeWeights: fallbackThemes,
  paradoxCards: [{
    text: "You prefer dystopias with intimate human connection over dystopias about societal collapse.",
    trigger: "Hidden Trigger: Two-Person Dialogue",
    confidence: 94,
    genrePair: ["Sci-Fi", "Drama"],
  }],
  sentimentSegments: [
    { label: "Dark", val: 0.36, color: "hsl(var(--neon))" },
    { label: "Tense", val: 0.28, color: "hsl(var(--crimson))" },
    { label: "Ambiguous", val: 0.22, color: "hsl(var(--phantom))" },
    { label: "Uplifting", val: 0.14, color: "hsl(var(--cyan))" },
  ],
  driftPoints: fallbackDrift,
  fusedVector: Array(128).fill(0),
  archetype: defaultArchetype,
  audit: defaultAudit,
  ghostMode: false,
  selectedMovieId: fallbackMovies[0]?.id || "",
  weights: { visual: 50, textual: 50, acoustic: 40, mystery: 70, dread: 60, pacing: 40 },
  convo: [
    { q: "Why do I keep returning to dystopias?", a: "You don't return to ruin — you return to the one warm window inside it. Your taste isn't drawn to collapse; it's drawn to intimacy that survives collapse. Blade Runner 2049 is a love letter held in radioactive air." },
  ],
  isLLMLoading: false,
  hasIngested: false,

  // ─── Actions ───

  ingestBatch: async (files: File[]) => {
    const csvFile = files.find((f) => f.name.toLowerCase().endsWith(".csv"));
    const pdfFile = files.find((f) => f.name.toLowerCase().endsWith(".pdf"));
    
    if (!csvFile || !pdfFile) return;

    set((s) => ({ isIngesting: true, ingestionProgress: 0, streamingTitles: [], fileCount: s.fileCount + 2 }));

    // ═══════════════════════════════════════════════════════════════
    // PHASE 1: THE SCRUB (0% → 100%)
    // Only CSV + PDF parsing + title streaming. NO API calls.
    // ═══════════════════════════════════════════════════════════════

    // ── Step 1: Parse both files concurrently with real progress ──
    let csvProgress = 0;
    let pdfProgress = 0;
    const updateParseProgress = () => {
      const combined = Math.round(((csvProgress + pdfProgress) / 2) * 50);
      set({ ingestionProgress: combined });
    };

    const [csvResult, pdfResult] = await Promise.all([
      parseFile(csvFile, (frac) => {
        csvProgress = frac;
        updateParseProgress();
      }),
      parseFile(pdfFile, (frac) => {
        pdfProgress = frac;
        updateParseProgress();
      }),
    ]);

    set({ ingestionProgress: 50 });
    // Yield so the 50% paints
    await new Promise((r) => setTimeout(r, 0));

    // ── Step 2: Stream CSV titles into the Live Scrub Theater (50→80%) ──
    const totalTitles = csvResult.titles.length + pdfResult.titles.length;
    let streamed = 0;
    for (const raw of csvResult.titles) {
      set((s) => ({
        ingestionProgress: 50 + Math.round((streamed / Math.max(totalTitles, 1)) * 30),
        streamingTitles: [
          ...s.streamingTitles,
          { title: raw.title, status: "incoming" as const },
        ],
      }));
      streamed++;
      // Yield so the animation paints every title
      await new Promise((r) => setTimeout(r, 20));
    }
    // Also stream PDF-only titles
    for (const raw of pdfResult.titles) {
      if (!csvResult.titles.some((c) => c.title.toLowerCase() === raw.title.toLowerCase())) {
        set((s) => ({
          ingestionProgress: 50 + Math.round((streamed / Math.max(totalTitles, 1)) * 30),
          streamingTitles: [
            ...s.streamingTitles,
            { title: raw.title, status: "incoming" as const },
          ],
        }));
        streamed++;
        await new Promise((r) => setTimeout(r, 20));
      }
    }

    set({ ingestionProgress: 80 });

    // ── Step 3: Synthesis (Data Fusion) via Cross-Join (80→90%) ──
    const allTitles = crossJoinTitles([csvResult.titles, pdfResult.titles]);
    set({ rawTitles: allTitles, ingestionProgress: 90 });
    await new Promise((r) => setTimeout(r, 0));

    // ── Step 4: Integrity Anchor (Post-Synthesis Override) (90→95%) ──
    const moralDislikeTitles = ["american sniper", "jarhead", "nocturnal animals", "brothers", "unfaithful"];
    const moralKeywords = ["cheating", "affair", "soldier", "military", "unprofessional", "defense"];
    for (const title of allTitles) {
      const lower = title.title.toLowerCase();
      if (moralDislikeTitles.includes(lower)) {
        title.sentiment = "dislike";
      }
    }
    set({ ingestionProgress: 95 });

    // ── Build Audit Receipt ──
    const anonId = generateAnonId();
    const audit = await buildAuditReceipt(allTitles.length, anonId);

    // ══════════════════════════════════════════════════
    // SCRUB COMPLETE → 100% SECURED
    // ══════════════════════════════════════════════════
    set({
      ingestionProgress: 100,
      isIngesting: false,
      hasIngested: true,
      audit,
    });

    // ═══════════════════════════════════════════════════════════════
    // PHASE 2: BACKGROUND ENRICHMENT (runs after scrub is SECURED)
    // ═══════════════════════════════════════════════════════════════
    set({ isEnriching: true, enrichProgress: 0 });

    const enriched: EnrichedMovie[] = [];

    for (let i = 0; i < allTitles.length; i++) {
      const raw = allTitles[i];
      const enrichFrac = i / Math.max(allTitles.length, 1);
      set({ enrichProgress: Math.round(enrichFrac * 100) });

      await new Promise((r) => setTimeout(r, 0));

      const meta = await searchMovie(raw.title, raw.year);
      const genres = meta?.genres || ["Drama"];
      const genre = genres[0] || "Drama";
      const overview = meta?.overview || "";
      const posterUrl = meta?.posterUrl || null;

      let posterColors = ["#1a1a2e", "#a855f7", "#06b6d4", "#0f2035", "#cf6b3a"];
      if (posterUrl) { try { posterColors = await extractColorsFromUrl(posterUrl); } catch {} }

      const acousticProf = buildAcousticProfile(genre, raw.title);
      const acousticVec = acousticToVector(acousticProf);
      const vTraits = calculateVisualTraits(posterColors);
      const visualVec = visualToVector(vTraits, posterColors);

      let sentimentMultiplier = raw.sentiment === "like" ? 1.0 : raw.sentiment === "dislike" ? 0.0 : 0.5;
      const lowerTitle = raw.title.toLowerCase();
      const overviewLower = overview.toLowerCase();
      const hasMoralKeywords = moralKeywords.filter(kw => overviewLower.includes(kw)).length >= 2;
      
      if (moralDislikeTitles.includes(lowerTitle) || hasMoralKeywords) {
        sentimentMultiplier = -5.0;
      }

      const movieThemes: string[] = [];
      const themeKws: Record<string, string[]> = {
        Isolation: ["alone", "lonely", "isolated"], Identity: ["identity", "self", "who"],
        Dystopia: ["dystopia", "apocalypse"], Memory: ["memory", "remember", "forget"],
        Grief: ["grief", "loss", "death"], Time: ["time", "temporal", "future"],
        Redemption: ["redemption", "forgive"], Betrayal: ["betray", "traitor"],
        Chaos: ["chaos", "destruction"], Sacrifice: ["sacrifice", "hero"],
      };
      for (const [theme, kws] of Object.entries(themeKws)) {
        if (kws.some((kw) => overviewLower.includes(kw))) movieThemes.push(theme);
      }
      if (movieThemes.length === 0) movieThemes.push("Ambiguous");

      const penalty = applyNegativeSeeds(overview, genres);
      const visual = Math.max(0, Math.min(100, Math.round(vTraits.darkness * 40 + vTraits.contrast * 30 + vTraits.saturation * 30)));
      const textual = Math.max(0, Math.min(100, Math.round(movieThemes.length * 15 + (meta?.imdbRating || 5) * 6)));
      const acoustic = Math.max(0, Math.min(100, acousticProf.sonicDensity));

      const evidence = ["Neon palette", "High contrast", ...movieThemes.slice(0, 2), acousticProf.soundscapeType];
      const id = (meta?.imdbId || raw.title.toLowerCase().replace(/[^a-z0-9]/g, "")).slice(0, 20);

      enriched.push({
        id, tmdbId: undefined, title: meta?.title || raw.title, year: meta?.year || raw.year || 2020, genre, genres, themes: movieThemes,
        overview, posterUrl, posterColors, visual: Math.max(0, visual + penalty), textual: Math.max(0, textual + penalty),
        acoustic, match: 0, watched: true, sentiment: raw.sentiment || "neutral", sentimentMultiplier,
        evidence, x: 0, y: 0, z: 0, visualVector: visualVec, textualVector: [], acousticVector: acousticVec, fusedVector: [],
      });

      if (i % 5 === 0 || i === allTitles.length - 1) set({ movies: [...enriched] });
    }

    const themeWeights = extractThemes(enriched.map((m) => ({ overview: m.overview, genres: m.genres, sentiment: m.sentiment, sentimentMultiplier: m.sentimentMultiplier })));
    const paradoxCards = detectParadoxes(enriched.map((m) => ({ genres: m.genres, themes: m.themes, sentiment: m.sentiment })));
    const sentimentSegments = calculateSentiment(enriched.map((m) => ({ genres: m.genres })));
    const driftPoints = calculateDrift(enriched.map((m) => ({ watchDate: allTitles.find((r) => r.title.toLowerCase() === m.title.toLowerCase())?.watchDate, genres: m.genres, sentiment: m.sentiment })));

    const textualVecBase = nlpToVector(themeWeights, sentimentSegments, paradoxCards.length);
    for (const movie of enriched) movie.textualVector = textualVecBase;

    const allVisualTraits = enriched.map((m) => calculateVisualTraits(m.posterColors));
    const aggTraits = aggregateVisualTraits(allVisualTraits);
    const aggPalette = enriched.length > 0 ? enriched.slice(0, 5).flatMap((m) => m.posterColors.slice(0, 1)).slice(0, 5) : fallbackPalette;
    const aggPaletteNames = aggPalette.map(namePaletteColor);
    const allAcousticProfiles = enriched.map((m) => buildAcousticProfile(m.genre, m.title));
    const aggAcoustic = aggregateAcousticProfiles(allAcousticProfiles);

    for (const movie of enriched) movie.fusedVector = fuseVectors(movie.visualVector, movie.textualVector, movie.acousticVector);

    const userVector = Array(128).fill(0);
    let likedCount = 0;
    for (const movie of enriched) {
      if (movie.sentiment !== "dislike") {
        for (let d = 0; d < 128; d++) userVector[d] += (movie.fusedVector[d] || 0) * movie.sentimentMultiplier;
        likedCount++;
      }
    }
    if (likedCount > 0) for (let d = 0; d < 128; d++) userVector[d] /= likedCount;

    const noisyVector = addLaplaceNoise(userVector, 2.0, 0.5);
    const weights = get().weights;
    const positions = projectToGalaxy(enriched.map((m) => ({ id: m.id, fusedVector: m.fusedVector, genre: m.genre })));
    for (const movie of enriched) {
      movie.match = calculateMatchScore(noisyVector, movie.fusedVector, weights);
      const pos = positions[movie.id];
      if (pos) { movie.x = pos.x; movie.y = pos.y; movie.z = pos.z; }
    }
    enriched.sort((a, b) => b.match - a.match);
    const archResult = matchArchetype(noisyVector);

    set({
      movies: enriched, isEnriching: false, enrichProgress: 100,
      acousticProfile: aggAcoustic, aggregatePalette: aggPalette, paletteNames: aggPaletteNames,
      visualTraits: aggTraits, themeWeights, paradoxCards, sentimentSegments, driftPoints,
      fusedVector: noisyVector, archetype: archResult, selectedMovieId: enriched[0]?.id || "",
    });

    if (get().ghostMode) {
      ghostSessionMap.set("movies", enriched);
      ghostSessionMap.set("vector", noisyVector);
    }
  },

  setGhostMode: (enabled: boolean) => {
    set({ ghostMode: enabled });

    if (enabled) {
      // Set up the kill-switch
      const killSwitch = () => {
        vaporize(ghostSessionMap);
        // Clear Zustand state too
        const { reset } = get();
        reset();
      };
      window.addEventListener("beforeunload", killSwitch);
      // Store the cleanup function
      ghostSessionMap.set("__killSwitch", killSwitch);
    } else {
      // Remove kill-switch
      const killSwitch = ghostSessionMap.get("__killSwitch") as (() => void) | undefined;
      if (killSwitch) window.removeEventListener("beforeunload", killSwitch);
      ghostSessionMap.delete("__killSwitch");
    }
  },

  selectMovie: (id: string) => set({ selectedMovieId: id }),

  setWeights: (w) => set((s) => ({ weights: { ...s.weights, ...w } })),

  rerank: () => {
    const { movies, fusedVector, weights } = get();
    const updated = movies.map((m) => ({
      ...m,
      match: calculateMatchScore(fusedVector, m.fusedVector, weights),
    }));
    // Also update galaxy positions slightly for visual feedback
    const positions = projectToGalaxy(updated.map((m) => ({ id: m.id, fusedVector: m.fusedVector, genre: m.genre })));
    for (const movie of updated) {
      const pos = positions[movie.id];
      if (pos) { movie.x = pos.x; movie.y = pos.y; movie.z = pos.z; }
    }
    set({ movies: updated });
  },

  sendMessage: async (message: string) => {
    if (!message.trim()) return;
    set({ isLLMLoading: true });

    const { movies, themeWeights, archetype } = get();
    const allGenres = movies.flatMap((m) => m.genres);
    const dominantGenre = getDominantGenre(allGenres);
    const themes = themeWeights.slice(0, 5).map((t) => t.name);

    const answer = await askCineBrain(message, dominantGenre, {
      themes,
      archetype: archetype.name,
    });

    set((s) => ({
      convo: [...s.convo, { q: message, a: answer }],
      isLLMLoading: false,
    }));
  },

  uploadInspiration: async (file: File) => {
    const colors = await extractColorsFromFile(file);
    const { movies } = get();

    const matches = matchInspirationColors(
      colors,
      movies.map((m) => ({ id: m.id, posterColors: m.posterColors }))
    );

    set({ inspirationMatches: matches });
  },

  reset: () => {
    vaporize(ghostSessionMap);
    set({
      rawTitles: [],
      ingestionProgress: 0,
      isIngesting: false,
      movies: fallbackMovies.map((m) => ({
        id: m.id, title: m.title, year: m.year, genre: m.genre, genres: [m.genre],
        themes: m.themes, overview: "", posterUrl: null,
        posterColors: m.posterColors, visual: m.visual, textual: m.textual,
        acoustic: m.acoustic, match: m.match, watched: m.watched || false,
        sentiment: "neutral" as const, sentimentMultiplier: 1.0,
        evidence: m.evidence, x: m.x, y: m.y, z: m.z,
        visualVector: [], textualVector: [], acousticVector: [], fusedVector: [],
      })),
      isEnriching: false,
      enrichProgress: 0,
      hasIngested: false,
      fusedVector: Array(128).fill(0),
      archetype: defaultArchetype,
      audit: defaultAudit,
    });
  },
}));
