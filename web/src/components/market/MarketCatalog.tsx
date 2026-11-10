"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { ProductItem } from "@/lib/product";
import { sellerHref, sellerLabel, shippingLabel } from "@/lib/product";
import { OrderLink } from "@/components/OrderLink";

const FILTERS = [
  { id: "all", label: "Semua" },
  { id: "digital", label: "Digital" },
  { id: "fisik", label: "Fisik" },
  { id: "official", label: "Official" },
  { id: "mitra", label: "Mitra" },
] as const;

const SORTS = [
  { id: "featured", label: "Unggulan" },
  { id: "newest", label: "Terbaru" },
  { id: "popular", label: "Terpopuler" },
] as const;

const DAY_MS = 24 * 60 * 60 * 1000;

function createdMs(p: ProductItem) {
  if (!p.created_at) return 0;
  const t = Date.parse(p.created_at);
  return Number.isFinite(t) ? t : 0;
}

function isNew(p: ProductItem) {
  const t = createdMs(p);
  return t > 0 && Date.now() - t < 7 * DAY_MS;
}

/** Unggulan: views + boost produk baru (72 jam). */
function featuredScore(p: ProductItem) {
  const views = p.view_count ?? 0;
  const ageH = createdMs(p) ? (Date.now() - createdMs(p)) / 3_600_000 : 9999;
  const freshBoost = Math.max(0, 72 - ageH);
  return views * 3 + freshBoost;
}

function sortProducts(items: ProductItem[], sort: (typeof SORTS)[number]["id"]) {
  const list = [...items];
  if (sort === "newest") {
    return list.sort((a, b) => createdMs(b) - createdMs(a));
  }
  if (sort === "popular") {
    return list.sort((a, b) => {
      const dv = (b.view_count ?? 0) - (a.view_count ?? 0);
      return dv !== 0 ? dv : createdMs(b) - createdMs(a);
    });
  }
  return list.sort((a, b) => {
    const ds = featuredScore(b) - featuredScore(a);
    return ds !== 0 ? ds : createdMs(b) - createdMs(a);
  });
}

export function MarketCatalog({ products }: { products: ProductItem[] }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [sort, setSort] = useState<(typeof SORTS)[number]["id"]>("featured");

  const list = useMemo(() => {
    const filtered = products.filter((p) => {
      if (filter === "all") return true;
      if (filter === "digital" || filter === "fisik") return p.kind === filter;
      if (filter === "official") return !p.owner_id;
      if (filter === "mitra") return !!p.owner_id;
      return true;
    });
    return sortProducts(filtered, sort);
  }, [products, filter, sort]);

  return (
    <div className="mk">
      <div className="mk__filters" role="tablist" aria-label="Filter produk">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={filter === f.id}
            className={`mk__chip${filter === f.id ? " is-active" : ""}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mk__filters mk__filters--sort" role="tablist" aria-label="Urutan produk">
        {SORTS.map((s) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={sort === s.id}
            className={`mk__chip mk__chip--sort${sort === s.id ? " is-active" : ""}`}
            onClick={() => setSort(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="mk__grid">
        {list.map((p) => (
          <article key={p.id} className={`mk-card mk-card--compact mk-card--${p.kind}`}>
            <Link href={`/market/${p.id}`} className="mk-card__media">
              {p.image_url ? (
                <Image
                  src={p.image_url}
                  alt={p.title}
                  width={400}
                  height={300}
                  sizes="(max-width:719px) 45vw, (max-width:959px) 30vw, (max-width:1199px) 22vw, 18vw"
                />
              ) : (
                <span className="mk-card__art" aria-hidden="true">
                  <strong>{p.kind === "fisik" ? "Fisik" : "Digital"}</strong>
                  <small>{p.badge ?? "Market"}</small>
                </span>
              )}
              {p.badge ? <span className="mk-card__badge">{p.badge}</span> : null}
              {isNew(p) ? <span className="mk-card__fresh">Baru</span> : null}
            </Link>
            <div className="mk-card__body">
              <h3>
                <Link href={`/market/${p.id}`}>{p.title}</Link>
              </h3>
              <p className="mk-card__seller">
                <Link href={sellerHref(p)} onClick={(e) => e.stopPropagation()}>
                  {sellerLabel(p)}
                </Link>
              </p>
              <p className="mk-card__ship">{shippingLabel(p.shipping_mode, p.service_area, p.kind)}</p>
              <div className="mk-card__foot">
                <strong>{p.price_label ?? "Hubungi WA"}</strong>
                <OrderLink
                  className="btn btn-teal mk-card__buy"
                  productId={p.id}
                  title={p.title}
                  priceLabel={p.price_label}
                  shippingMode={p.shipping_mode}
                  serviceArea={p.service_area}
                  kind={p.kind}
                >
                  Order
                </OrderLink>
              </div>
            </div>
          </article>
        ))}
      </div>

      {list.length === 0 ? (
        <p className="mk__empty">Belum ada produk di filter ini.</p>
      ) : null}
    </div>
  );
}
