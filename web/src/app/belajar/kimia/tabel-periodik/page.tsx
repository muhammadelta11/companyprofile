import { Suspense } from "react";
import { AppPage, AppPageHero } from "@/components/AppPage";
import { AppPageFallback } from "@/components/AppPageFallback";
import { PeriodicTable } from "@/components/science/PeriodicTable";
import { pageMetadata } from "@/lib/seo";

type Props = { searchParams: Promise<{ z?: string }> };

export async function generateMetadata() {
  return pageMetadata({
    title: "Tabel Periodik Interaktif",
    description:
      "Tabel periodik unsur interaktif — nomor atom, massa, golongan, periode, dan konfigurasi elektron.",
    path: "/belajar/kimia/tabel-periodik",
  });
}

export default function TabelPeriodikPage({ searchParams }: Props) {
  return (
    <Suspense fallback={<AppPageFallback />}>
      <TabelContent searchParams={searchParams} />
    </Suspense>
  );
}

async function TabelContent({ searchParams }: Props) {
  const { z } = await searchParams;
  const initialZ = z ? Number.parseInt(z, 10) : 1;
  return (
    <AppPage>
      <AppPageHero
        tone="teal"
        eyebrow="Chemistry · Periodic Table"
        title="Tabel Periodik Interaktif"
        lead="Jelajahi 118 unsur: cari, filter kategori, dan baca konfigurasi elektron."
      />
      <div className="apage-body sci-ptable-page">
        <PeriodicTable initialZ={Number.isFinite(initialZ) && initialZ > 0 ? initialZ : 1} />
      </div>
    </AppPage>
  );
}
