import { createClient } from "@/lib/supabase/server";
import { supabaseReady } from "@/lib/supabase/env";
import type { CurrentUser } from "@/lib/auth";

export type ProductChatMessage = {
  id: string;
  body: string;
  created_at: string;
  sender_id: string;
  sender_name: string;
  mine: boolean;
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
};

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
    .select("id, product_id, buyer_id, seller_id, last_message_at, created_at")
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
      "id, product_id, buyer_id, seller_id, last_message_at, created_at, buyer:profiles!product_threads_buyer_id_fkey(full_name)"
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
    };
  });
}

export async function getThreadMessages(
  threadId: string,
  viewerId: string
): Promise<ProductChatMessage[]> {
  if (!supabaseReady) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_messages")
    .select(
      "id, body, created_at, sender_id, sender:profiles!product_messages_sender_id_fkey(full_name)"
    )
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true })
    .limit(200);

  if (error || !data) return [];

  return data.map((row) => {
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
}

export async function getInboxThreads(user: CurrentUser): Promise<ProductChatThread[]> {
  if (!supabaseReady) return [];
  const supabase = await createClient();

  let query = supabase
    .from("product_threads")
    .select(
      "id, product_id, buyer_id, seller_id, last_message_at, created_at, product:products!product_threads_product_id_fkey(title), buyer:profiles!product_threads_buyer_id_fkey(full_name)"
    )
    .order("last_message_at", { ascending: false })
    .limit(60);

  if (user.role === "member") {
    query = query.eq("buyer_id", user.id);
  } else if (user.role === "mitra") {
    query = query.or(`seller_id.eq.${user.id},buyer_id.eq.${user.id}`);
  }
  // admin: RLS already limits; can see all via is_admin

  const { data, error } = await query;
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
