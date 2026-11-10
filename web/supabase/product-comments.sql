-- Komentar produk (wajib login). Jalankan sekali di Supabase → SQL Editor.

create table if not exists public.product_comments (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 2 and 1000),
  created_at timestamptz not null default now()
);

create index if not exists product_comments_product_created_idx
  on public.product_comments (product_id, created_at desc);

alter table public.product_comments enable row level security;

drop policy if exists "product_comments read" on public.product_comments;
create policy "product_comments read" on public.product_comments
  for select using (
    exists (
      select 1 from public.products p
      where p.id = product_id and (p.status = 'approved' or public.is_admin())
    )
  );

drop policy if exists "product_comments insert" on public.product_comments;
create policy "product_comments insert" on public.product_comments
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.products p
      where p.id = product_id and p.status = 'approved'
    )
  );

drop policy if exists "product_comments delete" on public.product_comments;
create policy "product_comments delete" on public.product_comments
  for delete using (auth.uid() = user_id or public.is_admin());

-- Mode routing WA order: 'admin' (default) | 'seller'
insert into public.site_settings (key, value)
values ('order_wa_mode', 'admin')
on conflict (key) do nothing;
