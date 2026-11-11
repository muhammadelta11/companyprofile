import { GoogleGenerativeAI } from "@google/generative-ai";

const MODEL = process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash";

export function geminiReady() {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

export type DeltaHistoryItem = { role: "user" | "delta"; text: string };

export async function askGemini(opts: {
  system: string;
  context: string;
  message: string;
  history?: DeltaHistoryItem[];
}): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) return null;

  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({
    model: MODEL,
    systemInstruction: opts.system,
    generationConfig: {
      temperature: 0.85,
      maxOutputTokens: 420,
      topP: 0.95,
    },
  });

  const history = (opts.history ?? [])
    .filter((h) => h.text.trim())
    .slice(-8)
    .map((h) => ({
      role: h.role === "user" ? ("user" as const) : ("model" as const),
      parts: [{ text: h.text.slice(0, 800) }],
    }));

  // Gemini mengharuskan history diawali turn user.
  while (history.length && history[0].role !== "user") history.shift();

  const chat = model.startChat({ history });
  const prompt = [
    "Konteks internal (jangan dibacakan mentah / jangan dicopy formal):",
    opts.context,
    "",
    "Jawab seperti chat WA — santai, natural, jangan kaku.",
    `Pertanyaan user: ${opts.message.slice(0, 500)}`,
  ].join("\n");

  const result = await chat.sendMessage(prompt);
  const text = result.response.text()?.trim();
  return text || null;
}
