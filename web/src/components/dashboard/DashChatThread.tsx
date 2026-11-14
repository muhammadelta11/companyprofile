"use client";

import Link from "next/link";
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
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const startedAt = useRef(0);
  const listRef = useRef<HTMLDivElement>(null);

  const { messages, appendOptimistic, confirmOptimistic } = useProductChatRealtime({
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
        return;
      }
      if (res.messageId) {
        confirmOptimistic(body, {
          id: res.messageId,
          created_at: res.createdAt,
        });
      }
    });
  }

  return (
    <>
      <header className="dash-chat__pane-head">
        <Link href="/dashboard/chat" className="dash-chat__back" aria-label="Kembali ke daftar">
          ←
        </Link>
        <div className="dash-chat__pane-who">
          <span className="dash-chat__avatar" aria-hidden="true">
            {(buyerLabel.replace(/^Pembeli:\s*/i, "") || "P").slice(0, 1).toUpperCase()}
          </span>
          <div>
            <strong>{buyerLabel.replace(/^Pembeli:\s*/i, "") || "Pembeli"}</strong>
            <p>
              <Link href={`/market/${productId}`}>{productTitle}</Link>
            </p>
          </div>
        </div>
      </header>
      <div className="dash-chat__messages" ref={listRef}>
        {messages.length ? (
          messages.map((m) => (
            <div key={m.id} className={`dash-chat__bubble${m.mine ? " is-mine" : ""}`}>
              <p>{m.body}</p>
              <time dateTime={m.created_at}>{formatWhen(m.created_at)}</time>
            </div>
          ))
        ) : (
          <p className="dash-chat__empty">Belum ada pesan. Mulai balas di bawah.</p>
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
        <input
          name="body"
          type="text"
          required
          maxLength={2000}
          placeholder="Ketik pesan…"
          disabled={pending}
          autoComplete="off"
        />
        {error ? <p className="form-msg form-msg--error">{error}</p> : null}
        <button type="submit" className="dash-chat__send" disabled={pending} aria-label="Kirim">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path
              fill="currentColor"
              d="M3.4 20.6 21 12 3.4 3.4l.1 7.1L15 12 3.5 13.5z"
            />
          </svg>
        </button>
      </form>
    </>
  );
}
