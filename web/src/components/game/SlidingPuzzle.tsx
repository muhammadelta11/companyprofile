"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { submitPuzzleScore } from "@/app/actions";
import { loginHref } from "@/lib/access-policy";
import { SITE, waLink } from "@/data/site";
import {
  PUZZLE_IMAGES,
  PUZZLE_IMAGE_THEMES,
  PUZZLE_LEVELS,
  calcScore,
  calcStars,
  canMove,
  createSolved,
  getPuzzleImage,
  getPuzzleLevel,
  isSolved,
  moveTile,
  pickRandomPuzzleImage,
  shuffleSolvable,
  starsLabel,
  type PuzzleImageTheme,
  type PuzzleLevelId,
  type PuzzleMode,
} from "@/lib/puzzle";
import {
  rankAmongScores,
  scoreBeats,
  type PuzzleScoreRow,
} from "@/lib/puzzle-scores";

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
  const [themeFilter, setThemeFilter] = useState<PuzzleImageTheme | "semua">("semua");
  const [imageId, setImageId] = useState(() => pickRandomPuzzleImage().id);
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
    rank: number;
    total: number;
    provisional: boolean;
  } | null>(null);
  const [liveBoards, setLiveBoards] = useState(boards);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [shareBusy, setShareBusy] = useState(false);
  const [shareHint, setShareHint] = useState<string | null>(null);
  const tickRef = useRef<number | null>(null);
  const level = useMemo(() => getPuzzleLevel(levelId), [levelId]);
  const puzzleImage = useMemo(() => getPuzzleImage(imageId), [imageId]);
  const gallery = useMemo(
    () =>
      themeFilter === "semua"
        ? PUZZLE_IMAGES
        : PUZZLE_IMAGES.filter((img) => img.theme === themeFilter),
    [themeFilter]
  );
  const blank = level.size * level.size - 1;
  const confettiBits = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        id: i,
        left: `${(i * 37) % 100}%`,
        delay: `${(i % 10) * 0.05}s`,
        duration: `${1.2 + (i % 6) * 0.15}s`,
        color: ["#f59e0b", "#14b8a6", "#3b82f6", "#ef4444", "#a855f7", "#22c55e"][i % 6],
        dx: `${((i % 7) - 3) * 18}px`,
      })),
    []
  );

  useEffect(() => {
    setStreak(readStreak());
  }, []);

  useEffect(() => {
    setLiveBoards(boards);
  }, [boards]);

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

  const start = useCallback((id: PuzzleLevelId, nextImageId?: string) => {
    const lv = getPuzzleLevel(id);
    if (nextImageId) setImageId(nextImageId);
    setLevelId(id);
    setTiles(shuffleSolvable(lv.size));
    setMoves(0);
    setSeconds(0);
    setResult(null);
    setSaveMsg(null);
    setShareHint(null);
    setCelebrate(false);
    setHintLeft(id === "mudah" ? 1 : 0);
    setShowHint(false);
    setPhase("play");
  }, []);

  function shuffleImage() {
    const next = pickRandomPuzzleImage(themeFilter);
    setImageId(next.id);
  }

  async function persistScore(payload: {
    moves: number;
    seconds: number;
    stars: number;
    score: number;
    badge: string;
  }) {
    if (!canSave) {
      setSaveMsg("Mode tamu: skor tidak disimpan. Masuk agar masuk ranking resmi.");
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
    if (res.error) {
      setSaveMsg(res.error);
      return;
    }
    if (res.rank && res.total) {
      setResult((prev) =>
        prev
          ? { ...prev, rank: res.rank!, total: res.total!, provisional: false }
          : prev
      );
      setSaveMsg(`Tersimpan · kamu di peringkat #${res.rank} dari ${res.total} minggu ini.`);
    } else {
      setSaveMsg("Skor tersimpan di papan peringkat mingguan.");
    }
    const meName = (userName || "Kamu").slice(0, 80);
    setLiveBoards((prev) => {
      const list = prev[levelId] ?? [];
      const mine: PuzzleScoreRow = {
        id: `local-${Date.now()}`,
        user_id: "me",
        player_name: meName,
        level: levelId,
        size: level.size,
        moves: payload.moves,
        seconds: payload.seconds,
        stars: payload.stars,
        score: payload.score,
        badge: payload.badge,
        mode,
        created_at: new Date().toISOString(),
      };
      const withoutMe = list.filter(
        (r) => r.player_name.toLowerCase() !== meName.toLowerCase() && r.user_id !== "me"
      );
      const next = [...withoutMe, mine]
        .sort((a, b) =>
          scoreBeats(a, b) ? -1 : scoreBeats(b, a) ? 1 : 0
        )
        .slice(0, 10);
      return { ...prev, [levelId]: next };
    });
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
      const placed = rankAmongScores(liveBoards[levelId] ?? [], {
        score,
        seconds: finalSeconds,
        moves: finalMoves,
      });
      setMoves(finalMoves);
      setResult({
        stars,
        score,
        badge: level.badge,
        title: level.title,
        rank: placed.rank,
        total: placed.total,
        provisional: true,
      });
      setCelebrate(true);
      setPhase("won");
      window.setTimeout(() => setCelebrate(false), 1700);
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

  function shareText(score: number, stars: number) {
    const rankLine =
      result?.rank != null
        ? `Peringkat #${result.rank} dari ${result.total} (minggu ini)`
        : null;
    return [
      `Selesai Puzzle ${level.label} ${starsLabel(stars)}`,
      `Skor ${score} · ${moves} langkah · ${formatTime(seconds)}`,
      rankLine,
      mode === "gambar" ? `Gambar: ${puzzleImage.label}` : "Mode angka",
      `Main juga di https://${SITE.domain}/game`,
    ]
      .filter(Boolean)
      .join("\n");
  }

  async function makeShareCard(score: number, stars: number) {
    const size = 1080;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas tidak tersedia.");

    const grad = ctx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, "#0f766e");
    grad.addColorStop(0.55, "#1d4ed8");
    grad.addColorStop(1, "#b45309");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    const frame = 72;
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.fillRect(frame - 18, frame - 18, size - (frame - 18) * 2, size - (frame - 18) * 2);

    if (mode === "gambar") {
      const img = await loadImage(puzzleImage.src);
      ctx.save();
      roundRect(ctx, frame, frame, size - frame * 2, size - frame * 2, 28);
      ctx.clip();
      ctx.drawImage(img, frame, frame, size - frame * 2, size - frame * 2);
      ctx.restore();
    } else {
      ctx.fillStyle = "#f8fafc";
      roundRect(ctx, frame, frame, size - frame * 2, size - frame * 2, 28);
      ctx.fill();
      ctx.fillStyle = "#0f766e";
      ctx.font = "bold 120px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`${level.size}×${level.size}`, size / 2, size / 2 + 40);
    }

    ctx.fillStyle = "rgba(15, 23, 42, 0.72)";
    roundRect(ctx, 70, size - 290, size - 140, 200, 28);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.textAlign = "left";
    ctx.font = "bold 42px system-ui, sans-serif";
    ctx.fillText("Puzzle selesai!", 110, size - 220);
    ctx.font = "600 36px system-ui, sans-serif";
    ctx.fillText(`${level.title} · ${starsLabel(stars)}`, 110, size - 165);
    ctx.font = "500 30px system-ui, sans-serif";
    const rankBit =
      result?.rank != null ? ` · #${result.rank}/${result.total}` : "";
    ctx.fillText(
      `Skor ${score} · ${moves} langkah · ${formatTime(seconds)}${rankBit}`,
      110,
      size - 118
    );
    ctx.font = "600 28px system-ui, sans-serif";
    ctx.fillText(SITE.domain + "/game", 110, size - 72);

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Gagal buat gambar."))), "image/jpeg", 0.92);
    });
  }

  async function shareStoryWa() {
    if (!result) return;
    setShareBusy(true);
    setShareHint(null);
    const text = shareText(result.score, result.stars);
    try {
      const blob = await makeShareCard(result.score, result.stars);
      const file = new File([blob], "puzzle-selesai.jpg", { type: "image/jpeg" });
      const nav = navigator as Navigator & {
        canShare?: (data?: ShareData) => boolean;
        share?: (data: ShareData) => Promise<void>;
      };
      if (nav.share && nav.canShare?.({ files: [file] })) {
        await nav.share({
          files: [file],
          title: "Puzzle selesai!",
          text,
        });
        setShareHint("Pilih WhatsApp → Status untuk story.");
      } else if (nav.share) {
        await nav.share({ title: "Puzzle selesai!", text, url: `https://${SITE.domain}/game` });
        setShareHint("Teks dibagikan. Di WA pilih Status bila tersedia.");
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "puzzle-selesai.jpg";
        a.click();
        URL.revokeObjectURL(url);
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          /* ignore */
        }
        setShareHint("Gambar diunduh + teks disalin. Unggah ke Status WA.");
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setShareHint(null);
      } else {
        window.open(waLink(text), "_blank", "noopener,noreferrer");
        setShareHint("Dibuka di chat WA. Tempel ke Status bila mau.");
      }
    } finally {
      setShareBusy(false);
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
            <p className="pz-pick__eyebrow">Game</p>
            <h1>Puzzle</h1>
            <p>Geser kotak sampai rapi. Pilih level, lalu main.</p>
          </header>

          <div className="pz-arena" aria-label="Pratinjau papan">
            {mode === "gambar" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={puzzleImage.src} alt={puzzleImage.label} className="pz-arena__art" />
            ) : (
              <div className="pz-arena__numbers" aria-hidden="true">
                {Array.from({ length: 9 }, (_, i) => (
                  <span key={i} className={i === 8 ? "is-blank" : undefined}>
                    {i === 8 ? "" : i + 1}
                  </span>
                ))}
              </div>
            )}
            <div className="pz-arena__fade" aria-hidden="true" />
            <div className="pz-arena__caption">
              <strong>{mode === "gambar" ? puzzleImage.label : "Mode angka"}</strong>
              <span>{canSave ? "Skor masuk ranking" : "Tamu · skor tidak disimpan"}</span>
            </div>
          </div>

          <div className="pz-seg" role="group" aria-label="Mode papan">
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

          {mode === "gambar" ? (
            <div className="pz-strip">
              <div className="pz-strip__row" role="list">
                {gallery.map((img) => (
                  <button
                    key={img.id}
                    type="button"
                    role="listitem"
                    className={`pz-strip__item${imageId === img.id ? " is-active" : ""}`}
                    onClick={() => setImageId(img.id)}
                    aria-pressed={imageId === img.id}
                    title={img.label}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.src} alt="" loading="lazy" />
                  </button>
                ))}
              </div>
              <div className="pz-strip__tools">
                <div className="pz-strip__themes" role="tablist" aria-label="Tema">
                  <button
                    type="button"
                    className={themeFilter === "semua" ? "is-active" : undefined}
                    onClick={() => setThemeFilter("semua")}
                  >
                    Semua
                  </button>
                  {PUZZLE_IMAGE_THEMES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className={themeFilter === t.id ? "is-active" : undefined}
                      onClick={() => setThemeFilter(t.id)}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                <button type="button" className="pz-chip" onClick={shuffleImage}>
                  Acak
                </button>
              </div>
            </div>
          ) : null}

          <div className="pz-levels" role="list">
            {PUZZLE_LEVELS.map((lv) => (
              <button
                key={lv.id}
                type="button"
                role="listitem"
                className="pz-level"
                style={{ "--pz-accent": lv.accent } as React.CSSProperties}
                onClick={() => start(lv.id)}
              >
                <span className="pz-level__grid">{lv.size}×{lv.size}</span>
                <span className="pz-level__copy">
                  <strong>{lv.label}</strong>
                  <small>{lv.blurb}</small>
                </span>
                <span className="pz-level__go">Main</span>
              </button>
            ))}
          </div>

          {!canSave ? (
            <p className="pz-guest">
              Main bebas tanpa akun.{" "}
              <Link href={loginHref("/game")}>Masuk</Link> kalau mau masuk ranking.
            </p>
          ) : null}

          <Leaderboards boards={liveBoards} />
        </section>
      ) : null}

      {phase === "play" || phase === "won" ? (
        <section className="pz-play">
          <div className="pz-hud">
            <button type="button" className="pz-hud__back" onClick={() => setPhase("pick")} aria-label="Kembali">
              ←
            </button>
            <div className="pz-hud__stats">
              <span>
                <em>Level</em>
                {level.label}
              </span>
              <span>
                <em>Langkah</em>
                {moves}
              </span>
              <span>
                <em>Waktu</em>
                {formatTime(seconds)}
              </span>
            </div>
            <div className="pz-hud__tools">
              {level.id === "mudah" ? (
                <button
                  type="button"
                  onClick={useHint}
                  disabled={hintLeft <= 0 || phase !== "play"}
                  title="Hint"
                >
                  Hint
                </button>
              ) : null}
              <button type="button" onClick={() => start(levelId)} disabled={phase === "won"} title="Acak ulang">
                Acak
              </button>
              {mode === "gambar" ? (
                <button
                  type="button"
                  onClick={() => start(levelId, pickRandomPuzzleImage(themeFilter).id)}
                  disabled={phase === "won"}
                  title="Ganti gambar"
                >
                  Gambar
                </button>
              ) : null}
            </div>
          </div>

          <div className="pz-play__stage">
            <div
              className={`pz-board pz-board--${mode}${showHint ? " is-hint" : ""}${phase === "won" ? " is-solved" : ""}`}
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
                            backgroundImage: `url(${puzzleImage.src})`,
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
              {mode === "gambar" ? (
                <div
                  className="pz-board__complete"
                  style={{ backgroundImage: `url(${puzzleImage.src})` }}
                  aria-hidden="true"
                />
              ) : null}
              {celebrate ? (
                <>
                  <div className="pz-board__burst" aria-live="polite">
                    <strong>Berhasil!</strong>
                  </div>
                  <div className="pz-confetti" aria-hidden="true">
                    {confettiBits.map((bit) => (
                      <i
                        key={bit.id}
                        style={
                          {
                            left: bit.left,
                            background: bit.color,
                            animationDelay: bit.delay,
                            animationDuration: bit.duration,
                            "--dx": bit.dx,
                          } as React.CSSProperties
                        }
                      />
                    ))}
                  </div>
                </>
              ) : null}
            </div>

            {mode === "gambar" ? (
              <aside className="pz-ref" aria-hidden={false}>
                <p>Referensi</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={puzzleImage.src} alt={`${puzzleImage.label} — referensi`} />
                <small>
                  {puzzleImage.label} · {level.title}
                </small>
              </aside>
            ) : null}
          </div>

          {phase === "won" && result ? (
            <div className="pz-win">
              <div className="pz-win__stars" aria-label={`${result.stars} bintang`}>
                {starsLabel(result.stars)}
              </div>
              <h2>Selesai!</h2>
              <p className="pz-win__score">
                <strong>{result.score}</strong>
                <span>
                  {moves} langkah · {formatTime(seconds)}
                  {streak > 1 ? ` · streak ${streak}h` : ""}
                </span>
              </p>

              <div className="pz-win__rank" aria-live="polite">
                <strong>#{result.rank}</strong>
                <div>
                  <span>Ranking minggu ini</span>
                  <small>
                    {result.total} pemain · {level.label}
                    {!canSave ? " · belum tersimpan" : result.provisional ? " · menyimpan…" : ""}
                  </small>
                </div>
              </div>

              <WinRankList
                rows={liveBoards[levelId] ?? []}
                me={{
                  name: userName || "Kamu",
                  score: result.score,
                  seconds,
                  moves,
                  stars: result.stars,
                  rank: result.rank,
                }}
              />

              <div className="pz-win__actions">
                <button
                  type="button"
                  className="btn btn-teal"
                  onClick={() => start(levelId)}
                >
                  Main lagi
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => void shareStoryWa()}
                  disabled={shareBusy}
                >
                  {shareBusy ? "Menyiapkan…" : "Share WA"}
                </button>
                {!canSave ? (
                  <Link className="btn btn-outline" href={loginHref("/game")}>
                    Masuk · simpan skor
                  </Link>
                ) : (
                  <a
                    className="btn btn-outline"
                    href={waLink(shareText(result.score, result.stars))}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Chat WA
                  </a>
                )}
              </div>
              {shareHint ? <p className="pz-win__hint">{shareHint}</p> : null}
              {saveMsg ? (
                <p className={`pz-win__msg${canSave ? "" : " is-guest"}`}>
                  {saving ? "Menyimpan skor…" : saveMsg}
                </p>
              ) : null}
            </div>
          ) : null}

          {phase === "won" ? (
            <Leaderboards boards={liveBoards} focusLevel={levelId} highlightName={userName} />
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

function WinRankList({
  rows,
  me,
}: {
  rows: PuzzleScoreRow[];
  me: {
    name: string;
    score: number;
    seconds: number;
    moves: number;
    stars: number;
    rank: number;
  };
}) {
  const entries = useMemo(() => {
    const others = rows.filter(
      (r) => r.player_name.toLowerCase() !== me.name.toLowerCase() && r.user_id !== "me"
    );
    const mine: PuzzleScoreRow = {
      id: "me-now",
      user_id: "me",
      player_name: me.name || "Kamu",
      level: "mudah",
      size: 3,
      moves: me.moves,
      seconds: me.seconds,
      stars: me.stars,
      score: me.score,
      badge: null,
      mode: "gambar",
      created_at: "",
    };
    const ranked = [...others, mine]
      .sort((a, b) => (scoreBeats(a, b) ? -1 : scoreBeats(b, a) ? 1 : 0))
      .map((row, i) => ({ row, rank: i + 1 }));
    const top = ranked.slice(0, 5);
    const meEntry = ranked.find((x) => x.row.user_id === "me");
    if (meEntry && !top.some((x) => x.row.user_id === "me")) {
      return [...top.slice(0, 4), meEntry];
    }
    return top;
  }, [rows, me]);

  return (
    <ol className="pz-win__board" aria-label="Cuplikan ranking">
      {entries.map(({ row, rank }) => {
        const isMe = row.user_id === "me";
        return (
          <li key={row.id} className={isMe ? "is-me" : undefined}>
            <span>#{isMe ? me.rank : rank}</span>
            <div>
              <strong>{isMe ? `${row.player_name} (kamu)` : row.player_name}</strong>
              <small>
                {starsLabel(row.stars)} · {row.moves} langkah · {formatTime(row.seconds)}
              </small>
            </div>
            <em>{row.score}</em>
          </li>
        );
      })}
    </ol>
  );
}

function Leaderboards({
  boards,
  focusLevel,
  highlightName,
}: {
  boards: Record<PuzzleLevelId, PuzzleScoreRow[]>;
  focusLevel?: PuzzleLevelId;
  highlightName?: string | null;
}) {
  const levels = focusLevel
    ? PUZZLE_LEVELS.filter((lv) => lv.id === focusLevel)
    : PUZZLE_LEVELS;
  const me = (highlightName || "").trim().toLowerCase();

  return (
    <section className="pz-boards" aria-label="Papan peringkat mingguan">
      <h2>{focusLevel ? "Ranking" : "Top minggu ini"}</h2>
      <div className={`pz-boards__grid${focusLevel ? " is-focus" : ""}`}>
        {levels.map((lv) => (
          <div key={lv.id} className="pz-board-card">
            <header>
              <strong>{lv.label}</strong>
              <span>
                {lv.size}×{lv.size}
              </span>
            </header>
            {boards[lv.id]?.length ? (
              <ol>
                {boards[lv.id].map((row, i) => {
                  const mine = me && row.player_name.toLowerCase() === me;
                  return (
                    <li key={row.id} className={mine ? "is-me" : undefined}>
                      <span className="pz-board-card__rank">{i + 1}</span>
                      <div>
                        <strong>
                          {row.player_name}
                          {mine ? " (kamu)" : ""}
                        </strong>
                        <small>
                          {starsLabel(row.stars)} · {row.moves} langkah · {formatTime(row.seconds)}
                        </small>
                      </div>
                      <em>{row.score}</em>
                    </li>
                  );
                })}
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

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Gambar gagal dimuat."));
    img.src = src;
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}
