// ─── OMDb API Client (replaces TMDB) ───

const OMDB_KEY = import.meta.env.VITE_OMDB_API_KEY || "";
const BASE_URL = "https://www.omdbapi.com/";

interface OMDbDetail {
  Title: string;
  Year: string;
  Genre: string;
  Plot: string;
  Poster: string;
  imdbID: string;
  imdbRating: string;
  Response: string;
  Error?: string;
}

export interface MovieMetadata {
  title: string;
  year: number;
  genres: string[];
  overview: string;
  posterUrl: string | null;
  imdbId: string;
  imdbRating: number;
}

const cache = new Map<string, MovieMetadata>();
let lastRequest = 0;

async function throttle(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastRequest;
  if (elapsed < 120) await new Promise((r) => setTimeout(r, 120 - elapsed));
  lastRequest = Date.now();
}

export async function searchMovie(title: string, year?: number): Promise<MovieMetadata | null> {
  if (!OMDB_KEY || OMDB_KEY === 'YOUR_KEY_HERE') {
    console.warn('[OMDb] No API key configured. Skipping metadata fetch.');
    return null;
  }
  const cacheKey = `${title.toLowerCase()}:${year || ""}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey)!;
  await throttle();
  try {
    const params = new URLSearchParams({ apikey: OMDB_KEY, t: title, type: "movie" });
    if (year) params.set("y", String(year));
    const resp = await fetch(`${BASE_URL}?${params}`);
    const data: OMDbDetail = await resp.json();
    if (data.Response !== "True" || data.Error) {
      if (year) return searchMovie(title);
      return null;
    }
    const metadata: MovieMetadata = {
      title: data.Title,
      year: parseInt(data.Year) || 0,
      genres: data.Genre ? data.Genre.split(",").map((g) => g.trim()) : [],
      overview: data.Plot || "",
      posterUrl: data.Poster && data.Poster !== "N/A" ? data.Poster : null,
      imdbId: data.imdbID,
      imdbRating: parseFloat(data.imdbRating) || 0,
    };
    cache.set(cacheKey, metadata);
    return metadata;
  } catch (err) {
    console.warn("[OMDb] Fetch failed for:", title, err);
    return null;
  }
}

export async function batchSearch(titles: { title: string; year?: number }[]): Promise<Map<string, MovieMetadata>> {
  const results = new Map<string, MovieMetadata>();
  for (const { title, year } of titles) {
    const meta = await searchMovie(title, year);
    if (meta) results.set(title, meta);
  }
  return results;
}

export function hasApiKey(): boolean {
  return !!OMDB_KEY;
}
