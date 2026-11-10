import type { Metadata } from "next";
import { SITE } from "@/data/site";

export const SITE_URL = "https://masudeltamamy.com";

/** Gambar default untuk share / Open Graph (banner utama situs). */
export const DEFAULT_OG_IMAGE = "/og-default.jpg?v=2";
/** Dimensi aktual file public/og-default.jpg (bukan tebakan 1200×630). */
export const OG_IMAGE_WIDTH = 1024;
export const OG_IMAGE_HEIGHT = 576;

/** Buang HTML → teks meta/deskripsi. */
export function plainText(html: string | null | undefined, max = 160) {
  if (!html) return "";
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= max) return text;
  return `${text.slice(0, Math.max(1, max - 1)).trimEnd()}…`;
}

export function absoluteUrl(path = "/") {
  if (!path || path === "/") return SITE_URL;
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** URL absolut untuk meta gambar (relatif / absolut / kosong → default). */
export function absoluteImageUrl(src?: string | null, fallback = DEFAULT_OG_IMAGE) {
  const pick = (src && src.trim()) || fallback;
  return absoluteUrl(pick);
}

type PageMetaInput = {
  title: string;
  description?: string | null;
  path: string;
  image?: string | null;
  images?: (string | null | undefined)[];
  type?: "website" | "article";
  noIndex?: boolean;
};

function uniqueImages(primary?: string | null, extras?: (string | null | undefined)[]) {
  const out: string[] = [];
  const push = (v?: string | null) => {
    if (!v?.trim()) return;
    const abs = absoluteUrl(v.trim());
    if (!out.includes(abs)) out.push(abs);
  };
  push(primary);
  for (const e of extras ?? []) push(e);
  if (!out.length) out.push(absoluteUrl(DEFAULT_OG_IMAGE));
  return out;
}

/** Metadata konsisten + Open Graph + Twitter + canonical + SEO gambar. */
export function pageMetadata({
  title,
  description,
  path,
  image,
  images,
  type = "website",
  noIndex = false,
}: PageMetaInput): Metadata {
  const desc =
    plainText(description, 160) ||
    `Platform bisnis ${SITE.brand}: jasa digital, market produk, dan paket wisata.`;
  const url = absoluteUrl(path);
  const ogList = uniqueImages(image, images);
  const ogImages = ogList.map((urlAbs, i) => {
    const isDefault = urlAbs.includes("/og-default.jpg");
    return {
      url: urlAbs,
      secureUrl: urlAbs,
      width: isDefault ? OG_IMAGE_WIDTH : 1200,
      height: isDefault ? OG_IMAGE_HEIGHT : 630,
      alt: i === 0 ? title : `${title} — foto ${i + 1}`,
      type: "image/jpeg" as const,
    };
  });

  return {
    title,
    description: desc,
    alternates: { canonical: url },
    robots: noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
    openGraph: {
      title,
      description: desc,
      url,
      siteName: SITE.brand,
      locale: "id_ID",
      type,
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
      images: ogList,
    },
  };
}

export function jsonLdScript(data: Record<string, unknown> | Record<string, unknown>[]) {
  return {
    __html: JSON.stringify(data).replace(/</g, "\\u003c"),
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.brand,
    url: SITE_URL,
    email: SITE.email,
    telephone: `+${SITE.wa}`,
    logo: absoluteImageUrl("/icons/icon-512.png"),
    image: absoluteImageUrl(DEFAULT_OG_IMAGE),
    address: {
      "@type": "PostalAddress",
      addressLocality: "Ngawi",
      addressRegion: "Jawa Timur",
      addressCountry: "ID",
    },
    sameAs: [SITE.github].filter(Boolean),
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.brand,
    url: SITE_URL,
    inLanguage: "id-ID",
    image: absoluteImageUrl(DEFAULT_OG_IMAGE),
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/market`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

/** Schema gambar untuk galeri / cover (SEO gambar Google). */
export function imageObjectsJsonLd(
  images: (string | null | undefined)[],
  alt: string,
  pagePath: string
) {
  const list: string[] = [];
  for (const src of images) {
    if (!src?.trim()) continue;
    const abs = absoluteUrl(src.trim());
    if (!list.includes(abs)) list.push(abs);
  }
  if (!list.length) list.push(absoluteUrl(DEFAULT_OG_IMAGE));

  return list.map((url, i) => ({
    "@context": "https://schema.org",
    "@type": "ImageObject",
    contentUrl: url,
    url,
    name: i === 0 ? alt : `${alt} — ${i + 1}`,
    caption: alt,
    representativeOfPage: i === 0,
    isPartOf: absoluteUrl(pagePath),
  }));
}

export function productJsonLd(input: {
  id: string;
  title: string;
  description?: string | null;
  image?: string | null;
  images?: (string | null | undefined)[];
  priceLabel?: string | null;
  kind: string;
  sellerName: string;
}) {
  const desc = plainText(input.description, 300);
  const imgs = uniqueImages(input.image, input.images);
  const offers: Record<string, unknown> = {
    "@type": "Offer",
    url: absoluteUrl(`/market/${input.id}`),
    availability: "https://schema.org/InStock",
    seller: {
      "@type": "Organization",
      name: input.sellerName,
    },
  };
  // Harga teks bebas ("Mulai Rp 1,5jt") — jangan paksa angka palsu.
  if (input.priceLabel)
    offers.priceSpecification = {
      "@type": "PriceSpecification",
      description: input.priceLabel,
      priceCurrency: "IDR",
    };

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.title,
    description: desc || input.title,
    category: input.kind === "digital" ? "Digital goods" : "Physical goods",
    image: imgs,
    brand: { "@type": "Brand", name: SITE.brand },
    offers,
  };
}
