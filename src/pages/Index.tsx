import { useEffect, useState } from "react";
import { Landing } from "@/cinebrain/sections/Landing";
import { Vault } from "@/cinebrain/sections/Vault";
import { VisionLab } from "@/cinebrain/sections/VisionLab";
import { LinguisticBrain } from "@/cinebrain/sections/LinguisticBrain";
import { TasteUniverse } from "@/cinebrain/sections/TasteUniverse";

const Index = () => {
  const [ghost, setGhost] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("ghost", ghost);
  }, [ghost]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Landing onGhostToggle={setGhost} ghost={ghost} />
      <Vault />
      <VisionLab />
      <LinguisticBrain />
      <TasteUniverse />
      <footer className="border-t border-border bg-[hsl(var(--phantom))] px-6 md:px-12 py-12">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-8">
          <div>
            <div className="font-mono text-xs tracking-[0.32em] text-foreground/80">CINE—BRAIN · CREDITS</div>
            <div className="mt-5 space-y-2 text-sm">
              {[
                ["Member 1", "The Privacy Architect & Acoustic Analyst"],
                ["Member 2", "The Visual Researcher"],
                ["Member 3", "The Forensic Biographer"],
                ["Member 4", "The Experience Engineer"],
              ].map(([k, v]) => (
                <div key={k} className="grid grid-cols-[120px_1fr] gap-3 items-baseline">
                  <span className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground">{k}</span>
                  <span className="font-serif italic" style={{ fontFamily: "'Playfair Display', serif" }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="md:text-right flex flex-col justify-between">
            <p className="font-serif text-2xl md:text-3xl leading-snug" style={{ fontFamily: "'Playfair Display', serif" }}>
              Your narrative DNA. <em className="text-gradient-neon not-italic">Secured. Decoded. Yours.</em>
            </p>
            <p className="mt-6 font-mono text-[10px] tracking-[0.22em] text-muted-foreground">© CINE-BRAIN · NO PII · NO COOKIES · ANON UUID ONLY</p>
          </div>
        </div>
      </footer>
    </main>
  );
};

export default Index;
