import { Suspense } from "react";
import { AppPage, AppPageHero } from "@/components/AppPage";
import { AppPageFallback } from "@/components/AppPageFallback";
import { JoinForm } from "@/components/JoinForm";
import { getHeroImage } from "@/lib/site-settings";

import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Gabung",
  description: "Gabung jadi member, mitra penjual, atau partner kolaborasi Mas'ud El-Tamamy.",
  path: "/gabung",
});

const BENEFITS = [
  {
    id: "member",
    title: "Member",
    tone: "blue",
    lead: "Belanja & konsultasi lebih dulu",
    items: [
      "Promo produk & paket wisata lebih awal",
      "Prioritas konsultasi jasa web",
      "Update katalog & trip terbaru",
    ],
  },
  {
    id: "mitra",
    title: "Mitra Penjual",
    tone: "sky",
    lead: "Punya etalase di Market",
    items: [
      "Listing produk fisik/digital",
      "Dibantu rapikan foto & deskripsi",
      "Order masuk lewat konfirmasi WA",
    ],
  },
  {
    id: "partner",
    title: "Partner",
    tone: "navy",
    lead: "Kolaborasi proyek & referral",
    items: [
      "Ikut proyek web/sistem bareng",
      "Referral jasa & paket wisata",
      "Portofolio bersama di website",
    ],
  },
];

const STEPS = [
  { title: "Isi form", text: "Pilih peran dan ceritakan singkat." },
  { title: "Kirim via WA", text: "Pesan otomatis tersusun, tinggal kirim." },
  { title: "Verifikasi", text: "Dicek data & produk/keahlianmu." },
  { title: "Aktif", text: "Tampil di Market atau mulai kolaborasi." },
];

export default function GabungPage() {
  return (
    <Suspense fallback={<AppPageFallback />}>
      <GabungContent />
    </Suspense>
  );
}

async function GabungContent() {
  const heroImage = await getHeroImage("gabung");

  return (
    <AppPage>
      <AppPageHero
        tone="gabung"
        imageUrl={heroImage}
        eyebrow="Ekosistem"
        title="Gabung, tumbuh bareng"
        lead="Untuk yang punya produk, mau belanja, atau kolaborasi — tanpa ribet."
      />

      <div className="apage-body">
        <div className="gb-roles">
          {BENEFITS.map((b) => (
            <article key={b.id} className={`gb-role gb-role--${b.tone}`}>
              <p className="gb-role__lead">{b.lead}</p>
              <h2>{b.title}</h2>
              <ul>
                {b.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <section className="gb-steps-wrap">
          <div className="apage-section-head">
            <p className="eyebrow">Alur</p>
            <h2>Empat langkah</h2>
          </div>
          <div className="gb-steps">
            {STEPS.map((s, i) => (
              <article key={s.title} className="gb-step">
                <span aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="gb-form-wrap">
          <div className="apage-section-head">
            <p className="eyebrow">Form</p>
            <h2>Daftar sekarang</h2>
            <p>Data dikirim lewat WhatsApp — belum perlu akun.</p>
          </div>
          <JoinForm />
        </section>
      </div>
    </AppPage>
  );
}
