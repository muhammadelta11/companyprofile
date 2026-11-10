import { Suspense } from "react";
import { Reveal } from "@/components/Reveal";
import { safeNextPath } from "@/lib/access-policy";
import { pageMetadata } from "@/lib/seo";
import { supabaseReady } from "@/lib/supabase/env";
import { AuthForm } from "./AuthForm";

type Props = { searchParams: Promise<{ next?: string }> };

export const metadata = pageMetadata({
  title: "Masuk",
  description: "Masuk atau daftar akun Mas'ud El-Tamamy untuk komentar, dashboard, dan jadi mitra.",
  path: "/masuk",
  noIndex: true,
});

export default function MasukPage({ searchParams }: Props) {
  return (
    <Suspense
      fallback={
        <div className="container page-hero auth-page">
          <p className="eyebrow">Akun</p>
          <h1>Masuk ke akun</h1>
          <p>Memuat formulir…</p>
        </div>
      }
    >
      <MasukContent searchParams={searchParams} />
    </Suspense>
  );
}

async function MasukContent({ searchParams }: Props) {
  const sp = await searchParams;
  const next = safeNextPath(sp.next);

  return (
    <div className="container page-hero auth-page">
      <Reveal>
        <p className="eyebrow">Akun</p>
        <h1>Masuk ke akun</h1>
        <p>
          Lihat katalog tanpa login. Masuk untuk komentar, dashboard, dan jadi mitra.
          Order via WhatsApp tetap bisa tanpa akun.
        </p>
      </Reveal>
      {supabaseReady ? (
        <AuthForm next={next} />
      ) : (
        <p className="form-msg form-msg--error">
          Database belum terhubung. Isi <code>NEXT_PUBLIC_SUPABASE_URL</code> dan{" "}
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> di <code>.env.local</code>.
        </p>
      )}
    </div>
  );
}
