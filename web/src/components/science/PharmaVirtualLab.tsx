"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  LAB_DISCLAIMER,
  LAB_EXPERIMENTS,
  LAB_INSTRUMENTS,
  LAB_SOURCE,
  concentrationFromAbsorbance,
} from "@/lib/science/pharma-lab";

export function PharmaVirtualLab() {
  const [experimentId, setExperimentId] = useState(LAB_EXPERIMENTS[0].id);
  const [instrumentId, setInstrumentId] = useState<string | null>("uvvis");
  const [A, setA] = useState(0.42);
  const [epsilon, setEpsilon] = useState(12500);
  const [path, setPath] = useState(1);

  const experiment = LAB_EXPERIMENTS.find((e) => e.id === experimentId) ?? LAB_EXPERIMENTS[0];
  const instrument = LAB_INSTRUMENTS.find((i) => i.id === instrumentId) ?? null;
  const conc = useMemo(
    () => concentrationFromAbsorbance(A, epsilon, path),
    [A, epsilon, path]
  );

  return (
    <div className="pvlab">
      <aside className="pvlab__side">
        <p className="sci-explorer__side-head">Alat laboratorium</p>
        <ul className="sci-explorer__list">
          {LAB_INSTRUMENTS.map((i) => (
            <li key={i.id}>
              <button
                type="button"
                className={instrumentId === i.id ? "is-active" : undefined}
                onClick={() => setInstrumentId(i.id)}
              >
                <strong>
                  {i.name}
                  {i.conceptual ? " · demo" : ""}
                </strong>
                <span>{i.summary}</span>
              </button>
            </li>
          ))}
        </ul>

        <p className="sci-explorer__side-head">Eksperimen</p>
        <ul className="sci-explorer__list">
          {LAB_EXPERIMENTS.map((e) => (
            <li key={e.id}>
              <button
                type="button"
                className={e.id === experiment.id ? "is-active" : undefined}
                onClick={() => setExperimentId(e.id)}
              >
                <strong>{e.title}</strong>
              </button>
            </li>
          ))}
        </ul>
        <p className="sci-explorer__note">{LAB_DISCLAIMER}</p>
      </aside>

      <section className="pvlab__main">
        {instrument ? (
          <article className="form-lab__card">
            <p className="sci-info__eyebrow">Alat terpilih</p>
            <h2>{instrument.name}</h2>
            <p>{instrument.summary}</p>
            <p>
              <strong>Pemakaian:</strong> {instrument.use}
            </p>
            {instrument.conceptual ? (
              <p className="pvlab__badge">Visualisasi konseptual — bukan instrumen terkalibrasi</p>
            ) : null}
          </article>
        ) : null}

        <article className="form-lab__card">
          <p className="sci-info__eyebrow">Praktikum</p>
          <h2>{experiment.title}</h2>
          <p>
            <strong>Tujuan:</strong> {experiment.objective}
          </p>
          <p>{experiment.theory}</p>
          <h3>Prosedur</h3>
          <ol className="pvlab__steps">
            {experiment.steps.map((s) => (
              <li key={s.title}>
                <strong>{s.title}</strong> — {s.text}
              </li>
            ))}
          </ol>
        </article>

        {experiment.kind === "beer-lambert" ? (
          <article className="form-lab__card">
            <h3>Kalkulator Beer–Lambert</h3>
            <p className="form-lab__eq">
              A = ε · c · ℓ → c = A / (ε · ℓ)
            </p>
            <label className="pk-field">
              <span>Absorbansi A</span>
              <input
                type="range"
                min={0.05}
                max={1.5}
                step={0.01}
                value={A}
                onChange={(e) => setA(Number(e.target.value))}
              />
              <input type="number" step={0.01} value={A} onChange={(e) => setA(Number(e.target.value))} />
            </label>
            <label className="pk-field">
              <span>
                ε <em>(L·mol⁻¹·cm⁻¹)</em>
              </span>
              <input
                type="range"
                min={1000}
                max={30000}
                step={100}
                value={epsilon}
                onChange={(e) => setEpsilon(Number(e.target.value))}
              />
              <input
                type="number"
                step={100}
                value={epsilon}
                onChange={(e) => setEpsilon(Number(e.target.value))}
              />
            </label>
            <label className="pk-field">
              <span>
                Path length ℓ <em>(cm)</em>
              </span>
              <input
                type="range"
                min={0.5}
                max={2}
                step={0.1}
                value={path}
                onChange={(e) => setPath(Number(e.target.value))}
              />
              <input
                type="number"
                step={0.1}
                value={path}
                onChange={(e) => setPath(Number(e.target.value))}
              />
            </label>
            <dl className="sci-info__meta">
              <div>
                <dt>Konsentrasi c</dt>
                <dd>{conc.toExponential(3)} mol/L</dd>
              </div>
              <div>
                <dt>c (mM)</dt>
                <dd>{(conc * 1000).toFixed(3)} mM</dd>
              </div>
            </dl>
          </article>
        ) : (
          <article className="form-lab__card">
            <h3>Kromatogram konseptual</h3>
            <HplcSketch />
            <p className="dash-muted">
              Puncak A (lebih awal) dan B (lebih lambat) hanya ilustrasi waktu retensi — bukan data
              instrumen nyata.
            </p>
          </article>
        )}

        <p className="sci-info__source">
          <strong>Sumber:</strong> {LAB_SOURCE}
        </p>
        <div className="ptable__actions" style={{ padding: 0 }}>
          <Link className="btn btn-outline btn-sm" href="/belajar/farmasi/formulasi">
            Formulation Lab
          </Link>
          <Link className="btn btn-outline btn-sm" href="/belajar/farmasi">
            ← Hub farmasi
          </Link>
        </div>
      </section>
    </div>
  );
}

function HplcSketch() {
  return (
    <svg className="form-chart" viewBox="0 0 560 160" role="img" aria-label="Kromatogram konseptual">
      <line x1="40" y1="20" x2="40" y2="130" stroke="#94a3b8" />
      <line x1="40" y1="130" x2="540" y2="130" stroke="#94a3b8" />
      <path
        d="M40 128 C 80 128, 100 40, 130 40 C 160 40, 170 128, 210 128 C 260 128, 300 70, 340 70 C 380 70, 400 128, 540 128"
        fill="none"
        stroke="#0f766e"
        strokeWidth="2.5"
      />
      <text x="120" y="28" fontSize="11" fill="#64748b" fontWeight="700">
        A
      </text>
      <text x="330" y="58" fontSize="11" fill="#64748b" fontWeight="700">
        B
      </text>
      <text x="280" y="152" fontSize="11" fill="#64748b" textAnchor="middle">
        waktu (menit)
      </text>
    </svg>
  );
}
