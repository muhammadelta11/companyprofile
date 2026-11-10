import type { MetadataRoute } from "next";
import { getProducts, getProjects, getTrips } from "@/lib/content";
import { absoluteUrl } from "@/lib/seo";

const STATIC: { path: string; changeFrequency: MetadataRoute.Sitemap[0]["changeFrequency"]; priority: number }[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/market", changeFrequency: "daily", priority: 0.95 },
  { path: "/layanan", changeFrequency: "monthly", priority: 0.85 },
  { path: "/wisata", changeFrequency: "weekly", priority: 0.85 },
  { path: "/proyek", changeFrequency: "monthly", priority: 0.7 },
  { path: "/tentang", changeFrequency: "monthly", priority: 0.7 },
  { path: "/gabung", changeFrequency: "monthly", priority: 0.65 },
  { path: "/masukan", changeFrequency: "yearly", priority: 0.3 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticEntries: MetadataRoute.Sitemap = STATIC.map((s) => ({
    url: absoluteUrl(s.path),
    lastModified: now,
    changeFrequency: s.changeFrequency,
    priority: s.priority,
  }));

  let products: Awaited<ReturnType<typeof getProducts>> = [];
  let trips: Awaited<ReturnType<typeof getTrips>> = [];
  let projects: Awaited<ReturnType<typeof getProjects>> = [];
  try {
    [products, trips, projects] = await Promise.all([
      getProducts(),
      getTrips(),
      getProjects(),
    ]);
  } catch {
    // Sitemap tetap valid meski DB gagal.
  }

  const sellerIds = new Set<string>();
  for (const p of products) {
    sellerIds.add(p.owner_id || "official");
  }

  const productEntries: MetadataRoute.Sitemap = products.map((p) => ({
    url: absoluteUrl(`/market/${p.id}`),
    lastModified: p.created_at ? new Date(p.created_at) : now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const sellerEntries: MetadataRoute.Sitemap = [...sellerIds].map((id) => ({
    url: absoluteUrl(`/market/penjual/${id}`),
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.55,
  }));

  const tripEntries: MetadataRoute.Sitemap = trips.map((t) => ({
    url: absoluteUrl(`/wisata/${t.id}`),
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.75,
  }));

  const projectEntries: MetadataRoute.Sitemap = projects.map((p) => ({
    url: absoluteUrl(`/proyek/${p.id}`),
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.65,
  }));

  return [
    ...staticEntries,
    ...productEntries,
    ...sellerEntries,
    ...tripEntries,
    ...projectEntries,
  ];
}
