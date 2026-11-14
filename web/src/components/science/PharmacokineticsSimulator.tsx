"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ADME_PHASES,
  DEFAULT_PK,
  PK_DISCLAIMER,
  PK_SOURCE,
  admeEmphasis,
  aucTrapezoid,
  findCmaxTmax,
  formatNum,
  halfLifeHours,
  kelFrom,
  sampleCurve,
  type PkParams,
  type PkRoute,
} from "@/lib/science/pharmacokinetics";

const HOURS = 24;

export function PharmacokineticsSimulator() {
  const [params, setParams] = useState<PkParams>(DEFAULT_PK);
  const [cursorT, setCursorT] = useState(2);

  const points = useMemo(() => sampleCurve(params, HOURS, 160), [params]);
  const { cmax, tmax } = useMemo(() => findCmaxTmax(points), [points]);
  const auc = useMemo(() => aucTrapezoid(points), [points]);
  const kel = kelFrom(params);
  const tHalf = halfLifeHours(params);
  const activeAdme = admeEmphasis(params, cursorT, tmax);
  const cNow = useMemo(() => {
    const hit = points.reduce((best, p) =>
      Math.abs(p.t - cursorT) < Math.abs(best.t - cursorT) ? p : best
    );
    return hit.c;
  }, [points, cursorT]);

  function patch<K extends keyof PkParams>(key: K, value: PkParams[K]) {
    setParams((p) => ({ ...p, [key]: value }));
  }

  return (
    <div className="pk-sim">
      <section className="pk-sim__viz">
        <div className="pk-adme" role="list" aria-label="Fase ADME">
          {ADME_PHASES.map((phase) => {
            const on = activeAdme.includes(phase.id);
            return (
              <article
                key={phase.id}
                role="listitem"
                className={`pk-adme__card${on ? " is-active" : ""}`}
              >
                <span className="pk-adme__id">{phase.id}</span>
                <h3>{phase.title}</h3>
                <p>{phase.summary}</p>
              </article>
            );
          })}
        </div>

        <div className="pk-chart-wrap">
          <div className="pk-chart-head">
            <h2>Kurva konsentrasi–waktu</h2>
            <p>
              C(t) model 1-kompartemen · {params.route === "iv" ? "IV bolus" : "Oral orde-satu"}
            </p>
          </div>
          <PkChart
            points={points}
            cursorT={cursorT}
            cmax={cmax}
            tmax={tmax}
            onCursor={setCursorT}
          />
          <label className="pk-cursor">
            Waktu pengamatan: <strong>{formatNum(cursorT, 1)} jam</strong>
            <input
              type="range"
              min={0}
              max={HOURS}
              step={0.1}
              value={cursorT}
              onChange={(e) => setCursorT(Number(e.target.value))}
            />
            <span>
              C ≈ <strong>{formatNum(cNow)} mg/L</strong>
            </span>
          </label>
        </div>
      </section>

      <aside className="pk-sim__side sci-info">
        <p className="sci-info__eyebrow">Farmasi · Pharmacokinetics</p>
        <h2>Parameter model</h2>

        <div className="pk-route" role="group" aria-label="Rute">
          {(["oral", "iv"] as PkRoute[]).map((r) => (
            <button
              key={r}
              type="button"
              className={params.route === r ? "is-active" : undefined}
              onClick={() => patch("route", r)}
            >
              {r === "oral" ? "Oral" : "IV bolus"}
            </button>
          ))}
        </div>

        <div className="pk-fields">
          <Field
            label="Dosis"
            unit="mg"
            value={params.doseMg}
            min={10}
            max={2000}
            step={10}
            onChange={(v) => patch("doseMg", v)}
          />
          <Field
            label="Volume V"
            unit="L"
            value={params.volumeL}
            min={5}
            max={100}
            step={1}
            onChange={(v) => patch("volumeL", v)}
          />
          <Field
            label="Clearance Cl"
            unit="L/h"
            value={params.clearanceLh}
            min={0.5}
            max={30}
            step={0.5}
            onChange={(v) => patch("clearanceLh", v)}
          />
          {params.route === "oral" ? (
            <>
              <Field
                label="Bioavailabilitas F"
                unit=""
                value={params.bioavailability}
                min={0.1}
                max={1}
                step={0.05}
                onChange={(v) => patch("bioavailability", v)}
              />
              <Field
                label="ka (absorpsi)"
                unit="1/h"
                value={params.ka}
                min={0.1}
                max={5}
                step={0.1}
                onChange={(v) => patch("ka", v)}
              />
            </>
          ) : null}
        </div>

        <h3>Turunan model</h3>
        <dl className="sci-info__meta">
          <div>
            <dt>kel = Cl/V</dt>
            <dd>{formatNum(kel, 3)} /h</dd>
          </div>
          <div>
            <dt>t½</dt>
            <dd>{formatNum(tHalf, 2)} jam</dd>
          </div>
          <div>
            <dt>Cmax</dt>
            <dd>{formatNum(cmax)} mg/L</dd>
          </div>
          <div>
            <dt>Tmax</dt>
            <dd>{formatNum(tmax, 2)} jam</dd>
          </div>
          <div>
            <dt>AUC₀–{HOURS}</dt>
            <dd>{formatNum(auc, 1)} mg·h/L</dd>
          </div>
        </dl>

        <h3>Persamaan</h3>
        <p className="pk-eq">
          {params.route === "iv" ? (
            <>
              C(t) = (Dose / V) · e<sup>−kel·t</sup>
            </>
          ) : (
            <>
              C(t) = (F·Dose·ka) / (V·(ka−kel)) · (e<sup>−kel·t</sup> − e<sup>−ka·t</sup>)
            </>
          )}
        </p>

        <p className="sci-info__source">
          <strong>Sumber:</strong> {PK_SOURCE}
          <br />
          {PK_DISCLAIMER}
        </p>

        <div className="ptable__actions" style={{ padding: 0 }}>
          <Link className="btn btn-outline btn-sm" href="/belajar/kimia/molekul?id=c2h5oh">
            Contoh molekul (etanol)
          </Link>
          <Link className="btn btn-outline btn-sm" href="/belajar">
            ← Hub
          </Link>
        </div>
      </aside>
    </div>
  );
}

function Field({
  label,
  unit,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  unit: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="pk-field">
      <span>
        {label}
        {unit ? <em> ({unit})</em> : null}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

function PkChart({
  points,
  cursorT,
  cmax,
  tmax,
  onCursor,
}: {
  points: { t: number; c: number }[];
  cursorT: number;
  cmax: number;
  tmax: number;
  onCursor: (t: number) => void;
}) {
  const W = 640;
  const H = 280;
  const pad = { l: 48, r: 16, t: 16, b: 36 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const yMax = Math.max(cmax * 1.15, 0.01);

  const xScale = (t: number) => pad.l + (t / HOURS) * innerW;
  const yScale = (c: number) => pad.t + innerH - (c / yMax) * innerH;

  const d = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xScale(p.t).toFixed(1)} ${yScale(p.c).toFixed(1)}`)
    .join(" ");

  const cursorX = xScale(cursorT);
  const cAt = points.reduce((best, p) =>
    Math.abs(p.t - cursorT) < Math.abs(best.t - cursorT) ? p : best
  );

  return (
    <svg
      className="pk-chart"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="Grafik konsentrasi obat terhadap waktu"
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const t = ((x - pad.l * (rect.width / W)) / (innerW * (rect.width / W))) * HOURS;
        onCursor(Math.min(HOURS, Math.max(0, t)));
      }}
    >
      {/* grid */}
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <line
          key={f}
          x1={pad.l}
          x2={W - pad.r}
          y1={yScale(yMax * f)}
          y2={yScale(yMax * f)}
          className="pk-chart__grid"
        />
      ))}
      <line x1={pad.l} y1={pad.t} x2={pad.l} y2={H - pad.b} className="pk-chart__axis" />
      <line x1={pad.l} y1={H - pad.b} x2={W - pad.r} y2={H - pad.b} className="pk-chart__axis" />

      <path d={d} className="pk-chart__line" fill="none" />
      <circle cx={xScale(tmax)} cy={yScale(cmax)} r={4} className="pk-chart__cmax" />
      <line x1={cursorX} y1={pad.t} x2={cursorX} y2={H - pad.b} className="pk-chart__cursor" />
      <circle cx={cursorX} cy={yScale(cAt.c)} r={5} className="pk-chart__dot" />

      <text x={pad.l} y={14} className="pk-chart__label">
        C (mg/L)
      </text>
      <text x={W / 2} y={H - 8} textAnchor="middle" className="pk-chart__label">
        Waktu (jam)
      </text>
      <text x={xScale(0)} y={H - pad.b + 16} className="pk-chart__tick">
        0
      </text>
      <text x={xScale(12)} y={H - pad.b + 16} textAnchor="middle" className="pk-chart__tick">
        12
      </text>
      <text x={xScale(24)} y={H - pad.b + 16} textAnchor="end" className="pk-chart__tick">
        24
      </text>
    </svg>
  );
}
