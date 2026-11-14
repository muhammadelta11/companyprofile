import { Suspense } from "react";
import { AppPage, AppPageHero } from "@/components/AppPage";
import { AppPageFallback } from "@/components/AppPageFallback";
import { PhysiologyExplorer } from "@/components/science/PhysiologyExplorer";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata() {
  return pageMetadata({
    title: "Physiology Demo — Siklus Jantung",
    description:
      "Simulasi edukatif siklus jantung: diastol, sistol atrium, kontraksi isovolumetrik, ejeksi, dan relaksasi.",
    path: "/belajar/kedokteran/fisiologi",
  });
}

export default function FisiologiPage() {
  return (
    <Suspense fallback={<AppPageFallback />}>
      <FisiologiContent />
    </Suspense>
  );
}

function FisiologiContent() {
  return (
    <AppPage>
      <AppPageHero
        tone="blue"
        eyebrow="Medicine · Physiology"
        title="Physiology Demo"
        lead="Siklus jantung normal — play, pause, dan loncat antar fase pada model skematik."
      />
      <div className="apage-body sci-molekul-page">
        <PhysiologyExplorer />
      </div>
    </AppPage>
  );
}
