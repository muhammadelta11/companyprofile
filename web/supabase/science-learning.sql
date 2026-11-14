-- Interactive Science Learning & Virtual Lab (modular).
-- Jalankan di Supabase → SQL Editor setelah schema utama.
-- Tidak mengubah tabel users/profiles existing.

create table if not exists public.science_tracks (
  id text primary key check (id in ('chemistry', 'pharmacy', 'medicine')),
  title text not null,
  summary text,
  created_at timestamptz not null default now()
);

insert into public.science_tracks (id, title, summary) values
  ('chemistry', 'Chemistry Learning', 'Modul pembelajaran kimia interaktif 3D'),
  ('pharmacy', 'Pharmacy Learning', 'Modul pembelajaran farmasi & lab virtual'),
  ('medicine', 'Medicine Learning', 'Anatomi 3D, fisiologi edukatif, keterampilan klinis')
on conflict (id) do nothing;

-- Jika tabel sudah ada dari versi lama, longgarkan check constraint:
do $$
begin
  alter table public.science_tracks drop constraint if exists science_tracks_id_check;
  alter table public.science_tracks
    add constraint science_tracks_id_check
    check (id in ('chemistry', 'pharmacy', 'medicine'));
exception when others then
  null;
end $$;

create table if not exists public.science_modules (
  id uuid primary key default gen_random_uuid(),
  track_id text not null references public.science_tracks (id) on delete cascade,
  slug text not null unique,
  title text not null,
  summary text,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.science_assets (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('glb', 'gltf', 'sdf', 'mol', 'pdb', 'procedural')),
  title text not null,
  storage_path text,
  external_url text,
  license text,
  attribution text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.science_materials (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.science_modules (id) on delete cascade,
  slug text not null,
  title text not null,
  body text,
  asset_id uuid references public.science_assets (id) on delete set null,
  meta jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (module_id, slug)
);

create table if not exists public.science_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  material_id uuid not null references public.science_materials (id) on delete cascade,
  percent int not null default 0 check (percent between 0 and 100),
  last_payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (user_id, material_id)
);

create index if not exists science_modules_track_idx on public.science_modules (track_id, sort_order);
create index if not exists science_materials_module_idx on public.science_materials (module_id, sort_order);
create index if not exists science_progress_user_idx on public.science_progress (user_id, updated_at desc);

alter table public.science_tracks enable row level security;
alter table public.science_modules enable row level security;
alter table public.science_assets enable row level security;
alter table public.science_materials enable row level security;
alter table public.science_progress enable row level security;

drop policy if exists "science_tracks read" on public.science_tracks;
create policy "science_tracks read" on public.science_tracks for select using (true);

drop policy if exists "science_modules read published" on public.science_modules;
create policy "science_modules read published" on public.science_modules
  for select using (status = 'published' or public.is_admin());

drop policy if exists "science_modules admin write" on public.science_modules;
create policy "science_modules admin write" on public.science_modules
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "science_assets read" on public.science_assets;
create policy "science_assets read" on public.science_assets for select using (true);

drop policy if exists "science_assets admin write" on public.science_assets;
create policy "science_assets admin write" on public.science_assets
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "science_materials read published" on public.science_materials;
create policy "science_materials read published" on public.science_materials
  for select using (status = 'published' or public.is_admin());

drop policy if exists "science_materials admin write" on public.science_materials;
create policy "science_materials admin write" on public.science_materials
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "science_progress own" on public.science_progress;
create policy "science_progress own" on public.science_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "science_progress admin read" on public.science_progress;
create policy "science_progress admin read" on public.science_progress
  for select using (public.is_admin());
