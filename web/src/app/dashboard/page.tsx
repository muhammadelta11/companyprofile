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
    { href: "/dashboard/produk?sumber=mitra", n: pendingProducts.count ?? 0, label: "Produk mitra menunggu" },
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
        <Stat href="/dashboard/produk?sumber=mitra" value={pendingProducts.count ?? 0} label="Produk mitra menunggu" />
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
  const shopName = user.shop_name.trim() || user.name;
  const storeHref = `/market/penjual/${user.id}`;

  const [live, pending, orders, chats, recentProducts, recentOrders] = await Promise.all([
    supabase.from("products").select("id", count).eq("owner_id", user.id).eq("status", "approved"),
    supabase.from("products").select("id", count).eq("owner_id", user.id).eq("status", "pending"),
    supabase.from("orders").select("id", count).eq("seller_id", user.id).eq("status", "new"),
    supabase.from("product_threads").select("id", count).eq("seller_id", user.id),
    supabase
      .from("products")
      .select("id, title, status, price_label, image_url, created_at")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false })
      .limit(4),
    supabase
      .from("orders")
      .select("id, product_title, status, created_at, buyer_name")
      .eq("seller_id", user.id)
      .order("created_at", { ascending: false })
      .limit(4),
  ]);

  const chatCount = chats.error ? 0 : (chats.count ?? 0);
  const productsList = recentProducts.error ? [] : (recentProducts.data ?? []);
  const ordersList = recentOrders.error ? [] : (recentOrders.data ?? []);

  const checklist = [
    {
      ok: Boolean(user.phone?.trim()) && user.phone.replace(/\D/g, "").length >= 10,
      label: "WhatsApp wajib (order masuk ke nomor ini)",
      href: "/dashboard/profil",
    },
    {
      ok: Boolean(user.shop_name?.trim()),
      label: "Nama etalase / brand",
      href: "/dashboard/profil",
    },
    {
      ok: Boolean(user.tagline?.trim() || user.bio?.trim()),
      label: "Tagline atau tentang toko",
      href: "/dashboard/profil",
    },
    {
      ok: Boolean(
        user.credentials.legal_name ||
          user.credentials.business_reg_no ||
          user.credentials.tax_status ||
          user.credentials.brand_certs.length
      ),
      label: "Legalitas / sertifikat (opsional)",
      href: "/dashboard/profil",
    },
    {
      ok: (live.count ?? 0) > 0,
      label: "Minimal 1 produk tayang",
      href: "/dashboard/produk",
    },
  ];
  const todo = checklist.filter((c) => !c.ok);
  const readyScore = Math.round(
    (checklist.filter((c) => c.ok).length / checklist.length) * 100
  );

  return (
    <div className="mitra-home">
      <header className="mitra-home__hero">
        <div className="mitra-home__hero-copy">
          <p className="mitra-home__eyebrow">Konsol penjual</p>
          <h1>{shopName}</h1>
          <p className="mitra-home__lead">
            {user.tagline?.trim() ||
              "Kelola etalase, pesanan, dan chat pembeli dari satu tempat."}
          </p>
          <div className="mitra-home__meta">
            <Badge value={user.status} />
            {user.city ? <span>{user.city}</span> : null}
            <span>Kesiapan etalase {readyScore}%</span>
          </div>
          <div className="mitra-home__hero-actions">
            <Link className="btn btn-teal btn-sm" href={storeHref}>
              Lihat etalase publik
            </Link>
            <Link className="btn btn-outline btn-sm" href="/dashboard/produk">
              Kelola produk
            </Link>
            <Link className="btn btn-outline btn-sm" href="/dashboard/profil">
              Edit branding
            </Link>
          </div>
        </div>
        <div className="mitra-home__mark" aria-hidden="true">
          {shopName.slice(0, 1).toUpperCase()}
        </div>
      </header>

      {user.status === "pending" ? (
        <p className="dash-notice">
          Akun mitra sedang diverifikasi admin. Setelah aktif, kamu bisa upload produk.
        </p>
      ) : null}

      {!user.phone?.trim() || user.phone.replace(/\D/g, "").length < 10 ? (
        <p className="dash-notice dash-notice--warn">
          WhatsApp belum diisi — wajib segera. Order pembeli dikirim ke WA kamu, bukan admin.{" "}
          <Link href="/dashboard/profil">Isi nomor sekarang</Link>
        </p>
      ) : null}

      {todo.length ? (
        <section className="mitra-home__checklist" aria-labelledby="mitra-todo">
          <div className="mitra-home__section-head mitra-home__section-head--stack">
            <h2 id="mitra-todo">Lengkapi toko</h2>
            <p>Semakin lengkap, etalase makin dipercaya pembeli.</p>
          </div>
          <ul>
            {todo.map((item) => (
              <li key={item.label}>
                <span>{item.label}</span>
                <Link href={item.href}>Lengkapi</Link>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <p className="mitra-home__ready">Etalase siap. Pantau pesanan dan chat secara berkala.</p>
      )}

      <div className="dash-stats mitra-home__stats">
        <Stat href="/dashboard/produk" value={live.count ?? 0} label="Produk tayang" />
        <Stat href="/dashboard/produk" value={pending.count ?? 0} label="Menunggu verifikasi" />
        <Stat href="/dashboard/pesanan" value={orders.count ?? 0} label="Pesanan baru" />
        <Stat href="/dashboard/chat" value={chatCount} label="Percakapan chat" />
      </div>

      <section className="mitra-home__shortcuts" aria-label="Aksi cepat">
        <Link href="/dashboard/produk" className="mitra-home__shortcut">
          <strong>Tambah / kelola produk</strong>
          <span>Upload, edit, pantau status verifikasi</span>
        </Link>
        <Link href="/dashboard/pesanan" className="mitra-home__shortcut">
          <strong>Pesanan masuk</strong>
          <span>Proses order dari Market</span>
        </Link>
        <Link href="/dashboard/chat" className="mitra-home__shortcut">
          <strong>Chat pembeli</strong>
          <span>Balas pertanyaan real-time</span>
        </Link>
        <Link href="/dashboard/profil" className="mitra-home__shortcut">
          <strong>Profil & legalitas</strong>
          <span>Brand, NIB, pajak, sertifikat</span>
        </Link>
      </section>

      <div className="mitra-home__panels">
        <section className="mitra-home__panel">
          <div className="mitra-home__section-head">
            <h2>Produk terbaru</h2>
            <Link href="/dashboard/produk">Semua</Link>
          </div>
          {productsList.length ? (
            <ul className="mitra-home__list">
              {productsList.map((p) => (
                <li key={p.id}>
                  <div>
                    <strong>{p.title}</strong>
                    <small>{p.price_label || "Hubungi WA"}</small>
                  </div>
                  <Badge value={p.status} />
                </li>
              ))}
            </ul>
          ) : (
            <Empty>
              Belum ada produk.{" "}
              <Link href="/dashboard/produk">Tambah produk pertama</Link>
            </Empty>
          )}
        </section>

        <section className="mitra-home__panel">
          <div className="mitra-home__section-head">
            <h2>Pesanan terbaru</h2>
            <Link href="/dashboard/pesanan">Semua</Link>
          </div>
          {ordersList.length ? (
            <ul className="mitra-home__list">
              {ordersList.map((o) => (
                <li key={o.id}>
                  <div>
                    <strong>{o.product_title ?? "Produk"}</strong>
                    <small>
                      {[o.buyer_name, formatDate(o.created_at)].filter(Boolean).join(" · ")}
                    </small>
                  </div>
                  <Badge value={o.status} />
                </li>
              ))}
            </ul>
          ) : (
            <Empty>Belum ada pesanan masuk.</Empty>
          )}
        </section>
      </div>
    </div>
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
            <li key={o.id} className="dash-row dash-row--product">
              <div className="dash-row__top dash-row__top--text">
                <div className="dash-row__main">
                  <strong>{o.product_title ?? "Produk"}</strong>
                  <small>{formatDate(o.created_at)}</small>
                </div>
              </div>
              <div className="dash-row__foot">
                <Badge value={o.status} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <Empty>Belum ada order. Klik &quot;Order WA&quot; di Market saat login agar tercatat di sini.</Empty>
      )}
    </>
  );
}
