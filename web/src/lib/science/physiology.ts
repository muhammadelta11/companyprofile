/**
 * Siklus jantung edukatif — fase berdasarkan fisiologi standar.
 * Proporsi durasi ≈ siklus istirahat dewasa (bukan patient-specific).
 */

export type CardiacPhaseId =
  | "diastole_fill"
  | "atrial_systole"
  | "iv_contraction"
  | "ejection"
  | "iv_relaxation";

export type CardiacPhase = {
  id: CardiacPhaseId;
  name: string;
  /** Porsi durasi dalam satu siklus (jumlah = 1). */
  weight: number;
  summary: string;
  learningPoints: string[];
  /** Bagian anatomi yang aktif / berkontraksi. */
  activePartIds: string[];
  /** Jalur aliran skematik (id bagian yang “dilewati” darah). */
  flowPartIds: string[];
  /** Oksigenasi aliran yang ditonjolkan di fase ini. */
  flowKind: "deoxygenated" | "oxygenated" | "both" | "none";
};

export const CARDIAC_PHASES: CardiacPhase[] = [
  {
    id: "diastole_fill",
    name: "Diastol — pengisian",
    weight: 0.42,
    summary:
      "Ventrikel rileks. Darah mengalir dari vena ke atrium lalu ke ventrikel (pengisian pasif dominan).",
    learningPoints: [
      "Tekanan ventrikel rendah; katup AV (trikuspid & mitral) terbuka",
      "Vena cava → atrium kanan → ventrikel kanan",
      "Vena pulmonalis → atrium kiri → ventrikel kiri",
    ],
    activePartIds: ["ra", "la", "rv", "lv", "vc", "pv"],
    flowPartIds: ["vc", "ra", "rv", "pv", "la", "lv"],
    flowKind: "both",
  },
  {
    id: "atrial_systole",
    name: "Sistol atrium",
    weight: 0.12,
    summary:
      "Atrium berkontraksi (gelombang P / atrial kick) menyumbang sisa pengisian ventrikel (~15–30% pada dewasa sehat).",
    learningPoints: [
      "Kontraksi atrium kanan & kiri",
      "Mendorong sisa volume ke ventrikel",
      "Menjelang penutupan katup AV",
    ],
    activePartIds: ["ra", "la"],
    flowPartIds: ["ra", "rv", "la", "lv"],
    flowKind: "both",
  },
  {
    id: "iv_contraction",
    name: "Kontraksi isovolumetrik",
    weight: 0.08,
    summary:
      "Ventrikel mulai berkontraksi; katup AV menutup (S1). Belum ada ejeksi sampai tekanan > arteri.",
    learningPoints: [
      "Volume ventrikel relatif konstan (isovolumetrik)",
      "Tekanan naik cepat",
      "Bunyi jantung I (S1) terkait penutupan katup AV",
    ],
    activePartIds: ["rv", "lv"],
    flowPartIds: [],
    flowKind: "none",
  },
  {
    id: "ejection",
    name: "Ejeksi ventrikel",
    weight: 0.28,
    summary:
      "Katup semilunar terbuka. Ventrikel kanan memompa ke paru; ventrikel kiri ke aorta (sirkulasi sistemik).",
    learningPoints: [
      "RV → arteri pulmonalis (darah deoksigenasi)",
      "LV → aorta (darah beroksigen)",
      "Stroke volume = EDV − ESV (konsep)",
    ],
    activePartIds: ["rv", "lv", "pa", "aorta"],
    flowPartIds: ["rv", "pa", "lv", "aorta"],
    flowKind: "both",
  },
  {
    id: "iv_relaxation",
    name: "Relaksasi isovolumetrik",
    weight: 0.1,
    summary:
      "Ventrikel rileks; katup semilunar menutup (S2). Volume belum berubah sampai tekanan < atrium.",
    learningPoints: [
      "Penutupan katup aorta & pulmonal (S2)",
      "Tidak ada aliran masuk/keluar sesaat",
      "Persiapan kembali ke fase pengisian",
    ],
    activePartIds: ["rv", "lv"],
    flowPartIds: [],
    flowKind: "none",
  },
];

export const PHYSIOLOGY_DISCLAIMER =
  "Simulasi edukatif siklus jantung normal saat istirahat. Bukan model pasien, bukan alat diagnosis, dan tidak untuk keputusan klinis.";

export const PHYSIOLOGY_SOURCE =
  "Fase mengikuti urutan fisiologi kardiovaskular standar (diastol → sistol atrium → kontraksi isovolumetrik → ejeksi → relaksasi isovolumetrik). Proporsi durasi disederhanakan untuk pembelajaran.";

/** Durasi satu siklus (ms) pada kecepatan 1× — ≈ 60–70 bpm edukatif. */
export const BASE_CYCLE_MS = 5000;

export function phaseAtProgress(progress: number): { phase: CardiacPhase; index: number; local: number } {
  const p = ((progress % 1) + 1) % 1;
  let acc = 0;
  for (let i = 0; i < CARDIAC_PHASES.length; i++) {
    const phase = CARDIAC_PHASES[i];
    const next = acc + phase.weight;
    if (p < next || i === CARDIAC_PHASES.length - 1) {
      const local = phase.weight > 0 ? (p - acc) / phase.weight : 0;
      return { phase, index: i, local: Math.min(1, Math.max(0, local)) };
    }
    acc = next;
  }
  return { phase: CARDIAC_PHASES[0], index: 0, local: 0 };
}
