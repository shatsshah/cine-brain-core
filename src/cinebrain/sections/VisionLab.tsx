import { useRef, useState } from "react";
import { SectionHeader } from "../components/SectionHeader";
import { useCineBrainStore } from "../store";
import { ImagePlus, Loader2, Eye } from "lucide-react";

const HEX_AXES = ["Darkness", "Contrast", "Saturation", "Warmth", "Symmetry", "Complexity"];

export const VisionLab = () => {
  const movies = useCineBrainStore((s) => s.movies);
  const aggregatePalette = useCineBrainStore((s) => s.aggregatePalette);
  const paletteNames = useCineBrainStore((s) => s.paletteNames);
  const visualTraits = useCineBrainStore((s) => s.visualTraits);
  const uploadInspiration = useCineBrainStore((s) => s.uploadInspiration);
  const inspirationMatches = useCineBrainStore((s) => s.inspirationMatches);
  const inspirationColors = useCineBrainStore((s) => s.inspirationColors ?? []);
  const isEnriching = useCineBrainStore((s) => s.isEnriching);
  const enrichProgress = useCineBrainStore((s) => s.enrichProgress);

  const [selected, setSelected] = useState(movies[0]);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [hoveredMatch, setHoveredMatch] = useState<string | null>(null);
  const inspInputRef = useRef<HTMLInputElement>(null);

  const hexValues: number[] = [
    visualTraits.darkness, visualTraits.contrast, visualTraits.saturation,
    visualTraits.warmth, visualTraits.symmetry, visualTraits.complexity,
  ];

  const handleInspirationUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Generate local preview URL
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    setIsUploading(true);
    await uploadInspiration(file);
    setIsUploading(false);
  };

  // Use the first movie from store if selected is stale
  const sel = movies.find((m) => m.id === selected?.id) || movies[0];

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
              {aggregatePalette.map((c) => <div key={c} className="flex-1 hover:flex-[2] transition-all" style={{ background: c }} />)}
            </div>
            <div className="mt-3 space-y-1.5">
              {aggregatePalette.map((c, i) => (
                <div key={c + i} className="flex items-center gap-2 text-xs">
                  <span className="w-4 h-4 rounded-sm border border-border" style={{ background: c }} />
                  <span className="font-mono text-foreground/80">{c}</span>
                  <em className="text-muted-foreground">{paletteNames[i]}</em>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-center justify-center">
            <span className="label-mono mb-2">Visual Trait Hexagon</span>
            <Hexagon values={hexValues} />
          </div>
          <div>
            <span className="label-mono">Embedding Heatmap (128-dim)</span>
            <Heatmap />
            <div className="mt-3 font-mono text-[10px] tracking-[0.18em] text-muted-foreground">PALETTE EXTRACTED VIA CANVAS API · K-MEANS CLUSTERING</div>
          </div>
        </div>

        {/* Poster grid + dissection */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 panel p-5">
            <div className="flex items-center justify-between">
              <span className="label-mono">Poster Grid · Click to dissect</span>
              {isEnriching && (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-3 h-3 text-accent animate-spin" />
                  <span className="font-mono text-[9px] tracking-[0.18em] text-accent">
                    ENRICHING · {enrichProgress}% · {movies.length} films
                  </span>
                </div>
              )}
            </div>
            {isEnriching && (
              <div className="mt-2 w-full h-1 rounded-full bg-card/80 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-300" style={{ width: `${enrichProgress}%` }} />
              </div>
            )}
            <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 gap-3">
              {movies.slice(0, 12).map((m) => (
                <button key={m.id} onClick={() => setSelected(m)}
                  className={`aspect-[2/3] rounded-lg relative overflow-hidden border transition-all hover:scale-[1.04] ${sel?.id === m.id ? "border-accent shadow-[0_0_18px_hsl(var(--accent)/0.6)]" : "border-border hover:border-accent/50"}`}
                  style={{ background: m.posterUrl ? undefined : `linear-gradient(135deg, ${m.posterColors[0]} 0%, ${m.posterColors[3] || m.posterColors[1]} 60%, ${m.posterColors[4] || m.posterColors[2]} 100%)` }}>
                  {m.posterUrl ? (
                    <img src={m.posterUrl} alt={m.title} className="absolute inset-0 w-full h-full object-cover" crossOrigin="anonymous" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-4xl">🎬</div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/85 to-transparent">
                    <div className="font-mono text-[10px] text-white/90 truncate">{m.title}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="panel panel-cyan p-5">
            <span className="label-mono">Dissection View</span>
            {sel && (
              <>
                <div className="mt-3 aspect-[2/3] rounded-lg relative overflow-hidden border border-border"
                  style={{ background: sel.posterUrl ? undefined : `linear-gradient(135deg, ${sel.posterColors[0]} 0%, ${sel.posterColors[3] || sel.posterColors[1]} 60%, ${sel.posterColors[4] || sel.posterColors[2]} 100%)` }}>
                  {sel.posterUrl ? (
                    <img src={sel.posterUrl} alt={sel.title} className="absolute inset-0 w-full h-full object-cover" crossOrigin="anonymous" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-7xl">🎬</div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
                    <div className="font-serif text-lg font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>{sel.title}</div>
                    <div className="font-mono text-[10px] text-muted-foreground">{sel.year} · {sel.genre}</div>
                  </div>
                </div>
                <div className="mt-3 space-y-1.5">
                  {sel.posterColors.map((c, i) => (
                    <div key={c + i} className="flex items-center gap-2 text-xs">
                      <span className="w-5 h-5 rounded border border-border" style={{ background: c }} />
                      <span className="font-mono text-foreground/80">{c}</span>
                      <em className="text-muted-foreground text-[11px]">{paletteNames[i] ?? "Tone"}</em>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {sel.evidence.slice(0, 4).map((e) => <span key={e} className="chip-cyan chip">{e}</span>)}
                </div>
              </>
            )}
          </div>

          {/* ══════ Cinematic DNA Cross-Pollination ══════ */}
          <div className="panel lg:col-span-3 p-6">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <input
                ref={inspInputRef}
                type="file"
                accept="image/*"
                onChange={handleInspirationUpload}
                className="hidden"
              />

              {/* ── Polaroid Frame with Image Preview ── */}
              <button
                onClick={() => inspInputRef.current?.click()}
                disabled={isUploading}
                className="w-48 min-h-[220px] rounded-md bg-card/60 border-2 border-dashed border-accent/40 flex flex-col items-center justify-center relative overflow-hidden hover:border-accent/70 transition-all shrink-0 group"
              >
                {/* Scan line */}
                <div className="absolute inset-x-0 h-[2px] bg-accent/70 top-0 animate-sweep" style={{ boxShadow: "0 0 12px hsl(var(--cyan))" }} />

                {previewUrl ? (
                  /* ── Uploaded image preview ── */
                  <>
                    <img
                      src={previewUrl}
                      alt="Inspiration upload"
                      className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#08080C]/80 to-transparent" />
                    {/* Extracted palette bar */}
                    {inspirationColors.length > 0 && (
                      <div className="absolute bottom-10 inset-x-3 flex h-3 rounded-sm overflow-hidden border border-accent/30">
                        {inspirationColors.map((c, i) => (
                          <div key={i} className="flex-1" style={{ background: c }} />
                        ))}
                      </div>
                    )}
                    <span className="absolute bottom-3 font-mono text-[9px] tracking-[0.18em] text-accent z-10">
                      {isUploading ? "SCANNING..." : "PALETTE EXTRACTED"}
                    </span>
                  </>
                ) : (
                  /* ── Empty state ── */
                  <>
                    {isUploading ? (
                      <Loader2 className="w-7 h-7 text-accent animate-spin" />
                    ) : (
                      <ImagePlus className="w-7 h-7 text-accent" />
                    )}
                    <span className="font-mono text-[10px] tracking-[0.18em] text-accent mt-2">
                      {isUploading ? "SCANNING..." : "+ DROP IMAGE"}
                    </span>
                    <span className="font-mono text-[9px] text-muted-foreground mt-1">Visual DNA Match</span>
                  </>
                )}
              </button>

              {/* ── Description + Matches ── */}
              <div className="flex-1">
                <h4 className="font-serif text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Cinematic DNA Cross-Pollination
                </h4>
                <p className="text-muted-foreground mt-2 leading-relaxed text-sm">
                  Upload a photo to extract its <span className="text-accent font-medium">Color Palette</span>. The Cine-Brain will recommend movies with visually similar cinematography and poster hues.
                  <span className="text-muted-foreground/60 ml-1">(This matches colors, not objects.)</span>
                </p>

                {inspirationMatches.length > 0 ? (
                  <div className="mt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Eye className="w-4 h-4 text-accent" />
                      <span className="label-mono text-accent">AESTHETIC MATCHES</span>
                    </div>

                    {/* Extracted palette display */}
                    {inspirationColors.length > 0 && (
                      <div className="mb-3 flex items-center gap-2">
                        <span className="font-mono text-[9px] text-muted-foreground tracking-wider">YOUR PALETTE:</span>
                        <div className="flex gap-1">
                          {inspirationColors.map((c, i) => (
                            <div key={i} className="group/swatch relative">
                              <div
                                className="w-6 h-6 rounded-sm border border-border hover:scale-125 transition-transform cursor-default"
                                style={{ background: c }}
                              />
                              {/* Hex tooltip */}
                              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#08080C] border border-accent/30 rounded px-1.5 py-0.5 font-mono text-[9px] text-accent whitespace-nowrap opacity-0 group-hover/swatch:opacity-100 transition-opacity pointer-events-none z-20" style={{ boxShadow: "0 0 10px hsl(var(--cyan)/0.3)" }}>
                                {c}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Match grid with explainability tooltips */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                      {inspirationMatches.slice(0, 5).map((match) => {
                        const movie = movies.find((m) => m.id === match.movieId);
                        if (!movie) return null;
                        const isHovered = hoveredMatch === match.movieId;

                        return (
                          <div
                            key={match.movieId}
                            className="relative group/card"
                            onMouseEnter={() => setHoveredMatch(match.movieId)}
                            onMouseLeave={() => setHoveredMatch(null)}
                          >
                            {/* Movie poster card */}
                            <div
                              className="aspect-[2/3] rounded-lg relative overflow-hidden border border-accent/30 hover:border-accent/60 transition-all hover:scale-[1.03]"
                              style={{
                                background: movie.posterUrl ? undefined : `linear-gradient(135deg, ${movie.posterColors[0]} 0%, ${movie.posterColors[2] || movie.posterColors[1]} 100%)`,
                              }}
                            >
                              {movie.posterUrl ? (
                                <img src={movie.posterUrl} alt={movie.title} className="absolute inset-0 w-full h-full object-cover" crossOrigin="anonymous" />
                              ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-3xl">🎬</div>
                              )}
                              <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/90 to-transparent">
                                <div className="font-mono text-[9px] text-white/90 truncate" title={movie.title}>{movie.title}</div>
                                <div className="font-mono text-[8px] text-accent">{match.matchPercent}% match</div>
                              </div>
                            </div>

                            {/* ── Explainability Tooltip ── */}
                            <div
                              className={`absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full z-30 w-56 rounded-lg p-3 border transition-all duration-200 pointer-events-none ${
                                isHovered
                                  ? "opacity-100 scale-100"
                                  : "opacity-0 scale-95"
                              }`}
                              style={{
                                background: "#08080C",
                                borderColor: "hsl(var(--cyan)/0.4)",
                                boxShadow: "0 0 20px hsl(var(--cyan)/0.2), 0 4px 16px rgba(0,0,0,0.6)",
                              }}
                            >
                              <div className="font-serif text-sm font-bold text-foreground mb-1">{movie.title}</div>
                              <div className="font-mono text-[9px] tracking-[0.2em] text-accent mb-2">MATCHED VIA AESTHETIC</div>
                              <div className="font-mono text-[10px] text-muted-foreground mb-2">
                                Shared color frequencies between your photo and this poster:
                              </div>
                              {/* Mini swatch bar of the extracted colors */}
                              <div className="flex h-4 rounded-sm overflow-hidden border border-border mb-1.5">
                                {inspirationColors.map((c, i) => (
                                  <div key={i} className="flex-1" style={{ background: c }} />
                                ))}
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {inspirationColors.map((c, i) => (
                                  <span key={i} className="font-mono text-[8px] text-accent/70">{c}</span>
                                ))}
                              </div>
                              {/* Arrow */}
                              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent" style={{ borderTopColor: "hsl(var(--cyan)/0.4)" }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground mt-3 text-sm">
                    The Polaroid activates with a Cyber Cyan scan as it processes your image's visual fingerprint against movie poster embeddings.
                  </p>
                )}
              </div>
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
      {[0.25, 0.5, 0.75, 1].map((r) => <polygon key={r} points={ring(r)} fill="none" stroke="hsl(var(--border))" strokeWidth="1" />)}
      <polygon points={pts.map((p) => p.join(",")).join(" ")} fill="hsl(var(--neon)/0.25)" stroke="hsl(var(--neon))" strokeWidth="2" />
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
    <div className="mt-3 grid gap-[2px]" style={{ gridTemplateColumns: "repeat(16, minmax(0,1fr))" }}>
      {cells.map((v, i) => (
        <div key={i} className="aspect-square rounded-[2px]" style={{ background: `hsl(${270 - v * 80}, ${40 + v * 50}%, ${10 + v * 40}%)` }} />
      ))}
    </div>
  );
};
