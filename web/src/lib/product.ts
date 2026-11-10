/** Tipe & helper produk yang aman dipakai Server maupun Client Component. */

export type ShippingMode = "pickup" | "area" | "nationwide" | "digital";

export type ProductSeller = {
  id: string;
  full_name: string | null;
  city: string | null;
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

export function shippingLabel(
  mode?: ShippingMode | null,
  area?: string | null,
  kind?: "fisik" | "digital"
) {
  const m = mode ?? (kind === "digital" ? "digital" : "area");
  if (m === "pickup") return "Ambil di tempat";
  if (m === "nationwide") return "Kirim seluruh Indonesia";
  if (m === "digital") return "Digital / online";
  const zone = area?.trim();
  return zone ? `Area: ${zone}` : "Kirim area (tanya penjual)";
}

/** Label penjual untuk UI market. */
export function sellerLabel(product: Pick<ProductItem, "owner_id" | "owner">) {
  if (!product.owner_id) return "Official Mas'ud El-Tamamy";
  const name = product.owner?.full_name?.trim();
  return name || "Mitra terverifikasi";
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
