"use client";

import { useRef, useState } from "react";

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";
const MAX_BYTES = 5 * 1024 * 1024;

type Props = {
  name: string;
  label: string;
  href: string;
  initial?: string | null;
};

/** Input URL + unggah cepat untuk gambar header menu. */
export function HeroImageField({ name, label, href, initial = null }: Props) {
  const [url, setUrl] = useState(initial ?? "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onPick(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setMsg(null);
    if (file.size > MAX_BYTES) {
      setMsg("Maks. 5 MB");
      return;
    }
    setBusy(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/upload/image", { method: "POST", body });
      const data = (await res.json().catch(() => ({}))) as { location?: string; error?: string };
      if (!res.ok || !data.location) {
        setMsg(data.error || "Unggah gagal");
      } else {
        setUrl(data.location);
        setMsg("Gambar siap — klik Simpan.");
      }
    } catch {
      setMsg("Unggah gagal");
    }
    if (fileRef.current) fileRef.current.value = "";
    setBusy(false);
  }

  return (
    <div className="hero-set">
      <div className="hero-set__head">
        <strong>{label}</strong>
        <a href={href} target="_blank" rel="noopener noreferrer">
          Lihat halaman
        </a>
      </div>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="hero-set__preview" src={url} alt="" />
      ) : (
        <div className="hero-set__preview hero-set__preview--empty">Gradient default</div>
      )}
      <input type="hidden" name={name} value={url} />
      <label>
        URL gambar (opsional)
        <input
          type="url"
          value={url}
          placeholder="https://… atau unggah di bawah"
          onChange={(e) => setUrl(e.target.value)}
        />
      </label>
      <label className="gallery-field__upload">
        {busy ? "Mengunggah…" : "Unggah dari perangkat"}
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPT}
          disabled={busy}
          onChange={(e) => void onPick(e.target.files)}
        />
      </label>
      {url ? (
        <button type="button" className="btn btn-outline btn-sm" onClick={() => setUrl("")}>
          Hapus gambar (kembali ke gradient)
        </button>
      ) : null}
      {msg ? <p className="form-msg">{msg}</p> : null}
    </div>
  );
}
