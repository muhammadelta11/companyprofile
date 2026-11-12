import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { AppShell } from "@/components/AppShell";
import { JsonLd } from "@/components/JsonLd";
import { INTRO_HEAD_SCRIPT } from "@/components/intro/intro-config";
import { PWA_HEAD_SCRIPT } from "@/components/pwa/pwa-config";
import {
  absoluteUrl,
  DEFAULT_OG_IMAGE,
  OG_IMAGE_HEIGHT,
  OG_IMAGE_WIDTH,
  organizationJsonLd,
  SITE_URL,
  websiteJsonLd,
} from "@/lib/seo";
import "./globals.css";

/** Satu family untuk body + judul — proporsi normal seperti app Android (bukan display “gepeng”). */
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const DEFAULT_OG = {
  url: absoluteUrl(DEFAULT_OG_IMAGE),
  secureUrl: absoluteUrl(DEFAULT_OG_IMAGE),
  width: OG_IMAGE_WIDTH,
  height: OG_IMAGE_HEIGHT,
  alt: "Banner utama Mas'ud El-Tamamy — Digital, Market, dan Paket Wisata",
  type: "image/jpeg",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Mas'ud El-Tamamy — Digital · Market · Wisata",
    template: "%s · Mas'ud El-Tamamy",
  },
  description:
    "Platform bisnis Mas'ud El-Tamamy: jasa digital, market produk, dan paket wisata. Konsultasi & order via WhatsApp, dibantu Delta AI.",
  keywords: [
    "Mas'ud El-Tamamy",
    "jasa web Ngawi",
    "market mitra",
    "paket wisata",
    "order WhatsApp",
    "company profile",
  ],
  authors: [{ name: "Mas'ud El-Tamamy" }],
  creator: "Mas'ud El-Tamamy",
  publisher: "Mas'ud El-Tamamy",
  applicationName: "Mas'ud El-Tamamy",
  appleWebApp: { capable: true, title: "Mas'ud", statusBarStyle: "default" },
  formatDetection: { telephone: false },
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: "Mas'ud El-Tamamy — Digital · Market · Wisata",
    description: "Platform bisnis: digital, market, dan wisata — dibantu Delta AI.",
    url: SITE_URL,
    siteName: "Mas'ud El-Tamamy",
    locale: "id_ID",
    type: "website",
    images: [DEFAULT_OG],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mas'ud El-Tamamy — Digital · Market · Wisata",
    description: "Jasa digital, market produk, dan paket wisata via WhatsApp.",
    images: [DEFAULT_OG.url],
  },
  robots: {
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
};

export const viewport: Viewport = {
  themeColor: "#f4f7ff",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="id"
      className={`${jakarta.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: INTRO_HEAD_SCRIPT + PWA_HEAD_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col antialiased">
        <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
        <Suspense fallback={<main className="main-shell">{children}</main>}>
          <AppShell>{children}</AppShell>
        </Suspense>
        <Analytics />
      </body>
    </html>
  );
}
