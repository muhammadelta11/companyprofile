import Link from "next/link";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { formatBrandCertsText } from "@/lib/seller-creds";
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
  const canBrand = user.role === "mitra" || user.role === "admin";
  const storeHref =
    user.role === "mitra"
      ? `/market/penjual/${user.id}`
      : user.role === "admin"
        ? "/market/penjual/official"
        : null;
  const certsText = formatBrandCertsText(user.credentials.brand_certs);

  return (
    <>
      <DashHead
        title="Profil"
        text={
          canBrand
            ? "Branding etalase, legalitas usaha (opsional), dan WhatsApp untuk order."
            : "Data ini dipakai saat penjual atau admin menghubungimu."
        }
      />
      <p className="dash-meta">
        {user.email} <Badge value={user.role} /> <Badge value={user.status} />
        {storeHref ? (
          <>
            {" "}
            <Link href={storeHref} className="dash-link">
              Lihat etalase publik
            </Link>
          </>
        ) : null}
      </p>
      <SafeForm action={updateProfile} className="form-stack dash-card">
        <label>
          Nama lengkap
          <input name="full_name" defaultValue={user.name} />
        </label>
        {canBrand ? (
          <>
            <p className="dash-form-section">Branding etalase</p>
            <label>
              Nama etalase / brand
              <input
                name="shop_name"
                defaultValue={user.shop_name}
                placeholder="Contoh: Dapur Bu Sari"
                maxLength={80}
              />
            </label>
            <label>
              Tagline
              <input
                name="tagline"
                defaultValue={user.tagline}
                placeholder="Satu kalimat singkat tentang toko"
                maxLength={120}
              />
            </label>
            <label>
              Tentang etalase
              <textarea
                name="bio"
                rows={4}
                defaultValue={user.bio}
                placeholder="Cerita singkat, keunggulan, area layanan…"
                maxLength={800}
              />
            </label>

            <p className="dash-form-section">Legalitas & kepercayaan (opsional)</p>
            <p className="dash-form-hint">
              Tampil di etalase publik jika diisi. Jangan tulis NPWP lengkap — cukup status ringkas.
            </p>
            <label>
              Nama usaha resmi
              <input
                name="legal_name"
                defaultValue={user.credentials.legal_name ?? ""}
                placeholder="Sesuai NIB / akta"
                maxLength={160}
              />
            </label>
            <div className="form-row">
              <label>
                Bentuk usaha
                <input
                  name="legal_form"
                  defaultValue={user.credentials.legal_form ?? ""}
                  placeholder="UMKM / CV / PT / Perseorangan"
                  maxLength={80}
                />
              </label>
              <label>
                No. izin (NIB/SIUP)
                <input
                  name="business_reg_no"
                  defaultValue={user.credentials.business_reg_no ?? ""}
                  placeholder="Nomor yang boleh ditampilkan"
                  maxLength={80}
                />
              </label>
            </div>
            <label>
              Diterbitkan oleh
              <input
                name="issued_by"
                defaultValue={user.credentials.issued_by ?? ""}
                placeholder="Contoh: OSS · Kementerian Investasi"
                maxLength={120}
              />
            </label>
            <label>
              Status pajak
              <input
                name="tax_status"
                defaultValue={user.credentials.tax_status ?? ""}
                placeholder="Contoh: NPWP aktif · PPh Final UMKM"
                maxLength={160}
              />
            </label>
            <label>
              Sertifikat brand
              <textarea
                name="brand_certs"
                rows={4}
                defaultValue={certsText}
                placeholder={"Satu baris satu sertifikat:\nHalal MUI | BPJPH | 2024\nBPOM MD | BPOM | 2023"}
              />
            </label>
            <p className="dash-form-hint">Format: Judul | Penerbit | Tahun</p>
          </>
        ) : null}
        <div className="form-row">
          <label>
            No. WhatsApp{user.role === "mitra" ? " (wajib)" : ""}
            <input
              name="phone"
              type="tel"
              defaultValue={user.phone}
              required={user.role === "mitra"}
              placeholder="08xxxxxxxxxx"
            />
          </label>
          <label>
            Kota
            <input name="city" defaultValue={user.city} />
          </label>
        </div>
        {user.role === "mitra" ? (
          <p className="dash-form-hint">
            Wajib diisi segera. Order WA dari Market masuk ke nomor ini — bukan ke admin.
          </p>
        ) : null}
        <SubmitButton>Simpan profil</SubmitButton>
      </SafeForm>
    </>
  );
}
