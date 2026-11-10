import Link from "next/link";
import { Suspense } from "react";
import { AppPage, AppPageHero } from "@/components/AppPage";
import { AppPageFallback } from "@/components/AppPageFallback";
import { MarketCatalog } from "@/components/market/MarketCatalog";
import { getProducts } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import { getHeroImage } from "@/lib/site-settings";

export const metadata = pageMetadata({
  title: "Market",
  description:
    "Katalog produk fisik & digital Mas'ud El-Tamamy dan mitra. Urut unggulan, terbaru, atau terpopuler — order via WhatsApp tanpa wajib login.",
  path: "/market",
});

export default function MarketPage() {
  return (
    <Suspense fallback={<AppPageFallback />}>
      <MarketContent />
    </Suspense>
  );
}

async function MarketContent() {
  const [products, heroImage] = await Promise.all([getProducts(), getHeroImage("market")]);

  return (
    <AppPage>
      <AppPageHero
        tone="market"
        imageUrl={heroImage}
        eyebrow="Market"
        title="Belanja & jual di satu etalase"
        lead="Produk official dan mitra. Detail jelas, order dikonfirmasi via WhatsApp."
      >
        <div className="apage-hero__stats" aria-label="Ringkasan market">
          <div>
            <strong>{products.length}</strong>
            <span>Produk</span>
          </div>
          <div>
            <strong>WA</strong>
            <span>Order aman</span>
          </div>
          <div>
            <strong>Mitra</strong>
            <span>Bisa daftar</span>
          </div>
        </div>
      </AppPageHero>

      <div className="apage-body">
        <MarketCatalog products={products} />

        <div className="apage-cta">
          <div>
            <h2>Punya produk untuk dijual?</h2>
            <p>Daftar mitra, upload dari dashboard, tampil setelah diverifikasi.</p>
          </div>
          <Link className="btn btn-teal" href="/gabung">
            Jadi mitra
          </Link>
        </div>
      </div>
    </AppPage>
  );
}
