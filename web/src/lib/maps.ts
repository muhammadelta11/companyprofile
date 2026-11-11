export const DEFAULT_MAP_CENTER = { lat: -6.9932, lng: 110.4203 }; // Semarang

export type MapPoint = { lat: number; lng: number };

/** Cari lokasi gratis via OpenStreetMap Nominatim. */
export async function searchPlaces(query: string): Promise<
  Array<{ label: string; lat: number; lng: number }>
> {
  const q = query.trim();
  if (q.length < 2) return [];

  const url =
    "https://nominatim.openstreetmap.org/search?" +
    new URLSearchParams({
      q,
      format: "json",
      addressdetails: "0",
      limit: "6",
      countrycodes: "id",
    });

  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      // Identitas app — kebijakan Nominatim
      "User-Agent": "masudeltamamy-web/1.0 (area-picker)",
    },
  });
  if (!res.ok) return [];

  const data = (await res.json()) as Array<{
    display_name?: string;
    lat?: string;
    lon?: string;
  }>;

  return data
    .map((row) => {
      const lat = Number(row.lat);
      const lng = Number(row.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      return {
        label: row.display_name?.trim() || `${lat}, ${lng}`,
        lat,
        lng,
      };
    })
    .filter((x): x is { label: string; lat: number; lng: number } => !!x);
}
