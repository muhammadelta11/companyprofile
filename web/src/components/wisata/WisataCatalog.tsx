"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { CatalogSearch } from "@/components/CatalogSearch";
import { tripExtra } from "@/data/catalog-extra";
import { matchesQuery } from "@/lib/catalog-search";
import type { TripItem } from "@/lib/content";

export function WisataCatalog({ trips }: { trips: TripItem[] }) {
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("all");

  const tags = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of trips) {
      const key = (t.tag ?? "").trim().toLowerCase();
      if (!key) continue;
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return [...map.entries()]
      .map(([id, count]) => ({
        id,
        label: trips.find((t) => (t.tag ?? "").trim().toLowerCase() === id)?.tag ?? id,
        count,
      }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "id"));
  }, [trips]);

  const safeTag = tag === "all" || tags.some((t) => t.id === tag) ? tag : "all";

  const visible = useMemo(() => {
    return trips.filter((t) => {
      if (safeTag !== "all" && (t.tag ?? "").trim().toLowerCase() !== safeTag) {
        return false;
      }
      return matchesQuery(
        [t.title, t.tag, t.duration, t.price_label, t.summary],
        query
      );
    });
  }, [trips, safeTag, query]);

  return (
    <div className="tr-catalog">
      <div className="mk-toolbar mk-toolbar--compact">
        <CatalogSearch
          value={query}
          onChange={setQuery}
          placeholder="Cari paket, destinasi, durasi…"
          label="Cari paket wisata"
        />
        {tags.length ? (
          <div className="mk-toolbar__chips" role="tablist" aria-label="Filter tag">
            <button
              type="button"
              role="tab"
              aria-selected={safeTag === "all"}
              className={`mk__chip${safeTag === "all" ? " is-active" : ""}`}
              onClick={() => setTag("all")}
            >
              Semua
            </button>
            {tags.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={safeTag === t.id}
                className={`mk__chip${safeTag === t.id ? " is-active" : ""}`}
                onClick={() => setTag(safeTag === t.id ? "all" : t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        ) : null}
        <p className="mk-toolbar__meta">
          <strong>{visible.length}</strong> paket
          {query.trim() ? " cocok" : ""}
        </p>
      </div>

      <div className="tr-grid">
        {visible.map((t) => {
          const extra = tripExtra(t.id, t.title);
          return (
            <Link
              key={t.id}
              href={`/wisata/${t.id}`}
              className={`tr-card tr-card--compact tr-card--${extra?.tone ?? "sky"}`}
            >
              <span className="tr-card__media">
                {t.image_url ? (
                  <Image
                    src={t.image_url}
                    alt={t.title}
                    width={400}
                    height={280}
                    sizes="160px"
                  />
                ) : (
                  <span className="tr-card__art" aria-hidden="true">
                    <em>{t.tag ?? "Trip"}</em>
                  </span>
                )}
              </span>
              <span className="tr-card__body">
                {t.tag ? <span className="tr-card__tag">{t.tag}</span> : null}
                <strong>{t.title}</strong>
                <small>{t.duration ?? "Fleksibel"}</small>
              </span>
            </Link>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <p className="mk__empty">
          {query.trim() || safeTag !== "all"
            ? "Tidak ada paket yang cocok. Coba kata lain atau hapus filter."
            : "Belum ada paket wisata."}
        </p>
      ) : null}
    </div>
  );
}
