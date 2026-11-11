import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./env";

/** Client service-role untuk aksi admin (buat user, dll). Jangan dipakai di browser. */
export function createAdminClient() {
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_SECRET_KEY?.trim() ||
    "";
  if (!SUPABASE_URL || !key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY (atau SUPABASE_SECRET_KEY) belum di-set. Tambahkan di .env lokal dan Environment Variables Vercel."
    );
  }
  return createClient(SUPABASE_URL, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
