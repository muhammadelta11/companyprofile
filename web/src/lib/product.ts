/** Tipe & helper produk yang aman dipakai Server maupun Client Component. */

export type ShippingMode = "pickup" | "area" | "nationwide" | "digital";

export type ProductSeller = {
  id: string;
  full_name: string | null;
  city: string | null;
  shop_name?: string | null;
};

export type ProductItem = {
  id: string;
  title: string;
  kind: "fisik" | "digital";
  badge: string | null;
  price_label: string | null;
  description: string | null;
  image_url: string | null;
  gallery?: string[] | null;
  owner_id: string | null;
  shipping_mode?: ShippingMode | null;
  service_area?: string | null;
  area_lat?: number | null;
  area_lng?: number | null;
  area_radius_km?: number | null;
  /** Mitra penjual (null = Official). */
  owner?: ProductSeller | null;
  /** Jumlah buka halaman detail (klik). */
  view_count?: number;
  created_at?: string | null;
};

export const SHIPPING_OPTIONS: { value: ShippingMode; label: string }[] = [
  { value: "pickup", label: "Ambil di tempat" },
  { value: "area", label: "Kirim area tertentu" },
  { value: "nationwide", label: "Kirim seluruh Indonesia" },
  { value: "digital", label: "Digital / kirim online" },
];

/** Listing milik viewer: mitra = owner_id; official (tanpa owner) = admin. */
export function isOwnMarketListing(
  viewer: { id: string; role?: string } | null | undefined,
  product: { owner_id?: string | null }
) {
  if (!viewer?.id) return false;
  if (product.owner_id) return product.owner_id === viewer.id;
  return viewer.role === "admin";
}

export function shippingLabel(
  mode?: ShippingMode | null,
  area?: string | null,
  kind?: "fisik" | "digital",
  radiusKm?: number | null
) {
  const m = mode ?? (kind === "digital" ? "digital" : "area");
  if (m === "pickup") {
    const zone = area?.trim();
    const r = radiusKm && radiusKm > 0 ? ` (±${radiusKm} km)` : "";
    return zone ? `Ambil di tempat · ${zone}${r}` : "Ambil di tempat";
  }
  if (m === "nationwide") return "Kirim seluruh Indonesia";
  if (m === "digital") return "Digital / online";
  const zone = area?.trim();
  const r = radiusKm && radiusKm > 0 ? ` (±${radiusKm} km)` : "";
  return zone ? `Area: ${zone}${r}` : r ? `Kirim area${r}` : "Kirim area (tanya penjual)";
}

export function hasMapArea(p: {
  area_lat?: number | null;
  area_lng?: number | null;
  area_radius_km?: number | null;
}) {
  return (
    typeof p.area_lat === "number" &&
    typeof p.area_lng === "number" &&
    Number.isFinite(p.area_lat) &&
    Number.isFinite(p.area_lng)
  );
}

/** Label penjual untuk UI market. */
export function sellerLabel(product: Pick<ProductItem, "owner_id" | "owner">) {
  if (!product.owner_id) return "Official Mas'ud El-Tamamy";
  const shop = product.owner?.shop_name?.trim();
  if (shop) return shop;
  const name = product.owner?.full_name?.trim();
  return name || "Mitra terverifikasi";
}

/** Nama etalase publik (shop_name → full_name → fallback). */
export function storeDisplayName(input: {
  kind?: "mitra" | "official";
  shop_name?: string | null;
  full_name?: string | null;
}) {
  const shop = input.shop_name?.trim();
  if (shop) return shop;
  const name = input.full_name?.trim();
  if (name) return name;
  return input.kind === "official" ? "Mas'ud El-Tamamy" : "Mitra terverifikasi";
}

/** URL profil publik penjual. */
export function sellerHref(product: Pick<ProductItem, "owner_id">) {
  if (!product.owner_id) return "/market/penjual/official";
  return `/market/penjual/${product.owner_id}`;
}

export function sellerInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}
