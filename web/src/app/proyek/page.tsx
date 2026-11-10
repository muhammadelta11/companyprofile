import { Suspense } from "react";
import { AppPage, AppPageHero } from "@/components/AppPage";
import { AppPageFallback } from "@/components/AppPageFallback";
import { ProjectGallery } from "@/components/proyek/ProjectGallery";
import { ShareBar } from "@/components/ShareBar";
import { getProjects } from "@/lib/content";
import { getHeroImage } from "@/lib/site-settings";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata() {
  const hero = await getHeroImage("proyek");
  return pageMetadata({
    title: "Proyek",
    description: "Portfolio web, mobile, security, dan riset Mas'ud El-Tamamy.",
    path: "/proyek",
    image: hero,
  });
}

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
        <div className="apage-share">
          <ShareBar
            title="Portfolio Proyek Mas'ud El-Tamamy"
            path="/proyek"
            text="Lihat portfolio web, mobile, dan riset Mas'ud El-Tamamy"
          />
        </div>
        <ProjectGallery projects={projects} />
      </div>
    </AppPage>
  );
}
