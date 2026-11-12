"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { sendProductChatMessage } from "@/app/actions";
import { useProductChatRealtime } from "@/hooks/useProductChatRealtime";
import { loginHref } from "@/lib/access-policy";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import type { ProductChatMessage, ProductChatThread } from "@/lib/product-chat";

function formatWhen(iso: string) {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "";
  try {
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(t));
  } catch {
    return "";
  }
}

type Props = {
  productId: string;
  productTitle: string;
  canChat: boolean;
  isSellerView: boolean;
  userId?: string | null;
  userName?: string | null;
  thread: ProductChatThread | null;
  messages: ProductChatMessage[];
  sellerThreads?: ProductChatThread[];
};

export function ProductChat({
  productId,
  productTitle,
  canChat,
  isSellerView,
  userId,
  userName,
  thread,
  messages,
  sellerThreads = [],
}: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [activeThreadId, setActiveThreadId] = useState<string | null>(
    thread?.id ?? sellerThreads[0]?.id ?? null
  );
  const [localThreadId, setLocalThreadId] = useState<string | null>(thread?.id ?? null);
  const startedAt = useRef(0);
  const listRef = useRef<HTMLDivElement>(null);
  const next = `/market/${productId}`;

  const subscribeId = isSellerView ? activeThreadId : localThreadId ?? thread?.id ?? null;
  const { messages: liveMessages, appendOptimistic } = useProductChatRealtime({
    threadId: subscribeId,
    userId: userId ?? null,
    initial: messages,
    otherName: isSellerView ? "Pembeli" : "Penjual",
  });

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  // Hash / flag dari tombol Chat di kartu → scroll ke panel chat.
  useEffect(() => {
    let shouldScroll = window.location.hash === "#chat-produk";
    try {
      if (sessionStorage.getItem("scroll-chat-produk") === productId) {
        shouldScroll = true;
        sessionStorage.removeItem("scroll-chat-produk");
      }
    } catch {
      /* ignore */
    }
    if (!shouldScroll) return;
    const t = window.setTimeout(() => {
      document.getElementById("chat-produk")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 80);
    return () => window.clearTimeout(t);
  }, [productId]);

  useEffect(() => {
    setActiveThreadId(thread?.id ?? sellerThreads[0]?.id ?? null);
    setLocalThreadId(thread?.id ?? null);
  }, [thread?.id, sellerThreads]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [liveMessages, activeThreadId]);

  // Thread baru dari pembeli → penjual langsung lihat daftar terbarui.
  useEffect(() => {
    if (!canChat || !isSellerView || !userId) return;
    const supabase = createBrowserSupabase();
    if (!supabase) return;
    const channel = supabase
      .channel(`product-threads:${productId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "product_threads",
          filter: `product_id=eq.${productId}`,
        },
        () => {
          router.refresh();
        }
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [canChat, isSellerView, userId, productId, router]);

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
        body,
        threadId: isSellerView
          ? activeThreadId ?? undefined
          : localThreadId ?? thread?.id ?? undefined,
        website: String(fd.get("website") ?? ""),
        startedAt: startedAt.current,
      });
      if (res.error) {
        setError(res.error);
        router.refresh();
        return;
      }
      if (res.threadId && !isSellerView) {
        setLocalThreadId(res.threadId);
      }
      // Realtime mengisi pesan final; refresh ringan jika thread baru.
      if (res.threadId && !thread?.id && !isSellerView) {
        router.refresh();
      }
    });
  }

  return (
    <section id="chat-produk" className="mk-chat" aria-labelledby="mk-chat-title">
      <div className="mk-chat__head">
        <h2 id="mk-chat-title">Chat produk</h2>
        <p className="mk-chat__hint">
          Privat, tersimpan, real-time. Wajib login.{" "}
          {isSellerView
            ? "Balas di sini atau di Dashboard → Chat."
            : `Tanya langsung soal “${productTitle}”.`}
        </p>
      </div>

      {!canChat ? (
        <div className="mk-chat__gate">
          <p>Chat wajib login. Setelah masuk, kamu langsung bisa kirim pesan di sini.</p>
          <Link className="btn btn-teal" href={loginHref(next)}>
            Masuk untuk chat
          </Link>
        </div>
      ) : isSellerView ? (
        <>
          {sellerThreads.length === 0 ? (
            <p className="mk-chat__empty">Belum ada chat dari pembeli untuk produk ini.</p>
          ) : (
            <>
              <label className="mk-chat__pick">
                Percakapan
                <select
                  value={activeThreadId ?? ""}
                  onChange={(e) => {
                    const id = e.target.value || null;
                    setActiveThreadId(id);
                    router.push(`/market/${productId}?chat=${id}`);
                  }}
                >
                  {sellerThreads.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.buyer_name || "Pembeli"} · {formatWhen(t.last_message_at)}
                    </option>
                  ))}
                </select>
              </label>
              <MessageList messages={liveMessages} listRef={listRef} empty="Pilih percakapan." />
              <ChatForm
                userName={userName}
                pending={pending}
                error={error}
                onSubmit={onSubmit}
                disabled={!activeThreadId}
              />
            </>
          )}
          <p className="mk-chat__dash">
            Semua chat: <Link href="/dashboard/chat">Dashboard → Chat</Link>
          </p>
        </>
      ) : (
        <>
          <MessageList
            messages={liveMessages}
            listRef={listRef}
            empty="Belum ada pesan. Mulai chat — balasan penjual muncul langsung."
          />
          <ChatForm userName={userName} pending={pending} error={error} onSubmit={onSubmit} />
        </>
      )}
    </section>
  );
}

function MessageList({
  messages,
  listRef,
  empty,
}: {
  messages: ProductChatMessage[];
  listRef: React.RefObject<HTMLDivElement | null>;
  empty: string;
}) {
  if (!messages.length) {
    return <p className="mk-chat__empty">{empty}</p>;
  }
  return (
    <div className="mk-chat__list" ref={listRef}>
      {messages.map((m) => (
        <div key={m.id} className={`mk-chat__bubble${m.mine ? " is-mine" : ""}`}>
          <div className="mk-chat__meta">
            <strong>{m.mine ? "Kamu" : m.sender_name}</strong>
            <time dateTime={m.created_at}>{formatWhen(m.created_at)}</time>
          </div>
          <p>{m.body}</p>
        </div>
      ))}
    </div>
  );
}

function ChatForm({
  userName,
  pending,
  error,
  onSubmit,
  disabled,
}: {
  userName?: string | null;
  pending: boolean;
  error: string | null;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  disabled?: boolean;
}) {
  return (
    <form className="mk-chat__form" onSubmit={onSubmit}>
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="order-sheet__hp"
      />
      <label className="sr-only" htmlFor="mk-chat-body">
        Pesan sebagai {userName || "member"}
      </label>
      <textarea
        id="mk-chat-body"
        name="body"
        rows={2}
        required
        minLength={1}
        maxLength={2000}
        placeholder="Tulis pesan…"
        disabled={disabled || pending}
      />
      {error ? <p className="form-msg form-msg--error">{error}</p> : null}
      <button type="submit" className="btn btn-teal" disabled={disabled || pending}>
        {pending ? "Mengirim…" : "Kirim"}
      </button>
    </form>
  );
}
