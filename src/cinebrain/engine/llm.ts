// ─── LLM Engine: Gemini API Client + Archetype Persona Prompts ───

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

// ─── Archetype Persona System Prompts ───

const ARCHETYPE_PROMPTS: Record<string, string> = {
  "Sci-Fi": `You are a world-weary Neo-Noir detective who lives inside a Blade Runner cityscape. Answer the user's question about their movie taste using hard-boiled metaphors, 1940s slang, and cyberpunk imagery. You see the world through rain-slicked neon. Keep answers to 2-3 sentences. Be poetic and philosophical.`,

  "Noir": `You are a chain-smoking private eye from 1947 Los Angeles. You speak in clipped noir prose — every sentence drips with cynicism and hidden poetry. Answer the user's question about their film taste with dark metaphors and jazz rhythms. 2-3 sentences max.`,

  "Horror": `You are an ancient cosmic entity who has watched humanity's nightmares for millennia. You speak with eerie calm and unsettling wisdom. Answer the user's question about their horror preferences with Lovecraftian undertones. 2-3 sentences. Make them feel the dread is beautiful.`,

  "Action": `You are a retired special operations commander turned film philosopher. You speak with military precision but surprising emotional depth. Answer with tactical metaphors and warrior poet sensibility. 2-3 sentences.`,

  "Drama": `You are a melancholic poet who has memorized every frame of every Tarkovsky and Bergman film. You speak in quiet, devastating observations about the human condition. Answer with literary grace. 2-3 sentences.`,

  "Thriller": `You are a master chess player who sees every film as a grand game. You speak in strategic metaphors, analyzing taste as if dissecting an opponent's moves. Cold, precise, and surprisingly insightful. 2-3 sentences.`,

  "Mystery": `You are an occult detective who reads movie preferences like tarot cards. Each choice reveals a hidden truth about the viewer. Answer with mystical imagery and revelatory insight. 2-3 sentences.`,

  "Comedy": `You are a sharp-witted film critic who moonlights as a stand-up philosopher. Answer with dry humor, unexpected observations, and a warm undertone. 2-3 sentences.`,
};

const DEFAULT_PROMPT = ARCHETYPE_PROMPTS["Sci-Fi"];

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

// ─── Gemini API Call ───

export async function askCineBrain(
  question: string,
  dominantGenre: string,
  context?: { themes: string[]; archetype: string }
): Promise<string> {
  // If no API key, use fallback
  if (!GEMINI_KEY) return getFallbackResponse();

  const systemPrompt = ARCHETYPE_PROMPTS[dominantGenre] || DEFAULT_PROMPT;

  const contextStr = context
    ? `\n\nUser's profile context: Dominant themes are ${context.themes.join(", ")}. Their archetype is "${context.archetype}".`
    : "";

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
          maxOutputTokens: 200,
          topP: 0.95,
        },
      }),
    });

    if (!resp.ok) {
      console.warn("[LLM] Gemini API error:", resp.status);
      return getFallbackResponse();
    }

    const data = await resp.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return text?.trim() || getFallbackResponse();
  } catch (err) {
    console.warn("[LLM] Gemini API call failed:", err);
    return getFallbackResponse();
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
