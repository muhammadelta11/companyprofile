import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { setFeedbackStatus } from "../actions";
import { SafeAction } from "../SafeAction";
import { Badge, DashHead, DashLoading, Empty, formatDate } from "../ui";

export default function MasukanAdminPage() {
  return (
    <Suspense fallback={<DashLoading />}>
      <FeedbackList />
    </Suspense>
  );
}

type Row = {
  id: string;
  name: string | null;
  contact: string | null;
  kind: string;
  message: string;
  page: string | null;
  status: string;
  created_at: string;
};

async function FeedbackList() {
  await requireUser(["admin"]);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("feedback")
    .select("id, name, contact, kind, message, page, status, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return (
      <>
        <DashHead title="Masukan" text="Belum siap." />
        <Empty>Tabel feedback belum ada. Jalankan supabase/ops-p0.sql.</Empty>
      </>
    );
  }

  const rows = (data ?? []) as Row[];

  return (
    <>
      <DashHead
        title="Masukan"
        text="Laporan bug, usulan, dan keluhan dari pengunjung / member."
      />
      {rows.length ? (
        <ul className="dash-list">
          {rows.map((f) => (
            <li key={f.id} className="dash-row dash-row--wrap">
              <div className="dash-row__main">
                <strong>
                  {f.kind} · {f.name || "Anonim"}
                </strong>
                <small>
                  {formatDate(f.created_at)}
                  {f.contact ? ` · ${f.contact}` : ""}
                  {f.page ? ` · ${f.page}` : ""}
                </small>
                <p className="dash-feedback-msg">{f.message}</p>
              </div>
              <Badge value={f.status} />
              <div className="dash-row__actions">
                {f.status === "new" ? (
                  <SafeAction action={setFeedbackStatus.bind(null, f.id, "read")}>
                    Tandai dibaca
                  </SafeAction>
                ) : null}
                {f.status !== "done" ? (
                  <SafeAction action={setFeedbackStatus.bind(null, f.id, "done")}>
                    Selesai
                  </SafeAction>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <Empty>Belum ada masukan.</Empty>
      )}
    </>
  );
}
