-- Mas'ud El-Tamamy — skema database (jalankan sekali di Supabase → SQL Editor)

create extension if not exists pgcrypto;

-- ─────────────────────────────────────────────────────────────
-- Profil & peran
-- ─────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  full_name text,
  phone text,
  city text,
  role text not null default 'member' check (role in ('admin', 'mitra', 'member')),
  status text not null default 'active' check (status in ('pending', 'active', 'suspended')),
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and status = 'active'
  );
$$;

create or replace function public.is_active_mitra()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('mitra', 'admin') and status = 'active'
  );
$$;

-- Akun admin pertama ditentukan dari email ini.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  wanted text := coalesce(new.raw_user_meta_data ->> 'role', 'member');
begin
  if lower(new.email) = 'muhammadsmas998@gmail.com' then
    insert into public.profiles (id, email, full_name, role, status)
    values (new.id, new.email, new.raw_user_meta_data ->> 'full_name', 'admin', 'active');
  elsif wanted = 'mitra' then
    insert into public.profiles (id, email, full_name, phone, city, role, status)
    values (new.id, new.email, new.raw_user_meta_data ->> 'full_name',
            new.raw_user_meta_data ->> 'phone', new.raw_user_meta_data ->> 'city',
            'mitra', 'pending');
  else
    insert into public.profiles (id, email, full_name, phone, city, role, status)
    values (new.id, new.email, new.raw_user_meta_data ->> 'full_name',
            new.raw_user_meta_data ->> 'phone', new.raw_user_meta_data ->> 'city',
            'member', 'active');
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Pengguna biasa tidak boleh mengubah peran/status sendiri.
-- auth.uid() kosong = SQL Editor / service role, jadi tetap diizinkan.
create or replace function public.guard_profile_update()
returns trigger
language plpgsql
as $$
begin
  if (new.role is distinct from old.role or new.status is distinct from old.status)
     and auth.uid() is not null and not public.is_admin() then
    raise exception 'Tidak diizinkan mengubah peran atau status.';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard on public.profiles;
create trigger profiles_guard
  before update on public.profiles
  for each row execute function public.guard_profile_update();

alter table public.profiles enable row level security;

drop policy if exists "profiles read" on public.profiles;
create policy "profiles read" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles update" on public.profiles;
create policy "profiles update" on public.profiles
  for update using (id = auth.uid() or public.is_admin());

-- ─────────────────────────────────────────────────────────────
-- Produk (Market)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles (id) on delete set null,
  title text not null,
  kind text not null default 'fisik' check (kind in ('fisik', 'digital')),
  badge text,
  price_label text,
  description text,
  image_url text,
  gallery text[] not null default '{}',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  sort int not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Edit oleh mitra mengembalikan produk ke antrean verifikasi.
create or replace function public.guard_product_write()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  if auth.uid() is not null and not public.is_admin() then
    new.status := 'pending';
    new.owner_id := auth.uid();
  end if;
  return new;
end;
$$;

drop trigger if exists products_guard on public.products;
create trigger products_guard
  before insert or update on public.products
  for each row execute function public.guard_product_write();

alter table public.products enable row level security;

drop policy if exists "products read" on public.products;
create policy "products read" on public.products
  for select using (status = 'approved' or owner_id = auth.uid() or public.is_admin());

drop policy if exists "products insert" on public.products;
create policy "products insert" on public.products
  for insert with check (public.is_admin() or (public.is_active_mitra() and owner_id = auth.uid()));

drop policy if exists "products update" on public.products;
create policy "products update" on public.products
  for update using (public.is_admin() or (public.is_active_mitra() and owner_id = auth.uid()));

drop policy if exists "products delete" on public.products;
create policy "products delete" on public.products
  for delete using (public.is_admin() or owner_id = auth.uid());

-- ─────────────────────────────────────────────────────────────
-- Layanan (dikelola admin; deskripsi bisa HTML dari TinyMCE)
-- ─────────────────────────────────────────────────────────────
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

-- ─────────────────────────────────────────────────────────────
-- Wisata & proyek (dikelola admin)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  tag text,
  duration text,
  price_label text,
  summary text,
  image_url text,
  gallery text[] not null default '{}',
  published boolean not null default true,
  sort int not null default 100,
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null default 'web' check (category in ('web', 'mobile', 'research')),
  tag text,
  summary text,
  link text,
  cover_url text,
  gallery text[] not null default '{}',
  published boolean not null default true,
  sort int not null default 100,
  created_at timestamptz not null default now()
);

alter table public.trips enable row level security;
alter table public.projects enable row level security;

drop policy if exists "trips read" on public.trips;
create policy "trips read" on public.trips for select using (published or public.is_admin());
drop policy if exists "trips admin" on public.trips;
create policy "trips admin" on public.trips for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "projects read" on public.projects;
create policy "projects read" on public.projects for select using (published or public.is_admin());
drop policy if exists "projects admin" on public.projects;
create policy "projects admin" on public.projects for all using (public.is_admin()) with check (public.is_admin());

-- ─────────────────────────────────────────────────────────────
-- Pendaftar dari form Gabung
-- ─────────────────────────────────────────────────────────────
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  role text not null check (role in ('member', 'mitra', 'partner')),
  name text not null,
  city text,
  product_kind text,
  detail text,
  status text not null default 'new' check (status in ('new', 'contacted', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

alter table public.applications enable row level security;

drop policy if exists "applications insert" on public.applications;
create policy "applications insert" on public.applications
  for insert with check (status = 'new');
drop policy if exists "applications admin" on public.applications;
create policy "applications admin" on public.applications
  for all using (public.is_admin()) with check (public.is_admin());

-- ─────────────────────────────────────────────────────────────
-- Pesanan (dicatat saat pengunjung klik "Pesan via WA")
-- ─────────────────────────────────────────────────────────────
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products (id) on delete set null,
  product_title text,
  seller_id uuid references public.profiles (id) on delete set null,
  buyer_id uuid references public.profiles (id) on delete set null,
  status text not null default 'new' check (status in ('new', 'processing', 'done', 'cancelled')),
  created_at timestamptz not null default now()
);

-- Penjual & judul diambil dari produk, bukan dari input pengunjung.
create or replace function public.fill_order()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  select p.owner_id, p.title into new.seller_id, new.product_title
  from public.products p where p.id = new.product_id;
  return new;
end;
$$;

drop trigger if exists orders_fill on public.orders;
create trigger orders_fill
  before insert on public.orders
  for each row execute function public.fill_order();

alter table public.orders enable row level security;

drop policy if exists "orders insert" on public.orders;
create policy "orders insert" on public.orders
  for insert with check (status = 'new' and (buyer_id is null or buyer_id = auth.uid()));
drop policy if exists "orders read" on public.orders;
create policy "orders read" on public.orders
  for select using (public.is_admin() or buyer_id = auth.uid() or seller_id = auth.uid());
drop policy if exists "orders update" on public.orders;
create policy "orders update" on public.orders
  for update using (public.is_admin() or seller_id = auth.uid());

-- ─────────────────────────────────────────────────────────────
-- Delta: FAQ tambahan & log pertanyaan
-- ─────────────────────────────────────────────────────────────
create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  tags text[] not null default '{}',
  published boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.delta_logs (
  id uuid primary key default gen_random_uuid(),
  page text,
  question text not null,
  answer text,
  confidence text,
  created_at timestamptz not null default now()
);

alter table public.faqs enable row level security;
alter table public.delta_logs enable row level security;

drop policy if exists "faqs read" on public.faqs;
create policy "faqs read" on public.faqs for select using (published or public.is_admin());
drop policy if exists "faqs admin" on public.faqs;
create policy "faqs admin" on public.faqs for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "delta logs insert" on public.delta_logs;
create policy "delta logs insert" on public.delta_logs for insert with check (true);
drop policy if exists "delta logs admin" on public.delta_logs;
create policy "delta logs admin" on public.delta_logs
  for all using (public.is_admin()) with check (public.is_admin());

-- ─────────────────────────────────────────────────────────────
-- Penyimpanan gambar (bucket publik "media", folder = id pengguna)
-- ─────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

drop policy if exists "media upload" on storage.objects;
create policy "media upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "media delete" on storage.objects;
create policy "media delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'media' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

-- ─────────────────────────────────────────────────────────────
-- Data awal (isi website saat ini)
-- ─────────────────────────────────────────────────────────────
insert into public.products (title, kind, badge, price_label, description, status, sort)
select * from (values
  ('Paket Landing Page Bisnis', 'digital', 'Jasa', 'Mulai Rp 1,5jt', 'Landing page cepat, mobile-first, siap iklan & WhatsApp CTA.', 'approved', 10),
  ('Company Profile Website', 'digital', 'Jasa', 'Custom quote', 'Website perusahaan lengkap: profil, layanan, galeri, kontak.', 'approved', 20),
  ('Template UI Starter Pack', 'digital', 'Digital', 'Hubungi WA', 'Paket komponen UI siap pakai untuk UMKM & organisasi.', 'approved', 30)
) as v(title, kind, badge, price_label, description, status, sort)
where not exists (select 1 from public.products);

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

insert into public.trips (title, tag, duration, summary, sort)
select * from (values
  ('Paket Wisata', 'Rombongan', 'Fleksibel', 'Paket wisata siap jalan untuk rombongan umum.', 10),
  ('Studi Tour', 'Edukasi', '1–3 hari', 'Program terstruktur untuk sekolah & kampus.', 20),
  ('Kunjungan Industri', 'Edukasi', '1 hari+', 'Koordinasi lokasi, safety brief, dan pendamping.', 30),
  ('Family Gathering', 'Keluarga', 'Half / full day', 'Gathering keluarga atau komunitas.', 40),
  ('Corporate Outbound', 'Korporasi', '1–2 hari', 'Outbound & team building sekolah, kampus, atau perusahaan.', 50),
  ('Wisata Religi / Ziarah', 'Religi', 'Fleksibel', 'Paket ziarah dengan transport & pendamping rombongan.', 60)
) as v(title, tag, duration, summary, sort)
where not exists (select 1 from public.trips);

insert into public.projects (title, category, tag, summary, link, cover_url, sort)
select * from (values
  ('HARMSCAN', 'web', 'Cybersecurity · ML', 'Deteksi SEO poisoning & konten malicious pada domain pendidikan.', 'https://harmscan.pages.dev/', '/projects/harmscan/1.png', 10),
  ('Lingkar.co', 'web', 'Website · Produk', 'Website & solusi digital untuk Lingkar.co.', 'https://lingkar.co', '/projects/lingkar/1.jpg', 20),
  ('Nahwa Al Sikha', 'web', 'Company Profile', 'Website company profile nahwaalsikha.com.', 'https://nahwaalsikha.com', '/projects/nahwaalsikha/1.png', 30),
  ('Cybernetsec', 'web', 'Security', 'Proyek keamanan siber Cybernetsec.', null, '/projects/cybernetsec/1.png', 40),
  ('Manteb Jaya Abadi', 'web', 'Company Profile', 'Website mantebjayaabadi.com.', 'https://mantebjayaabadi.com', '/projects/mantebjayaabadi/1.png', 50),
  ('Aswaja Medicine', 'mobile', 'Mobile App', 'Aplikasi mobile referensi obat (APK).', null, '/projects/aswaja-medicine/1.jpg', 60),
  ('Inventory Rokok', 'web', 'Inventory System', 'Sistem inventori stok rokok.', null, '/projects/inventory-rokok/1.png', 70),
  ('MIS Ma''arif Tempursari', 'web', 'Website Sekolah', 'Website resmi MIS Ma''arif Tempursari.', 'https://mismaariftempursari.sch.id', '/projects/mismaariftempursari/1.jpg', 80),
  ('HMJTI Unwahas', 'web', 'Organisasi · Web', 'Website Himpunan Mahasiswa TI Unwahas.', 'https://hmjti.unwahas.ac.id', '/projects/hmjti-unwahas/1.jpg', 90),
  ('Mbarep Tour & Travel', 'web', 'Website · Travel', 'Website trip & layanan travel Mbarep Tour.', 'https://mbareptour.id', null, 100),
  ('Smart SPPG', 'web', 'Sistem Informasi', 'Aplikasi web smartsppg.com.', 'https://smartsppg.com', null, 110),
  ('Prediksi Cuaca', 'research', 'Penelitian', 'Penelitian model prediksi cuaca.', null, null, 120)
) as v(title, category, tag, summary, link, cover_url, sort)
where not exists (select 1 from public.projects);
