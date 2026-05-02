import { useEffect, useRef, useState } from "react";
import { Particles } from "../components/Particles";
import { Upload, Power, Loader2 } from "lucide-react";
import { useCineBrainStore } from "../store";

const LINE1 = "Streaming apps sell your data.";
const LINE2 = "We secure your vibe.";

export const Landing = ({ onGhostToggle, ghost }: { onGhostToggle: (v: boolean) => void; ghost: boolean }) => {
  const [t1, setT1] = useState("");
  const [t2, setT2] = useState("");
  const [showRest, setShowRest] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ingestFile = useCineBrainStore((s) => s.ingestFile);
  const setGhostMode = useCineBrainStore((s) => s.setGhostMode);
  const isIngesting = useCineBrainStore((s) => s.isIngesting);
  const ingestionProgress = useCineBrainStore((s) => s.ingestionProgress);
  const hasIngested = useCineBrainStore((s) => s.hasIngested);
  const fileCount = useCineBrainStore((s) => s.fileCount);

  useEffect(() => {
    let i = 0, j = 0;
    const id1 = setInterval(() => {
      i++; setT1(LINE1.slice(0, i));
      if (i >= LINE1.length) {
        clearInterval(id1);
        setTimeout(() => {
          const id2 = setInterval(() => {
            j++; setT2(LINE2.slice(0, j));
            if (j >= LINE2.length) { clearInterval(id2); setTimeout(() => setShowRest(true), 400); }
          }, 55);
        }, 700);
      }
    }, 55);
    return () => clearInterval(id1);
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset the input so the same file (or another) can be uploaded again
    e.target.value = "";
    await ingestFile(file);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await ingestFile(file);
  };

  const handleGhostToggle = (value: boolean) => {
    onGhostToggle(value);
    setGhostMode(value);
  };

  return (
    <section className="relative min-h-screen overflow-hidden bg-background">
      <Particles />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background pointer-events-none" />

      {/* film strips */}
      <div className="absolute left-4 top-0 bottom-0 w-10 opacity-20 hidden md:block">
        <div className="h-full w-full bg-[repeating-linear-gradient(180deg,transparent_0_56px,hsl(var(--neon)/0.18)_56px_64px)]" />
      </div>
      <div className="absolute right-4 top-0 bottom-0 w-10 opacity-20 hidden md:block">
        <div className="h-full w-full bg-[repeating-linear-gradient(180deg,transparent_0_56px,hsl(var(--cyan)/0.18)_56px_64px)]" />
      </div>

      <header className="relative z-10 flex items-center justify-between px-6 md:px-12 py-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-primary to-accent shadow-[0_0_18px_hsl(var(--primary)/0.6)]" />
          <span className="font-mono text-xs tracking-[0.32em] text-foreground/80">CINE—BRAIN</span>
        </div>
        <nav className="hidden md:flex items-center gap-7 text-xs font-mono tracking-[0.22em] text-muted-foreground">
          <a href="#vault" className="hover:text-primary">VAULT</a>
          <a href="#vision" className="hover:text-accent">VISION</a>
          <a href="#brain" className="hover:text-primary">BRAIN</a>
          <a href="#universe" className="hover:text-accent">UNIVERSE</a>
        </nav>
      </header>

      <div className="relative z-10 px-6 md:px-12 pt-12 md:pt-20 max-w-6xl mx-auto">
        <h1 className="font-serif text-center text-5xl md:text-7xl lg:text-8xl font-black leading-[1.02] tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
          <span className="block text-foreground">{t1}<span className="inline-block w-[0.6ch] -mb-1 bg-foreground animate-[typewriter-caret_1s_steps(2)_infinite]" style={{ height: "0.9em", verticalAlign: "-0.1em", visibility: t1.length < LINE1.length ? "visible" : "hidden" }} /></span>
          <span className="block mt-3" style={{ color: "hsl(var(--cyan))", textShadow: "0 0 24px hsl(var(--cyan)/0.5)" }}>
            {t2}<span className="inline-block w-[0.6ch] -mb-1 bg-cyan-300 animate-[typewriter-caret_1s_steps(2)_infinite]" style={{ height: "0.9em", verticalAlign: "-0.1em", background: "hsl(var(--cyan))", visibility: t2.length < LINE2.length && t1.length === LINE1.length ? "visible" : "hidden" }} />
          </span>
        </h1>

        <div className={`transition-opacity duration-1000 ${showRest ? "opacity-100" : "opacity-0"}`}>
          <p className="mt-8 mx-auto max-w-2xl text-center text-base md:text-lg text-muted-foreground leading-relaxed">
            Your narrative DNA shouldn't be public property. The first privacy-locked, multimodal cine-brain that decodes your film soul — without ever learning your name.
          </p>

          <div className="mt-14 flex flex-col md:flex-row items-center justify-center gap-8">
            {/* Vault iris drop zone */}
            <div className="relative group">
              <div className="absolute inset-0 rounded-full animate-pulse-ring border-2 border-primary/60" />
              <div className="absolute inset-0 rounded-full animate-pulse-ring [animation-delay:1.2s] border-2 border-accent/40" />
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.pdf,.json"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                disabled={isIngesting}
                className="relative w-72 h-72 rounded-full bg-card/40 border-2 border-primary/50 backdrop-blur-md flex flex-col items-center justify-center gap-3 overflow-hidden hover:scale-[1.02] transition-transform disabled:opacity-70"
              >
                <div className="absolute inset-0 overflow-hidden rounded-full">
                  <div className="absolute -inset-x-10 h-[2px] bg-gradient-to-r from-transparent via-accent to-transparent top-1/2 animate-sweep" />
                </div>

                {isIngesting ? (
                  <>
                    <Loader2 className="w-9 h-9 text-primary animate-spin" strokeWidth={1.5} />
                    <div className="px-6 text-center">
                      <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-foreground/90">PROCESSING...</div>
                      <div className="mt-2 w-36 h-1.5 rounded-full bg-card/80 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-300" style={{ width: `${ingestionProgress}%` }} />
                      </div>
                      <div className="mt-1 font-mono text-[9px] tracking-[0.2em] text-muted-foreground">{Math.round(ingestionProgress)}% SECURED</div>
                    </div>
                  </>
                ) : hasIngested ? (
                  <>
                    <span className="text-3xl">✓</span>
                    <div className="px-6 text-center">
                      <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-accent">VAULT SECURED · {fileCount} {fileCount === 1 ? 'FILE' : 'FILES'}</div>
                      <div className="mt-1 font-mono text-[9px] tracking-[0.2em] text-muted-foreground">Drop CSV + PDF to cross-reference</div>
                    </div>
                  </>
                ) : (
                  <>
                    <Upload className="w-9 h-9 text-primary" strokeWidth={1.5} />
                    <div className="px-6 text-center">
                      <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-foreground/90">Drop your OTT export</div>
                      <div className="mt-1 font-mono text-[9px] tracking-[0.2em] text-muted-foreground">Netflix · Prime · Mubi · Letterboxd · IMDb</div>
                    </div>
                    <div className="font-mono text-[9px] tracking-[0.18em] text-accent/80 mt-1">PARSED LOCALLY · NEVER LEAVES DEVICE</div>
                  </>
                )}
              </button>
            </div>

            {/* Ghost mode */}
            <div className="flex flex-col items-center gap-3">
              <span className="label-mono">{ghost ? "Ghost Mode" : "Standard Mode"}</span>
              <button
                onClick={() => handleGhostToggle(!ghost)}
                aria-label="Toggle Ghost Mode"
                className={`relative w-20 h-36 rounded-2xl border-2 flex items-start justify-center pt-3 transition-all ${
                  ghost ? "border-cyan-400/60 bg-[hsl(var(--phantom))]" : "border-primary/60 bg-card/60"
                }`}
                style={{ boxShadow: ghost ? "inset 0 0 24px hsl(var(--cyan)/0.4)" : "inset 0 0 24px hsl(var(--neon)/0.4)" }}
              >
                <div className={`w-12 h-20 rounded-xl flex items-center justify-center transition-all ${ghost ? "translate-y-12 bg-cyan-400/20" : "translate-y-0 bg-primary/20"}`}>
                  <Power className={`w-6 h-6 ${ghost ? "text-cyan-300" : "text-primary"}`} />
                </div>
              </button>
              <span className="font-mono text-[10px] tracking-[0.22em] text-muted-foreground max-w-[14rem] text-center">
                {ghost ? "Session-only · vaporizes on tab close" : "Anonymous UUID · vectors persist"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 left-0 right-0 overflow-hidden pointer-events-none">
        <div className="font-mono text-[10px] tracking-[0.32em] text-foreground/30 whitespace-nowrap animate-[sweep_28s_linear_infinite]">
          NO PII STORED · NO COOKIES SOLD · NO IDENTITY HARVESTED · ANONYMOUS UUID ONLY · DIFFERENTIAL PRIVACY ENGINE ACTIVE · EDGE AI ON-DEVICE · YOUR VECTORS ARE YOURS · NO PII STORED · NO COOKIES SOLD ·
        </div>
      </div>
    </section>
  );
};
