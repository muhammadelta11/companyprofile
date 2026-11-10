-- Galeri multi-foto untuk produk, wisata, dan proyek (maks. dipakai di app: 8).
-- Jalankan di SQL Editor Supabase.

alter table public.products
  add column if not exists gallery text[] not null default '{}';

alter table public.trips
  add column if not exists gallery text[] not null default '{}';

alter table public.projects
  add column if not exists gallery text[] not null default '{}';

-- Seed: foto tunggal lama jadi isi galeri pertama
update public.products
set gallery = array[image_url]
where image_url is not null
  and image_url <> ''
  and cardinality(gallery) = 0;

update public.trips
set gallery = array[image_url]
where image_url is not null
  and image_url <> ''
  and cardinality(gallery) = 0;

update public.projects
set gallery = array[cover_url]
where cover_url is not null
  and cover_url <> ''
  and cardinality(gallery) = 0;
