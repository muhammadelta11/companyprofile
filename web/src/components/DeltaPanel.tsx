"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { promptsFor } from "@/data/delta-knowledge";

type Msg = { role: "user" | "delta"; text: string; waUrl?: string };

const STORAGE_KEY = "delta-chat-v1";
const MAX_STORED = 40;

const WELCOME: Msg = {
  role: "delta",
  text: "Halo! Saya Delta. Mau kenalan dengan Mas'ud, cek jasa, Market, atau wisata? Langsung tanya saja.",
};

function loadMessages(): Msg[] {
  if (typeof window === "undefined") return [WELCOME];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [WELCOME];
    const parsed = JSON.parse(raw) as Msg[];
    if (!Array.isArray(parsed) || !parsed.length) return [WELCOME];
    const cleaned = parsed
      .filter(
        (m): m is Msg =>
          !!m &&
          (m.role === "user" || m.role === "delta") &&
          typeof m.text === "string" &&
          m.text.trim().length > 0
      )
      .slice(-MAX_STORED)
      .map((m) => ({
        role: m.role,
        text: m.text.slice(0, 2000),
        ...(typeof m.waUrl === "string" ? { waUrl: m.waUrl } : {}),
      }));
    return cleaned.length ? cleaned : [WELCOME];
  } catch {
    return [WELCOME];
  }
}

function saveMessages(msgs: Msg[]) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(msgs.slice(-MAX_STORED)));
  } catch {
    /* quota / private mode */
  }
}

export function DeltaPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [website, setWebsite] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const startedAt = useRef(0);
  const [messages, setMessages] = useState<Msg[]>([WELCOME]);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    startedAt.current = Date.now();
    setMessages(loadMessages());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveMessages(messages);
  }, [messages, hydrated]);

  useEffect(() => {
    if (!open) return;
    endRef.current?.scrollIntoView({ behavior: "smooth" });
    const t = window.setTimeout(() => inputRef.current?.focus(), 180);
    return () => window.clearTimeout(t);
  }, [messages, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  function clearChat() {
    setMessages([WELCOME]);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }

  async function ask(text: string) {
    const q = text.trim();
    if (!q || loading) return;
    setInput("");
    const prior = messages
      .filter((m) => m.role === "user" || m.role === "delta")
      .slice(-8)
      .map((m) => ({ role: m.role, text: m.text }));
    setMessages((m) => [...m, { role: "user", text: q }]);
    setLoading(true);
    try {
      const res = await fetch("/api/delta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: q,
          page: pathname,
          website,
          startedAt: startedAt.current,
          history: prior,
        }),
      });
      const data = await res.json();
      setMessages((m) => [
        ...m,
        {
          role: "delta",
          text:
            data.reply ||
            data.error ||
            "Maaf, saya belum bisa menjawab itu.",
          waUrl: data.waUrl,
        },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "delta",
          text: "Koneksi gagal. Coba lagi atau hubungi WhatsApp langsung.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  const hasUserChat = messages.some((m) => m.role === "user");

  return (
    <div className="delta-overlay" role="dialog" aria-modal="true" aria-label="Delta asisten">
      <button className="delta-backdrop" type="button" aria-label="Tutup" onClick={onClose} />
      <aside className="delta-panel">
        <header className="delta-panel__head">
          <div className="delta-brand">
            <span className="delta-avatar" aria-hidden="true">
              <img src="/icon.svg" alt="" width={28} height={28} />
              <i className="delta-avatar__pulse" />
            </span>
            <div>
              <h2>Delta</h2>
              <p className="delta-status">
                <span className="delta-status__dot" /> Online
              </p>
            </div>
          </div>
          <div className="delta-panel__actions">
            {hasUserChat ? (
              <button
                type="button"
                className="delta-reset"
                onClick={clearChat}
                aria-label="Mulai chat baru"
              >
                Baru
              </button>
            ) : null}
            <button type="button" className="delta-close" onClick={onClose} aria-label="Tutup">
              ×
            </button>
          </div>
        </header>

        <div className="delta-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`delta-row delta-row--${msg.role}`}>
              {msg.role === "delta" ? (
                <span className="delta-mini" aria-hidden="true">
                  <img src="/icon.svg" alt="" width={16} height={16} />
                </span>
              ) : null}
              <div className={`delta-bubble delta-bubble--${msg.role}`}>
                <p>{msg.text}</p>
                {msg.waUrl ? (
                  <a
                    className="delta-wa"
                    href={msg.waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Lanjut ke WhatsApp
                  </a>
                ) : null}
              </div>
            </div>
          ))}
          {loading ? (
            <div className="delta-row delta-row--delta">
              <span className="delta-mini" aria-hidden="true">
                <img src="/icon.svg" alt="" width={16} height={16} />
              </span>
              <div className="delta-bubble delta-bubble--delta delta-bubble--typing">
                <span />
                <span />
                <span />
              </div>
            </div>
          ) : null}
          <div ref={endRef} />
        </div>

        <div className="delta-composer">
          <div className="delta-prompts">
            {promptsFor(pathname).map((p) => (
              <button key={p} type="button" onClick={() => ask(p)} disabled={loading}>
                {p}
              </button>
            ))}
          </div>

          <form
            className="delta-form"
            onSubmit={(e) => {
              e.preventDefault();
              ask(input);
            }}
          >
            <label className="hp" aria-hidden="true">
              Website
              <input
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </label>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tulis pesan…"
              aria-label="Pesan untuk Delta"
            />
            <button type="submit" disabled={loading || !input.trim()} aria-label="Kirim">
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M3.4 20.6 21 12 3.4 3.4l.1 7.1L15 12 3.5 13.5z"
                />
              </svg>
            </button>
          </form>
        </div>
      </aside>
    </div>
  );
}
