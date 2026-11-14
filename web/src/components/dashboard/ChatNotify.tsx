"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getChatUnreadBadge } from "@/app/actions";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { enableWebPush, pushSupported } from "@/lib/push-client";

function setAppBadge(count: number) {
  try {
    if (count > 0 && "setAppBadge" in navigator) {
      void (navigator as Navigator & { setAppBadge: (n?: number) => Promise<void> }).setAppBadge(
        count
      );
    } else if (count <= 0 && "clearAppBadge" in navigator) {
      void (navigator as Navigator & { clearAppBadge: () => Promise<void> }).clearAppBadge();
    }
  } catch {
    // Badging API tidak didukung / ditolak.
  }
}

/** Lonceng unread chat + sinkron badge PWA. */
export function ChatNotify({ initialCount = 0 }: { initialCount?: number }) {
  const [count, setCount] = useState(initialCount);
  const [open, setOpen] = useState(false);

  const refresh = useCallback(async () => {
    const res = await getChatUnreadBadge();
    const next = res.count || 0;
    setCount(next);
    setAppBadge(next);
    window.dispatchEvent(new CustomEvent("chat-unread", { detail: { count: next } }));
  }, []);

  useEffect(() => {
    setCount(initialCount);
    setAppBadge(initialCount);
    window.dispatchEvent(new CustomEvent("chat-unread", { detail: { count: initialCount } }));
  }, [initialCount]);

  useEffect(() => {
    const supabase = createBrowserSupabase();
    if (!supabase) return;
    const channel = supabase
      .channel("dash-chat-unread")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "product_threads" },
        () => {
          void refresh();
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "product_messages" },
        () => {
          void refresh();
        }
      )
      .subscribe();

    const onFocus = () => {
      void refresh();
    };
    const poll = window.setInterval(() => {
      void refresh();
    }, 45000);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);

    return () => {
      void supabase.removeChannel(channel);
      window.clearInterval(poll);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [refresh]);

  useEffect(() => {
    if (!pushSupported()) return;
    if (Notification.permission === "granted") void enableWebPush();
  }, []);

  return (
    <div className="dash-bell dash-bell--chat">
      <button
        type="button"
        className="dash-bell__btn"
        aria-label={count > 0 ? `${count} chat belum dibaca` : "Chat"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span aria-hidden="true">💬</span>
        {count > 0 ? <em>{count > 9 ? "9+" : count}</em> : null}
      </button>

      {open ? (
        <div className="dash-bell__panel" role="dialog" aria-label="Notifikasi chat">
          <header>
            <strong>Chat</strong>
            <button type="button" onClick={() => setOpen(false)}>
              Tutup
            </button>
          </header>
          {count > 0 ? (
            <p className="dash-bell__empty">
              Ada <strong>{count}</strong> pesan belum dibaca.
            </p>
          ) : (
            <p className="dash-bell__empty">Tidak ada chat baru.</p>
          )}
          <Link
            className="dash-bell__cta"
            href="/dashboard/chat"
            onClick={() => setOpen(false)}
          >
            Buka kotak masuk
          </Link>
        </div>
      ) : null}
    </div>
  );
}
