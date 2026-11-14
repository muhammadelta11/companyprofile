import Link from "next/link";
import { Suspense } from "react";
import { AppPage, AppPageHero } from "@/components/AppPage";
import { AppPageFallback } from "@/components/AppPageFallback";
import { SCIENCE_MODULES } from "@/lib/science/molecules";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata() {
  return pageMetadata({
    title: "Belajar Farmasi 3D",
    description: "Pharmacokinetics ADME, formulasi, dan laboratorium farmasi virtual.",
    path: "/belajar/farmasi",
  });
}

export default function FarmasiPage() {
  return (
    <Suspense fallback={<AppPageFallback />}>
      <FarmasiContent />
    </Suspense>
  );
}

function FarmasiContent() {
  const modules = SCIENCE_MODULES.filter((m) => m.track === "pharmacy");
  return (
    <AppPage>
      <AppPageHero
        tone="teal"
        eyebrow="Pharmacy Learning"
        title={
          <>
            Farmakokinetika &amp;
            <br />
            laboratorium virtual
          </>
        }
        lead="Mulai dari ADME dan kurva konsentrasi–waktu dengan model matematis yang dapat diverifikasi."
      >
        <div className="apage-hero__actions">
          <Link className="btn btn-teal" href="/belajar/farmasi/farmakokinetika">
            Buka ADME Simulator
          </Link>
          <Link className="btn btn-outline" href="/belajar">
            Semua track
          </Link>
        </div>
      </AppPageHero>

      <div className="apage-body sci-hub">
        <section className="sci-hub__grid">
          <div className="sci-hub__head">
            <h2>Modul farmasi</h2>
            <p>Simulasi edukatif — bukan keputusan terapi pasien.</p>
          </div>
          <div className="sci-hub__cards">
            {modules.map((m) =>
              m.status === "soon" ? (
                <article key={m.href} className="sci-card sci-card--soon">
                  <span className="sci-card__badge">Segera</span>
                  <h3>{m.title}</h3>
                  <p>{m.text}</p>
                </article>
              ) : (
                <Link key={m.href} href={m.href} className="sci-card">
                  <span className="sci-card__badge sci-card__badge--ready">Siap dipakai</span>
                  <h3>{m.title}</h3>
                  <p>{m.text}</p>
                  <span className="sci-card__cta">Buka →</span>
                </Link>
              )
            )}
          </div>
        </section>
      </div>
    </AppPage>
  );
}
