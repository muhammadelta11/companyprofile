"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { fetchProductThreadMessages, markProductChatRead } from "@/app/actions";
import { DashChatThread } from "@/components/dashboard/DashChatThread";
import type { ProductChatMessage, ProductChatThread } from "@/lib/product-chat-shared";

function formatWhen(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const j = new Date(d.getTime() + 7 * 60 * 60 * 1000);
  return `${j.getUTCDate()} ${months[j.getUTCMonth()]}, ${String(j.getUTCHours()).padStart(2, "0")}.${String(j.getUTCMinutes()).padStart(2, "0")}`;
}

type Props = {
  userId: string;
  threads: ProductChatThread[];
  initialId?: string | null;
  initialMessages?: ProductChatMessage[];
};

/** Inbox chat cepat: ganti thread di client, tanpa reload halaman penuh. */
export function DashChatInbox({
  userId,
  threads: initialThreads,
  initialId = null,
  initialMessages = [],
}: Props) {
  const [threads, setThreads] = useState(initialThreads);
  const [activeId, setActiveId] = useState<string | null>(initialId);
  const [messages, setMessages] = useState<ProductChatMessage[]>(
    initialId ? initialMessages : []
  );
  const [loading, setLoading] = useState(false);
  const [, start] = useTransition();

  const active = activeId ? threads.find((t) => t.id === activeId) ?? null : null;

  useEffect(() => {
    setThreads(initialThreads);
  }, [initialThreads]);

  useEffect(() => {
    if (!initialId) return;
    void markProductChatRead(initialId);
  }, [initialId]);

  const loadThread = useCallback(
    (thread: ProductChatThread) => {
      if (thread.id === activeId && !loading) {
        setThreads((prev) =>
          prev.map((t) => (t.id === thread.id ? { ...t, unread: 0 } : t))
        );
        return;
      }

      // Highlight langsung biar terasa responsif.
      setActiveId(thread.id);
      setThreads((prev) =>
        prev.map((t) => (t.id === thread.id ? { ...t, unread: 0 } : t))
      );
      try {
        window.history.replaceState(null, "", `/dashboard/chat?id=${thread.id}`);
      } catch {
        /* ignore */
      }

      setLoading(true);
      setMessages([]);
      start(async () => {
        const [res] = await Promise.all([
          fetchProductThreadMessages(thread.id),
          markProductChatRead(thread.id),
        ]);
        setMessages(res.messages ?? []);
        setLoading(false);
      });
    },
    [activeId, loading]
  );

  function backToList() {
    setActiveId(null);
    setMessages([]);
    setLoading(false);
    try {
      window.history.replaceState(null, "", "/dashboard/chat");
    } catch {
      /* ignore */
    }
  }

  if (!threads.length) {
    return (
      <p className="dash-empty">
        Belum ada chat. Pembeli memulai dari tombol Chat penjual di Market.
      </p>
    );
  }

  const buyerLabel = active
    ? active.buyer_id === userId
      ? "Kamu sebagai pembeli"
      : `Pembeli: ${active.buyer_name}`
    : "";

  return (
    <div className={`dash-chat-page${active ? " is-open" : ""}`}>
      <div className={`dash-chat${active ? " has-thread" : ""}`}>
        <aside className="dash-chat__list" aria-label="Daftar percakapan">
          <p className="dash-chat__list-head">{threads.length} percakapan</p>
          {threads.map((t) => {
            const selected = t.id === activeId;
            const unread = t.unread ?? 0;
            const iAmBuyer = t.buyer_id === userId;
            const title = t.product_title || "Produk";
            const subtitle = iAmBuyer ? "Kamu · pembeli" : t.buyer_name || "Pembeli";
            const initial = (iAmBuyer ? title : subtitle).slice(0, 1).toUpperCase();
            return (
              <button
                key={t.id}
                type="button"
                className={`dash-chat__item${selected ? " is-active" : ""}${unread > 0 ? " is-unread" : ""}`}
                onClick={() => loadThread(t)}
              >
                <span className="dash-chat__avatar" aria-hidden="true">
                  {initial}
                </span>
                <span className="dash-chat__item-body">
                  <strong>
                    {title}
                    {unread > 0 ? <em>{unread > 9 ? "9+" : unread}</em> : null}
                  </strong>
                  <span>{subtitle}</span>
                  <p>{t.preview || "Belum ada pesan"}</p>
                </span>
                <time dateTime={t.last_message_at}>{formatWhen(t.last_message_at)}</time>
              </button>
            );
          })}
        </aside>

        <section className="dash-chat__pane">
          {active ? (
            loading ? (
              <div className="dash-chat__idle dash-chat__idle--loading">
                <p>Memuat pesan…</p>
              </div>
            ) : (
              <DashChatThread
                key={active.id}
                productId={active.product_id}
                productTitle={active.product_title || "Produk"}
                threadId={active.id}
                userId={userId}
                buyerLabel={buyerLabel}
                initialMessages={messages}
                onBack={backToList}
              />
            )
          ) : (
            <div className="dash-chat__idle">
              <p>Pilih percakapan di daftar.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
