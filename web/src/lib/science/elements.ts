import type { ElementSymbol } from "./types";

/** Warna CPK (approximated) untuk visualisasi edukatif. */
export const ELEMENT_META: Record<
  ElementSymbol,
  { name: string; color: string; radius: number; atomicNumber: number }
> = {
  H: { name: "Hidrogen", color: "#f8fafc", radius: 0.31, atomicNumber: 1 },
  C: { name: "Karbon", color: "#334155", radius: 0.76, atomicNumber: 6 },
  N: { name: "Nitrogen", color: "#2563eb", radius: 0.71, atomicNumber: 7 },
  O: { name: "Oksigen", color: "#dc2626", radius: 0.66, atomicNumber: 8 },
  F: { name: "Fluor", color: "#65a30d", radius: 0.57, atomicNumber: 9 },
  P: { name: "Fosfor", color: "#ea580c", radius: 1.07, atomicNumber: 15 },
  S: { name: "Belerang", color: "#eab308", radius: 1.05, atomicNumber: 16 },
  Cl: { name: "Klor", color: "#16a34a", radius: 1.02, atomicNumber: 17 },
  Br: { name: "Brom", color: "#a16207", radius: 1.2, atomicNumber: 35 },
  I: { name: "Iodin", color: "#7c3aed", radius: 1.39, atomicNumber: 53 },
  Na: { name: "Natrium", color: "#9333ea", radius: 1.66, atomicNumber: 11 },
  K: { name: "Kalium", color: "#7e22ce", radius: 2.03, atomicNumber: 19 },
  Ca: { name: "Kalsium", color: "#64748b", radius: 1.74, atomicNumber: 20 },
  Fe: { name: "Besi", color: "#b45309", radius: 1.32, atomicNumber: 26 },
  Zn: { name: "Seng", color: "#78716c", radius: 1.22, atomicNumber: 30 },
  Mg: { name: "Magnesium", color: "#0d9488", radius: 1.41, atomicNumber: 12 },
};
