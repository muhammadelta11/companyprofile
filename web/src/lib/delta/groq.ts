/** Groq OpenAI-compatible chat (https://console.groq.com/keys). */

const MODEL = process.env.GROQ_MODEL?.trim() || "llama-3.3-70b-versatile";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

export function groqReady() {
  return Boolean(process.env.GROQ_API_KEY?.trim());
}

export type DeltaHistoryItem = { role: "user" | "delta"; text: string };

export async function askGroq(opts: {
  system: string;
  context: string;
  message: string;
  history?: DeltaHistoryItem[];
}): Promise<string | null> {
  const key = process.env.GROQ_API_KEY?.trim();
  if (!key) return null;

  const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
    {
      role: "system",
      content: [
        opts.system,
        "",
        "Konteks internal (jangan dibacakan mentah / jangan dicopy formal):",
        opts.context,
        "",
        "Jawab seperti chat WA — santai, natural, jangan kaku. Bahasa Indonesia.",
      ].join("\n"),
    },
  ];

  for (const h of (opts.history ?? []).filter((x) => x.text.trim()).slice(-8)) {
    messages.push({
      role: h.role === "user" ? "user" : "assistant",
      content: h.text.slice(0, 800),
    });
  }

  messages.push({
    role: "user",
    content: opts.message.slice(0, 500),
  });

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.85,
      max_tokens: 420,
      top_p: 0.95,
      messages,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Groq ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = data.choices?.[0]?.message?.content?.trim();
  return text || null;
}
