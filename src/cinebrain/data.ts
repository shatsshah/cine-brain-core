// Mocked Cine-Brain data. Swap `getMovies()` to a TMDB fetch later.

export type Movie = {
  id: string;
  title: string;
  year: number;
  genre: "Sci-Fi" | "Thriller" | "Drama" | "Horror" | "Mystery" | "Action" | "Noir";
  themes: string[];
  poster: string; // emoji-rendered placeholder color
  posterColors: string[]; // 5 hex
  visual: number; // 0..100
  textual: number;
  acoustic: number;
  watched?: boolean;
  // 2D galaxy coords (-1..1)
  x: number;
  y: number;
  z: number;
  match: number;
  evidence: string[];
};

const seed = (i: number, salt = 1) => {
  const x = Math.sin(i * 9999.13 + salt * 7.7) * 43758.5453;
  return x - Math.floor(x);
};

const RAW: Omit<Movie, "x" | "y" | "z" | "match" | "evidence">[] = [
  { id: "br2049", title: "Blade Runner 2049", year: 2017, genre: "Sci-Fi", themes: ["Isolation","Identity","Dystopia"], poster: "🌆", posterColors:["#1C2B4B","#E8A22C","#9B7FA8","#0F2035","#CF6B3A"], visual: 89, textual: 92, acoustic: 84, watched: true },
  { id: "annihilation", title: "Annihilation", year: 2018, genre: "Sci-Fi", themes: ["Decay","Identity","Dread"], poster: "🌿", posterColors:["#0a3a2e","#7fffd4","#c9b6ff","#1d0f2b","#f5d76e"], visual: 86, textual: 88, acoustic: 81, watched: true },
  { id: "interstellar", title: "Interstellar", year: 2014, genre: "Sci-Fi", themes: ["Time","Love","Sacrifice"], poster: "🪐", posterColors:["#0b1320","#d6a96b","#e9e4d4","#1f2a44","#7fa3c9"], visual: 81, textual: 87, acoustic: 90 },
  { id: "arrival", title: "Arrival", year: 2016, genre: "Sci-Fi", themes: ["Language","Time","Grief"], poster: "🛸", posterColors:["#1a2226","#7e8c95","#cfd6d3","#0f1416","#a7b9b4"], visual: 78, textual: 91, acoustic: 76 },
  { id: "drive", title: "Drive", year: 2011, genre: "Noir", themes: ["Solitude","Violence","Code"], poster: "🌃", posterColors:["#ff2d95","#0a0a14","#2bd1c8","#3a1d4f","#e0c46c"], visual: 84, textual: 76, acoustic: 86, watched: true },
  { id: "darkknight", title: "The Dark Knight", year: 2008, genre: "Action", themes: ["Chaos","Order","Sacrifice"], poster: "🦇", posterColors:["#0a0a0a","#262626","#a7a7a7","#3b1d12","#e0a23a"], visual: 72, textual: 80, acoustic: 88, watched: true },
  { id: "inception", title: "Inception", year: 2010, genre: "Sci-Fi", themes: ["Reality","Memory","Loss"], poster: "💤", posterColors:["#1a1a2e","#5a4a78","#bfb5c7","#0e0e1c","#c79a3a"], visual: 80, textual: 84, acoustic: 89, watched: true },
  { id: "parasite", title: "Parasite", year: 2019, genre: "Thriller", themes: ["Class","Family","Greed"], poster: "🏚️", posterColors:["#3a2c1a","#d6c19a","#7a8a5a","#1a1410","#a85a3a"], visual: 75, textual: 90, acoustic: 70, watched: true },
  { id: "joker", title: "Joker", year: 2019, genre: "Drama", themes: ["Madness","Isolation","Society"], poster: "🃏", posterColors:["#3a1a4f","#d44a2a","#1a1018","#7a3a5a","#e0c46c"] , visual: 79, textual: 86, acoustic: 78 },
  { id: "hereditary", title: "Hereditary", year: 2018, genre: "Horror", themes: ["Grief","Family","Dread"], poster: "🕯️", posterColors:["#1a0e0a","#6a3a2a","#e0c46c","#0e0608","#a85a3a"], visual: 88, textual: 82, acoustic: 91 },
  { id: "midsommar", title: "Midsommar", year: 2019, genre: "Horror", themes: ["Grief","Cult","Light"], poster: "🌼", posterColors:["#f5e6c8","#d4a373","#7a8a5a","#3a2c1a","#e94f37"], visual: 85, textual: 80, acoustic: 79 },
  { id: "prisoners", title: "Prisoners", year: 2013, genre: "Thriller", themes: ["Faith","Vengeance","Loss"], poster: "🌧️", posterColors:["#1a1a22","#3a3a44","#7a7a82","#0e0e14","#a85a3a"], visual: 70, textual: 84, acoustic: 74 },
  { id: "noctournalanim", title: "Nocturnal Animals", year: 2016, genre: "Noir", themes: ["Regret","Art","Violence"], poster: "🎨", posterColors:["#0a0a14","#e94f37","#3a1a4f","#1a1018","#c79a3a"], visual: 87, textual: 85, acoustic: 73 },
  { id: "mulholland", title: "Mulholland Drive", year: 2001, genre: "Mystery", themes: ["Dream","Identity","Fate"], poster: "🌹", posterColors:["#1a0e1a","#a83a5a","#3a2c44","#0e0814","#e0c46c"], visual: 82, textual: 88, acoustic: 83 },
  { id: "ghost", title: "Ghost in the Shell", year: 1995, genre: "Sci-Fi", themes: ["Identity","Body","Memory"], poster: "🤖", posterColors:["#0a1a2e","#2bd1c8","#a85a3a","#1a1018","#7a8a9a"], visual: 83, textual: 79, acoustic: 80 },
  { id: "tenet", title: "Tenet", year: 2020, genre: "Action", themes: ["Time","Loop","Duty"], poster: "⏳", posterColors:["#0e1a2a","#c79a3a","#7a8a9a","#1a1018","#3a4a5a"], visual: 76, textual: 70, acoutic: 85 } as any,
];

export const movies: Movie[] = RAW.map((m, i) => {
  // place by genre cluster
  const clusters: Record<string, [number, number]> = {
    "Sci-Fi": [-0.55, 0.55], Thriller: [0.6, 0.45], Drama: [0.4, -0.4],
    Horror: [-0.6, -0.5], Mystery: [0.05, -0.6], Action: [0.55, -0.05], Noir: [-0.3, 0.0],
  };
  const [cx, cy] = clusters[m.genre] ?? [0, 0];
  const jx = (seed(i, 1) - 0.5) * 0.35;
  const jy = (seed(i, 2) - 0.5) * 0.35;
  const jz = (seed(i, 3) - 0.5) * 0.4;
  const visual = (m as any).visual ?? 70;
  const textual = (m as any).textual ?? 70;
  const acoustic = (m as any).acoustic ?? (m as any).acoutic ?? 70;
  const match = Math.round(visual * 0.4 + textual * 0.4 + acoustic * 0.2);
  const evidence = [
    ...(m.posterColors[0] ? ["Neon palette"] : []),
    "High contrast",
    ...m.themes.slice(0, 2),
    acoustic > 80 ? "Synth-driven" : "Orchestral",
    acoustic > 82 ? "High Sensory Chaos" : "Low Audio Stimuli",
  ];
  return { ...m, acoustic, match, x: cx + jx, y: cy + jy, z: jz, evidence } as Movie;
});

export const aggregatePalette = ["#1C2B4B","#E8A22C","#9B7FA8","#0F2035","#CF6B3A"];
export const paletteNames = ["Rain-soaked ultraviolet","Amber city glow","Neon haze diffusion","Deep slate void","Rust horizon dust"];

export const archetype = {
  name: "The Cosmic Dreamer",
  confidence: 94,
  blurb: "You seek films that render the infinite human condition against vast, indifferent backdrops. Isolation is not a punishment — it is a philosophical condition you return to. You believe in beauty inside entropy.",
  films: ["Blade Runner 2049", "Annihilation", "Interstellar"],
};

export const themes = [
  { name: "Isolation", weight: 92 },
  { name: "Identity", weight: 88 },
  { name: "Dystopia", weight: 80 },
  { name: "Memory", weight: 74 },
  { name: "Grief", weight: 68 },
  { name: "Time", weight: 64 },
  { name: "Redemption", weight: 52 },
  { name: "Betrayal", weight: 48 },
  { name: "Fate", weight: 42 },
  { name: "Love", weight: 38 },
];

export const driftPoints = [
  { year: 2020, mood: "Hopeful", value: 0.72 },
  { year: 2021, mood: "Curious", value: 0.65 },
  { year: 2022, mood: "Optimistic", value: 0.78 },
  { year: 2023, mood: "Restless", value: 0.5 },
  { year: 2024, mood: "Reflective", value: 0.34 },
  { year: 2025, mood: "Cynical Noir", value: 0.18 },
  { year: 2026, mood: "Cosmic Dread", value: 0.22 },
];
