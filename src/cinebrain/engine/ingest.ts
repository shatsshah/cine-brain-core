// ─── Ingestion Engine: CSV / PDF / JSON Parsing Pipeline ───

import Papa from "papaparse";
import type { RawTitle, FileFormat, IngestionResult } from "../types";

// ─── Progress Callback Type ───
/** Receives a 0..1 fraction indicating parse progress */
export type ParseProgressFn = (fraction: number) => void;

// ─── Format Detection ───

function detectCSVFormat(headers: string[]): FileFormat {
  const h = headers.map((s) => s.toLowerCase().trim());
  if (h.includes("title") && h.includes("date")) return "netflix-csv";
  if (h.includes("name") && h.includes("year") && h.includes("rating"))
    return "letterboxd-csv";
  if (h.includes("const") && h.includes("your rating")) return "imdb-csv";
  return "generic-csv";
}

// ─── CSV Parsing (HistoryParser) ───

export function parseCSV(text: string): IngestionResult {
  const result = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h: string) => h.trim(),
  });

  const headers = result.meta.fields ?? [];
  const format = detectCSVFormat(headers);
  const titles: RawTitle[] = [];

  for (const row of result.data as Record<string, string>[]) {
    let title = "";
    let year: number | undefined;
    let rating: number | undefined;
    let watchDate: string | undefined;

    switch (format) {
      case "netflix-csv":
        // Netflix format: "Title", "Date"
        title = (row["Title"] || row["title"] || "").trim();
        // Netflix titles often have "Season X: Episode Name" — extract the show name
        if (title.includes(":")) {
          const parts = title.split(":");
          // If it looks like "Show: Season 1: Episode", take the first part
          title = parts[0].trim();
        }
        watchDate = row["Date"] || row["date"];
        break;

      case "letterboxd-csv":
        title = (row["Name"] || row["name"] || "").trim();
        year = parseInt(row["Year"] || row["year"]) || undefined;
        rating = parseFloat(row["Rating"] || row["rating"]) || undefined;
        watchDate = row["Date"] || row["Watched Date"] || row["date"];
        break;

      case "imdb-csv":
        title = (row["Title"] || row["title"] || "").trim();
        year = parseInt(row["Year"] || row["year"]) || undefined;
        rating = parseFloat(row["Your Rating"] || row["your rating"]) || undefined;
        watchDate = row["Date Rated"] || row["date rated"];
        break;

      default:
        // Generic: try common column names
        title =
          (
            row["Title"] ||
            row["title"] ||
            row["Name"] ||
            row["name"] ||
            row["Movie"] ||
            row["movie"] ||
            ""
          ).trim();
        year =
          parseInt(row["Year"] || row["year"] || row["Release Year"]) ||
          undefined;
        rating =
          parseFloat(row["Rating"] || row["rating"] || row["Score"]) ||
          undefined;
        watchDate = row["Date"] || row["date"] || row["Watch Date"];
        break;
    }

    if (!title) continue;

    // Deduplicate: skip if we already have this title
    if (titles.some((t) => t.title.toLowerCase() === title.toLowerCase()))
      continue;

    titles.push({
      title,
      year,
      rating,
      watchDate,
      sentiment:
        rating !== undefined
          ? rating >= 3.5
            ? "like"
            : rating <= 2
              ? "dislike"
              : "neutral"
          : "neutral",
      source: "csv",
    });
  }

  return {
    titles,
    format,
    rawCount: (result.data as unknown[]).length,
    crossMatchCount: 0,
  };
}

// ─── PDF Parsing (SentimentForensicEngine) ───

export async function parsePDF(
  file: File,
  onProgress?: ParseProgressFn
): Promise<IngestionResult> {
  onProgress?.(0.05);
  await new Promise((r) => setTimeout(r, 0));

  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  onProgress?.(0.1);
  await new Promise((r) => setTimeout(r, 0));

  // Convert bytes to string for regex parsing
  // PDF text streams are stored as BT...ET blocks
  let raw = "";
  for (let i = 0; i < bytes.length; i++) {
    raw += String.fromCharCode(bytes[i]);
  }

  onProgress?.(0.2);
  await new Promise((r) => setTimeout(r, 0));

  // Extract all text from BT (Begin Text) ... ET (End Text) blocks
  // Tj and TJ are the PDF text-showing operators
  const titles: RawTitle[] = [];
  const textChunks: string[] = [];

  // Match Tj strings: (text) Tj
  const tjMatches = raw.matchAll(/\(([^)]{2,80})\)\s*Tj/g);
  for (const m of tjMatches) {
    textChunks.push(m[1]);
  }

  // Match TJ arrays: [(text) ...] TJ
  const tjArrayMatches = raw.matchAll(/\[([^\]]{2,200})\]\s*TJ/g);
  for (const m of tjArrayMatches) {
    const inner = m[1].matchAll(/\(([^)]{2,})\)/g);
    for (const part of inner) {
      textChunks.push(part[1]);
    }
  }

  onProgress?.(0.5);
  await new Promise((r) => setTimeout(r, 0));

  // Clean and filter chunks into candidate titles
  const skipPatterns = /^(page|date|title|rating|#|http|viewing|activity|account|netflix|watching|show\s*more|back\s*to)/i;
  const datePattern = /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/;

  for (let i = 0; i < textChunks.length; i++) {
    // Decode common PDF escape sequences
    let chunk = textChunks[i]
      .replace(/\\n/g, " ")
      .replace(/\\r/g, " ")
      .replace(/\\t/g, " ")
      .replace(/\\\(/g, "(")
      .replace(/\\\)/g, ")")
      .replace(/\\\\/g, "\\")
      .trim();

    // Strip trailing pipe artifacts from PDF layout
    chunk = chunk.replace(/\s*\|\s*\??$/, "").trim();

    if (chunk.length < 3) continue;
    if (/^\d+$/.test(chunk)) continue;
    if (datePattern.test(chunk)) continue;
    if (skipPatterns.test(chunk)) continue;

    // Deduplicate
    if (titles.some((t) => t.title.toLowerCase() === chunk.toLowerCase())) continue;

    titles.push({
      title: chunk,
      sentiment: "like", // PDF = liked movies list
      source: "pdf",
    });

    if (i % 10 === 0) {
      onProgress?.(0.5 + (i / textChunks.length) * 0.45);
      await new Promise((r) => setTimeout(r, 0));
    }
  }

  onProgress?.(1.0);

  return {
    titles,
    format: "pdf",
    rawCount: titles.length,
    crossMatchCount: 0,
  };
}

// ─── JSON Parsing ───

export function parseJSON(text: string): IngestionResult {
  let data: unknown[];
  try {
    const parsed = JSON.parse(text);
    data = Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return { titles: [], format: "json", rawCount: 0, crossMatchCount: 0 };
  }

  const titles: RawTitle[] = data
    .filter(
      (item): item is Record<string, unknown> =>
        typeof item === "object" && item !== null
    )
    .map((item) => ({
      title: String(
        item.title || item.Title || item.name || item.Name || ""
      ).trim(),
      year: typeof item.year === "number" ? item.year : parseInt(String(item.year || item.Year)) || undefined,
      rating: typeof item.rating === "number" ? item.rating : parseFloat(String(item.rating || item.Rating)) || undefined,
      sentiment: ("neutral" as const),
      source: "json" as const,
    }))
    .filter((t) => t.title.length > 0);

  return {
    titles,
    format: "json",
    rawCount: data.length,
    crossMatchCount: 0,
  };
}

// ─── Cross-File Join ───

/** Fuzzy match via Levenshtein distance */
function levenshtein(a: string, b: string): number {
  const la = a.length,
    lb = b.length;
  const dp: number[][] = Array.from({ length: la + 1 }, () =>
    Array(lb + 1).fill(0)
  );
  for (let i = 0; i <= la; i++) dp[i][0] = i;
  for (let j = 0; j <= lb; j++) dp[0][j] = j;
  for (let i = 1; i <= la; i++)
    for (let j = 1; j <= lb; j++)
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
  return dp[la][lb];
}

/** Join titles from multiple sources, merging sentiments */
export function crossJoinTitles(sources: RawTitle[][]): RawTitle[] {
  const merged = new Map<string, RawTitle>();

  for (const source of sources) {
    for (const title of source) {
      const key = title.title.toLowerCase().replace(/[^a-z0-9]/g, "");

      // Check for exact or fuzzy match in existing
      let matched = false;
      for (const [existingKey, existingTitle] of merged) {
        const dist = levenshtein(key, existingKey);
        const maxLen = Math.max(key.length, existingKey.length);
        if (dist / maxLen < 0.2) {
          // Close match — merge sentiments, prefer explicit like/dislike
          if (title.sentiment !== "neutral") {
            existingTitle.sentiment = title.sentiment;
          }
          if (title.year && !existingTitle.year) {
            existingTitle.year = title.year;
          }
          if (title.rating && !existingTitle.rating) {
            existingTitle.rating = title.rating;
          }
          if (title.watchDate && !existingTitle.watchDate) {
            existingTitle.watchDate = title.watchDate;
          }
          matched = true;
          break;
        }
      }

      if (!matched) {
        merged.set(key, { ...title });
      }
    }
  }

  return Array.from(merged.values());
}

// ─── Main Entry Point ───

export async function ingestFile(
  file: File,
  onProgress?: ParseProgressFn
): Promise<IngestionResult> {
  const ext = file.name.split(".").pop()?.toLowerCase();

  if (ext === "pdf") {
    return parsePDF(file, onProgress);
  }

  const text = await file.text();
  onProgress?.(0.5);

  if (ext === "json") {
    const result = parseJSON(text);
    onProgress?.(1.0);
    return result;
  }

  // Default: treat as CSV
  const result = parseCSV(text);
  onProgress?.(1.0);
  return result;
}
