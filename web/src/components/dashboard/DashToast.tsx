"use client";

import { useEffect, useState } from "react";

/** Toast global dashboard (tersimpan, dll.). */
export function DashToast() {
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    try {
      const pending = sessionStorage.getItem("dash-toast");
      if (pending) {
        sessionStorage.removeItem("dash-toast");
        setMsg(pending);
      }
    } catch {
      /* ignore */
    }
    const onToast = (e: Event) => {
      const text = (e as CustomEvent<{ message?: string }>).detail?.message;
      if (!text) return;
      setMsg(text);
    };
    window.addEventListener("dash-toast", onToast);
    return () => window.removeEventListener("dash-toast", onToast);
  }, []);

  useEffect(() => {
    if (!msg) return;
    const ms = msg.length > 60 ? 8000 : 3200;
    const t = window.setTimeout(() => setMsg(null), ms);
    return () => window.clearTimeout(t);
  }, [msg]);

  if (!msg) return null;
  return (
    <div className="dash-toast dash-toast--ok" role="status">
      {msg}
    </div>
  );
}
