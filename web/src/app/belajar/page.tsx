import Link from "next/link";
import { Suspense } from "react";
import { AppPage, AppPageHero } from "@/components/AppPage";
import { AppPageFallback } from "@/components/AppPageFallback";
import { MEDICINE_MODULES } from "@/lib/science/anatomy";
import { SCIENCE_MODULES } from "@/lib/science/molecules";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata() {
  return pageMetadata({
    title: "Belajar Sains 3D",
    description:
      "Interactive Science Learning & Virtual Lab — Kimia, Farmasi, dan Kedokteran berbasis 3D.",
    path: "/belajar",
  });
}

export default function BelajarPage() {
  return (
    <Suspense fallback={<AppPageFallback />}>
      <BelajarContent />
    </Suspense>
  );
}

function BelajarContent() {
  const chemistry = SCIENCE_MODULES.filter((m) => m.track === "chemistry");
  const pharmacy = SCIENCE_MODULES.filter((m) => m.track === "pharmacy");
  const medicine = MEDICINE_MODULES;

  return (
    <AppPage>
      <AppPageHero
        tone="teal"
        eyebrow="Interactive Science Learning"
        title={
          <>
            Belajar Kimia, Farmasi
            <br />
            &amp; Kedokteran 3D
          </>
        }
        lead="Putar molekul, jelajahi unsur, dan eksplorasi anatomi — langsung di browser."
      >
        <div className="apage-hero__actions">
          <Link className="btn btn-teal" href="/belajar/kimia/reaksi">
            Reaction Simulator
          </Link>
          <Link className="btn btn-outline" href="/belajar/kimia/molekul">
            Molecular Explorer
          </Link>
        </div>
      </AppPageHero>

      <div className="apage-body sci-hub">
        <section className="sci-hub__intro">
          <h2>Fondasi modul</h2>
          <p>
            Terintegrasi ke situs existing. Viewer 3D reusable dipakai bersama kimia dan kedokteran.
            Konten skematik berlisensi jelas; aset GLB atlas bisa ditambah kemudian.
          </p>
        </section>

        <section className="sci-hub__grid" aria-labelledby="sci-chem">
          <div className="sci-hub__head">
            <h2 id="sci-chem">Chemistry Learning</h2>
            <p>Struktur, unsur, dan reaksi — visual &amp; interaktif.</p>
          </div>
          <div className="sci-hub__cards">
            {chemistry.map((m) => (
              <ModuleCard key={m.href} {...m} />
            ))}
          </div>
        </section>

        <section className="sci-hub__grid" aria-labelledby="sci-med">
          <div className="sci-hub__head">
            <h2 id="sci-med">Medicine Learning</h2>
            <p>Anatomi, fisiologi edukatif, dan keterampilan.</p>
          </div>
          <div className="sci-hub__cards">
            {medicine.map((m) => (
              <ModuleCard key={m.href} {...m} />
            ))}
          </div>
        </section>

        <section className="sci-hub__grid" aria-labelledby="sci-pharm">
          <div className="sci-hub__head">
            <h2 id="sci-pharm">Pharmacy Learning</h2>
            <p>ADME, formulasi, dan laboratorium virtual.</p>
          </div>
          <div className="sci-hub__cards">
            {pharmacy.map((m) => (
              <ModuleCard key={m.href} {...m} />
            ))}
          </div>
        </section>
      </div>
    </AppPage>
  );
}

function ModuleCard({
  href,
  title,
  text,
  status,
}: {
  href: string;
  title: string;
  text: string;
  status: "ready" | "soon";
}) {
  if (status === "soon") {
    return (
      <article className="sci-card sci-card--soon">
        <span className="sci-card__badge">Segera</span>
        <h3>{title}</h3>
        <p>{text}</p>
      </article>
    );
  }
  return (
    <Link href={href} className="sci-card">
      <span className="sci-card__badge sci-card__badge--ready">Siap dipakai</span>
      <h3>{title}</h3>
      <p>{text}</p>
      <span className="sci-card__cta">Buka →</span>
    </Link>
  );
}
