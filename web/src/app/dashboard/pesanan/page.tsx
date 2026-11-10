import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { waTo } from "@/data/site";
import { setOrderStatus } from "../actions";
import { SafeAction } from "../SafeAction";
import { Badge, DashHead, DashLoading, Empty, formatDate } from "../ui";

export default function PesananPage() {
  return (
    <Suspense fallback={<DashLoading />}>
      <Orders />
    </Suspense>
  );
}

const NEXT_STATUS: Record<string, { status: string; label: string }[]> = {
  new: [
    { status: "processing", label: "Proses" },
    { status: "cancelled", label: "Batal" },
  ],
  processing: [
    { status: "done", label: "Selesai" },
    { status: "cancelled", label: "Batal" },
  ],
};

type OrderRow = {
  id: string;
  product_title: string | null;
  status: string;
  created_at: string;
  seller_id: string | null;
  buyer_name: string | null;
  buyer_phone: string | null;
  buyer_city: string | null;
  note: string | null;
  buyer: { full_name: string | null; phone: string | null } | null;
};

async function Orders() {
  const user = await requireUser();
  const supabase = await createClient();

  let query = supabase
    .from("orders")
    .select(
      "id, product_title, status, created_at, seller_id, buyer_name, buyer_phone, buyer_city, note, buyer:profiles!orders_buyer_id_fkey(full_name, phone)"
    )
    .order("created_at", { ascending: false })
    .limit(100);
  if (user.role === "mitra") query = query.eq("seller_id", user.id);
  if (user.role === "member") query = query.eq("buyer_id", user.id);

  const { data, error } = await query;
  // Fallback jika kolom P0 belum dimigrasi
  let orders = (data ?? []) as unknown as OrderRow[];
  if (error) {
    let q2 = supabase
      .from("orders")
      .select(
        "id, product_title, status, created_at, seller_id, buyer:profiles!orders_buyer_id_fkey(full_name, phone)"
      )
      .order("created_at", { ascending: false })
      .limit(100);
    if (user.role === "mitra") q2 = q2.eq("seller_id", user.id);
    if (user.role === "member") q2 = q2.eq("buyer_id", user.id);
    const retry = await q2;
    orders = (retry.data ?? []) as unknown as OrderRow[];
  }

  const canManage = user.role !== "member";

  return (
    <>
      <DashHead
        title="Pesanan"
        text={
          canManage
            ? "Order dari form Market. Chat lanjut di WhatsApp pembeli / sudah terbuka di sisi pembeli."
            : "Riwayat order kamu."
        }
      />
      {orders.length ? (
        <ul className="dash-list">
          {orders.map((o) => {
            const buyerLabel =
              o.buyer_name || o.buyer?.full_name || "Pengunjung";
            const phone = o.buyer_phone || o.buyer?.phone || "";
            return (
              <li key={o.id} className="dash-row dash-row--wrap">
                <div className="dash-row__main">
                  <strong>{o.product_title ?? "Produk"}</strong>
                  <small>
                    {formatDate(o.created_at)}
                    {canManage
                      ? ` · ${buyerLabel}${o.buyer_city ? ` · ${o.buyer_city}` : ""}`
                      : null}
                  </small>
                  {canManage && o.note ? <small className="dash-order-note">Catatan: {o.note}</small> : null}
                </div>
                <Badge value={o.status} />
                {canManage ? (
                  <div className="dash-row__actions">
                    {phone ? (
                      <a
                        className="btn btn-outline btn-sm"
                        href={waTo(
                          phone,
                          `Halo ${buyerLabel}, terkait order ${o.product_title ?? ""} di masudeltamamy.com…`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        WA pembeli
                      </a>
                    ) : null}
                    {(NEXT_STATUS[o.status] ?? []).map((n) => (
                      <SafeAction
                        key={n.status}
                        className="btn btn-outline btn-sm"
                        action={setOrderStatus.bind(null, o.id, n.status)}
                      >
                        {n.label}
                      </SafeAction>
                    ))}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : (
        <Empty>Belum ada pesanan.</Empty>
      )}
    </>
  );
}
