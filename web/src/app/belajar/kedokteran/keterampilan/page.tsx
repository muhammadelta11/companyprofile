import { Suspense } from "react";
import { AppPage, AppPageHero } from "@/components/AppPage";
import { AppPageFallback } from "@/components/AppPageFallback";
import { ClinicalSkillsLab } from "@/components/science/ClinicalSkillsLab";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata() {
  return pageMetadata({
    title: "Clinical Skills Lab — Auskultasi Jantung",
    description:
      "Praktikum virtual edukatif: landmark auskultasi A–P–T–M, prosedur berlangkah, dan kuis singkat.",
    path: "/belajar/kedokteran/keterampilan",
  });
}

export default function KeterampilanPage() {
  return (
    <Suspense fallback={<AppPageFallback />}>
      <KeterampilanContent />
    </Suspense>
  );
}

function KeterampilanContent() {
  return (
    <AppPage>
      <AppPageHero
        tone="blue"
        eyebrow="Medicine · Clinical Skills"
        title="Clinical Skills Lab"
        lead="Auskultasi jantung edukatif — briefing, langkah interaktif, lalu evaluasi singkat."
      />
      <div className="apage-body sci-molekul-page">
        <ClinicalSkillsLab />
      </div>
    </AppPage>
  );
}
