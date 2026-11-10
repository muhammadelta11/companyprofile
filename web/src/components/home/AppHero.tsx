import Link from "next/link";
import { SITE, waLink } from "@/data/site";

/** Hero ringkas — brand + 1 kalimat + CTA. */
export function AppHero() {
  return (
    <section className="mhome-hero" aria-label="Pembuka">
      <p className="mhome-hero__kicker">{SITE.tagline}</p>
      <h1 className="mhome-hero__title">{SITE.brand}</h1>
      <p className="mhome-hero__lead">
        Digital, market, dan wisata — order &amp; konsultasi di satu tempat.
      </p>
      <div className="mhome-hero__cta">
        <Link className="mhome-btn mhome-btn--primary" href="/market">
          Buka Market
        </Link>
        <a
          className="mhome-btn mhome-btn--ghost"
          href={waLink("Halo, saya ingin tanya layanan/produk dari Mas'ud El-Tamamy.")}
          target="_blank"
          rel="noopener noreferrer"
        >
          WhatsApp
        </a>
      </div>
    </section>
  );
}
