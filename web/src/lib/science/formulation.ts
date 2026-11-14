/** Formulasi farmasi edukatif — proses tablet & peran eksipien. */

export type DosageForm = {
  id: string;
  name: string;
  summary: string;
  examples: string[];
};

export type Excipient = {
  id: string;
  name: string;
  role: string;
  typicalPct: string;
};

export type FormStep = {
  id: string;
  title: string;
  summary: string;
  learningPoints: string[];
  /** Parameter yang bisa digeser (edukatif). */
  param?: {
    key: string;
    label: string;
    unit: string;
    min: number;
    max: number;
    step: number;
    defaultValue: number;
  };
};

export const DOSAGE_FORMS: DosageForm[] = [
  {
    id: "tablet",
    name: "Tablet",
    summary: "Sediaan padat kompresi; paling banyak diproduksi. Fokus lab ini.",
    examples: ["Tablet salut", "Tablet kunyah", "Tablet effervescent"],
  },
  {
    id: "capsule",
    name: "Kapsul",
    summary: "Cangkang gelatin/HPMC berisi serbuk atau granul; rasa tertutup.",
    examples: ["Kapsul keras", "Kapsul lunak"],
  },
  {
    id: "syrup",
    name: "Sirup",
    summary: "Larutan/viscous oral; perlu pengawet dan kontrol mikroba.",
    examples: ["Sirup obat batuk", "Suspensi oral"],
  },
  {
    id: "injectable",
    name: "Sediaan injeksi",
    summary: "Steril, bebas pirogen; tidak disimulasikan di lab ini.",
    examples: ["Larutan IV", "Suspensi IM"],
  },
];

export const EXCIPIENTS: Excipient[] = [
  { id: "api", name: "Zat aktif (API)", role: "Efek farmakologi", typicalPct: "variabel" },
  { id: "filler", name: "Pengisi (laktosa/MCC)", role: "Volume & kompresibilitas", typicalPct: "30–80%" },
  { id: "binder", name: "Pengikat (PVP/starch)", role: "Kohesi granul/tablet", typicalPct: "2–10%" },
  { id: "disintegrant", name: "Penghancur (CCS/SSG)", role: "Pecah di cairan tubuh", typicalPct: "2–8%" },
  { id: "lubricant", name: "Pelicin (Mg stearat)", role: "Cegah sticking di punch", typicalPct: "0.25–2%" },
];

export const FORM_STEPS: FormStep[] = [
  {
    id: "mix",
    title: "1. Pencampuran",
    summary: "API dan eksipien dicampur hingga homogen sebelum granulasi atau kompresi langsung.",
    learningPoints: [
      "Homogenitas menentukan keseragaman kandungan",
      "Urutan penambahan pelicin biasanya di akhir",
    ],
  },
  {
    id: "granulate",
    title: "2. Granulasi basah (konseptual)",
    summary: "Larutan pengikat membentuk jembatan antar partikel → granul, lalu dikeringkan.",
    learningPoints: [
      "Granul memperbaiki aliran serbuk",
      "Kadar air sisa memengaruhi kekerasan tablet",
    ],
    param: {
      key: "moisture",
      label: "Kadar air residual",
      unit: "%",
      min: 1,
      max: 8,
      step: 0.5,
      defaultValue: 3,
    },
  },
  {
    id: "compress",
    title: "3. Kompresi tablet",
    summary: "Gaya kompresi membentuk tablet. Terlalu rendah: rapuh; terlalu tinggi: capping/laminasi (konseptual).",
    learningPoints: [
      "Hardness naik dengan gaya hingga titik optimal",
      "Lubrikasi berlebih dapat menurunkan kekerasan",
    ],
    param: {
      key: "force",
      label: "Gaya kompresi",
      unit: "kN",
      min: 5,
      max: 25,
      step: 1,
      defaultValue: 12,
    },
  },
  {
    id: "dissolve",
    title: "4. Disolusi (uji pelepasan)",
    summary: "Persentase zat aktif terlarut vs waktu — model orde-satu sederhana untuk pembelajaran.",
    learningPoints: [
      "Disintegran mempercepat pecahnya tablet",
      "Kurva disolusi ≠ bioavailabilitas penuh, tetapi indikator penting",
    ],
    param: {
      key: "kDiss",
      label: "Konstanta disolusi k",
      unit: "1/menit",
      min: 0.05,
      max: 0.45,
      step: 0.01,
      defaultValue: 0.18,
    },
  },
];

export const FORM_DISCLAIMER =
  "Simulasi edukatif proses formulasi tablet. Bukan resep produksi, bukan validasi GMP, dan tidak untuk pembuatan obat nyata.";

export const FORM_SOURCE =
  "Alur mix → granulasi → kompresi → disolusi mengikuti kerangka teknologi farmasi dasar. Model disolusi: Q(t)=Qmax·(1−e^(−k·t)).";

/** Kekerasan relatif (edukatif) dari gaya kompresi & kadar air. */
export function estimateHardness(forceKn: number, moisturePct: number) {
  const moistPenalty = Math.max(0, moisturePct - 2) * 0.35;
  const raw = 0.55 * forceKn - moistPenalty;
  return Math.max(2, Math.min(18, raw));
}

/** Disolusi orde-satu: fraksi terlarut 0–1. */
export function dissolutionFraction(kPerMin: number, tMin: number, hardness: number) {
  const kEff = kPerMin * (12 / Math.max(hardness, 4));
  return 1 - Math.exp(-kEff * tMin);
}

export function sampleDissolution(kPerMin: number, hardness: number, minutes = 45, steps = 60) {
  const pts: { t: number; q: number }[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = (minutes * i) / steps;
    pts.push({ t, q: dissolutionFraction(kPerMin, t, hardness) * 100 });
  }
  return pts;
}
