"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { promptsFor } from "@/data/delta-knowledge";

type Msg = { role: "user" | "delta"; text: string; waUrl?: string };

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
  const startedAt = useRef(0);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "delta",
      text: "Halo, saya Delta — asisten AI Mas'ud El-Tamamy. Saya bisa bantu kenalan dengan Mas'ud, jasa web/sistem, Market, dan wisata. Deal final tetap via WhatsApp.",
    },
  ]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  async function ask(text: string) {
    const q = text.trim();
    if (!q || loading) return;
    setInput("");
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

  return (
    <div className="delta-overlay" role="dialog" aria-modal="true" aria-label="Delta asisten">
      <button className="delta-backdrop" type="button" aria-label="Tutup" onClick={onClose} />
      <aside className="delta-panel">
        <header className="delta-panel__head">
          <div>
            <p className="delta-kicker">Asisten AI</p>
            <h2>Delta</h2>
            <p className="delta-note">Transparan: saya AI. Untuk deal → WhatsApp Mas&apos;ud.</p>
          </div>
          <button type="button" className="delta-close" onClick={onClose} aria-label="Tutup">
            ×
          </button>
        </header>

        <div className="delta-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`delta-bubble delta-bubble--${msg.role}`}>
              <p>{msg.text}</p>
              {msg.waUrl ? (
                <a className="delta-wa" href={msg.waUrl} target="_blank" rel="noopener noreferrer">
                  Lanjut ke WhatsApp →
                </a>
              ) : null}
            </div>
          ))}
          {loading ? <p className="delta-typing">Delta mengetik…</p> : null}
          <div ref={endRef} />
        </div>

        <div className="delta-prompts">
          {promptsFor(pathname).map((p) => (
            <button key={p} type="button" onClick={() => ask(p)}>
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
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tanya Delta…"
            aria-label="Pesan untuk Delta"
          />
          <button type="submit" disabled={loading}>
            Kirim
          </button>
        </form>
      </aside>
    </div>
  );
}
