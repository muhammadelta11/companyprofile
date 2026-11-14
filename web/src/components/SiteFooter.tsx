import Link from "next/link";
import { SITE, waLink } from "@/data/site";

const LINKS = [
  { href: "/layanan", label: "Layanan" },
  { href: "/market", label: "Market" },
  { href: "/wisata", label: "Wisata" },
  { href: "/belajar", label: "Belajar" },
  { href: "/game", label: "Game" },
  { href: "/proyek", label: "Proyek" },
  { href: "/tentang", label: "Tentang" },
  { href: "/gabung", label: "Gabung" },
] as const;

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <div className="site-footer__brand">
          <img src="/icon.svg" alt="" width={28} height={28} />
          <div>
            <strong>{SITE.brand}</strong>
            <span>{SITE.tagline}</span>
          </div>
        </div>

        <nav className="site-footer__nav" aria-label="Footer">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href}>
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="site-footer__meta">
          <a href={waLink(`Halo dari ${SITE.domain}`)} target="_blank" rel="noopener noreferrer">
            WA {SITE.waDisplay}
          </a>
          <span>© 2026 {SITE.domain}</span>
        </div>
      </div>
    </footer>
  );
}
