import { NextResponse } from "next/server";
import { SITE, waLink } from "@/data/site";
import { getCurrentUser } from "@/lib/auth";
import { buildDeltaContext, buildDeltaSystemPrompt } from "@/lib/delta/context";
import { askDeltaLlm, llmReady, type DeltaHistoryItem } from "@/lib/delta/llm";
import { publicClient } from "@/lib/supabase/public";
import { supabaseReady } from "@/lib/supabase/env";
import { isHoneypot, isRateLimited, isTooFast } from "@/lib/spam";

type Body = {
  message?: string;
  page?: string;
  website?: string;
  startedAt?: number;
  history?: DeltaHistoryItem[];
};

function fallbackReply(message: string, faqAnswer: string, score: number) {
  const lower = message.toLowerCase();
  const wantsWa = /whatsapp|hubungi|kontak|chat wa|bicara|human|manusia/.test(lower);
  if (wantsWa) {
    return `Oke, langsung aja chat Mas'ud di WA ${SITE.waDisplay}. Nanti aku ikut kasih ringkasan pertanyaanmu biar dia langsung nyambung.`;
  }
  if (score >= 2) return faqAnswer;
  return `Hmm, aku belum nemu jawaban pas. Coba lebih spesifik ya — soal jasa, Market, atau wisata. Atau langsung WA Mas'ud aja biar lebih cepet.`;
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Body;

  if (isHoneypot(body.website) || isTooFast(body.startedAt)) {
    return NextResponse.json({
      reply: "Terima kasih. Tim kami akan meninjau pesanmu.",
      confidence: "low",
      mode: "guard",
      disclosure: "Delta adalah asisten AI.",
      waUrl: waLink(`Halo dari website ${SITE.domain}`),
      suggestions: ["Hubungkan ke WhatsApp"],
    });
  }

  if (await isRateLimited("delta", 8)) {
    return NextResponse.json(
      { error: "Terlalu banyak pertanyaan. Tunggu beberapa detik." },
      { status: 429 }
    );
  }

  const message = (body.message || "").trim().slice(0, 500);
  const page = (body.page || "/").slice(0, 60);
  if (!message) {
    return NextResponse.json({ error: "Pesan kosong." }, { status: 400 });
  }

  const history = Array.isArray(body.history)
    ? body.history
        .filter(
          (h): h is DeltaHistoryItem =>
            !!h &&
            (h.role === "user" || h.role === "delta") &&
            typeof h.text === "string"
        )
        .slice(-8)
    : [];

  const [user, built] = await Promise.all([
    getCurrentUser().catch(() => null),
    buildDeltaContext(message, page),
  ]);

  let reply: string | null = null;
  let mode: "groq" | "gemini" | "faq" = "faq";
  let confidence: "high" | "low" = built.score >= 2 ? "high" : "low";

  if (llmReady()) {
    try {
      const ai = await askDeltaLlm({
        system: buildDeltaSystemPrompt(user),
        context: built.context,
        message,
        history,
      });
      if (ai?.text) {
        reply = ai.text;
        mode = ai.provider;
        confidence = "high";
      }
    } catch {
      reply = null;
    }
  }

  if (!reply) {
    reply = fallbackReply(message, built.faq.a, built.score);
    mode = "faq";
    confidence = built.score >= 2 ? "high" : "low";
  }

  if (supabaseReady) {
    await publicClient()
      .from("delta_logs")
      .insert({
        page,
        question: message,
        answer: reply.slice(0, 1000),
        confidence,
      });
    if (confidence === "low") {
      try {
        const { notifyAdmins } = await import("@/lib/push");
        notifyAdmins({
          title: "Delta belum terjawab",
          body: message.slice(0, 100),
          url: "/dashboard/delta",
          tag: "delta-low",
        });
      } catch {
        /* push opsional */
      }
    }
  }

  const handoffText = `Halo Mas'ud, saya dari website ${SITE.domain} (halaman ${page}).\n\nPertanyaan: ${message}\n\nRingkasan Delta:\n${reply}`;

  return NextResponse.json({
    reply,
    confidence,
    mode,
    disclosure:
      "Delta adalah asisten AI. Jawaban bisa tidak sempurna — deal final via WhatsApp.",
    waUrl: waLink(handoffText),
    suggestions:
      confidence === "low"
        ? [
            "Layanan apa saja?",
            "Cara order di Market?",
            "Ada paket wisata?",
            "Hubungkan ke WhatsApp",
          ]
        : ["Hubungkan ke WhatsApp", "Lihat proyek", "Mau jadi mitra"],
  });
}
