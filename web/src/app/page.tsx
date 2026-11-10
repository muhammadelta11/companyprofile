import { AppHero } from "@/components/home/AppHero";
import { QuickActions } from "@/components/home/QuickActions";
import { HomeRails } from "@/components/home/HomeRails";
import { getProducts, getProjects, getTrips } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Mas'ud El-Tamamy — Digital · Market · Wisata",
  description:
    "Platform bisnis Mas'ud El-Tamamy: jasa digital, market produk, dan paket wisata. Order & konsultasi via WhatsApp, dibantu Delta AI.",
  path: "/",
});

export default async function HomePage() {
  const [products, trips, projects] = await Promise.all([
    getProducts(),
    getTrips(),
    getProjects(),
  ]);

  return (
    <div className="mhome">
      <div className="mhome__shell">
        <AppHero />
        <QuickActions />
        <HomeRails
          products={products.slice(0, 6)}
          trips={trips.slice(0, 6)}
          projects={projects.filter((p) => p.cover_url).slice(0, 5)}
        />
      </div>
    </div>
  );
}
