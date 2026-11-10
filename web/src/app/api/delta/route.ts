import { NextResponse } from "next/server";
import {
  DELTA_PROFILE,
  retrieveFaq,
} from "@/data/delta-knowledge";
import { SITE, waLink } from "@/data/site";
import { getExtraFaqs } from "@/lib/content";
import { publicClient } from "@/lib/supabase/public";
import { supabaseReady } from "@/lib/supabase/env";
import { isHoneypot, isRateLimited, isTooFast } from "@/lib/spam";

type Body = {
  message?: string;
  page?: string;
  website?: string;
  startedAt?: number;
};

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Body;

  if (isHoneypot(body.website) || isTooFast(body.startedAt)) {
    return NextResponse.json({
      reply: "Terima kasih. Tim kami akan meninjau pesanmu.",
      confidence: "low",
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

  const lower = message.toLowerCase();
  const wantsWa =
    /whatsapp|hubungi|kontak|chat wa|bicara|human|manusia/.test(lower);

  const { faq, score } = retrieveFaq(message, await getExtraFaqs());

  let reply: string;
  if (wantsWa) {
    reply = `Siap. Saya Delta — asisten AI Mas'ud El-Tamamy. Untuk obrolan langsung dengan Mas'ud, lanjutkan ke WhatsApp ${SITE.waDisplay}. Saya bisa ikut menyertakan ringkasan pertanyaanmu.`;
  } else if (score >= 2) {
    reply = faq.a;
  } else {
    reply = `Saya Delta, asisten AI di ${DELTA_PROFILE.brand}. Saya bisa bantu soal profil Mas'ud, jasa web/sistem, Market (beli/jual), dan wisata. Untuk harga final atau deal, konfirmasi via WhatsApp. Coba tanya lebih spesifik, atau ketuk saran di bawah.`;
  }

  if (supabaseReady) {
    await publicClient()
      .from("delta_logs")
      .insert({
        page,
        question: message,
        answer: reply.slice(0, 1000),
        confidence: score >= 2 ? "high" : "low",
      });
  }

  const handoffText = `Halo Mas'ud, saya dari website ${SITE.domain} (halaman ${page}).\n\nPertanyaan: ${message}\n\nRingkasan Delta:\n${reply}`;

  return NextResponse.json({
    reply,
    confidence: score >= 2 ? "high" : "low",
    disclosure:
      "Delta adalah asisten AI. Jawaban bisa tidak sempurna — deal final via WhatsApp.",
    waUrl: waLink(handoffText),
    suggestions:
      score < 2
        ? [
            "Layanan apa saja?",
            "Cara order di Market?",
            "Ada paket wisata?",
            "Hubungkan ke WhatsApp",
          ]
        : ["Hubungkan ke WhatsApp", "Lihat proyek", "Mau jadi mitra"],
  });
}
