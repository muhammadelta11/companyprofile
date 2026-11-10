import Image from "next/image";
import Link from "next/link";
import { SITE, waLink } from "@/data/site";
import { DEFAULT_OG_IMAGE } from "@/lib/seo";

/** Hero beranda — banner utama full-bleed + brand + CTA. */
export function AppHero() {
  return (
    <section className="mhome-hero mhome-hero--visual" aria-label="Pembuka">
      <div className="mhome-hero__bleed">
        <Image
          src={DEFAULT_OG_IMAGE}
          alt="Banner utama Mas'ud El-Tamamy — Digital, Market, dan Paket Wisata"
          width={1200}
          height={630}
          priority
          sizes="100vw"
          className="mhome-hero__img"
        />
      </div>

      <div className="mhome-hero__panel">
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
            href={waLink(
              "Halo, saya ingin tanya layanan/produk dari Mas'ud El-Tamamy."
            )}
            target="_blank"
            rel="noopener noreferrer"
          >
            WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
