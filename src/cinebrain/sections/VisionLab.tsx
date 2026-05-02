import { useState } from "react";
import { SectionHeader } from "../components/SectionHeader";
import { movies, aggregatePalette, paletteNames } from "../data";
import { ImagePlus } from "lucide-react";

const HEX_AXES = ["Darkness", "Contrast", "Saturation", "Warmth", "Symmetry", "Complexity"];

export const VisionLab = () => {
  const [selected, setSelected] = useState(movies[0]);

  return (
    <section id="vision" className="relative px-6 md:px-12 py-24 bg-background overflow-hidden">
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 30% 20%, hsl(var(--cyan)/0.08), transparent 60%)" }} />
      <div className="max-w-7xl mx-auto relative">
        <SectionHeader kicker="Member 2 · Visual Profile Researcher" section="SECTION 03" title="The" emphasis="Vision Lab" />

        {/* Aggregate dossier */}
        <div className="panel panel-cyan p-6 mb-8 grid md:grid-cols-3 gap-6">
          <div>
            <span className="label-mono">Your Cinematic Aesthetic</span>
            <h3 className="mt-2 font-serif text-3xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>The <em className="text-accent">Look</em></h3>
            <div className="mt-4 flex h-12 rounded-lg overflow-hidden border border-border">
              {aggregatePalette.map(c => <div key={c} className="flex-1 hover:flex-[2] transition-all" style={{ background: c }} />)}
            </div>
            <div className="mt-3 space-y-1.5">
              {aggregatePalette.map((c, i) => (
                <div key={c} className="flex items-center gap-2 text-xs">
                  <span className="w-4 h-4 rounded-sm border border-border" style={{ background: c }} />
                  <span className="font-mono text-foreground/80">{c}</span>
                  <em className="text-muted-foreground">{paletteNames[i]}</em>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-center justify-center">
            <span className="label-mono mb-2">Visual Trait Hexagon</span>
            <Hexagon values={[0.78, 0.92, 0.66, 0.4, 0.54, 0.81]} />
          </div>
          <div>
            <span className="label-mono">Embedding Heatmap (128-dim)</span>
            <Heatmap />
            <div className="mt-3 font-mono text-[10px] tracking-[0.18em] text-muted-foreground">PALETTE EXTRACTED VIA RESNET-50 · K-MEANS CLUSTERING</div>
          </div>
        </div>

        {/* Poster grid + dissection */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 panel p-5">
            <span className="label-mono">Poster Grid · Click to dissect</span>
            <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 gap-3">
              {movies.slice(0, 12).map(m => (
                <button key={m.id} onClick={() => setSelected(m)}
                  className={`aspect-[2/3] rounded-lg relative overflow-hidden border transition-all hover:scale-[1.04] ${selected.id === m.id ? "border-accent shadow-[0_0_18px_hsl(var(--accent)/0.6)]" : "border-border hover:border-accent/50"}`}
                  style={{ background: `linear-gradient(135deg, ${m.posterColors[0]} 0%, ${m.posterColors[3]} 60%, ${m.posterColors[4]} 100%)` }}>
                  <div className="absolute inset-0 flex items-center justify-center text-4xl">{m.poster}</div>
                  <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/85 to-transparent">
                    <div className="font-mono text-[10px] text-white/90 truncate">{m.title}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="panel panel-cyan p-5">
            <span className="label-mono">Dissection View</span>
            <div className="mt-3 aspect-[2/3] rounded-lg relative overflow-hidden border border-border" style={{ background: `linear-gradient(135deg, ${selected.posterColors[0]} 0%, ${selected.posterColors[3]} 60%, ${selected.posterColors[4]} 100%)` }}>
              <div className="absolute inset-0 flex items-center justify-center text-7xl">{selected.poster}</div>
              <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
                <div className="font-serif text-lg font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>{selected.title}</div>
                <div className="font-mono text-[10px] text-muted-foreground">{selected.year} · {selected.genre}</div>
              </div>
            </div>
            <div className="mt-3 space-y-1.5">
              {selected.posterColors.map((c, i) => (
                <div key={c + i} className="flex items-center gap-2 text-xs">
                  <span className="w-5 h-5 rounded border border-border" style={{ background: c }} />
                  <span className="font-mono text-foreground/80">{c}</span>
                  <em className="text-muted-foreground text-[11px]">{paletteNames[i] ?? "Tone"}</em>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {selected.evidence.slice(0, 4).map(e => <span key={e} className="chip-cyan chip">{e}</span>)}
            </div>
          </div>

          {/* Inspiration upload */}
          <div className="panel lg:col-span-3 p-6 flex flex-col md:flex-row gap-6 items-center">
            <div className="w-44 h-52 rounded-md bg-card/60 border-2 border-dashed border-accent/40 flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute inset-x-0 h-[2px] bg-accent/70 top-0 animate-sweep" style={{ boxShadow: "0 0 12px hsl(var(--cyan))" }} />
              <ImagePlus className="w-7 h-7 text-accent" />
              <span className="font-mono text-[10px] tracking-[0.18em] text-accent mt-2">+ DROP IMAGE</span>
              <span className="font-mono text-[9px] text-muted-foreground mt-1">Visual DNA Match</span>
            </div>
            <div className="flex-1">
              <h4 className="font-serif text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>Inspiration Upload</h4>
              <p className="text-muted-foreground mt-2 leading-relaxed">
                Drop any personal photo — a dark forest, neon street, rainy window — and the system finds visually resonant movies from your taste universe.
              </p>
              <p className="text-muted-foreground mt-2 text-sm">
                The Polaroid activates with a Cyber Cyan scan as it processes your image's visual fingerprint against 50k+ movie poster embeddings.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const Hexagon = ({ values }: { values: number[] }) => {
  const cx = 100, cy = 100, R = 80;
  const pts = values.map((v, i) => {
    const a = (Math.PI * 2 * i) / values.length - Math.PI / 2;
    return [cx + Math.cos(a) * R * v, cy + Math.sin(a) * R * v];
  });
  const ring = (r: number) => values.map((_, i) => {
    const a = (Math.PI * 2 * i) / values.length - Math.PI / 2;
    return `${cx + Math.cos(a) * R * r},${cy + Math.sin(a) * R * r}`;
  }).join(" ");
  return (
    <svg viewBox="0 0 200 200" className="w-full max-w-[220px]">
      {[0.25, 0.5, 0.75, 1].map(r => <polygon key={r} points={ring(r)} fill="none" stroke="hsl(var(--border))" strokeWidth="1" />)}
      <polygon points={pts.map(p => p.join(",")).join(" ")} fill="hsl(var(--neon)/0.25)" stroke="hsl(var(--neon))" strokeWidth="2" />
      {HEX_AXES.map((label, i) => {
        const a = (Math.PI * 2 * i) / HEX_AXES.length - Math.PI / 2;
        const x = cx + Math.cos(a) * (R + 14), y = cy + Math.sin(a) * (R + 14);
        return <text key={label} x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="font-mono fill-muted-foreground" fontSize="8">{label}</text>;
      })}
    </svg>
  );
};

const Heatmap = () => {
  const cells = Array.from({ length: 8 * 16 }, (_, i) => Math.abs(Math.sin(i * 1.7)));
  return (
    <div className="mt-3 grid grid-cols-16 gap-[2px]" style={{ gridTemplateColumns: "repeat(16, minmax(0,1fr))" }}>
      {cells.map((v, i) => (
        <div key={i} className="aspect-square rounded-[2px]" style={{ background: `hsl(${270 - v * 80}, ${40 + v * 50}%, ${10 + v * 40}%)` }} />
      ))}
    </div>
  );
};
