import { connection } from "next/server";
import { publicClient } from "@/lib/supabase/public";
import { supabaseReady } from "@/lib/supabase/env";
import type { PuzzleLevelId } from "@/lib/puzzle";

export type PuzzleScoreRow = {
  id: string;
  user_id: string;
  player_name: string;
  level: PuzzleLevelId;
  size: number;
  moves: number;
  seconds: number;
  stars: number;
  score: number;
  badge: string | null;
  mode: string;
  created_at: string;
};

export async function getPuzzleLeaderboard(
  level: PuzzleLevelId,
  limit = 10
): Promise<PuzzleScoreRow[]> {
  await connection();
  if (!supabaseReady) return [];

  const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString();
  const { data, error } = await publicClient()
    .from("puzzle_scores")
    .select(
      "id, user_id, player_name, level, size, moves, seconds, stars, score, badge, mode, created_at"
    )
    .eq("level", level)
    .gte("created_at", weekAgo)
    .order("score", { ascending: false })
    .limit(80);

  if (error || !data) return [];

  const best = new Map<string, PuzzleScoreRow>();
  for (const row of data) {
    const uid = String(row.user_id);
    const mapped: PuzzleScoreRow = {
      id: String(row.id),
      user_id: uid,
      player_name: String(row.player_name || "Pemain").slice(0, 80),
      level: row.level as PuzzleLevelId,
      size: Number(row.size),
      moves: Number(row.moves),
      seconds: Number(row.seconds),
      stars: Number(row.stars),
      score: Number(row.score),
      badge: typeof row.badge === "string" ? row.badge : null,
      mode: String(row.mode ?? "gambar"),
      created_at: String(row.created_at ?? ""),
    };
    const prev = best.get(uid);
    if (!prev || mapped.score > prev.score) best.set(uid, mapped);
  }

  return [...best.values()]
    .sort((a, b) => b.score - a.score || a.seconds - b.seconds || a.moves - b.moves)
    .slice(0, limit);
}
