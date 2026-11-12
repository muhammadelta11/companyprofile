"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "./Icon";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { loginHref } from "@/lib/access-policy";

type Variant = "header" | "sheet";

/**
 * Pintu masuk akun yang jelas:
 * - belum login → Masuk
 * - sudah login → Akun (dashboard)
 */
export function AccountLink({
  variant = "header",
  onNavigate,
}: {
  variant?: Variant;
  onNavigate?: () => void;
}) {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createBrowserSupabase();
    if (!supabase) {
      setLoggedIn(false);
      return;
    }
    void supabase.auth.getSession().then(({ data }) => {
      setLoggedIn(Boolean(data.session));
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(Boolean(session));
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  const href = loggedIn ? "/dashboard" : loginHref("/dashboard");
  const label = loggedIn ? "Akun" : "Masuk";
  const text = loggedIn ? "Kelola produk, chat, pesanan" : "Masuk ke akun kamu";

  if (variant === "sheet") {
    return (
      <Link
        href={href}
        className="sheet__action sheet__action--account"
        onClick={onNavigate}
        title={text}
      >
        <Icon name={loggedIn ? "dashboard" : "user"} size={20} />
        {label}
      </Link>
    );
  }

  return (
    <Link href={href} className="btn-delta" aria-label={label}>
      <Icon name="user" size={18} />
      <span className="btn-label">{label}</span>
    </Link>
  );
}
