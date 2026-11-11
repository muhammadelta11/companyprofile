/**
 * Kebijakan akses publik vs login.
 *
 * Tamu: lihat katalog/detail.
 * Order WA: boleh tanpa login (konversi), dengan anti-spam.
 * Komentar / chat tulis: wajib login.
 * WA order: default ke admin (kurangi spam ke mitra); bisa diganti di Tampilan.
 */

export const ACCESS_POLICY = {
  guestCanViewCatalog: true,
  guestCanOrderWa: true,
  commentRequiresLogin: true,
  chatRequiresLogin: true,
  /** Default aman: semua order WA masuk nomor admin dulu. */
  defaultOrderWaMode: "admin" as OrderWaMode,
} as const;

export type OrderWaMode = "admin" | "seller";

export function parseOrderWaMode(raw: string | null | undefined): OrderWaMode {
  return raw === "seller" ? "seller" : "admin";
}

/** Path internal aman untuk redirect setelah login. */
export function safeNextPath(raw: unknown, fallback = "/dashboard") {
  if (typeof raw !== "string") return fallback;
  const path = raw.trim();
  if (!path.startsWith("/") || path.startsWith("//")) return fallback;
  if (path.startsWith("/masuk") || path.startsWith("/auth") || path.startsWith("/api")) {
    return fallback;
  }
  return path.slice(0, 300);
}

export function loginHref(next?: string) {
  const target = safeNextPath(next, "");
  if (!target) return "/masuk";
  return `/masuk?next=${encodeURIComponent(target)}`;
}

/** Chat produk: sudah login → langsung ke chat; belum → wajib masuk dulu. */
export function productChatHref(productId: string, loggedIn: boolean) {
  const next = `/market/${productId}#chat-produk`;
  return loggedIn ? next : loginHref(next);
}
