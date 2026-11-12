"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { fetchProductThreadMessages, sendProductChatMessage } from "@/app/actions";
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
  productHref?: string;
  sellerName?: string;
  canChat: boolean;
  isSellerView: boolean;
  userId?: string | null;
  userName?: string | null;
  thread: ProductChatThread | null;
  messages: ProductChatMessage[];
  sellerThreads?: ProductChatThread[];
  /** page = ruang chat penuh; embed = panel di halaman lain */
  variant?: "page" | "embed";
};

export function ProductChat({
  productId,
  productTitle,
  productHref,
  sellerName,
  canChat,
  isSellerView,
  userId,
  userName,
  thread,
  messages,
  sellerThreads = [],
  variant = "page",
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
  const chatPath = `/market/${productId}/chat`;
  const isPage = variant === "page";

  const [seedMessages, setSeedMessages] = useState(messages);
  const subscribeId = isSellerView ? activeThreadId : localThreadId ?? thread?.id ?? null;
  const { messages: liveMessages, appendOptimistic } = useProductChatRealtime({
    threadId: subscribeId,
    userId: userId ?? null,
    initial: seedMessages,
    otherName: isSellerView ? "Pembeli" : sellerName || "Penjual",
  });

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  useEffect(() => {
    setActiveThreadId(thread?.id ?? sellerThreads[0]?.id ?? null);
    setLocalThreadId(thread?.id ?? null);
    setSeedMessages(messages);
  }, [thread?.id, sellerThreads, messages]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [liveMessages, activeThreadId]);

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
      if (res.threadId && !thread?.id && !isSellerView) {
        router.refresh();
      }
    });
  }

  const activeBuyer =
    isSellerView && activeThreadId
      ? sellerThreads.find((t) => t.id === activeThreadId)
      : null;

  async function switchSellerThread(id: string | null) {
    setActiveThreadId(id);
    if (!id) {
      setSeedMessages([]);
      return;
    }
    if (isPage) {
      router.push(`${chatPath}?chat=${id}`);
      return;
    }
    const res = await fetchProductThreadMessages(id);
    if (res.messages) setSeedMessages(res.messages);
  }

  return (
    <section
      className={`mk-chat${isPage ? " mk-chat--page" : " mk-chat--embed"}`}
      aria-labelledby="mk-chat-title"
    >
      <h2 id="mk-chat-title" className={isPage ? "mk-chat__title" : "sr-only"}>
        {isSellerView
          ? activeBuyer
            ? activeBuyer.buyer_name || "Pembeli"
            : "Inbox"
          : sellerName || productTitle}
      </h2>
      {isPage ? (
        <p className="mk-chat__sub">
          {productHref ? <Link href={productHref}>{productTitle}</Link> : productTitle}
        </p>
      ) : null}

      {!canChat ? (
        <div className="mk-chat__gate">
          <p>Masuk untuk mengirim pesan.</p>
          <Link className="btn btn-teal btn-sm" href={loginHref(chatPath)}>
            Masuk
          </Link>
        </div>
      ) : isSellerView ? (
        <>
          {sellerThreads.length === 0 ? (
            <p className="mk-chat__empty">Belum ada pesan masuk.</p>
          ) : (
            <>
              <label className="mk-chat__pick">
                <span className="sr-only">Pembeli</span>
                <select
                  value={activeThreadId ?? ""}
                  onChange={(e) => {
                    void switchSellerThread(e.target.value || null);
                  }}
                >
                  {sellerThreads.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.buyer_name || "Pembeli"} · {formatWhen(t.last_message_at)}
                    </option>
                  ))}
                </select>
              </label>
              <MessageList
                messages={liveMessages}
                listRef={listRef}
                empty="Pilih percakapan."
                compact
              />
              <ChatForm
                userName={userName}
                pending={pending}
                error={error}
                onSubmit={onSubmit}
                disabled={!activeThreadId}
                compact={!isPage}
              />
            </>
          )}
          {isPage ? (
            <p className="mk-chat__dash">
              <Link href="/dashboard/chat">Semua chat</Link>
            </p>
          ) : null}
        </>
      ) : (
        <>
          <MessageList
            messages={liveMessages}
            listRef={listRef}
            empty="Belum ada pesan. Mulai percakapan."
            compact
          />
          <ChatForm
            userName={userName}
            pending={pending}
            error={error}
            onSubmit={onSubmit}
            compact={!isPage}
          />
        </>
      )}
    </section>
  );
}

function MessageList({
  messages,
  listRef,
  empty,
  compact,
}: {
  messages: ProductChatMessage[];
  listRef: React.RefObject<HTMLDivElement | null>;
  empty: string;
  compact?: boolean;
}) {
  if (!messages.length) {
    return <p className="mk-chat__empty">{empty}</p>;
  }
  return (
    <div className={`mk-chat__list${compact ? " is-compact" : ""}`} ref={listRef}>
      {messages.map((m) => (
        <div key={m.id} className={`mk-chat__bubble${m.mine ? " is-mine" : ""}`}>
          <p>{m.body}</p>
          <time dateTime={m.created_at}>{formatWhen(m.created_at)}</time>
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
  compact,
}: {
  userName?: string | null;
  pending: boolean;
  error: string | null;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  disabled?: boolean;
  compact?: boolean;
}) {
  return (
    <form className={`mk-chat__form${compact ? " is-compact" : ""}`} onSubmit={onSubmit}>
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
      {compact ? (
        <input
          id="mk-chat-body"
          name="body"
          type="text"
          required
          minLength={1}
          maxLength={2000}
          placeholder="Tulis pesan…"
          disabled={disabled || pending}
          autoComplete="off"
        />
      ) : (
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
      )}
      {error ? <p className="form-msg form-msg--error">{error}</p> : null}
      <button
        type="submit"
        className={compact ? "mk-chat__send" : "btn btn-teal"}
        disabled={disabled || pending}
        aria-label={pending ? "Mengirim" : "Kirim"}
      >
        {compact ? (
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path
              fill="currentColor"
              d="M3.4 20.6 21 12 3.4 3.4l.1 7.1L15 12 3.5 13.5z"
            />
          </svg>
        ) : pending ? (
          "Mengirim…"
        ) : (
          "Kirim"
        )}
      </button>
    </form>
  );
}
