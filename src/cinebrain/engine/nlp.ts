// ─── NLP Engine: Theme Extraction, Paradox Detection, Sentiment Analysis ───

import type { ThemeWeight, ParadoxCard, SentimentSegment, DriftPoint, NegativeSeed } from "../types";

// ─── Theme Keyword Mapping ───

const THEME_KEYWORDS: Record<string, string[]> = {
  Isolation: ["alone", "lonely", "isolated", "solitary", "abandoned", "exile", "desolate", "hermit", "outcast"],
  Identity: ["identity", "who am i", "self", "persona", "double", "clone", "mirror", "mask", "disguise"],
  Dystopia: ["dystopia", "dystopian", "apocalypse", "post-apocalyptic", "totalitarian", "oppressive", "regime", "rebellion"],
  Memory: ["memory", "remember", "forget", "amnesia", "past", "nostalgia", "flashback", "dementia"],
  Grief: ["grief", "loss", "death", "mourning", "funeral", "widow", "orphan", "tragedy", "sorrow"],
  Time: ["time", "temporal", "clock", "future", "past", "dimension", "loop", "paradox", "eternal"],
  Redemption: ["redemption", "atonement", "forgive", "salvation", "reform", "second chance", "repent"],
  Betrayal: ["betray", "betrayal", "traitor", "backstab", "double-cross", "trust", "deceive", "treachery"],
  Fate: ["fate", "destiny", "prophecy", "inevitable", "chosen", "oracle", "predestined"],
  Love: ["love", "romance", "heart", "passion", "desire", "relationship", "affair", "devotion"],
  Chaos: ["chaos", "anarchy", "destruction", "disorder", "mayhem", "havoc", "pandemonium"],
  Sacrifice: ["sacrifice", "martyr", "give up", "selfless", "noble", "hero", "cost"],
  Power: ["power", "control", "dominance", "authority", "corrupt", "tyrant", "empire"],
  Madness: ["mad", "insane", "crazy", "psycho", "lunatic", "deranged", "asylum", "sanity"],
  Family: ["family", "father", "mother", "son", "daughter", "sibling", "brother", "sister", "parent"],
  Technology: ["technology", "ai", "robot", "cyber", "digital", "machine", "android", "virtual"],
  Survival: ["survive", "survival", "endure", "escape", "fight", "wilderness", "stranded"],
  Justice: ["justice", "law", "court", "trial", "verdict", "judge", "crime", "punishment", "revenge"],
};

// ─── Genre-to-Sentiment Mapping ───

const GENRE_SENTIMENT: Record<string, "Dark" | "Tense" | "Ambiguous" | "Uplifting"> = {
  Horror: "Dark", Thriller: "Tense", Mystery: "Tense",
  "Sci-Fi": "Ambiguous", Drama: "Ambiguous", Noir: "Dark",
  Action: "Tense", Comedy: "Uplifting", Romance: "Uplifting",
  Animation: "Uplifting", Adventure: "Uplifting", Fantasy: "Ambiguous",
  Crime: "Dark", War: "Dark", Documentary: "Ambiguous",
};

// ─── Negative Sentiment Seeds (Hardcoded Dislikes) ───

export const NEGATIVE_SEEDS: NegativeSeed[] = [
  {
    id: "integrity-violation",
    label: "The Integrity Violation",
    description: "Protagonist in uniform engages in domestic infidelity",
    weight: -5.0,
    keywords: ["affair", "cheat", "infidelity", "adultery", "unfaithful"],
    genres: ["Drama", "Action", "War", "Thriller"],
  },
  {
    id: "unprofessionalism",
    label: "The Unprofessionalism Trigger",
    description: "Characters prioritize petty greed over mission/national interest",
    weight: -4.0,
    keywords: ["greed", "selfish", "corrupt", "steal", "embezzle"],
    genres: ["Action", "Thriller", "Crime"],
  },
  {
    id: "senseless-chaos",
    label: "The Senseless Chaos Filter",
    description: "Randomized violence without strategic or narrative purpose",
    weight: -3.5,
    keywords: ["slasher", "gore", "senseless", "random", "massacre"],
    genres: ["Horror", "Action"],
  },
  {
    id: "traitor-archetype",
    label: "The Traitor Archetype",
    description: "Betrayal of lifelong friendship for minor tactical gain",
    weight: -4.5,
    keywords: ["betray", "traitor", "backstab", "turncoat"],
    genres: ["Action", "Drama", "Thriller", "Crime"],
  },
];

// ─── Theme Extraction ───

/** Extract theme weights from movie overviews and genres */
export function extractThemes(
  movies: { overview: string; genres: string[]; sentiment: string; sentimentMultiplier: number }[]
): ThemeWeight[] {
  const weights: Record<string, number> = {};

  for (const movie of movies) {
    const text = movie.overview.toLowerCase();
    const multiplier = movie.sentimentMultiplier;

    for (const [theme, keywords] of Object.entries(THEME_KEYWORDS)) {
      let themeScore = 0;
      for (const kw of keywords) {
        if (text.includes(kw)) themeScore += 1;
      }
      // Boost by genre relevance
      if (theme === "Chaos" && movie.genres.includes("Action")) themeScore += 0.5;
      if (theme === "Isolation" && (movie.genres.includes("Sci-Fi") || movie.genres.includes("Horror"))) themeScore += 0.5;
      if (theme === "Grief" && movie.genres.includes("Drama")) themeScore += 0.5;

      weights[theme] = (weights[theme] || 0) + themeScore * multiplier;
    }
  }

  // Normalize to 0..100
  const maxWeight = Math.max(...Object.values(weights), 1);
  return Object.entries(weights)
    .map(([name, w]) => ({ name, weight: Math.round((w / maxWeight) * 100) }))
    .filter((t) => t.weight > 10)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 12);
}

// ─── Paradox Detection ───

/** Detect contradictions in genre+theme preferences */
export function detectParadoxes(
  movies: { genres: string[]; themes: string[]; sentiment: string }[]
): ParadoxCard[] {
  const paradoxes: ParadoxCard[] = [];

  // Group by genre, then check for conflicting sentiments on shared themes
  const genreThemeMap: Record<string, Record<string, { likes: number; dislikes: number }>> = {};

  for (const movie of movies) {
    for (const genre of movie.genres) {
      if (!genreThemeMap[genre]) genreThemeMap[genre] = {};
      for (const theme of movie.themes) {
        if (!genreThemeMap[genre][theme]) genreThemeMap[genre][theme] = { likes: 0, dislikes: 0 };
        if (movie.sentiment === "like") genreThemeMap[genre][theme].likes++;
        else if (movie.sentiment === "dislike") genreThemeMap[genre][theme].dislikes++;
      }
    }
  }

  // Find themes liked in one genre but disliked in another
  const themes = new Set(
    Object.values(genreThemeMap).flatMap((g) => Object.keys(g))
  );

  for (const theme of themes) {
    const likedIn: string[] = [];
    const dislikedIn: string[] = [];

    for (const [genre, themeMap] of Object.entries(genreThemeMap)) {
      if (!themeMap[theme]) continue;
      if (themeMap[theme].likes > themeMap[theme].dislikes) likedIn.push(genre);
      if (themeMap[theme].dislikes > themeMap[theme].likes) dislikedIn.push(genre);
    }

    if (likedIn.length > 0 && dislikedIn.length > 0) {
      const conf = Math.min(95, 60 + likedIn.length * 8 + dislikedIn.length * 8);
      paradoxes.push({
        text: `You seek "${theme}" only within ${likedIn[0]} settings, but reject it in ${dislikedIn[0]}.`,
        trigger: `${theme} in ${likedIn[0]} vs ${dislikedIn[0]}`,
        confidence: conf,
        genrePair: [likedIn[0], dislikedIn[0]],
      });
    }
  }

  // Default paradox if none detected
  if (paradoxes.length === 0) {
    paradoxes.push({
      text: "You prefer dystopias with intimate human connection over dystopias about societal collapse.",
      trigger: "Hidden Trigger: Two-Person Dialogue",
      confidence: 94,
      genrePair: ["Sci-Fi", "Drama"],
    });
  }

  return paradoxes.slice(0, 3);
}

// ─── Sentiment Distribution ───

/** Calculate sentiment segment distribution across movies */
export function calculateSentiment(
  movies: { genres: string[] }[]
): SentimentSegment[] {
  const counts: Record<string, number> = { Dark: 0, Tense: 0, Ambiguous: 0, Uplifting: 0 };

  for (const movie of movies) {
    for (const genre of movie.genres) {
      const sent = GENRE_SENTIMENT[genre] || "Ambiguous";
      counts[sent]++;
    }
  }

  const total = Object.values(counts).reduce((s, v) => s + v, 0) || 1;
  return [
    { label: "Dark", val: +(counts.Dark / total).toFixed(2), color: "hsl(var(--neon))" },
    { label: "Tense", val: +(counts.Tense / total).toFixed(2), color: "hsl(var(--crimson))" },
    { label: "Ambiguous", val: +(counts.Ambiguous / total).toFixed(2), color: "hsl(var(--phantom))" },
    { label: "Uplifting", val: +(counts.Uplifting / total).toFixed(2), color: "hsl(var(--cyan))" },
  ];
}

// ─── Narrative Drift ───

/** Intensity keywords that shift mood toward Dark/Tense */
const INTENSE_TITLE_KEYWORDS = [
  "article 370", "ic 814", "baramulla", "major", "uri", "surgical strike",
  "war", "mission", "sniper", "army", "terror", "attack", "hostage",
  "murder", "killer", "revenge", "blood", "death", "dark", "night",
  "psycho", "horror", "haunted", "fear", "scream", "prey",
];

/** Lighter keywords that shift mood toward Uplifting */
const LIGHT_TITLE_KEYWORDS = [
  "love", "wedding", "holiday", "christmas", "comedy", "happy",
  "dream", "sunshine", "family", "friend", "adventure", "magic",
  "wonder", "joy", "dance", "sing", "chef", "cook", "garden",
];

/** Calculate mood drift over time from watch history.
 *  Accepts an optional `movieYear` field so we can fall back to the movie's
 *  release year when no watchDate is available (instead of assigning random years).
 */
export function calculateDrift(
  movies: { watchDate?: string; genres: string[]; sentiment: string; title?: string; movieYear?: number }[]
): DriftPoint[] {
  // Group by year — prefer watchDate, then movieYear, then current year
  const yearMap: Record<number, {
    sentimentSum: number; count: number; genres: string[];
    intenseCount: number; lightCount: number; titles: string[];
  }> = {};

  const currentYear = new Date().getFullYear();

  for (const movie of movies) {
    let year: number | undefined;

    // 1st priority: watchDate from CSV/PDF
    if (movie.watchDate) {
      const parsed = new Date(movie.watchDate).getFullYear();
      if (!isNaN(parsed) && parsed >= 1990 && parsed <= currentYear + 1) {
        year = parsed;
      }
    }

    // 2nd priority: the movie's release year (from OMDb enrichment)
    if (!year && movie.movieYear && movie.movieYear >= 1990 && movie.movieYear <= currentYear + 1) {
      year = movie.movieYear;
    }

    // Last resort: current year (no randomization)
    if (!year) year = currentYear;

    if (!yearMap[year]) yearMap[year] = { sentimentSum: 0, count: 0, genres: [], intenseCount: 0, lightCount: 0, titles: [] };
    yearMap[year].count++;
    yearMap[year].genres.push(...movie.genres);
    yearMap[year].titles.push(movie.title || "Unknown");
    yearMap[year].sentimentSum += movie.sentiment === "like" ? 0.7 : movie.sentiment === "dislike" ? 0.2 : 0.5;

    // Check title intensity
    const titleLower = (movie.title || "").toLowerCase();
    if (INTENSE_TITLE_KEYWORDS.some((kw) => titleLower.includes(kw))) yearMap[year].intenseCount++;
    if (LIGHT_TITLE_KEYWORDS.some((kw) => titleLower.includes(kw))) yearMap[year].lightCount++;

    // Genre-based intensity
    const darkGenres = ["Horror", "Thriller", "Crime", "War", "Noir"];
    const lightGenres = ["Comedy", "Romance", "Animation", "Adventure"];
    for (const g of movie.genres) {
      if (darkGenres.includes(g)) yearMap[year].intenseCount += 0.3;
      if (lightGenres.includes(g)) yearMap[year].lightCount += 0.3;
    }
  }

  const moodLabels: [number, string][] = [
    [0.85, "Euphoric"], [0.72, "Hopeful"], [0.6, "Optimistic"],
    [0.5, "Curious"], [0.4, "Restless"], [0.3, "Reflective"],
    [0.2, "Cynical Noir"], [0.0, "Cosmic Dread"],
  ];

  const years = Object.keys(yearMap).map(Number).sort();
  // If no movies at all, return empty — let the UI handle the "no data" state
  if (years.length === 0) return [];

  return years.map((year) => {
    const data = yearMap[year];
    // Base value from sentiment
    let value = +(data.sentimentSum / data.count).toFixed(2);

    // Shift based on intensity ratio
    const intensityRatio = (data.intenseCount - data.lightCount) / Math.max(data.count, 1);
    value = Math.max(0.05, Math.min(0.95, value - intensityRatio * 0.3));

    // Add slight genre-based variance
    const darkCount = data.genres.filter((g) => ["Horror", "Thriller", "Crime", "War", "Noir"].includes(g)).length;
    const darkRatio = darkCount / Math.max(data.genres.length, 1);
    value = Math.max(0.05, Math.min(0.95, value - darkRatio * 0.15));

    value = +value.toFixed(2);
    const mood = moodLabels.find(([threshold]) => value >= threshold)?.[1] || "Cosmic Dread";
    return { year, mood, value };
  });
}

/** Get the titles grouped by year (used by the LLM mood generator) */
export function getYearGroupedTitles(
  movies: { watchDate?: string; genres: string[]; title?: string; movieYear?: number }[]
): Record<number, string[]> {
  const yearMap: Record<number, string[]> = {};
  const currentYear = new Date().getFullYear();

  for (const movie of movies) {
    let year: number | undefined;
    if (movie.watchDate) {
      const parsed = new Date(movie.watchDate).getFullYear();
      if (!isNaN(parsed) && parsed >= 1990 && parsed <= currentYear + 1) year = parsed;
    }
    if (!year && movie.movieYear && movie.movieYear >= 1990 && movie.movieYear <= currentYear + 1) {
      year = movie.movieYear;
    }
    if (!year) year = currentYear;

    if (!yearMap[year]) yearMap[year] = [];
    yearMap[year].push(movie.title || "Unknown");
  }
  return yearMap;
}

/** Convert NLP data to a 44-dim vector */
export function nlpToVector(
  themeWeights: ThemeWeight[],
  sentimentSegments: SentimentSegment[],
  paradoxCount: number
): number[] {
  // Theme weights (top 18 themes, normalized)
  const themeVec = Array(18).fill(0);
  for (let i = 0; i < Math.min(themeWeights.length, 18); i++) {
    themeVec[i] = themeWeights[i].weight / 100;
  }

  // Sentiment segments (4 dims)
  const sentVec = sentimentSegments.map((s) => s.val);
  while (sentVec.length < 4) sentVec.push(0);

  // Derived features
  const themeEntropy = -themeVec
    .filter((v) => v > 0)
    .reduce((s, v) => s + v * Math.log(v + 0.001), 0);

  return [
    ...themeVec.slice(0, 18),          // 18
    ...sentVec.slice(0, 4),            // 4
    paradoxCount / 5,                  // 1
    themeEntropy,                      // 1
    // Padding to 44
    ...Array(44 - 18 - 4 - 2).fill(0).map((_, i) =>
      Math.sin((themeVec[0] * 10 + i) * 0.2) * 0.5 + 0.5
    ),
  ].slice(0, 44);
}

/** Apply negative sentiment seeds to movie scores */
export function applyNegativeSeeds(
  overview: string,
  genres: string[]
): number {
  let penalty = 0;
  const text = overview.toLowerCase();

  for (const seed of NEGATIVE_SEEDS) {
    const genreMatch = seed.genres.some((g) => genres.includes(g));
    if (!genreMatch) continue;
    const keywordMatch = seed.keywords.some((kw) => text.includes(kw));
    if (keywordMatch) penalty += seed.weight;
  }

  return penalty;
}
