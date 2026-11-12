import { Suspense } from "react";
import { AppPage } from "@/components/AppPage";
import { AppPageFallback } from "@/components/AppPageFallback";
import { SlidingPuzzle } from "@/components/game/SlidingPuzzle";
import { getCurrentUser } from "@/lib/auth";
import { PUZZLE_LEVELS, type PuzzleLevelId } from "@/lib/puzzle";
import { getPuzzleLeaderboard, type PuzzleScoreRow } from "@/lib/puzzle-scores";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata() {
  return pageMetadata({
    title: "Game Puzzle",
    description:
      "Geser kotak sampai gambar utuh. Pilih mudah, sedang, atau sulit — rebut ranking mingguan.",
    path: "/game",
  });
}

export default function GamePage() {
  return (
    <Suspense fallback={<AppPageFallback />}>
      <GameContent />
    </Suspense>
  );
}

async function GameContent() {
  const user = await getCurrentUser();
  const canSave = Boolean(user && user.status !== "suspended");

  const entries = await Promise.all(
    PUZZLE_LEVELS.map(async (lv) => [lv.id, await getPuzzleLeaderboard(lv.id)] as const)
  );
  const boards = Object.fromEntries(entries) as Record<PuzzleLevelId, PuzzleScoreRow[]>;

  return (
    <AppPage>
      <div className="apage-body">
        <SlidingPuzzle
          canSave={canSave}
          userName={user?.shop_name || user?.name}
          boards={boards}
        />
      </div>
    </AppPage>
  );
}
