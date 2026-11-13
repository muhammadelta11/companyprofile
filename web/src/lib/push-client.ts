"use client";

import { savePushSubscription } from "@/app/actions";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}

export function pushSupported() {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

export function vapidPublicKey() {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() || "";
}

/** Pastikan SW terpasang (jangan andalkan idle callback). */
export async function ensureServiceWorker() {
  if (!("serviceWorker" in navigator)) throw new Error("Browser tidak mendukung service worker.");
  const existing = await navigator.serviceWorker.getRegistration();
  if (existing?.active) return existing;
  return navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" });
}

export type EnablePushResult =
  | { ok: true }
  | { ok: false; reason: string };

/** Minta izin + simpan subscription ke server. */
export async function enableWebPush(): Promise<EnablePushResult> {
  if (!pushSupported()) {
    return { ok: false, reason: "Browser ini tidak mendukung notifikasi push." };
  }
  const publicKey = vapidPublicKey();
  if (!publicKey) {
    return {
      ok: false,
      reason: "Kunci VAPID belum terpasang di server. Hubungi admin / redeploy env.",
    };
  }

  try {
    await ensureServiceWorker();
    await navigator.serviceWorker.ready;

    let permission = Notification.permission;
    if (permission === "default") {
      permission = await Notification.requestPermission();
    }
    if (permission !== "granted") {
      return {
        ok: false,
        reason:
          permission === "denied"
            ? "Notifikasi diblokir. Buka pengaturan situs di browser/HP, izinkan Notifikasi."
            : "Izin notifikasi belum diberikan.",
      };
    }

    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
    }

    const json = sub.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
      return { ok: false, reason: "Gagal membuat subscription push." };
    }

    const res = await savePushSubscription({
      endpoint: json.endpoint,
      keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
      userAgent: navigator.userAgent,
    });
    if (!res.ok) {
      const map: Record<string, string> = {
        db: "Database belum siap.",
        login: "Sesi habis — masuk lagi.",
        invalid: "Data subscription tidak valid.",
        save_failed:
          "Gagal menyimpan ke server. Pastikan product-chat-notify.sql sudah dijalankan di Supabase.",
      };
      return { ok: false, reason: map[res.error || ""] || "Gagal menyimpan notifikasi." };
    }

    // Notifikasi uji lokal (bukan push server) supaya user langsung lihat berhasil.
    try {
      await reg.showNotification("Notifikasi aktif", {
        body: "Siap. Chat, masukan, dan pesanan akan muncul di sini.",
        icon: "/icons/icon-192.png",
        tag: "push-setup",
        data: { url: "/dashboard" },
      });
    } catch {
      /* ignore */
    }

    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal mengaktifkan notifikasi.";
    return { ok: false, reason: msg };
  }
}
