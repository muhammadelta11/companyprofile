import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { AppPage } from "@/components/AppPage";
import { ItemGallery } from "@/components/ItemGallery";
import { JsonLd } from "@/components/JsonLd";
import { mergeGallery } from "@/lib/gallery";
import { OrderLink } from "@/components/OrderLink";
import { ProductComments } from "@/components/market/ProductComments";
import { ProductViewBeacon } from "@/components/market/ProductViewBeacon";
import { RichHtml } from "@/components/RichHtml";
import { ShareBar } from "@/components/ShareBar";
import { productExtra } from "@/data/catalog-extra";
import { getCurrentUser } from "@/lib/auth";
import { getProductComments } from "@/lib/comments";
import { getProduct, getProducts } from "@/lib/content";
import { ServiceAreaMap } from "@/components/market/ServiceAreaMap";
import {
  hasMapArea,
  sellerHref,
  sellerInitials,
  sellerLabel,
  shippingLabel,
} from "@/lib/product";
import {
  breadcrumbJsonLd,
  imageObjectsJsonLd,
  pageMetadata,
  productJsonLd,
} from "@/lib/seo";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) return { title: "Produk" };
  const seller = sellerLabel(product);
  const gallery = mergeGallery(product.image_url, product.gallery);
  return pageMetadata({
    title: product.title,
    description:
      product.description ||
      `${product.title} dari ${seller} di Market Mas'ud El-Tamamy. Order via WhatsApp.`,
    path: `/market/${product.id}`,
    image: product.image_url,
    images: gallery,
  });
}

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((p) => ({ id: p.id }));
}

function DetailFallback() {
  return (
    <AppPage>
      <div className="apage-body detail detail--skeleton" aria-hidden="true">
        <div className="detail__skel detail__skel--crumb" />
        <div className="detail__skel detail__skel--media" />
        <div className="detail__skel detail__skel--line" />
        <div className="detail__skel detail__skel--line detail__skel--short" />
      </div>
    </AppPage>
  );
}

export default function MarketDetailPage({ params }: Props) {
  return (
    <Suspense fallback={<DetailFallback />}>
      <MarketDetail params={params} />
    </Suspense>
  );
}

async function MarketDetail({ params }: Props) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  const extra = productExtra(product.id, product.title);
  const ship = shippingLabel(
    product.shipping_mode,
    product.service_area,
    product.kind,
    product.area_radius_km
  );
  const highlights =
    extra?.highlights ??
    [
      product.kind === "fisik" ? "Produk fisik" : "Produk digital / jasa",
      `Penjual: ${sellerLabel(product)}`,
      `Pengiriman: ${ship}`,
      "Order: isi data singkat, lanjut chat WhatsApp (tanpa wajib login)",
      product.price_label ? `Harga: ${product.price_label}` : "Harga via konsultasi",
    ];

  const [all, comments, user] = await Promise.all([
    getProducts(),
    getProductComments(product.id),
    getCurrentUser(),
  ]);
  const fromSeller = product.owner_id
    ? all.filter((p) => p.owner_id === product.owner_id && p.id !== product.id)
    : all.filter((p) => !p.owner_id && p.id !== product.id);
  // Hanya produk penjual yang sama — jangan jatuh ke produk orang lain.
  const related = fromSeller.slice(0, 4);
  const sellerName = sellerLabel(product);
  const initials = sellerInitials(sellerName);
  const profileHref = sellerHref(product);
  const images = mergeGallery(product.image_url, product.gallery);
  const path = `/market/${product.id}`;

  return (
    <AppPage>
      <JsonLd
        data={[
          productJsonLd({
            id: product.id,
            title: product.title,
            description: product.description,
            image: product.image_url,
            images,
            priceLabel: product.price_label,
            kind: product.kind,
            sellerName,
          }),
          breadcrumbJsonLd([
            { name: "Beranda", path: "/" },
            { name: "Market", path: "/market" },
            { name: product.title, path },
          ]),
          ...imageObjectsJsonLd(images, product.title, path),
        ]}
      />
      <ProductViewBeacon productId={product.id} />
      <div className="apage-body detail">
        <p className="detail__crumb">
          <Link href="/market">Market</Link>
          <span>/</span>
          <span>{product.title}</span>
        </p>

        {images.length ? (
          <ItemGallery images={images} alt={product.title} />
        ) : (
          <div className={`detail__media detail__media--${product.kind}`}>
            <div className="detail__art">
              <span>{product.badge ?? product.kind}</span>
              <strong>{product.title}</strong>
            </div>
          </div>
        )}

        <div className="detail__info">
          <div className="detail__tags">
            {product.badge ? <span>{product.badge}</span> : null}
            <span>{product.kind}</span>
            <span>{product.owner_id ? "Mitra" : "Official"}</span>
          </div>
          <h1>{product.title}</h1>
          <p className="detail__price">{product.price_label ?? "Hubungi WA"}</p>
          <p className="detail__ship">{ship}</p>
          {hasMapArea(product) ? (
            <ServiceAreaMap
              lat={product.area_lat!}
              lng={product.area_lng!}
              radiusKm={product.area_radius_km && product.area_radius_km > 0 ? product.area_radius_km : 5}
              label={product.service_area}
            />
          ) : null}

          <Link href={profileHref} className="mk-seller mk-seller--link" aria-label={`Profil ${sellerName}`}>
            <div className="mk-seller__avatar" aria-hidden="true">
              {initials || "M"}
            </div>
            <div className="mk-seller__meta">
              <span className="mk-seller__eyebrow">
                {product.owner_id ? "Dijual oleh mitra" : "Toko official"}
              </span>
              <strong className="mk-seller__name">{sellerName}</strong>
              <small>
                {[
                  product.owner_id ? "Terverifikasi" : "Official brand",
                  product.owner?.city,
                  fromSeller.length ? `${fromSeller.length + 1} produk` : null,
                  "Lihat profil →",
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </small>
            </div>
          </Link>

          <RichHtml html={product.description} className="rich-html detail__lead" />

          <ul className="detail__list">
            {highlights.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>

          <div className="detail__actions">
            <OrderLink
              className="btn btn-teal"
              productId={product.id}
              title={product.title}
              priceLabel={product.price_label}
              shippingMode={product.shipping_mode}
              serviceArea={product.service_area}
              kind={product.kind}
            >
              Order via WhatsApp
            </OrderLink>
            <Link className="btn btn-outline" href="/market">
              Kembali
            </Link>
            <ShareBar
              title={product.title}
              path={path}
              text={`Cek produk ${product.title} di Market Mas'ud El-Tamamy`}
            />
          </div>
        </div>

        {related.length ? (
          <section className="detail__related">
            <div className="detail__related-head">
              <h2>
                {product.owner_id
                  ? `Produk lain dari ${sellerName}`
                  : "Produk official lainnya"}
              </h2>
              {fromSeller.length > related.length ? (
                <Link href={profileHref} className="detail__related-more">
                  Lihat semua
                </Link>
              ) : null}
            </div>
            <div className="mk__grid">
              {related.map((p) => (
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
                    <p className="mk-card__ship">
                      {shippingLabel(p.shipping_mode, p.service_area, p.kind, p.area_radius_km)}
                    </p>
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
        ) : null}

        <ProductComments
          productId={product.id}
          comments={comments}
          canComment={Boolean(user && user.status !== "suspended")}
          userName={user?.name}
        />
      </div>
    </AppPage>
  );
}
