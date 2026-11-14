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

function sortMessages(list: ProductChatMessage[]) {
  return [...list].sort(
    (a, b) => Date.parse(a.created_at) - Date.parse(b.created_at) || a.id.localeCompare(b.id)
  );
}

/** Gabungkan server + lokal: jangan buang bubble temp saat threadId baru muncul. */
function mergeMessages(prev: ProductChatMessage[], initial: ProductChatMessage[]) {
  const byId = new Map<string, ProductChatMessage>();
  for (const m of initial) byId.set(m.id, m);

  const mineBodies = new Set(initial.filter((m) => m.mine).map((m) => m.body));
  for (const m of prev) {
    if (m.id.startsWith("temp-")) {
      if (!mineBodies.has(m.body)) byId.set(m.id, m);
      continue;
    }
    if (!byId.has(m.id)) byId.set(m.id, m);
  }
  return sortMessages([...byId.values()]);
}

export function useProductChatRealtime({
  threadId,
  userId,
  initial,
  otherName = "Lawan bicara",
}: Options) {
  const [messages, setMessages] = useState(() => mergeMessages([], initial));

  useEffect(() => {
    setMessages((prev) => mergeMessages(prev, initial));
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
            return sortMessages([
              ...withoutTemp,
              {
                id: String(row.id),
                body: String(row.body ?? ""),
                created_at: String(row.created_at ?? new Date().toISOString()),
                sender_id: senderId,
                sender_name: mine ? "Kamu" : known?.sender_name || otherName,
                mine,
              },
            ]);
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

  /** Ganti temp-* dengan pesan server (penting saat thread baru — realtime sering kelewatan INSERT). */
  const confirmOptimistic = useCallback(
    (body: string, confirmed: { id: string; created_at?: string }) => {
      if (!userId) return;
      setMessages((prev) => {
        const withoutTemp = prev.filter(
          (m) => !(m.id.startsWith("temp-") && m.mine && m.body === body)
        );
        if (withoutTemp.some((m) => m.id === confirmed.id)) return withoutTemp;
        return sortMessages([
          ...withoutTemp,
          {
            id: confirmed.id,
            body,
            created_at: confirmed.created_at ?? new Date().toISOString(),
            sender_id: userId,
            sender_name: "Kamu",
            mine: true,
          },
        ]);
      });
    },
    [userId]
  );

  return { messages, appendOptimistic, confirmOptimistic, setMessages };
}
