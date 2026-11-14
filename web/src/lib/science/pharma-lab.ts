/** Virtual Pharmaceutical Laboratory — alat & eksperimen edukatif. */

export type LabInstrument = {
  id: string;
  name: string;
  summary: string;
  use: string;
  conceptual?: boolean;
};

export type LabExperiment = {
  id: string;
  title: string;
  objective: string;
  theory: string;
  instruments: string[];
  steps: { title: string; text: string }[];
  /** Beer-Lambert: A = ε · c · l */
  kind: "beer-lambert" | "balance-demo" | "hplc-demo";
};

export const LAB_INSTRUMENTS: LabInstrument[] = [
  {
    id: "balance",
    name: "Timbangan analitik",
    summary: "Menimbang massa dengan resolusi tinggi (mis. 0,1 mg).",
    use: "Penimbangan baku & sampel sebelum pengenceran.",
  },
  {
    id: "pipette",
    name: "Pipet volumetrik / micropipet",
    summary: "Mengukur volume larutan secara akurat.",
    use: "Transfer alikuot ke kuvet atau labu ukur.",
  },
  {
    id: "uvvis",
    name: "Spektrofotometer UV-Vis",
    summary: "Mengukur absorbansi pada panjang gelombang tertentu.",
    use: "Kuantifikasi konsentrasi lewat hukum Beer–Lambert.",
  },
  {
    id: "hplc",
    name: "HPLC",
    summary: "Pemisahan & deteksi komponen dalam campuran.",
    use: "Analisis kadar & kemurnian (demo konseptual).",
    conceptual: true,
  },
  {
    id: "microscope",
    name: "Mikroskop",
    summary: "Pengamatan morfologi partikel atau sediaan.",
    use: "Inspeksi kristal / ukuran partikel (demo visual).",
    conceptual: true,
  },
];

export const LAB_EXPERIMENTS: LabExperiment[] = [
  {
    id: "uv-assay",
    title: "Penetapan kadar UV-Vis (Beer–Lambert)",
    objective: "Hitung konsentrasi sampel dari absorbansi terukur dengan baku ε dan path length.",
    theory:
      "Hukum Beer–Lambert: A = ε · c · ℓ. Dengan ε (L·mol⁻¹·cm⁻¹) dan ℓ (cm) diketahui, c = A / (ε · ℓ).",
    instruments: ["balance", "pipette", "uvvis"],
    steps: [
      { title: "Siapkan baku", text: "Larutan baku pada konsentrasi diketahui untuk verifikasi ε." },
      { title: "Ukur blanko", text: "Set nol spektrofotometer dengan pelarut." },
      { title: "Ukur sampel", text: "Catat absorbansi A pada λmax." },
      { title: "Hitung c", text: "c = A / (ε · ℓ). Bandingkan dengan target." },
    ],
    kind: "beer-lambert",
  },
  {
    id: "hplc-overview",
    title: "Pengenalan HPLC (konseptual)",
    objective: "Memahami alur: injeksi → kolom → detektor → kromatogram.",
    theory:
      "Waktu retensi membedakan senyawa; luas puncak berbanding dengan jumlah (dalam rentang linear).",
    instruments: ["hplc"],
    steps: [
      { title: "Injeksi", text: "Sampel masuk loop injektor." },
      { title: "Pemisahan", text: "Fasa gerak membawa analit melalui kolom." },
      { title: "Deteksi", text: "Detektor UV menghasilkan sinyal vs waktu." },
    ],
    kind: "hplc-demo",
  },
];

export const LAB_DISCLAIMER =
  "Laboratorium virtual edukatif. Bukan pengganti praktikum terkendali, bukan sertifikasi, dan tidak untuk analisis sampel pasien/klinis.";

export const LAB_SOURCE =
  "Beer–Lambert: A=εcl (standar kimia analit). HPLC ditampilkan sebagai diagram alur konseptual.";

export function concentrationFromAbsorbance(A: number, epsilon: number, pathCm: number) {
  if (epsilon <= 0 || pathCm <= 0) return 0;
  return A / (epsilon * pathCm);
}

export function absorbanceFromConcentration(c: number, epsilon: number, pathCm: number) {
  return epsilon * c * pathCm;
}
