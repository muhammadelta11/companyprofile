"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { loadProductChatRoom } from "@/app/actions";
import { loginHref } from "@/lib/access-policy";
import { ProductChat } from "@/components/market/ProductChat";
import type { ProductChatMessage, ProductChatThread } from "@/lib/product-chat";

type Room = {
  productId: string;
  productTitle: string;
  productHref: string;
  productImage: string | null;
  sellerName: string;
  canChat: boolean;
  isSellerView: boolean;
  userId: string;
  userName: string;
  thread: ProductChatThread | null;
  messages: ProductChatMessage[];
  sellerThreads: ProductChatThread[];
};

/** Panel chat penjual di app — ringkas seperti chat marketplace. */
export function SellerChatPanel() {
  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needLogin, setNeedLogin] = useState(false);
  const [room, setRoom] = useState<Room | null>(null);

  const close = useCallback(() => {
    setOpen(false);
    setProductId(null);
    setRoom(null);
    setError(null);
    setNeedLogin(false);
    document.documentElement.classList.remove("seller-chat-open");
  }, []);

  const openFor = useCallback((id: string) => {
    setProductId(id);
    setOpen(true);
    setError(null);
    setNeedLogin(false);
    setRoom(null);
    document.documentElement.classList.add("seller-chat-open");
  }, []);

  useEffect(() => {
    const onOpen = (e: Event) => {
      const detail = (e as CustomEvent<{ productId?: string }>).detail;
      const id = detail?.productId;
      if (typeof id === "string" && id) openFor(id);
    };
    window.addEventListener("seller-chat:open", onOpen);
    return () => window.removeEventListener("seller-chat:open", onOpen);
  }, [openFor]);

  useEffect(() => {
    if (!open) return;
    document.documentElement.classList.add("seller-chat-open");
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.classList.remove("seller-chat-open");
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  useEffect(() => {
    if (!open || !productId) return;
    let cancelled = false;
    setLoading(true);
    void loadProductChatRoom(productId).then((res) => {
      if (cancelled) return;
      setLoading(false);
      if (res.needLogin) {
        setNeedLogin(true);
        return;
      }
      if (res.error || !res.productId || !res.productTitle) {
        setError(res.error || "Gagal membuka chat.");
        return;
      }
      setRoom({
        productId: res.productId,
        productTitle: res.productTitle,
        productHref: res.productHref || `/market/${res.productId}`,
        productImage: res.productImage ?? null,
        sellerName: res.sellerName || "Penjual",
        canChat: Boolean(res.canChat),
        isSellerView: Boolean(res.isSellerView),
        userId: res.userId || "",
        userName: res.userName || "",
        thread: res.thread ?? null,
        messages: res.messages ?? [],
        sellerThreads: res.sellerThreads ?? [],
      });
    });
    return () => {
      cancelled = true;
    };
  }, [open, productId]);

  if (!open) return null;

  const loginNext = productId ? `/market/${productId}/chat` : "/market";
  const title = room
    ? room.isSellerView
      ? "Inbox"
      : room.sellerName
    : "Chat";
  const subtitle = room
    ? room.isSellerView
      ? room.productTitle
      : room.productTitle
    : "Memuat…";

  return (
    <div
      className="delta-overlay seller-chat-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Chat penjual"
    >
      <button className="delta-backdrop" type="button" aria-label="Tutup" onClick={close} />
      <aside className="delta-panel seller-chat-panel">
        <header className="seller-chat-panel__head">
          <div className="seller-chat-panel__brand">
            {room?.productImage ? (
              <Link href={room.productHref} onClick={close} className="seller-chat-panel__thumb-link">
                <Image
                  src={room.productImage}
                  alt=""
                  width={40}
                  height={40}
                  className="seller-chat-panel__thumb"
                />
              </Link>
            ) : (
              <span className="seller-chat-panel__thumb seller-chat-panel__thumb--empty" aria-hidden>
                {title.slice(0, 1)}
              </span>
            )}
            <div className="seller-chat-panel__titles">
              <h2>{title}</h2>
              <p>{subtitle}</p>
            </div>
          </div>
          <div className="seller-chat-panel__actions">
            {productId ? (
              <Link
                className="seller-chat-panel__icon-btn"
                href={`/market/${productId}/chat`}
                onClick={close}
                aria-label="Buka layar penuh"
                title="Layar penuh"
              >
                ↗
              </Link>
            ) : null}
            <button
              type="button"
              className="seller-chat-panel__icon-btn"
              onClick={close}
              aria-label="Tutup"
            >
              ×
            </button>
          </div>
        </header>

        <div className="seller-chat-panel__body">
          {loading ? (
            <p className="seller-chat-panel__state">Memuat…</p>
          ) : needLogin ? (
            <div className="seller-chat-panel__gate">
              <p>Masuk untuk mengirim pesan.</p>
              <Link className="btn btn-teal btn-sm" href={loginHref(loginNext)} onClick={close}>
                Masuk
              </Link>
            </div>
          ) : error ? (
            <p className="seller-chat-panel__state is-error">{error}</p>
          ) : room ? (
            <ProductChat
              key={`${room.productId}-${room.thread?.id ?? "new"}`}
              variant="embed"
              productId={room.productId}
              productTitle={room.productTitle}
              productHref={room.productHref}
              sellerName={room.sellerName}
              canChat={room.canChat}
              isSellerView={room.isSellerView}
              userId={room.userId}
              userName={room.userName}
              thread={room.thread}
              messages={room.messages}
              sellerThreads={room.sellerThreads}
            />
          ) : null}
        </div>
      </aside>
    </div>
  );
}

export function openSellerChat(productId: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("seller-chat:open", { detail: { productId } }));
}
