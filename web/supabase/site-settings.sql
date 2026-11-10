-- Setting situs (gambar header menu, dll). Jalankan sekali di Supabase → SQL Editor.

create table if not exists public.site_settings (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;

drop policy if exists "site_settings public read" on public.site_settings;
create policy "site_settings public read" on public.site_settings
  for select using (true);

drop policy if exists "site_settings admin write" on public.site_settings;
create policy "site_settings admin write" on public.site_settings
  for all using (public.is_admin()) with check (public.is_admin());

-- Kunci hero: hero_layanan, hero_market, hero_wisata, hero_proyek, hero_tentang, hero_gabung
