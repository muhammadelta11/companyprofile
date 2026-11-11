"use client";

import { createAccountFromApplication } from "@/app/dashboard/actions";
import { SafeForm } from "@/app/dashboard/SafeForm";
import { SubmitButton } from "@/app/dashboard/SubmitButton";

export function CreateAccountFromApp({
  applicationId,
  defaultEmail = "",
  defaultPhone = "",
}: {
  applicationId: string;
  defaultEmail?: string;
  defaultPhone?: string;
}) {
  return (
    <details className="pendaftar__provision">
      <summary>Buat akun di Anggota</summary>
      <SafeForm
        action={createAccountFromApplication}
        className="form-stack"
        persistKey={`app-account-${applicationId}`}
        successMessage="Akun dibuat — cek toast untuk sandi sementara."
      >
        <input type="hidden" name="id" value={applicationId} />
        <label>
          Email login
          <input
            name="email"
            type="email"
            defaultValue={defaultEmail}
            required
            maxLength={160}
            placeholder="email@contoh.com"
          />
        </label>
        <label>
          WhatsApp
          <input name="phone" defaultValue={defaultPhone} maxLength={30} placeholder="08…" />
        </label>
        <label>
          Sandi sementara (opsional)
          <input
            name="password"
            type="text"
            minLength={8}
            maxLength={72}
            autoComplete="new-password"
            placeholder="Kosongkan = digenerate otomatis"
          />
        </label>
        <p className="dash-head__help">
          Setelah dibuat, bagikan email + sandi ke temanmu. Sandi otomatis muncul di notifikasi hijau.
        </p>
        <SubmitButton>Buat &amp; aktifkan</SubmitButton>
      </SafeForm>
    </details>
  );
}
