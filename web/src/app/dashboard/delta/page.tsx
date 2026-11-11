import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { deleteDeltaLog, deleteFaq, saveFaq } from "../actions";
import { SubmitButton } from "../SubmitButton";
import { SafeForm } from "../SafeForm";
import { SafeAction } from "../SafeAction";
import { DashHead, DashLoading, Empty, formatDate } from "../ui";

export default function DeltaAdminPage() {
  return (
    <Suspense fallback={<DashLoading />}>
      <Delta />
    </Suspense>
  );
}

type Faq = {
  id: string;
  question: string;
  answer: string;
  tags: string[];
  published: boolean;
};

type Log = {
  id: string;
  page: string | null;
  question: string;
  confidence: string | null;
  created_at: string;
};

async function Delta() {
  await requireUser(["admin"]);
  const supabase = await createClient();
  const [{ data: faqs }, { data: logs }] = await Promise.all([
    supabase
      .from("faqs")
      .select("id, question, answer, tags, published")
      .order("created_at", { ascending: false }),
    supabase
      .from("delta_logs")
      .select("id, page, question, confidence, created_at")
      .order("created_at", { ascending: false })
      .limit(40),
  ]);

  const list = (faqs ?? []) as Faq[];
  const needsTeach = ((logs ?? []) as Log[]).filter((l) => l.confidence === "low");

  return (
    <div className="delta-admin">
      <DashHead title="Delta" text="Ajari asisten chat lewat Q&A singkat." />

      {needsTeach.length ? (
        <section className="delta-admin__panel delta-admin__panel--queue">
          <header className="delta-admin__head">
            <div>
              <h2>Antrean</h2>
              <p>Pertanyaan yang masih kurang yakin — ajari atau abaikan.</p>
            </div>
            <span className="delta-admin__count">{needsTeach.length}</span>
          </header>

          <ul className="delta-admin__list">
            {needsTeach.map((l) => (
              <li key={l.id} className="delta-admin__item">
                <div className="delta-admin__row">
                  <div className="delta-admin__main">
                    <strong>{l.question}</strong>
                    <small>
                      {formatDate(l.created_at)}
                      {l.page ? ` · ${shortPage(l.page)}` : ""}
                    </small>
                  </div>
                  <div className="delta-admin__acts">
                    <SafeAction
                      className="delta-admin__btn"
                      action={deleteDeltaLog.bind(null, l.id)}
                    >
                      Abaikan
                    </SafeAction>
                  </div>
                </div>
                <details className="delta-admin__teach">
                  <summary>Ajari</summary>
                  <FaqForm question={l.question} logId={l.id} compact />
                </details>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="delta-admin__panel">
        <header className="delta-admin__head">
          <div>
            <h2>Jawaban</h2>
            <p>Q&A aktif yang dipakai Delta.</p>
          </div>
          <span className="delta-admin__count">{list.length}</span>
        </header>

        <details className="delta-admin__add">
          <summary>+ Tambah</summary>
          <FaqForm />
        </details>

        {list.length ? (
          <ul className="delta-admin__list">
            {list.map((f) => (
              <li key={f.id} className="delta-admin__item">
                <div className="delta-admin__row">
                  <div className="delta-admin__main">
                    <strong>
                      {f.question}
                      <span
                        className={`delta-admin__dot ${f.published ? "is-on" : "is-off"}`}
                        title={f.published ? "Aktif" : "Nonaktif"}
                      />
                    </strong>
                    <small>{clip(f.answer, 110)}</small>
                  </div>
                  <div className="delta-admin__acts">
                    <SafeAction
                      className="delta-admin__btn delta-admin__btn--danger"
                      confirm="Hapus jawaban ini?"
                      action={deleteFaq.bind(null, f.id)}
                    >
                      Hapus
                    </SafeAction>
                  </div>
                </div>
                <details className="delta-admin__teach">
                  <summary>Edit</summary>
                  <FaqForm faq={f} />
                </details>
              </li>
            ))}
          </ul>
        ) : (
          <Empty>Belum ada jawaban tersimpan.</Empty>
        )}
      </section>
    </div>
  );
}

function clip(text: string, max: number) {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

function shortPage(page: string) {
  if (page.length <= 28) return page;
  return `${page.slice(0, 12)}…${page.slice(-10)}`;
}

function FaqForm({
  faq,
  question,
  logId,
  compact,
}: {
  faq?: Faq;
  question?: string;
  logId?: string;
  compact?: boolean;
}) {
  return (
    <SafeForm
      action={saveFaq}
      className="form-stack delta-admin__form"
      persistKey={faq ? `faq-${faq.id}` : logId ? `faq-log-${logId}` : "faq-new"}
      successMessage="Tersimpan. Antrean diperbarui."
    >
      {faq ? <input type="hidden" name="id" value={faq.id} /> : null}
      {logId ? <input type="hidden" name="log_id" value={logId} /> : null}
      <label>
        Pertanyaan
        <input
          name="question"
          defaultValue={faq?.question ?? question ?? ""}
          required
          maxLength={240}
          placeholder="Contoh: Berapa harga website?"
        />
      </label>
      <label>
        Jawaban
        <textarea
          name="answer"
          rows={compact ? 2 : 3}
          defaultValue={faq?.answer ?? ""}
          required
          maxLength={2000}
          placeholder="Jawaban singkat…"
        />
      </label>
      <div className="form-row">
        <label>
          Kata pemicu
          <input
            name="tags"
            defaultValue={faq?.tags.join(", ") ?? ""}
            placeholder="harga, website"
          />
        </label>
        <label className="form-check delta-admin__check">
          <input name="published" type="checkbox" defaultChecked={faq?.published ?? true} />
          Aktif
        </label>
      </div>
      <SubmitButton>{faq ? "Simpan" : "Simpan jawaban"}</SubmitButton>
    </SafeForm>
  );
}
