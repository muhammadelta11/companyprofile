"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ELEMENT_META } from "@/lib/science/elements";
import { listMolecules } from "@/lib/science/molecules";
import type { MoleculeDefinition, MoleculeStyle } from "@/lib/science/types";

const ScienceViewer = dynamic(
  () => import("./ScienceViewer").then((m) => m.ScienceViewer),
  { ssr: false, loading: () => <div className="sci-viewer sci-viewer--loading">Memuat viewer 3D…</div> }
);

const MoleculeScene = dynamic(
  () => import("./MoleculeScene").then((m) => m.MoleculeScene),
  { ssr: false }
);

type Props = {
  initialId?: string;
};

export function MoleculeExplorer({ initialId = "h2o" }: Props) {
  const molecules = useMemo(() => listMolecules(), []);
  const [activeId, setActiveId] = useState(
    molecules.some((m) => m.id === initialId) ? initialId : molecules[0]?.id ?? "h2o"
  );
  const [style, setStyle] = useState<MoleculeStyle>("ball-stick");
  const [showLabels, setShowLabels] = useState(true);
  const [selectedAtomId, setSelectedAtomId] = useState<string | null>(null);
  const [resetNonce, setResetNonce] = useState(0);

  useEffect(() => {
    if (!initialId) return;
    if (molecules.some((m) => m.id === initialId)) {
      setActiveId(initialId);
      setSelectedAtomId(null);
    }
  }, [initialId, molecules]);

  const molecule = molecules.find((m) => m.id === activeId) ?? molecules[0];
  const selectedAtom = molecule?.atoms.find((a) => a.id === selectedAtomId) ?? null;
  const selectedMeta = selectedAtom ? ELEMENT_META[selectedAtom.element] : null;

  if (!molecule) {
    return <p className="dash-empty">Belum ada molekul.</p>;
  }

  return (
    <div className="sci-explorer">
      <aside className="sci-explorer__side" aria-label="Daftar molekul">
        <p className="sci-explorer__side-head">Katalog</p>
        <ul className="sci-explorer__list">
          {molecules.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                className={m.id === molecule.id ? "is-active" : undefined}
                onClick={() => {
                  setActiveId(m.id);
                  setSelectedAtomId(null);
                }}
              >
                <strong dangerouslySetInnerHTML={{ __html: m.formulaHtml }} />
                <span>{m.name}</span>
              </button>
            </li>
          ))}
        </ul>
        <p className="sci-explorer__note">
          Seed lokal (geometri edukatif). Integrasi PubChem &amp; unggah GLB menyusul.
        </p>
      </aside>

      <div className="sci-explorer__stage">
        <div className="sci-explorer__toolbar" role="toolbar" aria-label="Kontrol viewer">
          <div className="sci-explorer__modes">
            {(
              [
                ["ball-stick", "Ball & Stick"],
                ["spacefill", "Space Filling"],
                ["wireframe", "Wireframe"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={style === id ? "is-active" : undefined}
                onClick={() => setStyle(id)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="sci-explorer__actions">
            <label className="sci-explorer__check">
              <input
                type="checkbox"
                checked={showLabels}
                onChange={(e) => setShowLabels(e.target.checked)}
              />
              Label atom
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
          <MoleculeScene
            key={molecule.id}
            molecule={molecule}
            style={style}
            selectedAtomId={selectedAtomId}
            onSelectAtom={setSelectedAtomId}
            showLabels={showLabels}
          />
        </ScienceViewer>

        <p className="sci-explorer__hint">
          Seret untuk memutar · scroll/pinch untuk zoom · geser kanan untuk pan · klik atom untuk detail
        </p>
      </div>

      <MoleculeInfoPanel molecule={molecule} selectedMeta={selectedMeta} selectedAtomId={selectedAtomId} />
    </div>
  );
}

function MoleculeInfoPanel({
  molecule,
  selectedMeta,
  selectedAtomId,
}: {
  molecule: MoleculeDefinition;
  selectedMeta: { name: string; atomicNumber: number; color: string } | null;
  selectedAtomId: string | null;
}) {
  return (
    <aside className="sci-info" aria-label="Informasi molekul">
      <p className="sci-info__eyebrow">
        {molecule.track === "pharmacy" ? "Farmasi" : "Kimia"} · {molecule.category}
      </p>
      <h2>{molecule.name}</h2>
      <p
        className="sci-info__formula"
        dangerouslySetInnerHTML={{ __html: molecule.formulaHtml }}
      />
      <dl className="sci-info__meta">
        <div>
          <dt>Massa molar</dt>
          <dd>{molecule.molarMass} g/mol</dd>
        </div>
        <div>
          <dt>Atom</dt>
          <dd>{molecule.atoms.length}</dd>
        </div>
        <div>
          <dt>Ikatan</dt>
          <dd>{molecule.bonds.length}</dd>
        </div>
        {molecule.pubchemCid ? (
          <div>
            <dt>PubChem</dt>
            <dd>
              <a
                href={`https://pubchem.ncbi.nlm.nih.gov/compound/${molecule.pubchemCid}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                CID {molecule.pubchemCid}
              </a>
            </dd>
          </div>
        ) : null}
      </dl>

      <p className="sci-info__summary">{molecule.summary}</p>

      <h3>Poin belajar</h3>
      <ul className="sci-info__points">
        {molecule.learningPoints.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>

      {selectedMeta && selectedAtomId ? (
        <div className="sci-info__atom">
          <h3>Atom terpilih</h3>
          <p>
            <span
              className="sci-info__swatch"
              style={{ background: selectedMeta.color }}
              aria-hidden
            />
            <strong>
              {selectedAtomId.toUpperCase()} · {selectedMeta.name}
            </strong>
          </p>
          <small>Nomor atom {selectedMeta.atomicNumber}</small>
        </div>
      ) : (
        <p className="sci-info__pick">Klik atom pada model untuk melihat detail unsur.</p>
      )}

      <p className="sci-info__source">
        <strong>Sumber:</strong> {molecule.source}
      </p>

      <Link className="btn btn-outline btn-sm" href="/belajar">
        ← Semua modul belajar
      </Link>
    </aside>
  );
}
