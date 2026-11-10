"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_KEY, SUPABASE_URL, supabaseReady } from "./env";

export function createBrowserSupabase() {
  if (!supabaseReady) return null;
  return createBrowserClient(SUPABASE_URL, SUPABASE_KEY);
}
