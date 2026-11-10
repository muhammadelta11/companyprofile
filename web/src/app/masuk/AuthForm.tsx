"use client";

import { useActionState, useState, useTransition } from "react";
import { signIn, signInWithGoogle, signUp, type AuthState } from "./actions";

export function AuthForm({ next = "/dashboard" }: { next?: string }) {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [role, setRole] = useState<"member" | "mitra">("member");
  const [inState, inAction, inPending] = useActionState<AuthState, FormData>(signIn, {});
  const [upState, upAction, upPending] = useActionState<AuthState, FormData>(signUp, {});
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [googlePending, startGoogle] = useTransition();
  const state = mode === "in" ? inState : upState;

  function onGoogle() {
    setGoogleError(null);
    startGoogle(async () => {
      const res = await signInWithGoogle(next);
      if (res?.error) setGoogleError(res.error);
    });
  }

  return (
    <div className="auth-card">
      <div className="auth-tabs" role="tablist" aria-label="Masuk atau daftar">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "in"}
          className={mode === "in" ? "is-active" : undefined}
          onClick={() => setMode("in")}
        >
          Masuk
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "up"}
          className={mode === "up" ? "is-active" : undefined}
          onClick={() => setMode("up")}
        >
          Daftar
        </button>
      </div>

      <button
        type="button"
        className="btn btn-outline auth-google"
        onClick={onGoogle}
        disabled={googlePending || inPending || upPending}
      >
        {googlePending ? "Menghubungkan Google…" : "Lanjutkan dengan Google"}
      </button>
      <p className="auth-or" aria-hidden="true">
        <span>atau</span>
      </p>

      {mode === "in" ? (
        <form action={inAction} className="form-stack">
          <input type="hidden" name="next" value={next} />
          <label>
            Email
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label>
            Kata sandi
            <input name="password" type="password" autoComplete="current-password" required />
          </label>
          <button className="btn btn-teal" disabled={inPending}>
            {inPending ? "Memproses…" : "Masuk"}
          </button>
          <p className="auth-switch">
            Belum punya akun?{" "}
            <button type="button" className="auth-switch__btn" onClick={() => setMode("up")}>
              Daftar di sini
            </button>
          </p>
        </form>
      ) : (
        <form action={upAction} className="form-stack">
          <input type="hidden" name="next" value={next} />
          <div className="join-roles join-roles--two">
            {(["member", "mitra"] as const).map((r) => (
              <button
                key={r}
                type="button"
                className={`join-role${role === r ? " is-active" : ""}`}
                onClick={() => setRole(r)}
              >
                <strong>{r === "member" ? "Member" : "Mitra Penjual"}</strong>
                <span>
                  {r === "member"
                    ? "Komentar, riwayat order, promo."
                    : "Upload produk ke Market (perlu verifikasi admin)."}
                </span>
              </button>
            ))}
          </div>
          <input type="hidden" name="role" value={role} />
          <label>
            Nama lengkap
            <input name="name" autoComplete="name" required />
          </label>
          <div className="form-row">
            <label>
              No. WhatsApp
              <input name="phone" type="tel" autoComplete="tel" />
            </label>
            <label>
              Kota
              <input name="city" />
            </label>
          </div>
          <label>
            Email
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label>
            Kata sandi (min. 8 karakter)
            <input
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </label>
          <button className="btn btn-teal" disabled={upPending}>
            {upPending ? "Memproses…" : "Buat akun"}
          </button>
          <p className="auth-switch">
            Sudah punya akun?{" "}
            <button type="button" className="auth-switch__btn" onClick={() => setMode("in")}>
              Masuk di sini
            </button>
          </p>
        </form>
      )}

      {googleError ? <p className="form-msg form-msg--error">{googleError}</p> : null}
      {state.error ? <p className="form-msg form-msg--error">{state.error}</p> : null}
      {state.info ? <p className="form-msg">{state.info}</p> : null}
    </div>
  );
}
