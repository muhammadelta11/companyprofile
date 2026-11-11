import { cache } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import { supabaseReady } from "./supabase/env";
import {
  EMPTY_CREDENTIALS,
  normalizeBrandCerts,
  type BrandCertificate,
  type SellerCredentials,
} from "./seller-creds";

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
  shop_name: string;
  tagline: string;
  bio: string;
  credentials: SellerCredentials;
};

const PROFILE_SELECT_FULL =
  "full_name, role, status, phone, city, shop_name, tagline, bio, legal_name, legal_form, business_reg_no, issued_by, tax_status, brand_certs";
const PROFILE_SELECT_BRAND = "full_name, role, status, phone, city, shop_name, tagline, bio";
const PROFILE_SELECT_BASIC = "full_name, role, status, phone, city";

function mapCredentials(profile: Record<string, unknown> | null): SellerCredentials {
  if (!profile) return { ...EMPTY_CREDENTIALS };
  return {
    legal_name: typeof profile.legal_name === "string" ? profile.legal_name : null,
    legal_form: typeof profile.legal_form === "string" ? profile.legal_form : null,
    business_reg_no:
      typeof profile.business_reg_no === "string" ? profile.business_reg_no : null,
    issued_by: typeof profile.issued_by === "string" ? profile.issued_by : null,
    tax_status: typeof profile.tax_status === "string" ? profile.tax_status : null,
    brand_certs: normalizeBrandCerts(profile.brand_certs) as BrandCertificate[],
  };
}

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  // JWT dicek terhadap waktu sekarang → harus request-time (Cache Components).
  await connection();
  if (!supabaseReady) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  let profile: Record<string, unknown> | null = null;

  const full = await supabase.from("profiles").select(PROFILE_SELECT_FULL).eq("id", user.id).single();
  if (!full.error && full.data) {
    profile = full.data as Record<string, unknown>;
  } else {
    const branded = await supabase
      .from("profiles")
      .select(PROFILE_SELECT_BRAND)
      .eq("id", user.id)
      .single();
    if (!branded.error && branded.data) {
      profile = branded.data as Record<string, unknown>;
    } else {
      const basic = await supabase
        .from("profiles")
        .select(PROFILE_SELECT_BASIC)
        .eq("id", user.id)
        .single();
      profile = (basic.data as Record<string, unknown> | null) ?? null;
    }
  }

  return {
    id: user.id,
    email: user.email ?? "",
    name: (typeof profile?.full_name === "string" && profile.full_name) ||
      user.email?.split("@")[0] ||
      "Pengguna",
    role: (profile?.role as Role) ?? "member",
    status: (profile?.status as AccountStatus) ?? "active",
    phone: typeof profile?.phone === "string" ? profile.phone : "",
    city: typeof profile?.city === "string" ? profile.city : "",
    shop_name: typeof profile?.shop_name === "string" ? profile.shop_name : "",
    tagline: typeof profile?.tagline === "string" ? profile.tagline : "",
    bio: typeof profile?.bio === "string" ? profile.bio : "",
    credentials: mapCredentials(profile),
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
