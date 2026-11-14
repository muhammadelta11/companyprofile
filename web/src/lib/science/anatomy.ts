import type { ScienceModuleCard, ScienceTrack } from "./types";

/** Bagian anatomi yang bisa diklik (hotspot). */
export type AnatomyPart = {
  id: string;
  name: string;
  nameLa?: string;
  summary: string;
  learningPoints: string[];
  color: string;
  /** Posisi lokal relatif model. */
  position: [number, number, number];
  /** Skala mesh skematik. */
  scale: [number, number, number];
  /** 'sphere' | 'box' | 'cylinder' untuk bentuk skematik. */
  shape: "sphere" | "box" | "cylinder";
  rotation?: [number, number, number];
};

export type AnatomyModel = {
  id: string;
  title: string;
  system: string;
  track: ScienceTrack;
  summary: string;
  disclaimer: string;
  source: string;
  license: string;
  /** Path GLB opsional di /public — jika ada, loader bisa dipakai nanti. */
  glbPath?: string;
  parts: AnatomyPart[];
};

/**
 * Jantung skematik edukatif (4 ruang + pembuluh utama).
 * Bukan model bedah/fotografis — geometri prosedural berlisensi kode proyek.
 */
export const HEART_MODEL: AnatomyModel = {
  id: "heart",
  title: "Jantung (BodyParts3D)",
  system: "Kardiovaskular",
  track: "medicine",
  summary:
    "Model anatomi referensi dewasa (BodyParts3D) dengan atrium, ventrikel, aorta, trunkus pulmonalis, dan vena cava superior.",
  disclaimer:
    "Visualisasi edukatif dari atlas BodyParts3D — bukan alat diagnosis, bukan model pasien, dan tidak menggantikan atlas klinis berlisensi institusi.",
  source:
    "BodyParts3D © Database Center for Life Science (DBCLS), CC BY 4.0. Distribusi GLB dikurasi OrganUI (atribusi di /models/ATTRIBUTION.md). Mitsuhashi et al., NAR 2009.",
  license:
    "Model: CC BY 4.0 (DBCLS BodyParts3D). Harus menyertakan atribusi saat redistribusi. Kode aplikasi proyek terpisah.",
  glbPath: "/models/heart.glb",
  parts: [
    {
      id: "ra",
      name: "Atrium kanan",
      nameLa: "Atrium dextrum",
      summary:
        "Menerima darah deoksigenasi dari vena cava superior/inferior, lalu mengalirkannya ke ventrikel kanan.",
      learningPoints: [
        "Pintu masuk darah sistemik kembali ke jantung",
        "Katup trikuspid memisahkan atrium dan ventrikel kanan",
        "Tekanan relatif lebih rendah dibanding sisi kiri",
      ],
      color: "#38bdf8",
      position: [-0.55, 0.45, 0.15],
      scale: [0.55, 0.42, 0.5],
      shape: "sphere",
    },
    {
      id: "rv",
      name: "Ventrikel kanan",
      nameLa: "Ventriculus dexter",
      summary:
        "Memompa darah deoksigenasi ke paru melalui arteri pulmonalis (sirkulasi pulmonal).",
      learningPoints: [
        "Dinding lebih tipis dari ventrikel kiri",
        "Keluar menuju trunkus pulmonalis",
        "Bagian pompa sirkulasi paru",
      ],
      color: "#0ea5e9",
      position: [-0.45, -0.35, 0.2],
      scale: [0.65, 0.7, 0.6],
      shape: "sphere",
    },
    {
      id: "la",
      name: "Atrium kiri",
      nameLa: "Atrium sinistrum",
      summary:
        "Menerima darah beroksigen dari vena pulmonalis, lalu mengalirkannya ke ventrikel kiri.",
      learningPoints: [
        "Pintu masuk darah dari paru",
        "Katup mitral (bikuspid) ke ventrikel kiri",
        "Dinding sedikit lebih tebal dari atrium kanan",
      ],
      color: "#fb7185",
      position: [0.55, 0.45, 0.05],
      scale: [0.55, 0.42, 0.48],
      shape: "sphere",
    },
    {
      id: "lv",
      name: "Ventrikel kiri",
      nameLa: "Ventriculus sinister",
      summary:
        "Ruang pompa utama ke seluruh tubuh melalui aorta (sirkulasi sistemik). Dinding paling tebal.",
      learningPoints: [
        "Tekanan sistolik tertinggi di jantung",
        "Miokardium paling tebal",
        "Keluar melalui katup aorta",
      ],
      color: "#e11d48",
      position: [0.4, -0.4, 0.05],
      scale: [0.72, 0.85, 0.65],
      shape: "sphere",
    },
    {
      id: "aorta",
      name: "Aorta",
      nameLa: "Aorta",
      summary:
        "Arteri terbesar; membawa darah beroksigen dari ventrikel kiri ke sirkulasi sistemik.",
      learningPoints: [
        "Muncul dari ventrikel kiri",
        "Lengkung aorta memberi cabang ke kepala & lengan",
        "Bagian kunci afterload ventrikel kiri",
      ],
      color: "#be123c",
      position: [0.15, 1.05, -0.05],
      scale: [0.18, 0.55, 0.18],
      shape: "cylinder",
      rotation: [0.25, 0, 0.15],
    },
    {
      id: "pa",
      name: "Arteri pulmonalis",
      nameLa: "Truncus pulmonalis",
      summary:
        "Membawa darah deoksigenasi dari ventrikel kanan ke paru untuk oksigenasi.",
      learningPoints: [
        "Satu-satunya arteri yang membawa darah deoksigenasi (pada sirkulasi normal)",
        "Bercabang kiri–kanan ke kedua paru",
        "Tekanan lebih rendah dari aorta",
      ],
      color: "#0369a1",
      position: [-0.05, 0.85, 0.35],
      scale: [0.16, 0.4, 0.16],
      shape: "cylinder",
      rotation: [0.6, 0.2, -0.3],
    },
    {
      id: "vc",
      name: "Vena cava",
      nameLa: "Vena cava",
      summary:
        "Vena besar yang mengembalikan darah sistemik ke atrium kanan (superior & inferior, digabung skematik).",
      learningPoints: [
        "VCS: dari kepala/lengan",
        "VCI: dari tubuh bawah",
        "Darah deoksigenasi masuk atrium kanan",
      ],
      color: "#0284c7",
      position: [-0.85, 0.55, -0.15],
      scale: [0.14, 0.45, 0.14],
      shape: "cylinder",
      rotation: [0.1, 0, 0],
    },
    {
      id: "pv",
      name: "Vena pulmonalis",
      nameLa: "Venae pulmonales",
      summary:
        "Mengembalikan darah beroksigen dari paru ke atrium kiri. Pada subset BodyParts3D ini vena pulmonalis diganti marker edukatif (mesh sumber tidak disertakan).",
      learningPoints: [
        "Biasanya empat vena pulmonalis",
        "Darah sudah beroksigen",
        "Masuk atrium kiri",
        "Marker merah muda = penanda pembelajaran, bukan mesh atlas lengkap",
      ],
      color: "#f43f5e",
      position: [0.9, 0.5, -0.2],
      scale: [0.14, 0.35, 0.14],
      shape: "cylinder",
      rotation: [0.2, 0, -0.35],
    },
  ],
};

export const ANATOMY_MODELS: AnatomyModel[] = [HEART_MODEL];

export function getAnatomyModel(id: string) {
  return ANATOMY_MODELS.find((m) => m.id === id) ?? null;
}

export const MEDICINE_MODULES: ScienceModuleCard[] = [
  {
    href: "/belajar/kedokteran/anatomi",
    track: "medicine",
    title: "Anatomy Explorer",
    text: "Eksplorasi jantung skematik 3D — ruang, pembuluh, dan hotspot.",
    status: "ready",
  },
  {
    href: "/belajar/kedokteran/fisiologi",
    track: "medicine",
    title: "Physiology Demo",
    text: "Siklus jantung: diastol → sistol → ejeksi (edukatif).",
    status: "ready",
  },
  {
    href: "/belajar/kedokteran/keterampilan",
    track: "medicine",
    title: "Clinical Skills Lab",
    text: "Auskultasi jantung: langkah A–P–T–M + kuis singkat.",
    status: "ready",
  },
];
