import { AppPage, AppPageHero } from "@/components/AppPage";
import { FeedbackForm } from "@/components/FeedbackForm";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Masukan",
  description: "Kirim masukan, laporkan bug, atau keluhan ke developer Mas'ud El-Tamamy.",
  path: "/masukan",
});

export default function MasukanPage() {
  return (
    <AppPage>
      <AppPageHero
        tone="detail"
        eyebrow="Developer"
        title="Masukan & laporan"
        lead="Bukan untuk order produk. Order tetap lewat Market → WhatsApp penjual."
      />
      <div className="apage-body">
        <FeedbackForm page="/masukan" />
      </div>
    </AppPage>
  );
}
