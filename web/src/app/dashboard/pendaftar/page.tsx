import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { deleteApplication, setApplicationStatus } from "../actions";
import { SafeAction } from "../SafeAction";
import { Badge, DashHead, DashLoading, Empty, formatDate } from "../ui";

export default function PendaftarPage() {
  return (
    <Suspense fallback={<DashLoading />}>
      <Applications />
    </Suspense>
  );
}

const APP_STATUS: Record<string, string> = {
  new: "Baru",
  contacted: "Sudah dihubungi",
  approved: "Diterima",
  rejected: "Ditolak",
};

function applyKind(a: {
  role: string;
  product_kind: string | null;
  detail: string | null;
}) {
  if (a.role === "mitra") {
    const fromDash = /dashboard jadi-mitra|Sumber: dashboard/i.test(a.detail ?? "");
    return fromDash ? "Ajuan jadi mitra (dari akun)" : "Daftar mitra (form Gabung)";
  }
  if (a.role === "partner") return "Kolaborasi / partner";
  return "Gabung member";
}

function parseDetail(detail: string | null) {
  if (!detail) return { lines: [] as string[], email: "", wa: "" };
  const lines = detail
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const email =
    lines.find((l) => /^email\s*:/i.test(l))?.replace(/^email\s*:\s*/i, "") ?? "";
  const wa =
    lines.find((l) => /^(wa|whatsapp|telepon|phone)\s*:/i.test(l))?.replace(
      /^(wa|whatsapp|telepon|phone)\s*:\s*/i,
      ""
    ) ?? "";
  const rest = lines.filter(
    (l) => !/^email\s*:/i.test(l) && !/^(wa|whatsapp|telepon|phone)\s*:/i.test(l)
  );
  return { lines: rest, email, wa };
}

async function Applications() {
  await requireUser(["admin"]);
  const supabase = await createClient();
  const { data } = await supabase
    .from("applications")
    .select("id, role, name, city, product_kind, detail, status, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  const apps = data ?? [];
  const waiting = apps.filter((a) => a.status === "new" || a.status === "contacted");
  const done = apps.filter((a) => a.status === "approved" || a.status === "rejected");

  return (
    <div className="pendaftar">
      <DashHead
        title="Pendaftar"
        text="Antrean dari form Gabung / Jadi Mitra. Proses yang baru dulu."
      />

      <section className="pendaftar__panel">
        <header className="pendaftar__head">
          <div>
            <h2>Perlu ditindak</h2>
            <p>Baru atau sudah dihubungi — belum final.</p>
          </div>
          <span className="pendaftar__count">{waiting.length}</span>
        </header>
        {waiting.length ? (
          <AppList items={waiting} mode="waiting" />
        ) : (
          <Empty>Tidak ada antrean.</Empty>
        )}
      </section>

      {done.length ? (
        <section className="pendaftar__panel">
          <header className="pendaftar__head">
            <div>
              <h2>Selesai</h2>
              <p>Sudah diterima atau ditolak.</p>
            </div>
            <span className="pendaftar__count">{done.length}</span>
          </header>
          <AppList items={done} mode="done" />
        </section>
      ) : null}
    </div>
  );
}

function AppList({
  items,
  mode,
}: {
  items: {
    id: string;
    role: string;
    name: string;
    city: string | null;
    product_kind: string | null;
    detail: string | null;
    status: string;
    created_at: string;
  }[];
  mode: "waiting" | "done";
}) {
  return (
    <ul className="pendaftar__list">
      {items.map((a) => {
        const info = parseDetail(a.detail);
        return (
          <li key={a.id} className="pendaftar__item">
            <div className="pendaftar__row">
              <div className="pendaftar__main">
                <strong>
                  {a.name}
                  <Badge value={a.role} />
                  <Badge value={a.status} label={APP_STATUS[a.status] ?? a.status} />
                </strong>
                <small>
                  {[applyKind(a), a.city, a.product_kind, formatDate(a.created_at)]
                    .filter(Boolean)
                    .join(" · ")}
                </small>
                {info.lines.length ? (
                  <p className="pendaftar__detail">{info.lines.join(" · ")}</p>
                ) : null}
                {info.email || info.wa ? (
                  <p className="pendaftar__contact">
                    {info.email ? <span>{info.email}</span> : null}
                    {info.wa ? <span>WA {info.wa}</span> : null}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="pendaftar__acts">
              {mode === "waiting" ? (
                <>
                  {a.status !== "contacted" ? (
                    <SafeAction
                      className="pendaftar__btn"
                      action={setApplicationStatus.bind(null, a.id, "contacted")}
                    >
                      Sudah dihubungi
                    </SafeAction>
                  ) : null}
                  <SafeAction
                    className="pendaftar__btn pendaftar__btn--ok"
                    action={setApplicationStatus.bind(null, a.id, "approved")}
                  >
                    Terima
                  </SafeAction>
                  <SafeAction
                    className="pendaftar__btn pendaftar__btn--warn"
                    action={setApplicationStatus.bind(null, a.id, "rejected")}
                  >
                    Tolak
                  </SafeAction>
                </>
              ) : (
                <SafeAction
                  className="pendaftar__btn"
                  action={setApplicationStatus.bind(null, a.id, "new")}
                >
                  Kembalikan
                </SafeAction>
              )}
              <SafeAction
                className="pendaftar__btn pendaftar__btn--danger"
                confirm={`Hapus pendaftar ${a.name}?`}
                action={deleteApplication.bind(null, a.id)}
              >
                Hapus
              </SafeAction>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
