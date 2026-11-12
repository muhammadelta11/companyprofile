"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SITE, waLink } from "@/data/site";
import { AccountLink } from "./AccountLink";
import { Icon } from "./Icon";

const LINKS = [
  { href: "/layanan", label: "Layanan" },
  { href: "/market", label: "Market" },
  { href: "/wisata", label: "Wisata" },
  { href: "/game", label: "Game" },
  { href: "/proyek", label: "Proyek" },
  { href: "/tentang", label: "Tentang" },
  { href: "/gabung", label: "Gabung" },
  { href: "/masukan", label: "Masukan" },
];

export function SiteHeader({ onOpenDelta }: { onOpenDelta?: () => void }) {
  const path = usePathname();
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link href="/" className="brand">
          <strong>{SITE.brand}</strong>
          <span className="brand-pill">{SITE.tagline}</span>
        </Link>

        <nav className="nav-links" aria-label="Utama">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={path === l.href ? "is-active" : undefined}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="header-actions">
          <button type="button" className="btn-delta btn-delta--ask" onClick={onOpenDelta}>
            Tanya Delta
          </button>
          <AccountLink />
          <a
            className="nav-wa"
            href={waLink("Halo Mas'ud, saya dari masudeltamamy.com")}
            target="_blank"
            rel="noopener noreferrer"
            title={SITE.waDisplay}
            aria-label={`WhatsApp ${SITE.waDisplay}`}
          >
            <Icon name="chat" size={18} />
            <span className="btn-label">WA</span>
            <span className="nav-wa__num">{SITE.waDisplay}</span>
          </a>
        </div>
      </div>
    </header>
  );
}
