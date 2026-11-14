"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { HEART_MODEL } from "@/lib/science/anatomy";
import {
  BASE_CYCLE_MS,
  CARDIAC_PHASES,
  PHYSIOLOGY_DISCLAIMER,
  PHYSIOLOGY_SOURCE,
  phaseAtProgress,
  type CardiacPhase,
} from "@/lib/science/physiology";

const ScienceViewer = dynamic(
  () => import("./ScienceViewer").then((m) => m.ScienceViewer),
  { ssr: false, loading: () => <div className="sci-viewer sci-viewer--loading">Memuat viewer 3D…</div> }
);

const AnatomyScene = dynamic(
  () => import("./AnatomyScene").then((m) => m.AnatomyScene),
  { ssr: false }
);

const SPEEDS = [0.5, 1, 1.5, 2] as const;

export function PhysiologyExplorer() {
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1);
  const [progress, setProgress] = useState(0);
  const [showLabels, setShowLabels] = useState(false);
  const [resetNonce, setResetNonce] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const progressRef = useRef(0);
  const lastTs = useRef<number | null>(null);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    if (!playing) {
      lastTs.current = null;
      return;
    }
    let raf = 0;
    const tick = (ts: number) => {
      if (lastTs.current == null) lastTs.current = ts;
      const dt = ts - lastTs.current;
      lastTs.current = ts;
      const cycleMs = BASE_CYCLE_MS / speed;
      progressRef.current = (progressRef.current + dt / cycleMs) % 1;
      setProgress(progressRef.current);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed]);

  const { phase, index } = useMemo(() => phaseAtProgress(progress), [progress]);
  const highlightIds = useMemo(() => {
    const set = new Set([...phase.activePartIds, ...phase.flowPartIds]);
    return [...set];
  }, [phase]);

  function jumpToPhase(i: number) {
    let acc = 0;
    for (let j = 0; j < i; j++) acc += CARDIAC_PHASES[j].weight;
    const next = acc + CARDIAC_PHASES[i].weight * 0.05;
    progressRef.current = next;
    setProgress(next);
  }

  function reset() {
    progressRef.current = 0;
    setProgress(0);
    lastTs.current = null;
    setResetNonce((n) => n + 1);
  }

  const bpm = Math.round((60_000 / BASE_CYCLE_MS) * speed);

  return (
    <div className="sci-explorer physio-explorer">
      <aside className="sci-explorer__side" aria-label="Fase siklus">
        <p className="sci-explorer__side-head">Fase siklus</p>
        <ul className="sci-explorer__list">
          {CARDIAC_PHASES.map((p, i) => (
            <li key={p.id}>
              <button
                type="button"
                className={i === index ? "is-active" : undefined}
                onClick={() => {
                  setPlaying(false);
                  jumpToPhase(i);
                }}
              >
                <strong>
                  {i + 1}. {p.name}
                </strong>
                <span>{Math.round(p.weight * 100)}% siklus</span>
              </button>
            </li>
          ))}
        </ul>
        <p className="sci-explorer__note">
          {PHYSIOLOGY_DISCLAIMER}
          <br />
          Model 3D: BodyParts3D © DBCLS · CC BY 4.0
        </p>
      </aside>

      <div className="sci-explorer__stage">
        <div className="sci-explorer__toolbar physio-toolbar" role="toolbar" aria-label="Kontrol simulasi">
          <div className="physio-transport">
            <button type="button" className="btn btn-teal btn-sm" onClick={() => setPlaying((v) => !v)}>
              {playing ? "Pause" : "Play"}
            </button>
            <button type="button" className="btn btn-outline btn-sm" onClick={reset}>
              Reset
            </button>
            <label className="sci-explorer__check">
              Kecepatan
              <select
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value) as (typeof SPEEDS)[number])}
              >
                {SPEEDS.map((s) => (
                  <option key={s} value={s}>
                    {s}×
                  </option>
                ))}
              </select>
            </label>
            <span className="physio-bpm">≈ {bpm} bpm</span>
          </div>
          <div className="sci-explorer__actions">
            <label className="sci-explorer__check">
              <input
                type="checkbox"
                checked={showLabels}
                onChange={(e) => setShowLabels(e.target.checked)}
              />
              Pin singkat
            </label>
          </div>
        </div>

        <div className="physio-timeline" aria-hidden>
          <div className="physio-timeline__track">
            {CARDIAC_PHASES.map((p, i) => (
              <span
                key={p.id}
                className={i === index ? "is-active" : undefined}
                style={{ flex: p.weight }}
              />
            ))}
            <i className="physio-timeline__playhead" style={{ left: `${progress * 100}%` }} />
          </div>
        </div>

        <ScienceViewer resetNonce={resetNonce}>
          <AnatomyScene
            model={HEART_MODEL}
            selectedId={selectedId}
            highlightIds={highlightIds}
            onSelect={setSelectedId}
            showLabels={showLabels}
            pulse={playing}
          />
        </ScienceViewer>

        <p className="sci-explorer__hint">
          Bagian menyala = aktif di fase ini · Play/Pause untuk animasi · klik fase di kiri untuk
          loncat
        </p>
      </div>

      <PhaseInfoPanel phase={phase} index={index} />
    </div>
  );
}

function PhaseInfoPanel({ phase, index }: { phase: CardiacPhase; index: number }) {
  return (
    <aside className="sci-info" aria-live="polite">
      <p className="sci-info__eyebrow">
        Kedokteran · Fisiologi · Fase {index + 1}/{CARDIAC_PHASES.length}
      </p>
      <h2>{phase.name}</h2>
      <p className="sci-info__summary">{phase.summary}</p>

      <h3>Poin belajar</h3>
      <ul className="sci-info__points">
        {phase.learningPoints.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>

      <dl className="sci-info__meta">
        <div>
          <dt>Aliran ditonjolkan</dt>
          <dd>{flowLabel(phase.flowKind)}</dd>
        </div>
        <div>
          <dt>Bagian aktif</dt>
          <dd>{phase.activePartIds.length}</dd>
        </div>
      </dl>

      <p className="sci-info__source">
        <strong>Sumber:</strong> {PHYSIOLOGY_SOURCE}
      </p>

      <div className="ptable__actions" style={{ padding: 0 }}>
        <Link className="btn btn-outline btn-sm" href="/belajar/kedokteran/anatomi">
          Anatomy Explorer
        </Link>
        <Link className="btn btn-outline btn-sm" href="/belajar/kedokteran">
          ← Hub kedokteran
        </Link>
      </div>
    </aside>
  );
}

function flowLabel(kind: CardiacPhase["flowKind"]) {
  switch (kind) {
    case "both":
      return "Sistemik + pulmonal";
    case "deoxygenated":
      return "Deoksigenasi";
    case "oxygenated":
      return "Beroksigen";
    default:
      return "Tidak ada ejeksi/isi";
  }
}
