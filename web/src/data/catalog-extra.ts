type ProductExtra = { highlights: string[]; tone: "digital" | "fisik" | "jasa" };
type TripExtra = { includes: string[]; ideal: string; tone: string };

/** Detail tambahan (DB belum punya kolom ini). Key = id seed ATAU judul. */
export const PRODUCT_EXTRA: Record<string, ProductExtra> = {
  "svc-landing": {
    tone: "jasa",
    highlights: [
      "Desain mobile-first + CTA WhatsApp",
      "Siap iklan Meta / Google",
      "Revisi terbatas sesuai paket",
      "Serah terima 5–10 hari kerja",
    ],
  },
  "Paket Landing Page Bisnis": {
    tone: "jasa",
    highlights: [
      "Desain mobile-first + CTA WhatsApp",
      "Siap iklan Meta / Google",
      "Revisi terbatas sesuai paket",
      "Serah terima 5–10 hari kerja",
    ],
  },
  "svc-company": {
    tone: "jasa",
    highlights: [
      "Halaman profil, layanan, galeri, kontak",
      "Optimasi dasar SEO & performa",
      "Formulir / WA terintegrasi",
      "Quote menyesuaikan scope",
    ],
  },
  "Company Profile Website": {
    tone: "jasa",
    highlights: [
      "Halaman profil, layanan, galeri, kontak",
      "Optimasi dasar SEO & performa",
      "Formulir / WA terintegrasi",
      "Quote menyesuaikan scope",
    ],
  },
  "dig-template": {
    tone: "digital",
    highlights: [
      "Komponen UI siap pakai",
      "Cocok untuk UMKM & organisasi",
      "Dokumentasi singkat",
      "Lisensi pemakaian jelas",
    ],
  },
  "Template UI Starter Pack": {
    tone: "digital",
    highlights: [
      "Komponen UI siap pakai",
      "Cocok untuk UMKM & organisasi",
      "Dokumentasi singkat",
      "Lisensi pemakaian jelas",
    ],
  },
};

export const TRIP_EXTRA: Record<string, TripExtra> = {
  wisata: {
    tone: "emerald",
    ideal: "Rombongan umum & komunitas",
    includes: ["Transport sesuai paket", "Pendamping perjalanan", "Jadwal fleksibel", "Konsultasi rute"],
  },
  "Paket Wisata": {
    tone: "emerald",
    ideal: "Rombongan umum & komunitas",
    includes: ["Transport sesuai paket", "Pendamping perjalanan", "Jadwal fleksibel", "Konsultasi rute"],
  },
  "study-tour": {
    tone: "sky",
    ideal: "Sekolah & kampus",
    includes: ["Itinerary edukatif", "Koordinasi lokasi", "Pendamping rombongan", "Briefing keselamatan"],
  },
  "Studi Tour": {
    tone: "sky",
    ideal: "Sekolah & kampus",
    includes: ["Itinerary edukatif", "Koordinasi lokasi", "Pendamping rombongan", "Briefing keselamatan"],
  },
  "kunjungan-industri": {
    tone: "indigo",
    ideal: "Kelas / himpunan / pelatihan",
    includes: ["Koordinasi industri", "Safety brief", "Dokumentasi singkat", "Transport opsi"],
  },
  "Kunjungan Industri": {
    tone: "indigo",
    ideal: "Kelas / himpunan / pelatihan",
    includes: ["Koordinasi industri", "Safety brief", "Dokumentasi singkat", "Transport opsi"],
  },
  "family-gathering": {
    tone: "amber",
    ideal: "Keluarga & komunitas",
    includes: ["Venue / destinasi", "Aktivitas santai", "Konsumsi opsi", "Dokumentasi"],
  },
  "Family Gathering": {
    tone: "amber",
    ideal: "Keluarga & komunitas",
    includes: ["Venue / destinasi", "Aktivitas santai", "Konsumsi opsi", "Dokumentasi"],
  },
  outbound: {
    tone: "rose",
    ideal: "Perusahaan, kampus, organisasi",
    includes: ["Team building", "Fasilitator", "Peralatan dasar", "Evaluasi singkat"],
  },
  "Corporate Outbound": {
    tone: "rose",
    ideal: "Perusahaan, kampus, organisasi",
    includes: ["Team building", "Fasilitator", "Peralatan dasar", "Evaluasi singkat"],
  },
  ziarah: {
    tone: "violet",
    ideal: "Rombongan religi",
    includes: ["Transport & pendamping", "Jadwal ziarah", "Koordinasi lokasi", "Bimbingan rombongan"],
  },
  "Wisata Religi / Ziarah": {
    tone: "violet",
    ideal: "Rombongan religi",
    includes: ["Transport & pendamping", "Jadwal ziarah", "Koordinasi lokasi", "Bimbingan rombongan"],
  },
};

export function productExtra(id: string, title: string): ProductExtra | undefined {
  return PRODUCT_EXTRA[id] ?? PRODUCT_EXTRA[title];
}

export function tripExtra(id: string, title: string): TripExtra | undefined {
  return TRIP_EXTRA[id] ?? TRIP_EXTRA[title];
}
