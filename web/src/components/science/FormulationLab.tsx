"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  DOSAGE_FORMS,
  EXCIPIENTS,
  FORM_DISCLAIMER,
  FORM_SOURCE,
  FORM_STEPS,
  estimateHardness,
  sampleDissolution,
} from "@/lib/science/formulation";

export function FormulationLab() {
  const [stepId, setStepId] = useState(FORM_STEPS[0].id);
  const [force, setForce] = useState(12);
  const [moisture, setMoisture] = useState(3);
  const [kDiss, setKDiss] = useState(0.18);

  const step = FORM_STEPS.find((s) => s.id === stepId) ?? FORM_STEPS[0];
  const hardness = estimateHardness(force, moisture);
  const curve = useMemo(
    () => sampleDissolution(kDiss, hardness, 45, 50),
    [kDiss, hardness]
  );
  const q30 = curve.find((p) => Math.abs(p.t - 30) < 0.5)?.q ?? 0;

  return (
    <div className="form-lab">
      <aside className="form-lab__side">
        <p className="sci-explorer__side-head">Sediaan</p>
        <ul className="form-lab__forms">
          {DOSAGE_FORMS.map((f) => (
            <li key={f.id} className={f.id === "tablet" ? "is-focus" : undefined}>
              <strong>{f.name}</strong>
              <span>{f.summary}</span>
            </li>
          ))}
        </ul>

        <p className="sci-explorer__side-head">Tahap proses</p>
        <ul className="sci-explorer__list">
          {FORM_STEPS.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                className={s.id === step.id ? "is-active" : undefined}
                onClick={() => setStepId(s.id)}
              >
                <strong>{s.title}</strong>
              </button>
            </li>
          ))}
        </ul>
        <p className="sci-explorer__note">{FORM_DISCLAIMER}</p>
      </aside>

      <section className="form-lab__main">
        <header className="form-lab__hero">
          <h2>{step.title}</h2>
          <p>{step.summary}</p>
        </header>

        <div className="form-lab__grid">
          <article className="form-lab__card">
            <h3>Eksipien &amp; peran</h3>
            <ul className="form-lab__exc">
              {EXCIPIENTS.map((e) => (
                <li key={e.id}>
                  <strong>{e.name}</strong>
                  <span>{e.role}</span>
                  <em>{e.typicalPct}</em>
                </li>
              ))}
            </ul>
          </article>

          <article className="form-lab__card">
            <h3>Parameter tahap</h3>
            <label className="pk-field">
              <span>
                Gaya kompresi <em>(kN)</em>
              </span>
              <input
                type="range"
                min={5}
                max={25}
                step={1}
                value={force}
                onChange={(e) => setForce(Number(e.target.value))}
              />
              <input type="number" value={force} onChange={(e) => setForce(Number(e.target.value))} />
            </label>
            <label className="pk-field">
              <span>
                Kadar air residual <em>(%)</em>
              </span>
              <input
                type="range"
                min={1}
                max={8}
                step={0.5}
                value={moisture}
                onChange={(e) => setMoisture(Number(e.target.value))}
              />
              <input
                type="number"
                value={moisture}
                step={0.5}
                onChange={(e) => setMoisture(Number(e.target.value))}
              />
            </label>
            <label className="pk-field">
              <span>
                k disolusi <em>(1/menit)</em>
              </span>
              <input
                type="range"
                min={0.05}
                max={0.45}
                step={0.01}
                value={kDiss}
                onChange={(e) => setKDiss(Number(e.target.value))}
              />
              <input
                type="number"
                value={kDiss}
                step={0.01}
                onChange={(e) => setKDiss(Number(e.target.value))}
              />
            </label>
            <dl className="sci-info__meta">
              <div>
                <dt>Hardness (estimasi)</dt>
                <dd>{hardness.toFixed(1)} kp</dd>
              </div>
              <div>
                <dt>Q₃₀ (disolusi)</dt>
                <dd>{q30.toFixed(1)} %</dd>
              </div>
            </dl>
          </article>
        </div>

        <article className="form-lab__card">
          <h3>Kurva disolusi edukatif</h3>
          <p className="form-lab__eq">Q(t) = 100 · (1 − e<sup>−k_eff·t</sup>) · k_eff dipengaruhi hardness</p>
          <DissolutionChart points={curve} />
          <ul className="sci-info__points">
            {step.learningPoints.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </article>

        <p className="sci-info__source">
          <strong>Sumber:</strong> {FORM_SOURCE}
        </p>
        <div className="ptable__actions" style={{ padding: 0 }}>
          <Link className="btn btn-outline btn-sm" href="/belajar/farmasi/lab-virtual">
            Virtual Lab
          </Link>
          <Link className="btn btn-outline btn-sm" href="/belajar/farmasi">
            ← Hub farmasi
          </Link>
        </div>
      </section>
    </div>
  );
}

function DissolutionChart({ points }: { points: { t: number; q: number }[] }) {
  const W = 560;
  const H = 200;
  const pad = { l: 40, r: 12, t: 12, b: 28 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const x = (t: number) => pad.l + (t / 45) * innerW;
  const y = (q: number) => pad.t + innerH - (q / 100) * innerH;
  const d = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${x(p.t).toFixed(1)} ${y(p.q).toFixed(1)}`)
    .join(" ");

  return (
    <svg className="form-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Kurva disolusi">
      <line x1={pad.l} y1={pad.t} x2={pad.l} y2={H - pad.b} className="pk-chart__axis" />
      <line x1={pad.l} y1={H - pad.b} x2={W - pad.r} y2={H - pad.b} className="pk-chart__axis" />
      <path d={d} className="pk-chart__line" fill="none" />
      <text x={pad.l} y={12} className="pk-chart__label">
        Q (%)
      </text>
      <text x={W / 2} y={H - 4} textAnchor="middle" className="pk-chart__label">
        Waktu (menit)
      </text>
    </svg>
  );
}
