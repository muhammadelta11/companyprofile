-- Area radius produk (Google Maps): titik + radius km
-- Jalankan sekali di Supabase → SQL Editor.

alter table public.products
  add column if not exists area_lat double precision,
  add column if not exists area_lng double precision,
  add column if not exists area_radius_km numeric(6, 2);

comment on column public.products.area_lat is 'Latitude pusat area layanan';
comment on column public.products.area_lng is 'Longitude pusat area layanan';
comment on column public.products.area_radius_km is 'Radius layanan dalam kilometer';
