"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";

type TurnstileApi = {
  render: (
    el: HTMLElement,
    opts: {
      sitekey: string;
      action: string;
      theme?: "light" | "dark" | "auto";
      callback?: (token: string) => void;
      "expired-callback"?: () => void;
      "error-callback"?: () => void;
    }
  ) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SITEKEY = process.env.NEXT_PUBLIC_TURNSTILE_SITEKEY ?? "";

type Props = {
  /** Action Turnstile (1–32 char), harus cocok di server. */
  action: string;
  className?: string;
  /** Naikkan angka ini untuk reset widget setelah submit. */
  resetKey?: number;
};

/**
 * Widget Cloudflare Turnstile.
 * Kosong jika NEXT_PUBLIC_TURNSTILE_SITEKEY belum diisi.
 * Token ikut FormData lewat input hidden `cf-turnstile-response`.
 */
export function TurnstileField({ action, className, resetKey = 0 }: Props) {
  const boxRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const [token, setToken] = useState("");
  const [apiReady, setApiReady] = useState(false);

  const teardown = useCallback(() => {
    if (widgetId.current && window.turnstile) {
      try {
        window.turnstile.remove(widgetId.current);
      } catch {
        /* ignore */
      }
    }
    widgetId.current = null;
    setToken("");
  }, []);

  const mount = useCallback(() => {
    if (!SITEKEY || !boxRef.current || !window.turnstile) return;
    teardown();
    widgetId.current = window.turnstile.render(boxRef.current, {
      sitekey: SITEKEY,
      action,
      theme: "auto",
      callback: (t) => setToken(t),
      "expired-callback": () => setToken(""),
      "error-callback": () => setToken(""),
    });
  }, [action, teardown]);

  useEffect(() => {
    if (!SITEKEY || !apiReady) return;
    mount();
    return teardown;
  }, [SITEKEY, apiReady, resetKey, mount, teardown]);

  if (!SITEKEY) return null;

  return (
    <div className={className ?? "turnstile-field"} data-turnstile-action={action}>
      <Script
        id={`cf-turnstile-api`}
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={() => setApiReady(true)}
      />
      <div ref={boxRef} />
      <input type="hidden" name="cf-turnstile-response" value={token} readOnly />
      {!token ? (
        <p className="turnstile-field__hint">Selesaikan verifikasi keamanan di atas.</p>
      ) : null}
    </div>
  );
}

export function isTurnstileEnabled() {
  return Boolean(SITEKEY);
}
