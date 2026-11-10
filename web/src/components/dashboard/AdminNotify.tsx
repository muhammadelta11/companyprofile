"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/browser";

type Note = {
  id: string;
  title: string;
  href: string;
  at: number;
};

/**
 * Lonceng realtime untuk admin: produk pending, pendaftar, masukan, pesanan baru.
 * Butuh supabase/realtime-admin.sql + Realtime aktif di project.
 */
export function AdminNotify() {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const seen = useRef(new Set<string>());
  const audioCtx = useRef<AudioContext | null>(null);

  const push = useCallback((note: Note) => {
    if (seen.current.has(note.id)) return;
    seen.current.add(note.id);
    setNotes((prev) => [note, ...prev].slice(0, 12));
    setToast(note.title);
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!audioCtx.current) audioCtx.current = new Ctx();
      const ctx = audioCtx.current;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = 880;
      g.gain.value = 0.04;
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
      o.stop(ctx.currentTime + 0.26);
    } catch {
      /* ignore audio */
    }
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 4500);
    return () => window.clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    const supabase = createBrowserSupabase();
    if (!supabase) return;

    const channel = supabase
      .channel("admin-inbox")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "products" },
        (payload) => {
          const row = payload.new as { id?: string; status?: string; title?: string };
          if (row.status === "pending" && row.id) {
            push({
              id: `p-ins-${row.id}`,
              title: `Produk baru menunggu: ${row.title ?? "tanpa judul"}`,
              href: "/dashboard/produk",
              at: Date.now(),
            });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "products" },
        (payload) => {
          const row = payload.new as { id?: string; status?: string; title?: string };
          const old = payload.old as { status?: string };
          if (row.status === "pending" && old.status !== "pending" && row.id) {
            push({
              id: `p-upd-${row.id}-${Date.now()}`,
              title: `Produk diajukan ulang: ${row.title ?? ""}`,
              href: "/dashboard/produk",
              at: Date.now(),
            });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "applications" },
        (payload) => {
          const row = payload.new as { id?: string; name?: string; role?: string };
          if (!row.id) return;
          push({
            id: `a-${row.id}`,
            title: `Pendaftar baru: ${row.name ?? "—"} (${row.role ?? ""})`,
            href: "/dashboard/pendaftar",
            at: Date.now(),
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "feedback" },
        (payload) => {
          const row = payload.new as { id?: string; kind?: string };
          if (!row.id) return;
          push({
            id: `f-${row.id}`,
            title: `Masukan masuk (${row.kind ?? "lainnya"})`,
            href: "/dashboard/masukan",
            at: Date.now(),
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        (payload) => {
          const row = payload.new as { id?: string; product_title?: string };
          if (!row.id) return;
          push({
            id: `o-${row.id}`,
            title: `Pesanan baru: ${row.product_title ?? "produk"}`,
            href: "/dashboard/pesanan",
            at: Date.now(),
          });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [push]);

  const unread = notes.length;

  return (
    <div className="dash-bell">
      <button
        type="button"
        className="dash-bell__btn"
        aria-label="Notifikasi"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span aria-hidden="true">🔔</span>
        {unread > 0 ? <em>{unread > 9 ? "9+" : unread}</em> : null}
      </button>

      {open ? (
        <div className="dash-bell__panel" role="dialog" aria-label="Notifikasi masuk">
          <header>
            <strong>Notifikasi</strong>
            <button type="button" onClick={() => setNotes([])}>
              Hapus
            </button>
          </header>
          {notes.length ? (
            <ul>
              {notes.map((n) => (
                <li key={n.id}>
                  <Link href={n.href} onClick={() => setOpen(false)}>
                    {n.title}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="dash-bell__empty">Belum ada notifikasi sesi ini.</p>
          )}
          <p className="dash-bell__hint">Update otomatis saat ada request masuk.</p>
        </div>
      ) : null}

      {toast ? (
        <div className="dash-toast" role="status">
          <Link href={notes[0]?.href ?? "/dashboard"} onClick={() => setToast(null)}>
            {toast}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
