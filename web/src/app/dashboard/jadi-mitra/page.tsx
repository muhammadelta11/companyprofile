import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { applyMitra } from "../actions";
import { SafeForm } from "../SafeForm";
import { SubmitButton } from "../SubmitButton";
import { DashHead, DashLoading } from "../ui";

export default function JadiMitraPage() {
  return (
    <Suspense fallback={<DashLoading />}>
      <MitraApply />
    </Suspense>
  );
}

const CATEGORIES = [
  "Makanan & minuman",
  "Fashion",
  "Digital / jasa",
  "Kerajinan",
  "Kesehatan & kecantikan",
  "Lainnya",
];

async function MitraApply() {
  const user = await requireUser();
  if (user.role === "mitra") {
    redirect(user.status === "active" ? "/dashboard/produk" : "/dashboard");
  }
  if (user.role === "admin") redirect("/dashboard/anggota");

  const supabase = await createClient();
  const [{ data: profile }, { data: pending }] = await Promise.all([
    supabase
      .from("profiles")
      .select("mitra_apply_category, mitra_apply_product, mitra_apply_note, mitra_apply_at, phone, city")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("applications")
      .select("id, status, product_kind, detail, created_at")
      .eq("applicant_id", user.id)
      .eq("role", "mitra")
      .in("status", ["new", "contacted"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  // Hanya antrean yang masih new/contacted — jangan terkunci oleh mitra_apply_at lama.
  const waiting = Boolean(pending);

  return (
    <>
      <DashHead
        title="Jadi mitra penjual"
        text="Isi singkat apa yang mau kamu jual. Admin akan review sebelum etalase aktif."
      />

      {waiting ? (
        <div className="dash-card dash-notice-card">
          <p className="dash-notice" style={{ margin: 0 }}>
            Pengajuan mitra kamu sedang ditinjau admin.
          </p>
          <ul className="mitra-apply__summary">
            {profile?.mitra_apply_category ? (
              <li>
                <strong>Kategori</strong> {profile.mitra_apply_category}
              </li>
            ) : null}
            {profile?.mitra_apply_product ? (
              <li>
                <strong>Mau jual</strong> {profile.mitra_apply_product}
              </li>
            ) : null}
            {profile?.mitra_apply_note ? (
              <li>
                <strong>Catatan</strong> {profile.mitra_apply_note}
              </li>
            ) : null}
          </ul>
          <p className="dash-meta">
            Status: {pending?.status === "contacted" ? "Sudah dihubungi" : "Menunggu review"}
          </p>
          <Link className="btn btn-outline btn-sm" href="/dashboard">
            Kembali ke ringkasan
          </Link>
        </div>
      ) : (
        <SafeForm action={applyMitra} className="form-stack dash-card">
          <label>
            Kategori produk
            <select name="category" required defaultValue="">
              <option value="" disabled>
                Pilih kategori
              </option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label>
            Mau jualan apa?
            <input
              name="product"
              required
              minLength={3}
              maxLength={160}
              placeholder="Contoh: keripik singkong, jasa desain logo, hijab lokal"
            />
          </label>
          <label>
            Catatan singkat (opsional)
            <textarea
              name="note"
              rows={3}
              maxLength={500}
              placeholder="Contoh: stok ready, kirim dari Ngawi, harga mulai 15rb"
            />
          </label>
          <div className="form-row">
            <label>
              No. WhatsApp
              <input
                name="phone"
                type="tel"
                required
                defaultValue={profile?.phone || user.phone}
                placeholder="08xxxxxxxxxx"
              />
            </label>
            <label>
              Kota
              <input name="city" defaultValue={profile?.city || user.city} placeholder="Ngawi" />
            </label>
          </div>
          <p className="dash-meta">
            Dengan mengajukan, data ini dipakai admin untuk verifikasi. Belum bisa upload produk
            sampai disetujui.
          </p>
          <SubmitButton>Kirim pengajuan</SubmitButton>
        </SafeForm>
      )}
    </>
  );
}
