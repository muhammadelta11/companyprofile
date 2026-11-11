"use client";

import { useCallback, useEffect, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import type { ProductChatMessage } from "@/lib/product-chat";

type Options = {
  threadId: string | null;
  userId: string | null;
  initial: ProductChatMessage[];
  /** Nama default untuk pengirim lain bila belum ada di riwayat. */
  otherName?: string;
};

export function useProductChatRealtime({
  threadId,
  userId,
  initial,
  otherName = "Lawan bicara",
}: Options) {
  const [messages, setMessages] = useState(initial);

  useEffect(() => {
    setMessages(initial);
  }, [threadId, initial]);

  useEffect(() => {
    if (!threadId || !userId) return;
    const supabase = createBrowserSupabase();
    if (!supabase) return;

    const channel = supabase
      .channel(`product-chat:${threadId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "product_messages",
          filter: `thread_id=eq.${threadId}`,
        },
        (payload) => {
          const row = payload.new as {
            id?: string;
            body?: string;
            created_at?: string;
            sender_id?: string;
          };
          if (!row.id || !row.sender_id) return;
          const senderId = String(row.sender_id);
          const mine = senderId === userId;

          setMessages((prev) => {
            if (prev.some((m) => m.id === row.id)) return prev;
            // Ganti bubble optimistik (temp-*) bila isi sama dari kita.
            const withoutTemp = mine
              ? prev.filter(
                  (m) =>
                    !(
                      m.id.startsWith("temp-") &&
                      m.mine &&
                      m.body === String(row.body ?? "")
                    )
                )
              : prev;
            const known = withoutTemp.find((m) => m.sender_id === senderId);
            return [
              ...withoutTemp,
              {
                id: String(row.id),
                body: String(row.body ?? ""),
                created_at: String(row.created_at ?? new Date().toISOString()),
                sender_id: senderId,
                sender_name: mine ? "Kamu" : known?.sender_name || otherName,
                mine,
              },
            ];
          });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [threadId, userId, otherName]);

  const appendOptimistic = useCallback(
    (body: string) => {
      if (!userId) return;
      const temp: ProductChatMessage = {
        id: `temp-${Date.now()}`,
        body,
        created_at: new Date().toISOString(),
        sender_id: userId,
        sender_name: "Kamu",
        mine: true,
      };
      setMessages((prev) => [...prev, temp]);
    },
    [userId]
  );

  return { messages, appendOptimistic, setMessages };
}
