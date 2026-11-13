"use client";

import { useCallback, useEffect } from "react";
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

/** Sinkron unread → badge ikon PWA. Opt-in push ada di banner PushSetup. */
export function ChatNotify({ initialCount = 0 }: { initialCount?: number }) {
  const refresh = useCallback(async () => {
    const res = await getChatUnreadBadge();
    const next = res.count || 0;
    setAppBadge(next);
    window.dispatchEvent(new CustomEvent("chat-unread", { detail: { count: next } }));
  }, []);

  useEffect(() => {
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
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [refresh]);

  useEffect(() => {
    if (!pushSupported()) return;
    if (Notification.permission === "granted") void enableWebPush();
  }, []);

  return null;
}
