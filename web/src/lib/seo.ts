import type { Metadata } from "next";
import { SITE } from "@/data/site";

export const SITE_URL = "https://masudeltamamy.com";

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
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

type PageMetaInput = {
  title: string;
  description?: string | null;
  path: string;
  image?: string | null;
  type?: "website" | "article";
  noIndex?: boolean;
};

/** Metadata konsisten + Open Graph + Twitter + canonical. */
export function pageMetadata({
  title,
  description,
  path,
  image,
  type = "website",
  noIndex = false,
}: PageMetaInput): Metadata {
  const desc =
    plainText(description, 160) ||
    `Platform bisnis ${SITE.brand}: jasa digital, market produk, dan paket wisata.`;
  const url = absoluteUrl(path);
  const ogImage = image || undefined;

  return {
    title,
    description: desc,
    alternates: { canonical: url },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    openGraph: {
      title,
      description: desc,
      url,
      siteName: SITE.brand,
      locale: "id_ID",
      type,
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title,
      description: desc,
      ...(ogImage ? { images: [ogImage] } : {}),
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

export function productJsonLd(input: {
  id: string;
  title: string;
  description?: string | null;
  image?: string | null;
  priceLabel?: string | null;
  kind: string;
  sellerName: string;
}) {
  const desc = plainText(input.description, 300);
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
  if (input.priceLabel) offers.priceSpecification = {
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
    ...(input.image ? { image: [input.image] } : {}),
    brand: { "@type": "Brand", name: SITE.brand },
    offers,
  };
}
