import type { Metadata } from "next";
import { SITE } from "@/data/site";
import type { ShippingMode } from "@/lib/product";

export const SITE_URL = "https://masudeltamamy.com";
const RETURN_POLICY_ID = `${SITE_URL}/#merchant-return-policy`;

/** Ambil angka IDR dari label bebas. Contoh: "Rp 25.000", "Mulai 1,5jt", "50rb". */
export function parseIdrPrice(label?: string | null): number | null {
  if (!label?.trim()) return null;
  const lower = label.trim().toLowerCase().replace(/\s+/g, " ");

  const jt = lower.match(/(\d+(?:[.,]\d+)?)\s*(?:jt|juta)\b/);
  if (jt) {
    const n = Number(jt[1].replace(",", "."));
    if (Number.isFinite(n) && n > 0) return Math.round(n * 1_000_000);
  }
  const rb = lower.match(/(\d+(?:[.,]\d+)?)\s*(?:rb|ribu)\b/);
  if (rb) {
    const n = Number(rb[1].replace(",", "."));
    if (Number.isFinite(n) && n > 0) return Math.round(n * 1_000);
  }

  const match = label.replace(/rp\.?/gi, "").replace(/idr/gi, "").match(/(\d[\d.,]*)/);
  if (!match) return null;
  let token = match[1];
  if (token.includes(",") && token.includes(".")) {
    token = token.replace(/\./g, "").replace(",", ".");
  } else if (token.includes(",")) {
    const parts = token.split(",");
    token =
      parts.length === 2 && parts[1].length <= 2
        ? `${parts[0].replace(/\./g, "")}.${parts[1]}`
        : token.replace(/,/g, "");
  } else if (token.includes(".")) {
    const parts = token.split(".");
    if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) {
      token = token.replace(/\./g, "");
    }
  }
  const value = Number(token);
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.round(value);
}

function merchantReturnPolicyGlobal() {
  return {
    "@type": "MerchantReturnPolicy",
    "@id": RETURN_POLICY_ID,
    name: "Kebijakan pengembalian Market",
    applicableCountry: "ID",
    returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
    merchantReturnDays: 7,
    returnMethod: "https://schema.org/ReturnByMail",
    returnFees: "https://schema.org/ReturnFeesCustomerResponsibility",
  };
}

function offerReturnPolicy(kind: string) {
  if (kind === "digital") {
    return {
      "@type": "MerchantReturnPolicy",
      applicableCountry: "ID",
      returnPolicyCategory: "https://schema.org/MerchantReturnNotPermitted",
    };
  }
  return { "@id": RETURN_POLICY_ID };
}

function offerShippingDetails(mode?: ShippingMode | null, kind?: string) {
  const m = mode ?? (kind === "digital" ? "digital" : null);
  // Hanya mode dengan ongkir pasti (0). Area/nasional: ongkir via WA — jangan klaim gratis.
  if (m !== "digital" && m !== "pickup") return null;
  return {
    "@type": "OfferShippingDetails",
    shippingDestination: {
      "@type": "DefinedRegion",
      addressCountry: "ID",
    },
    shippingRate: {
      "@type": "MonetaryAmount",
      value: 0,
      currency: "IDR",
    },
    deliveryTime: {
      "@type": "ShippingDeliveryTime",
      handlingTime: {
        "@type": "QuantitativeValue",
        minValue: 0,
        maxValue: m === "digital" ? 1 : 0,
        unitCode: "DAY",
      },
      transitTime: {
        "@type": "QuantitativeValue",
        minValue: 0,
        maxValue: 0,
        unitCode: "DAY",
      },
    },
  };
}

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
    hasMerchantReturnPolicy: merchantReturnPolicyGlobal(),
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
  shippingMode?: ShippingMode | null;
}) {
  const desc = plainText(input.description, 300);
  const imgs = uniqueImages(input.image, input.images);
  const price = parseIdrPrice(input.priceLabel);
  const shipping = offerShippingDetails(input.shippingMode, input.kind);
  const offers: Record<string, unknown> = {
    "@type": "Offer",
    url: absoluteUrl(`/market/${input.id}`),
    availability: "https://schema.org/InStock",
    itemCondition: "https://schema.org/NewCondition",
    priceCurrency: "IDR",
    seller: {
      "@type": "Organization",
      name: input.sellerName,
    },
    hasMerchantReturnPolicy: offerReturnPolicy(input.kind),
  };
  if (input.priceLabel) offers.name = input.priceLabel;
  // Google Merchant Listing: wajib angka price (> 0). Jangan kirim priceSpecification kosong.
  if (price != null) {
    offers.price = price;
    offers.priceSpecification = {
      "@type": "UnitPriceSpecification",
      price,
      priceCurrency: "IDR",
      ...(input.priceLabel ? { description: input.priceLabel } : {}),
    };
  }
  if (shipping) offers.shippingDetails = shipping;

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
