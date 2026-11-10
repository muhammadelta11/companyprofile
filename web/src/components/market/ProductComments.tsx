"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { postProductComment } from "@/app/actions";
import { TurnstileField } from "@/components/TurnstileField";
import { loginHref } from "@/lib/access-policy";
import type { ProductComment } from "@/lib/comments";

function formatWhen(iso: string) {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "";
  try {
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(t));
  } catch {
    return "";
  }
}

type Props = {
  productId: string;
  comments: ProductComment[];
  canComment: boolean;
  userName?: string | null;
};

export function ProductComments({ productId, comments, canComment, userName }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const startedAt = useRef(0);
  const [tsKey, setTsKey] = useState(0);
  const next = `/market/${productId}`;

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body = String(fd.get("body") ?? "");
    setError(null);
    start(async () => {
      const res = await postProductComment({
        productId,
        body,
        website: String(fd.get("website") ?? ""),
        startedAt: startedAt.current,
        turnstileToken: String(fd.get("cf-turnstile-response") ?? ""),
      });
      if (res.error) {
        setError(res.error);
        setTsKey((k) => k + 1);
        return;
      }
      e.currentTarget.reset();
      setTsKey((k) => k + 1);
      router.refresh();
    });
  }

  return (
    <section className="mk-comments" aria-labelledby="mk-comments-title">
      <h2 id="mk-comments-title">Komentar</h2>
      <p className="mk-comments__hint">
        Tanya spesifikasi atau pengalaman. Spam dicegah — hanya member yang login yang bisa menulis.
      </p>

      {canComment ? (
        <form className="mk-comments__form form-stack" onSubmit={onSubmit}>
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="order-sheet__hp"
          />
          <label>
            Tulis sebagai {userName || "member"}
            <textarea
              name="body"
              rows={3}
              required
              minLength={2}
              maxLength={1000}
              placeholder="Contoh: Apakah bisa custom warna / ukuran?"
            />
          </label>
          <TurnstileField action="comment" resetKey={tsKey} />
          {error ? <p className="form-msg form-msg--error">{error}</p> : null}
          <button type="submit" className="btn btn-teal" disabled={pending}>
            {pending ? "Mengirim…" : "Kirim komentar"}
          </button>
        </form>
      ) : (
        <div className="mk-comments__gate">
          <p>Masuk untuk berkomentar. Tanpa akun kamu tetap bisa lihat produk dan order via WA.</p>
          <Link className="btn btn-outline" href={loginHref(next)}>
            Masuk / daftar
          </Link>
        </div>
      )}

      {comments.length ? (
        <ul className="mk-comments__list">
          {comments.map((c) => (
            <li key={c.id}>
              <strong>{c.author_name}</strong>
              <time dateTime={c.created_at}>{formatWhen(c.created_at)}</time>
              <p>{c.body}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mk-comments__empty">Belum ada komentar. Jadi yang pertama.</p>
      )}
    </section>
  );
}
