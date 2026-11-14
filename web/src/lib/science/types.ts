/** Tipe shared modul Interactive Science Learning (client-safe). */

export type ScienceTrack = "chemistry" | "pharmacy" | "medicine";

export type MoleculeStyle = "ball-stick" | "spacefill" | "wireframe";

export type ElementSymbol =
  | "H"
  | "C"
  | "N"
  | "O"
  | "F"
  | "P"
  | "S"
  | "Cl"
  | "Br"
  | "I"
  | "Na"
  | "K"
  | "Ca"
  | "Fe"
  | "Zn"
  | "Mg";

export type MoleculeAtom = {
  id: string;
  element: ElementSymbol;
  /** Posisi relatif (Å), pusat di sekitar (0,0,0). */
  position: [number, number, number];
};

export type MoleculeBond = {
  id: string;
  from: string;
  to: string;
  order?: 1 | 2 | 3;
};

export type MoleculeDefinition = {
  id: string;
  name: string;
  formula: string;
  formulaHtml: string;
  molarMass: number;
  category: "inorganic" | "organic" | "drug-like";
  track: ScienceTrack;
  summary: string;
  learningPoints: string[];
  atoms: MoleculeAtom[];
  bonds: MoleculeBond[];
  /** Sumber data / atribusi ilmiah. */
  source: string;
  pubchemCid?: number;
};

export type ScienceModuleCard = {
  href: string;
  track: ScienceTrack;
  title: string;
  text: string;
  status: "ready" | "soon";
};
