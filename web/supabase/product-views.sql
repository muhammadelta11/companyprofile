-- Hitungan lihat produk (untuk urutan Market: terbaru / terpopuler).
-- Jalankan sekali di Supabase → SQL Editor.

alter table public.products
  add column if not exists view_count int not null default 0;

-- Jangan paksa status pending saat hanya menambah view_count.
create or replace function public.guard_product_write()
returns trigger
language plpgsql
as $$
begin
  if TG_OP = 'UPDATE'
     and new.view_count is distinct from old.view_count
     and new.title is not distinct from old.title
     and new.kind is not distinct from old.kind
     and new.badge is not distinct from old.badge
     and new.price_label is not distinct from old.price_label
     and new.description is not distinct from old.description
     and new.image_url is not distinct from old.image_url
     and new.status is not distinct from old.status
     and new.sort is not distinct from old.sort
     and new.owner_id is not distinct from old.owner_id
  then
    -- View saja: jangan ubah updated_at / status
    new.updated_at := old.updated_at;
    return new;
  end if;

  new.updated_at := now();
  if auth.uid() is not null and not public.is_admin() then
    new.status := 'pending';
    new.owner_id := auth.uid();
  end if;
  return new;
end;
$$;

create or replace function public.increment_product_view(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.products
  set view_count = coalesce(view_count, 0) + 1
  where id = p_id
    and status = 'approved';
end;
$$;

revoke all on function public.increment_product_view(uuid) from public;
grant execute on function public.increment_product_view(uuid) to anon, authenticated;
