import Link from "next/link";
import { Suspense } from "react";
import { requireUser, type CurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge, DashHead, DashLoading, Empty, daysAgoIso, formatDate } from "./ui";

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashLoading />}>
      <Overview />
    </Suspense>
  );
}

async function Overview() {
  const user = await requireUser();
  if (user.role === "admin") return <AdminOverview />;
  if (user.role === "mitra") return <MitraOverview user={user} />;
  return <MemberOverview user={user} />;
}

function Stat({ href, value, label }: { href: string; value: number; label: string }) {
  return (
    <Link href={href} className="dash-stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </Link>
  );
}

async function AdminOverview() {
  const supabase = await createClient();
  const weekAgo = await daysAgoIso(7);
  const count = { count: "exact" as const, head: true };

  const [apps, orders, pendingProducts, pendingMitra, questions, feedback] = await Promise.all([
    supabase.from("applications").select("id", count).eq("status", "new"),
    supabase.from("orders").select("id", count).eq("status", "new"),
    supabase.from("products").select("id", count).eq("status", "pending"),
    supabase.from("profiles").select("id", count).eq("role", "mitra").eq("status", "pending"),
    supabase.from("delta_logs").select("id", count).gte("created_at", weekAgo),
    supabase.from("feedback").select("id", count).eq("status", "new"),
  ]);

  const actions = [
    { href: "/dashboard/pesanan", n: orders.count ?? 0, label: "Pesanan baru" },
    { href: "/dashboard/produk", n: pendingProducts.count ?? 0, label: "Produk menunggu" },
    { href: "/dashboard/anggota", n: pendingMitra.count ?? 0, label: "Mitra menunggu" },
    { href: "/dashboard/pendaftar", n: apps.count ?? 0, label: "Pendaftar baru" },
    { href: "/dashboard/masukan", n: feedback.count ?? 0, label: "Masukan baru" },
  ].filter((a) => a.n > 0);

  return (
    <>
      <DashHead
        title="Beranda admin"
        text="Mulai dari daftar di bawah. Loneng 🔔 di menu kiri berbunyi kalau ada request baru."
      />
      {actions.length ? (
        <section className="dash-actions">
          <h2 className="dash-sub">Perlu tindakan</h2>
          <ul className="dash-actions__list">
            {actions.map((a) => (
              <li key={a.href}>
                <Link href={a.href}>
                  <strong>{a.n}</strong> {a.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <p className="dash-notice">Tidak ada antrean mendesak. Bagus.</p>
      )}
      <div className="dash-stats">
        <Stat href="/dashboard/pendaftar" value={apps.count ?? 0} label="Pendaftar baru" />
        <Stat href="/dashboard/pesanan" value={orders.count ?? 0} label="Pesanan baru" />
        <Stat href="/dashboard/produk" value={pendingProducts.count ?? 0} label="Produk menunggu" />
        <Stat href="/dashboard/anggota" value={pendingMitra.count ?? 0} label="Mitra menunggu" />
        <Stat href="/dashboard/masukan" value={feedback.count ?? 0} label="Masukan baru" />
        <Stat href="/dashboard/delta" value={questions.count ?? 0} label="Pertanyaan Delta (7 hari)" />
      </div>
    </>
  );
}

async function MitraOverview({ user }: { user: CurrentUser }) {
  const supabase = await createClient();
  const count = { count: "exact" as const, head: true };
  const [live, pending, orders] = await Promise.all([
    supabase.from("products").select("id", count).eq("owner_id", user.id).eq("status", "approved"),
    supabase.from("products").select("id", count).eq("owner_id", user.id).eq("status", "pending"),
    supabase.from("orders").select("id", count).eq("seller_id", user.id).eq("status", "new"),
  ]);

  return (
    <>
      <DashHead title={`Halo, ${user.name}`} text="Kelola produk dan pesanan tokomu." />
      {user.status === "pending" ? (
        <p className="dash-notice">
          Akun mitra kamu sedang diverifikasi admin. Setelah aktif, kamu bisa
          upload produk.
        </p>
      ) : null}
      {user.status === "active" && !user.phone ? (
        <p className="dash-notice">
          Isi nomor WhatsApp di{" "}
          <Link href="/dashboard/profil">Profil</Link> agar order masuk ke WA kamu
          (bukan ke admin).
        </p>
      ) : null}
      <div className="dash-stats">
        <Stat href="/dashboard/produk" value={live.count ?? 0} label="Produk tayang" />
        <Stat href="/dashboard/produk" value={pending.count ?? 0} label="Menunggu verifikasi" />
        <Stat href="/dashboard/pesanan" value={orders.count ?? 0} label="Pesanan baru" />
      </div>
    </>
  );
}

async function MemberOverview({ user }: { user: CurrentUser }) {
  const supabase = await createClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("id, product_title, status, created_at")
    .eq("buyer_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <>
      <DashHead title={`Halo, ${user.name}`} text="Riwayat order dan akses cepat ke layanan." />
      <div className="dash-quick">
        <Link className="btn btn-teal btn-sm" href="/dashboard/jadi-mitra">
          Ajukan jadi mitra
        </Link>
        <Link className="btn btn-outline btn-sm" href="/market">Belanja di Market</Link>
        <Link className="btn btn-outline btn-sm" href="/wisata">Lihat paket wisata</Link>
        <Link className="btn btn-outline btn-sm" href="/layanan">Jasa web &amp; sistem</Link>
      </div>
      <h2 className="dash-sub">Order terakhir</h2>
      {orders?.length ? (
        <ul className="dash-list">
          {orders.map((o) => (
            <li key={o.id} className="dash-row">
              <div className="dash-row__main">
                <strong>{o.product_title ?? "Produk"}</strong>
                <small>{formatDate(o.created_at)}</small>
              </div>
              <Badge value={o.status} />
            </li>
          ))}
        </ul>
      ) : (
        <Empty>Belum ada order. Klik &quot;Order WA&quot; di Market saat login agar tercatat di sini.</Empty>
      )}
    </>
  );
}
