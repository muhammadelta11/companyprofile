import Image from "next/image";
import Link from "next/link";
import type { ProductItem, ProjectItem, TripItem } from "@/lib/content";
import { htmlToPlain } from "@/lib/html";
import { SITE, waLink } from "@/data/site";
import { Icon } from "@/components/Icon";
import { AskDeltaRow } from "./AskDeltaRow";

type Props = {
  products: ProductItem[];
  trips: TripItem[];
  projects: ProjectItem[];
};

function Rail({
  title,
  href,
  more,
  children,
}: {
  title: string;
  href: string;
  more: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mhome-rail">
      <div className="mhome-rail__head">
        <h2>{title}</h2>
        <Link href={href}>{more}</Link>
      </div>
      <div className="mhome-rail__scroller">{children}</div>
    </section>
  );
}

export function HomeRails({ products, trips, projects }: Props) {
  return (
    <div className="mhome-feed">
      <Rail title="Dari Market" href="/market" more="Semua">
        {products.map((p) => (
          <Link key={p.id} className="mhome-card" href={`/market/${p.id}`}>
            <span className="mhome-card__media">
              {p.image_url ? (
                <Image src={p.image_url} alt="" width={240} height={160} sizes="120px" />
              ) : (
                <span className="mhome-card__ph" aria-hidden="true" />
              )}
            </span>
            <span className="mhome-card__body">
              {p.badge ? <em>{p.badge}</em> : null}
              <strong>{p.title}</strong>
              <small>{p.price_label || (p.kind === "digital" ? "Digital" : "Fisik")}</small>
            </span>
          </Link>
        ))}
        <Link className="mhome-card mhome-card--more" href="/market">
          Semua →
        </Link>
      </Rail>

      <Rail title="Paket wisata" href="/wisata" more="Semua">
        {trips.map((t) => (
          <Link key={t.id} className="mhome-card" href={`/wisata/${t.id}`}>
            <span className="mhome-card__media mhome-card__media--trip">
              {t.image_url ? (
                <Image src={t.image_url} alt="" width={240} height={160} sizes="120px" />
              ) : (
                <span className="mhome-card__ph mhome-card__ph--trip" aria-hidden="true" />
              )}
            </span>
            <span className="mhome-card__body">
              {t.tag ? <em>{t.tag}</em> : null}
              <strong>{t.title}</strong>
              <small>{t.duration || "Mbarep Tour"}</small>
            </span>
          </Link>
        ))}
      </Rail>

      {projects.length ? (
        <Rail title="Karya pilihan" href="/proyek" more="Semua">
          {projects.map((p) => (
            <Link key={p.id} className="mhome-card mhome-card--work" href={`/proyek/${p.id}`}>
              <span className="mhome-card__media mhome-card__media--work">
                {p.cover_url ? (
                  <Image src={p.cover_url} alt={p.title} width={280} height={180} sizes="140px" />
                ) : (
                  <span className="mhome-card__ph" aria-hidden="true" />
                )}
              </span>
              <span className="mhome-card__body">
                {p.tag ? <em>{p.tag}</em> : null}
                <strong>{p.title}</strong>
                {p.summary ? <small>{htmlToPlain(p.summary, 64)}</small> : null}
              </span>
            </Link>
          ))}
        </Rail>
      ) : null}

      <div className="mhome-stack">
        <AskDeltaRow />
        <a
          className="mhome-wa"
          href={waLink("Halo dari website Mas'ud El-Tamamy — saya ingin tanya bisnis/produk.")}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span>
            <strong>Chat WhatsApp</strong>
            <small>{SITE.waDisplay}</small>
          </span>
          <span className="mhome-wa__go" aria-hidden="true">↗</span>
        </a>
        <Link className="mhome-about" href="/tentang">
          <Image
            src="/portrait.jpg"
            alt=""
            width={72}
            height={72}
            sizes="48px"
            className="mhome-about__photo"
          />
          <span>
            <strong>Di balik brand</strong>
            <small>Profil founder → Tentang</small>
          </span>
          <span className="mhome-about__go" aria-hidden="true">→</span>
        </Link>
        <Link className="mhome-feedback" href="/masukan">
          <span className="mhome-feedback__icon" aria-hidden="true">
            <Icon name="mail" size={18} />
          </span>
          <span>
            <strong>Kirim masukan</strong>
            <small>Lapor bug, usulan, atau keluhan</small>
          </span>
          <span className="mhome-feedback__go" aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  );
}
