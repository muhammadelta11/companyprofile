"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { sendProductChatMessage } from "@/app/actions";
import { useProductChatRealtime } from "@/hooks/useProductChatRealtime";
import type { ProductChatMessage } from "@/lib/product-chat";

function formatWhen(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  try {
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return iso;
  }
}

export function DashChatThread({
  productId,
  productTitle,
  threadId,
  userId,
  buyerLabel,
  initialMessages,
}: {
  productId: string;
  productTitle: string;
  threadId: string;
  userId: string;
  buyerLabel: string;
  initialMessages: ProductChatMessage[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const startedAt = useRef(0);
  const listRef = useRef<HTMLDivElement>(null);

  const { messages, appendOptimistic } = useProductChatRealtime({
    threadId,
    userId,
    initial: initialMessages,
    otherName: buyerLabel,
  });

  useEffect(() => {
    startedAt.current = Date.now();
  }, [threadId]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, threadId]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const body = String(fd.get("body") ?? "").trim();
    if (!body) return;
    setError(null);
    appendOptimistic(body);
    form.reset();
    start(async () => {
      const res = await sendProductChatMessage({
        productId,
        threadId,
        body,
        website: String(fd.get("website") ?? ""),
        startedAt: startedAt.current,
      });
      if (res.error) {
        setError(res.error);
        router.refresh();
      }
    });
  }

  return (
    <>
      <header className="dash-chat__pane-head">
        <div>
          <strong>{productTitle}</strong>
          <p>{buyerLabel}</p>
        </div>
        <div className="dash-chat__pane-actions">
          <Link className="btn btn-outline btn-sm" href={`/market/${productId}/chat`}>
            Buka chat
          </Link>
          <Link className="btn btn-outline btn-sm" href={`/market/${productId}`}>
            Lihat produk
          </Link>
        </div>
      </header>
      <div className="dash-chat__messages" ref={listRef}>
        {messages.length ? (
          messages.map((m) => (
            <div key={m.id} className={`dash-chat__bubble${m.mine ? " is-mine" : ""}`}>
              <div className="dash-chat__meta">
                <strong>{m.mine ? "Kamu" : m.sender_name}</strong>
                <span>{formatWhen(m.created_at)}</span>
              </div>
              <p>{m.body}</p>
            </div>
          ))
        ) : (
          <p className="dash-empty">Belum ada pesan.</p>
        )}
      </div>
      <form className="dash-chat__form" onSubmit={onSubmit}>
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="order-sheet__hp"
        />
        <textarea
          name="body"
          rows={2}
          required
          maxLength={2000}
          placeholder="Balas pesan…"
          disabled={pending}
        />
        {error ? <p className="form-msg form-msg--error">{error}</p> : null}
        <button type="submit" className="btn btn-teal" disabled={pending}>
          {pending ? "Mengirim…" : "Kirim"}
        </button>
      </form>
    </>
  );
}
