-- Jalankan di SQL Editor Supabase jika tabel services belum ada.
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  blurb text,
  items text[] not null default '{}',
  accent text not null default 'teal' check (accent in ('teal', 'orange', 'ink')),
  published boolean not null default true,
  sort int not null default 100,
  created_at timestamptz not null default now()
);

alter table public.services enable row level security;
drop policy if exists "services read" on public.services;
create policy "services read" on public.services for select using (published or public.is_admin());
drop policy if exists "services admin" on public.services;
create policy "services admin" on public.services for all using (public.is_admin()) with check (public.is_admin());

insert into public.services (title, blurb, items, accent, sort)
select * from (values
  (
    'Web & Sistem',
    '<p>Dari company profile sampai sistem informasi siap pakai.</p>',
    array['Website & company profile','Sistem informasi / inventory','Aplikasi mobile','Custom request bisnis'],
    'teal',
    10
  ),
  (
    'Tugas & Penelitian',
    '<p>Bantuan teknis untuk tugas kuliah, riset, dan analisis data.</p>',
    array['Sistem untuk tugas kuliah','Riset & analisis data','Laporan teknis rapi','NLP / ML ringan'],
    'ink',
    20
  ),
  (
    'Market & Reseller',
    '<p>Produk fisik &amp; digital — wadah penjual dan pembeli.</p>',
    array['Produk reseller Mas''ud El-Tamamy','Listing mitra / penjual','Order via konfirmasi WA','Benefit member & mitra'],
    'orange',
    30
  ),
  (
    'Wisata',
    '<p>Paket perjalanan bersama Mbarep Tour &amp; Travel.</p>',
    array['Paket wisata rombongan','Studi tour & kunjungan industri','Family & corporate gathering','Wisata religi / ziarah'],
    'orange',
    40
  )
) as v(title, blurb, items, accent, sort)
where not exists (select 1 from public.services);
