// ─── Ingestion Engine: CSV / PDF / JSON Parsing Pipeline ───

import Papa from "papaparse";
import type { RawTitle, FileFormat, IngestionResult } from "../types";

// ─── Format Detection ───

function detectCSVFormat(headers: string[]): FileFormat {
  const h = headers.map((s) => s.toLowerCase().trim());
  if (h.includes("title") && h.includes("date")) return "netflix-csv";
  if (h.includes("name") && h.includes("year") && h.includes("rating"))
    return "letterboxd-csv";
  if (h.includes("const") && h.includes("your rating")) return "imdb-csv";
  return "generic-csv";
}

// ─── CSV Parsing ───

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

// ─── PDF Parsing ───

export async function parsePDF(file: File): Promise<IngestionResult> {
  // Dynamic import of pdfjs-dist to avoid SSR issues
  const pdfjsLib = await import("pdfjs-dist");

  // Set worker source
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const titles: RawTitle[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const lines = textContent.items
      .map((item: unknown) => {
        const textItem = item as { str: string };
        return textItem.str;
      })
      .join("\n")
      .split("\n")
      .map((l: string) => l.trim())
      .filter((l: string) => l.length > 2);

    for (const line of lines) {
      // Look for Netflix PDF patterns: title followed by thumb indicator
      // Patterns: "Title 👍", "Title 👎", "Title | ?", "Title"
      let sentiment: "like" | "dislike" | "neutral" = "neutral";
      let cleanTitle = line;

      if (line.includes("👍") || line.includes("Liked") || line.includes("✓")) {
        sentiment = "like";
        cleanTitle = line
          .replace(/👍|Liked|✓|\|/g, "")
          .trim();
      } else if (
        line.includes("👎") ||
        line.includes("Disliked") ||
        line.includes("✗")
      ) {
        sentiment = "dislike";
        cleanTitle = line
          .replace(/👎|Disliked|✗|\|/g, "")
          .trim();
      } else if (line.includes("| ?") || line.match(/\|\s*$/)) {
        // The "| ?" or trailing pipe indicates where thumb icons would be
        cleanTitle = line.replace(/\|\s*\??$/, "").trim();
      }

      // Skip lines that don't look like movie titles (too short, all numbers, etc.)
      if (cleanTitle.length < 2) continue;
      if (/^\d+$/.test(cleanTitle)) continue;
      if (
        /^(page|date|title|rating|#|http)/i.test(cleanTitle)
      )
        continue;

      // Deduplicate
      if (
        titles.some(
          (t) => t.title.toLowerCase() === cleanTitle.toLowerCase()
        )
      )
        continue;

      titles.push({
        title: cleanTitle,
        sentiment,
        source: "pdf",
      });
    }
  }

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

export async function ingestFile(file: File): Promise<IngestionResult> {
  const ext = file.name.split(".").pop()?.toLowerCase();

  if (ext === "pdf") {
    return parsePDF(file);
  }

  const text = await file.text();

  if (ext === "json") {
    return parseJSON(text);
  }

  // Default: treat as CSV
  return parseCSV(text);
}
