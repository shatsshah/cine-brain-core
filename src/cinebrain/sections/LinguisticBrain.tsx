import { useMemo, useState } from "react";
import { SectionHeader } from "../components/SectionHeader";
import { useCineBrainStore } from "../store";
import { Send, AlertTriangle, Loader2, Shield } from "lucide-react";

// ─── Integrity Anchor Detection ───

const DEFENSE_TITLES = [
  "article 370", "baramulla", "ic 814", "major", "uri", "surgical strike",
  "shershaah", "gunjan saxena", "lakshya", "raazi", "baby", "batla house",
  "parmanu", "war", "fighter", "mission mangal",
];

/** Genre-based archetype fallback names */
const GENRE_ARCHETYPES: Record<string, { name: string; blurb: string }> = {
  "Sci-Fi": { name: "The Cosmic Dreamer", blurb: "drawn to the infinite, finding beauty in entropy and silence between stars" },
  Thriller: { name: "The Shadow Strategist", blurb: "driven by tension, always seeking the twist behind the twist" },
  Drama: { name: "The Emotional Archaeologist", blurb: "excavating buried feelings from every frame, every pause" },
  Horror: { name: "The Dread Connoisseur", blurb: "finding beauty in what terrifies, drawn to the architecture of fear" },
  Action: { name: "The Kinetic Philosopher", blurb: "seeking meaning in motion, precision in chaos" },
  Comedy: { name: "The Absurdist Observer", blurb: "finding truth in laughter, wisdom in the ridiculous" },
  Romance: { name: "The Romance Idealist", blurb: "seeking the perfect emotional architecture in connection" },
  Mystery: { name: "The Pattern Hunter", blurb: "obsessed with hidden threads, the unseen web connecting all things" },
  Crime: { name: "The Moral Cartographer", blurb: "mapping the geography of right and wrong in shades of grey" },
  War: { name: "The Sentinel Strategist", blurb: "drawn to discipline, sacrifice, and the cost of duty" },
  Noir: { name: "The Midnight Philosopher", blurb: "lost in rain-slicked streets where every shadow tells a story" },
};

function useDynamicParadox() {
  const movies = useCineBrainStore((s) => s.movies);
  const paradoxCards = useCineBrainStore((s) => s.paradoxCards);
  const hasIngested = useCineBrainStore((s) => s.hasIngested);

  return useMemo(() => {
    if (!hasIngested || movies.length === 0) {
      // Return store paradox (which itself is either computed or fallback)
      const card = paradoxCards[0];
      return {
        title: "Subconscious Paradox",
        text: card?.text || "You prefer dystopias with intimate human connection over dystopias about societal collapse.",
        trigger: card?.trigger || "Hidden Trigger: Two-Person Dialogue",
        confidence: card?.confidence || 94,
        isIntegrity: false,
      };
    }

    // Count liked movies & detect Defense/Military density
    const likedMovies = movies.filter((m) => m.sentiment === "like");
    const totalMovies = movies.length;

    // Check if integrity anchor (-5.0) was triggered
    const integrityTriggered = movies.some((m) => m.sentimentMultiplier === -5.0);

    // Count defense/thriller titles
    const defenseTitles = movies.filter((m) =>
      DEFENSE_TITLES.some((dt) => m.title.toLowerCase().includes(dt))
    );
    const defenseGenres = movies.filter((m) =>
      m.genres.some((g) => ["War", "Action", "Thriller"].includes(g))
    );
    const hasDefenseDensity = defenseTitles.length >= 2 || defenseGenres.length >= totalMovies * 0.3;

    // ── Integrity Anchor Persona ──
    if (hasDefenseDensity && integrityTriggered) {
      return {
        title: "The Sentinel Strategist",
        text: `Across ${totalMovies} processed films, your taste reveals a strict moral architecture. You are drawn to the intensity of high-stakes conflict, but you demand absolute integrity. You find beauty in the precision of the uniform, but reject the flawed human within it if they break loyalty. Your Cinematic Soul values discipline over pure action.`,
        trigger: "Integrity Override",
        confidence: 97,
        isIntegrity: true,
      };
    }

    // ── Use computed paradox from store if available ──
    const storeParadox = paradoxCards[0];
    if (storeParadox && storeParadox.trigger !== "Hidden Trigger: Two-Person Dialogue") {
      return {
        title: "Subconscious Paradox",
        text: storeParadox.text,
        trigger: storeParadox.trigger,
        confidence: storeParadox.confidence,
        isIntegrity: false,
      };
    }

    // ── Fallback: Genre-Based Dynamic Persona ──
    const genreCounts: Record<string, number> = {};
    for (const m of likedMovies) {
      for (const g of m.genres) genreCounts[g] = (genreCounts[g] || 0) + 1;
    }
    const topGenre = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "Drama";
    const persona = GENRE_ARCHETYPES[topGenre] || GENRE_ARCHETYPES["Drama"];

    return {
      title: persona.name,
      text: `Across ${totalMovies} processed films, your cinematic soul is ${persona.blurb}. The strongest predictor of engagement isn't genre — it's the emotional architecture hidden beneath the surface. Your taste isn't what it appears to be.`,
      trigger: `Primary Affinity: ${topGenre}`,
      confidence: Math.min(98, 75 + Math.round((likedMovies.length / Math.max(totalMovies, 1)) * 20)),
      isIntegrity: false,
    };
  }, [movies, paradoxCards, hasIngested]);
}

// ─── Component ───

export const LinguisticBrain = () => {
  const movies = useCineBrainStore((s) => s.movies);
  const themeWeights = useCineBrainStore((s) => s.themeWeights);
  const driftPoints = useCineBrainStore((s) => s.driftPoints);
  const sentimentSegments = useCineBrainStore((s) => s.sentimentSegments);
  const convo = useCineBrainStore((s) => s.convo);
  const sendMessage = useCineBrainStore((s) => s.sendMessage);
  const isLLMLoading = useCineBrainStore((s) => s.isLLMLoading);
  const hasIngested = useCineBrainStore((s) => s.hasIngested);
  const isEnriching = useCineBrainStore((s) => s.isEnriching);
  const enrichProgress = useCineBrainStore((s) => s.enrichProgress);

  const [input, setInput] = useState("");

  const paradox = useDynamicParadox();

  const send = async () => {
    if (!input.trim() || isLLMLoading) return;
    const q = input;
    setInput("");
    await sendMessage(q);
  };

  return (
    <section id="brain" className="relative px-6 md:px-12 py-24 overflow-hidden bg-background">
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 70% 30%, hsl(var(--neon)/0.1), transparent 60%)" }} />
      <div className="max-w-7xl mx-auto relative">
        <SectionHeader kicker="Member 3 · Forensic Biographer" section="SECTION 04" title="The" emphasis="Linguistic Brain" />

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Antigravity DNA Helix — Permanently Unzipped */}
          <div className="panel p-6">
            <div className="w-full flex items-center justify-between mb-4">
              <span className="label-mono">Antigravity DNA — Genre × Soul</span>
              <div className="flex items-center gap-2">
                {isEnriching && (
                  <span className="flex items-center gap-1 font-mono text-[9px] text-accent">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    {enrichProgress}%
                  </span>
                )}
                <span className="chip">UNZIPPED</span>
              </div>
            </div>
            <UnzippedDNA movies={movies} themeWeights={themeWeights} />
            <div className="flex gap-4 mt-4 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary" /> Surface Genres</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-accent" /> Thematic Soul</span>
              <span className="flex items-center gap-1.5"><span className="w-4 h-px border-t border-dashed border-muted-foreground" /> Affinity Link</span>
            </div>
          </div>

          {/* Theme bubbles */}
          <div className="panel panel-cyan p-6">
            <div className="flex items-center justify-between">
              <span className="label-mono">Theme Bubble Cloud</span>
              {isEnriching && <span className="font-mono text-[9px] text-accent">{movies.length} films analyzed</span>}
            </div>
            <div className="relative h-[340px] mt-3">
              {themeWeights.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-mono text-[11px] text-muted-foreground animate-blink">Extracting themes from OMDb...</span>
                </div>
              )}
              {themeWeights.slice(0, 10).map((t, i) => {
                const angle = (i / Math.min(themeWeights.length, 10)) * Math.PI * 2;
                const r = 80 + (100 - t.weight) * 1.2;
                const size = 30 + (t.weight / 100) * 70;
                const left = 50 + Math.cos(angle) * (r / 4);
                const top = 50 + Math.sin(angle) * (r / 6);
                const hue = 180 + (t.weight / 100) * 100;
                return (
                  <div key={t.name}
                    className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center font-mono text-[11px] cursor-pointer animate-drift hover:scale-110 transition-transform"
                    style={{
                      left: `${left}%`, top: `${top}%`, width: size, height: size,
                      background: `radial-gradient(circle, hsl(${hue}, 80%, 55%, 0.4) 0%, hsl(${hue}, 80%, 35%, 0.15) 100%)`,
                      border: `1px solid hsl(${hue}, 80%, 60%, 0.6)`,
                      boxShadow: `0 0 18px hsl(${hue}, 80%, 50%, 0.4)`,
                      animationDelay: `${i * 0.3}s`,
                    }}>
                    <span className="text-foreground">{t.name}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sentiment arc */}
          <div className="panel p-6">
            <span className="label-mono">Sentiment Distribution</span>
            <div className="mt-4 grid grid-cols-2 gap-4 items-center">
              <SentimentArc segs={sentimentSegments} />
              <div className="space-y-2 text-sm">
                {sentimentSegments.map((s) => (
                  <div key={s.label} className="flex items-center justify-between">
                    <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />{s.label}</span>
                    <span className="font-mono text-foreground/80">{Math.round(s.val * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ══════ Dynamic Paradox Card ══════ */}
          <div className={`panel ${paradox.isIntegrity ? "panel-cyan" : "panel-crimson"} p-6 relative overflow-hidden`}>
            <div className="absolute top-3 right-3 font-mono text-[9px] tracking-[0.3em] text-destructive/60">CONFIDENTIAL</div>
            <div className="flex items-center gap-2 mb-3">
              {paradox.isIntegrity ? (
                <Shield className="w-4 h-4 text-accent" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-destructive" />
              )}
              <span className={`label-mono ${paradox.isIntegrity ? "text-accent" : "text-destructive"}`}>
                {paradox.title}
              </span>
            </div>
            <p className="font-serif text-2xl leading-snug" style={{ fontFamily: "'Playfair Display', serif" }}>
              {paradox.text.split(/(\".*?\")/).map((part, i) =>
                part.startsWith('"') ? <em key={i} className="text-destructive">{part.replace(/"/g, '')}</em> : part
              )}
            </p>
            {!paradox.isIntegrity && (
              <p className="text-muted-foreground mt-3 text-sm">
                Across {movies.length} processed films, the strongest predictor of engagement isn't genre — it's the emotional architecture hidden beneath the surface. Your taste isn't what it appears to be.
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-1.5">
              <span className={`${paradox.isIntegrity ? "chip-cyan" : "chip-crimson"} chip`}>
                {paradox.isIntegrity ? "Integrity Override" : paradox.trigger}
              </span>
              <span className={`${paradox.isIntegrity ? "chip-cyan" : "chip-crimson"} chip`}>
                {paradox.confidence}% confidence
              </span>
              {hasIngested && (
                <span className="chip">{movies.filter((m) => m.sentiment === "like").length} liked</span>
              )}
            </div>
          </div>

          {/* Drift timeline */}
          <div className="panel lg:col-span-2 p-6">
            <span className="label-mono">Narrative Drift — Mood Through Time</span>
            <DriftChart points={driftPoints} />
          </div>

          {/* Dialogue constellation */}
          <div className="panel lg:col-span-2 p-6 relative overflow-hidden min-h-[420px]">
            <div className="absolute inset-0 pointer-events-none">
              {Array.from({ length: 60 }).map((_, i) => (
                <div key={i} className="absolute rounded-full bg-foreground/40 animate-drift" style={{
                  left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
                  width: Math.random() * 2 + 1, height: Math.random() * 2 + 1,
                  animationDelay: `${Math.random() * 8}s`,
                  boxShadow: Math.random() > 0.7 ? "0 0 6px hsl(var(--neon))" : undefined,
                }} />
              ))}
            </div>
            <div className="relative">
              <span className="label-mono">Dialogue Constellation</span>
              <p className="text-muted-foreground text-sm mt-1">Ask in the tone of your favorite films. The brain answers as a personified archetype.</p>

              <div className="mt-5 space-y-4 max-h-[260px] overflow-y-auto pr-2">
                {convo.map((c, i) => (
                  <div key={i} className="grid md:grid-cols-2 gap-3 animate-float-card" style={{ animationDelay: `${i * 0.4}s` }}>
                    <div className="rounded-xl p-4 bg-card/60 border border-primary/30 font-mono text-sm">
                      <div className="label-mono mb-2 text-primary">YOU ASK</div>
                      <div className="text-foreground">{c.q}</div>
                    </div>
                    <div className="rounded-xl p-4 bg-[hsl(var(--phantom))] border border-accent/30 font-mono text-sm">
                      <div className="label-mono mb-2 text-accent">CINE-BRAIN · ARCHETYPE</div>
                      <div className="text-foreground/90 leading-relaxed">{c.a}</div>
                    </div>
                  </div>
                ))}
                {isLLMLoading && (
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Loader2 className="w-4 h-4 animate-spin text-accent" />
                    <span className="font-mono text-[11px] animate-blink">Brain is thinking...</span>
                  </div>
                )}
              </div>

              <div className="mt-5 flex gap-2">
                <div className="flex-1 flex items-center gap-2 rounded-lg border border-accent/40 bg-card/60 px-3">
                  <span className="text-accent font-mono">›</span>
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && send()}
                    placeholder="ask the brain…"
                    disabled={isLLMLoading}
                    className="bg-transparent flex-1 py-3 outline-none font-mono text-sm placeholder:text-muted-foreground disabled:opacity-50"
                  />
                  <span className="w-1.5 h-4 bg-accent animate-blink" />
                </div>
                <button onClick={send} disabled={isLLMLoading} className="px-4 rounded-lg bg-primary/20 border border-primary/40 hover:bg-primary/30 text-primary disabled:opacity-50">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ─── Antigravity DNA: Unzipped Helix ───

interface GenreThemeLink {
  genre: string;
  theme: string;
  strength: number; // 0..1
}

const UnzippedDNA = ({ movies, themeWeights }: {
  movies: { genres: string[]; themes: string[]; sentiment: string }[];
  themeWeights: { name: string; weight: number }[];
}) => {
  const [hovered, setHovered] = useState<string | null>(null);

  // Compute genre frequencies from movies
  const genreCounts: Record<string, number> = {};
  for (const m of movies) {
    for (const g of m.genres) genreCounts[g] = (genreCounts[g] || 0) + 1;
  }
  const topGenres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }));

  const topThemes = themeWeights.slice(0, 8);

  // Build genre↔theme links from movie data
  const linkMap: Record<string, Record<string, number>> = {};
  for (const m of movies) {
    for (const g of m.genres) {
      if (!linkMap[g]) linkMap[g] = {};
      for (const t of m.themes) {
        linkMap[g][t] = (linkMap[g][t] || 0) + 1;
      }
    }
  }

  const links: GenreThemeLink[] = [];
  const maxLink = Math.max(...Object.values(linkMap).flatMap((m) => Object.values(m)), 1);
  for (const genre of topGenres) {
    if (!linkMap[genre.name]) continue;
    for (const theme of topThemes) {
      const count = linkMap[genre.name]?.[theme.name] || 0;
      if (count > 0) {
        links.push({ genre: genre.name, theme: theme.name, strength: count / maxLink });
      }
    }
  }

  const maxGenreCount = Math.max(...topGenres.map((g) => g.count), 1);
  const rowH = 42;
  const svgH = Math.max(topGenres.length, topThemes.length) * rowH + 20;

  // Check if a theme is connected to the hovered genre
  const isThemeLinked = (themeName: string) => {
    if (!hovered) return false;
    return links.some((l) => l.genre === hovered && l.theme === themeName);
  };
  const isGenreLinked = (genreName: string) => {
    if (!hovered) return false;
    return genreName === hovered;
  };

  return (
    <div className="relative w-full" style={{ minHeight: svgH }}>
      {/* SVG connector lines */}
      <svg className="absolute inset-0 w-full pointer-events-none" style={{ height: svgH }} viewBox={`0 0 400 ${svgH}`} preserveAspectRatio="none">
        {links.map((link, i) => {
          const gi = topGenres.findIndex((g) => g.name === link.genre);
          const ti = topThemes.findIndex((t) => t.name === link.theme);
          if (gi < 0 || ti < 0) return null;
          const y1 = gi * rowH + rowH / 2 + 10;
          const y2 = ti * rowH + rowH / 2 + 10;
          const isActive = hovered === link.genre;
          return (
            <line
              key={i}
              x1="140" y1={y1}
              x2="260" y2={y2}
              stroke={isActive ? "hsl(var(--accent))" : "hsl(var(--muted-foreground)/0.2)"}
              strokeWidth={isActive ? 2 : 1}
              strokeDasharray={isActive ? "none" : "4 3"}
              opacity={hovered && !isActive ? 0.1 : link.strength * 0.8 + 0.2}
              style={{ transition: "all 0.3s" }}
            />
          );
        })}
      </svg>

      {/* Two-column layout */}
      <div className="relative grid grid-cols-[1fr_1fr] gap-0" style={{ minHeight: svgH }}>
        {/* LEFT: Surface Genres */}
        <div className="flex flex-col justify-start pr-6 items-end" style={{ paddingTop: 10 }}>
          {topGenres.map((g, i) => {
            const size = 10 + (g.count / maxGenreCount) * 14;
            const active = isGenreLinked(g.name);
            return (
              <div
                key={g.name}
                className="flex items-center gap-2 cursor-pointer group"
                style={{ height: rowH }}
                onMouseEnter={() => setHovered(g.name)}
                onMouseLeave={() => setHovered(null)}
              >
                <span className={`font-mono text-[10px] tracking-wider transition-colors ${
                  active ? "text-primary" : hovered && !active ? "text-muted-foreground/30" : "text-muted-foreground group-hover:text-primary"
                }`}>
                  {g.name}
                </span>
                <div
                  className="rounded-full transition-all animate-drift"
                  style={{
                    width: size, height: size,
                    background: active ? "hsl(var(--primary))" : "hsl(var(--primary)/0.5)",
                    boxShadow: active ? "0 0 12px hsl(var(--primary))" : "none",
                    opacity: hovered && !active ? 0.3 : 1,
                    animationDelay: `${i * 0.4}s`,
                    transition: "all 0.3s",
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* RIGHT: Thematic Soul */}
        <div className="flex flex-col justify-start pl-6 items-start" style={{ paddingTop: 10 }}>
          {topThemes.map((t, i) => {
            const size = 10 + (t.weight / 100) * 14;
            const linked = isThemeLinked(t.name);
            return (
              <div
                key={t.name}
                className="flex items-center gap-2"
                style={{ height: rowH }}
              >
                <div
                  className="rounded-full transition-all animate-drift"
                  style={{
                    width: size, height: size,
                    background: linked ? "hsl(var(--accent))" : "hsl(var(--accent)/0.4)",
                    boxShadow: linked ? "0 0 12px hsl(var(--accent))" : "none",
                    opacity: hovered && !linked ? 0.3 : 1,
                    animationDelay: `${i * 0.5 + 0.2}s`,
                    transition: "all 0.3s",
                  }}
                />
                <span className={`font-mono text-[10px] tracking-wider transition-colors ${
                  linked ? "text-accent" : hovered && !linked ? "text-muted-foreground/30" : "text-muted-foreground"
                }`}>
                  {t.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const SentimentArc = ({ segs }: { segs: { label: string; val: number; color: string }[] }) => {
  let acc = 0;
  return (
    <svg viewBox="0 0 100 100" className="w-full max-w-[180px] -rotate-90">
      <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--border))" strokeWidth="14" />
      {segs.map((s, i) => {
        const dash = s.val * 251.3;
        const offset = -acc * 251.3;
        acc += s.val;
        return <circle key={i} cx="50" cy="50" r="40" fill="none" stroke={s.color} strokeWidth="14" strokeDasharray={`${dash} 251.3`} strokeDashoffset={offset} />;
      })}
    </svg>
  );
};

/** Attempt to build a smooth cubic Bézier path through the points */
function smoothPath(coords: { x: number; y: number }[]): string {
  if (coords.length < 2) return "";
  if (coords.length === 2) return `M ${coords[0].x} ${coords[0].y} L ${coords[1].x} ${coords[1].y}`;

  let d = `M ${coords[0].x} ${coords[0].y}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[Math.max(i - 1, 0)];
    const p1 = coords[i];
    const p2 = coords[i + 1];
    const p3 = coords[Math.min(i + 2, coords.length - 1)];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

const MOOD_COLORS: Record<string, string> = {
  Euphoric: "hsl(var(--cyan))",
  Hopeful: "hsl(var(--cyan))",
  Optimistic: "hsl(var(--neon))",
  Curious: "hsl(var(--accent))",
  Restless: "hsl(var(--stellar))",
  Reflective: "hsl(var(--phantom))",
  "Cynical Noir": "hsl(var(--crimson))",
  "Cosmic Dread": "hsl(var(--destructive))",
};

const DriftChart = ({ points }: { points: { year: number; mood: string; value: number }[] }) => {
  const w = 800, h = 180, pad = 40;
  const max = Math.max(...points.map((p) => p.value), 0.01);
  const xs = (i: number) => pad + (i / Math.max(points.length - 1, 1)) * (w - pad * 2);
  const ys = (v: number) => h - pad - (v / max) * (h - pad * 2);

  const coords = points.map((p, i) => ({ x: xs(i), y: ys(p.value) }));
  const curvePath = smoothPath(coords);
  const areaPath = curvePath
    ? `${curvePath} L ${coords[coords.length - 1].x} ${h - pad} L ${coords[0].x} ${h - pad} Z`
    : "";

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full mt-4">
      <defs>
        <linearGradient id="dr" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--neon))" stopOpacity="0.5" />
          <stop offset="100%" stopColor="hsl(var(--neon))" stopOpacity="0" />
        </linearGradient>
      </defs>
      {areaPath && <path d={areaPath} fill="url(#dr)" />}
      {curvePath && <path d={curvePath} fill="none" stroke="hsl(var(--neon))" strokeWidth="2.5" />}
      {points.map((p, i) => (
        <g key={`${p.year}-${i}`}>
          {/* Glow ring */}
          <circle cx={coords[i].x} cy={coords[i].y} r="8" fill="none" stroke={MOOD_COLORS[p.mood] || "hsl(var(--neon))"} strokeWidth="1" opacity="0.4" />
          <circle cx={coords[i].x} cy={coords[i].y} r="4" fill={MOOD_COLORS[p.mood] || "hsl(var(--neon))"} />
          <text x={coords[i].x} y={h - 8} textAnchor="middle" className="font-mono fill-muted-foreground" fontSize="9">{p.year}</text>
          <text x={coords[i].x} y={coords[i].y - 14} textAnchor="middle" className="fill-foreground font-mono" fontSize="9">{p.mood}</text>
        </g>
      ))}
    </svg>
  );
};
