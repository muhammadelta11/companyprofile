export type Service = {
  id: string;
  title: string;
  blurb: string;
  items: string[];
  accent: "teal" | "orange" | "ink";
};

export const SERVICES: Service[] = [
  {
    id: "web-dev",
    title: "Web & Sistem",
    blurb: "Dari company profile sampai sistem informasi siap pakai.",
    items: [
      "Website & company profile",
      "Sistem informasi / inventory",
      "Aplikasi mobile",
      "Custom request bisnis",
    ],
    accent: "teal",
  },
  {
    id: "research",
    title: "Tugas & Penelitian",
    blurb: "Bantuan teknis untuk tugas kuliah, riset, dan analisis data.",
    items: [
      "Sistem untuk tugas kuliah",
      "Riset & analisis data",
      "Laporan teknis rapi",
      "NLP / ML ringan",
    ],
    accent: "ink",
  },
  {
    id: "market",
    title: "Market & Reseller",
    blurb: "Produk fisik & digital — wadah penjual dan pembeli.",
    items: [
      "Produk reseller Mas'ud El-Tamamy",
      "Listing mitra / penjual",
      "Order via konfirmasi WA",
      "Benefit member & mitra",
    ],
    accent: "orange",
  },
  {
    id: "wisata",
    title: "Wisata",
    blurb: "Paket perjalanan bersama Mbarep Tour & Travel.",
    items: [
      "Paket wisata rombongan",
      "Studi tour & kunjungan industri",
      "Family & corporate gathering",
      "Wisata religi / ziarah",
    ],
    accent: "orange",
  },
];
