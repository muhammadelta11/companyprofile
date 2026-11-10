import { headers } from "next/headers";
import { SITE } from "@/data/site";
import { requestIp } from "./spam";

const SITEVERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export function turnstileSiteKey() {
  return (process.env.NEXT_PUBLIC_TURNSTILE_SITEKEY ?? "").trim();
}

export function turnstileConfigured() {
  return Boolean(turnstileSiteKey() && (process.env.TURNSTILE_SECRET ?? "").trim());
}

function expectedHostnames() {
  const fromEnv = (process.env.TURNSTILE_HOSTNAMES ?? "")
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
  if (fromEnv.length) return new Set(fromEnv);

  const defaults = new Set<string>([SITE.domain, `www.${SITE.domain}`]);
  if (process.env.NODE_ENV !== "production") {
    defaults.add("localhost");
    defaults.add("127.0.0.1");
  }
  return defaults;
}

/**
 * Verifikasi token Turnstile di server.
 * Jika secret belum di-set (dev lokal) → lolos (skip).
 * Production wajib set TURNSTILE_SECRET + sitekey.
 */
export async function verifyTurnstile(
  token: unknown,
  expectedAction: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const secret = (process.env.TURNSTILE_SECRET ?? "").trim();
  if (!secret) {
    // Belum dikonfigurasi — jangan blokir lokal/staging tanpa widget.
    if (process.env.NODE_ENV === "production" && turnstileSiteKey()) {
      return { ok: false, error: "Verifikasi bot belum dikonfigurasi di server." };
    }
    return { ok: true };
  }

  if (typeof token !== "string" || token.length === 0 || token.length > 2048) {
    return { ok: false, error: "Centang verifikasi keamanan dulu." };
  }

  const hostnames = expectedHostnames();
  if (hostnames.size === 0) {
    return { ok: false, error: "Konfigurasi host Turnstile kosong." };
  }

  const remoteip = await requestIp();
  let result: {
    success?: boolean;
    action?: string;
    hostname?: string;
    "error-codes"?: string[];
  };

  try {
    const body = new URLSearchParams({
      secret,
      response: token,
    });
    if (remoteip && remoteip !== "anon") body.set("remoteip", remoteip);

    const res = await fetch(SITEVERIFY, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return { ok: false, error: "Verifikasi keamanan gagal. Coba lagi." };
    result = (await res.json()) as typeof result;
  } catch {
    return { ok: false, error: "Verifikasi keamanan gagal. Coba lagi." };
  }

  const hostname = (result.hostname ?? "").toLowerCase();
  if (
    result.success !== true ||
    result.action !== expectedAction ||
    !hostnames.has(hostname)
  ) {
    return { ok: false, error: "Verifikasi bot ditolak. Muat ulang lalu coba lagi." };
  }

  return { ok: true };
}

/** Ambil Origin/Host untuk debug (opsional). */
export async function requestHostname() {
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "";
  return host.split(":")[0]?.toLowerCase() ?? "";
}
