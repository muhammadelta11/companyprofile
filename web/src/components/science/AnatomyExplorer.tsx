"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ANATOMY_MODELS, type AnatomyModel } from "@/lib/science/anatomy";

const ScienceViewer = dynamic(
  () => import("./ScienceViewer").then((m) => m.ScienceViewer),
  { ssr: false, loading: () => <div className="sci-viewer sci-viewer--loading">Memuat viewer 3D…</div> }
);

const AnatomyScene = dynamic(
  () => import("./AnatomyScene").then((m) => m.AnatomyScene),
  { ssr: false }
);

type Props = {
  initialId?: string;
};

export function AnatomyExplorer({ initialId = "heart" }: Props) {
  const models = useMemo(() => ANATOMY_MODELS, []);
  const [modelId, setModelId] = useState(
    models.some((m) => m.id === initialId) ? initialId : models[0]?.id ?? "heart"
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [showLabels, setShowLabels] = useState(false);
  const [exploded, setExploded] = useState(false);
  const [resetNonce, setResetNonce] = useState(0);

  const model = models.find((m) => m.id === modelId) ?? models[0];
  const selected = model?.parts.find((p) => p.id === selectedId) ?? null;

  if (!model) {
    return <p className="dash-empty">Belum ada model anatomi.</p>;
  }

  function togglePart(id: string) {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="sci-explorer anat-explorer">
      <aside className="sci-explorer__side" aria-label="Model & bagian">
        <p className="sci-explorer__side-head">Sistem</p>
        <ul className="sci-explorer__list">
          {models.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                className={m.id === model.id ? "is-active" : undefined}
                onClick={() => {
                  setModelId(m.id);
                  setSelectedId(null);
                  setHidden(new Set());
                }}
              >
                <strong>{m.title}</strong>
                <span>{m.system}</span>
              </button>
            </li>
          ))}
        </ul>

        <p className="sci-explorer__side-head" style={{ marginTop: "0.85rem" }}>
          Bagian
        </p>
        <ul className="anat-parts">
          {model.parts.map((p) => {
            const isHidden = hidden.has(p.id);
            return (
              <li key={p.id}>
                <button
                  type="button"
                  className={`anat-parts__btn${selectedId === p.id ? " is-active" : ""}${
                    isHidden ? " is-hidden" : ""
                  }`}
                  onClick={() => setSelectedId(p.id)}
                >
                  <i style={{ background: p.color }} aria-hidden />
                  <span>{p.name}</span>
                </button>
                <button
                  type="button"
                  className="anat-parts__eye"
                  title={isHidden ? "Tampilkan" : "Sembunyikan"}
                  aria-label={isHidden ? `Tampilkan ${p.name}` : `Sembunyikan ${p.name}`}
                  onClick={() => togglePart(p.id)}
                >
                  {isHidden ? "○" : "●"}
                </button>
              </li>
            );
          })}
        </ul>
        <p className="sci-explorer__note">
          {model.disclaimer}
          <br />
          <span>
            Atribusi model: BodyParts3D © DBCLS ·{" "}
            <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">
              CC BY 4.0
            </a>
          </span>
        </p>
      </aside>

      <div className="sci-explorer__stage">
        <div className="sci-explorer__toolbar" role="toolbar" aria-label="Kontrol anatomi">
          <div className="sci-explorer__actions">
            <label className="sci-explorer__check">
              <input
                type="checkbox"
                checked={showLabels}
                onChange={(e) => setShowLabels(e.target.checked)}
              />
              Pin singkat
            </label>
            <label className="sci-explorer__check">
              <input
                type="checkbox"
                checked={exploded}
                onChange={(e) => setExploded(e.target.checked)}
              />
              Exploded view
            </label>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setResetNonce((n) => n + 1)}
            >
              Reset kamera
            </button>
          </div>
        </div>

        <ScienceViewer resetNonce={resetNonce}>
          <AnatomyScene
            key={model.id}
            model={model}
            selectedId={selectedId}
            hiddenIds={hidden}
            onSelect={setSelectedId}
            showLabels={showLabels}
            exploded={exploded}
          />
        </ScienceViewer>

        <p className="sci-explorer__hint">
          Seret untuk memutar · zoom · klik bagian (detail di panel kanan) · Pin singkat opsional
        </p>
      </div>

      <AnatomyInfoPanel model={model} selected={selected} />
    </div>
  );
}

function AnatomyInfoPanel({
  model,
  selected,
}: {
  model: AnatomyModel;
  selected: AnatomyModel["parts"][number] | null;
}) {
  return (
    <aside className="sci-info" aria-label="Informasi anatomi">
      <p className="sci-info__eyebrow">Kedokteran · {model.system}</p>
      <h2>{selected ? selected.name : model.title}</h2>
      {selected?.nameLa ? <p className="sci-info__formula">{selected.nameLa}</p> : null}

      <p className="sci-info__summary">{selected ? selected.summary : model.summary}</p>

      {selected ? (
        <>
          <h3>Poin belajar</h3>
          <ul className="sci-info__points">
            {selected.learningPoints.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </>
      ) : (
        <p className="sci-info__pick">Klik ruang atau pembuluh pada model untuk detail.</p>
      )}

      <p className="sci-info__source">
        <strong>Sumber:</strong> {model.source}
        <br />
        <strong>Lisensi:</strong> {model.license}
      </p>

      <div className="ptable__actions" style={{ padding: 0 }}>
        <Link className="btn btn-outline btn-sm" href="/belajar/kedokteran">
          ← Hub kedokteran
        </Link>
        <Link className="btn btn-outline btn-sm" href="/belajar">
          Semua modul
        </Link>
      </div>
    </aside>
  );
}
