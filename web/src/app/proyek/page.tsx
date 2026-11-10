import { Suspense } from "react";
import { AppPage, AppPageHero } from "@/components/AppPage";
import { AppPageFallback } from "@/components/AppPageFallback";
import { ProjectGallery } from "@/components/proyek/ProjectGallery";
import { getProjects } from "@/lib/content";
import { getHeroImage } from "@/lib/site-settings";

import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Proyek",
  description: "Portfolio web, mobile, security, dan riset Mas'ud El-Tamamy.",
  path: "/proyek",
});

export default function ProyekPage() {
  return (
    <Suspense fallback={<AppPageFallback />}>
      <ProyekContent />
    </Suspense>
  );
}

async function ProyekContent() {
  const [projects, heroImage] = await Promise.all([getProjects(), getHeroImage("proyek")]);

  return (
    <AppPage>
      <AppPageHero
        tone="proyek"
        imageUrl={heroImage}
        eyebrow="Portfolio"
        title="Bukti kerja, bukan sekadar janji"
        lead="Web, mobile, security, dan riset — cuplikan karya yang sudah jalan."
      />
      <div className="apage-body">
        <ProjectGallery projects={projects} />
      </div>
    </AppPage>
  );
}
