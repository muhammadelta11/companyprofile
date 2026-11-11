/** Normalisasi & cocokkan query pencarian katalog (market / wisata / dashboard). */

export function normalizeQuery(q: string) {
  return q.trim().toLowerCase().replace(/\s+/g, " ");
}

export function matchesQuery(
  fields: Array<string | null | undefined>,
  query: string
) {
  const q = normalizeQuery(query);
  if (!q) return true;
  const hay = fields
    .filter((v): v is string => Boolean(v && String(v).trim()))
    .join(" ")
    .toLowerCase();
  return q.split(" ").every((token) => hay.includes(token));
}
