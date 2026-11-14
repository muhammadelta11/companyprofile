import { Suspense } from "react";
import { AppPage, AppPageHero } from "@/components/AppPage";
import { AppPageFallback } from "@/components/AppPageFallback";
import { ReactionSimulator } from "@/components/science/ReactionSimulator";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata() {
  return pageMetadata({
    title: "Chemical Reaction Simulator",
    description:
      "Simulasi reaksi kimia edukatif: persamaan setara, stoikiometri, reaktan pembatas, dan visualisasi konseptual 3D.",
    path: "/belajar/kimia/reaksi",
  });
}

export default function ReaksiPage() {
  return (
    <Suspense fallback={<AppPageFallback />}>
      <ReaksiContent />
    </Suspense>
  );
}

function ReaksiContent() {
  return (
    <AppPage>
      <AppPageHero
        tone="teal"
        eyebrow="Chemistry · Reaction Simulator"
        title="Chemical Reaction Simulator"
        lead="Persamaan setara, hitung stoikiometri, dan lihat perubahan reaktan → produk secara konseptual."
      />
      <div className="apage-body sci-molekul-page">
        <ReactionSimulator />
      </div>
    </AppPage>
  );
}
