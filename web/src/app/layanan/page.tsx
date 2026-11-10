import Link from "next/link";
import { Suspense } from "react";
import { AppPage, AppPageHero } from "@/components/AppPage";
import { AppPageFallback } from "@/components/AppPageFallback";
import { ShareBar } from "@/components/ShareBar";
import { htmlToPlain } from "@/lib/html";
import { getServices } from "@/lib/content";
import { getHeroImage } from "@/lib/site-settings";
import { waLink } from "@/data/site";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata() {
  const hero = await getHeroImage("layanan");
  return pageMetadata({
    title: "Layanan",
    description: "Jasa web & sistem, riset, market, dan wisata dari Mas'ud El-Tamamy.",
    path: "/layanan",
    image: hero,
  });
}

export default function LayananPage() {
  return (
    <Suspense fallback={<AppPageFallback />}>
      <LayananContent />
    </Suspense>
  );
}

async function LayananContent() {
  const [services, heroImage] = await Promise.all([getServices(), getHeroImage("layanan")]);

  return (
    <AppPage>
      <AppPageHero
        tone="layanan"
        imageUrl={heroImage}
        eyebrow="Layanan"
        title="Empat jalur, satu ekosistem"
        lead="Pilih jalur — atau tanya Delta untuk rekomendasi cepat."
      />

      <div className="apage-body">
        <div className="apage-share">
          <ShareBar
            title="Layanan Mas'ud El-Tamamy"
            path="/layanan"
            text="Cek layanan digital, market, dan wisata Mas'ud El-Tamamy"
          />
        </div>
        <div className="sv-grid">
          {services.map((s, i) => (
            <article key={s.id} className={`sv-tile sv-tile--${s.accent}`}>
              <span className="sv-tile__index" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h2>{s.title}</h2>
              <p>{htmlToPlain(s.blurb, 72)}</p>
              {s.items.length ? <small>{s.items.length} cakupan</small> : null}
            </article>
          ))}
        </div>

        <div className="apage-cta">
          <div>
            <h2>Siap brief proyek?</h2>
            <p>Ceritakan kebutuhanmu — quote via WhatsApp.</p>
          </div>
          <div className="apage-cta__actions">
            <a
              className="btn btn-teal"
              href={waLink("Halo, saya butuh jasa web/sistem dari Mas'ud El-Tamamy.")}
              target="_blank"
              rel="noopener noreferrer"
            >
              Minta quote WA
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
