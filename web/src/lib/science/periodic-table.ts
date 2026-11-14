/** Data tabel periodik (IUPAC-aligned, edukatif). Massa relatif ≈ standar. */

export type ElementCategory =
  | "alkali-metal"
  | "alkaline-earth"
  | "transition-metal"
  | "post-transition"
  | "metalloid"
  | "nonmetal"
  | "halogen"
  | "noble-gas"
  | "lanthanide"
  | "actinide"
  | "unknown";

export type PeriodicElement = {
  z: number;
  symbol: string;
  name: string;
  nameEn: string;
  mass: number;
  period: number;
  /** Golongan 1–18; null untuk La/Ac deret yang ditampilkan di baris terpisah. */
  group: number | null;
  category: ElementCategory;
  electronConfig: string;
  /** Posisi grid CSS (1-based). */
  col: number;
  row: number;
};

export const CATEGORY_LABEL: Record<ElementCategory, string> = {
  "alkali-metal": "Logam alkali",
  "alkaline-earth": "Alkali tanah",
  "transition-metal": "Logam transisi",
  "post-transition": "Logam pasca-transisi",
  metalloid: "Metaloid",
  nonmetal: "Nonlogam",
  halogen: "Halogen",
  "noble-gas": "Gas mulia",
  lanthanide: "Lantanida",
  actinide: "Aktinida",
  unknown: "Belum dikonfirmasi",
};

export const CATEGORY_COLOR: Record<ElementCategory, string> = {
  "alkali-metal": "#fca5a5",
  "alkaline-earth": "#fdba74",
  "transition-metal": "#fde68a",
  "post-transition": "#a5b4fc",
  metalloid: "#86efac",
  nonmetal: "#7dd3fc",
  halogen: "#c4b5fd",
  "noble-gas": "#f9a8d4",
  lanthanide: "#fcd34d",
  actinide: "#fbbf24",
  unknown: "#cbd5e1",
};

/** Semua unsur 1–118 dengan posisi tabel standar. */
export const PERIODIC_ELEMENTS: PeriodicElement[] = [
  // Period 1
  e(1, "H", "Hidrogen", "Hydrogen", 1.008, 1, 1, "nonmetal", "1s¹", 1, 1),
  e(2, "He", "Helium", "Helium", 4.0026, 1, 18, "noble-gas", "1s²", 18, 1),
  // Period 2
  e(3, "Li", "Litium", "Lithium", 6.94, 2, 1, "alkali-metal", "[He] 2s¹", 1, 2),
  e(4, "Be", "Berilium", "Beryllium", 9.0122, 2, 2, "alkaline-earth", "[He] 2s²", 2, 2),
  e(5, "B", "Boron", "Boron", 10.81, 2, 13, "metalloid", "[He] 2s² 2p¹", 13, 2),
  e(6, "C", "Karbon", "Carbon", 12.011, 2, 14, "nonmetal", "[He] 2s² 2p²", 14, 2),
  e(7, "N", "Nitrogen", "Nitrogen", 14.007, 2, 15, "nonmetal", "[He] 2s² 2p³", 15, 2),
  e(8, "O", "Oksigen", "Oxygen", 15.999, 2, 16, "nonmetal", "[He] 2s² 2p⁴", 16, 2),
  e(9, "F", "Fluor", "Fluorine", 18.998, 2, 17, "halogen", "[He] 2s² 2p⁵", 17, 2),
  e(10, "Ne", "Neon", "Neon", 20.18, 2, 18, "noble-gas", "[He] 2s² 2p⁶", 18, 2),
  // Period 3
  e(11, "Na", "Natrium", "Sodium", 22.99, 3, 1, "alkali-metal", "[Ne] 3s¹", 1, 3),
  e(12, "Mg", "Magnesium", "Magnesium", 24.305, 3, 2, "alkaline-earth", "[Ne] 3s²", 2, 3),
  e(13, "Al", "Aluminium", "Aluminium", 26.982, 3, 13, "post-transition", "[Ne] 3s² 3p¹", 13, 3),
  e(14, "Si", "Silikon", "Silicon", 28.085, 3, 14, "metalloid", "[Ne] 3s² 3p²", 14, 3),
  e(15, "P", "Fosfor", "Phosphorus", 30.974, 3, 15, "nonmetal", "[Ne] 3s² 3p³", 15, 3),
  e(16, "S", "Belerang", "Sulfur", 32.06, 3, 16, "nonmetal", "[Ne] 3s² 3p⁴", 16, 3),
  e(17, "Cl", "Klor", "Chlorine", 35.45, 3, 17, "halogen", "[Ne] 3s² 3p⁵", 17, 3),
  e(18, "Ar", "Argon", "Argon", 39.948, 3, 18, "noble-gas", "[Ne] 3s² 3p⁶", 18, 3),
  // Period 4
  e(19, "K", "Kalium", "Potassium", 39.098, 4, 1, "alkali-metal", "[Ar] 4s¹", 1, 4),
  e(20, "Ca", "Kalsium", "Calcium", 40.078, 4, 2, "alkaline-earth", "[Ar] 4s²", 2, 4),
  e(21, "Sc", "Skandium", "Scandium", 44.956, 4, 3, "transition-metal", "[Ar] 3d¹ 4s²", 3, 4),
  e(22, "Ti", "Titanium", "Titanium", 47.867, 4, 4, "transition-metal", "[Ar] 3d² 4s²", 4, 4),
  e(23, "V", "Vanadium", "Vanadium", 50.942, 4, 5, "transition-metal", "[Ar] 3d³ 4s²", 5, 4),
  e(24, "Cr", "Kromium", "Chromium", 51.996, 4, 6, "transition-metal", "[Ar] 3d⁵ 4s¹", 6, 4),
  e(25, "Mn", "Mangan", "Manganese", 54.938, 4, 7, "transition-metal", "[Ar] 3d⁵ 4s²", 7, 4),
  e(26, "Fe", "Besi", "Iron", 55.845, 4, 8, "transition-metal", "[Ar] 3d⁶ 4s²", 8, 4),
  e(27, "Co", "Kobalt", "Cobalt", 58.933, 4, 9, "transition-metal", "[Ar] 3d⁷ 4s²", 9, 4),
  e(28, "Ni", "Nikel", "Nickel", 58.693, 4, 10, "transition-metal", "[Ar] 3d⁸ 4s²", 10, 4),
  e(29, "Cu", "Tembaga", "Copper", 63.546, 4, 11, "transition-metal", "[Ar] 3d¹⁰ 4s¹", 11, 4),
  e(30, "Zn", "Seng", "Zinc", 65.38, 4, 12, "transition-metal", "[Ar] 3d¹⁰ 4s²", 12, 4),
  e(31, "Ga", "Galium", "Gallium", 69.723, 4, 13, "post-transition", "[Ar] 3d¹⁰ 4s² 4p¹", 13, 4),
  e(32, "Ge", "Germanium", "Germanium", 72.63, 4, 14, "metalloid", "[Ar] 3d¹⁰ 4s² 4p²", 14, 4),
  e(33, "As", "Arsen", "Arsenic", 74.922, 4, 15, "metalloid", "[Ar] 3d¹⁰ 4s² 4p³", 15, 4),
  e(34, "Se", "Selenium", "Selenium", 78.971, 4, 16, "nonmetal", "[Ar] 3d¹⁰ 4s² 4p⁴", 16, 4),
  e(35, "Br", "Brom", "Bromine", 79.904, 4, 17, "halogen", "[Ar] 3d¹⁰ 4s² 4p⁵", 17, 4),
  e(36, "Kr", "Kripton", "Krypton", 83.798, 4, 18, "noble-gas", "[Ar] 3d¹⁰ 4s² 4p⁶", 18, 4),
  // Period 5
  e(37, "Rb", "Rubidium", "Rubidium", 85.468, 5, 1, "alkali-metal", "[Kr] 5s¹", 1, 5),
  e(38, "Sr", "Strontium", "Strontium", 87.62, 5, 2, "alkaline-earth", "[Kr] 5s²", 2, 5),
  e(39, "Y", "Itrium", "Yttrium", 88.906, 5, 3, "transition-metal", "[Kr] 4d¹ 5s²", 3, 5),
  e(40, "Zr", "Zirkonium", "Zirconium", 91.224, 5, 4, "transition-metal", "[Kr] 4d² 5s²", 4, 5),
  e(41, "Nb", "Niobium", "Niobium", 92.906, 5, 5, "transition-metal", "[Kr] 4d⁴ 5s¹", 5, 5),
  e(42, "Mo", "Molibdenum", "Molybdenum", 95.95, 5, 6, "transition-metal", "[Kr] 4d⁵ 5s¹", 6, 5),
  e(43, "Tc", "Teknesium", "Technetium", 98, 5, 7, "transition-metal", "[Kr] 4d⁵ 5s²", 7, 5),
  e(44, "Ru", "Rutenium", "Ruthenium", 101.07, 5, 8, "transition-metal", "[Kr] 4d⁷ 5s¹", 8, 5),
  e(45, "Rh", "Rodium", "Rhodium", 102.91, 5, 9, "transition-metal", "[Kr] 4d⁸ 5s¹", 9, 5),
  e(46, "Pd", "Paladium", "Palladium", 106.42, 5, 10, "transition-metal", "[Kr] 4d¹⁰", 10, 5),
  e(47, "Ag", "Perak", "Silver", 107.87, 5, 11, "transition-metal", "[Kr] 4d¹⁰ 5s¹", 11, 5),
  e(48, "Cd", "Kadmium", "Cadmium", 112.41, 5, 12, "transition-metal", "[Kr] 4d¹⁰ 5s²", 12, 5),
  e(49, "In", "Indium", "Indium", 114.82, 5, 13, "post-transition", "[Kr] 4d¹⁰ 5s² 5p¹", 13, 5),
  e(50, "Sn", "Timah", "Tin", 118.71, 5, 14, "post-transition", "[Kr] 4d¹⁰ 5s² 5p²", 14, 5),
  e(51, "Sb", "Antimon", "Antimony", 121.76, 5, 15, "metalloid", "[Kr] 4d¹⁰ 5s² 5p³", 15, 5),
  e(52, "Te", "Telurium", "Tellurium", 127.6, 5, 16, "metalloid", "[Kr] 4d¹⁰ 5s² 5p⁴", 16, 5),
  e(53, "I", "Iodin", "Iodine", 126.9, 5, 17, "halogen", "[Kr] 4d¹⁰ 5s² 5p⁵", 17, 5),
  e(54, "Xe", "Xenon", "Xenon", 131.29, 5, 18, "noble-gas", "[Kr] 4d¹⁰ 5s² 5p⁶", 18, 5),
  // Period 6 (main) — La placeholder at group 3, lanthanides below
  e(55, "Cs", "Sesium", "Caesium", 132.91, 6, 1, "alkali-metal", "[Xe] 6s¹", 1, 6),
  e(56, "Ba", "Barium", "Barium", 137.33, 6, 2, "alkaline-earth", "[Xe] 6s²", 2, 6),
  e(57, "La", "Lantanum", "Lanthanum", 138.91, 6, 3, "lanthanide", "[Xe] 5d¹ 6s²", 3, 6),
  e(72, "Hf", "Hafnium", "Hafnium", 178.49, 6, 4, "transition-metal", "[Xe] 4f¹⁴ 5d² 6s²", 4, 6),
  e(73, "Ta", "Tantalum", "Tantalum", 180.95, 6, 5, "transition-metal", "[Xe] 4f¹⁴ 5d³ 6s²", 5, 6),
  e(74, "W", "Wolfram", "Tungsten", 183.84, 6, 6, "transition-metal", "[Xe] 4f¹⁴ 5d⁴ 6s²", 6, 6),
  e(75, "Re", "Renium", "Rhenium", 186.21, 6, 7, "transition-metal", "[Xe] 4f¹⁴ 5d⁵ 6s²", 7, 6),
  e(76, "Os", "Osmium", "Osmium", 190.23, 6, 8, "transition-metal", "[Xe] 4f¹⁴ 5d⁶ 6s²", 8, 6),
  e(77, "Ir", "Iridium", "Iridium", 192.22, 6, 9, "transition-metal", "[Xe] 4f¹⁴ 5d⁷ 6s²", 9, 6),
  e(78, "Pt", "Platina", "Platinum", 195.08, 6, 10, "transition-metal", "[Xe] 4f¹⁴ 5d⁹ 6s¹", 10, 6),
  e(79, "Au", "Emas", "Gold", 196.97, 6, 11, "transition-metal", "[Xe] 4f¹⁴ 5d¹⁰ 6s¹", 11, 6),
  e(80, "Hg", "Raksa", "Mercury", 200.59, 6, 12, "transition-metal", "[Xe] 4f¹⁴ 5d¹⁰ 6s²", 12, 6),
  e(81, "Tl", "Talium", "Thallium", 204.38, 6, 13, "post-transition", "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p¹", 13, 6),
  e(82, "Pb", "Timbal", "Lead", 207.2, 6, 14, "post-transition", "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p²", 14, 6),
  e(83, "Bi", "Bismut", "Bismuth", 208.98, 6, 15, "post-transition", "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p³", 15, 6),
  e(84, "Po", "Polonium", "Polonium", 209, 6, 16, "post-transition", "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁴", 16, 6),
  e(85, "At", "Astatin", "Astatine", 210, 6, 17, "halogen", "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁵", 17, 6),
  e(86, "Rn", "Radon", "Radon", 222, 6, 18, "noble-gas", "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁶", 18, 6),
  // Period 7 (main)
  e(87, "Fr", "Fransium", "Francium", 223, 7, 1, "alkali-metal", "[Rn] 7s¹", 1, 7),
  e(88, "Ra", "Radium", "Radium", 226, 7, 2, "alkaline-earth", "[Rn] 7s²", 2, 7),
  e(89, "Ac", "Aktinium", "Actinium", 227, 7, 3, "actinide", "[Rn] 6d¹ 7s²", 3, 7),
  e(104, "Rf", "Ruterfordium", "Rutherfordium", 267, 7, 4, "transition-metal", "[Rn] 5f¹⁴ 6d² 7s²", 4, 7),
  e(105, "Db", "Dubnium", "Dubnium", 268, 7, 5, "transition-metal", "[Rn] 5f¹⁴ 6d³ 7s²", 5, 7),
  e(106, "Sg", "Seaborgium", "Seaborgium", 269, 7, 6, "transition-metal", "[Rn] 5f¹⁴ 6d⁴ 7s²", 6, 7),
  e(107, "Bh", "Bohrium", "Bohrium", 270, 7, 7, "transition-metal", "[Rn] 5f¹⁴ 6d⁵ 7s²", 7, 7),
  e(108, "Hs", "Hassium", "Hassium", 269, 7, 8, "transition-metal", "[Rn] 5f¹⁴ 6d⁶ 7s²", 8, 7),
  e(109, "Mt", "Meitnerium", "Meitnerium", 278, 7, 9, "unknown", "[Rn] 5f¹⁴ 6d⁷ 7s²", 9, 7),
  e(110, "Ds", "Darmstadtium", "Darmstadtium", 281, 7, 10, "unknown", "[Rn] 5f¹⁴ 6d⁸ 7s²", 10, 7),
  e(111, "Rg", "Roentgenium", "Roentgenium", 282, 7, 11, "unknown", "[Rn] 5f¹⁴ 6d⁹ 7s²", 11, 7),
  e(112, "Cn", "Kopernisium", "Copernicium", 285, 7, 12, "transition-metal", "[Rn] 5f¹⁴ 6d¹⁰ 7s²", 12, 7),
  e(113, "Nh", "Nihonium", "Nihonium", 286, 7, 13, "unknown", "[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p¹", 13, 7),
  e(114, "Fl", "Flerovium", "Flerovium", 289, 7, 14, "post-transition", "[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p²", 14, 7),
  e(115, "Mc", "Moskovium", "Moscovium", 290, 7, 15, "unknown", "[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p³", 15, 7),
  e(116, "Lv", "Livermorium", "Livermorium", 293, 7, 16, "unknown", "[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁴", 16, 7),
  e(117, "Ts", "Tennessine", "Tennessine", 294, 7, 17, "halogen", "[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁵", 17, 7),
  e(118, "Og", "Oganesson", "Oganesson", 294, 7, 18, "noble-gas", "[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁶", 18, 7),
  // Lanthanides row 9 (display), cols 4–17 (Ce–Lu); La already at (3,6)
  e(58, "Ce", "Serium", "Cerium", 140.12, 6, null, "lanthanide", "[Xe] 4f¹ 5d¹ 6s²", 4, 9),
  e(59, "Pr", "Praseodimium", "Praseodymium", 140.91, 6, null, "lanthanide", "[Xe] 4f³ 6s²", 5, 9),
  e(60, "Nd", "Neodimium", "Neodymium", 144.24, 6, null, "lanthanide", "[Xe] 4f⁴ 6s²", 6, 9),
  e(61, "Pm", "Prometium", "Promethium", 145, 6, null, "lanthanide", "[Xe] 4f⁵ 6s²", 7, 9),
  e(62, "Sm", "Samarium", "Samarium", 150.36, 6, null, "lanthanide", "[Xe] 4f⁶ 6s²", 8, 9),
  e(63, "Eu", "Europium", "Europium", 151.96, 6, null, "lanthanide", "[Xe] 4f⁷ 6s²", 9, 9),
  e(64, "Gd", "Gadolinium", "Gadolinium", 157.25, 6, null, "lanthanide", "[Xe] 4f⁷ 5d¹ 6s²", 10, 9),
  e(65, "Tb", "Terbium", "Terbium", 158.93, 6, null, "lanthanide", "[Xe] 4f⁹ 6s²", 11, 9),
  e(66, "Dy", "Disprosium", "Dysprosium", 162.5, 6, null, "lanthanide", "[Xe] 4f¹⁰ 6s²", 12, 9),
  e(67, "Ho", "Holmium", "Holmium", 164.93, 6, null, "lanthanide", "[Xe] 4f¹¹ 6s²", 13, 9),
  e(68, "Er", "Erbium", "Erbium", 167.26, 6, null, "lanthanide", "[Xe] 4f¹² 6s²", 14, 9),
  e(69, "Tm", "Tulium", "Thulium", 168.93, 6, null, "lanthanide", "[Xe] 4f¹³ 6s²", 15, 9),
  e(70, "Yb", "Iterbium", "Ytterbium", 173.05, 6, null, "lanthanide", "[Xe] 4f¹⁴ 6s²", 16, 9),
  e(71, "Lu", "Lutesium", "Lutetium", 174.97, 6, null, "lanthanide", "[Xe] 4f¹⁴ 5d¹ 6s²", 17, 9),
  // Actinides row 10
  e(90, "Th", "Torium", "Thorium", 232.04, 7, null, "actinide", "[Rn] 6d² 7s²", 4, 10),
  e(91, "Pa", "Protaktinium", "Protactinium", 231.04, 7, null, "actinide", "[Rn] 5f² 6d¹ 7s²", 5, 10),
  e(92, "U", "Uranium", "Uranium", 238.03, 7, null, "actinide", "[Rn] 5f³ 6d¹ 7s²", 6, 10),
  e(93, "Np", "Neptunium", "Neptunium", 237, 7, null, "actinide", "[Rn] 5f⁴ 6d¹ 7s²", 7, 10),
  e(94, "Pu", "Plutonium", "Plutonium", 244, 7, null, "actinide", "[Rn] 5f⁶ 7s²", 8, 10),
  e(95, "Am", "Amerisium", "Americium", 243, 7, null, "actinide", "[Rn] 5f⁷ 7s²", 9, 10),
  e(96, "Cm", "Curium", "Curium", 247, 7, null, "actinide", "[Rn] 5f⁷ 6d¹ 7s²", 10, 10),
  e(97, "Bk", "Berkelium", "Berkelium", 247, 7, null, "actinide", "[Rn] 5f⁹ 7s²", 11, 10),
  e(98, "Cf", "Kalifornium", "Californium", 251, 7, null, "actinide", "[Rn] 5f¹⁰ 7s²", 12, 10),
  e(99, "Es", "Einsteinium", "Einsteinium", 252, 7, null, "actinide", "[Rn] 5f¹¹ 7s²", 13, 10),
  e(100, "Fm", "Fermium", "Fermium", 257, 7, null, "actinide", "[Rn] 5f¹² 7s²", 14, 10),
  e(101, "Md", "Mendelevium", "Mendelevium", 258, 7, null, "actinide", "[Rn] 5f¹³ 7s²", 15, 10),
  e(102, "No", "Nobelium", "Nobelium", 259, 7, null, "actinide", "[Rn] 5f¹⁴ 7s²", 16, 10),
  e(103, "Lr", "Lawrensium", "Lawrencium", 266, 7, null, "actinide", "[Rn] 5f¹⁴ 7s² 7p¹", 17, 10),
];

function e(
  z: number,
  symbol: string,
  name: string,
  nameEn: string,
  mass: number,
  period: number,
  group: number | null,
  category: ElementCategory,
  electronConfig: string,
  col: number,
  row: number
): PeriodicElement {
  return { z, symbol, name, nameEn, mass, period, group, category, electronConfig, col, row };
}

export function getElementByZ(z: number) {
  return PERIODIC_ELEMENTS.find((el) => el.z === z) ?? null;
}

export function getElementBySymbol(symbol: string) {
  const s = symbol.trim();
  return PERIODIC_ELEMENTS.find((el) => el.symbol.toLowerCase() === s.toLowerCase()) ?? null;
}

export function searchElements(query: string): PeriodicElement[] {
  const q = query.trim().toLowerCase();
  if (!q) return PERIODIC_ELEMENTS;
  return PERIODIC_ELEMENTS.filter(
    (el) =>
      el.symbol.toLowerCase() === q ||
      el.name.toLowerCase().includes(q) ||
      el.nameEn.toLowerCase().includes(q) ||
      String(el.z) === q
  );
}

/** Ringkasan edukatif singkat per kategori. */
export function categoryBlurb(category: ElementCategory): string {
  switch (category) {
    case "alkali-metal":
      return "Sangat reaktif, satu elektron valensi (ns¹). Mudah membentuk kation +1.";
    case "alkaline-earth":
      return "Dua elektron valensi (ns²). Membentuk kation +2; kurang reaktif dibanding alkali.";
    case "transition-metal":
      return "Orbital d terisi sebagian. Sering berwarna, katalis, dan memiliki bilangan oksidasi bervariasi.";
    case "post-transition":
      return "Logam di kanan blok-d; umumnya lebih lunak dan cenderung membentuk kation dengan orbital p.";
    case "metalloid":
      return "Sifat antara logam dan nonlogam; banyak dipakai sebagai semikonduktor.";
    case "nonmetal":
      return "Tidak menghantarkan listrik dengan baik; membentuk molekul kovalen atau anion.";
    case "halogen":
      return "Golongan 17 (ns² np⁵). Sangat elektronegatif; mudah membentuk garam dengan logam.";
    case "noble-gas":
      return "Konfigurasi oktet stabil (kecuali He). Reaktivitas sangat rendah pada kondisi biasa.";
    case "lanthanide":
      return "Blok-f periode 6. Sering disebut logam tanah jarang; penting untuk magnet dan fosfor.";
    case "actinide":
      return "Blok-f periode 7. Banyak radioaktif; uranium & plutonium relevan untuk energi nuklir.";
    default:
      return "Sifat kimia unsur superberat masih diteliti; data sering berdasarkan prediksi.";
  }
}
