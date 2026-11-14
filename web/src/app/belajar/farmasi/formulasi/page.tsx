import { Suspense } from "react";
import { AppPage, AppPageHero } from "@/components/AppPage";
import { AppPageFallback } from "@/components/AppPageFallback";
import { FormulationLab } from "@/components/science/FormulationLab";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata() {
  return pageMetadata({
    title: "Pharmaceutical Formulation Lab",
    description:
      "Lab formulasi edukatif: sediaan, eksipien, granulasi, kompresi tablet, dan kurva disolusi.",
    path: "/belajar/farmasi/formulasi",
  });
}

export default function FormulasiPage() {
  return (
    <Suspense fallback={<AppPageFallback />}>
      <Content />
    </Suspense>
  );
}

function Content() {
  return (
    <AppPage>
      <AppPageHero
        tone="teal"
        eyebrow="Pharmacy · Formulation"
        title="Pharmaceutical Formulation Lab"
        lead="Kenali sediaan, peran eksipien, dan proses tablet hingga disolusi — model edukatif."
      />
      <div className="apage-body sci-molekul-page">
        <FormulationLab />
      </div>
    </AppPage>
  );
}
