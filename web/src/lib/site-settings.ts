import { cacheLife, cacheTag } from "next/cache";
import { ACCESS_POLICY, parseOrderWaMode, type OrderWaMode } from "./access-policy";
import { publicClient } from "./supabase/public";
import { supabaseReady } from "./supabase/env";

export const HERO_PAGES = [
  { key: "hero_layanan", label: "Layanan — latar header", tone: "layanan", href: "/layanan" },
  { key: "hero_market", label: "Market — latar header", tone: "market", href: "/market" },
  { key: "hero_wisata", label: "Wisata — latar header", tone: "wisata", href: "/wisata" },
  { key: "hero_proyek", label: "Proyek — latar header", tone: "proyek", href: "/proyek" },
  { key: "hero_tentang", label: "Tentang — latar header", tone: "tentang", href: "/tentang" },
  { key: "hero_gabung", label: "Gabung — latar header", tone: "gabung", href: "/gabung" },
  {
    key: "portrait_tentang",
    label: "Tentang — foto profil",
    tone: "tentang",
    href: "/tentang",
  },
] as const;

export type HeroTone = (typeof HERO_PAGES)[number]["tone"];

export function heroSettingKey(tone: HeroTone) {
  return `hero_${tone}` as (typeof HERO_PAGES)[number]["key"];
}

/** Semua setting situs (cached). */
export async function getSiteSettings(): Promise<Record<string, string>> {
  "use cache";
  cacheTag("site-settings");
  cacheLife("minutes");
  if (!supabaseReady) return {};
  const { data, error } = await publicClient().from("site_settings").select("key, value");
  if (error || !data) return {};
  const out: Record<string, string> = {};
  for (const row of data) {
    if (row.key && typeof row.value === "string" && row.value) out[row.key] = row.value;
  }
  return out;
}

export async function getHeroImage(tone: HeroTone): Promise<string | null> {
  "use cache";
  cacheTag("site-settings");
  cacheLife("minutes");
  const all = await getSiteSettings();
  return all[heroSettingKey(tone)] ?? null;
}

/** admin = semua order ke WA official; seller = langsung ke mitra bila ada nomor. */
export async function getOrderWaMode(): Promise<OrderWaMode> {
  const all = await getSiteSettings();
  return parseOrderWaMode(all.order_wa_mode ?? ACCESS_POLICY.defaultOrderWaMode);
}
