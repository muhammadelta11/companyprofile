-- Chat privat per produk (wajib login). Jalankan sekali di Supabase → SQL Editor.
-- Satu thread per (produk, pembeli). Penjual = products.owner_id; null = Official (admin).

create table if not exists public.product_threads (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  buyer_id uuid not null references public.profiles (id) on delete cascade,
  seller_id uuid references public.profiles (id) on delete set null,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (product_id, buyer_id)
);

create index if not exists product_threads_buyer_idx
  on public.product_threads (buyer_id, last_message_at desc);

create index if not exists product_threads_seller_idx
  on public.product_threads (seller_id, last_message_at desc)
  where seller_id is not null;

create index if not exists product_threads_product_idx
  on public.product_threads (product_id, last_message_at desc);

create table if not exists public.product_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.product_threads (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists product_messages_thread_created_idx
  on public.product_messages (thread_id, created_at asc);

create or replace function public.can_access_product_thread(tid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.product_threads t
    where t.id = tid
      and (
        t.buyer_id = auth.uid()
        or t.seller_id = auth.uid()
        or public.is_admin()
      )
  );
$$;

create or replace function public.touch_product_thread()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.product_threads
  set last_message_at = coalesce(new.created_at, now())
  where id = new.thread_id;
  return new;
end;
$$;

drop trigger if exists product_messages_touch_thread on public.product_messages;
create trigger product_messages_touch_thread
  after insert on public.product_messages
  for each row execute function public.touch_product_thread();

alter table public.product_threads enable row level security;
alter table public.product_messages enable row level security;

drop policy if exists "product_threads read" on public.product_threads;
create policy "product_threads read" on public.product_threads
  for select using (
    buyer_id = auth.uid()
    or seller_id = auth.uid()
    or public.is_admin()
  );

drop policy if exists "product_threads insert" on public.product_threads;
create policy "product_threads insert" on public.product_threads
  for insert with check (
    auth.uid() = buyer_id
    and exists (
      select 1 from public.products p
      where p.id = product_id
        and p.status = 'approved'
        and (p.owner_id is distinct from auth.uid())
    )
  );

drop policy if exists "product_threads update" on public.product_threads;
create policy "product_threads update" on public.product_threads
  for update using (
    buyer_id = auth.uid()
    or seller_id = auth.uid()
    or public.is_admin()
  );

drop policy if exists "product_messages read" on public.product_messages;
create policy "product_messages read" on public.product_messages
  for select using (public.can_access_product_thread(thread_id));

drop policy if exists "product_messages insert" on public.product_messages;
create policy "product_messages insert" on public.product_messages
  for insert with check (
    auth.uid() = sender_id
    and public.can_access_product_thread(thread_id)
  );

-- Realtime: pesan + thread baru masuk langsung ke klien.
do $$
begin
  alter publication supabase_realtime add table public.product_messages;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.product_threads;
exception when duplicate_object then null;
end $$;

-- Unread + Web Push: jalankan juga product-chat-notify.sql (kolom unread + push_subscriptions).
