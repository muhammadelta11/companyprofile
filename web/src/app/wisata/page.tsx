import { Suspense } from "react";
import { AppPage, AppPageHero } from "@/components/AppPage";
import { AppPageFallback } from "@/components/AppPageFallback";
import { ShareBar } from "@/components/ShareBar";
import { WisataCatalog } from "@/components/wisata/WisataCatalog";
import { getTrips } from "@/lib/content";
import { getHeroImage } from "@/lib/site-settings";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata() {
  const hero = await getHeroImage("wisata");
  return pageMetadata({
    title: "Wisata",
    description:
      "Katalog paket wisata Mbarep Tour — studi tour, gathering, ziarah, dan custom rute.",
    path: "/wisata",
    image: hero,
  });
}

export default function WisataPage() {
  return (
    <Suspense fallback={<AppPageFallback />}>
      <WisataContent />
    </Suspense>
  );
}

async function WisataContent() {
  const [trips, heroImage] = await Promise.all([getTrips(), getHeroImage("wisata")]);

  return (
    <AppPage>
      <AppPageHero
        tone="wisata"
        imageUrl={heroImage}
        eyebrow="Mbarep Tour"
        title="Paket siap jalan"
        lead="Pilih paket — detail & custom rute di halaman masing-masing."
      />

      <div className="apage-body">
        <div className="apage-share">
          <ShareBar
            title="Paket Wisata Mbarep Tour"
            path="/wisata"
            text="Cek paket wisata Mbarep Tour bersama Mas'ud El-Tamamy"
          />
        </div>
        <WisataCatalog trips={trips} />

        <div className="apage-cta">
          <div>
            <h2>Butuh custom rute?</h2>
            <p>Peserta, destinasi, dan jadwal bisa disesuaikan.</p>
          </div>
          <a
            className="btn btn-outline"
            href="https://mbareptour.id"
            target="_blank"
            rel="noopener noreferrer"
          >
            mbareptour.id
          </a>
        </div>
      </div>
    </AppPage>
  );
}
