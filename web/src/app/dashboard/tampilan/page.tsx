import { requireUser } from "@/lib/auth";
import { getOrderWaMode, getSiteSettings, HERO_PAGES } from "@/lib/site-settings";
import { HeroImageField } from "@/components/dashboard/HeroImageField";
import { saveHeroSettings, saveOrderWaMode } from "../actions";
import { SafeForm } from "../SafeForm";
import { SubmitButton } from "../SubmitButton";
import { DashHead } from "../ui";

export default async function TampilanPage() {
  await requireUser(["admin"]);
  const [settings, waMode] = await Promise.all([getSiteSettings(), getOrderWaMode()]);

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
        <p style={{ margin: "0 0 0.85rem", color: "var(--muted)", fontSize: "0.88rem" }}>
          Default aman: semua order masuk WA admin dulu (filter spam), lalu diteruskan ke mitra.
          Mode seller mengarahkan langsung ke nomor mitra bila sudah diisi.
        </p>
        <SafeForm action={saveOrderWaMode} className="form-stack" persistKey="order-wa-mode">
          <fieldset className="join-roles join-roles--two" style={{ border: 0, padding: 0, margin: 0 }}>
            <legend className="sr-only">Mode WA order</legend>
            <label className={`join-role${waMode === "admin" ? " is-active" : ""}`}>
              <input
                type="radio"
                name="order_wa_mode"
                value="admin"
                defaultChecked={waMode === "admin"}
                style={{ position: "absolute", opacity: 0, pointerEvents: "none" }}
              />
              <strong>WA Admin saja</strong>
              <span>Semua order ke nomor official. Mitra tidak diganggu spam.</span>
            </label>
            <label className={`join-role${waMode === "seller" ? " is-active" : ""}`}>
              <input
                type="radio"
                name="order_wa_mode"
                value="seller"
                defaultChecked={waMode === "seller"}
                style={{ position: "absolute", opacity: 0, pointerEvents: "none" }}
              />
              <strong>Langsung ke mitra</strong>
              <span>Order mitra ke WA penjual (fallback admin jika nomor kosong).</span>
            </label>
          </fieldset>
          <SubmitButton>Simpan routing WA</SubmitButton>
        </SafeForm>
      </section>
    </>
  );
}
