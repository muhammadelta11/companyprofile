import { cache } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import { supabaseReady } from "./supabase/env";

export type Role = "admin" | "mitra" | "member";
export type AccountStatus = "pending" | "active" | "suspended";

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  status: AccountStatus;
  phone: string;
  city: string;
};

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  // JWT dicek terhadap waktu sekarang → harus request-time (Cache Components).
  await connection();
  if (!supabaseReady) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, status, phone, city")
    .eq("id", user.id)
    .single();

  return {
    id: user.id,
    email: user.email ?? "",
    name: profile?.full_name || user.email?.split("@")[0] || "Pengguna",
    role: (profile?.role as Role) ?? "member",
    status: (profile?.status as AccountStatus) ?? "active",
    phone: profile?.phone ?? "",
    city: profile?.city ?? "",
  };
});

/** Wajib login; kalau `roles` diisi, peran lain dikembalikan ke ringkasan. */
export async function requireUser(roles?: Role[]) {
  const user = await getCurrentUser();
  if (!user) redirect("/masuk");
  if (user.status === "suspended") redirect("/masuk");
  if (roles && !roles.includes(user.role)) redirect("/dashboard");
  return user;
}
