import Link from "next/link";
import { SITE } from "@/data/site";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <strong>{SITE.brand}</strong>
          <p>
            Digital partner, market produk, dan wisata — satu ekosistem.
          </p>
        </div>
        <div className="footer-links">
          <Link href="/layanan">Layanan</Link>
          <Link href="/market">Market</Link>
          <Link href="/wisata">Wisata</Link>
          <Link href="/proyek">Proyek</Link>
          <Link href="/tentang">Tentang</Link>
          <Link href="/gabung">Gabung</Link>
          <Link href="/masukan">Masukan</Link>
        </div>
        <p className="footer-copy">
          © 2026 {SITE.brand} · {SITE.domain}
        </p>
      </div>
    </footer>
  );
}
