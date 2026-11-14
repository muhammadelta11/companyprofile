import type { MoleculeDefinition, ScienceModuleCard } from "./types";

/**
 * Katalog molekul seed (koordinat Å, geometri edukatif).
 * Sumber konsep: struktur standar / PubChem CID.
 */
export const MOLECULES: MoleculeDefinition[] = [
  {
    id: "h2o",
    name: "Air",
    formula: "H2O",
    formulaHtml: "H<sub>2</sub>O",
    molarMass: 18.015,
    category: "inorganic",
    track: "chemistry",
    summary:
      "Molekul air berbentuk sudut (≈104,5°) dengan oksigen di pusat dan dua atom hidrogen. Polaritas ini mendasari banyak sifat kimia dan biologis.",
    learningPoints: [
      "Geometri molekul: bent / V-shape",
      "Ikatan kovalen polar O–H",
      "Dasar pelarut universal dalam kimia & farmasi",
    ],
    atoms: [
      { id: "o1", element: "O", position: [0, 0, 0] },
      { id: "h1", element: "H", position: [0.76, 0.59, 0] },
      { id: "h2", element: "H", position: [-0.76, 0.59, 0] },
    ],
    bonds: [
      { id: "b1", from: "o1", to: "h1", order: 1 },
      { id: "b2", from: "o1", to: "h2", order: 1 },
    ],
    source: "Struktur geometri standar H₂O (sudut ikatan ≈104,5°). PubChem CID 962.",
    pubchemCid: 962,
  },
  {
    id: "co2",
    name: "Karbon dioksida",
    formula: "CO2",
    formulaHtml: "CO<sub>2</sub>",
    molarMass: 44.01,
    category: "inorganic",
    track: "chemistry",
    summary:
      "Molekul linear O=C=O. Penting dalam kesetimbangan asam-basa, respirasi, dan banyak proses industri.",
    learningPoints: [
      "Geometri linear 180°",
      "Ikatan rangkap dua karbon–oksigen",
      "Molekul nonpolar secara keseluruhan",
    ],
    atoms: [
      { id: "c1", element: "C", position: [0, 0, 0] },
      { id: "o1", element: "O", position: [1.16, 0, 0] },
      { id: "o2", element: "O", position: [-1.16, 0, 0] },
    ],
    bonds: [
      { id: "b1", from: "c1", to: "o1", order: 2 },
      { id: "b2", from: "c1", to: "o2", order: 2 },
    ],
    source: "Geometri linear CO₂. PubChem CID 280.",
    pubchemCid: 280,
  },
  {
    id: "ch4",
    name: "Metana",
    formula: "CH4",
    formulaHtml: "CH<sub>4</sub>",
    molarMass: 16.04,
    category: "organic",
    track: "chemistry",
    summary:
      "Hidrokarbon paling sederhana dengan geometri tetrahedral. Dasar pemahaman stereokimia dan senyawa organik.",
    learningPoints: [
      "Geometri tetrahedral ≈109,5°",
      "Empat ikatan C–H setara",
      "Contoh alkana sederhana",
    ],
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
    source: "Geometri tetrahedral CH₄. PubChem CID 297.",
    pubchemCid: 297,
  },
  {
    id: "nh3",
    name: "Amonia",
    formula: "NH3",
    formulaHtml: "NH<sub>3</sub>",
    molarMass: 17.031,
    category: "inorganic",
    track: "chemistry",
    summary:
      "Molekul piramidal trigonal dengan pasangan elektron bebas pada nitrogen. Relevan untuk basa Lewis dan farmasi basa lemah.",
    learningPoints: [
      "Geometri trigonal pyramidal",
      "Pasangan elektron bebas pada N",
      "Dasar konsep basa Lewis",
    ],
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
    source: "Geometri NH₃ (trigonal pyramidal). PubChem CID 222.",
    pubchemCid: 222,
  },
  {
    id: "c2h5oh",
    name: "Etanol",
    formula: "C2H5OH",
    formulaHtml: "C<sub>2</sub>H<sub>5</sub>OH",
    molarMass: 46.07,
    category: "organic",
    track: "pharmacy",
    summary:
      "Alkohol sederhana dengan gugus hidroksil. Banyak dipakai sebagai pelarut farmasi dan contoh ADME sederhana.",
    learningPoints: [
      "Gugus fungsi –OH",
      "Molekul polar yang larut air",
      "Contoh eksipien / pelarut farmasi",
    ],
    atoms: [
      { id: "c1", element: "C", position: [-0.75, 0, 0] },
      { id: "c2", element: "C", position: [0.75, 0, 0] },
      { id: "o1", element: "O", position: [1.55, 1.1, 0] },
      { id: "h1", element: "H", position: [-1.2, 0.9, 0.5] },
      { id: "h2", element: "H", position: [-1.2, -0.9, 0.5] },
      { id: "h3", element: "H", position: [-1.1, 0, -1] },
      { id: "h4", element: "H", position: [1.15, -0.9, 0.6] },
      { id: "h5", element: "H", position: [1.15, -0.2, -1] },
      { id: "ho", element: "H", position: [2.45, 0.9, 0] },
    ],
    bonds: [
      { id: "b1", from: "c1", to: "c2", order: 1 },
      { id: "b2", from: "c2", to: "o1", order: 1 },
      { id: "b3", from: "o1", to: "ho", order: 1 },
      { id: "b4", from: "c1", to: "h1", order: 1 },
      { id: "b5", from: "c1", to: "h2", order: 1 },
      { id: "b6", from: "c1", to: "h3", order: 1 },
      { id: "b7", from: "c2", to: "h4", order: 1 },
      { id: "b8", from: "c2", to: "h5", order: 1 },
    ],
    source: "Geometri edukatif etanol. PubChem CID 702.",
    pubchemCid: 702,
  },
];

export function getMolecule(id: string) {
  return MOLECULES.find((m) => m.id === id) ?? null;
}

export function listMolecules(track?: MoleculeDefinition["track"]) {
  if (!track) return MOLECULES;
  return MOLECULES.filter((m) => m.track === track || m.track === "chemistry");
}

export const SCIENCE_MODULES: ScienceModuleCard[] = [
  {
    href: "/belajar/kimia/molekul",
    track: "chemistry",
    title: "Molecular 3D Explorer",
    text: "Putar, perbesar, dan pelajari struktur molekul (H₂O, CO₂, CH₄, …).",
    status: "ready",
  },
  {
    href: "/belajar/kimia/tabel-periodik",
    track: "chemistry",
    title: "Interactive Periodic Table",
    text: "118 unsur: nomor atom, massa, golongan, konfigurasi elektron.",
    status: "ready",
  },
  {
    href: "/belajar/kimia/reaksi",
    track: "chemistry",
    title: "Chemical Reaction Simulator",
    text: "Persamaan setara, stoikiometri, dan visualisasi konseptual.",
    status: "ready",
  },
  {
    href: "/belajar/farmasi/farmakokinetika",
    track: "pharmacy",
    title: "Pharmacokinetics Simulator",
    text: "ADME + kurva C–t model 1-kompartemen (oral/IV).",
    status: "ready",
  },
  {
    href: "/belajar/farmasi/formulasi",
    track: "pharmacy",
    title: "Pharmaceutical Formulation Lab",
    text: "Sediaan, eksipien, kompresi tablet, dan disolusi.",
    status: "ready",
  },
  {
    href: "/belajar/farmasi/lab-virtual",
    track: "pharmacy",
    title: "Virtual Pharmaceutical Laboratory",
    text: "Alat lab + UV-Vis Beer–Lambert & demo HPLC.",
    status: "ready",
  },
];
