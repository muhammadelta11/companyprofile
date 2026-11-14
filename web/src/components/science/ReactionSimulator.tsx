"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CHEMICAL_REACTIONS,
  REACTION_SPECIES,
  computeStoichiometry,
  type ChemicalReaction,
} from "@/lib/science/reactions";

const ScienceViewer = dynamic(
  () => import("./ScienceViewer").then((m) => m.ScienceViewer),
  { ssr: false, loading: () => <div className="sci-viewer sci-viewer--loading">Memuat viewer 3D…</div> }
);

const ReactionScene = dynamic(
  () => import("./ReactionScene").then((m) => m.ReactionScene),
  { ssr: false }
);

export function ReactionSimulator() {
  const [reactionId, setReactionId] = useState(CHEMICAL_REACTIONS[0].id);
  const reaction = CHEMICAL_REACTIONS.find((r) => r.id === reactionId) ?? CHEMICAL_REACTIONS[0];

  const [molesMap, setMolesMap] = useState<Record<string, number>>(() =>
    defaultMoles(CHEMICAL_REACTIONS[0])
  );
  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [resetNonce, setResetNonce] = useState(0);
  const lastTs = useRef<number | null>(null);

  useEffect(() => {
    setMolesMap(defaultMoles(reaction));
    setProgress(0);
    setPlaying(false);
  }, [reaction.id]);

  useEffect(() => {
    if (!playing) {
      lastTs.current = null;
      return;
    }
    let raf = 0;
    const tick = (ts: number) => {
      if (lastTs.current == null) lastTs.current = ts;
      const dt = (ts - lastTs.current) / 1000;
      lastTs.current = ts;
      setProgress((p) => {
        const next = p + dt * 0.35;
        if (next >= 1) {
          setPlaying(false);
          return 1;
        }
        return next;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  const primaryReactant = reaction.reactants[0];
  const stoich = useMemo(() => {
    const inputMoles = molesMap[primaryReactant.speciesId] ?? 1;
    return computeStoichiometry(
      reaction,
      { speciesId: primaryReactant.speciesId, moles: inputMoles },
      molesMap
    );
  }, [reaction, molesMap, primaryReactant.speciesId]);

  function setMole(speciesId: string, value: number) {
    setMolesMap((prev) => ({ ...prev, [speciesId]: value }));
  }

  return (
    <div className="sci-explorer rxn-sim">
      <aside className="sci-explorer__side" aria-label="Daftar reaksi">
        <p className="sci-explorer__side-head">Reaksi</p>
        <ul className="sci-explorer__list">
          {CHEMICAL_REACTIONS.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                className={r.id === reaction.id ? "is-active" : undefined}
                onClick={() => setReactionId(r.id)}
              >
                <strong>{r.title}</strong>
                <span dangerouslySetInnerHTML={{ __html: r.equationHtml }} />
              </button>
            </li>
          ))}
        </ul>
        <p className="sci-explorer__note">
          Visualisasi konseptual stoikiometri — bukan simulasi dinamika molekular / kinetika penuh.
        </p>
      </aside>

      <div className="sci-explorer__stage">
        <div className="sci-explorer__toolbar">
          <div className="sci-explorer__actions">
            <button
              type="button"
              className="btn btn-teal btn-sm"
              onClick={() => {
                if (progress >= 1) {
                  setProgress(0);
                  setPlaying(true);
                  return;
                }
                setPlaying((v) => !v);
              }}
            >
              {playing ? "Pause" : progress >= 1 ? "Ulang animasi" : "Play"}
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => {
                setPlaying(false);
                setProgress(0);
                setResetNonce((n) => n + 1);
              }}
            >
              Reset
            </button>
          </div>
        </div>

        <div className="rxn-progress" aria-hidden>
          <div className="rxn-progress__bar" style={{ width: `${progress * 100}%` }} />
        </div>

        <ScienceViewer resetNonce={resetNonce}>
          <ReactionScene reaction={reaction} progress={progress} />
        </ScienceViewer>

        <p className="sci-explorer__hint">
          Play: reaktan memudar → produk muncul · atur mol di panel kanan untuk stoikiometri
        </p>
      </div>

      <ReactionInfoPanel
        reaction={reaction}
        molesMap={molesMap}
        setMole={setMole}
        stoich={stoich}
      />
    </div>
  );
}

function defaultMoles(reaction: ChemicalReaction): Record<string, number> {
  const map: Record<string, number> = {};
  for (const r of reaction.reactants) {
    map[r.speciesId] = r.coefficient;
  }
  return map;
}

function ReactionInfoPanel({
  reaction,
  molesMap,
  setMole,
  stoich,
}: {
  reaction: ChemicalReaction;
  molesMap: Record<string, number>;
  setMole: (id: string, v: number) => void;
  stoich: ReturnType<typeof computeStoichiometry>;
}) {
  return (
    <aside className="sci-info" aria-label="Stoikiometri">
      <p className="sci-info__eyebrow">Kimia · Reaction Simulator</p>
      <h2>{reaction.title}</h2>
      <p
        className="sci-info__formula"
        dangerouslySetInnerHTML={{ __html: reaction.equationHtml }}
      />
      <p className="sci-info__summary">{reaction.summary}</p>

      <h3>Mol awal reaktan</h3>
      <div className="rxn-inputs">
        {reaction.reactants.map((r) => {
          const sp = REACTION_SPECIES[r.speciesId];
          return (
            <label key={r.speciesId}>
              <span dangerouslySetInnerHTML={{ __html: sp.formulaHtml }} />
              <input
                type="number"
                min={0}
                step={0.1}
                value={molesMap[r.speciesId] ?? 0}
                onChange={(e) => setMole(r.speciesId, Number(e.target.value))}
              />
              <em>mol</em>
            </label>
          );
        })}
      </div>

      {stoich ? (
        <>
          <h3>Hasil stoikiometri</h3>
          <p className="rxn-limiting">
            Reaktan pembatas:{" "}
            <strong
              dangerouslySetInnerHTML={{
                __html: REACTION_SPECIES[stoich.limitingSpeciesId].formulaHtml,
              }}
            />
          </p>
          <table className="rxn-table">
            <thead>
              <tr>
                <th>Spesies</th>
                <th>Koef.</th>
                <th>Mol</th>
                <th>Gram</th>
              </tr>
            </thead>
            <tbody>
              {stoich.lines.map((line) => {
                const sp = REACTION_SPECIES[line.speciesId];
                return (
                  <tr key={`${line.role}-${line.speciesId}`} className={line.isLimiting ? "is-limit" : undefined}>
                    <td>
                      <span dangerouslySetInnerHTML={{ __html: sp.formulaHtml }} />
                      <small>{line.role === "reactant" ? "reaktan" : "produk"}</small>
                    </td>
                    <td>{line.coefficient}</td>
                    <td>{fmt(line.moles)}</td>
                    <td>{fmt(line.grams)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      ) : (
        <p className="sci-info__pick">Masukkan mol &gt; 0 untuk menghitung.</p>
      )}

      <h3>Poin belajar</h3>
      <ul className="sci-info__points">
        {reaction.learningPoints.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>

      <p className="sci-info__source">
        <strong>Kondisi:</strong> {reaction.conditions}
        <br />
        <strong>Sumber:</strong> {reaction.source}
      </p>

      <div className="ptable__actions" style={{ padding: 0 }}>
        <Link className="btn btn-outline btn-sm" href="/belajar/kimia/molekul">
          Molecular Explorer
        </Link>
        <Link className="btn btn-outline btn-sm" href="/belajar">
          ← Hub
        </Link>
      </div>
    </aside>
  );
}

function fmt(n: number) {
  if (!Number.isFinite(n)) return "—";
  return n >= 100 ? n.toFixed(1) : n.toFixed(3).replace(/\.?0+$/, "");
}
