"use server";

import { updateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { publicClient } from "@/lib/supabase/public";
import { supabaseReady } from "@/lib/supabase/env";
import { getProduct, isUuid } from "@/lib/content";
import { isHoneypot, isRateLimited, isTooFast } from "@/lib/spam";
import { verifyTurnstile } from "@/lib/turnstile";
import { waLink, waTo } from "@/data/site";
import { getCurrentUser } from "@/lib/auth";

const APPLICATION_ROLES = ["member", "mitra", "partner"];

export type PlaceOrderInput = {
  productId: string;
  name: string;
  phone: string;
  city: string;
  note?: string;
  website?: string;
  startedAt?: number;
  turnstileToken?: string;
};

/**
 * Simpan order + kembalikan URL WA.
 * Produk mitra → WA mitra (wajib nomor terisi). Produk official → WA admin.
 * Tamu boleh order tanpa login.
 */
export async function placeOrder(
  input: PlaceOrderInput
): Promise<{ error?: string; waUrl?: string }> {
  if (!supabaseReady) return { error: "Database belum terhubung." };
  if (isHoneypot(input.website) || isTooFast(input.startedAt)) {
    return { waUrl: waLink("Halo") };
  }
  const captcha = await verifyTurnstile(input.turnstileToken, "order");
  if (!captcha.ok) return { error: captcha.error };
  if (await isRateLimited("order", 15)) {
    return { error: "Terlalu banyak order. Tunggu sebentar." };
  }
  if (!isUuid(input.productId)) return { error: "Produk tidak valid." };

  const name = input.name.trim().slice(0, 120);
  const phone = input.phone.replace(/\D/g, "").slice(0, 20);
  const city = input.city.trim().slice(0, 120);
  const note = (input.note ?? "").trim().slice(0, 500);

  if (!name) return { error: "Nama wajib diisi." };
  if (phone.length < 10) return { error: "Nomor WhatsApp tidak valid." };
  if (!city) return { error: "Kota / kecamatan wajib diisi (cek area kirim)." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: product, error: productErr } = await supabase
    .from("products")
    .select("id, title, price_label, owner_id, shipping_mode, service_area, status")
    .eq("id", input.productId)
    .maybeSingle();

  if (productErr || !product || product.status !== "approved") {
    return { error: "Produk tidak ditemukan atau belum tayang." };
  }

  let sellerPhone: string | null = null;
  let sellerName = "Official Mas'ud El-Tamamy";
  if (product.owner_id) {
    const { data: seller } = await supabase
      .from("profiles")
      .select("full_name, shop_name, phone")
      .eq("id", product.owner_id)
      .maybeSingle();
    sellerName =
      seller?.shop_name?.trim() || seller?.full_name?.trim() || "Mitra";
    sellerPhone = seller?.phone?.replace(/\D/g, "") || null;
    if (!sellerPhone || sellerPhone.length < 10) {
      return {
        error:
          "Penjual belum mengisi WhatsApp. Order belum bisa dilanjutkan — coba lagi nanti atau hubungi admin.",
      };
    }
  }

  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .insert({
      product_id: product.id,
      buyer_id: user?.id ?? null,
      buyer_name: name,
      buyer_phone: phone,
      buyer_city: city,
      note: note || null,
    })
    .select("id")
    .maybeSingle();

  if (orderErr) {
    // Kolom baru belum dimigrasi: fallback insert minimal
    const fallback = await supabase.from("orders").insert({
      product_id: product.id,
      buyer_id: user?.id ?? null,
    });
    if (fallback.error) return { error: "Gagal mencatat order. Coba lagi." };
  }

  const orderId = order?.id ? String(order.id).slice(0, 8) : "baru";
  const areaHint =
    product.shipping_mode === "pickup"
      ? "Ambil di tempat"
      : product.shipping_mode === "nationwide"
        ? "Kirim nasional"
        : product.shipping_mode === "digital"
          ? "Digital"
          : product.service_area
            ? `Area: ${product.service_area}`
            : "Area: tanya penjual";

  // Mitra → WA penjual. Official → WA admin.
  const routeToSeller = Boolean(product.owner_id && sellerPhone && sellerPhone.length >= 10);
  const greet = routeToSeller ? sellerName : "Admin Mas'ud El-Tamamy";

  const text = [
    `Halo ${greet}, saya mau order via masudeltamamy.com`,
    `Order #${orderId}`,
    `Produk: ${product.title}${product.price_label ? ` (${product.price_label})` : ""}`,
    `Pengiriman: ${areaHint}`,
    `Nama: ${name}`,
    `WA: ${phone}`,
    `Kota: ${city}`,
    note ? `Catatan: ${note}` : null,
    `Link: https://masudeltamamy.com/market/${product.id}`,
  ]
    .filter(Boolean)
    .join("\n");

  const waUrl = routeToSeller && sellerPhone ? waTo(sellerPhone, text) : waLink(text);
  return { waUrl };
}

/** Komentar produk — wajib login. */
export async function postProductComment(input: {
  productId: string;
  body: string;
  website?: string;
  startedAt?: number;
  turnstileToken?: string;
}): Promise<{ error?: string; ok?: boolean }> {
  if (!supabaseReady) return { error: "Database belum terhubung." };
  if (isHoneypot(input.website) || isTooFast(input.startedAt)) return { ok: true };
  const captcha = await verifyTurnstile(input.turnstileToken, "comment");
  if (!captcha.ok) return { error: captcha.error };
  if (await isRateLimited("comment", 20)) {
    return { error: "Terlalu cepat. Tunggu sebentar." };
  }
  if (!isUuid(input.productId)) return { error: "Produk tidak valid." };

  const user = await getCurrentUser();
  if (!user) return { error: "Masuk dulu untuk berkomentar." };
  if (user.status === "suspended") return { error: "Akun ditangguhkan." };

  const body = input.body.trim().slice(0, 1000);
  if (body.length < 2) return { error: "Komentar terlalu pendek." };

  const supabase = await createClient();
  const { data: product } = await supabase
    .from("products")
    .select("id, status")
    .eq("id", input.productId)
    .maybeSingle();
  if (!product || product.status !== "approved") {
    return { error: "Produk tidak ditemukan." };
  }

  const { error } = await supabase.from("product_comments").insert({
    product_id: input.productId,
    user_id: user.id,
    body,
  });
  if (error) {
    return { error: "Gagal mengirim. Jalankan product-comments.sql atau coba lagi." };
  }
  updateTag(`product-comments-${input.productId}`);
  return { ok: true };
}

/** Bootstrap ruang chat produk untuk panel overlay (ala Delta). */
export async function loadProductChatRoom(productId: string): Promise<{
  error?: string;
  needLogin?: boolean;
  productId?: string;
  productTitle?: string;
  productHref?: string;
  productImage?: string | null;
  sellerName?: string;
  canChat?: boolean;
  isSellerView?: boolean;
  userId?: string;
  userName?: string;
  thread?: import("@/lib/product-chat").ProductChatThread | null;
  messages?: import("@/lib/product-chat").ProductChatMessage[];
  sellerThreads?: import("@/lib/product-chat").ProductChatThread[];
}> {
  if (!supabaseReady) return { error: "Database belum terhubung." };
  if (!isUuid(productId)) return { error: "Produk tidak valid." };

  const [product, user] = await Promise.all([getProduct(productId), getCurrentUser()]);
  if (!product) return { error: "Produk tidak ditemukan atau belum tayang." };
  if (!user || user.status === "suspended") {
    return { needLogin: true, productId: product.id, productTitle: product.title };
  }

  const {
    getBuyerThreadForProduct,
    getSellerThreadsForProduct,
    getThreadMessages,
    isChatSellerInbox,
  } = await import("@/lib/product-chat");
  const { sellerLabel } = await import("@/lib/product");

  // Admin di produk mitra = pembeli (bisa chat penjual). Inbox hanya jika milik sendiri.
  const isSellerView = isChatSellerInbox(user, product.owner_id);
  let thread = null as import("@/lib/product-chat").ProductChatThread | null;
  let messages: import("@/lib/product-chat").ProductChatMessage[] = [];
  let sellerThreads: import("@/lib/product-chat").ProductChatThread[] = [];

  if (isSellerView) {
    sellerThreads = await getSellerThreadsForProduct(product.id);
    thread = sellerThreads[0] ?? null;
    if (thread) messages = await getThreadMessages(thread.id, user.id);
  } else {
    const buyer = await getBuyerThreadForProduct(product.id, user.id);
    thread = buyer.thread;
    messages = buyer.messages;
  }

  return {
    productId: product.id,
    productTitle: product.title,
    productHref: `/market/${product.id}`,
    productImage: product.image_url,
    sellerName: sellerLabel(product),
    canChat: true,
    isSellerView,
    userId: user.id,
    userName: user.name,
    thread,
    messages,
    sellerThreads,
  };
}

/** Ambil pesan satu thread (ganti percakapan di panel). */
export async function fetchProductThreadMessages(threadId: string): Promise<{
  error?: string;
  messages?: import("@/lib/product-chat").ProductChatMessage[];
}> {
  if (!supabaseReady) return { error: "Database belum terhubung." };
  if (!isUuid(threadId)) return { error: "Percakapan tidak valid." };
  const user = await getCurrentUser();
  if (!user) return { error: "Masuk dulu." };
  const { getThreadMessages } = await import("@/lib/product-chat");
  const messages = await getThreadMessages(threadId, user.id);
  return { messages };
}

/** Chat privat per produk — wajib login, tersimpan di product_threads / product_messages. */
export async function sendProductChatMessage(input: {
  productId: string;
  body: string;
  threadId?: string;
  website?: string;
  startedAt?: number;
}): Promise<{
  error?: string;
  ok?: boolean;
  threadId?: string;
  messageId?: string;
  createdAt?: string;
}> {
  if (!supabaseReady) return { error: "Database belum terhubung." };
  if (isHoneypot(input.website) || isTooFast(input.startedAt)) return { ok: true };
  if (await isRateLimited("product-chat", 40)) {
    return { error: "Terlalu cepat. Tunggu sebentar." };
  }
  if (!isUuid(input.productId)) return { error: "Produk tidak valid." };
  if (input.threadId && !isUuid(input.threadId)) return { error: "Percakapan tidak valid." };

  const user = await getCurrentUser();
  if (!user) return { error: "Masuk dulu untuk chat." };
  if (user.status === "suspended") return { error: "Akun ditangguhkan." };

  const body = input.body.trim().slice(0, 2000);
  if (body.length < 1) return { error: "Pesan kosong." };

  const supabase = await createClient();
  const { data: product } = await supabase
    .from("products")
    .select("id, status, owner_id, title")
    .eq("id", input.productId)
    .maybeSingle();
  if (!product || product.status !== "approved") {
    return { error: "Produk tidak ditemukan." };
  }

  const ownerId = product.owner_id ? String(product.owner_id) : null;
  const isSeller = user.role === "admin" || (ownerId !== null && ownerId === user.id);

  let threadId = input.threadId ?? null;

  if (threadId) {
    const { data: thread } = await supabase
      .from("product_threads")
      .select("id, product_id, buyer_id, seller_id")
      .eq("id", threadId)
      .maybeSingle();
    if (!thread || String(thread.product_id) !== input.productId) {
      return { error: "Percakapan tidak ditemukan." };
    }
    const allowed =
      String(thread.buyer_id) === user.id ||
      (thread.seller_id && String(thread.seller_id) === user.id) ||
      user.role === "admin";
    if (!allowed) return { error: "Tidak punya akses ke percakapan ini." };
  } else {
    if (isSeller && ownerId === user.id) {
      return { error: "Pilih percakapan pembeli untuk membalas." };
    }
    if (isSeller && user.role === "admin" && !ownerId) {
      return { error: "Pilih percakapan pembeli untuk membalas." };
    }

    const { data: existing } = await supabase
      .from("product_threads")
      .select("id")
      .eq("product_id", input.productId)
      .eq("buyer_id", user.id)
      .maybeSingle();

    if (existing) {
      threadId = String(existing.id);
    } else {
      const { data: created, error: createErr } = await supabase
        .from("product_threads")
        .insert({
          product_id: input.productId,
          buyer_id: user.id,
          seller_id: ownerId,
        })
        .select("id")
        .single();
      if (createErr || !created) {
        return { error: "Gagal membuka chat. Jalankan product-chat.sql di Supabase." };
      }
      threadId = String(created.id);
    }
  }

  const { data: inserted, error } = await supabase
    .from("product_messages")
    .insert({
      thread_id: threadId,
      sender_id: user.id,
      body,
    })
    .select("id, created_at")
    .single();
  if (error) {
    return { error: "Gagal mengirim. Jalankan product-chat.sql atau coba lagi." };
  }

  return {
    ok: true,
    threadId,
    messageId: inserted?.id ? String(inserted.id) : undefined,
    createdAt: inserted?.created_at ? String(inserted.created_at) : undefined,
  };
}

/** Catat buka halaman detail produk (untuk urutan terpopuler di Market). */
export async function trackProductView(productId: string) {
  if (!supabaseReady || !isUuid(productId)) return;
  if (await isRateLimited(`view:${productId}`, 40)) return;
  try {
    await publicClient().rpc("increment_product_view", { p_id: productId });
  } catch {
    // Kolom/RPC belum dimigrasi — diamkan.
  }
}

/** @deprecated diganti placeOrder — tetap ada agar build lama tidak putus. */
export async function logOrder(productId: string) {
  if (!supabaseReady || !isUuid(productId)) return;
  if (await isRateLimited("order", 20)) return;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  await supabase.from("orders").insert({ product_id: productId, buyer_id: user?.id ?? null });
}

export async function submitApplication(input: {
  role: string;
  name: string;
  city: string;
  productKind: string;
  detail: string;
  email?: string;
  phone?: string;
  website?: string;
  startedAt?: number;
  turnstileToken?: string;
}): Promise<{ error?: string; ok?: boolean }> {
  if (!supabaseReady) return { error: "Database belum terhubung." };
  if (isHoneypot(input.website) || isTooFast(input.startedAt)) {
    return { ok: true };
  }
  const captcha = await verifyTurnstile(input.turnstileToken, "join");
  if (!captcha.ok) return { error: captcha.error };
  if (await isRateLimited("join", 60)) {
    return { error: "Terlalu cepat. Tunggu sebentar lalu kirim lagi." };
  }
  if (!APPLICATION_ROLES.includes(input.role)) {
    return { error: "Peran tidak valid." };
  }
  const name = input.name.trim().slice(0, 120);
  if (!name) return { error: "Nama wajib diisi." };

  const email = (input.email ?? "").trim().toLowerCase().slice(0, 160);
  const phone = (input.phone ?? "").trim().slice(0, 30);
  if (input.role === "mitra" || input.role === "member") {
    if (!email || !email.includes("@")) return { error: "Email wajib diisi." };
    if (!phone) return { error: "Nomor WhatsApp wajib diisi." };
  }

  const detail = [
    input.detail.trim().slice(0, 800) || null,
    email ? `Email: ${email}` : null,
    phone ? `WA: ${phone}` : null,
  ]
    .filter(Boolean)
    .join("\n")
    .slice(0, 1000);

  const supabase = await createClient();
  const { error } = await supabase.from("applications").insert({
    role: input.role,
    name,
    city: input.city.trim().slice(0, 120) || null,
    product_kind: input.role === "mitra" ? input.productKind.slice(0, 40) : null,
    detail: detail || null,
  });
  if (error) return { error: "Gagal menyimpan pendaftaran. Coba lagi." };
  return { ok: true };
}

export async function submitFeedback(input: {
  name: string;
  contact: string;
  kind: string;
  message: string;
  page?: string;
  website?: string;
  startedAt?: number;
  turnstileToken?: string;
}): Promise<{ error?: string; ok?: boolean }> {
  if (!supabaseReady) return { error: "Database belum terhubung." };
  if (isHoneypot(input.website) || isTooFast(input.startedAt)) return { ok: true };
  const captcha = await verifyTurnstile(input.turnstileToken, "feedback");
  if (!captcha.ok) return { error: captcha.error };
  if (await isRateLimited("feedback", 30)) {
    return { error: "Terlalu cepat. Tunggu sebentar." };
  }
  const kind = ["bug", "idea", "complaint", "other"].includes(input.kind)
    ? input.kind
    : "other";
  const message = input.message.trim().slice(0, 2000);
  if (message.length < 8) return { error: "Tuliskan masukan minimal beberapa kata." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("feedback").insert({
    user_id: user?.id ?? null,
    name: input.name.trim().slice(0, 120) || null,
    contact: input.contact.trim().slice(0, 120) || null,
    kind,
    message,
    page: (input.page ?? "").trim().slice(0, 200) || null,
  });
  if (error) return { error: "Gagal mengirim. Jalankan ops-p0.sql atau coba lagi." };
  return { ok: true };
}

/** Simpan skor puzzle (wajib login) untuk leaderboard mingguan. */
export async function submitPuzzleScore(input: {
  level: string;
  size: number;
  moves: number;
  seconds: number;
  stars: number;
  score: number;
  badge?: string;
  mode?: string;
}): Promise<{ error?: string; ok?: boolean; rank?: number; total?: number }> {
  if (!supabaseReady) return { error: "Database belum terhubung." };
  if (await isRateLimited("puzzle-score", 20)) {
    return { error: "Terlalu cepat. Tunggu sebentar." };
  }

  const user = await getCurrentUser();
  if (!user) return { error: "Masuk dulu untuk masuk papan peringkat." };
  if (user.status === "suspended") return { error: "Akun ditangguhkan." };

  const level = ["mudah", "sedang", "sulit"].includes(input.level) ? input.level : null;
  if (!level) return { error: "Level tidak valid." };
  if (![3, 4, 5].includes(input.size)) return { error: "Ukuran tidak valid." };

  const moves = Math.max(0, Math.min(5000, Math.floor(Number(input.moves) || 0)));
  const seconds = Math.max(0, Math.min(7200, Math.floor(Number(input.seconds) || 0)));
  const stars = Math.max(1, Math.min(3, Math.floor(Number(input.stars) || 1)));
  const score = Math.max(0, Math.min(100000, Math.floor(Number(input.score) || 0)));
  const mode = input.mode === "angka" ? "angka" : "gambar";
  const badge = (input.badge || "").trim().slice(0, 40) || null;
  const player_name = (user.shop_name.trim() || user.name).slice(0, 80);

  const supabase = await createClient();
  const { error } = await supabase.from("puzzle_scores").insert({
    user_id: user.id,
    player_name,
    level,
    size: input.size,
    moves,
    seconds,
    stars,
    score,
    badge,
    mode,
  });
  if (error) {
    return { error: "Gagal menyimpan skor. Jalankan puzzle.sql di Supabase." };
  }

  const { getPuzzleLeaderboard, rankAmongScores } = await import("@/lib/puzzle-scores");
  const board = await getPuzzleLeaderboard(level as "mudah" | "sedang" | "sulit", 50);
  const placed = rankAmongScores(board, {
    score,
    seconds,
    moves,
    user_id: user.id,
  });
  return { ok: true, rank: placed.rank, total: placed.total };
}
