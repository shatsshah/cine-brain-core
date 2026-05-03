import { Suspense, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { SectionHeader } from "../components/SectionHeader";
import { useCineBrainStore } from "../store";
import type { EnrichedMovie } from "../types";
import { Loader2 } from "lucide-react";

export const TasteUniverse = () => {
  const movies = useCineBrainStore((s) => s.movies);
  const archetype = useCineBrainStore((s) => s.archetype);
  const storeWeights = useCineBrainStore((s) => s.weights);
  const setStoreWeights = useCineBrainStore((s) => s.setWeights);
  const rerank = useCineBrainStore((s) => s.rerank);
  const selectMovie = useCineBrainStore((s) => s.selectMovie);
  const selectedMovieId = useCineBrainStore((s) => s.selectedMovieId);
  const hasIngested = useCineBrainStore((s) => s.hasIngested);
  const isEnriching = useCineBrainStore((s) => s.isEnriching);
  const enrichProgress = useCineBrainStore((s) => s.enrichProgress);
  const themeWeights = useCineBrainStore((s) => s.themeWeights);
  const aggregatePalette = useCineBrainStore((s) => s.aggregatePalette);

  const selected = movies.find((m) => m.id === selectedMovieId) || movies[0];
  const [shake, setShake] = useState(0);

  // ── Dual-Readiness Check ──
  // Recommendations only render when BOTH color palette and thematic DNA are real data
  const paletteReady = aggregatePalette.length > 0 && aggregatePalette[0] !== "#1C2B4B";
  const dnaReady = themeWeights.length > 0;
  const dataReady = movies.length > 0 && paletteReady && dnaReady && !isEnriching;

  const ranked = useMemo(() => {
    if (movies.length === 0) return [];
    const wt = (m: EnrichedMovie) =>
      (m.visual * storeWeights.visual + m.textual * storeWeights.textual + m.acoustic * storeWeights.acoustic) /
      (storeWeights.visual + storeWeights.textual + storeWeights.acoustic);
    return [...movies].sort((a, b) => wt(b) - wt(a)).slice(0, 5).map((m) => m.id);
  }, [movies, storeWeights]);

  const matchScore = useMemo(() => {
    if (!selected) return 0;
    const total = storeWeights.visual + storeWeights.textual + storeWeights.acoustic;
    if (total === 0) return 50;
    return Math.round((selected.visual * storeWeights.visual + selected.textual * storeWeights.textual + selected.acoustic * storeWeights.acoustic) / total);
  }, [selected, storeWeights]);

  const handleRerank = () => {
    setShake((s) => s + 1);
    rerank();
  };

  return (
    <section id="universe" className="relative px-6 md:px-12 py-24 bg-background overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse 60% 40% at 25% 30%, hsl(var(--neon)/0.15), transparent 70%), radial-gradient(ellipse 50% 50% at 80% 70%, hsl(var(--crimson)/0.1), transparent 70%), radial-gradient(ellipse 60% 60% at 60% 90%, hsl(var(--cyan)/0.08), transparent 70%)",
      }} />
      <div className="max-w-7xl mx-auto relative">
        <SectionHeader kicker="Member 4 · Experience Engineer · Grand Finale" section="SECTION 05" title="The" emphasis="Taste Universe" />

        {/* ── Scanning Overlay: shown during enrichment ── */}
        {hasIngested && !dataReady && (
          <div className="panel p-12 flex flex-col items-center justify-center gap-4 mb-6">
            <Loader2 className="w-10 h-10 text-accent animate-spin" />
            <div className="font-mono text-sm tracking-[0.22em] text-accent animate-blink">
              {isEnriching ? `SCANNING UNIVERSE · ${enrichProgress}%` : "COMPUTING TASTE VECTORS..."}
            </div>
            <div className="font-mono text-[10px] text-muted-foreground">
              Waiting for Color Palette + Thematic DNA before generating recommendations
            </div>
            <div className="w-48 h-1 rounded-full bg-card/80 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-300" style={{ width: `${enrichProgress}%` }} />
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Galaxy */}
          <div className="panel lg:col-span-2 p-0 h-[560px] relative overflow-hidden">
            <div className="absolute top-3 left-4 z-10 label-mono">3D Galaxy · drag to orbit · scroll to zoom</div>
            {movies.length > 0 ? (
              <Canvas camera={{ position: [0, 0, 4.5], fov: 55 }} dpr={[1, 2]}>
                <Suspense fallback={null}>
                  <ambientLight intensity={0.4} />
                  <pointLight position={[0, 0, 0]} intensity={2} color={"#f59e0b"} />
                  <Galaxy movies={movies} selected={selected?.id || ""} top5={ranked} onSelect={(m) => selectMovie(m.id)} shake={shake} />
                  <OrbitControls enablePan={false} minDistance={2} maxDistance={9} autoRotate autoRotateSpeed={0.4} />
                </Suspense>
              </Canvas>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="font-mono text-[11px] text-muted-foreground animate-blink">Awaiting stellar data...</div>
                </div>
              </div>
            )}
            <div className="absolute bottom-3 left-4 right-4 flex flex-wrap gap-3 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: "hsl(var(--amber))", boxShadow: "0 0 8px hsl(var(--amber))" }} /> Your taste profile</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-primary" /> Top match</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Watched</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-foreground/40" /> Other films</span>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="panel p-5">
              <span className="label-mono">Identity</span>
              {selected && (
                <>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="w-14 h-14 rounded-md flex items-center justify-center text-2xl overflow-hidden"
                      style={{ background: selected.posterUrl ? undefined : `linear-gradient(135deg, ${selected.posterColors[0]}, ${selected.posterColors[4] || selected.posterColors[1]})` }}>
                      {selected.posterUrl ? (
                        <img src={selected.posterUrl} alt="" className="w-full h-full object-cover" />
                      ) : "🎬"}
                    </div>
                    <div>
                      <div className="font-serif text-lg font-bold leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>{selected.title}</div>
                      <div className="font-mono text-[11px] text-muted-foreground">{selected.year} · {selected.genre}</div>
                    </div>
                  </div>
                  <div className="mt-4 text-center">
                    <div className="font-serif text-5xl font-black text-gradient-neon" style={{ fontFamily: "'Playfair Display', serif" }}>{matchScore}%</div>
                    <div className="label-mono mt-1">Overall Match · updates live</div>
                  </div>
                </>
              )}
            </div>

            <div className="panel p-5">
              <span className="label-mono">Transparency Core</span>
              {selected && (
                <div className="mt-3 space-y-3">
                  <Bar label="Visual Model" value={selected.visual} color="hsl(var(--cyan))" tags={selected.evidence.slice(0, 2)} />
                  <Bar label="Textual Model" value={selected.textual} color="hsl(var(--neon))" tags={selected.themes.slice(0, 3)} />
                  <Bar label="Acoustic Model" value={selected.acoustic} color="hsl(var(--crimson))" tags={[selected.evidence.find((e) => e.includes("Synth") || e.includes("Orchestral") || e.includes("Ambient") || e.includes("Percussive")) || "Audio", selected.evidence.find((e) => e.includes("Sensory") || e.includes("Stimuli")) || "Analysis"]} />
                </div>
              )}
            </div>

            <div className="panel p-5">
              <span className="label-mono">Tweak Panel</span>
              <div className="mt-3 space-y-2.5">
                {([
                  ["visual", "Visual weight"], ["textual", "Textual weight"], ["acoustic", "Acoustic weight"],
                  ["mystery", "Mystery"], ["dread", "Dread"], ["pacing", "Pacing"],
                ] as const).map(([k, l]) => (
                  <div key={k} className="grid grid-cols-[110px_1fr_36px] items-center gap-2">
                    <span className="text-xs text-foreground/80">{l}</span>
                    <input type="range" min={0} max={100} value={storeWeights[k]}
                      onChange={(e) => setStoreWeights({ [k]: +e.target.value })}
                      className="accent-primary w-full" />
                    <span className="font-mono text-[11px] text-muted-foreground text-right">{storeWeights[k]}</span>
                  </div>
                ))}
              </div>
              <button onClick={handleRerank} className="mt-4 w-full py-3 rounded-lg border border-primary/40 bg-primary/10 hover:bg-primary/20 font-mono text-xs tracking-[0.22em] text-primary">
                RE-RANK MY GALAXY ↗
              </button>
            </div>
          </div>

          {/* Cinematic Mirror — only renders when BOTH palette + DNA are ready */}
          {dataReady && (
            <div className="panel panel-crimson lg:col-span-3 p-8 relative overflow-hidden" style={{ background: "linear-gradient(135deg, hsl(var(--phantom)) 0%, hsl(var(--card)) 100%)" }}>
              <div className="absolute -right-20 -top-20 w-72 h-72 rounded-full" style={{ background: "radial-gradient(circle, hsl(var(--neon)/0.3), transparent 70%)" }} />
              <div className="relative">
                <div>
                  <span className="label-mono text-primary">Based on your multimodal profile · your archetype is</span>
                  <h3 className="mt-2 font-serif text-5xl md:text-6xl font-black" style={{ fontFamily: "'Playfair Display', serif" }}>
                    The <em className="text-gradient-neon not-italic">{archetype.name.replace("The ", "")}</em>
                  </h3>
                  <p className="mt-4 text-foreground/80 max-w-2xl leading-relaxed">{archetype.blurb}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {archetype.films.map((f) => <span key={f} className="chip">{f}</span>)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

const Bar = ({ label, value, color, tags }: { label: string; value: number; color: string; tags: string[] }) => (
  <div>
    <div className="flex items-center justify-between text-xs"><span>{label}</span><span style={{ color }} className="font-mono">{value}%</span></div>
    <div className="mt-1 h-1.5 rounded-full bg-card/80 overflow-hidden">
      <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${value}%`, background: color, boxShadow: `0 0 10px ${color}` }} />
    </div>
    <div className="mt-1.5 flex flex-wrap gap-1">
      {tags.map((t) => <span key={t} className="text-[10px] font-mono text-muted-foreground border border-border rounded-full px-2 py-0.5">{t}</span>)}
    </div>
  </div>
);

const Galaxy = ({ movies, selected, top5, onSelect, shake }: {
  movies: EnrichedMovie[]; selected: string; top5: string[]; onSelect: (m: EnrichedMovie) => void; shake: number;
}) => {
  const positions = useRef<Record<string, THREE.Vector3>>({});
  useMemo(() => {
    movies.forEach((m) => { positions.current[m.id] = new THREE.Vector3(m.x * 2.2, m.y * 1.6, m.z * 1.2); });
  }, [movies]);

  const targets = useMemo(() => {
    const out: Record<string, THREE.Vector3> = {};
    movies.forEach((m) => {
      const j = (Math.sin(shake * 7.7 + m.x * 11) * 0.25);
      const k = (Math.cos(shake * 5.3 + m.y * 13) * 0.25);
      out[m.id] = new THREE.Vector3(m.x * 2.2 + j, m.y * 1.6 + k, m.z * 1.2);
    });
    return out;
  }, [movies, shake]);

  return (
    <group>
      {Array.from({ length: 200 }).map((_, i) => (
        <mesh key={i} position={[(Math.random() - 0.5) * 14, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 8 - 2]}>
          <sphereGeometry args={[0.012, 6, 6]} />
          <meshBasicMaterial color={Math.random() > 0.5 ? "#a855f7" : "#06b6d4"} />
        </mesh>
      ))}
      <Sun />
      {movies.map((m) => (
        <Star key={m.id} movie={m} target={targets[m.id]} positions={positions} selected={selected === m.id} top5={top5.includes(m.id)} onSelect={onSelect} />
      ))}
    </group>
  );
};

const Sun = () => {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => { if (ref.current) ref.current.rotation.y = clock.elapsedTime * 0.2; });
  return (
    <group>
      <mesh ref={ref}>
        <sphereGeometry args={[0.18, 32, 32]} />
        <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={2} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.32, 32, 32]} />
        <meshBasicMaterial color="#f59e0b" transparent opacity={0.18} />
      </mesh>
    </group>
  );
};

const Star = ({ movie, target, positions, selected, top5, onSelect }: {
  movie: EnrichedMovie; target: THREE.Vector3; positions: React.MutableRefObject<Record<string, THREE.Vector3>>;
  selected: boolean; top5: boolean; onSelect: (m: EnrichedMovie) => void;
}) => {
  const ref = useRef<THREE.Mesh>(null!);
  const ringRef = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const cur = positions.current[movie.id];
    if (!cur || !target) return;
    cur.lerp(target, 0.04);
    ref.current.position.copy(cur);
    if (ringRef.current) {
      ringRef.current.position.copy(cur);
      const s = 1 + Math.sin(clock.elapsedTime * 2 + movie.x * 7) * 0.4;
      ringRef.current.scale.setScalar(s);
      (ringRef.current.material as THREE.MeshBasicMaterial).opacity = 0.4 - (s - 1);
    }
  });
  const color = top5 ? "#a855f7" : movie.watched ? "#34d399" : "#cbd5e1";
  return (
    <group>
      <mesh ref={ref} onClick={() => onSelect(movie)} onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = "pointer"; }} onPointerOut={() => { document.body.style.cursor = "default"; }}>
        <sphereGeometry args={[selected ? 0.085 : top5 ? 0.07 : 0.045, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={selected ? 2.5 : top5 ? 1.6 : 0.6} />
      </mesh>
      {top5 && (
        <mesh ref={ringRef}>
          <ringGeometry args={[0.08, 0.1, 32]} />
          <meshBasicMaterial color="#a855f7" transparent opacity={0.4} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
};
