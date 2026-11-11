-- Branding + legalitas etalase mitra. Jalankan sekali di Supabase → SQL Editor.
-- Aman dijalankan ulang (IF NOT EXISTS).

alter table public.profiles
  add column if not exists shop_name text;

alter table public.profiles
  add column if not exists tagline text;

alter table public.profiles
  add column if not exists bio text;

-- Data usaha resmi (opsional, ditampilkan di etalase publik)
alter table public.profiles
  add column if not exists legal_name text;

alter table public.profiles
  add column if not exists legal_form text;

alter table public.profiles
  add column if not exists business_reg_no text;

alter table public.profiles
  add column if not exists issued_by text;

alter table public.profiles
  add column if not exists tax_status text;

alter table public.profiles
  add column if not exists brand_certs jsonb not null default '[]'::jsonb;

comment on column public.profiles.shop_name is 'Nama etalase publik (mitra); fallback ke full_name';
comment on column public.profiles.tagline is 'Tagline singkat etalase publik';
comment on column public.profiles.bio is 'Deskripsi / company profile singkat etalase publik';
comment on column public.profiles.legal_name is 'Nama usaha resmi / badan hukum';
comment on column public.profiles.legal_form is 'Bentuk usaha: UMKM, CV, PT, Perseorangan, dll';
comment on column public.profiles.business_reg_no is 'Nomor izin usaha (NIB/SIUP) untuk ditampilkan publik';
comment on column public.profiles.issued_by is 'Diterbitkan oleh (OSS, Disdag, dll)';
comment on column public.profiles.tax_status is 'Status pajak ringkas (mis. NPWP aktif · PPh Final UMKM)';
comment on column public.profiles.brand_certs is 'Array sertifikat brand [{title, issuer, year}]';
