"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { ProjectItem } from "@/lib/content";
import { htmlToPlain } from "@/lib/html";

const FILTERS = [
  { id: "all", label: "Semua" },
  { id: "web", label: "Web" },
  { id: "mobile", label: "Mobile" },
  { id: "research", label: "Riset" },
] as const;

export function ProjectGallery({ projects }: { projects: ProjectItem[] }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const list = useMemo(
    () => projects.filter((p) => filter === "all" || p.category === filter),
    [projects, filter],
  );

  return (
    <div className="pj">
      <div className="pj__filters" role="tablist" aria-label="Filter proyek">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={filter === f.id}
            className={`pj__chip${filter === f.id ? " is-active" : ""}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="pj__grid">
        {list.map((p) => {
          const inner = (
            <>
              <div className="pj-card__media">
                {p.cover_url ? (
                  <Image
                    src={p.cover_url}
                    alt={p.title}
                    width={800}
                    height={560}
                    sizes="(max-width:700px) 100vw, 360px"
                  />
                ) : (
                  <span className="pj-card__fallback">{p.title.slice(0, 2).toUpperCase()}</span>
                )}
                <span className="pj-card__cat">{p.category}</span>
              </div>
              <div className="pj-card__body">
                {p.tag ? <span className="pj-card__tag">{p.tag}</span> : null}
                <h3>{p.title}</h3>
                {p.summary ? <p>{htmlToPlain(p.summary, 56)}</p> : null}
              </div>
            </>
          );

          return p.link ? (
            <a
              key={p.id}
              className="pj-card pj-card--compact"
              href={p.link}
              target="_blank"
              rel="noopener noreferrer"
            >
              {inner}
            </a>
          ) : (
            <article key={p.id} className="pj-card pj-card--compact">
              {inner}
            </article>
          );
        })}
      </div>

      {list.length === 0 ? <p className="pj__empty">Belum ada proyek di kategori ini.</p> : null}
    </div>
  );
}
