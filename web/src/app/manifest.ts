import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Mas'ud El-Tamamy",
    short_name: "Mas'ud",
    description:
      "Jasa web & sistem, market produk, dan wisata Mbarep Tour — dibantu Delta, asisten AI.",
    lang: "id",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f4f7ff",
    theme_color: "#f4f7ff",
    categories: ["business", "shopping", "travel"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Layanan web & sistem", short_name: "Layanan", url: "/layanan" },
      { name: "Market", url: "/market" },
      { name: "Wisata Mbarep Tour", short_name: "Wisata", url: "/wisata" },
      { name: "Gabung member & mitra", short_name: "Gabung", url: "/gabung" },
    ],
  };
}
