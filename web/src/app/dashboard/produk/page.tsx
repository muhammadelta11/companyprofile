import Link from "next/link";
import { Suspense } from "react";
import { requireUser, type CurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { RichTextEditor } from "@/components/RichTextEditor";
import { deleteProduct, saveProduct, setProductStatus } from "../actions";
import { SubmitButton } from "../SubmitButton";
import { SafeForm } from "../SafeForm";
import { SafeAction } from "../SafeAction";
import { GalleryField } from "@/components/dashboard/GalleryField";
import { AreaMapField } from "@/components/dashboard/AreaMapField";
import { RejectProductForm } from "@/components/dashboard/RejectProductForm";
import { SHIPPING_OPTIONS, type ShippingMode } from "@/lib/product";
import { Badge, DashHead, DashLoading, Empty, formatDate } from "../ui";

type Sumber = "sendiri" | "mitra";

type Props = { searchParams: Promise<{ sumber?: string }> };

export default function ProdukPage({ searchParams }: Props) {
  return (
    <Suspense fallback={<DashLoading />}>
      <Products searchParams={searchParams} />
    </Suspense>
  );
}

type ProductRow = {
  id: string;
  title: string;
  kind: string;
  badge: string | null;
  price_label: string | null;
  description: string | null;
  image_url: string | null;
  gallery: string[] | null;
  shipping_mode: ShippingMode | null;
  service_area: string | null;
  area_lat: number | null;
  area_lng: number | null;
  area_radius_km: number | null;
  reject_reason: string | null;
  status: string;
  sort: number;
  owner_id: string | null;
  created_at: string;
  updated_at: string;
  owner: { full_name: string | null } | null;
};

function submissionKind(
  p: ProductRow,
  approvedByOwner: Map<string, number>
): { label: string; tone: "new" | "add" | "rev" } | null {
  if (p.status !== "pending") return null;
  const created = new Date(p.created_at).getTime();
  const updated = new Date(p.updated_at).getTime();
  const isFirstWrite = !Number.isFinite(created) || !Number.isFinite(updated) || updated - created < 90_000;
  const ownerKey = p.owner_id ?? "official";
  const approvedCount = approvedByOwner.get(ownerKey) ?? 0;

  if (isFirstWrite) {
    if (!p.owner_id) return { label: "Produk official baru", tone: "new" };
    if (approvedCount === 0) return { label: "Pengajuan pertama mitra", tone: "new" };
    return { label: "Tambah produk baru", tone: "add" };
  }
  return { label: "Revisi / diajukan ulang", tone: "rev" };
}

function parseSumber(raw: string | undefined): Sumber {
  return raw === "mitra" ? "mitra" : "sendiri";
}

async function Products({ searchParams }: Props) {
  const user = await requireUser(["admin", "mitra"]);
  const sp = await searchParams;
  const supabase = await createClient();
  const isAdmin = user.role === "admin";
  const sumber: Sumber = isAdmin ? parseSumber(sp.sumber) : "sendiri";

  const selectFull =
    "id, title, kind, badge, price_label, description, image_url, gallery, shipping_mode, service_area, area_lat, area_lng, area_radius_km, reject_reason, status, sort, owner_id, created_at, updated_at, owner:profiles!products_owner_id_fkey(full_name)";
  const selectLegacy =
    "id, title, kind, badge, price_label, description, image_url, gallery, shipping_mode, service_area, reject_reason, status, sort, owner_id, created_at, updated_at, owner:profiles!products_owner_id_fkey(full_name)";

  function scoped(select: string) {
    let q = supabase.from("products").select(select).order("created_at", { ascending: false });
    if (!isAdmin) q = q.eq("owner_id", user.id);
    else if (sumber === "mitra") q = q.not("owner_id", "is", null);
    else q = q.is("owner_id", null);
    return q;
  }

  let { data, error } = await scoped(selectFull);
  if (error) ({ data, error } = await scoped(selectLegacy));
  const products = ((data ?? []) as unknown as ProductRow[]).map((p) => ({
    ...p,
    area_lat: p.area_lat ?? null,
    area_lng: p.area_lng ?? null,
    area_radius_km: p.area_radius_km ?? null,
  }));
  const canCreate = (isAdmin && sumber === "sendiri") || (!isAdmin && user.status === "active");

  const approvedByOwner = new Map<string, number>();
  for (const p of products) {
    if (p.status !== "approved") continue;
    const key = p.owner_id ?? "official";
    approvedByOwner.set(key, (approvedByOwner.get(key) ?? 0) + 1);
  }

  const pending = products.filter((p) => p.status === "pending");
  const live = products.filter((p) => p.status === "approved");
  const rejected = products.filter((p) => p.status === "rejected");

  const title = !isAdmin
    ? "Produk Market"
    : sumber === "mitra"
      ? "Produk mitra"
      : "Produk sendiri";
  const text = !isAdmin
    ? "Produk baru atau hasil edit masuk antrean admin sebelum tayang."
    : sumber === "mitra"
      ? "Produk milik penjual mitra. Prioritas: cek antrean “Menunggu persetujuan”."
      : "Produk official brand kamu (bukan milik mitra).";

  return (
    <>
      <DashHead title={title} text={text} />

      {isAdmin ? (
        <nav className="dash-switch" aria-label="Jenis produk">
          <Link
            href="/dashboard/produk?sumber=sendiri"
            className={sumber === "sendiri" ? "is-active" : undefined}
          >
            Produk sendiri
          </Link>
          <Link
            href="/dashboard/produk?sumber=mitra"
            className={sumber === "mitra" ? "is-active" : undefined}
          >
            Produk mitra
          </Link>
        </nav>
      ) : null}

      {canCreate ? (
        <details className="dash-create">
          <summary>+ Tambah produk</summary>
          <ProductForm user={user} />
        </details>
      ) : !isAdmin ? (
        <p className="dash-notice">Akun mitra kamu belum diverifikasi admin.</p>
      ) : null}

      {!products.length ? (
        <Empty>
          {isAdmin && sumber === "mitra"
            ? "Belum ada produk mitra."
            : isAdmin
              ? "Belum ada produk sendiri."
              : "Belum ada produk."}
        </Empty>
      ) : (
        <>
          {pending.length ? (
            <section className="dash-section">
              <h2 className="dash-sub">
                Menunggu persetujuan <span className="dash-count">{pending.length}</span>
              </h2>
              <p className="dash-section__hint">
                {isAdmin
                  ? sumber === "mitra"
                    ? "Ini yang perlu kamu setujui atau tolak. Label menjelaskan jenis pengajuan."
                    : "Produk official yang masih pending (jarang)."
                  : "Menunggu dicek admin."}
              </p>
              <ProductList
                items={pending}
                isAdmin={isAdmin}
                canCreate={canCreate}
                user={user}
                approvedByOwner={approvedByOwner}
              />
            </section>
          ) : null}

          {live.length ? (
            <section className="dash-section">
              <h2 className="dash-sub">
                Sudah tayang <span className="dash-count">{live.length}</span>
              </h2>
              <ProductList
                items={live}
                isAdmin={isAdmin}
                canCreate={canCreate}
                user={user}
                approvedByOwner={approvedByOwner}
              />
            </section>
          ) : null}

          {rejected.length ? (
            <section className="dash-section">
              <h2 className="dash-sub">
                Ditolak <span className="dash-count">{rejected.length}</span>
              </h2>
              <ProductList
                items={rejected}
                isAdmin={isAdmin}
                canCreate={canCreate}
                user={user}
                approvedByOwner={approvedByOwner}
              />
            </section>
          ) : null}
        </>
      )}
    </>
  );
}

function ProductList({
  items,
  isAdmin,
  canCreate,
  user,
  approvedByOwner,
}: {
  items: ProductRow[];
  isAdmin: boolean;
  canCreate: boolean;
  user: CurrentUser;
  approvedByOwner: Map<string, number>;
}) {
  return (
    <ul className="dash-list">
      {items.map((p) => {
        const kind = submissionKind(p, approvedByOwner);
        return (
          <li key={p.id} className="dash-row dash-row--product">
            <div className="dash-row__top">
              {p.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="dash-thumb" src={p.image_url} alt="" />
              ) : (
                <span className="dash-thumb dash-thumb--empty">
                  {p.kind === "digital" ? "D" : "F"}
                </span>
              )}
              <div className="dash-row__main">
                <strong>
                  {p.title}
                  {kind ? (
                    <span className={`dash-chip dash-chip--${kind.tone}`}>{kind.label}</span>
                  ) : null}
                </strong>
                <small>
                  {[
                    p.price_label,
                    p.kind,
                    isAdmin ? p.owner?.full_name ?? "Official" : null,
                    formatDate(p.created_at),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </small>
                {!isAdmin && p.status === "rejected" && p.reject_reason ? (
                  <p className="dash-reject-reason">Alasan tolak: {p.reject_reason}</p>
                ) : null}
              </div>
            </div>

            <div className="dash-row__foot">
              <Badge value={p.status} />
              <div className="dash-row__actions">
                {isAdmin && p.status === "pending" ? (
                  <>
                    <SafeAction action={setProductStatus.bind(null, p.id, "approved")}>
                      Setujui
                    </SafeAction>
                    <RejectProductForm productId={p.id} />
                  </>
                ) : null}
                {isAdmin && p.status === "rejected" ? (
                  <SafeAction action={setProductStatus.bind(null, p.id, "approved")}>
                    Setujui sekarang
                  </SafeAction>
                ) : null}
                <SafeAction
                  className="btn btn-danger btn-sm dash-row__danger"
                  confirm={`Hapus "${p.title}"?`}
                  action={deleteProduct.bind(null, p.id)}
                >
                  Hapus
                </SafeAction>
              </div>
            </div>

            {canCreate || isAdmin ? (
              <details className="dash-edit">
                <summary>Ubah produk</summary>
                <ProductForm user={user} product={p} />
              </details>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

function ProductForm({ user, product }: { user: CurrentUser; product?: ProductRow }) {
  const persistKey = product ? `product-${product.id}` : "product-new";
  return (
    <SafeForm action={saveProduct} className="form-stack" persistKey={persistKey}>
      {product ? <input type="hidden" name="id" value={product.id} /> : null}
      <label>
        Nama produk
        <input name="title" defaultValue={product?.title} required />
      </label>
      <div className="form-row">
        <label>
          Jenis
          <select name="kind" defaultValue={product?.kind ?? "fisik"}>
            <option value="fisik">Fisik</option>
            <option value="digital">Digital</option>
          </select>
        </label>
        <label>
          Kategori
          <input
            name="badge"
            list="product-badge-options"
            defaultValue={product?.badge ?? ""}
            placeholder="Makanan, Elektronik, Jasa…"
          />
          <datalist id="product-badge-options">
            <option value="Makanan" />
            <option value="Minuman" />
            <option value="Elektronik" />
            <option value="Fashion" />
            <option value="Kecantikan" />
            <option value="Rumah tangga" />
            <option value="Jasa" />
            <option value="Digital" />
            <option value="Pendidikan" />
            <option value="Lainnya" />
          </datalist>
        </label>
      </div>
      <div className="form-row">
        <label>
          Harga
          <input name="price_label" defaultValue={product?.price_label ?? ""} placeholder="Rp 25.000" />
        </label>
        {user.role === "admin" ? (
          <label>
            Urutan tampil di website
            <input name="sort" type="number" defaultValue={product?.sort ?? 100} />
          </label>
        ) : null}
      </div>
      <label>
        Cara kirim
        <select
          name="shipping_mode"
          defaultValue={
            product?.shipping_mode ?? (product?.kind === "digital" ? "digital" : "area")
          }
        >
          {SHIPPING_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <AreaMapField
        defaultLat={product?.area_lat}
        defaultLng={product?.area_lng}
        defaultRadiusKm={product?.area_radius_km}
        defaultLabel={product?.service_area}
      />
      <RichTextEditor
        key={product ? `desc-${product.id}` : "desc-new"}
        name="description"
        label="Deskripsi"
        defaultValue={product?.description ?? ""}
      />
      <GalleryField
        persistKey={persistKey}
        initial={
          product?.gallery?.length
            ? product.gallery
            : product?.image_url
              ? [product.image_url]
              : []
        }
      />
      <SubmitButton>{product ? "Simpan & tutup" : "Tambah produk"}</SubmitButton>
    </SafeForm>
  );
}
