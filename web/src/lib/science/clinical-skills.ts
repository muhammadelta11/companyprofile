import type { ScienceModuleCard } from "./types";

export type ClinicalTool = {
  id: string;
  name: string;
  role: string;
};

export type AuscultationPoint = {
  id: string;
  name: string;
  short: string;
  /** Posisi pada dada skematik (x,y,z). */
  position: [number, number, number];
  landmark: string;
  soundFocus: string;
};

export type ClinicalStep = {
  id: string;
  title: string;
  instruction: string;
  theory?: string;
  /** Jika ada: mahasiswa harus klik titik dengan id ini. */
  expectPointId?: string;
  /** Jika ada: harus pilih alat ini dulu. */
  expectToolId?: string;
  hint: string;
};

export type ClinicalQuizItem = {
  id: string;
  prompt: string;
  choices: string[];
  correctIndex: number;
  explain: string;
};

export type ClinicalProcedure = {
  id: string;
  title: string;
  category: string;
  objectives: string[];
  theory: string;
  tools: ClinicalTool[];
  points: AuscultationPoint[];
  steps: ClinicalStep[];
  quiz: ClinicalQuizItem[];
  disclaimer: string;
  source: string;
};

/** Empat area auskultasi klasik (edukatif, landmark ICS). */
export const AUSCULTATION_POINTS: AuscultationPoint[] = [
  {
    id: "aortic",
    name: "Area aorta",
    short: "A",
    position: [0.35, 0.55, 0.12],
    landmark: "Sela iga 2 kanan, parasternal",
    soundFocus: "Katup aorta — penekanan S2 di kanan atas",
  },
  {
    id: "pulmonic",
    name: "Area pulmonal",
    short: "P",
    position: [-0.35, 0.55, 0.12],
    landmark: "Sela iga 2 kiri, parasternal",
    soundFocus: "Katup pulmonal — S2 di kiri atas",
  },
  {
    id: "tricuspid",
    name: "Area trikuspid",
    short: "T",
    position: [-0.2, -0.15, 0.14],
    landmark: "Sela iga 4–5 kiri, parasternal bawah",
    soundFocus: "Katup trikuspid — komponen S1 kanan",
  },
  {
    id: "mitral",
    name: "Area mitral (apex)",
    short: "M",
    position: [0.55, -0.45, 0.1],
    landmark: "Sela iga 5 kiri, linea midklavikula (apex)",
    soundFocus: "Katup mitral — S1 di apex; gallop jika ada",
  },
];

export const HEART_AUSCULTATION: ClinicalProcedure = {
  id: "heart-auscultation",
  title: "Auskultasi jantung (edukatif)",
  category: "Keterampilan klinis dasar",
  objectives: [
    "Mengenal empat area auskultasi klasik",
    "Mengaitkan landmark anatomi dengan fokus katup",
    "Membedakan konsep S1 dan S2 secara edukatif",
  ],
  theory:
    "Auskultasi memetakan bunyi jantung ke area permukaan dada. S1 terutama terkait penutupan katup AV (mitral & trikuspid) di awal sistol; S2 terkait penutupan katup semilunar (aorta & pulmonal) di akhir sistol. Empat area (A–P–T–M) adalah pendekatan pembelajaran standar, bukan pengganti pemeriksaan klinis lengkap.",
  tools: [
    { id: "stethoscope", name: "Stetoskop", role: "Diafragma untuk bunyi frekuensi tinggi (S1/S2)." },
    { id: "marker", name: "Penanda landmark", role: "Membantu mengingat sela iga & linea anatomi." },
  ],
  points: AUSCULTATION_POINTS,
  steps: [
    {
      id: "step-prep",
      title: "Persiapan",
      instruction: "Pilih stetoskop dari daftar alat untuk memulai prosedur virtual.",
      theory: "Pastikan lingkungan tenang. Pada praktik nyata: izin pasien, privasi, dan posisi semi-Fowler/supine.",
      expectToolId: "stethoscope",
      hint: "Klik alat Stetoskop di panel alat.",
    },
    {
      id: "step-aortic",
      title: "Temukan area aorta",
      instruction: "Klik titik auskultasi di sela iga 2 kanan (parasternal).",
      theory: "Area aorta: ICS 2 kanan — fokus katup aorta / S2 kanan.",
      expectPointId: "aortic",
      hint: "Titik kanan atas pada dada skematik (label A).",
    },
    {
      id: "step-pulmonic",
      title: "Temukan area pulmonal",
      instruction: "Klik titik di sela iga 2 kiri (parasternal).",
      theory: "Area pulmonal: ICS 2 kiri — fokus katup pulmonal.",
      expectPointId: "pulmonic",
      hint: "Simetris di kiri atas (label P).",
    },
    {
      id: "step-tricuspid",
      title: "Temukan area trikuspid",
      instruction: "Klik titik parasternal kiri bawah (ICS 4–5).",
      theory: "Area trikuspid mendengarkan komponen kanan S1.",
      expectPointId: "tricuspid",
      hint: "Dekat sternum, sedikit ke kiri bawah (label T).",
    },
    {
      id: "step-mitral",
      title: "Temukan area mitral (apex)",
      instruction: "Klik apex — ICS 5 kiri, midklavikula.",
      theory: "Area mitral / apex: S1 paling jelas; relevan untuk murmur mitral.",
      expectPointId: "mitral",
      hint: "Titik paling lateral-inferior kiri (label M).",
    },
    {
      id: "step-reflect",
      title: "Ringkas temuan",
      instruction: "Anda telah menandai A–P–T–M. Lanjut ke kuis singkat untuk mengunci konsep S1/S2.",
      theory: "Urutan pemeriksaan sering A→P→T→M atau mengikuti ‘Z-pattern’; yang penting konsisten dan dokumentasi jelas.",
      hint: "Tekan Lanjut setelah membaca ringkasan.",
    },
  ],
  quiz: [
    {
      id: "q1",
      prompt: "S1 terutama terkait penutupan katup…",
      choices: ["Aorta & pulmonal", "Mitral & trikuspid", "Hanya aorta", "Hanya vena cava"],
      correctIndex: 1,
      explain: "S1 berhubungan dengan penutupan katup atrioventrikular (mitral & trikuspid) di awal sistol.",
    },
    {
      id: "q2",
      prompt: "Landmark area aorta yang dipelajari di lab ini adalah…",
      choices: [
        "ICS 5 kiri midklavikula",
        "ICS 2 kanan parasternal",
        "ICS 2 kiri parasternal",
        "Epigastrium",
      ],
      correctIndex: 1,
      explain: "Area aorta: sela iga 2 kanan, tepi sternum.",
    },
    {
      id: "q3",
      prompt: "Area mitral (apex) paling berguna untuk menekankan…",
      choices: ["S2 pulmonal", "S1 / fokusasi mitral", "Bunyi usus", "Murmur vena"],
      correctIndex: 1,
      explain: "Apex (ICS 5 midklavikula kiri) adalah lokasi klasik untuk S1 dan temuan terkait mitral.",
    },
  ],
  disclaimer:
    "Simulasi pembelajaran landmark & konsep bunyi jantung. Bukan pelatihan sertifikasi, bukan diagnosis, dan tidak menggantikan praktik dengan supervisi.",
  source:
    "Landmark A–P–T–M dan konsep S1/S2 mengikuti pendekatan edukasi pemeriksaan fisik kardiovaskular standar.",
};

export const CLINICAL_PROCEDURES: ClinicalProcedure[] = [HEART_AUSCULTATION];

export function getClinicalProcedure(id: string) {
  return CLINICAL_PROCEDURES.find((p) => p.id === id) ?? null;
}

/** Update status kartu modul di anatomy.ts — diekspor ulang di sini bila perlu. */
export const CLINICAL_SKILLS_CARD: ScienceModuleCard = {
  href: "/belajar/kedokteran/keterampilan",
  track: "medicine",
  title: "Clinical Skills Lab",
  text: "Auskultasi jantung: langkah A–P–T–M + kuis singkat.",
  status: "ready",
};
