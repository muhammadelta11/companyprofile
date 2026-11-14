import { Suspense } from "react";
import { AppPage, AppPageHero } from "@/components/AppPage";
import { AppPageFallback } from "@/components/AppPageFallback";
import { PharmacokineticsSimulator } from "@/components/science/PharmacokineticsSimulator";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata() {
  return pageMetadata({
    title: "Pharmacokinetics Simulator — ADME",
    description:
      "Simulasi farmakokinetika edukatif: ADME, kurva konsentrasi–waktu, model 1-kompartemen oral & IV.",
    path: "/belajar/farmasi/farmakokinetika",
  });
}

export default function FarmakokinetikaPage() {
  return (
    <Suspense fallback={<AppPageFallback />}>
      <PkContent />
    </Suspense>
  );
}

function PkContent() {
  return (
    <AppPage>
      <AppPageHero
        tone="teal"
        eyebrow="Pharmacy · Pharmacokinetics"
        title="Pharmacokinetics Simulator"
        lead="Geser parameter dosis, V, Cl, dan lihat ADME serta kurva C–t model satu kompartemen."
      />
      <div className="apage-body sci-molekul-page">
        <PharmacokineticsSimulator />
      </div>
    </AppPage>
  );
}
