import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { AppPage } from "@/components/AppPage";
import { MarketCatalog } from "@/components/market/MarketCatalog";
import { ShareBar } from "@/components/ShareBar";
import { SITE } from "@/data/site";
import { getCurrentUser } from "@/lib/auth";
import { getProductsBySeller, getPublicSeller } from "@/lib/content";
import { sellerInitials, storeDisplayName } from "@/lib/product";
import { hasSellerCredentials } from "@/lib/seller-creds";
import { pageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const seller = await getPublicSeller(id);
  if (!seller) return { title: "Penjual" };
  const name = storeDisplayName(seller);
  const products = await getProductsBySeller(id);
  const cover = products.find((p) => p.image_url)?.image_url ?? null;
  const desc =
    seller.tagline?.trim() ||
    seller.bio?.trim() ||
    `Etalase ${name} di Market ${SITE.brand} — ${seller.productCount} produk. Order via WhatsApp.`;
  return pageMetadata({
    title: `${name} · Market`,
    description: desc.slice(0, 160),
    path: `/market/penjual/${id}`,
    image: cover,
  });
}

function Fallback() {
  return (
    <AppPage>
      <div className="apage-body detail detail--skeleton" aria-hidden="true">
        <div className="detail__skel detail__skel--crumb" />
        <div className="detail__skel detail__skel--line" />
        <div className="detail__skel detail__skel--media" />
      </div>
    </AppPage>
  );
}

export default function PenjualPage({ params }: Props) {
  return (
    <Suspense fallback={<Fallback />}>
      <PenjualDetail params={params} />
    </Suspense>
  );
}

async function PenjualDetail({ params }: Props) {
  const { id } = await params;
  const seller = await getPublicSeller(id);
  if (!seller) notFound();

  const [products, user] = await Promise.all([getProductsBySeller(id), getCurrentUser()]);
  const canChat = Boolean(user && user.status !== "suspended");
  const name = storeDisplayName(seller);
  const initials = sellerInitials(name) || "M";
  const covers = products.map((p) => p.image_url).filter(Boolean).slice(0, 3) as string[];
  const tagline =
    seller.tagline?.trim() ||
    (seller.kind === "official"
      ? SITE.slogan
      : "Etalase mitra terverifikasi di Market Mas'ud El-Tamamy.");
  const bio =
    seller.bio?.trim() ||
    (seller.kind === "official"
      ? "Produk official dari Mas'ud El-Tamamy. Detail jelas, order dikonfirmasi via WhatsApp."
      : null);
  const metaParts = [
    seller.kind === "official" ? "Toko official" : "Mitra terverifikasi",
    seller.city?.trim() || null,
    `${seller.productCount} produk`,
  ].filter(Boolean);

  return (
    <AppPage>
      <div className="apage-body mk-store">
        <p className="detail__crumb">
          <Link href="/market">Market</Link>
          <span>/</span>
          <span>{name}</span>
        </p>

        <header
          className={`mk-store__hero${seller.kind === "official" ? " is-official" : " is-mitra"}`}
        >
          <div className="mk-store__stage" aria-hidden="true">
            {covers.length ? (
              <div className={`mk-store__mosaic mk-store__mosaic--${Math.min(covers.length, 3)}`}>
                {covers.map((src, i) => (
                  <div key={`${src}-${i}`} className="mk-store__shot">
                    <Image src={src} alt="" fill sizes="(max-width:719px) 100vw, 50vw" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="mk-store__mono">{initials}</div>
            )}
            <div className="mk-store__veil" />
          </div>

          <div className="mk-store__brand">
            <p className="mk-store__eyebrow">
              {seller.kind === "official" ? "Official store" : "Mitra Market"}
            </p>
            <div className="mk-store__identity">
              <span className="mk-store__mark" aria-hidden="true">
                {initials}
              </span>
              <div>
                <h1 className="mk-store__name">{name}</h1>
                <p className="mk-store__tagline">{tagline}</p>
              </div>
            </div>
            <p className="mk-store__meta">{metaParts.join(" · ")}</p>
            <div className="mk-store__cta">
              <a className="btn btn-teal" href="#etalase">
                Lihat etalase
              </a>
              <ShareBar
                title={name}
                path={`/market/penjual/${id}`}
                text={`Lihat etalase ${name} di Market ${SITE.brand}`}
              />
            </div>
          </div>
        </header>

        {bio ? (
          <section className="mk-store__about" aria-labelledby="mk-store-about">
            <h2 id="mk-store-about">Tentang</h2>
            <p>{bio}</p>
          </section>
        ) : null}

        {hasSellerCredentials(seller.credentials) ? (
          <section className="mk-store__legal" aria-labelledby="mk-store-legal">
            <div className="mk-store__shelf-head">
              <h2 id="mk-store-legal">Legalitas & kepercayaan</h2>
              <p>Data usaha resmi yang diisi penjual. Verifikasi mandiri tetap disarankan.</p>
            </div>
            {seller.credentials?.legal_name ||
            seller.credentials?.legal_form ||
            seller.credentials?.business_reg_no ||
            seller.credentials?.issued_by ||
            seller.credentials?.tax_status ? (
              <dl className="mk-store__facts">
                {seller.credentials?.legal_name ? (
                  <div>
                    <dt>Nama usaha resmi</dt>
                    <dd>{seller.credentials.legal_name}</dd>
                  </div>
                ) : null}
                {seller.credentials?.legal_form ? (
                  <div>
                    <dt>Bentuk usaha</dt>
                    <dd>{seller.credentials.legal_form}</dd>
                  </div>
                ) : null}
                {seller.credentials?.business_reg_no ? (
                  <div>
                    <dt>No. izin</dt>
                    <dd>{seller.credentials.business_reg_no}</dd>
                  </div>
                ) : null}
                {seller.credentials?.issued_by ? (
                  <div>
                    <dt>Diterbitkan oleh</dt>
                    <dd>{seller.credentials.issued_by}</dd>
                  </div>
                ) : null}
                {seller.credentials?.tax_status ? (
                  <div>
                    <dt>Status pajak</dt>
                    <dd>{seller.credentials.tax_status}</dd>
                  </div>
                ) : null}
              </dl>
            ) : null}
            {seller.credentials?.brand_certs?.length ? (
              <ul className="mk-store__certs">
                {seller.credentials.brand_certs.map((c) => (
                  <li key={`${c.title}-${c.issuer}-${c.year}`}>
                    <strong>{c.title}</strong>
                    <span>
                      {[c.issuer, c.year].filter(Boolean).join(" · ") || "Sertifikat brand"}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ) : null}

        <section id="etalase" className="mk-store__shelf">
          <div className="mk-store__shelf-head">
            <h2>Etalase</h2>
            <p>
              {products.length
                ? `${products.length} produk siap order via WhatsApp`
                : "Belum ada produk tayang"}
            </p>
          </div>

          {products.length ? (
            <MarketCatalog
              products={products}
              canChat={canChat}
              viewerId={user?.id ?? null}
              viewerRole={user?.role ?? null}
            />
          ) : (
            <p className="mk-store__empty">Belum ada produk tayang dari etalase ini.</p>
          )}
        </section>

        <div className="mk-store__foot">
          <Link className="btn btn-outline" href="/market">
            Kembali ke Market
          </Link>
        </div>
      </div>
    </AppPage>
  );
}
