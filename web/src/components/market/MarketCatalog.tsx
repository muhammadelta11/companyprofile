"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { ProductItem } from "@/lib/product";
import { productChatHref } from "@/lib/access-policy";
import { matchesQuery } from "@/lib/catalog-search";
import { sellerHref, sellerLabel, shippingLabel } from "@/lib/product";
import { CatalogSearch } from "@/components/CatalogSearch";
import { OrderLink } from "@/components/OrderLink";

const SCOPES = [
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

type ScopeId = "all" | (typeof SCOPES)[number]["id"];
type SortId = (typeof SORTS)[number]["id"];

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

function featuredScore(p: ProductItem) {
  const views = p.view_count ?? 0;
  const ageH = createdMs(p) ? (Date.now() - createdMs(p)) / 3_600_000 : 9999;
  const freshBoost = Math.max(0, 72 - ageH);
  return views * 3 + freshBoost;
}

function sortProducts(items: ProductItem[], sort: SortId) {
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

function badgeKey(badge: string | null | undefined) {
  return (badge ?? "").trim().toLowerCase();
}

function titleCaseBadge(raw: string) {
  return raw
    .trim()
    .split(/\s+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(" ");
}

function matchesScope(p: ProductItem, scope: ScopeId) {
  if (scope === "all") return true;
  if (scope === "digital" || scope === "fisik") return p.kind === scope;
  if (scope === "official") return !p.owner_id;
  if (scope === "mitra") return !!p.owner_id;
  return true;
}

function matchesCategory(p: ProductItem, category: string) {
  if (category === "all") return true;
  return badgeKey(p.badge) === category;
}

export function MarketCatalog({
  products,
  canChat = false,
}: {
  products: ProductItem[];
  /** Sudah login & tidak suspended → chat langsung; kalau false tombol Chat wajib masuk. */
  canChat?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [scope, setScope] = useState<ScopeId>("all");
  const [sort, setSort] = useState<SortId>("featured");

  const categories = useMemo(() => {
    const map = new Map<string, { label: string; count: number }>();
    for (const p of products) {
      const key = badgeKey(p.badge);
      if (!key) continue;
      const label = titleCaseBadge(p.badge!);
      const prev = map.get(key);
      if (prev) prev.count += 1;
      else map.set(key, { label, count: 1 });
    }
    return [...map.entries()]
      .map(([id, v]) => ({ id, label: v.label, count: v.count }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "id"));
  }, [products]);

  const scopes = useMemo(() => {
    return SCOPES.filter((s) => products.some((p) => matchesScope(p, s.id)));
  }, [products]);

  const safeCategory =
    category === "all" || categories.some((c) => c.id === category) ? category : "all";
  const safeScope =
    scope === "all" || scopes.some((s) => s.id === scope) ? scope : "all";

  const visible = useMemo(() => {
    const filtered = products.filter(
      (p) =>
        matchesCategory(p, safeCategory) &&
        matchesScope(p, safeScope) &&
        matchesQuery(
          [
            p.title,
            p.badge,
            p.price_label,
            p.kind,
            p.service_area,
            sellerLabel(p),
            p.owner?.shop_name,
            p.owner?.full_name,
            p.owner?.city,
          ],
          query
        )
    );
    return sortProducts(filtered, sort);
  }, [products, safeCategory, safeScope, sort, query]);

  return (
    <div className="mk">
      <div className="mk-toolbar mk-toolbar--compact">
        <CatalogSearch
          value={query}
          onChange={setQuery}
          placeholder="Cari produk, penjual, kategori…"
          label="Cari produk"
        />
        <div className="mk-toolbar__chips" role="tablist" aria-label="Filter produk">
          <button
            type="button"
            role="tab"
            aria-selected={safeCategory === "all" && safeScope === "all"}
            className={`mk__chip${safeCategory === "all" && safeScope === "all" ? " is-active" : ""}`}
            onClick={() => {
              setCategory("all");
              setScope("all");
            }}
          >
            Semua
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={safeCategory === c.id}
              className={`mk__chip${safeCategory === c.id ? " is-active" : ""}`}
              onClick={() => setCategory(c.id)}
            >
              {c.label}
            </button>
          ))}
          {scopes.length ? <span className="mk-toolbar__sep" aria-hidden="true" /> : null}
          {scopes.map((s) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={safeScope === s.id}
              className={`mk__chip mk__chip--soft${safeScope === s.id ? " is-active" : ""}`}
              onClick={() => setScope(safeScope === s.id ? "all" : s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="mk-toolbar__foot">
          <p className="mk-toolbar__meta">
            <strong>{visible.length}</strong> produk
            {query.trim() ? " cocok" : ""}
          </p>
          <div className="mk-toolbar__chips mk-toolbar__chips--sort" role="tablist" aria-label="Urutan">
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
        </div>
      </div>

      <div className="mk__grid">
        {visible.map((p) => (
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
              <p className="mk-card__ship">
                {shippingLabel(p.shipping_mode, p.service_area, p.kind, p.area_radius_km)}
              </p>
              <div className="mk-card__foot">
                <strong>{p.price_label ?? "Hubungi WA"}</strong>
                <div className="mk-card__actions">
                  <Link
                    href={productChatHref(p.id, canChat)}
                    className="btn btn-outline mk-card__chat"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Chat
                  </Link>
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
            </div>
          </article>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="mk__empty">
          {query.trim()
            ? "Tidak ada produk yang cocok. Coba kata lain atau hapus pencarian."
            : "Belum ada produk di filter ini."}
        </p>
      ) : null}
    </div>
  );
}
