-- Izinkan publik membaca identitas penjual (bukan email/telepon di query app)
-- agar halaman Market bisa menampilkan nama mitra seperti marketplace.
-- Jalankan sekali di Supabase → SQL Editor.

drop policy if exists "profiles public sellers" on public.profiles;
create policy "profiles public sellers" on public.profiles
  for select using (
    status = 'active'
    and role = 'mitra'
    and exists (
      select 1
      from public.products pr
      where pr.owner_id = profiles.id
        and pr.status = 'approved'
    )
  );
