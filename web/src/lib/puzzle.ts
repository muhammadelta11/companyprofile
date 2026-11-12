/** Sliding puzzle — level, gamifikasi, skor, shuffle solvable. */

export type PuzzleLevelId = "mudah" | "sedang" | "sulit";
export type PuzzleMode = "gambar" | "angka";

export type PuzzleLevel = {
  id: PuzzleLevelId;
  label: string;
  size: 3 | 4 | 5;
  /** Nama gelar gamifikasi di level ini */
  title: string;
  badge: string;
  multiplier: number;
  xpBase: number;
  /** Ambang detik untuk 3★ / 2★ / 1★ */
  starTimes: [number, number, number];
  /** Fitur gamifikasi yang ditampilkan di UI level */
  perks: string[];
  blurb: string;
  accent: string;
};

export const PUZZLE_LEVELS: PuzzleLevel[] = [
  {
    id: "mudah",
    label: "Mudah",
    size: 3,
    title: "Pemula Gesit",
    badge: "pemula-gesit",
    multiplier: 1,
    xpBase: 80,
    starTimes: [25, 50, 90],
    perks: ["Hint 1× per run", "Bintang gampang", "XP dasar"],
    blurb: "Pemanasan 3×3. Kuasai pola, kumpulkan bintang.",
    accent: "#0f766e",
  },
  {
    id: "sedang",
    label: "Sedang",
    size: 4,
    title: "Penyusun Tangguh",
    badge: "penyusun-tangguh",
    multiplier: 1.6,
    xpBase: 140,
    starTimes: [70, 140, 240],
    perks: ["Bonus streak harian", "XP 1,6×", "Badge Tangguh"],
    blurb: "4×4 — keseimbangan refleks dan strategi.",
    accent: "#1d4ed8",
  },
  {
    id: "sulit",
    label: "Sulit",
    size: 5,
    title: "Master Puzzle",
    badge: "master-puzzle",
    multiplier: 2.5,
    xpBase: 220,
    starTimes: [150, 300, 480],
    perks: ["XP 2,5×", "Elite mingguan", "Badge Master"],
    blurb: "5×5 untuk pejuang papan peringkat.",
    accent: "#b45309",
  },
];

export function getPuzzleLevel(id: PuzzleLevelId) {
  return PUZZLE_LEVELS.find((l) => l.id === id) ?? PUZZLE_LEVELS[0];
}

/** Tile index 0..n²-2 = isi, n²-1 = kosong. */
export function createSolved(size: number) {
  return Array.from({ length: size * size }, (_, i) => i);
}

function inversionCount(tiles: number[], blank: number) {
  const arr = tiles.filter((t) => t !== blank);
  let inv = 0;
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[i] > arr[j]) inv++;
    }
  }
  return inv;
}

export function isSolvable(tiles: number[], size: number) {
  const blank = size * size - 1;
  const inv = inversionCount(tiles, blank);
  if (size % 2 === 1) return inv % 2 === 0;
  const blankRowFromBottom = size - Math.floor(tiles.indexOf(blank) / size);
  return (inv + blankRowFromBottom) % 2 === 1;
}

export function shuffleSolvable(size: number, rounds = 240) {
  const blank = size * size - 1;
  let tiles = createSolved(size);
  let empty = blank;

  const neighbors = (i: number) => {
    const r = Math.floor(i / size);
    const c = i % size;
    const out: number[] = [];
    if (r > 0) out.push(i - size);
    if (r < size - 1) out.push(i + size);
    if (c > 0) out.push(i - 1);
    if (c < size - 1) out.push(i + 1);
    return out;
  };

  let last = -1;
  for (let n = 0; n < rounds * size; n++) {
    const opts = neighbors(empty).filter((x) => x !== last);
    const pick = opts[Math.floor(Math.random() * opts.length)] ?? neighbors(empty)[0];
    last = empty;
    const next = tiles.slice();
    next[empty] = next[pick];
    next[pick] = blank;
    tiles = next;
    empty = pick;
  }

  if (!isSolvable(tiles, size) || tiles.every((t, i) => t === i)) {
    return shuffleSolvable(size, rounds + 40);
  }
  return tiles;
}

export function canMove(tiles: number[], size: number, index: number) {
  const blank = size * size - 1;
  const empty = tiles.indexOf(blank);
  const r1 = Math.floor(index / size);
  const c1 = index % size;
  const r2 = Math.floor(empty / size);
  const c2 = empty % size;
  return (Math.abs(r1 - r2) === 1 && c1 === c2) || (Math.abs(c1 - c2) === 1 && r1 === r2);
}

export function moveTile(tiles: number[], size: number, index: number) {
  if (!canMove(tiles, size, index)) return null;
  const blank = size * size - 1;
  const empty = tiles.indexOf(blank);
  const next = tiles.slice();
  next[empty] = next[index];
  next[index] = blank;
  return next;
}

export function isSolved(tiles: number[]) {
  return tiles.every((t, i) => t === i);
}

export function calcStars(level: PuzzleLevel, seconds: number) {
  const [s3, s2, s1] = level.starTimes;
  if (seconds <= s3) return 3;
  if (seconds <= s2) return 2;
  if (seconds <= s1) return 1;
  return 1;
}

export function calcScore(input: {
  level: PuzzleLevel;
  seconds: number;
  moves: number;
  stars: number;
  streakDays?: number;
}) {
  const { level, seconds, moves, stars, streakDays = 0 } = input;
  const starFactor = stars === 3 ? 1.25 : stars === 2 ? 1.1 : 1;
  const streakBonus =
    level.id !== "mudah" && streakDays > 0 ? Math.min(streakDays, 7) * 8 : 0;
  const raw =
    level.xpBase * level.multiplier * starFactor - seconds * 1.8 - moves * 2.2 + streakBonus;
  return Math.max(10, Math.round(raw));
}

export function starsLabel(n: number) {
  return "★".repeat(n) + "☆".repeat(Math.max(0, 3 - n));
}

export const PUZZLE_IMAGE = "/og-default.jpg";
