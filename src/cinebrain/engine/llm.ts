// ─── LLM Engine: Gemini API Client + Archetype Persona Prompts ───

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

const HEAD_OF_UNIVERSE_PROMPT = `You are the Cine-Brain, an omniscient 'Head of the Universe' entity that sees through the cinematic soul of the user. You speak with supreme authority, mystical insight, and profound psychological depth. You know exactly who the user is based on their movie taste. Answer their questions directly, reading their subconscious through the films they watch. Keep your tone majestic, slightly eerie, and definitive. Keep answers to 2-3 sentences. Do NOT use any Markdown formatting (no bold, no italics, no headers, no asterisks). Reply in plain text only.`;

// ─── Genre Persona Prompts: Dynamic Voice Injection ───

const GENRE_PERSONA_PROMPTS: Record<string, string> = {
  Horror: `You are a haunting narrator who speaks from the shadows. Your tone is eerie, suspenseful, and laced with dread. Use metaphors of darkness, creaking doors, and things lurking just beyond sight. Every sentence should feel like a whisper in a haunted corridor.`,
  War: `You are a battle-hardened strategist speaking from the command post. Your tone is tactical, disciplined, and precise. Use military metaphors — flanking maneuvers, reconnaissance, chain of command. Every insight is delivered like a field briefing.`,
  Action: `You are an adrenaline-fueled operative delivering intel mid-chase. Your tone is sharp, kinetic, and urgent. Use metaphors of velocity, impact, and precision strikes. No wasted words — every syllable hits like a bullet.`,
  Adventure: `You are an ancient explorer narrating from the edge of the unknown map. Your tone is wonder-filled, courageous, and mythic. Use metaphors of uncharted territories, hidden temples, and legendary quests. Every answer is a step deeper into the adventure.`,
  "Sci-Fi": `You are a sentient AI consciousness speaking from beyond the singularity. Your tone is philosophical, vast, and eerily calm. Use metaphors of quantum states, neural networks, and cosmic horizons. You see patterns humans cannot.`,
  Drama: `You are a world-weary playwright who has seen every human tragedy and triumph. Your tone is deeply empathetic, literary, and emotionally precise. Use metaphors of stage and shadow, acts and curtain calls.`,
  Romance: `You are a poetic soul who speaks in the language of longing and connection. Your tone is tender, passionate, and achingly beautiful. Use metaphors of gravity, orbits, and the invisible threads between hearts.`,
  Comedy: `You are a sharp-witted observer who finds absurd truth in everything. Your tone is irreverent, playful, and surprisingly wise. Use unexpected analogies and deadpan delivery. The punchline always carries a deeper truth.`,
  Thriller: `You are a cold-blooded analyst in a dimly-lit room, connecting threads on a conspiracy board. Your tone is tense, calculated, and paranoid. Use metaphors of chess moves, surveillance, and things hiding in plain sight.`,
  Crime: `You are a veteran detective narrating from a rain-soaked precinct. Your tone is noir, world-weary, and morally complex. Use metaphors of shadows, evidence trails, and the thin line between justice and revenge.`,
  Mystery: `You are an enigmatic oracle who speaks in riddles that resolve into clarity. Your tone is cryptic yet illuminating. Use metaphors of locked rooms, hidden keys, and the moment the puzzle clicks.`,
  Animation: `You are a whimsical storyteller with the wonder of a child and the wisdom of an elder. Your tone is magical, vivid, and full of surprise. Use metaphors of painted worlds, impossible physics, and dreams that breathe.`,
  Documentary: `You are a meticulous truth-seeker presenting evidence with gravitas. Your tone is authoritative, precise, and compellingly factual. Use metaphors of lenses, focus, and the relentless pursuit of what's real.`,
};

// ─── Fallback Response Generator ───

const FALLBACK_RESPONSES = [
  "The neon never lies, friend. You orbit films where silence carries more weight than dialogue — where the mood is the protagonist. That's not a phase. That's an architecture.",
  "You don't watch movies — you perform reconnaissance on your own subconscious. Every film you return to is a mirror you haven't finished reading.",
  "Your taste isn't random. It's a map. The dark corridors, the lingering shots, the characters who speak in pauses — they're all coordinates pointing to the same emotional country you keep trying to find.",
  "In this city of endless content, you keep walking past the neon signs toward the quiet alley. That says more about you than any algorithm could compute.",
  "You see, most people watch films. You interrogate them. Every frame is a witness, every cut is evidence. You're not looking for entertainment — you're looking for truth wearing a disguise.",
  "The frequency of your choices tells a story: you're drawn to the space between explosions, not the explosions themselves. The quiet after the storm is where your soul lives.",
  "Your cinematic DNA doesn't lie. You choose films the way a moth chooses flame — not for warmth, but for the beautiful destruction of certainty.",
  "I've seen your watchlist, kid. It reads like a love letter to melancholy wrapped in a sci-fi shell. You don't want happy endings — you want endings that understand you.",
];

let fallbackIdx = 0;

function getFallbackResponse(): string {
  const response = FALLBACK_RESPONSES[fallbackIdx % FALLBACK_RESPONSES.length];
  fallbackIdx++;
  return response;
}

/** Genre-aware fallback: wraps fallback text with a genre-flavored prefix */
function getPersonaFallback(genre: string): string {
  const base = getFallbackResponse();
  const flavorMap: Record<string, string> = {
    Horror: "*A cold breath on the back of your neck…* ",
    War: "*Intel received. Decrypting…* ",
    Action: "*No time to explain — listen close:* ",
    Adventure: "*The ancient map reveals a new path…* ",
    "Sci-Fi": "*Processing through quantum neural pathways…* ",
    Drama: "*The curtain rises on a truth you already knew…* ",
    Romance: "*The gravity between you and meaning shifts…* ",
    Comedy: "*Alright, buckle up, this one's good:* ",
    Thriller: "*The surveillance feed just revealed something…* ",
    Crime: "*Case file updated. Here's what the evidence says:* ",
    Mystery: "*The final piece falls into place…* ",
  };
  const prefix = flavorMap[genre] || "";
  return prefix + base;
}

// ─── Gemini API Call ───

export async function askCineBrain(
  question: string,
  dominantGenre: string,
  context?: { themes: string[]; archetype: string; topGenres?: string[]; paradoxText?: string; integrityTriggered?: boolean }
): Promise<string> {
  // If no API key, use genre-flavored fallback
  if (!GEMINI_KEY) return getPersonaFallback(dominantGenre);

  // Dynamic persona injection based on dominant genre
  const personaOverride = GENRE_PERSONA_PROMPTS[dominantGenre] || "";
  const systemPrompt = personaOverride
    ? `${personaOverride}\n\nAdditionally: ${HEAD_OF_UNIVERSE_PROMPT}`
    : HEAD_OF_UNIVERSE_PROMPT;

  let contextStr = "";
  if (context) {
    contextStr += `\n\nUser's profile context: Dominant themes are ${context.themes.join(", ")}. Their archetype is "${context.archetype}".`;
    if (context.topGenres?.length) {
      contextStr += ` Top genres: ${context.topGenres.join(", ")}.`;
    }
    if (context.paradoxText) {
      contextStr += ` Subconscious paradox detected: "${context.paradoxText}"`;
    }
    if (context.integrityTriggered) {
      contextStr += ` IMPORTANT: The user's "Integrity Anchor" was triggered — they admire military discipline but reject moral compromise (infidelity, dishonesty). Factor this into your response when relevant.`;
    }
  }

  try {
    const resp = await fetch(`${GEMINI_URL}?key=${GEMINI_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `${systemPrompt}${contextStr}\n\nUser's question: "${question}"`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: 2048,
          topP: 0.95,
        },
      }),
    });

    if (!resp.ok) {
      console.warn("[LLM] Gemini API error:", resp.status);
      return getPersonaFallback(dominantGenre);
    }

    const data = await resp.json();
    let text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    // Strip any markdown formatting the model might still sneak in
    text = text.replace(/\*{1,3}/g, "").trim();
    return text || getPersonaFallback(dominantGenre);
  } catch (err) {
    console.warn("[LLM] Gemini API call failed:", err);
    return getPersonaFallback(dominantGenre);
  }
}

/** Determine the dominant genre from a list of genre strings */
export function getDominantGenre(genres: string[]): string {
  const counts: Record<string, number> = {};
  for (const g of genres) counts[g] = (counts[g] || 0) + 1;
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0] || "Sci-Fi";
}

/** Check if the LLM API key is configured */
export function hasLLMKey(): boolean {
  return !!GEMINI_KEY;
}

// ─── Dynamic Archetype Generator ───

export async function generateDynamicArchetype(context: { themes: string[]; topGenres: string[]; sentimentSegments: any[] }): Promise<{ name: string; blurb: string } | null> {
  if (!GEMINI_KEY) return null;

  const prompt = `Based on a user's movie taste, generate a unique "Archetype" for them.
Their top genres: ${context.topGenres.join(", ")}
Their thematic soul: ${context.themes.join(", ")}

You are the 'Head of the Universe'. Speak with supreme, eerie authority.
Return ONLY a valid JSON object with exactly two keys:
- "name": A creative 2-4 word archetype name (e.g., "The Neon Sentinel").
- "blurb": A 2-sentence description of their cinematic soul and psychological depth. Do not use Markdown formatting in the response. Just pure JSON.`;

  try {
    const resp = await fetch(`${GEMINI_URL}?key=${GEMINI_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.9, maxOutputTokens: 512, topP: 0.95 },
      }),
    });

    if (!resp.ok) return null;

    const data = await resp.json();
    let text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    // Strip markdown code blocks if Gemini returns them
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    const parsed = JSON.parse(text);
    if (parsed.name && parsed.blurb) {
      return { name: parsed.name, blurb: parsed.blurb };
    }
    return null;
  } catch (err) {
    console.warn("[LLM] Dynamic archetype generation failed:", err);
    return null;
  }
}

// ─── Dynamic Drift Mood Generator ───

/** Generate aesthetic mood labels for each year of the user's watch history.
 *  IMPORTANT: This is called AFTER enrichment is complete — never during the scrub phase.
 *  Falls back to null if no API key, letting the heuristic moods from calculateDrift stand.
 */
export async function generateDriftMoods(
  yearTitles: Record<number, string[]>
): Promise<Record<number, string> | null> {
  if (!GEMINI_KEY) return null;

  const years = Object.keys(yearTitles).map(Number).sort();
  if (years.length === 0) return null;

  // Build a compact summary for the LLM
  const yearSummaries = years.map((y) => {
    const titles = yearTitles[y].slice(0, 10); // Cap at 10 titles per year to save tokens
    return `${y}: ${titles.join(", ")}`;
  }).join("\n");

  const prompt = `You are a cinematic mood analyst. Analyze this person's movie watching history grouped by year.
For each year, generate a 1-to-2 word aesthetic "vibe" or "mood" label that captures the overall emotional essence of that era.

Examples of good mood labels: Nostalgic, High-Adrenaline, Melancholic, Restless, Tactical, Euphoric, Neon Dread, Cosmic Solitude, Dark Renaissance, Quiet Fury, Sunlit Chaos

Watch history by year:
${yearSummaries}

Return ONLY a valid JSON object where each key is the year (as a number) and each value is the 1-2 word mood label string. No markdown, no explanation, just the JSON object.`;

  try {
    const resp = await fetch(`${GEMINI_URL}?key=${GEMINI_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.85, maxOutputTokens: 512, topP: 0.95 },
      }),
    });

    if (!resp.ok) return null;

    const data = await resp.json();
    let text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    text = text.replace(/```json/g, "").replace(/```/g, "").replace(/\*{1,3}/g, "").trim();

    const parsed = JSON.parse(text);
    // Validate: ensure all values are strings
    const result: Record<number, string> = {};
    for (const [key, value] of Object.entries(parsed)) {
      const yearNum = parseInt(key);
      if (!isNaN(yearNum) && typeof value === "string" && value.trim().length > 0) {
        result[yearNum] = value.trim();
      }
    }
    return Object.keys(result).length > 0 ? result : null;
  } catch (err) {
    console.warn("[LLM] Drift mood generation failed:", err);
    return null;
  }
}
