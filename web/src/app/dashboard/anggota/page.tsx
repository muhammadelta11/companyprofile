import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { waTo } from "@/data/site";
import { updateMember } from "../actions";
import { SubmitButton } from "../SubmitButton";
import { SafeForm } from "../SafeForm";
import { Badge, DashHead, DashLoading, Empty, formatDate } from "../ui";

export default function AnggotaPage() {
  return (
    <Suspense fallback={<DashLoading />}>
      <Members />
    </Suspense>
  );
}

async function Members() {
  const admin = await requireUser(["admin"]);
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, email, full_name, phone, city, role, status, created_at")
    .order("status")
    .order("created_at", { ascending: false })
    .limit(300);
  const members = data ?? [];

  return (
    <>
      <DashHead
        title="Anggota"
        text="Aktifkan mitra baru, ubah peran, atau blokir akun bermasalah."
      />
      {members.length ? (
        <ul className="dash-list">
          {members.map((m) => (
            <li key={m.id} className="dash-row dash-row--wrap">
              <div className="dash-row__main">
                <strong>
                  {m.full_name || m.email} <Badge value={m.role} />
                </strong>
                <small>
                  {[m.email, m.phone, m.city, `daftar ${formatDate(m.created_at)}`]
                    .filter(Boolean)
                    .join(" · ")}
                </small>
              </div>
              <Badge value={m.status} />
              {m.id === admin.id ? null : (
                <SafeForm
                  action={updateMember.bind(null, m.id)}
                  className="dash-row__actions"
                >
                  <select name="role" defaultValue={m.role} aria-label="Peran">
                    <option value="member">Member</option>
                    <option value="mitra">Mitra</option>
                    <option value="admin">Admin</option>
                  </select>
                  <select name="status" defaultValue={m.status} aria-label="Status">
                    <option value="pending">Menunggu</option>
                    <option value="active">Aktif</option>
                    <option value="suspended">Diblokir</option>
                  </select>
                  <SubmitButton>Simpan</SubmitButton>
                  {m.phone ? (
                    <a
                      className="btn btn-outline btn-sm"
                      href={waTo(m.phone, `Halo ${m.full_name ?? ""}, dari masudeltamamy.com`)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      WA
                    </a>
                  ) : null}
                </SafeForm>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <Empty>Belum ada anggota.</Empty>
      )}
    </>
  );
}
