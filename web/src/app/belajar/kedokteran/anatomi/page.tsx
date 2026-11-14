import { Suspense } from "react";
import { AppPage, AppPageHero } from "@/components/AppPage";
import { AppPageFallback } from "@/components/AppPageFallback";
import { AnatomyExplorer } from "@/components/science/AnatomyExplorer";
import { pageMetadata } from "@/lib/seo";

type Props = { searchParams: Promise<{ id?: string }> };

export async function generateMetadata() {
  return pageMetadata({
    title: "Anatomy Explorer — Jantung",
    description:
      "Eksplorasi jantung skematik 3D: atrium, ventrikel, aorta, dan pembuluh paru dengan hotspot interaktif.",
    path: "/belajar/kedokteran/anatomi",
  });
}

export default function AnatomiPage({ searchParams }: Props) {
  return (
    <Suspense fallback={<AppPageFallback />}>
      <AnatomiContent searchParams={searchParams} />
    </Suspense>
  );
}

async function AnatomiContent({ searchParams }: Props) {
  const { id } = await searchParams;
  return (
    <AppPage>
      <AppPageHero
        tone="blue"
        eyebrow="Medicine · Anatomy Explorer"
        title="Anatomy Explorer"
        lead="Klik ruang dan pembuluh jantung. Exploded view untuk memisahkan bagian."
      />
      <div className="apage-body sci-molekul-page">
        <AnatomyExplorer initialId={id || "heart"} />
      </div>
    </AppPage>
  );
}
