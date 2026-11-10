"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const MAX = 8;
const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";
const MAX_BYTES = 5 * 1024 * 1024;

type Props = {
  name?: string;
  initial?: string[] | null;
  label?: string;
  /** Harus sama dengan persistKey SafeForm agar restore tidak nyasar ke form lain. */
  persistKey?: string;
};

/**
 * Foto diunggah ke /api/upload/image dulu; form hanya mengirim JSON URL di gallery_keep.
 */
export function GalleryField({
  initial = [],
  label = "Galeri foto",
  persistKey,
}: Props) {
  const start = useMemo(
    () => (Array.isArray(initial) ? initial.filter(Boolean) : []).slice(0, MAX),
    [initial]
  );
  const [kept, setKept] = useState<string[]>(start);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; bad?: boolean } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const hiddenRef = useRef<HTMLInputElement>(null);
  const keptRef = useRef(kept);
  const busyRef = useRef(false);
  keptRef.current = kept;
  busyRef.current = busy;

  const room = Math.max(0, MAX - kept.length);
  const added = kept.filter((u) => !start.includes(u));

  function syncHidden(urls: string[]) {
    if (hiddenRef.current) {
      hiddenRef.current.value = JSON.stringify(urls);
    }
  }

  useEffect(() => {
    syncHidden(kept);
  }, [kept]);

  useEffect(() => {
    const onRestore = (event: Event) => {
      const detail = (event as CustomEvent<{ key?: string | null; draft?: Record<string, string> }>)
        .detail;
      if (persistKey && detail?.key !== persistKey) return;
      const raw = detail?.draft?.gallery_keep;
      if (typeof raw !== "string") return;
      try {
        const parsed = JSON.parse(raw) as unknown;
        if (!Array.isArray(parsed)) return;
        const urls = parsed.filter((u): u is string => typeof u === "string").slice(0, MAX);
        setKept(urls);
        syncHidden(urls);
        setMsg(null);
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("dash-form-restore", onRestore);
    return () => window.removeEventListener("dash-form-restore", onRestore);
  }, [persistKey]);

  // Pastikan nilai terbaru ikut FormData; blokir submit saat masih mengunggah.
  useEffect(() => {
    const form = hiddenRef.current?.form;
    if (!form) return;
    const onSubmit = (event: Event) => {
      syncHidden(keptRef.current);
      if (busyRef.current) {
        event.preventDefault();
        event.stopPropagation();
        setMsg({
          text: "Tunggu unggahan foto selesai, lalu klik simpan lagi.",
          bad: true,
        });
      }
    };
    form.addEventListener("submit", onSubmit, true);
    return () => form.removeEventListener("submit", onSubmit, true);
  }, []);

  function toggleExisting(url: string) {
    setKept((prev) => {
      const next = prev.includes(url)
        ? prev.filter((u) => u !== url)
        : prev.length < MAX
          ? [...prev, url]
          : prev;
      syncHidden(next);
      return next;
    });
  }

  function removeAdded(url: string) {
    setKept((prev) => {
      const next = prev.filter((u) => u !== url);
      syncHidden(next);
      return next;
    });
  }

  async function onPick(files: FileList | null) {
    if (!files?.length || room === 0) return;
    setMsg(null);
    setBusy(true);
    const list = Array.from(files).slice(0, room);
    const uploaded: string[] = [];
    const errors: string[] = [];

    for (const file of list) {
      if (file.size > MAX_BYTES) {
        errors.push(`${file.name}: maks. 5 MB`);
        continue;
      }
      try {
        const body = new FormData();
        body.append("file", file);
        const res = await fetch("/api/upload/image", { method: "POST", body });
        const data = (await res.json().catch(() => ({}))) as { location?: string; error?: string };
        if (!res.ok || !data.location) {
          errors.push(data.error || `${file.name}: gagal unggah`);
          continue;
        }
        uploaded.push(data.location);
      } catch {
        errors.push(`${file.name}: gagal unggah`);
      }
    }

    if (uploaded.length) {
      setKept((prev) => {
        const next = [...prev, ...uploaded].slice(0, MAX);
        syncHidden(next);
        return next;
      });
    }
    if (errors.length) {
      setMsg({ text: errors.slice(0, 3).join(" · "), bad: true });
    } else if (uploaded.length) {
      setMsg({
        text: `${uploaded.length} foto terunggah. Klik tombol simpan di bawah agar menempel ke produk.`,
      });
    }
    if (fileRef.current) fileRef.current.value = "";
    setBusy(false);
  }

  return (
    <div className="gallery-field" data-busy={busy ? "1" : "0"}>
      <span className="gallery-field__label">
        {label} <small>(maks. {MAX} foto)</small>
      </span>

      {start.length || added.length ? (
        <ul className="gallery-field__existing">
          {start.map((url, i) => {
            const on = kept.includes(url);
            return (
              <li key={`old-${url}-${i}`}>
                <label className={`gallery-field__thumb${on ? " is-on" : ""}`}>
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => toggleExisting(url)}
                    aria-label={on ? "Pertahankan foto" : "Hapus foto"}
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" />
                  <em>{on && kept[0] === url ? "Utama" : i + 1}</em>
                </label>
              </li>
            );
          })}
          {added.map((url, i) => {
            const idx = kept.indexOf(url);
            return (
              <li key={`new-${url}-${i}`}>
                <label className="gallery-field__thumb is-on">
                  <button
                    type="button"
                    className="gallery-field__remove"
                    onClick={() => removeAdded(url)}
                    aria-label="Hapus foto baru"
                  >
                    ×
                  </button>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" />
                  <em>{idx === 0 ? "Utama" : "Baru"}</em>
                </label>
              </li>
            );
          })}
        </ul>
      ) : null}

      {/* defaultValue + ref sync: lebih andal di FormData daripada fully controlled value */}
      <input
        ref={hiddenRef}
        type="hidden"
        name="gallery_keep"
        defaultValue={JSON.stringify(kept)}
      />

      <label className="gallery-field__upload">
        {busy ? "Mengunggah…" : "Tambah foto baru"}
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPT}
          multiple
          disabled={room === 0 || busy}
          onChange={(e) => void onPick(e.target.files)}
        />
        <small>
          {busy
            ? "Tunggu unggahan selesai sebelum menyimpan produk."
            : room === 0
              ? "Kuota penuh — hapus foto lama dulu."
              : `Sisa ${room} slot. JPG/PNG/WebP/GIF, maks. 5 MB/file.`}
          {added.length > 0 && !busy ? ` · ${added.length} baru` : ""}
        </small>
      </label>
      {msg ? (
        <p
          className={`form-msg${msg.bad ? " form-msg--error" : ""}`}
          style={{ marginTop: "0.35rem" }}
        >
          {msg.text}
        </p>
      ) : null}
    </div>
  );
}
