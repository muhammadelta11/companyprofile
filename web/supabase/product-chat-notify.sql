-- Unread + push subscriptions untuk chat produk.
-- Jalankan di Supabase → SQL Editor (setelah product-chat.sql).

alter table public.product_threads
  add column if not exists buyer_unread integer not null default 0
    check (buyer_unread >= 0),
  add column if not exists seller_unread integer not null default 0
    check (seller_unread >= 0),
  add column if not exists buyer_last_read_at timestamptz,
  add column if not exists seller_last_read_at timestamptz;

create or replace function public.bump_product_thread_unread()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  t public.product_threads%rowtype;
begin
  select * into t from public.product_threads where id = new.thread_id;
  if not found then
    return new;
  end if;

  update public.product_threads
  set
    last_message_at = coalesce(new.created_at, now()),
    buyer_unread = case
      when new.sender_id = t.buyer_id then buyer_unread
      else buyer_unread + 1
    end,
    seller_unread = case
      when t.seller_id is not null and new.sender_id = t.seller_id then seller_unread
      when t.seller_id is null and new.sender_id is distinct from t.buyer_id then seller_unread
      when new.sender_id = t.buyer_id then seller_unread + 1
      else seller_unread
    end
  where id = new.thread_id;

  return new;
end;
$$;

drop trigger if exists product_messages_touch_thread on public.product_messages;
drop trigger if exists product_messages_bump_unread on public.product_messages;
create trigger product_messages_bump_unread
  after insert on public.product_messages
  for each row execute function public.bump_product_thread_unread();

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  unique (endpoint)
);

create index if not exists push_subscriptions_user_idx
  on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists "push_subscriptions read own" on public.push_subscriptions;
create policy "push_subscriptions read own" on public.push_subscriptions
  for select using (user_id = auth.uid());

drop policy if exists "push_subscriptions insert own" on public.push_subscriptions;
create policy "push_subscriptions insert own" on public.push_subscriptions
  for insert with check (user_id = auth.uid());

drop policy if exists "push_subscriptions update own" on public.push_subscriptions;
create policy "push_subscriptions update own" on public.push_subscriptions
  for update using (user_id = auth.uid());

drop policy if exists "push_subscriptions delete own" on public.push_subscriptions;
create policy "push_subscriptions delete own" on public.push_subscriptions
  for delete using (user_id = auth.uid());
