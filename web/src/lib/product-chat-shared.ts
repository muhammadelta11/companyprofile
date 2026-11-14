/** Tipe + helper chat yang aman di client (tanpa next/headers). */

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
