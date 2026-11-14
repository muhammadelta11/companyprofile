import { createClient } from "@/lib/supabase/server";
import { supabaseReady } from "@/lib/supabase/env";
import type { CurrentUser } from "@/lib/auth";

export type ProductChatReceipt = "sending" | "sent" | "read";

export type ProductChatMessage = {
  id: string;
  body: string;
  created_at: string;
  sender_id: string;
  sender_name: string;
  mine: boolean;
  /** Status baca untuk pesan sendiri (centang WhatsApp-style). */
  receipt?: ProductChatReceipt;
};

export type ProductChatThread = {
  id: string;
  product_id: string;
  buyer_id: string;
  seller_id: string | null;
  last_message_at: string;
  created_at: string;
  product_title?: string;
  buyer_name?: string;
  preview?: string;
  unread?: number;
};

const THREAD_COLS =
  "id, product_id, buyer_id, seller_id, last_message_at, created_at, buyer_unread, seller_unread, buyer_last_read_at, seller_last_read_at";

function myUnreadForThread(
  userId: string,
  row: { buyer_id: unknown; buyer_unread?: unknown; seller_unread?: unknown }
) {
  const buyerId = String(row.buyer_id);
  const buyerUnread = Number(row.buyer_unread ?? 0) || 0;
  const sellerUnread = Number(row.seller_unread ?? 0) || 0;
  return buyerId === userId ? buyerUnread : sellerUnread;
}

/** last_read lawan bicara → receipt untuk pesan sendiri. */
export function withMessageReceipts(
  messages: ProductChatMessage[],
  peerLastReadAt: string | null | undefined
): ProductChatMessage[] {
  const peerTs = peerLastReadAt ? Date.parse(peerLastReadAt) : NaN;
  return messages.map((m) => {
    if (!m.mine) return { ...m, receipt: undefined };
    if (m.id.startsWith("temp-")) return { ...m, receipt: "sending" };
    if (Number.isFinite(peerTs) && Date.parse(m.created_at) <= peerTs) {
      return { ...m, receipt: "read" };
    }
    return { ...m, receipt: "sent" };
  });
}

export function peerLastReadFromThread(
  viewerId: string,
  thread: {
    buyer_id: unknown;
    buyer_last_read_at?: unknown;
    seller_last_read_at?: unknown;
  } | null
): string | null {
  if (!thread) return null;
  const iAmBuyer = String(thread.buyer_id) === viewerId;
  const raw = iAmBuyer ? thread.seller_last_read_at : thread.buyer_last_read_at;
  return raw ? String(raw) : null;
}

export function isProductSeller(user: CurrentUser, productOwnerId: string | null) {
  if (user.role === "admin") return true;
  if (productOwnerId && productOwnerId === user.id) return true;
  return false;
}

/**
 * Mode UI chat: inbox penjual hanya untuk pemilik listing.
 * Admin/member di produk mitra lain = mode pembeli (bisa kirim pesan ke penjual).
 */
export function isChatSellerInbox(user: CurrentUser, productOwnerId: string | null) {
  if (productOwnerId) return productOwnerId === user.id;
  return user.role === "admin";
}

export async function getBuyerThreadForProduct(
  productId: string,
  userId: string
): Promise<{ thread: ProductChatThread | null; messages: ProductChatMessage[] }> {
  if (!supabaseReady) return { thread: null, messages: [] };
  const supabase = await createClient();
  const { data: thread } = await supabase
    .from("product_threads")
    .select(THREAD_COLS)
    .eq("product_id", productId)
    .eq("buyer_id", userId)
    .maybeSingle();

  if (!thread) return { thread: null, messages: [] };
  const messages = await getThreadMessages(String(thread.id), userId);
  return {
    thread: {
      id: String(thread.id),
      product_id: String(thread.product_id),
      buyer_id: String(thread.buyer_id),
      seller_id: thread.seller_id ? String(thread.seller_id) : null,
      last_message_at: String(thread.last_message_at ?? ""),
      created_at: String(thread.created_at ?? ""),
      unread: myUnreadForThread(userId, thread),
    },
    messages,
  };
}

export async function getSellerThreadsForProduct(
  productId: string
): Promise<ProductChatThread[]> {
  if (!supabaseReady) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_threads")
    .select(
      `${THREAD_COLS}, buyer:profiles!product_threads_buyer_id_fkey(full_name)`
    )
    .eq("product_id", productId)
    .order("last_message_at", { ascending: false })
    .limit(40);

  if (error || !data) return [];

  return data.map((row) => {
    const buyer = row.buyer as { full_name?: string | null } | null;
    return {
      id: String(row.id),
      product_id: String(row.product_id),
      buyer_id: String(row.buyer_id),
      seller_id: row.seller_id ? String(row.seller_id) : null,
      last_message_at: String(row.last_message_at ?? ""),
      created_at: String(row.created_at ?? ""),
      buyer_name: buyer?.full_name?.trim() || "Pembeli",
      unread: Number(row.seller_unread ?? 0) || 0,
    };
  });
}

export async function getThreadMessages(
  threadId: string,
  viewerId: string
): Promise<ProductChatMessage[]> {
  if (!supabaseReady) return [];
  const supabase = await createClient();

  const [{ data: thread }, { data, error }] = await Promise.all([
    supabase
      .from("product_threads")
      .select("buyer_id, seller_id, buyer_last_read_at, seller_last_read_at")
      .eq("id", threadId)
      .maybeSingle(),
    supabase
      .from("product_messages")
      .select(
        "id, body, created_at, sender_id, sender:profiles!product_messages_sender_id_fkey(full_name)"
      )
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true })
      .limit(200),
  ]);

  if (error || !data) return [];

  const peerLastReadAt = peerLastReadFromThread(viewerId, thread);
  const mapped = data.map((row) => {
    const sender = row.sender as { full_name?: string | null } | null;
    const senderId = String(row.sender_id);
    return {
      id: String(row.id),
      body: String(row.body ?? ""),
      created_at: String(row.created_at ?? ""),
      sender_id: senderId,
      sender_name: sender?.full_name?.trim() || "Member",
      mine: senderId === viewerId,
    };
  });
  return withMessageReceipts(mapped, peerLastReadAt);
}

export async function getInboxThreads(user: CurrentUser): Promise<ProductChatThread[]> {
  if (!supabaseReady) return [];
  const supabase = await createClient();

  let query = supabase
    .from("product_threads")
    .select(
      `${THREAD_COLS}, product:products!product_threads_product_id_fkey(title), buyer:profiles!product_threads_buyer_id_fkey(full_name)`
    )
    .order("last_message_at", { ascending: false })
    .limit(60);

  if (user.role === "member") {
    query = query.eq("buyer_id", user.id);
  } else if (user.role === "mitra") {
    query = query.or(`seller_id.eq.${user.id},buyer_id.eq.${user.id}`);
  }
  // admin: RLS already limits; can see all via is_admin

  let { data, error } = await query;
  // Fallback jika product-chat-notify.sql belum dijalankan (kolom unread/read belum ada).
  if (error) {
    let fallback = supabase
      .from("product_threads")
      .select(
        "id, product_id, buyer_id, seller_id, last_message_at, created_at, product:products!product_threads_product_id_fkey(title), buyer:profiles!product_threads_buyer_id_fkey(full_name)"
      )
      .order("last_message_at", { ascending: false })
      .limit(60);
    if (user.role === "member") fallback = fallback.eq("buyer_id", user.id);
    else if (user.role === "mitra") {
      fallback = fallback.or(`seller_id.eq.${user.id},buyer_id.eq.${user.id}`);
    }
    const retry = await fallback;
    data = retry.data as typeof data;
    error = retry.error;
  }
  if (error || !data) return [];

  const threads: ProductChatThread[] = data.map((row) => {
    const product = row.product as { title?: string | null } | null;
    const buyer = row.buyer as { full_name?: string | null } | null;
    return {
      id: String(row.id),
      product_id: String(row.product_id),
      buyer_id: String(row.buyer_id),
      seller_id: row.seller_id ? String(row.seller_id) : null,
      last_message_at: String(row.last_message_at ?? ""),
      created_at: String(row.created_at ?? ""),
      product_title: product?.title?.trim() || "Produk",
      buyer_name: buyer?.full_name?.trim() || "Pembeli",
      preview: "",
      unread: myUnreadForThread(user.id, row),
    };
  });

  // Preview pesan terakhir (batch sederhana)
  for (const t of threads.slice(0, 30)) {
    const { data: last } = await supabase
      .from("product_messages")
      .select("body")
      .eq("thread_id", t.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    t.preview = last?.body ? String(last.body).slice(0, 120) : "";
  }

  return threads;
}

/** Total pesan belum dibaca untuk badge navigasi / ikon PWA. */
export async function getChatUnreadTotal(user: CurrentUser): Promise<number> {
  if (!supabaseReady) return 0;
  const supabase = await createClient();

  let query = supabase
    .from("product_threads")
    .select("buyer_id, buyer_unread, seller_unread")
    .limit(100);

  if (user.role === "member") {
    query = query.eq("buyer_id", user.id);
  } else if (user.role === "mitra") {
    query = query.or(`seller_id.eq.${user.id},buyer_id.eq.${user.id}`);
  }

  const { data, error } = await query;
  if (error || !data) {
    // Kolom unread belum ada / RLS — fallback aman.
    return 0;
  }

  return data.reduce((sum, row) => sum + myUnreadForThread(user.id, row), 0);
}

/** Tandai thread sudah dibaca untuk peran viewer (pembeli/penjual). */
export async function markProductThreadRead(threadId: string, userId: string) {
  if (!supabaseReady || !threadId || !userId) return { error: "invalid" as const };
  const supabase = await createClient();
  const { data: thread } = await supabase
    .from("product_threads")
    .select("id, buyer_id, seller_id")
    .eq("id", threadId)
    .maybeSingle();
  if (!thread) return { error: "not_found" as const };

  const isBuyer = String(thread.buyer_id) === userId;
  const patch = isBuyer
    ? { buyer_unread: 0, buyer_last_read_at: new Date().toISOString() }
    : { seller_unread: 0, seller_last_read_at: new Date().toISOString() };

  const { error } = await supabase.from("product_threads").update(patch).eq("id", threadId);
  if (error) return { error: "update_failed" as const };
  return { ok: true as const };
}
