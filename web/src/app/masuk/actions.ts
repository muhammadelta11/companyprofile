"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { safeNextPath } from "@/lib/access-policy";
import { createClient } from "@/lib/supabase/server";
import { supabaseReady } from "@/lib/supabase/env";

export type AuthState = { error?: string; info?: string };

function field(fd: FormData, key: string) {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
}

export async function signIn(_: AuthState, fd: FormData): Promise<AuthState> {
  if (!supabaseReady) return { error: "Database belum terhubung." };
  const next = safeNextPath(field(fd, "next"));
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: field(fd, "email"),
    password: field(fd, "password"),
  });
  if (error) return { error: "Email atau kata sandi salah, atau email belum dikonfirmasi." };
  redirect(next);
}

/** Login Google (OAuth) → callback Supabase → next / dashboard. */
export async function signInWithGoogle(nextPath?: string): Promise<AuthState> {
  if (!supabaseReady) return { error: "Database belum terhubung." };
  const origin = (await headers()).get("origin") ?? "";
  const next = safeNextPath(nextPath);
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
      queryParams: { access_type: "offline", prompt: "select_account" },
    },
  });
  if (error || !data.url) {
    return {
      error:
        error?.message ||
        "Login Google gagal. Pastikan provider Google aktif di Supabase Auth.",
    };
  }
  redirect(data.url);
}

export async function signUp(_: AuthState, fd: FormData): Promise<AuthState> {
  if (!supabaseReady) return { error: "Database belum terhubung." };
  const role = field(fd, "role") === "mitra" ? "mitra" : "member";
  const password = field(fd, "password");
  const next = safeNextPath(field(fd, "next"));
  if (password.length < 8) return { error: "Kata sandi minimal 8 karakter." };

  const origin = (await headers()).get("origin") ?? "";
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: field(fd, "email"),
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
      data: {
        full_name: field(fd, "name"),
        phone: field(fd, "phone"),
        city: field(fd, "city"),
        role,
      },
    },
  });
  if (error) return { error: error.message };
  if (data.session) redirect(next);
  return { info: "Cek email kamu untuk konfirmasi akun, lalu masuk." };
}

export async function signOut() {
  if (supabaseReady) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/masuk");
}
