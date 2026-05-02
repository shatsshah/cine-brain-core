import { useEffect, useRef, useState } from "react";
import { SectionHeader } from "../components/SectionHeader";
import { useCineBrainStore } from "../store";
import { ShieldCheck, Activity, Hash, Loader2 } from "lucide-react";

// ─── Glitch Scramble Utility ───
const GLITCH_CHARS = "ABCDEFx#@!?$&01█▓░▒▄▀◈◆";
function scrambleText(original: string, progress: number): string {
  // progress 0→1: from fully scrambled to fully revealed
  return original
    .split("")
    .map((char, i) => {
      const threshold = (i / original.length);
      if (progress > threshold) return char;
      return GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
    })
    .join("");
}

const fakeVector = () =>
  Array.from({ length: 6 }, () => (Math.random() * 2 - 1).toFixed(2)).join(", ");

// ─── Streaming Title Row ───
// Each title goes through: appear → scramble → reveal → strikethrough → secured
type TitlePhase = "scrambling" | "revealed" | "striking" | "secured";

interface ScrubRow {
  title: string;
  phase: TitlePhase;
  scrambleProgress: number;
  vector: string;
}

function useScrubTheater() {
  const streamingTitles = useCineBrainStore((s) => s.streamingTitles);
  const movies = useCineBrainStore((s) => s.movies);
  const isIngesting = useCineBrainStore((s) => s.isIngesting);
  const hasIngested = useCineBrainStore((s) => s.hasIngested);

  const [rows, setRows] = useState<ScrubRow[]>([]);
  const processedCount = useRef(0);
  const fallbackRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fallbackIdx = useRef(0);

  // ── Animate phase transitions at ~8fps ──
  useEffect(() => {
    const id = setInterval(() => {
      setRows((prev) =>
        prev.map((row) => {
          if (row.phase === "scrambling") {
            const nextProgress = row.scrambleProgress + 0.08;
            if (nextProgress >= 1) {
              return { ...row, phase: "revealed", scrambleProgress: 1 };
            }
            return { ...row, scrambleProgress: nextProgress, vector: fakeVector() };
          }
          if (row.phase === "revealed") {
            return { ...row, phase: "striking" };
          }
          if (row.phase === "striking") {
            return { ...row, phase: "secured" };
          }
          return row;
        })
      );
    }, 120);
    return () => clearInterval(id);
  }, []);

  // ── Fallback: cycle through movie titles when idle ──
  useEffect(() => {
    // Don't run fallback if we are ingesting OR if real data has ever been loaded
    if (streamingTitles.length > 0 || isIngesting || hasIngested) {
      if (fallbackRef.current) {
        clearInterval(fallbackRef.current);
        fallbackRef.current = null;
      }
      // Also clear rows when ingestion starts, so mock titles don't persist
      if (isIngesting) setRows([]);
      return;
    }

    const titles = movies.map((m) => m.title);
    if (titles.length === 0) return;

    // Start cycling immediately with first title
    const pushTitle = () => {
      const title = titles[fallbackIdx.current % titles.length];
      fallbackIdx.current++;
      setRows((prev) => {
        const next = [
          ...prev,
          {
            title,
            phase: "scrambling" as TitlePhase,
            scrambleProgress: 0,
            vector: fakeVector(),
          },
        ];
        return next.slice(-7);
      });
    };

    // Push first one immediately
    pushTitle();

    fallbackRef.current = setInterval(pushTitle, 1800);

    return () => {
      if (fallbackRef.current) {
        clearInterval(fallbackRef.current);
        fallbackRef.current = null;
      }
    };
  }, [streamingTitles.length, isIngesting, movies, hasIngested]);

  // ── Stream real titles when they arrive from ingestion ──
  useEffect(() => {
    if (streamingTitles.length <= processedCount.current) return;

    const newTitles = streamingTitles.slice(processedCount.current);
    processedCount.current = streamingTitles.length;

    newTitles.forEach((st, i) => {
      setTimeout(() => {
        setRows((prev) => {
          const next = [
            ...prev,
            {
              title: st.title,
              phase: "scrambling" as TitlePhase,
              scrambleProgress: 0,
              vector: fakeVector(),
            },
          ];
          return next.slice(-7);
        });
      }, i * 180);
    });
  }, [streamingTitles.length]);

  return rows;
}

// ─── Color Palette ───
const DOT_COLORS = ["#a855f7", "#06b6d4", "#f43f5e", "#22c55e", "#f59e0b", "#ec4899", "#8b5cf6"];

export const Vault = () => {
  const movies = useCineBrainStore((s) => s.movies);
  const acousticProfile = useCineBrainStore((s) => s.acousticProfile);
  const audit = useCineBrainStore((s) => s.audit);
  const ingestionProgress = useCineBrainStore((s) => s.ingestionProgress);
  const isIngesting = useCineBrainStore((s) => s.isIngesting);
  const hasIngested = useCineBrainStore((s) => s.hasIngested);
  const streamingTitles = useCineBrainStore((s) => s.streamingTitles);

  const scrubRows = useScrubTheater();

  const [hash, setHash] = useState(
    audit.sha256Hash ||
      Array.from({ length: 32 }, () =>
        "0123456789abcdef"[Math.floor(Math.random() * 16)]
      ).join("")
  );
  const [bars, setBars] = useState<number[]>(acousticProfile.bands);

  useEffect(() => {
    if (audit.sha256Hash) setHash(audit.sha256Hash);
  }, [audit.sha256Hash]);

  useEffect(() => {
    const id = setInterval(() => {
      setBars(
        acousticProfile.bands.map((b, i) =>
          Math.max(0.1, Math.min(1, b + Math.sin(Date.now() / 600 + i) * 0.15))
        )
      );
    }, 120);
    return () => clearInterval(id);
  }, [acousticProfile.bands]);

  const progress = hasIngested ? 100 : ingestionProgress;
  const totalProcessed = hasIngested
    ? audit.titlesProcessed
    : streamingTitles.length || movies.length;

  return (
    <section id="vault" className="relative px-6 md:px-12 py-24 bg-background overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-40 pointer-events-none" />
      <div className="absolute inset-0 bg-noise opacity-50 mix-blend-overlay pointer-events-none" />
      <div className="max-w-7xl mx-auto relative">
        <SectionHeader
          kicker="Member 1 · Privacy Architect & Acoustic Analyst"
          section="SECTION 02"
          title="The"
          emphasis="Vault"
        />

        <div className="grid lg:grid-cols-3 gap-6">
          {/* ══════ Live Scrub Theater ══════ */}
          <div className="panel panel-cyan lg:col-span-2 p-6 scanline">
            <div className="flex items-center justify-between mb-4">
              <span className="label-mono">Live Scrub Theater</span>
              <span className="chip-cyan chip">
                {isIngesting ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" /> SCRUBBING ·{" "}
                    {streamingTitles.length}
                  </>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-accent animate-blink" />{" "}
                    {hasIngested ? `SECURED · ${totalProcessed}` : "STANDBY"}
                  </>
                )}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-0 relative">
              {/* Center divider beam */}
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-accent/60 shadow-[0_0_12px_hsl(var(--accent)/0.7)]" />

              {/* LEFT: Raw titles streaming in */}
              <div className="pr-4 space-y-1.5 min-h-[220px]">
                <div className="font-mono text-[10px] tracking-[0.2em] text-destructive animate-blink">
                  RAW TITLES — INCOMING
                </div>
                {scrubRows.map((row, i) => (
                  <div
                    key={`${row.title}-${i}`}
                    className={`font-mono text-sm transition-all duration-300 ${
                      row.phase === "scrambling"
                        ? "text-primary/90"
                        : row.phase === "revealed"
                          ? "text-foreground/90"
                          : row.phase === "striking"
                            ? "text-destructive line-through opacity-60"
                            : "text-destructive/40 line-through opacity-30"
                    }`}
                    style={{
                      animation:
                        row.phase === "scrambling"
                          ? "none"
                          : row.phase === "striking"
                            ? "flash-red 0.3s ease-out"
                            : undefined,
                    }}
                  >
                    <span
                      className="inline-block w-2 h-2 rounded-full mr-2 transition-all"
                      style={{
                        background: DOT_COLORS[i % DOT_COLORS.length],
                        opacity: row.phase === "secured" ? 0.3 : 1,
                        boxShadow:
                          row.phase === "scrambling"
                            ? `0 0 6px ${DOT_COLORS[i % DOT_COLORS.length]}`
                            : "none",
                      }}
                    />
                    {row.phase === "scrambling"
                      ? scrambleText(row.title, row.scrambleProgress)
                      : row.title}
                    {row.phase === "secured" && (
                      <span className="ml-2 text-[9px] text-accent/60">✕ DESTROYED</span>
                    )}
                  </div>
                ))}
                {scrubRows.length === 0 && (
                  <div className="font-mono text-xs text-muted-foreground/50 mt-4">
                    Awaiting file upload...
                  </div>
                )}
              </div>

              {/* RIGHT: Encrypted vectors */}
              <div className="pl-4 space-y-1.5 min-h-[220px]">
                <div className="font-mono text-[10px] tracking-[0.2em] text-primary">
                  ENCRYPTED VECTORS — SECURED
                </div>
                {scrubRows.map((row, i) => (
                  <div
                    key={`vec-${i}`}
                    className={`font-mono text-[11px] rounded-md px-2 py-1 transition-all duration-500 ${
                      row.phase === "scrambling"
                        ? "text-primary/60 bg-primary/5 border border-primary/20"
                        : row.phase === "secured"
                          ? "text-accent/90 bg-accent/10 border border-accent/30"
                          : "text-accent/70 bg-accent/5 border border-accent/20"
                    }`}
                    style={{
                      boxShadow:
                        row.phase === "secured"
                          ? "0 0 8px hsl(var(--accent)/0.3)"
                          : undefined,
                    }}
                  >
                    {row.phase === "scrambling" ? (
                      <span className="animate-pulse">[encrypting...]</span>
                    ) : (
                      <>
                        [{row.vector}…]
                        {row.phase === "secured" && (
                          <span className="ml-1 text-[9px] text-emerald-400">✓</span>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Privacy Score */}
          <div className="panel p-6 flex flex-col items-center justify-center">
            <span className="label-mono mb-4">Privacy Reactor</span>
            <div className="relative w-48 h-48">
              <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
                <circle cx="50" cy="50" r="44" fill="none" stroke="hsl(var(--border))" strokeWidth="6" />
                <circle
                  cx="50" cy="50" r="44" fill="none" stroke="url(#pg)" strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${(progress / 100) * 276.46} 276.46`}
                  style={{ transition: "stroke-dasharray 0.3s" }}
                />
                <defs>
                  <linearGradient id="pg" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--neon))" />
                    <stop offset="100%" stopColor="hsl(var(--cyan))" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="font-serif text-5xl font-black text-gradient-neon">
                  {Math.round(progress)}<span className="text-xl text-muted-foreground">%</span>
                </div>
                <div className="label-mono mt-1">Secured</div>
              </div>
            </div>
            <div className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="w-4 h-4 text-accent" /> Differential privacy active
            </div>
          </div>

          {/* Audit Card */}
          <div className="panel lg:col-span-2 p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="label-mono">Audit Receipt</span>
              <span className="chip"><Hash className="w-3 h-3" /> SHA-256</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <Stat label="Titles processed" value={String(totalProcessed)} />
              <Stat label="Raw strings destroyed" value={String(totalProcessed)} />
              <Stat label="Vector dimensions" value="128" />
              <Stat label="Identity stored" value="Anon UUID" />
            </div>
            <div className="mt-4 p-3 rounded-lg bg-accent/5 border border-accent/20 font-mono text-[11px] text-accent break-all">
              {hash}
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-emerald-400">
              <span>✓</span> Zero raw data persists
            </div>
          </div>

          {/* Acoustic Aura */}
          <div className="panel p-6 relative overflow-hidden">
            <span className="label-mono">Sonic Density</span>
            <div className="relative w-full aspect-[2/1] mt-3">
              <svg viewBox="0 0 200 100" className="absolute inset-0 w-full h-full">
                <path d="M10 90 A 90 90 0 0 1 190 90" fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
                <path
                  d={`M10 90 A 90 90 0 0 1 ${10 + (acousticProfile.sonicDensity / 100) * 180} ${90 - Math.sin((acousticProfile.sonicDensity / 100) * Math.PI) * 90}`}
                  fill="none" stroke="url(#sd)" strokeWidth="8" strokeLinecap="round"
                />
                <line
                  x1="100" y1="90"
                  x2={100 + Math.cos(((acousticProfile.sonicDensity / 100) * Math.PI - Math.PI)) * 55}
                  y2={90 + Math.sin(((acousticProfile.sonicDensity / 100) * Math.PI - Math.PI)) * 55}
                  stroke="hsl(var(--stellar))" strokeWidth="2" strokeLinecap="round"
                />
                <circle
                  cx={100 + Math.cos(((acousticProfile.sonicDensity / 100) * Math.PI - Math.PI)) * 55}
                  cy={90 + Math.sin(((acousticProfile.sonicDensity / 100) * Math.PI - Math.PI)) * 55}
                  r="4" fill="hsl(var(--cyan))"
                />
                <defs>
                  <linearGradient id="sd">
                    <stop offset="0%" stopColor="hsl(var(--neon))" />
                    <stop offset="100%" stopColor="hsl(var(--cyan))" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="flex justify-between font-mono text-[10px] tracking-[0.18em] text-muted-foreground -mt-2">
              <span>Quiet Void</span><span>Sensory Chaos</span>
            </div>
            <div className="mt-3 text-center text-accent font-medium">
              {acousticProfile.label}
            </div>
          </div>

          {/* Frequency Fingerprint */}
          <div className="panel lg:col-span-3 p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="label-mono">Frequency Fingerprint Studio — Acoustic Aura</span>
              <span className="chip">
                <Activity className="w-3 h-3" /> {acousticProfile.soundscapeType.toUpperCase()}
              </span>
            </div>
            <div className="relative h-28 w-full mb-4 rounded-lg overflow-hidden bg-card/40 border border-border">
              <Waveform />
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <span className="label-mono">Soundscape Type</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="chip">● {acousticProfile.soundscapeType}</span>
                  <span className="chip-cyan chip">Orchestral {acousticProfile.orchestralPercent}%</span>
                  <span className="chip-crimson chip">Tension {acousticProfile.tensionPercent}%</span>
                </div>
              </div>
              <div className="md:col-span-2">
                <span className="label-mono">Frequency Bands</span>
                <div className="mt-3 flex items-end justify-between h-24 gap-1">
                  {bars.map((b, i) => (
                    <div key={i} className="flex-1 rounded-sm" style={{
                      height: `${b * 100}%`,
                      background: "linear-gradient(180deg, hsl(var(--cyan)) 0%, hsl(var(--neon)) 100%)",
                      boxShadow: "0 0 8px hsl(var(--neon)/0.6)",
                      transition: "height 0.18s",
                    }} />
                  ))}
                </div>
                <div className="flex justify-between font-mono text-[9px] tracking-widest text-muted-foreground mt-1">
                  <span>32</span><span>250</span><span>1k</span><span>4k</span><span>16k</span><span>63k</span>
                </div>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <button className="chip-cyan chip hover:bg-accent/10">Low Audio Stimuli</button>
              <button className="chip-crimson chip hover:bg-destructive/10">High Sensory Chaos</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg bg-card/50 border border-border p-3">
    <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
    <div className="mt-1 font-serif text-xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
      {value}
    </div>
  </div>
);

const Waveform = () => (
  <svg viewBox="0 0 800 100" preserveAspectRatio="none" className="w-full h-full">
    <defs>
      <linearGradient id="wf" x1="0" x2="1">
        <stop offset="0%" stopColor="hsl(var(--cyan))" />
        <stop offset="100%" stopColor="hsl(var(--neon))" />
      </linearGradient>
    </defs>
    <path
      d={"M0 50 " + Array.from({ length: 200 }).map((_, i) => {
        const x = i * 4;
        const y = 50 + Math.sin(i * 0.18) * 22 + Math.sin(i * 0.55) * 8 + (Math.random() - 0.5) * 4;
        return `L ${x} ${y}`;
      }).join(" ")}
      fill="none" stroke="url(#wf)" strokeWidth="1.5"
    />
  </svg>
);
