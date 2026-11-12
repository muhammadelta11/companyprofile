"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { submitPuzzleScore } from "@/app/actions";
import { loginHref } from "@/lib/access-policy";
import { SITE, waLink } from "@/data/site";
import {
  PUZZLE_IMAGE,
  PUZZLE_LEVELS,
  calcScore,
  calcStars,
  canMove,
  createSolved,
  getPuzzleLevel,
  isSolved,
  moveTile,
  shuffleSolvable,
  starsLabel,
  type PuzzleLevelId,
  type PuzzleMode,
} from "@/lib/puzzle";
import type { PuzzleScoreRow } from "@/lib/puzzle-scores";

const STREAK_KEY = "puzzle-streak-v1";

function readStreak() {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (!raw) return 0;
    const data = JSON.parse(raw) as { day?: string; count?: number };
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
    if (data.day === today) return data.count ?? 0;
    if (data.day === yesterday) return data.count ?? 0;
    return 0;
  } catch {
    return 0;
  }
}

function bumpStreak() {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const raw = localStorage.getItem(STREAK_KEY);
    const data = raw ? (JSON.parse(raw) as { day?: string; count?: number }) : {};
    if (data.day === today) return data.count ?? 1;
    const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
    const count = data.day === yesterday ? (data.count ?? 0) + 1 : 1;
    localStorage.setItem(STREAK_KEY, JSON.stringify({ day: today, count }));
    return count;
  } catch {
    return 1;
  }
}

type Props = {
  canSave: boolean;
  userName?: string | null;
  boards: Record<PuzzleLevelId, PuzzleScoreRow[]>;
};

type Phase = "pick" | "play" | "won";

export function SlidingPuzzle({ canSave, userName, boards }: Props) {
  const [levelId, setLevelId] = useState<PuzzleLevelId>("mudah");
  const [mode, setMode] = useState<PuzzleMode>("gambar");
  const [phase, setPhase] = useState<Phase>("pick");
  const [tiles, setTiles] = useState<number[]>(() => createSolved(3));
  const [moves, setMoves] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [hintLeft, setHintLeft] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [streak, setStreak] = useState(0);
  const [result, setResult] = useState<{
    stars: number;
    score: number;
    badge: string;
    title: string;
  } | null>(null);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const tickRef = useRef<number | null>(null);
  const level = useMemo(() => getPuzzleLevel(levelId), [levelId]);
  const blank = level.size * level.size - 1;

  useEffect(() => {
    setStreak(readStreak());
  }, []);

  useEffect(() => {
    if (phase !== "play") {
      if (tickRef.current) window.clearInterval(tickRef.current);
      tickRef.current = null;
      return;
    }
    tickRef.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
    };
  }, [phase]);

  const start = useCallback(
    (id: PuzzleLevelId) => {
      const lv = getPuzzleLevel(id);
      setLevelId(id);
      setTiles(shuffleSolvable(lv.size));
      setMoves(0);
      setSeconds(0);
      setResult(null);
      setSaveMsg(null);
      setHintLeft(id === "mudah" ? 1 : 0);
      setShowHint(false);
      setPhase("play");
    },
    []
  );

  async function persistScore(payload: {
    moves: number;
    seconds: number;
    stars: number;
    score: number;
    badge: string;
  }) {
    if (!canSave) {
      setSaveMsg("Mode tamu: skor tidak disimpan. Masuk agar masuk ranking.");
      return;
    }
    setSaving(true);
    setSaveMsg("Menyimpan skor…");
    const res = await submitPuzzleScore({
      level: levelId,
      size: level.size,
      moves: payload.moves,
      seconds: payload.seconds,
      stars: payload.stars,
      score: payload.score,
      badge: payload.badge,
      mode,
    });
    setSaving(false);
    if (res.error) setSaveMsg(res.error);
    else setSaveMsg("Skor tersimpan di papan peringkat mingguan.");
  }

  function onTile(index: number) {
    if (phase !== "play") return;
    const next = moveTile(tiles, level.size, index);
    if (!next) return;
    setTiles(next);
    setMoves((m) => m + 1);
    if (isSolved(next)) {
      const finalMoves = moves + 1;
      const finalSeconds = seconds;
      const stars = calcStars(level, finalSeconds);
      const streakNow = bumpStreak();
      setStreak(streakNow);
      const score = calcScore({
        level,
        seconds: finalSeconds,
        moves: finalMoves,
        stars,
        streakDays: streakNow,
      });
      setMoves(finalMoves);
      setResult({
        stars,
        score,
        badge: level.badge,
        title: level.title,
      });
      setPhase("won");
      void persistScore({
        moves: finalMoves,
        seconds: finalSeconds,
        stars,
        score,
        badge: level.badge,
      });
      return;
    }
  }

  function useHint() {
    if (hintLeft <= 0 || showHint) return;
    setHintLeft((n) => n - 1);
    setShowHint(true);
    window.setTimeout(() => setShowHint(false), 1200);
  }

  const boardStyle = {
    gridTemplateColumns: `repeat(${level.size}, 1fr)`,
  } as const;

  return (
    <div className="pz">
      {phase === "pick" ? (
        <section className="pz-pick">
          <header className="pz-pick__head">
            <p className="pz-pick__eyebrow">Game · Sliding Puzzle</p>
            <h1>Susun & rebut ranking</h1>
            <p>
              Pilih level. Tiap tingkat punya gelar, badge, dan bonus gamifikasi sendiri.
              {canSave
                ? ` Login sebagai ${userName || "member"} — skor otomatis tersimpan ke ranking.`
                : " Tanpa login boleh main, tapi skor tidak disimpan. Masuk dulu untuk ranking."}
            </p>
          </header>

          <div className="pz-mode">
            <span>Mode papan</span>
            <div className="pz-mode__btns">
              <button
                type="button"
                className={mode === "gambar" ? "is-active" : undefined}
                onClick={() => setMode("gambar")}
              >
                Gambar
              </button>
              <button
                type="button"
                className={mode === "angka" ? "is-active" : undefined}
                onClick={() => setMode("angka")}
              >
                Angka
              </button>
            </div>
          </div>

          <div className="pz-levels">
            {PUZZLE_LEVELS.map((lv) => (
              <article key={lv.id} className="pz-level" style={{ "--pz-accent": lv.accent } as React.CSSProperties}>
                <div className="pz-level__top">
                  <strong>{lv.label}</strong>
                  <span>
                    {lv.size}×{lv.size}
                  </span>
                </div>
                <h2>{lv.title}</h2>
                <p>{lv.blurb}</p>
                <ul>
                  {lv.perks.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
                <button type="button" className="btn btn-teal" onClick={() => start(lv.id)}>
                  Main {lv.label}
                </button>
              </article>
            ))}
          </div>

          <Leaderboards boards={boards} />
        </section>
      ) : null}

      {phase === "play" || phase === "won" ? (
        <section className="pz-play">
          <div className="pz-play__bar">
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setPhase("pick")}>
              Level
            </button>
            <div className="pz-play__meta">
              <span>{level.label}</span>
              <span>{moves} langkah</span>
              <span>{formatTime(seconds)}</span>
              {streak > 0 ? <span>Streak {streak}h</span> : null}
            </div>
            <div className="pz-play__tools">
              {level.id === "mudah" ? (
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={useHint}
                  disabled={hintLeft <= 0 || phase !== "play"}
                >
                  Hint ({hintLeft})
                </button>
              ) : null}
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => start(levelId)}
                disabled={phase === "won"}
              >
                Acak ulang
              </button>
            </div>
          </div>

          <div className="pz-play__stage">
            <div
              className={`pz-board pz-board--${mode}${showHint ? " is-hint" : ""}`}
              style={boardStyle}
              role="grid"
              aria-label={`Puzzle ${level.size} kali ${level.size}`}
            >
              {tiles.map((tile, index) => {
                const isBlank = tile === blank;
                const movable = phase === "play" && canMove(tiles, level.size, index);
                if (isBlank) {
                  return <div key={`b-${index}`} className="pz-tile is-blank" role="gridcell" />;
                }
                const r = Math.floor(tile / level.size);
                const c = tile % level.size;
                return (
                  <button
                    key={`${tile}-${index}`}
                    type="button"
                    role="gridcell"
                    className={`pz-tile${movable ? " is-move" : ""}`}
                    onClick={() => onTile(index)}
                    disabled={phase !== "play" || !movable}
                    style={
                      mode === "gambar"
                        ? {
                            backgroundImage: `url(${PUZZLE_IMAGE})`,
                            backgroundSize: `${level.size * 100}% ${level.size * 100}%`,
                            backgroundPosition: `${(c / (level.size - 1)) * 100}% ${(r / (level.size - 1)) * 100}%`,
                          }
                        : undefined
                    }
                  >
                    {mode === "angka" ? tile + 1 : <span className="sr-only">Potongan {tile + 1}</span>}
                  </button>
                );
              })}
            </div>

            {mode === "gambar" ? (
              <aside className="pz-ref" aria-hidden={false}>
                <p>Referensi</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={PUZZLE_IMAGE} alt="Gambar utuh sebagai referensi" />
                <small>{level.title}</small>
              </aside>
            ) : null}
          </div>

          {phase === "won" && result ? (
            <div className="pz-win">
              <p className="pz-win__eyebrow">Selesai</p>
              <h2>
                {result.title} · {starsLabel(result.stars)}
              </h2>
              <p>
                Skor <strong>{result.score}</strong> · {moves} langkah · {formatTime(seconds)}
                {streak > 1 ? ` · streak ${streak} hari` : ""}
              </p>
              <ul className="pz-win__perks">
                {level.perks.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
              <div className="pz-win__actions">
                {!canSave ? (
                  <Link className="btn btn-teal" href={loginHref("/game")}>
                    Masuk agar skor tersimpan
                  </Link>
                ) : null}
                <button type="button" className="btn btn-outline" onClick={() => start(levelId)}>
                  Main lagi
                </button>
                <a
                  className="btn btn-outline"
                  href={waLink(
                    `Aku dapat ${result.score} poin di Puzzle ${level.label} (${SITE.domain}/game). Coba kalahkan!`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Bagikan WA
                </a>
              </div>
              {saveMsg ? (
                <p className={`pz-win__msg${canSave ? "" : " is-guest"}`}>
                  {saving ? "Menyimpan skor…" : saveMsg}
                </p>
              ) : null}
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

function Leaderboards({ boards }: { boards: Record<PuzzleLevelId, PuzzleScoreRow[]> }) {
  return (
    <section className="pz-boards" aria-label="Papan peringkat mingguan">
      <h2>Ranking minggu ini</h2>
      <div className="pz-boards__grid">
        {PUZZLE_LEVELS.map((lv) => (
          <div key={lv.id} className="pz-board-card">
            <header>
              <strong>{lv.label}</strong>
              <span>{lv.title}</span>
            </header>
            {boards[lv.id]?.length ? (
              <ol>
                {boards[lv.id].map((row, i) => (
                  <li key={row.id}>
                    <span className="pz-board-card__rank">{i + 1}</span>
                    <div>
                      <strong>{row.player_name}</strong>
                      <small>
                        {starsLabel(row.stars)} · {row.moves} langkah · {formatTime(row.seconds)}
                      </small>
                    </div>
                    <em>{row.score}</em>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="pz-board-card__empty">Belum ada skor. Jadilah yang pertama.</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function formatTime(total: number) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
