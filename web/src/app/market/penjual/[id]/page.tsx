import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { AppPage } from "@/components/AppPage";
import { OrderLink } from "@/components/OrderLink";
import { ShareBar } from "@/components/ShareBar";
import { getProductsBySeller, getPublicSeller } from "@/lib/content";
import { sellerInitials, sellerLabel } from "@/lib/product";
import { pageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const seller = await getPublicSeller(id);
  if (!seller) return { title: "Penjual" };
  const name = seller.full_name?.trim() || (seller.kind === "official" ? "Official" : "Mitra");
  const products = await getProductsBySeller(id);
  const cover = products.find((p) => p.image_url)?.image_url ?? null;
  return pageMetadata({
    title: `${name} · Market`,
    description: `Etalase ${name} di Market Mas'ud El-Tamamy — ${seller.productCount} produk. Order via WhatsApp.`,
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

  const products = await getProductsBySeller(id);
  const name =
    seller.full_name?.trim() ||
    (seller.kind === "official" ? "Mas'ud El-Tamamy" : "Mitra terverifikasi");
  const initials = sellerInitials(name) || "M";

  return (
    <AppPage>
      <div className="apage-body detail">
        <p className="detail__crumb">
          <Link href="/market">Market</Link>
          <span>/</span>
          <span>Penjual</span>
        </p>

        <header className="mk-seller mk-seller--profile">
          <div className="mk-seller__avatar mk-seller__avatar--lg" aria-hidden="true">
            {initials}
          </div>
          <div className="mk-seller__meta">
            <span className="mk-seller__eyebrow">
              {seller.kind === "official" ? "Toko official" : "Mitra terverifikasi"}
            </span>
            <h1 className="mk-seller__name mk-seller__name--lg">{name}</h1>
            <small>
              {[
                seller.kind === "official" ? "Official brand" : "Terverifikasi",
                seller.city,
                `${seller.productCount} produk`,
              ]
                .filter(Boolean)
                .join(" · ")}
            </small>
            <div className="mk-seller__actions">
              <ShareBar
                title={name}
                path={`/market/penjual/${id}`}
                text={`Lihat etalase ${name} di Market Mas'ud El-Tamamy`}
              />
            </div>
          </div>
        </header>

        <p className="mk-seller__blurb">
          {seller.kind === "official"
            ? "Produk official dari Mas'ud El-Tamamy. Order dikonfirmasi via WhatsApp."
            : "Etalase mitra di Market. Cek detail produk, lalu order via WhatsApp."}
        </p>

        {products.length ? (
          <section className="detail__related" style={{ marginTop: "0.25rem" }}>
            <h2>Semua produk</h2>
            <div className="mk__grid">
              {products.map((p) => (
                <article key={p.id} className={`mk-card mk-card--compact mk-card--${p.kind}`}>
                  <Link href={`/market/${p.id}`} className="mk-card__media">
                    {p.image_url ? (
                      <Image
                        src={p.image_url}
                        alt={p.title}
                        width={400}
                        height={300}
                        sizes="160px"
                      />
                    ) : (
                      <span className="mk-card__art" aria-hidden="true">
                        <strong>{p.kind === "fisik" ? "Fisik" : "Digital"}</strong>
                        <small>{p.badge ?? "Market"}</small>
                      </span>
                    )}
                    {p.badge ? <span className="mk-card__badge">{p.badge}</span> : null}
                  </Link>
                  <div className="mk-card__body">
                    <h3>
                      <Link href={`/market/${p.id}`}>{p.title}</Link>
                    </h3>
                    <p className="mk-card__seller">{sellerLabel(p)}</p>
                    <div className="mk-card__foot">
                      <strong>{p.price_label ?? "Hubungi WA"}</strong>
                      <OrderLink
                        className="btn btn-teal mk-card__buy"
                        productId={p.id}
                        title={p.title}
                        priceLabel={p.price_label}
                        shippingMode={p.shipping_mode}
                        serviceArea={p.service_area}
                        kind={p.kind}
                      >
                        Order
                      </OrderLink>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : (
          <p className="dash-notice">Belum ada produk tayang dari penjual ini.</p>
        )}

        <div className="detail__actions" style={{ marginTop: "0.75rem" }}>
          <Link className="btn btn-outline" href="/market">
            Kembali ke Market
          </Link>
        </div>
      </div>
    </AppPage>
  );
}
