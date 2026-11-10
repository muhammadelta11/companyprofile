"use client";

import { useState, useTransition } from "react";
import { submitFeedback } from "@/app/actions";
import { TurnstileField } from "@/components/TurnstileField";

export function FeedbackForm({ page }: { page?: string }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok?: boolean; text: string } | null>(null);
  const [startedAt] = useState(() => Date.now());
  const [tsKey, setTsKey] = useState(0);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const form = e.currentTarget;
    setMsg(null);
    start(async () => {
      const result = await submitFeedback({
        name: String(fd.get("name") ?? ""),
        contact: String(fd.get("contact") ?? ""),
        kind: String(fd.get("kind") ?? "idea"),
        message: String(fd.get("message") ?? ""),
        page: page || String(fd.get("page") ?? ""),
        website: String(fd.get("website") ?? ""),
        startedAt,
        turnstileToken: String(fd.get("cf-turnstile-response") ?? ""),
      });
      if (result.error) {
        setMsg({ text: result.error });
        setTsKey((k) => k + 1);
        return;
      }
      setMsg({ ok: true, text: "Terima kasih. Masukan sudah diterima developer." });
      form.reset();
      setTsKey((k) => k + 1);
    });
  }

  return (
    <form className="form-stack feedback-form" onSubmit={onSubmit}>
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="order-sheet__hp"
      />
      <div className="form-row">
        <label>
          Nama
          <input name="name" maxLength={120} />
        </label>
        <label>
          Kontak (WA/email)
          <input name="contact" maxLength={120} placeholder="Opsional, untuk balasan" />
        </label>
      </div>
      <label>
        Jenis
        <select name="kind" defaultValue="idea">
          <option value="bug">Lapor bug / error</option>
          <option value="idea">Usulan fitur</option>
          <option value="complaint">Keluhan layanan</option>
          <option value="other">Lainnya</option>
        </select>
      </label>
      <label>
        Pesan
        <textarea name="message" required rows={4} maxLength={2000} placeholder="Ceritakan singkat…" />
      </label>
      {page ? <input type="hidden" name="page" value={page} /> : null}
      <TurnstileField action="feedback" resetKey={tsKey} />
      {msg ? (
        <p className={`form-msg${msg.ok ? "" : " form-msg--error"}`}>{msg.text}</p>
      ) : null}
      <button type="submit" className="btn btn-teal" disabled={pending}>
        {pending ? "Mengirim…" : "Kirim masukan"}
      </button>
    </form>
  );
}
