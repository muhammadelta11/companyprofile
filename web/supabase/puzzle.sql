-- Puzzle sliding + leaderboard. Jalankan sekali di Supabase → SQL Editor.

create table if not exists public.puzzle_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  player_name text not null,
  level text not null check (level in ('mudah', 'sedang', 'sulit')),
  size int not null check (size in (3, 4, 5)),
  moves int not null check (moves >= 0),
  seconds int not null check (seconds >= 0),
  stars int not null check (stars between 1 and 3),
  score int not null check (score >= 0),
  badge text,
  mode text not null default 'gambar' check (mode in ('gambar', 'angka')),
  created_at timestamptz not null default now()
);

create index if not exists puzzle_scores_level_score_idx
  on public.puzzle_scores (level, score desc, created_at asc);

create index if not exists puzzle_scores_user_level_idx
  on public.puzzle_scores (user_id, level, score desc);

alter table public.puzzle_scores enable row level security;

drop policy if exists "puzzle_scores read" on public.puzzle_scores;
create policy "puzzle_scores read" on public.puzzle_scores
  for select using (true);

drop policy if exists "puzzle_scores insert" on public.puzzle_scores;
create policy "puzzle_scores insert" on public.puzzle_scores
  for insert with check (
    auth.uid() = user_id
    and char_length(btrim(player_name)) between 1 and 80
  );
