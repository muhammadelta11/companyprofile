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

const ACTIONS = [
  { status: "contacted", label: "Sudah dihubungi" },
  { status: "approved", label: "Terima" },
  { status: "rejected", label: "Tolak" },
];

function applyKind(a: {
  role: string;
  product_kind: string | null;
  detail: string | null;
}) {
  if (a.role === "mitra") {
    const fromDash = /dashboard jadi-mitra|Sumber: dashboard/i.test(a.detail ?? "");
    return {
      label: fromDash
        ? "Ajuan pertama jadi mitra (dari akun member)"
        : "Daftar mitra (form Gabung publik)",
      tone: "new" as const,
    };
  }
  if (a.role === "partner") {
    return { label: "Kolaborasi / partner", tone: "add" as const };
  }
  return { label: "Gabung member", tone: "add" as const };
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
    <>
      <DashHead
        title="Pendaftar"
        text="Orang yang mendaftar lewat Gabung atau tombol Jadi Mitra. Fokus dulu yang status Baru."
      />

      {waiting.length ? (
        <section className="dash-section">
          <h2 className="dash-sub">
            Perlu ditindak <span className="dash-count">{waiting.length}</span>
          </h2>
          <AppList items={waiting} />
        </section>
      ) : (
        <Empty>Tidak ada pendaftar menunggu.</Empty>
      )}

      {done.length ? (
        <section className="dash-section">
          <h2 className="dash-sub">
            Sudah diproses <span className="dash-count">{done.length}</span>
          </h2>
          <AppList items={done} />
        </section>
      ) : null}
    </>
  );
}

function AppList({
  items,
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
}) {
  return (
    <ul className="dash-list">
      {items.map((a) => {
        const kind = applyKind(a);
        return (
          <li key={a.id} className="dash-row dash-row--product">
            <div className="dash-row__top dash-row__top--text">
              <div className="dash-row__main">
                <strong>
                  {a.name}
                  <Badge value={a.role} />
                  <span className={`dash-chip dash-chip--${kind.tone}`}>{kind.label}</span>
                </strong>
                <small>
                  {[a.city, a.product_kind, formatDate(a.created_at)].filter(Boolean).join(" · ")}
                </small>
                {a.detail ? <p className="dash-row__text">{a.detail}</p> : null}
              </div>
            </div>
            <div className="dash-row__foot">
              <Badge value={a.status} />
              <div className="dash-row__actions">
                {ACTIONS.filter((x) => x.status !== a.status).map((x) => (
                  <SafeAction
                    key={x.status}
                    className="btn btn-outline btn-sm"
                    action={setApplicationStatus.bind(null, a.id, x.status)}
                  >
                    {x.label}
                  </SafeAction>
                ))}
                <SafeAction
                  className="btn btn-danger btn-sm dash-row__danger"
                  confirm={`Hapus pendaftar ${a.name}?`}
                  action={deleteApplication.bind(null, a.id)}
                >
                  Hapus
                </SafeAction>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
