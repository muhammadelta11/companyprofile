import { requireUser } from "@/lib/auth";
import { getSiteSettings, HERO_PAGES } from "@/lib/site-settings";
import { HeroImageField } from "@/components/dashboard/HeroImageField";
import { saveHeroSettings } from "../actions";
import { SafeForm } from "../SafeForm";
import { SubmitButton } from "../SubmitButton";
import { DashHead } from "../ui";

export default async function TampilanPage() {
  await requireUser(["admin"]);
  const settings = await getSiteSettings();

  return (
    <>
      <DashHead
        title="Tampilan"
        text="Ganti gambar header tiap menu (dan foto profil di Tentang). Kosongkan = gradient / foto default. Disarankan landscape ±1600px untuk header."
      />

      <SafeForm action={saveHeroSettings} className="form-stack" persistKey="hero-settings">
        <div className="hero-set-grid">
          {HERO_PAGES.map((page) => (
            <HeroImageField
              key={page.key}
              name={page.key}
              label={page.label}
              href={page.href}
              initial={settings[page.key] ?? null}
            />
          ))}
        </div>
        <SubmitButton>Simpan tampilan</SubmitButton>
      </SafeForm>

      <section className="dash-card" style={{ marginTop: "1.25rem" }}>
        <h2 style={{ margin: "0 0 0.35rem", fontSize: "1.05rem" }}>Routing WhatsApp order</h2>
        <p style={{ margin: "0", color: "var(--muted)", fontSize: "0.88rem", lineHeight: 1.55 }}>
          Sudah tetap: order produk <strong>mitra</strong> langsung ke WhatsApp masing-masing
          penjual (nomor wajib di Profil). Produk <strong>official</strong> (tanpa owner) ke WA
          admin. Jika mitra belum isi WA, order diblokir dan produk tidak bisa disetujui.
        </p>
      </section>
    </>
  );
}
