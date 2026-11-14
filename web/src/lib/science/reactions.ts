import type { MoleculeAtom, MoleculeBond, ScienceModuleCard } from "./types";

export type ReactionSpecies = {
  id: string;
  name: string;
  formula: string;
  formulaHtml: string;
  molarMass: number;
  atoms: MoleculeAtom[];
  bonds: MoleculeBond[];
};

export type ReactionSideItem = {
  speciesId: string;
  coefficient: number;
};

export type ChemicalReaction = {
  id: string;
  title: string;
  equationHtml: string;
  kind: "synthesis" | "combustion" | "industrial";
  summary: string;
  learningPoints: string[];
  /** Kondisi konseptual (bukan prosedur lab berbahaya). */
  conditions: string;
  reactants: ReactionSideItem[];
  products: ReactionSideItem[];
  source: string;
  /** true = visualisasi konseptual (bukan MD/quantum). */
  conceptual: boolean;
};

/** Spesies untuk visualisasi & stoikiometri. */
export const REACTION_SPECIES: Record<string, ReactionSpecies> = {
  h2: {
    id: "h2",
    name: "Hidrogen",
    formula: "H2",
    formulaHtml: "H<sub>2</sub>",
    molarMass: 2.016,
    atoms: [
      { id: "h1", element: "H", position: [-0.37, 0, 0] },
      { id: "h2", element: "H", position: [0.37, 0, 0] },
    ],
    bonds: [{ id: "b1", from: "h1", to: "h2", order: 1 }],
  },
  o2: {
    id: "o2",
    name: "Oksigen",
    formula: "O2",
    formulaHtml: "O<sub>2</sub>",
    molarMass: 31.998,
    atoms: [
      { id: "o1", element: "O", position: [-0.6, 0, 0] },
      { id: "o2", element: "O", position: [0.6, 0, 0] },
    ],
    bonds: [{ id: "b1", from: "o1", to: "o2", order: 2 }],
  },
  h2o: {
    id: "h2o",
    name: "Air",
    formula: "H2O",
    formulaHtml: "H<sub>2</sub>O",
    molarMass: 18.015,
    atoms: [
      { id: "o1", element: "O", position: [0, 0, 0] },
      { id: "h1", element: "H", position: [0.76, 0.59, 0] },
      { id: "h2", element: "H", position: [-0.76, 0.59, 0] },
    ],
    bonds: [
      { id: "b1", from: "o1", to: "h1", order: 1 },
      { id: "b2", from: "o1", to: "h2", order: 1 },
    ],
  },
  ch4: {
    id: "ch4",
    name: "Metana",
    formula: "CH4",
    formulaHtml: "CH<sub>4</sub>",
    molarMass: 16.04,
    atoms: [
      { id: "c1", element: "C", position: [0, 0, 0] },
      { id: "h1", element: "H", position: [0.63, 0.63, 0.63] },
      { id: "h2", element: "H", position: [-0.63, -0.63, 0.63] },
      { id: "h3", element: "H", position: [-0.63, 0.63, -0.63] },
      { id: "h4", element: "H", position: [0.63, -0.63, -0.63] },
    ],
    bonds: [
      { id: "b1", from: "c1", to: "h1", order: 1 },
      { id: "b2", from: "c1", to: "h2", order: 1 },
      { id: "b3", from: "c1", to: "h3", order: 1 },
      { id: "b4", from: "c1", to: "h4", order: 1 },
    ],
  },
  co2: {
    id: "co2",
    name: "Karbon dioksida",
    formula: "CO2",
    formulaHtml: "CO<sub>2</sub>",
    molarMass: 44.01,
    atoms: [
      { id: "c1", element: "C", position: [0, 0, 0] },
      { id: "o1", element: "O", position: [1.16, 0, 0] },
      { id: "o2", element: "O", position: [-1.16, 0, 0] },
    ],
    bonds: [
      { id: "b1", from: "c1", to: "o1", order: 2 },
      { id: "b2", from: "c1", to: "o2", order: 2 },
    ],
  },
  n2: {
    id: "n2",
    name: "Nitrogen",
    formula: "N2",
    formulaHtml: "N<sub>2</sub>",
    molarMass: 28.014,
    atoms: [
      { id: "n1", element: "N", position: [-0.55, 0, 0] },
      { id: "n2", element: "N", position: [0.55, 0, 0] },
    ],
    bonds: [{ id: "b1", from: "n1", to: "n2", order: 3 }],
  },
  nh3: {
    id: "nh3",
    name: "Amonia",
    formula: "NH3",
    formulaHtml: "NH<sub>3</sub>",
    molarMass: 17.031,
    atoms: [
      { id: "n1", element: "N", position: [0, 0.15, 0] },
      { id: "h1", element: "H", position: [0.94, -0.3, 0] },
      { id: "h2", element: "H", position: [-0.47, -0.3, 0.82] },
      { id: "h3", element: "H", position: [-0.47, -0.3, -0.82] },
    ],
    bonds: [
      { id: "b1", from: "n1", to: "h1", order: 1 },
      { id: "b2", from: "n1", to: "h2", order: 1 },
      { id: "b3", from: "n1", to: "h3", order: 1 },
    ],
  },
};

export const CHEMICAL_REACTIONS: ChemicalReaction[] = [
  {
    id: "water-formation",
    title: "Pembentukan air",
    equationHtml: "2 H<sub>2</sub> + O<sub>2</sub> → 2 H<sub>2</sub>O",
    kind: "synthesis",
    summary:
      "Reaksi pembentukan air dari hidrogen dan oksigen. Stoikiometri: 2 mol H₂ bereaksi dengan 1 mol O₂ menghasilkan 2 mol H₂O.",
    learningPoints: [
      "Koefisien menyeimbangkan atom H dan O di kedua sisi",
      "O₂ adalah reaktan; H₂O produk",
      "Perbandingan mol H₂ : O₂ : H₂O = 2 : 1 : 2",
    ],
    conditions: "Konseptual / pembakaran terkendali edukatif — jangan mencoba tanpa protokol keselamatan.",
    reactants: [
      { speciesId: "h2", coefficient: 2 },
      { speciesId: "o2", coefficient: 1 },
    ],
    products: [{ speciesId: "h2o", coefficient: 2 }],
    source: "Persamaan setara standar: 2 H₂ + O₂ → 2 H₂O.",
    conceptual: true,
  },
  {
    id: "methane-combustion",
    title: "Pembakaran metana",
    equationHtml: "CH<sub>4</sub> + 2 O<sub>2</sub> → CO<sub>2</sub> + 2 H<sub>2</sub>O",
    kind: "combustion",
    summary:
      "Pembakaran sempurna metana menghasilkan CO₂ dan H₂O. Satu mol CH₄ membutuhkan 2 mol O₂.",
    learningPoints: [
      "Pembakaran sempurna: produk CO₂ + H₂O",
      "Atom C, H, O seimbang di kedua sisi",
      "O₂ sering menjadi reaktan pembatas jika udara terbatas",
    ],
    conditions: "Model stoikiometri pembakaran sempurna (udara berlebih konseptual).",
    reactants: [
      { speciesId: "ch4", coefficient: 1 },
      { speciesId: "o2", coefficient: 2 },
    ],
    products: [
      { speciesId: "co2", coefficient: 1 },
      { speciesId: "h2o", coefficient: 2 },
    ],
    source: "Persamaan setara: CH₄ + 2 O₂ → CO₂ + 2 H₂O.",
    conceptual: true,
  },
  {
    id: "haber",
    title: "Sintesis amonia (Haber)",
    equationHtml: "N<sub>2</sub> + 3 H<sub>2</sub> → 2 NH<sub>3</sub>",
    kind: "industrial",
    summary:
      "Proses Haber: nitrogen dan hidrogen membentuk amonia. Rasio mol N₂ : H₂ : NH₃ = 1 : 3 : 2.",
    learningPoints: [
      "Industri: tekanan tinggi, katalis Fe, suhu terkendali",
      "Kesetimbangan dinamis (Le Chatelier) — di sini hanya stoikiometri ideal",
      "1 mol N₂ + 3 mol H₂ → 2 mol NH₃ (konversi ideal)",
    ],
    conditions: "Stoikiometri ideal; kesetimbangan & yield aktual tidak disimulasikan.",
    reactants: [
      { speciesId: "n2", coefficient: 1 },
      { speciesId: "h2", coefficient: 3 },
    ],
    products: [{ speciesId: "nh3", coefficient: 2 }],
    source: "Persamaan setara proses Haber: N₂ + 3 H₂ → 2 NH₃.",
    conceptual: true,
  },
];

export type StoichInput = {
  /** speciesId reaktan yang diisi pengguna */
  speciesId: string;
  moles: number;
};

export type StoichLine = {
  speciesId: string;
  role: "reactant" | "product";
  coefficient: number;
  moles: number;
  grams: number;
  isLimiting?: boolean;
};

export type StoichResult = {
  lines: StoichLine[];
  limitingSpeciesId: string;
  extent: number;
};

/** Hitung stoikiometri dari mol salah satu reaktan; cari reaktan pembatas jika semua diisi proporsional dari input tunggal + opsional override. */
export function computeStoichiometry(
  reaction: ChemicalReaction,
  input: StoichInput,
  /** Mol awal tiap reaktan; default: input + reaktan lain diasumsikan berlebih (1000×). */
  reactantMoles?: Record<string, number>
): StoichResult | null {
  if (!(input.moles > 0) || !Number.isFinite(input.moles)) return null;
  const reactantCoeff = Object.fromEntries(
    reaction.reactants.map((r) => [r.speciesId, r.coefficient])
  );
  if (!reactantCoeff[input.speciesId]) return null;

  const initial: Record<string, number> = {};
  for (const r of reaction.reactants) {
    if (reactantMoles && reactantMoles[r.speciesId] != null) {
      initial[r.speciesId] = reactantMoles[r.speciesId];
    } else if (r.speciesId === input.speciesId) {
      initial[r.speciesId] = input.moles;
    } else {
      // berlebih relatif
      initial[r.speciesId] = input.moles * 1000;
    }
  }

  let limitingId = reaction.reactants[0].speciesId;
  let extent = Infinity;
  for (const r of reaction.reactants) {
    const e = initial[r.speciesId] / r.coefficient;
    if (e < extent) {
      extent = e;
      limitingId = r.speciesId;
    }
  }

  const lines: StoichLine[] = [];
  for (const r of reaction.reactants) {
    const sp = REACTION_SPECIES[r.speciesId];
    const molesUsed = extent * r.coefficient;
    lines.push({
      speciesId: r.speciesId,
      role: "reactant",
      coefficient: r.coefficient,
      moles: molesUsed,
      grams: molesUsed * sp.molarMass,
      isLimiting: r.speciesId === limitingId,
    });
  }
  for (const p of reaction.products) {
    const sp = REACTION_SPECIES[p.speciesId];
    const moles = extent * p.coefficient;
    lines.push({
      speciesId: p.speciesId,
      role: "product",
      coefficient: p.coefficient,
      moles,
      grams: moles * sp.molarMass,
    });
  }

  return { lines, limitingSpeciesId: limitingId, extent };
}

export function getReaction(id: string) {
  return CHEMICAL_REACTIONS.find((r) => r.id === id) ?? null;
}

export function layoutSpeciesInstances(
  items: ReactionSideItem[],
  side: "left" | "right"
): { speciesId: string; offset: [number, number, number] }[] {
  const out: { speciesId: string; offset: [number, number, number] }[] = [];
  let i = 0;
  for (const item of items) {
    for (let c = 0; c < item.coefficient; c++) {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const xBase = side === "left" ? -2.2 : 2.2;
      out.push({
        speciesId: item.speciesId,
        offset: [xBase + col * 1.1, 1.1 - row * 1.35, 0],
      });
      i += 1;
    }
  }
  return out;
}

export const REACTION_MODULE_CARD: ScienceModuleCard = {
  href: "/belajar/kimia/reaksi",
  track: "chemistry",
  title: "Chemical Reaction Simulator",
  text: "Persamaan setara, stoikiometri, dan visualisasi konseptual.",
  status: "ready",
};
