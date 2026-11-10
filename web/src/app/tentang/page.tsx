import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { AppPage, AppPageHero } from "@/components/AppPage";
import { AppPageFallback } from "@/components/AppPageFallback";
import { ShareBar } from "@/components/ShareBar";
import { SITE, waLink } from "@/data/site";
import { getHeroImage, getSiteSettings } from "@/lib/site-settings";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata() {
  const [hero, settings] = await Promise.all([
    getHeroImage("tentang"),
    getSiteSettings(),
  ]);
  return pageMetadata({
    title: "Tentang",
    description: `Tentang Muhammad Mas'ud dan brand ${SITE.brand} — digital, market, dan wisata.`,
    path: "/tentang",
    image: settings.portrait_tentang || hero || "/portrait.jpg",
  });
}

const PATHS = [
  { href: "/layanan", label: "Layanan", hint: "Jasa & sistem" },
  { href: "/market", label: "Market", hint: "Produk & mitra" },
  { href: "/wisata", label: "Wisata", hint: "Paket trip" },
  { href: "/proyek", label: "Proyek", hint: "Portfolio" },
] as const;

const VALUES = [
  {
    tone: "teal",
    title: "Beres, bukan setengah jadi",
    text: "Sistem dan konten yang bisa dipakai — bukan demo kosong.",
  },
  {
    tone: "sky",
    title: "Order jelas via WA",
    text: "Harga, detail, dan jadwal dikonfirmasi. Bukan checkout gelap.",
  },
  {
    tone: "navy",
    title: "Tumbuh bareng mitra",
    text: "Market & wisata terbuka untuk member, penjual, dan partner.",
  },
] as const;

export default function TentangPage() {
  return (
    <Suspense fallback={<AppPageFallback />}>
      <TentangContent />
    </Suspense>
  );
}

async function TentangContent() {
  const [heroImage, settings] = await Promise.all([
    getHeroImage("tentang"),
    getSiteSettings(),
  ]);
  const portrait = settings.portrait_tentang || "/portrait.jpg";

  return (
    <AppPage>
      <AppPageHero
        tone="tentang"
        imageUrl={heroImage}
        eyebrow="Tentang"
        title="Muhammad Mas'ud"
        lead={
          <>
            Di balik brand <strong>{SITE.brand}</strong> — digital, market, dan wisata.
          </>
        }
      >
        <div className="apage-hero__portrait">
          <Image
            src={portrait}
            alt="Muhammad Mas'ud"
            width={320}
            height={400}
            priority
            sizes="112px"
          />
        </div>
        <p className="apage-hero__meta">
          {SITE.nick} · {SITE.location}
        </p>
        <div className="apage-hero__actions">
          <a
            className="mhome-btn mhome-btn--primary"
            href={waLink("Halo Mas'ud, saya ingin kenalan / kolaborasi.")}
            target="_blank"
            rel="noopener noreferrer"
          >
            Chat WhatsApp
          </a>
          <a
            className="mhome-btn mhome-btn--ghost"
            href={SITE.github}
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </div>
        <p className="apage-hero__support">
          <a href={SITE.saweria} target="_blank" rel="noopener noreferrer">
            Dukung lewat Saweria →
          </a>
        </p>
      </AppPageHero>

      <div className="apage-body tentang-body">
        <div className="apage-share">
          <ShareBar
            title={`Tentang ${SITE.brand}`}
            path="/tentang"
            text={`Kenalan dengan Muhammad Mas'ud dan brand ${SITE.brand}`}
          />
        </div>
        <section className="ab-story ab-story--rich">
          <p className="ab-kicker">Visi</p>
          <h2>Platform yang bisa dipakai sehari-hari</h2>
          <p>
            Branding open work, bisnis jasa &amp; produk, manfaat untuk mitra/member,
            serta ruang riset — dengan <strong>Delta</strong> sebagai pemandu.
          </p>
          <p>
            Kerja di Lingkar.co &amp; Mbarep Tour; pendidikan Teknik Informatika Unwahas.
          </p>
        </section>

        <section className="ab-paths" aria-label="Jelajah menu">
          <h2>Jelajah</h2>
          <div className="ab-paths__grid">
            {PATHS.map((p) => (
              <Link key={p.href} href={p.href} className="ab-path">
                <strong>{p.label}</strong>
                <span>{p.hint}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="ab-principles" aria-label="Prinsip kerja">
          <h2>Cara kerja</h2>
          <ol className="ab-principles__list">
            {VALUES.map((v, i) => (
              <li key={v.title} className={`ab-principle ab-principle--${v.tone}`}>
                <span aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h3>{v.title}</h3>
                  <p>{v.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <div className="apage-cta">
          <div>
            <h2>Dukung karya ini</h2>
            <p>
              Kalau platform ini bermanfaat, kamu bisa trakter lewat Saweria — opsional, tanpa
              paksaan.
            </p>
          </div>
          <a
            className="btn btn-teal"
            href={SITE.saweria}
            target="_blank"
            rel="noopener noreferrer"
          >
            Buka Saweria
          </a>
        </div>

        <div className="apage-cta apage-cta--accent">
          <div>
            <h2>Mau kolaborasi?</h2>
            <p>Langsung WA, atau daftar lewat Gabung.</p>
          </div>
          <div className="apage-cta__actions">
            <a
              className="btn btn-teal"
              href={waLink("Halo Mas'ud, saya ingin kolaborasi.")}
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp
            </a>
            <Link className="btn btn-outline" href="/gabung">
              Gabung
            </Link>
          </div>
        </div>
      </div>
    </AppPage>
  );
}
