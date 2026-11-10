-- Operasional P0: order lengkap, area kirim, alasan tolak, masukan.
-- Jalankan sekali di Supabase → SQL Editor.

-- ── Pesanan: data pembeli ─────────────────────────────────────
alter table public.orders
  add column if not exists buyer_name text,
  add column if not exists buyer_phone text,
  add column if not exists buyer_city text,
  add column if not exists note text;

-- ── Produk: mode kirim + area + alasan tolak ──────────────────
alter table public.products
  add column if not exists shipping_mode text not null default 'area',
  add column if not exists service_area text,
  add column if not exists reject_reason text;

-- Constraint shipping_mode (abaikan jika sudah ada)
do $$
begin
  alter table public.products
    add constraint products_shipping_mode_check
    check (shipping_mode in ('pickup', 'area', 'nationwide', 'digital'));
exception
  when duplicate_object then null;
end $$;

-- Digital default shipping jika kind digital (opsional, data lama)
update public.products
set shipping_mode = 'digital'
where kind = 'digital' and shipping_mode = 'area';

-- ── Masukan / lapor ke developer ──────────────────────────────
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  name text,
  contact text,
  kind text not null default 'idea'
    check (kind in ('bug', 'idea', 'complaint', 'other')),
  message text not null,
  page text,
  status text not null default 'new'
    check (status in ('new', 'read', 'done')),
  created_at timestamptz not null default now()
);

alter table public.feedback enable row level security;

drop policy if exists "feedback insert" on public.feedback;
create policy "feedback insert" on public.feedback
  for insert with check (true);

drop policy if exists "feedback admin" on public.feedback;
create policy "feedback admin" on public.feedback
  for all using (public.is_admin()) with check (public.is_admin());
