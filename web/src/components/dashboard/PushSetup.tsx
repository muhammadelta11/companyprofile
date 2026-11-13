"use client";

import { useEffect, useState } from "react";
import { sendTestPushToMe } from "@/app/actions";
import {
  enableWebPush,
  pushSupported,
  vapidPublicKey,
} from "@/lib/push-client";

type State = "loading" | "need" | "on" | "denied" | "unsupported" | "novapid";

/**
 * Banner jelas di dashboard: aktifkan notifikasi HP + uji kirim.
 */
export function PushSetup() {
  const [state, setState] = useState<State>("loading");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!pushSupported()) {
      setState("unsupported");
      return;
    }
    if (!vapidPublicKey()) {
      setState("novapid");
      return;
    }
    if (Notification.permission === "denied") {
      setState("denied");
      return;
    }
    if (Notification.permission === "granted") {
      // Pastikan subscription tersimpan (ulang aman).
      void enableWebPush().then((res) => setState(res.ok ? "on" : "need"));
      return;
    }
    setState("need");
  }, []);

  async function onEnable() {
    setBusy(true);
    setMsg(null);
    const res = await enableWebPush();
    setBusy(false);
    if (res.ok) {
      setState("on");
      setMsg("Notifikasi aktif. Coba tutup app, lalu minta orang kirim chat/masukan.");
      return;
    }
    if (Notification.permission === "denied") setState("denied");
    setMsg(res.reason);
  }

  async function onTest() {
    setBusy(true);
    setMsg(null);
    const res = await sendTestPushToMe();
    setBusy(false);
    if (res.error) {
      setMsg(res.error);
      return;
    }
    setMsg("Push uji terkirim. Cek nampan notifikasi HP (boleh tutup tab dulu).");
  }

  if (state === "loading") return null;

  if (state === "unsupported") {
    return (
      <aside className="push-setup is-warn">
        <strong>Notifikasi tidak didukung</strong>
        <p>Pakai Chrome/Edge di Android, atau pasang app ke layar utama (PWA).</p>
      </aside>
    );
  }

  if (state === "novapid") {
    return (
      <aside className="push-setup is-warn">
        <strong>Notifikasi belum dikonfigurasi</strong>
        <p>Env VAPID belum terbaca di production. Redeploy setelah isi kunci VAPID di Vercel.</p>
      </aside>
    );
  }

  if (state === "denied") {
    return (
      <aside className="push-setup is-warn">
        <strong>Notifikasi diblokir</strong>
        <p>
          Di Chrome Android: ketuk gembok/ikon situs → Izin → Notifikasi → Izinkan, lalu muat ulang.
        </p>
      </aside>
    );
  }

  if (state === "on") {
    return (
      <aside className="push-setup is-on">
        <div>
          <strong>Notifikasi aktif</strong>
          <p>Chat & laporan masuk tetap kebaca di luar app.</p>
        </div>
        <button type="button" className="btn btn-outline btn-sm" disabled={busy} onClick={() => void onTest()}>
          {busy ? "…" : "Uji"}
        </button>
        {msg ? <p className="push-setup__msg">{msg}</p> : null}
      </aside>
    );
  }

  return (
    <aside className="push-setup">
      <div>
        <strong>Nyalakan notifikasi</strong>
        <p>Dapatkan alert chat & laporan di HP.</p>
      </div>
      <button type="button" className="btn btn-teal btn-sm" disabled={busy} onClick={() => void onEnable()}>
        {busy ? "…" : "Aktifkan"}
      </button>
      {msg ? <p className="push-setup__msg is-error">{msg}</p> : null}
    </aside>
  );
}
