import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { waTo } from "@/data/site";
import { createMember, updateMember } from "../actions";
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

type MemberRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  city: string | null;
  role: string;
  status: string;
  created_at: string;
};

async function Members() {
  const admin = await requireUser(["admin"]);
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, email, full_name, phone, city, role, status, created_at")
    .order("status")
    .order("created_at", { ascending: false })
    .limit(300);
  const members = (data ?? []) as MemberRow[];

  return (
    <>
      <DashHead
        title="Anggota"
        text="Tambah akun baru, aktifkan mitra, ubah peran, atau blokir akun bermasalah."
      />

      <details className="dash-create">
        <summary>+ Tambah anggota</summary>
        <SafeForm action={createMember} className="form-stack" persistKey="member-new">
          <div className="form-row">
            <label>
              Nama lengkap
              <input name="full_name" required maxLength={120} placeholder="Nama tampilan" />
            </label>
            <label>
              Email
              <input name="email" type="email" required maxLength={160} placeholder="user@email.com" />
            </label>
          </div>
          <div className="form-row">
            <label>
              Kata sandi sementara
              <input
                name="password"
                type="text"
                required
                minLength={8}
                maxLength={72}
                autoComplete="new-password"
                placeholder="Minimal 8 karakter"
              />
            </label>
            <label>
              Telepon / WA
              <input name="phone" maxLength={30} placeholder="08…" />
            </label>
          </div>
          <div className="form-row">
            <label>
              Kota
              <input name="city" maxLength={120} placeholder="Kota" />
            </label>
            <label>
              Peran
              <select name="role" defaultValue="member">
                <option value="member">Member</option>
                <option value="mitra">Mitra penjual</option>
                <option value="admin">Admin</option>
              </select>
            </label>
          </div>
          <label>
            Status awal
            <select name="status" defaultValue="active">
              <option value="active">Aktif</option>
              <option value="pending">Menunggu</option>
              <option value="suspended">Diblokir</option>
            </select>
          </label>
          <p className="dash-head__help">
            Bagikan email + kata sandi ke anggota (mis. via WA). Mereka bisa ganti sandi setelah masuk.
          </p>
          <SubmitButton>Buat akun</SubmitButton>
        </SafeForm>
      </details>

      {members.length ? (
        <ul className="dash-list">
          {members.map((m) => {
            const isSelf = m.id === admin.id;
            return (
              <li key={m.id} className="dash-row dash-row--product">
                <div className="dash-row__top dash-row__top--text">
                  <div className="dash-row__main">
                    <strong>
                      {m.full_name || m.email || "Tanpa nama"} <Badge value={m.role} />
                    </strong>
                    <small>
                      {[m.email, m.phone, m.city, `daftar ${formatDate(m.created_at)}`]
                        .filter(Boolean)
                        .join(" · ")}
                    </small>
                  </div>
                </div>
                <div className="dash-row__foot">
                  <Badge value={m.status} />
                  <div className="dash-row__actions">
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
                    {isSelf ? (
                      <span className="dash-muted">Ini akun kamu</span>
                    ) : null}
                  </div>
                </div>
                {isSelf ? null : (
                  <details className="dash-edit">
                    <summary>Kelola anggota</summary>
                    <SafeForm
                      action={updateMember.bind(null, m.id)}
                      className="form-stack"
                      persistKey={`member-${m.id}`}
                    >
                      <div className="form-row">
                        <label>
                          Nama
                          <input
                            name="full_name"
                            defaultValue={m.full_name ?? ""}
                            maxLength={120}
                            required
                          />
                        </label>
                        <label>
                          Telepon / WA
                          <input name="phone" defaultValue={m.phone ?? ""} maxLength={30} />
                        </label>
                      </div>
                      <label>
                        Kota
                        <input name="city" defaultValue={m.city ?? ""} maxLength={120} />
                      </label>
                      <div className="form-row">
                        <label>
                          Peran
                          <select name="role" defaultValue={m.role}>
                            <option value="member">Member</option>
                            <option value="mitra">Mitra penjual</option>
                            <option value="admin">Admin</option>
                          </select>
                        </label>
                        <label>
                          Status
                          <select name="status" defaultValue={m.status}>
                            <option value="pending">Menunggu</option>
                            <option value="active">Aktif</option>
                            <option value="suspended">Diblokir</option>
                          </select>
                        </label>
                      </div>
                      <SubmitButton>Simpan perubahan</SubmitButton>
                    </SafeForm>
                  </details>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <Empty>Belum ada anggota. Tambah dari form di atas, atau biarkan mereka daftar sendiri.</Empty>
      )}
    </>
  );
}
