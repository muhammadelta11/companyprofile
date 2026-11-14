import Link from "next/link";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { MEDICINE_MODULES } from "@/lib/science/anatomy";
import { SCIENCE_MODULES } from "@/lib/science/molecules";
import { DashHead, DashLoading } from "../ui";

export default function DashboardBelajarPage() {
  return (
    <Suspense fallback={<DashLoading />}>
      <BelajarAdmin />
    </Suspense>
  );
}

async function BelajarAdmin() {
  await requireUser(["admin"]);
  const all = [...SCIENCE_MODULES, ...MEDICINE_MODULES];
  const ready = all.filter((m) => m.status === "ready");
  const soon = all.filter((m) => m.status === "soon");

  return (
    <>
      <DashHead
        title="Belajar 3D"
        text="Kimia, kedokteran, farmasi — fondasi 3D publik. CMS materi penuh menyusul."
      />

      <section className="dash-card" style={{ marginBottom: "1rem" }}>
        <h2>Modul siap diuji</h2>
        <ul className="dash-list">
          {ready.map((m) => (
            <li key={m.href}>
              <Link href={m.href}>{m.title}</Link>
              <span className="dash-muted"> — {m.text}</span>
            </li>
          ))}
        </ul>
        <p style={{ marginTop: "0.75rem" }}>
          <Link className="btn btn-teal btn-sm" href="/belajar">
            Buka hub publik
          </Link>{" "}
          <Link className="btn btn-outline btn-sm" href="/belajar/kedokteran/anatomi">
            Jantung 3D
          </Link>
        </p>
      </section>

      <section className="dash-card" style={{ marginBottom: "1rem" }}>
        <h2>Antrian tahap berikutnya</h2>
        <ul className="dash-list">
          {soon.map((m) => (
            <li key={m.href}>
              <strong>{m.title}</strong>
              <span className="dash-muted"> — {m.text}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="dash-card">
        <h2>Database (opsional)</h2>
        <p className="dash-muted">
          Jalankan <code>web/supabase/science-learning.sql</code> di Supabase SQL Editor untuk tabel
          tracks/modules/assets/materials/progress. Konten seed molekul saat ini masih di kode (
          <code>lib/science/molecules.ts</code>) agar bisa dipakai tanpa migrasi.
        </p>
      </section>
    </>
  );
}
