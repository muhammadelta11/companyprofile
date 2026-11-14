import { Suspense } from "react";
import { AppPage, AppPageHero } from "@/components/AppPage";
import { AppPageFallback } from "@/components/AppPageFallback";
import { MoleculeExplorer } from "@/components/science/MoleculeExplorer";
import { pageMetadata } from "@/lib/seo";

type Props = { searchParams: Promise<{ id?: string }> };

export async function generateMetadata() {
  return pageMetadata({
    title: "Molecular 3D Explorer",
    description:
      "Eksplorasi struktur molekul 3D interaktif — rotasi, zoom, mode visualisasi, dan info atom.",
    path: "/belajar/kimia/molekul",
  });
}

export default function MolekulPage({ searchParams }: Props) {
  return (
    <Suspense fallback={<AppPageFallback />}>
      <MolekulContent searchParams={searchParams} />
    </Suspense>
  );
}

async function MolekulContent({ searchParams }: Props) {
  const { id } = await searchParams;
  return (
    <AppPage>
      <AppPageHero
        tone="blue"
        eyebrow="Chemistry · Molecular Explorer"
        title="Molecular 3D Explorer"
        lead="Manipulasi model 3D, pilih atom, dan pelajari formula serta massa molar."
      />
      <div className="apage-body sci-molekul-page">
        <MoleculeExplorer initialId={id || "h2o"} />
      </div>
    </AppPage>
  );
}
