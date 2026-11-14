import Link from "next/link";
import { Suspense } from "react";
import { AppPage, AppPageHero } from "@/components/AppPage";
import { AppPageFallback } from "@/components/AppPageFallback";
import { MEDICINE_MODULES } from "@/lib/science/anatomy";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata() {
  return pageMetadata({
    title: "Belajar Kedokteran 3D",
    description:
      "Anatomy Explorer dan laboratorium keterampilan — visualisasi 3D edukatif untuk kedokteran.",
    path: "/belajar/kedokteran",
  });
}

export default function KedokteranPage() {
  return (
    <Suspense fallback={<AppPageFallback />}>
      <KedokteranContent />
    </Suspense>
  );
}

function KedokteranContent() {
  return (
    <AppPage>
      <AppPageHero
        tone="blue"
        eyebrow="Medicine Learning"
        title={
          <>
            Anatomi &amp; keterampilan
            <br />
            dalam visualisasi 3D
          </>
        }
        lead="Mulai dari jantung skematik interaktif. Bukan alat diagnosis — murni pembelajaran."
      >
        <div className="apage-hero__actions">
          <Link className="btn btn-teal" href="/belajar/kedokteran/anatomi">
            Anatomy Explorer
          </Link>
          <Link className="btn btn-outline" href="/belajar/kedokteran/keterampilan">
            Skills Lab
          </Link>
        </div>
      </AppPageHero>

      <div className="apage-body sci-hub">
        <section className="sci-hub__intro">
          <h2>Track kedokteran</h2>
          <p>
            Fondasi sama dengan modul kimia: viewer 3D reusable, hotspot, panel belajar. Model
            awal bersifat <strong>skematik edukatif</strong> (lisensi jelas di kode proyek); aset
            GLB atlas dapat ditambahkan nanti tanpa mengganti arsitektur.
          </p>
        </section>

        <section className="sci-hub__grid" aria-labelledby="sci-med">
          <div className="sci-hub__head">
            <h2 id="sci-med">Modul</h2>
            <p>Sistem kardiovaskular dulu — lalu fisiologi dan keterampilan.</p>
          </div>
          <div className="sci-hub__cards">
            {MEDICINE_MODULES.map((m) =>
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
