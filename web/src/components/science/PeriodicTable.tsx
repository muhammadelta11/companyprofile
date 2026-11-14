"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CATEGORY_COLOR,
  CATEGORY_LABEL,
  PERIODIC_ELEMENTS,
  categoryBlurb,
  type ElementCategory,
  type PeriodicElement,
} from "@/lib/science/periodic-table";

const CATEGORIES = Object.keys(CATEGORY_LABEL) as ElementCategory[];

type Props = {
  initialZ?: number;
};

export function PeriodicTable({ initialZ = 1 }: Props) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ElementCategory | "all">("all");
  const [selectedZ, setSelectedZ] = useState(
    PERIODIC_ELEMENTS.some((el) => el.z === initialZ) ? initialZ : 1
  );

  const selected =
    PERIODIC_ELEMENTS.find((el) => el.z === selectedZ) ?? PERIODIC_ELEMENTS[0];

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return new Set(
      PERIODIC_ELEMENTS.filter((el) => {
        if (category !== "all" && el.category !== category) return false;
        if (!q) return true;
        return (
          el.symbol.toLowerCase() === q ||
          el.name.toLowerCase().includes(q) ||
          el.nameEn.toLowerCase().includes(q) ||
          String(el.z) === q
        );
      }).map((el) => el.z)
    );
  }, [query, category]);

  const dimmed = query.trim().length > 0 || category !== "all";

  return (
    <div className="ptable">
      <div className="ptable__toolbar">
        <label className="ptable__search">
          <span className="sr-only">Cari unsur</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari nama, simbol, atau nomor atom…"
            autoComplete="off"
          />
        </label>
        <div className="ptable__filters" role="group" aria-label="Filter kategori">
          <button
            type="button"
            className={category === "all" ? "is-active" : undefined}
            onClick={() => setCategory("all")}
          >
            Semua
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              className={category === c ? "is-active" : undefined}
              style={{ ["--pt-swatch" as string]: CATEGORY_COLOR[c] }}
              onClick={() => setCategory(c)}
            >
              <i aria-hidden />
              {CATEGORY_LABEL[c]}
            </button>
          ))}
        </div>
      </div>

      <div className="ptable__layout">
        <div className="ptable__board-wrap">
          <div className="ptable__board" role="grid" aria-label="Tabel periodik unsur">
            {PERIODIC_ELEMENTS.map((el) => {
              const hit = matches.has(el.z);
              const active = el.z === selected.z;
              return (
                <button
                  key={el.z}
                  type="button"
                  role="gridcell"
                  className={`ptable__cell${active ? " is-active" : ""}${
                    dimmed && !hit ? " is-dim" : ""
                  }`}
                  style={{
                    gridColumn: el.col,
                    gridRow: el.row,
                    ["--pt-bg" as string]: CATEGORY_COLOR[el.category],
                  }}
                  aria-label={`${el.name}, ${el.symbol}, nomor atom ${el.z}`}
                  aria-pressed={active}
                  onClick={() => setSelectedZ(el.z)}
                >
                  <span className="ptable__z">{el.z}</span>
                  <span className="ptable__sym">{el.symbol}</span>
                  <span className="ptable__name">{el.name}</span>
                </button>
              );
            })}
            <span className="ptable__series-label" style={{ gridColumn: 3, gridRow: 9 }}>
              *
            </span>
            <span className="ptable__series-label" style={{ gridColumn: 3, gridRow: 10 }}>
              **
            </span>
          </div>
          <p className="ptable__hint">
            * Lantanida (Ce–Lu) · ** Aktinida (Th–Lr) · Klik unsur untuk detail
          </p>
        </div>

        <ElementDetail el={selected} />
      </div>
    </div>
  );
}

function ElementDetail({ el }: { el: PeriodicElement }) {
  const moleculeHref =
    el.symbol === "H" || el.symbol === "O"
      ? "/belajar/kimia/molekul?id=h2o"
      : el.symbol === "C"
        ? "/belajar/kimia/molekul?id=ch4"
        : el.symbol === "N"
          ? "/belajar/kimia/molekul?id=nh3"
          : null;

  return (
    <aside className="ptable__detail" aria-live="polite">
      <div
        className="ptable__detail-hero"
        style={{ background: CATEGORY_COLOR[el.category] }}
      >
        <span className="ptable__detail-z">{el.z}</span>
        <strong className="ptable__detail-sym">{el.symbol}</strong>
        <h2>{el.name}</h2>
        <p>{el.nameEn}</p>
      </div>

      <dl className="ptable__meta">
        <div>
          <dt>Nomor atom</dt>
          <dd>{el.z}</dd>
        </div>
        <div>
          <dt>Massa atom relatif</dt>
          <dd>{formatMass(el.mass)}</dd>
        </div>
        <div>
          <dt>Periode</dt>
          <dd>{el.period}</dd>
        </div>
        <div>
          <dt>Golongan</dt>
          <dd>{el.group ?? "— (deret f)"}</dd>
        </div>
        <div>
          <dt>Kategori</dt>
          <dd>{CATEGORY_LABEL[el.category]}</dd>
        </div>
        <div>
          <dt>Konfigurasi elektron</dt>
          <dd className="ptable__config">{el.electronConfig}</dd>
        </div>
      </dl>

      <p className="ptable__blurb">{categoryBlurb(el.category)}</p>

      <div className="ptable__actions">
        {moleculeHref ? (
          <Link className="btn btn-teal btn-sm" href={moleculeHref}>
            Lihat di Molecular Explorer
          </Link>
        ) : null}
        <Link className="btn btn-outline btn-sm" href="/belajar">
          ← Semua modul
        </Link>
      </div>

      <p className="ptable__source">
        Sumber: massa &amp; konfigurasi mengikuti nilai standar IUPAC / referensi kimia umum
        (edukatif). Unsur superberat: massa isotop paling stabil yang diketahui.
      </p>
    </aside>
  );
}

function formatMass(mass: number) {
  if (Number.isInteger(mass)) return String(mass);
  const s = mass.toFixed(4).replace(/\.?0+$/, "");
  return s;
}
