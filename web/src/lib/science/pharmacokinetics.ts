/**
 * Farmakokinetika edukatif — model satu kompartemen.
 * Persamaan standar buku ajar (bukan dosis pasien).
 */

export type PkRoute = "iv" | "oral";

export type PkParams = {
  route: PkRoute;
  /** Dosis (mg). */
  doseMg: number;
  /** Volume distribusi V (L). */
  volumeL: number;
  /** Clearance Cl (L/h). */
  clearanceLh: number;
  /** Bioavailabilitas F (0–1), oral. */
  bioavailability: number;
  /** Konstanta absorpsi ka (1/h), oral. */
  ka: number;
};

export type PkPoint = { t: number; c: number };

export type AdmePhase = {
  id: "A" | "D" | "M" | "E";
  name: string;
  title: string;
  summary: string;
};

export const ADME_PHASES: AdmePhase[] = [
  {
    id: "A",
    name: "Absorption",
    title: "Absorpsi",
    summary:
      "Obat masuk ke sirkulasi sistemik dari tempat pemberian. Pada oral, laju sering dimodelkan orde-satu (ka).",
  },
  {
    id: "D",
    name: "Distribution",
    title: "Distribusi",
    summary:
      "Obat menyebar ke jaringan. Pada model 1-kompartemen, distribusi dianggap instan ke volume V.",
  },
  {
    id: "M",
    name: "Metabolism",
    title: "Metabolisme",
    summary:
      "Biotransformasi (sering hati). Bersama ekskresi membentuk eliminasi; di sini digabung ke clearance Cl.",
  },
  {
    id: "E",
    name: "Excretion",
    title: "Ekskresi",
    summary:
      "Pengeluaran obat (ginjal, dll.). Eliminasi orde-satu: kel = Cl / V; t½ = 0,693 / kel.",
  },
];

export const PK_DISCLAIMER =
  "Parameter dan kurva bersifat edukatif untuk memahami ADME. Bukan dosis terapi, bukan rekomendasi klinis, dan tidak untuk keputusan pasien.";

export const PK_SOURCE =
  "Model 1-kompartemen: IV bolus C(t)=(Dose/V)·e^(−kel·t); oral orde-satu C(t)=(F·Dose·ka)/(V·(ka−kel))·(e^(−kel·t)−e^(−ka·t)); kel=Cl/V.";

export const DEFAULT_PK: PkParams = {
  route: "oral",
  doseMg: 500,
  volumeL: 30,
  clearanceLh: 5,
  bioavailability: 0.8,
  ka: 1.2,
};

export function kelFrom(params: PkParams) {
  if (params.volumeL <= 0) return 0;
  return params.clearanceLh / params.volumeL;
}

export function halfLifeHours(params: PkParams) {
  const kel = kelFrom(params);
  if (kel <= 0) return Infinity;
  return Math.LN2 / kel;
}

/** Konsentrasi plasma (mg/L) pada waktu t (jam). */
export function concentrationAt(params: PkParams, tHours: number): number {
  if (tHours < 0) return 0;
  const { doseMg, volumeL, bioavailability: F, ka, route } = params;
  const kel = kelFrom(params);
  if (volumeL <= 0) return 0;

  if (route === "iv") {
    return (doseMg / volumeL) * Math.exp(-kel * tHours);
  }

  // Oral first-order absorption
  if (Math.abs(ka - kel) < 1e-6) {
    // Batas ka ≈ kel: C = (F·Dose·ka·t / V) · e^(−kel·t)
    return ((F * doseMg * ka * tHours) / volumeL) * Math.exp(-kel * tHours);
  }
  const coef = (F * doseMg * ka) / (volumeL * (ka - kel));
  return coef * (Math.exp(-kel * tHours) - Math.exp(-ka * tHours));
}

export function sampleCurve(params: PkParams, hours = 24, steps = 120): PkPoint[] {
  const out: PkPoint[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = (hours * i) / steps;
    out.push({ t, c: Math.max(0, concentrationAt(params, t)) });
  }
  return out;
}

export function findCmaxTmax(points: PkPoint[]): { cmax: number; tmax: number } {
  let cmax = 0;
  let tmax = 0;
  for (const p of points) {
    if (p.c > cmax) {
      cmax = p.c;
      tmax = p.t;
    }
  }
  return { cmax, tmax };
}

/** AUC trapezoid 0→t_last (mg·h/L). */
export function aucTrapezoid(points: PkPoint[]): number {
  let auc = 0;
  for (let i = 1; i < points.length; i++) {
    const dt = points[i].t - points[i - 1].t;
    auc += 0.5 * (points[i].c + points[i - 1].c) * dt;
  }
  return auc;
}

/**
 * Fase ADME yang ditonjolkan pada waktu t (edukatif, bukan partisi fisiologis ketat).
 * IV: A instan → D awal → M/E sepanjang eliminasi.
 * Oral: A saat naik ke Cmax → D sekitar puncak → M/E pada fase turun.
 */
export function admeEmphasis(params: PkParams, tHours: number, tmax: number): AdmePhase["id"][] {
  if (params.route === "iv") {
    if (tHours < 0.15) return ["A", "D"];
    if (tHours < halfLifeHours(params) * 0.5) return ["D", "M", "E"];
    return ["M", "E"];
  }
  if (tHours <= tmax * 0.85) return ["A", "D"];
  if (tHours <= tmax * 1.15) return ["D", "M"];
  return ["M", "E"];
}

export function formatNum(n: number, digits = 2) {
  if (!Number.isFinite(n)) return "—";
  if (n >= 100) return n.toFixed(1);
  if (n >= 10) return n.toFixed(digits);
  return n.toFixed(Math.max(digits, 3)).replace(/\.?0+$/, "") || "0";
}
