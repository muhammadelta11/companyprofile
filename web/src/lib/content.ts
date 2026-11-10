import { cacheLife, cacheTag } from "next/cache";
import { publicClient } from "./supabase/public";
import { supabaseReady } from "./supabase/env";
import { PRODUCTS } from "@/data/products";
import { TRIPS } from "@/data/trips";
import { PROJECTS } from "@/data/projects";
import { SERVICES } from "@/data/services";
import type { ProductItem, ProductSeller } from "./product";

export type { ProductItem, ProductSeller } from "./product";
export { sellerLabel } from "./product";

export type TripItem = {
  id: string;
  title: string;
  tag: string | null;
  duration: string | null;
  price_label: string | null;
  summary: string | null;
  image_url: string | null;
  gallery?: string[] | null;
};

export type ProjectItem = {
  id: string;
  title: string;
  category: "web" | "mobile" | "research";
  tag: string | null;
  summary: string | null;
  link: string | null;
  cover_url: string | null;
  gallery?: string[] | null;
};

export type FaqItem = { q: string; a: string; tags: string[] };

export type ServiceItem = {
  id: string;
  title: string;
  blurb: string | null;
  items: string[];
  accent: "teal" | "orange" | "ink";
};

const FALLBACK_PRODUCTS: ProductItem[] = PRODUCTS.filter((p) => p.seller === "own").map(
  (p) => ({
    id: p.id,
    title: p.title,
    kind: p.kind,
    badge: p.badge ?? null,
    price_label: p.priceLabel,
    description: p.blurb,
    image_url: null,
    owner_id: null,
  })
);

const FALLBACK_TRIPS: TripItem[] = TRIPS.map((t) => ({
  id: t.id,
  title: t.title,
  tag: t.tag,
  duration: t.duration,
  price_label: null,
  summary: t.summary,
  image_url: null,
}));

const FALLBACK_PROJECTS: ProjectItem[] = PROJECTS.map((p) => ({
  id: p.id,
  title: p.title,
  category: p.category,
  tag: p.tag,
  summary: p.summary,
  link: p.link ?? null,
  cover_url: p.cover ?? null,
}));

const FALLBACK_SERVICES: ServiceItem[] = SERVICES.map((s) => ({
  id: s.id,
  title: s.title,
  blurb: s.blurb ? `<p>${s.blurb}</p>` : null,
  items: s.items,
  accent: s.accent,
}));

export async function getProducts(): Promise<ProductItem[]> {
  "use cache";
  cacheTag("products");
  cacheLife("minutes");
  if (!supabaseReady) return FALLBACK_PRODUCTS;

  const withOwner =
    "id, title, kind, badge, price_label, description, image_url, gallery, owner_id, shipping_mode, service_area, view_count, created_at, owner:profiles!products_owner_id_fkey(id, full_name, city)";
  const withOwnerNoViews =
    "id, title, kind, badge, price_label, description, image_url, gallery, owner_id, shipping_mode, service_area, created_at, owner:profiles!products_owner_id_fkey(id, full_name, city)";
  const withOwnerNoGallery =
    "id, title, kind, badge, price_label, description, image_url, owner_id, shipping_mode, service_area, owner:profiles!products_owner_id_fkey(id, full_name, city)";
  const plain =
    "id, title, kind, badge, price_label, description, image_url, gallery, owner_id, shipping_mode, service_area";
  const plainLegacy =
    "id, title, kind, badge, price_label, description, image_url, gallery, owner_id";

  const first = await publicClient()
    .from("products")
    .select(withOwner)
    .eq("status", "approved")
    .order("view_count", { ascending: false })
    .order("created_at", { ascending: false });

  if (!first.error && first.data) {
    return normalizeProducts(first.data);
  }

  const second = await publicClient()
    .from("products")
    .select(withOwnerNoViews)
    .eq("status", "approved")
    .order("created_at", { ascending: false });
  if (!second.error && second.data) {
    return normalizeProducts(second.data);
  }

  const third = await publicClient()
    .from("products")
    .select(withOwnerNoGallery)
    .eq("status", "approved")
    .order("sort")
    .order("created_at", { ascending: false });
  if (!third.error && third.data) {
    return normalizeProducts(third.data);
  }

  const fourth = await publicClient()
    .from("products")
    .select(plain)
    .eq("status", "approved")
    .order("sort")
    .order("created_at", { ascending: false });
  if (!fourth.error && fourth.data) return normalizeProducts(fourth.data);

  const legacy = await publicClient()
    .from("products")
    .select(plainLegacy)
    .eq("status", "approved")
    .order("sort")
    .order("created_at", { ascending: false });
  if (legacy.error || !legacy.data) return FALLBACK_PRODUCTS;
  return normalizeProducts(legacy.data);
}

function normalizeProducts(rows: unknown[]): ProductItem[] {
  return (rows as Array<Record<string, unknown>>).map((row) => {
    const rawOwner = row.owner;
    let owner: ProductSeller | null = null;
    if (rawOwner && typeof rawOwner === "object" && !Array.isArray(rawOwner)) {
      const o = rawOwner as Record<string, unknown>;
      owner = {
        id: String(o.id ?? ""),
        full_name: typeof o.full_name === "string" ? o.full_name : null,
        city: typeof o.city === "string" ? o.city : null,
      };
      if (!owner.id) owner = null;
    }
    const shippingRaw = row.shipping_mode;
    const shipping_mode =
      shippingRaw === "pickup" ||
      shippingRaw === "area" ||
      shippingRaw === "nationwide" ||
      shippingRaw === "digital"
        ? shippingRaw
        : null;

    const views = Number(row.view_count);
    return {
      id: String(row.id),
      title: String(row.title ?? ""),
      kind: row.kind === "digital" ? "digital" : "fisik",
      badge: typeof row.badge === "string" ? row.badge : null,
      price_label: typeof row.price_label === "string" ? row.price_label : null,
      description: typeof row.description === "string" ? row.description : null,
      image_url: typeof row.image_url === "string" ? row.image_url : null,
      gallery: Array.isArray(row.gallery) ? (row.gallery as string[]) : null,
      owner_id: typeof row.owner_id === "string" ? row.owner_id : null,
      shipping_mode,
      service_area: typeof row.service_area === "string" ? row.service_area : null,
      owner,
      view_count: Number.isFinite(views) ? Math.max(0, Math.floor(views)) : 0,
      created_at: typeof row.created_at === "string" ? row.created_at : null,
    };
  });
}

export async function getTrips(): Promise<TripItem[]> {
  "use cache";
  cacheTag("trips");
  cacheLife("minutes");
  if (!supabaseReady) return FALLBACK_TRIPS;
  const { data, error } = await publicClient()
    .from("trips")
    .select("id, title, tag, duration, price_label, summary, image_url, gallery")
    .eq("published", true)
    .order("sort");
  if (error) {
    const retry = await publicClient()
      .from("trips")
      .select("id, title, tag, duration, price_label, summary, image_url")
      .eq("published", true)
      .order("sort");
    if (retry.error) return FALLBACK_TRIPS;
    return retry.data as TripItem[];
  }
  return data as TripItem[];
}

export async function getProjects(): Promise<ProjectItem[]> {
  "use cache";
  cacheTag("projects");
  cacheLife("minutes");
  if (!supabaseReady) return FALLBACK_PROJECTS;
  const { data, error } = await publicClient()
    .from("projects")
    .select("id, title, category, tag, summary, link, cover_url, gallery")
    .eq("published", true)
    .order("sort");
  if (error) {
    const retry = await publicClient()
      .from("projects")
      .select("id, title, category, tag, summary, link, cover_url")
      .eq("published", true)
      .order("sort");
    if (retry.error) return FALLBACK_PROJECTS;
    return retry.data as ProjectItem[];
  }
  return data as ProjectItem[];
}

export async function getServices(): Promise<ServiceItem[]> {
  "use cache";
  cacheTag("services");
  cacheLife("minutes");
  if (!supabaseReady) return FALLBACK_SERVICES;
  const { data, error } = await publicClient()
    .from("services")
    .select("id, title, blurb, items, accent")
    .eq("published", true)
    .order("sort");
  if (error) return FALLBACK_SERVICES;
  return (data as ServiceItem[]).map((s) => ({
    ...s,
    items: Array.isArray(s.items) ? s.items : [],
    accent: (["teal", "orange", "ink"] as const).includes(s.accent) ? s.accent : "teal",
  }));
}

export async function getProduct(id: string): Promise<ProductItem | null> {
  const items = await getProducts();
  return items.find((p) => p.id === id) ?? null;
}

export type PublicSeller = ProductSeller & {
  kind: "mitra" | "official";
  productCount: number;
};

/** Profil publik toko / mitra untuk halaman /market/penjual/[id]. */
export async function getPublicSeller(id: string): Promise<PublicSeller | null> {
  const products = await getProducts();

  if (id === "official") {
    const count = products.filter((p) => !p.owner_id).length;
    if (!count) {
      return {
        id: "official",
        full_name: "Mas'ud El-Tamamy",
        city: null,
        kind: "official",
        productCount: 0,
      };
    }
    return {
      id: "official",
      full_name: "Mas'ud El-Tamamy",
      city: null,
      kind: "official",
      productCount: count,
    };
  }

  if (!isUuid(id)) return null;
  const list = products.filter((p) => p.owner_id === id);
  if (!list.length) return null;

  const fromJoin = list.find((p) => p.owner)?.owner ?? null;
  return {
    id,
    full_name: fromJoin?.full_name ?? null,
    city: fromJoin?.city ?? null,
    kind: "mitra",
    productCount: list.length,
  };
}

export async function getProductsBySeller(id: string): Promise<ProductItem[]> {
  const products = await getProducts();
  if (id === "official") return products.filter((p) => !p.owner_id);
  return products.filter((p) => p.owner_id === id);
}

export async function getTrip(id: string): Promise<TripItem | null> {
  const items = await getTrips();
  return items.find((t) => t.id === id) ?? null;
}

export async function getProject(id: string): Promise<ProjectItem | null> {
  const items = await getProjects();
  return items.find((p) => p.id === id) ?? null;
}

/** FAQ tambahan yang ditulis admin dari dashboard. */
export async function getExtraFaqs(): Promise<FaqItem[]> {
  "use cache";
  cacheTag("faqs");
  cacheLife("minutes");
  if (!supabaseReady) return [];
  const { data, error } = await publicClient()
    .from("faqs")
    .select("question, answer, tags")
    .eq("published", true);
  if (error || !data) return [];
  return data.map((f) => ({ q: f.question, a: f.answer, tags: f.tags ?? [] }));
}

export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
