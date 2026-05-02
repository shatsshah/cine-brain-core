type Props = { kicker: string; title: string; emphasis?: string; section: string; align?: "left" | "center" };
export const SectionHeader = ({ kicker, title, emphasis, section, align = "left" }: Props) => (
  <div className={`flex flex-col gap-2 mb-10 ${align === "center" ? "items-center text-center" : ""}`}>
    <div className="flex items-center gap-3">
      <span className="label-mono">{kicker}</span>
      <span className="font-mono text-[10px] tracking-[0.28em] text-primary border border-primary/40 rounded-full px-2.5 py-0.5">{section}</span>
    </div>
    <h2 className="font-serif text-4xl md:text-5xl font-black tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
      {title} {emphasis && <em className="text-gradient-neon not-italic">{emphasis}</em>}
    </h2>
  </div>
);
