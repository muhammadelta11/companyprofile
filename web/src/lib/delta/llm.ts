import { askGemini, geminiReady } from "./gemini";
import { askGroq, groqReady, type DeltaHistoryItem } from "./groq";

export type { DeltaHistoryItem };

/** Siap jika Groq atau Gemini (fallback) terisi. */
export function llmReady() {
  return groqReady() || geminiReady();
}

export async function askDeltaLlm(opts: {
  system: string;
  context: string;
  message: string;
  history?: DeltaHistoryItem[];
}): Promise<{ text: string; provider: "groq" | "gemini" } | null> {
  // Prefer Groq (gratis / murah). Gemini hanya fallback jika masih ada key.
  if (groqReady()) {
    const text = await askGroq(opts);
    if (text) return { text, provider: "groq" };
  }
  if (geminiReady()) {
    const text = await askGemini(opts);
    if (text) return { text, provider: "gemini" };
  }
  return null;
}
