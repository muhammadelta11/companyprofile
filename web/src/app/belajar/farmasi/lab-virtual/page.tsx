import { Suspense } from "react";
import { AppPage, AppPageHero } from "@/components/AppPage";
import { AppPageFallback } from "@/components/AppPageFallback";
import { PharmaVirtualLab } from "@/components/science/PharmaVirtualLab";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata() {
  return pageMetadata({
    title: "Virtual Pharmaceutical Laboratory",
    description:
      "Lab farmasi virtual: timbangan, pipet, spektrofotometer UV-Vis (Beer–Lambert), dan pengenalan HPLC.",
    path: "/belajar/farmasi/lab-virtual",
  });
}

export default function LabVirtualPage() {
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
        eyebrow="Pharmacy · Virtual Lab"
        title="Virtual Pharmaceutical Laboratory"
        lead="Alat praktikum dan eksperimen UV-Vis dengan perhitungan Beer–Lambert yang dapat diverifikasi."
      />
      <div className="apage-body sci-molekul-page">
        <PharmaVirtualLab />
      </div>
    </AppPage>
  );
}
