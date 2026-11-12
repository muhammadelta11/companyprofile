"use client";

import { useCallback, useEffect, useState } from "react";
import { getChatUnreadBadge, savePushSubscription } from "@/app/actions";
import { createBrowserSupabase } from "@/lib/supabase/browser";

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

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}

async function ensurePushSubscription() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  if (!publicKey) return false;
  if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    return false;
  }
  if (Notification.permission !== "granted") return false;
  const reg = await navigator.serviceWorker.ready;
  const sub =
    (await reg.pushManager.getSubscription()) ||
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    }));
  const json = sub.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return false;
  const res = await savePushSubscription({
    endpoint: json.endpoint,
    keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
    userAgent: navigator.userAgent,
  });
  return Boolean(res.ok);
}

/**
 * Sinkron unread → badge ikon PWA + opt-in Web Push (Android).
 * Angka di menu Chat tetap dari server (DashNav).
 */
export function ChatNotify({ initialCount = 0 }: { initialCount?: number }) {
  const [pushState, setPushState] = useState<"idle" | "on" | "denied" | "unsupported">("idle");

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
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setPushState("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setPushState("denied");
      return;
    }
    if (Notification.permission === "granted") {
      void ensurePushSubscription().then((ok) => setPushState(ok ? "on" : "idle"));
      return;
    }
    setPushState("idle");
  }, []);

  async function enablePush() {
    if (!("Notification" in window)) {
      setPushState("unsupported");
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setPushState("denied");
      return;
    }
    const ok = await ensurePushSubscription();
    setPushState(ok ? "on" : "idle");
  }

  if (pushState === "unsupported" || pushState === "on") return null;

  return (
    <button type="button" className="dash-chat-notify__push" onClick={() => void enablePush()}>
      {pushState === "denied" ? "Notifikasi diblokir" : "Aktifkan notif HP"}
    </button>
  );
}
