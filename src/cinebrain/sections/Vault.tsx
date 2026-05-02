import { useEffect, useState } from "react";
import { SectionHeader } from "../components/SectionHeader";
import { movies } from "../data";
import { ShieldCheck, Activity, Hash } from "lucide-react";

const RAW_TITLES = movies.map(m => m.title);

const fakeVector = () => Array.from({ length: 6 }, () => (Math.random() * 2 - 1).toFixed(2)).join(", ");
const fakeHash = () => Array.from({ length: 32 }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("");

export const Vault = () => {
  const [progress, setProgress] = useState(0);
  const [hash, setHash] = useState(fakeHash());
  const [activeIdx, setActiveIdx] = useState(0);
  const [bars, setBars] = useState<number[]>(Array.from({ length: 16 }, () => Math.random()));

  useEffect(() => {
    const id = setInterval(() => setProgress(p => (p < 100 ? p + 1.4 : 100)), 80);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    const id = setInterval(() => { setActiveIdx(i => (i + 1) % RAW_TITLES.length); setHash(fakeHash()); }, 1400);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    const id = setInterval(() => setBars(Array.from({ length: 16 }, (_, i) => 0.3 + 0.7 * Math.abs(Math.sin(Date.now() / 600 + i)))), 120);
    return () => clearInterval(id);
  }, []);

  return (
    <section id="vault" className="relative px-6 md:px-12 py-24 bg-background overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-40 pointer-events-none" />
      <div className="absolute inset-0 bg-noise opacity-50 mix-blend-overlay pointer-events-none" />
      <div className="max-w-7xl mx-auto relative">
        <SectionHeader kicker="Member 1 · Privacy Architect & Acoustic Analyst" section="SECTION 02" title="The" emphasis="Vault" />

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Live Scrub Theater */}
          <div className="panel panel-cyan lg:col-span-2 p-6 scanline">
            <div className="flex items-center justify-between mb-4">
              <span className="label-mono">Live Scrub Theater</span>
              <span className="chip-cyan chip"><span className="w-1.5 h-1.5 rounded-full bg-accent animate-blink" /> SCRUBBING</span>
            </div>
            <div className="grid grid-cols-2 gap-0 relative">
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-accent/60 shadow-[0_0_12px_hsl(var(--accent)/0.7)]" />
              <div className="pr-4 space-y-1.5">
                <div className="font-mono text-[10px] tracking-[0.2em] text-destructive animate-blink">RAW TITLES — INCOMING</div>
                {RAW_TITLES.slice(0, 7).map((t, i) => (
                  <div key={t} className={`font-mono text-sm transition-all duration-500 ${i === activeIdx % 7 ? "text-destructive line-through opacity-50" : "text-foreground/80"}`}>
                    <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ background: ["#a855f7","#06b6d4","#f43f5e","#22c55e","#f59e0b","#ec4899","#8b5cf6"][i] }} />
                    {t}
                  </div>
                ))}
              </div>
              <div className="pl-4 space-y-1.5">
                <div className="font-mono text-[10px] tracking-[0.2em] text-primary">ENCRYPTED VECTORS — SECURED</div>
                {RAW_TITLES.slice(0, 7).map((_, i) => (
                  <div key={i} className="font-mono text-[11px] text-accent/90 bg-accent/5 border border-accent/20 rounded-md px-2 py-1">
                    [{fakeVector()}…]
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
                <circle cx="50" cy="50" r="44" fill="none" stroke="url(#pg)" strokeWidth="6" strokeLinecap="round" strokeDasharray={`${(progress / 100) * 276.46} 276.46`} style={{ transition: "stroke-dasharray 0.3s" }} />
                <defs>
                  <linearGradient id="pg" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--neon))" />
                    <stop offset="100%" stopColor="hsl(var(--cyan))" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="font-serif text-5xl font-black text-gradient-neon">{Math.round(progress)}<span className="text-xl text-muted-foreground">%</span></div>
                <div className="label-mono mt-1">Secured</div>
              </div>
            </div>
            <div className="mt-5 flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="w-4 h-4 text-accent" /> Differential privacy active</div>
          </div>

          {/* Audit Card */}
          <div className="panel lg:col-span-2 p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="label-mono">Audit Receipt</span>
              <span className="chip"><Hash className="w-3 h-3" /> SHA-256</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <Stat label="Titles processed" value={String(movies.length)} />
              <Stat label="Raw strings destroyed" value={String(movies.length)} />
              <Stat label="Vector dimensions" value="128" />
              <Stat label="Identity stored" value="Anon UUID" />
            </div>
            <div className="mt-4 p-3 rounded-lg bg-accent/5 border border-accent/20 font-mono text-[11px] text-accent break-all">
              {hash}
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-emerald-400"><span>✓</span> Zero raw data persists</div>
          </div>

          {/* Acoustic Aura */}
          <div className="panel p-6 relative overflow-hidden">
            <span className="label-mono">Sonic Density</span>
            <div className="relative w-full aspect-[2/1] mt-3">
              <svg viewBox="0 0 200 100" className="absolute inset-0 w-full h-full">
                <path d="M10 90 A 90 90 0 0 1 190 90" fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
                <path d="M10 90 A 90 90 0 0 1 145 25" fill="none" stroke="url(#sd)" strokeWidth="8" strokeLinecap="round" />
                <line x1="100" y1="90" x2="135" y2="40" stroke="hsl(var(--stellar))" strokeWidth="2" strokeLinecap="round" />
                <circle cx="135" cy="40" r="4" fill="hsl(var(--cyan))" />
                <defs><linearGradient id="sd"><stop offset="0%" stopColor="hsl(var(--neon))" /><stop offset="100%" stopColor="hsl(var(--cyan))" /></linearGradient></defs>
              </svg>
            </div>
            <div className="flex justify-between font-mono text-[10px] tracking-[0.18em] text-muted-foreground -mt-2">
              <span>Quiet Void</span><span>Sensory Chaos</span>
            </div>
            <div className="mt-3 text-center text-accent font-medium">High Intensity Cinema</div>
          </div>

          {/* Frequency Fingerprint */}
          <div className="panel lg:col-span-3 p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="label-mono">Frequency Fingerprint Studio — Acoustic Aura</span>
              <span className="chip"><Activity className="w-3 h-3" /> SYNTH-DRIVEN</span>
            </div>
            <div className="relative h-28 w-full mb-4 rounded-lg overflow-hidden bg-card/40 border border-border">
              <Waveform />
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <span className="label-mono">Soundscape Type</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="chip">● Synth-Driven</span>
                  <span className="chip-cyan chip">Orchestral 34%</span>
                  <span className="chip-crimson chip">Tension 14%</span>
                </div>
              </div>
              <div className="md:col-span-2">
                <span className="label-mono">Frequency Bands</span>
                <div className="mt-3 flex items-end justify-between h-24 gap-1">
                  {bars.map((b, i) => (
                    <div key={i} className="flex-1 rounded-sm" style={{
                      height: `${b * 100}%`,
                      background: `linear-gradient(180deg, hsl(var(--cyan)) 0%, hsl(var(--neon)) 100%)`,
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
    <div className="mt-1 font-serif text-xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>{value}</div>
  </div>
);

const Waveform = () => (
  <svg viewBox="0 0 800 100" preserveAspectRatio="none" className="w-full h-full">
    <defs>
      <linearGradient id="wf" x1="0" x2="1"><stop offset="0%" stopColor="hsl(var(--cyan))" /><stop offset="100%" stopColor="hsl(var(--neon))" /></linearGradient>
    </defs>
    <path d={"M0 50 " + Array.from({ length: 200 }).map((_, i) => {
      const x = i * 4;
      const y = 50 + Math.sin(i * 0.18) * 22 + Math.sin(i * 0.55) * 8 + (Math.random() - 0.5) * 4;
      return `L ${x} ${y}`;
    }).join(" ")} fill="none" stroke="url(#wf)" strokeWidth="1.5" />
  </svg>
);
