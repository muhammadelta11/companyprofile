export type Project = {
  id: string;
  title: string;
  category: "web" | "mobile" | "research";
  tag: string;
  summary: string;
  link?: string;
  cover?: string;
};

export const PROJECTS: Project[] = [
  {
    id: "harmscan",
    title: "HARMSCAN",
    category: "web",
    tag: "Cybersecurity · ML",
    summary: "Deteksi SEO poisoning & konten malicious pada domain pendidikan.",
    link: "https://harmscan.pages.dev/",
    cover: "/projects/harmscan/1.png",
  },
  {
    id: "lingkar",
    title: "Lingkar.co",
    category: "web",
    tag: "Website · Produk",
    summary: "Website & solusi digital untuk Lingkar.co.",
    link: "https://lingkar.co",
    cover: "/projects/lingkar/1.jpg",
  },
  {
    id: "nahwaalsikha",
    title: "Nahwa Al Sikha",
    category: "web",
    tag: "Company Profile",
    summary: "Website company profile nahwaalsikha.com.",
    link: "https://nahwaalsikha.com",
    cover: "/projects/nahwaalsikha/1.png",
  },
  {
    id: "cybernetsec",
    title: "Cybernetsec",
    category: "web",
    tag: "Security",
    summary: "Proyek keamanan siber Cybernetsec.",
    cover: "/projects/cybernetsec/1.png",
  },
  {
    id: "mantebjayaabadi",
    title: "Manteb Jaya Abadi",
    category: "web",
    tag: "Company Profile",
    summary: "Website mantebjayaabadi.com.",
    link: "https://mantebjayaabadi.com",
    cover: "/projects/mantebjayaabadi/1.png",
  },
  {
    id: "aswaja-medicine",
    title: "Aswaja Medicine",
    category: "mobile",
    tag: "Mobile App",
    summary: "Aplikasi mobile referensi obat (APK).",
    cover: "/projects/aswaja-medicine/1.jpg",
  },
  {
    id: "inventory-rokok",
    title: "Inventory Rokok",
    category: "web",
    tag: "Inventory System",
    summary: "Sistem inventori stok rokok.",
    cover: "/projects/inventory-rokok/1.png",
  },
  {
    id: "mismaariftempursari",
    title: "MIS Ma'arif Tempursari",
    category: "web",
    tag: "Website Sekolah",
    summary: "Website resmi MIS Ma'arif Tempursari.",
    link: "https://mismaariftempursari.sch.id",
    cover: "/projects/mismaariftempursari/1.jpg",
  },
  {
    id: "hmjti-unwahas",
    title: "HMJTI Unwahas",
    category: "web",
    tag: "Organisasi · Web",
    summary: "Website Himpunan Mahasiswa TI Unwahas.",
    link: "https://hmjti.unwahas.ac.id",
    cover: "/projects/hmjti-unwahas/1.jpg",
  },
  {
    id: "mbareptour",
    title: "Mbarep Tour & Travel",
    category: "web",
    tag: "Website · Travel",
    summary: "Website trip & layanan travel Mbarep Tour.",
    link: "https://mbareptour.id",
  },
  {
    id: "smartsppg",
    title: "Smart SPPG",
    category: "web",
    tag: "Sistem Informasi",
    summary: "Aplikasi web smartsppg.com.",
    link: "https://smartsppg.com",
  },
  {
    id: "prediksi-cuaca",
    title: "Prediksi Cuaca",
    category: "research",
    tag: "Penelitian",
    summary: "Penelitian model prediksi cuaca.",
  },
];
