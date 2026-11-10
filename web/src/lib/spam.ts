import { cookies, headers } from "next/headers";

/** Field honeypot: bot biasanya mengisi, manusia tidak melihatnya. */
export function isHoneypot(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

/** Tolak kiriman yang terlalu cepat (< 2 detik setelah form dibuka). */
export function isTooFast(startedAt: unknown) {
  const t = Number(startedAt);
  if (!Number.isFinite(t) || t <= 0) return false;
  return Date.now() - t < 2000;
}

function clientKey(ipHint: string) {
  return ipHint.replace(/[^a-zA-Z0-9.:]/g, "").slice(0, 64) || "anon";
}

export async function requestIp() {
  const h = await headers();
  const fwd = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return fwd || h.get("x-real-ip") || "anon";
}

/**
 * Batasi frekuensi per pengunjung (cookie) + per IP.
 * Mengembalikan true jika masih dalam masa tunggu.
 */
export async function isRateLimited(bucket: string, seconds: number) {
  const jar = await cookies();
  const ip = clientKey(await requestIp());
  const now = Date.now();
  const cookieName = `rl_${bucket}`;
  const lastCookie = Number(jar.get(cookieName)?.value || 0);
  const lastIpName = `rl_${bucket}_${ip.slice(-12)}`;
  const lastIp = Number(jar.get(lastIpName)?.value || 0);
  const last = Math.max(lastCookie, lastIp);

  if (last && now - last < seconds * 1000) return true;

  const opts = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: seconds,
  };
  try {
    jar.set(cookieName, String(now), opts);
    jar.set(lastIpName, String(now), opts);
  } catch {
    // Route Handler / render yang tidak bisa set cookie — tetap lanjut tanpa tulis.
  }
  return false;
}
