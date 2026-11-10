-- Pengajuan member → mitra (jalankan di SQL Editor Supabase)

alter table public.profiles
  add column if not exists mitra_apply_category text,
  add column if not exists mitra_apply_product text,
  add column if not exists mitra_apply_note text,
  add column if not exists mitra_apply_at timestamptz;

alter table public.applications
  add column if not exists applicant_id uuid references public.profiles (id) on delete set null;

-- Member boleh baca pengajuannya sendiri
drop policy if exists "applications read own" on public.applications;
create policy "applications read own" on public.applications
  for select using (applicant_id = auth.uid() or public.is_admin());
