import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { updateProfile } from "../actions";
import { SubmitButton } from "../SubmitButton";
import { SafeForm } from "../SafeForm";
import { Badge, DashHead, DashLoading } from "../ui";

export default function ProfilPage() {
  return (
    <Suspense fallback={<DashLoading />}>
      <Profile />
    </Suspense>
  );
}

async function Profile() {
  const user = await requireUser();

  return (
    <>
      <DashHead
        title="Profil"
        text={
          user.role === "mitra"
            ? "Nomor WhatsApp wajib diisi — order pembeli diarahkan ke nomor ini."
            : "Data ini dipakai saat penjual atau admin menghubungimu."
        }
      />
      <p className="dash-meta">
        {user.email} <Badge value={user.role} /> <Badge value={user.status} />
      </p>
      <SafeForm action={updateProfile} className="form-stack dash-card">
        <label>
          Nama lengkap
          <input name="full_name" defaultValue={user.name} />
        </label>
        <div className="form-row">
          <label>
            No. WhatsApp
            <input name="phone" type="tel" defaultValue={user.phone} />
          </label>
          <label>
            Kota
            <input name="city" defaultValue={user.city} />
          </label>
        </div>
        <SubmitButton>Simpan profil</SubmitButton>
      </SafeForm>
    </>
  );
}
