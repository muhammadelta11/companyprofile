"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  HEART_AUSCULTATION,
  type ClinicalProcedure,
  type ClinicalQuizItem,
} from "@/lib/science/clinical-skills";

const ScienceViewer = dynamic(
  () => import("./ScienceViewer").then((m) => m.ScienceViewer),
  { ssr: false, loading: () => <div className="sci-viewer sci-viewer--loading">Memuat viewer 3D…</div> }
);

const AuscultationScene = dynamic(
  () => import("./AuscultationScene").then((m) => m.AuscultationScene),
  { ssr: false }
);

type Stage = "brief" | "lab" | "quiz" | "done";

export function ClinicalSkillsLab() {
  const procedure = HEART_AUSCULTATION;
  const [stage, setStage] = useState<Stage>("brief");
  const [stepIndex, setStepIndex] = useState(0);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [foundIds, setFoundIds] = useState<Set<string>>(new Set());
  const [selectedPoint, setSelectedPoint] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [misses, setMisses] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [resetNonce, setResetNonce] = useState(0);

  const step = procedure.steps[stepIndex];
  const isLastStep = stepIndex >= procedure.steps.length - 1;

  const quizScore = useMemo(() => {
    if (!quizSubmitted) return null;
    let ok = 0;
    for (const q of procedure.quiz) {
      if (quizAnswers[q.id] === q.correctIndex) ok += 1;
    }
    return { ok, total: procedure.quiz.length };
  }, [quizSubmitted, quizAnswers, procedure.quiz]);

  function onPickTool(id: string) {
    setSelectedTool(id);
    if (stage !== "lab" || !step?.expectToolId) return;
    if (id === step.expectToolId) {
      setFeedback("Benar — stetoskop siap dipakai.");
      advanceSoon();
    } else {
      setMisses((m) => m + 1);
      setFeedback("Alat itu belum diperlukan di langkah ini. Pilih stetoskop.");
    }
  }

  function onPickPoint(id: string) {
    setSelectedPoint(id);
    if (stage !== "lab" || !step) return;

    if (step.expectToolId && selectedTool !== step.expectToolId) {
      setFeedback("Ambil stetoskop dulu (langkah persiapan).");
      return;
    }

    if (!step.expectPointId) return;

    if (id === step.expectPointId) {
      setFoundIds((prev) => new Set(prev).add(id));
      setFeedback(`Benar — ${procedure.points.find((p) => p.id === id)?.name}.`);
      advanceSoon();
    } else {
      setMisses((m) => m + 1);
      setFeedback(`Belum tepat. ${step.hint}`);
    }
  }

  function advanceSoon() {
    window.setTimeout(() => {
      setFeedback(null);
      if (isLastStep) {
        setStage("quiz");
      } else {
        setStepIndex((i) => i + 1);
      }
    }, 650);
  }

  function continueReflect() {
    if (step?.expectPointId || step?.expectToolId) return;
    setFeedback(null);
    if (isLastStep) setStage("quiz");
    else setStepIndex((i) => i + 1);
  }

  function submitQuiz() {
    setQuizSubmitted(true);
    setStage("done");
  }

  function restart() {
    setStage("brief");
    setStepIndex(0);
    setSelectedTool(null);
    setFoundIds(new Set());
    setSelectedPoint(null);
    setFeedback(null);
    setMisses(0);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setResetNonce((n) => n + 1);
  }

  if (stage === "brief") {
    return <Briefing procedure={procedure} onStart={() => setStage("lab")} />;
  }

  if (stage === "quiz" || stage === "done") {
    return (
      <QuizPanel
        procedure={procedure}
        answers={quizAnswers}
        setAnswers={setQuizAnswers}
        submitted={quizSubmitted}
        score={quizScore}
        misses={misses}
        foundCount={foundIds.size}
        onSubmit={submitQuiz}
        onRestart={restart}
        done={stage === "done"}
      />
    );
  }

  return (
    <div className="sci-explorer skills-lab">
      <aside className="sci-explorer__side" aria-label="Langkah praktikum">
        <p className="sci-explorer__side-head">
          Langkah {stepIndex + 1}/{procedure.steps.length}
        </p>
        <ol className="skills-steps">
          {procedure.steps.map((s, i) => (
            <li key={s.id} className={i === stepIndex ? "is-active" : i < stepIndex ? "is-done" : undefined}>
              <strong>{s.title}</strong>
            </li>
          ))}
        </ol>

        <p className="sci-explorer__side-head" style={{ marginTop: "0.85rem" }}>
          Alat
        </p>
        <ul className="skills-tools">
          {procedure.tools.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                className={selectedTool === t.id ? "is-active" : undefined}
                onClick={() => onPickTool(t.id)}
              >
                <strong>{t.name}</strong>
                <span>{t.role}</span>
              </button>
            </li>
          ))}
        </ul>
        <p className="sci-explorer__note">{procedure.disclaimer}</p>
      </aside>

      <div className="sci-explorer__stage">
        <div className="skills-banner">
          <h2>{step.title}</h2>
          <p>{step.instruction}</p>
          {feedback ? <p className="skills-feedback">{feedback}</p> : null}
          {!step.expectPointId && !step.expectToolId ? (
            <button type="button" className="btn btn-teal btn-sm" onClick={continueReflect}>
              Lanjut ke kuis
            </button>
          ) : null}
        </div>

        <ScienceViewer resetNonce={resetNonce}>
          <AuscultationScene
            points={procedure.points}
            targetId={step.expectPointId ?? null}
            foundIds={foundIds}
            selectedId={selectedPoint}
            onSelect={onPickPoint}
          />
        </ScienceViewer>

        <p className="sci-explorer__hint">
          Titik biru = target langkah ini · hijau = sudah benar · klik bola pada dada skematik
        </p>
      </div>

      <aside className="sci-info" aria-label="Dasar teori langkah">
        <p className="sci-info__eyebrow">Kedokteran · Skills Lab</p>
        <h2>{step.title}</h2>
        {step.theory ? <p className="sci-info__summary">{step.theory}</p> : null}
        {step.expectPointId ? (
          <>
            <h3>Hint</h3>
            <p className="sci-info__pick">{step.hint}</p>
          </>
        ) : null}
        <dl className="sci-info__meta">
          <div>
            <dt>Titik benar</dt>
            <dd>
              {foundIds.size}/{procedure.points.length}
            </dd>
          </div>
          <div>
            <dt>Percobaan salah</dt>
            <dd>{misses}</dd>
          </div>
        </dl>
        <div className="ptable__actions" style={{ padding: 0 }}>
          <Link className="btn btn-outline btn-sm" href="/belajar/kedokteran/fisiologi">
            Physiology
          </Link>
          <Link className="btn btn-outline btn-sm" href="/belajar/kedokteran">
            ← Hub
          </Link>
        </div>
      </aside>
    </div>
  );
}

function Briefing({
  procedure,
  onStart,
}: {
  procedure: ClinicalProcedure;
  onStart: () => void;
}) {
  return (
    <div className="skills-brief">
      <section className="skills-brief__card">
        <p className="sci-info__eyebrow">{procedure.category}</p>
        <h2>{procedure.title}</h2>
        <p>{procedure.theory}</p>

        <h3>Tujuan</h3>
        <ul className="sci-info__points">
          {procedure.objectives.map((o) => (
            <li key={o}>{o}</li>
          ))}
        </ul>

        <h3>Alat &amp; bahan</h3>
        <ul className="sci-info__points">
          {procedure.tools.map((t) => (
            <li key={t.id}>
              <strong>{t.name}</strong> — {t.role}
            </li>
          ))}
        </ul>

        <p className="sci-info__source">
          <strong>Sumber:</strong> {procedure.source}
          <br />
          {procedure.disclaimer}
        </p>

        <button type="button" className="btn btn-teal" onClick={onStart}>
          Masuk laboratorium virtual
        </button>
      </section>
    </div>
  );
}

function QuizPanel({
  procedure,
  answers,
  setAnswers,
  submitted,
  score,
  misses,
  foundCount,
  onSubmit,
  onRestart,
  done,
}: {
  procedure: ClinicalProcedure;
  answers: Record<string, number>;
  setAnswers: (a: Record<string, number>) => void;
  submitted: boolean;
  score: { ok: number; total: number } | null;
  misses: number;
  foundCount: number;
  onSubmit: () => void;
  onRestart: () => void;
  done: boolean;
}) {
  const allAnswered = procedure.quiz.every((q) => answers[q.id] != null);

  return (
    <div className="skills-brief">
      <section className="skills-brief__card">
        <p className="sci-info__eyebrow">Evaluasi</p>
        <h2>{done ? "Hasil praktikum" : "Kuis singkat"}</h2>
        <p>
          Landmark benar: {foundCount}/{procedure.points.length} · Kesalahan klik: {misses}
        </p>

        {procedure.quiz.map((q) => (
          <QuizItem
            key={q.id}
            item={q}
            value={answers[q.id]}
            locked={submitted}
            onChange={(idx) => setAnswers({ ...answers, [q.id]: idx })}
          />
        ))}

        {score ? (
          <p className="skills-score">
            Skor kuis: <strong>{score.ok}/{score.total}</strong>
          </p>
        ) : null}

        <div className="ptable__actions" style={{ padding: 0, marginTop: "0.75rem" }}>
          {!submitted ? (
            <button
              type="button"
              className="btn btn-teal"
              disabled={!allAnswered}
              onClick={onSubmit}
            >
              Kirim jawaban
            </button>
          ) : (
            <button type="button" className="btn btn-teal" onClick={onRestart}>
              Ulangi praktikum
            </button>
          )}
          <Link className="btn btn-outline" href="/belajar/kedokteran">
            Selesai
          </Link>
        </div>
      </section>
    </div>
  );
}

function QuizItem({
  item,
  value,
  locked,
  onChange,
}: {
  item: ClinicalQuizItem;
  value?: number;
  locked: boolean;
  onChange: (idx: number) => void;
}) {
  return (
    <fieldset className="skills-quiz" disabled={locked}>
      <legend>{item.prompt}</legend>
      {item.choices.map((c, i) => {
        const correct = locked && i === item.correctIndex;
        const wrong = locked && value === i && i !== item.correctIndex;
        return (
          <label key={c} className={correct ? "is-correct" : wrong ? "is-wrong" : undefined}>
            <input
              type="radio"
              name={item.id}
              checked={value === i}
              onChange={() => onChange(i)}
            />
            {c}
          </label>
        );
      })}
      {locked ? <p className="skills-explain">{item.explain}</p> : null}
    </fieldset>
  );
}
