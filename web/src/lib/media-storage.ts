import type { SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "@/lib/supabase/env";

const MEDIA_PREFIX = "/storage/v1/object/public/media/";

/** Ambil path objek di bucket `media` dari URL publik (atau null bila bukan milik kita). */
export function mediaObjectPath(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;
  try {
    const u = new URL(url.trim());
    const base = SUPABASE_URL ? new URL(SUPABASE_URL) : null;
    if (base && u.hostname !== base.hostname) return null;
    const idx = u.pathname.indexOf(MEDIA_PREFIX);
    if (idx < 0) return null;
    const path = decodeURIComponent(u.pathname.slice(idx + MEDIA_PREFIX.length));
    return path || null;
  } catch {
    return null;
  }
}

function normalizeUrl(url: string) {
  try {
    const u = new URL(url.trim());
    u.hash = "";
    u.search = "";
    return u.toString();
  } catch {
    return url.trim();
  }
}

/** Kumpulkan URL unik dari string / array / cuplikan HTML. */
export function collectUrls(
  ...sources: Array<string | string[] | null | undefined>
): string[] {
  const out = new Set<string>();
  const push = (raw: string) => {
    const cleaned = normalizeUrl(raw);
    if (mediaObjectPath(cleaned)) out.add(cleaned);
  };

  for (const src of sources) {
    if (!src) continue;
    if (Array.isArray(src)) {
      for (const u of src) if (typeof u === "string") push(u);
      continue;
    }
    if (typeof src !== "string") continue;
    if (/^https?:\/\//i.test(src.trim()) && !src.includes("<")) {
      push(src);
      continue;
    }
    const matches = src.match(/https?:\/\/[^\s"'<>]+/gi) ?? [];
    for (const m of matches) push(m);
  }
  return [...out];
}

/** Hapus file media yang ada di `previous` tapi tidak lagi di `next`. Gagal hapus tidak melempar. */
export async function removeUnusedMedia(
  supabase: SupabaseClient,
  previous: string[],
  next: string[]
) {
  const keep = new Set(next.map(normalizeUrl));
  const stale = previous
    .map(normalizeUrl)
    .filter((u) => u && !keep.has(u))
    .map((u) => mediaObjectPath(u))
    .filter((p): p is string => Boolean(p));

  if (!stale.length) return;

  // Chunk agar request tidak terlalu besar.
  for (let i = 0; i < stale.length; i += 40) {
    const slice = stale.slice(i, i + 40);
    const { error } = await supabase.storage.from("media").remove(slice);
    if (error) {
      console.warn("[media] gagal hapus storage:", error.message, slice);
    }
  }
}
