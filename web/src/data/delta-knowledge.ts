/** Knowledge base Delta — jawaban lokal + konteks untuk LLM opsional */
export const DELTA_PROFILE = {
  name: "Muhammad Mas'ud",
  brand: "Mas'ud El-Tamamy",
  nick: "masudel-tamamy",
  roles: [
    "Digital partner (web, sistem, mobile, riset)",
    "Market / reseller & wadah mitra penjual-pembeli",
    "Travel assistant bersama Mbarep Tour",
  ],
  work: ["Lingkar.co", "Mbarep Tour & Travel"],
  education: "Teknik Informatika — Universitas Wahid Hasyim Semarang",
  location: "Ngawi · Semarang",
  contact: {
    wa: "0856-4712-1046",
    email: "muhammadsmas998@gmail.com",
    site: "masudeltamamy.com",
  },
  slogan: "BEBAS REPOT, HASIL TOP!",
};

export const DELTA_FAQS: { q: string; a: string; tags: string[] }[] = [
  {
    q: "Siapa Mas'ud El-Tamamy?",
    a: "Mas'ud El-Tamamy adalah brand Muhammad Mas'ud (masudel-tamamy): partner digital, market produk, dan asisten wisata. Ia fokus jasa web/sistem, reseller + wadah mitra, serta paket wisata bersama Mbarep Tour.",
    tags: ["profil", "siapa", "brand", "tentang"],
  },
  {
    q: "Layanan apa saja?",
    a: "Empat pilar: (1) Web & sistem/aplikasi, (2) Tugas & penelitian, (3) Market — produk fisik/digital & mitra penjual, (4) Wisata via Mbarep Tour. Order/inquiry dikonfirmasi via WhatsApp.",
    tags: ["layanan", "jasa", "service", "apa saja"],
  },
  {
    q: "Berapa harga jasa web?",
    a: "Harga menyesuaikan brief (landing biasanya mulai kisaran Rp 1,5jt; company profile & sistem custom). Delta tidak mengunci harga final — konfirmasi penawaran via WhatsApp ke Mas'ud.",
    tags: ["harga", "biaya", "quote", "web", "landing"],
  },
  {
    q: "Bagaimana order produk di Market?",
    a: "Pilih produk di halaman Market, lalu konfirmasi order lewat WhatsApp. Pembayaran & detail dikonfirmasi manual dulu (MVP). Mitra penjual juga bisa daftar listing.",
    tags: ["market", "produk", "beli", "order", "reseller"],
  },
  {
    q: "Bagaimana jadi penjual / mitra?",
    a: "Buka halaman Gabung, pilih peran Mitra Penjual, isi nama, kota, dan produkmu, lalu kirim lewat WhatsApp. Setelah diverifikasi, produk tampil di Market Mas'ud El-Tamamy.",
    tags: ["mitra", "penjual", "jual", "daftar"],
  },
  {
    q: "Apa beda member, mitra, dan partner?",
    a: "Member: dapat promo, update katalog & trip, dan prioritas konsultasi. Mitra Penjual: punya etalase produk di Market. Partner Kolaborasi: freelancer/agency/travel agent yang ikut proyek atau referral. Semua daftar lewat halaman Gabung.",
    tags: ["member", "beda", "keuntungan", "gabung", "partner", "benefit"],
  },
  {
    q: "Studi tour untuk sekolah?",
    a: "Bisa. Studi tour dan kunjungan industri disusun lengkap: rundown, transport, pendamping, dan dokumentasi. Kirim jumlah peserta, tujuan, dan tanggal via WhatsApp untuk proposal.",
    tags: ["studi", "sekolah", "kampus", "industri", "proposal"],
  },
  {
    q: "Bisa custom rute wisata?",
    a: "Bisa. Destinasi, jumlah peserta, durasi, dan jadwal bisa disesuaikan bersama Mbarep Tour. Konfirmasi detailnya via WhatsApp.",
    tags: ["custom", "rute", "destinasi", "jadwal", "peserta"],
  },
  {
    q: "Bisa bikin aplikasi mobile atau bantu tugas/penelitian?",
    a: "Bisa. Contohnya Aswaja Medicine (aplikasi mobile) dan HARMSCAN (riset ML). Untuk tugas kuliah atau penelitian, ceritakan topik dan tenggatnya via WhatsApp.",
    tags: ["mobile", "aplikasi", "android", "tugas", "penelitian", "skripsi", "riset"],
  },
  {
    q: "Ada paket wisata?",
    a: "Ya — wisata rombongan, studi tour, kunjungan industri, family gathering, corporate outbound, dan wisata religi. Detail & jadwal dikonfirmasi via WA / Mbarep Tour.",
    tags: ["wisata", "trip", "tour", "mbarep", "liburan"],
  },
  {
    q: "Proyek yang sudah dikerjakan?",
    a: "Contoh: HARMSCAN, Lingkar.co, Nahwa Al Sikha, Cybernetsec, Manteb Jaya Abadi, Aswaja Medicine, Inventory Rokok, MIS Ma'arif Tempursari, HMJTI Unwahas, dan lainnya. Lihat halaman Proyek.",
    tags: ["proyek", "portfolio", "kerja", "hasil"],
  },
  {
    q: "Bagaimana menghubungi?",
    a: "WhatsApp 0856-4712-1046 (paling cepat), email muhammadsmas998@gmail.com, atau minta Delta siapkan ringkasan chat untuk diteruskan ke WA.",
    tags: ["kontak", "hubungi", "wa", "whatsapp", "email"],
  },
];

export const DELTA_PROMPTS = [
  "Siapa Mas'ud El-Tamamy?",
  "Saya butuh jasa website",
  "Cara order di Market?",
  "Mau jadi penjual/mitra",
  "Ada paket wisata?",
  "Hubungkan ke WhatsApp",
];

const DELTA_PROMPTS_BY_PAGE: Record<string, string[]> = {
  "/layanan": [
    "Berapa harga jasa web?",
    "Bisa bikin aplikasi mobile?",
    "Bantu tugas/penelitian?",
    "Hubungkan ke WhatsApp",
  ],
  "/market": [
    "Cara order di Market?",
    "Mau jadi penjual/mitra",
    "Apa beda member dan mitra?",
    "Hubungkan ke WhatsApp",
  ],
  "/wisata": [
    "Ada paket wisata?",
    "Studi tour untuk sekolah?",
    "Bisa custom rute?",
    "Hubungkan ke WhatsApp",
  ],
  "/proyek": [
    "Proyek apa saja yang sudah dikerjakan?",
    "Saya butuh jasa website",
    "Bisa bikin aplikasi mobile?",
    "Hubungkan ke WhatsApp",
  ],
  "/gabung": [
    "Apa beda member dan mitra?",
    "Mau jadi penjual/mitra",
    "Apa keuntungan member?",
    "Hubungkan ke WhatsApp",
  ],
};

export function promptsFor(path: string) {
  return DELTA_PROMPTS_BY_PAGE[path] ?? DELTA_PROMPTS;
}

export function retrieveFaq(
  message: string,
  extra: { q: string; a: string; tags: string[] }[] = []
) {
  const m = message.toLowerCase();
  let best = DELTA_FAQS[0];
  let score = 0;
  for (const faq of [...extra, ...DELTA_FAQS]) {
    let s = 0;
    for (const tag of faq.tags) {
      if (m.includes(tag)) s += 2;
    }
    const words = faq.q.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
    for (const w of words) if (m.includes(w)) s += 1;
    if (s > score) {
      score = s;
      best = faq;
    }
  }
  return { faq: best, score };
}
