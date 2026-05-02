import { useState } from "react";
import { SectionHeader } from "../components/SectionHeader";
import { useCineBrainStore } from "../store";
import { Send, AlertTriangle, Loader2 } from "lucide-react";

export const LinguisticBrain = () => {
  const movies = useCineBrainStore((s) => s.movies);
  const themeWeights = useCineBrainStore((s) => s.themeWeights);
  const driftPoints = useCineBrainStore((s) => s.driftPoints);
  const paradoxCards = useCineBrainStore((s) => s.paradoxCards);
  const sentimentSegments = useCineBrainStore((s) => s.sentimentSegments);
  const convo = useCineBrainStore((s) => s.convo);
  const sendMessage = useCineBrainStore((s) => s.sendMessage);
  const isLLMLoading = useCineBrainStore((s) => s.isLLMLoading);

  const [unzipped, setUnzipped] = useState(false);
  const [input, setInput] = useState("");

  const send = async () => {
    if (!input.trim() || isLLMLoading) return;
    const q = input;
    setInput("");
    await sendMessage(q);
  };

  const paradox = paradoxCards[0] || {
    text: "You prefer dystopias with intimate human connection over dystopias about societal collapse.",
    trigger: "Hidden Trigger: Two-Person Dialogue",
    confidence: 94,
  };

  return (
    <section id="brain" className="relative px-6 md:px-12 py-24 overflow-hidden bg-background">
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 70% 30%, hsl(var(--neon)/0.1), transparent 60%)" }} />
      <div className="max-w-7xl mx-auto relative">
        <SectionHeader kicker="Member 3 · Forensic Biographer" section="SECTION 04" title="The" emphasis="Linguistic Brain" />

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Plot-DNA Helix */}
          <div className="panel p-6 flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-4">
              <span className="label-mono">Plot-DNA Helix</span>
              <button onClick={() => setUnzipped((u) => !u)} className="chip hover:bg-primary/10">{unzipped ? "Re-zip" : "Unzip"}</button>
            </div>
            <Helix unzipped={unzipped} movies={movies} />
            <div className="flex gap-4 mt-4 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary" /> Surface Genres</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-destructive" /> Thematic Soul</span>
            </div>
          </div>

          {/* Theme bubbles */}
          <div className="panel panel-cyan p-6">
            <span className="label-mono">Theme Bubble Cloud</span>
            <div className="relative h-[340px] mt-3">
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

          {/* Paradox Card */}
          <div className="panel panel-crimson p-6 relative overflow-hidden">
            <div className="absolute top-3 right-3 font-mono text-[9px] tracking-[0.3em] text-destructive/60">CONFIDENTIAL</div>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <span className="label-mono text-destructive">Subconscious Paradox</span>
            </div>
            <p className="font-serif text-2xl leading-snug" style={{ fontFamily: "'Playfair Display', serif" }}>
              {paradox.text.split(/(".*?")/).map((part, i) =>
                part.startsWith('"') ? <em key={i} className="text-destructive">{part.replace(/"/g, '')}</em> : part
              )}
            </p>
            <p className="text-muted-foreground mt-3 text-sm">
              Across {movies.length} processed films, the strongest predictor of engagement isn't genre — it's the emotional architecture hidden beneath the surface. Your taste isn't what it appears to be.
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              <span className="chip-crimson chip">{paradox.trigger}</span>
              <span className="chip-crimson chip">{paradox.confidence}% confidence</span>
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

const Helix = ({ unzipped, movies }: { unzipped: boolean; movies: { title: string }[] }) => {
  const N = 18;
  return (
    <div className="relative w-full h-[340px] [perspective:900px] flex items-center justify-center">
      <div className="relative w-40 h-[300px] animate-helix">
        {Array.from({ length: N }).map((_, i) => {
          const t = i / (N - 1);
          const y = -150 + t * 300;
          const angle = t * Math.PI * 4;
          const x1 = Math.cos(angle) * 60 + (unzipped ? -90 : 0);
          const z1 = Math.sin(angle) * 60;
          const x2 = -Math.cos(angle) * 60 + (unzipped ? 90 : 0);
          const z2 = -Math.sin(angle) * 60;
          const movie = movies[i % movies.length];
          return (
            <div key={i} className="absolute left-1/2 top-1/2" style={{ transform: `translate3d(0, ${y}px, 0)` }}>
              <div className="absolute" style={{ transform: `translate3d(${x1}px, 0, ${z1}px)` }}>
                <div className="w-3 h-3 rounded-full bg-primary shadow-[0_0_10px_hsl(var(--primary))]" />
              </div>
              <div className="absolute" style={{ transform: `translate3d(${x2}px, 0, ${z2}px)` }}>
                <div className="w-3 h-3 rounded-full bg-destructive shadow-[0_0_10px_hsl(var(--destructive))]" />
              </div>
              {!unzipped && (
                <div className="absolute h-px bg-foreground/20" style={{ left: `${Math.min(x1, x2)}px`, width: `${Math.abs(x1 - x2)}px`, transform: `translateZ(${(z1 + z2) / 2}px)` }} />
              )}
              {unzipped && i % 3 === 0 && (
                <div className="absolute font-mono text-[9px] text-muted-foreground whitespace-nowrap" style={{ transform: `translate3d(${x1 - 70}px, -6px, ${z1}px)` }}>{movie?.title}</div>
              )}
            </div>
          );
        })}
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

const DriftChart = ({ points }: { points: { year: number; mood: string; value: number }[] }) => {
  const w = 800, h = 160, pad = 30;
  const max = Math.max(...points.map((p) => p.value), 0.01);
  const xs = (i: number) => pad + (i / Math.max(points.length - 1, 1)) * (w - pad * 2);
  const ys = (v: number) => h - pad - (v / max) * (h - pad * 2);
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${xs(i)} ${ys(p.value)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full mt-4">
      <defs>
        <linearGradient id="dr" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--neon))" stopOpacity="0.5" />
          <stop offset="100%" stopColor="hsl(var(--neon))" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${path} L ${xs(points.length - 1)} ${h - pad} L ${xs(0)} ${h - pad} Z`} fill="url(#dr)" />
      <path d={path} fill="none" stroke="hsl(var(--neon))" strokeWidth="2" />
      {points.map((p, i) => (
        <g key={p.year}>
          <circle cx={xs(i)} cy={ys(p.value)} r="4" fill="hsl(var(--neon))" />
          <text x={xs(i)} y={h - 6} textAnchor="middle" className="font-mono fill-muted-foreground" fontSize="9">{p.year}</text>
          <text x={xs(i)} y={ys(p.value) - 10} textAnchor="middle" className="fill-foreground" fontSize="9">{p.mood}</text>
        </g>
      ))}
    </svg>
  );
};
