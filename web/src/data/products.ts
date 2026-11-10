export type Product = {
  id: string;
  title: string;
  kind: "fisik" | "digital";
  seller: "own" | "mitra";
  priceLabel: string;
  blurb: string;
  badge?: string;
};

/** Seed Market — order dikonfirmasi via WA */
export const PRODUCTS: Product[] = [
  {
    id: "svc-landing",
    title: "Paket Landing Page Bisnis",
    kind: "digital",
    seller: "own",
    priceLabel: "Mulai Rp 1,5jt",
    blurb: "Landing page cepat, mobile-first, siap iklan & WhatsApp CTA.",
    badge: "Jasa",
  },
  {
    id: "svc-company",
    title: "Company Profile Website",
    kind: "digital",
    seller: "own",
    priceLabel: "Custom quote",
    blurb: "Website perusahaan lengkap: profil, layanan, galeri, kontak.",
    badge: "Jasa",
  },
  {
    id: "dig-template",
    title: "Template UI Starter Pack",
    kind: "digital",
    seller: "own",
    priceLabel: "Hubungi WA",
    blurb: "Paket komponen UI siap pakai untuk UMKM & organisasi.",
    badge: "Digital",
  },
  {
    id: "phys-placeholder",
    title: "Produk Reseller (segera)",
    kind: "fisik",
    seller: "own",
    priceLabel: "Segera",
    blurb: "Slot produk fisik reseller — akan diisi katalog nyata.",
    badge: "Fisik",
  },
  {
    id: "mitra-slot",
    title: "Buka listing mitra",
    kind: "digital",
    seller: "mitra",
    priceLabel: "Gratis daftar",
    blurb: "Punya produk? Daftar jadi penjual/mitra di Market Mas'ud El-Tamamy.",
    badge: "Mitra",
  },
];
