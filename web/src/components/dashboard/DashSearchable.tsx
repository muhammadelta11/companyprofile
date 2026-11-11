"use client";

import { Children, isValidElement, useMemo, useState } from "react";
import { CatalogSearch } from "@/components/CatalogSearch";
import { matchesQuery } from "@/lib/catalog-search";

export function DashSearchable({
  children,
  placeholder,
  empty = "Tidak ada yang cocok dengan pencarian.",
}: {
  children: React.ReactNode;
  placeholder: string;
  empty?: string;
}) {
  const [query, setQuery] = useState("");
  const items = Children.toArray(children);

  const visible = useMemo(() => {
    if (!normalizeHasQuery(query)) return items;
    return items.filter((child) => {
      if (!isValidElement(child)) return true;
      const props = child.props as { "data-search"?: string };
      return matchesQuery([props["data-search"]], query);
    });
  }, [items, query]);

  return (
    <div className="dash-search-wrap">
      <CatalogSearch
        value={query}
        onChange={setQuery}
        placeholder={placeholder}
        label="Cari di daftar"
        className="catalog-search--dash"
      />
      {visible.length ? (
        <ul className="dash-list">{visible}</ul>
      ) : (
        <p className="dash-empty">{query.trim() ? empty : "Belum ada data."}</p>
      )}
    </div>
  );
}

function normalizeHasQuery(q: string) {
  return q.trim().length > 0;
}
