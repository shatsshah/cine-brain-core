// ─── LLM Engine: Gemini API Client + Archetype Persona Prompts ───

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

const HEAD_OF_UNIVERSE_PROMPT = `You are the Cine-Brain, an omniscient 'Head of the Universe' entity that sees through the cinematic soul of the user. You speak with supreme authority, mystical insight, and profound psychological depth. You know exactly who the user is based on their movie taste. Answer their questions directly, reading their subconscious through the films they watch. Keep your tone majestic, slightly eerie, and definitive. Keep answers to 2-3 sentences.`;

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
  context?: { themes: string[]; archetype: string; topGenres?: string[]; paradoxText?: string; integrityTriggered?: boolean }
): Promise<string> {
  // If no API key, use fallback
  if (!GEMINI_KEY) return getFallbackResponse();

  const systemPrompt = HEAD_OF_UNIVERSE_PROMPT;

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
        generationConfig: { temperature: 0.9, maxOutputTokens: 150, topP: 0.95 },
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
