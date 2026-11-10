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
      .limit(60),
  ]);

  return (
    <>
      <DashHead
        title="Delta"
        text="Ajari Delta jawaban baru. Kata kunci menentukan kapan jawaban dipakai."
      />

      <details className="dash-create">
        <summary>+ Tambah jawaban</summary>
        <FaqForm />
      </details>

      <h2 className="dash-sub">Jawaban tambahan</h2>
      {faqs?.length ? (
        <ul className="dash-list">
          {(faqs as Faq[]).map((f) => (
            <li key={f.id} className="dash-row dash-row--product">
              <div className="dash-row__top dash-row__top--text">
                <div className="dash-row__main">
                  <strong>{f.question}</strong>
                  <small>{f.tags.join(", ") || "tanpa kata kunci"}</small>
                  <p className="dash-row__text">{f.answer}</p>
                </div>
              </div>
              <div className="dash-row__foot">
                {f.published ? (
                  <span className="badge badge--approved">Aktif</span>
                ) : (
                  <span className="badge badge--pending">Nonaktif</span>
                )}
                <div className="dash-row__actions">
                  <SafeAction
                    className="btn btn-danger btn-sm dash-row__danger"
                    confirm="Hapus jawaban ini?"
                    action={deleteFaq.bind(null, f.id)}
                  >
                    Hapus
                  </SafeAction>
                </div>
              </div>
              <details className="dash-edit">
                <summary>Edit</summary>
                <FaqForm faq={f} />
              </details>
            </li>
          ))}
        </ul>
      ) : (
        <Empty>Belum ada jawaban tambahan. Jawaban bawaan Delta tetap aktif.</Empty>
      )}

      <h2 className="dash-sub">Pertanyaan pengunjung terbaru</h2>
      {logs?.length ? (
        <ul className="dash-list">
          {logs.map((l) => (
            <li key={l.id} className="dash-row dash-row--product">
              <div className="dash-row__top dash-row__top--text">
                <div className="dash-row__main">
                  <strong>{l.question}</strong>
                  <small>
                    {formatDate(l.created_at)} · {l.page ?? "/"}
                  </small>
                </div>
              </div>
              <div className="dash-row__foot">
                {l.confidence === "low" ? (
                  <span className="badge badge--rejected">Belum terjawab</span>
                ) : (
                  <span className="badge badge--approved">Terjawab</span>
                )}
                <div className="dash-row__actions">
                  <SafeAction
                    className="btn btn-outline btn-sm"
                    action={deleteDeltaLog.bind(null, l.id)}
                  >
                    Hapus
                  </SafeAction>
                </div>
              </div>
              {l.confidence === "low" ? (
                <details className="dash-edit">
                  <summary>Jadikan jawaban</summary>
                  <FaqForm question={l.question} />
                </details>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <Empty>Belum ada pertanyaan.</Empty>
      )}
    </>
  );
}

function FaqForm({ faq, question }: { faq?: Faq; question?: string }) {
  return (
    <SafeForm action={saveFaq} className="form-stack">
      {faq ? <input type="hidden" name="id" value={faq.id} /> : null}
      <label>
        Pertanyaan
        <input name="question" defaultValue={faq?.question ?? question ?? ""} required />
      </label>
      <label>
        Jawaban Delta
        <textarea name="answer" rows={3} defaultValue={faq?.answer ?? ""} required />
      </label>
      <label>
        Kata kunci (pisahkan dengan koma)
        <input name="tags" defaultValue={faq?.tags.join(", ") ?? ""} placeholder="harga, landing page" />
      </label>
      <label className="form-check">
        <input name="published" type="checkbox" defaultChecked={faq?.published ?? true} />
        Aktif
      </label>
      <SubmitButton>{faq ? "Simpan perubahan" : "Simpan jawaban"}</SubmitButton>
    </SafeForm>
  );
}
