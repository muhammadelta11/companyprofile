import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { AppPage } from "@/components/AppPage";
import { ItemGallery } from "@/components/ItemGallery";
import { JsonLd } from "@/components/JsonLd";
import { ShareBar } from "@/components/ShareBar";
import { mergeGallery } from "@/lib/gallery";
import { RichHtml } from "@/components/RichHtml";
import { tripExtra } from "@/data/catalog-extra";
import { waLink } from "@/data/site";
import { getTrip, getTrips } from "@/lib/content";
import {
  absoluteUrl,
  breadcrumbJsonLd,
  imageObjectsJsonLd,
  pageMetadata,
  parseIdrPrice,
  plainText,
} from "@/lib/seo";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const trip = await getTrip(id);
  if (!trip) return { title: "Paket wisata" };
  const gallery = mergeGallery(trip.image_url, trip.gallery);
  return pageMetadata({
    title: trip.title,
    description:
      trip.summary ||
      `Paket wisata ${trip.title} bersama Mas'ud El-Tamamy. Konsultasi & booking via WhatsApp.`,
    path: `/wisata/${trip.id}`,
    image: trip.image_url,
    images: gallery,
  });
}

export async function generateStaticParams() {
  const trips = await getTrips();
  return trips.map((t) => ({ id: t.id }));
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

export default function WisataDetailPage({ params }: Props) {
  return (
    <Suspense fallback={<DetailFallback />}>
      <WisataDetail params={params} />
    </Suspense>
  );
}

async function WisataDetail({ params }: Props) {
  const { id } = await params;
  const trip = await getTrip(id);
  if (!trip) notFound();

  const extra = tripExtra(trip.id, trip.title);
  const includes =
    extra?.includes ??
    ["Konsultasi paket", "Penyesuaian jadwal", "Konfirmasi via WhatsApp", "Pendampingan rombongan"];

  const others = (await getTrips()).filter((t) => t.id !== trip.id).slice(0, 3);
  const images = mergeGallery(trip.image_url, trip.gallery);
  const path = `/wisata/${trip.id}`;
  const tripPrice = parseIdrPrice(trip.price_label);

  return (
    <AppPage>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "TouristTrip",
            name: trip.title,
            description: plainText(trip.summary, 300) || trip.title,
            url: absoluteUrl(path),
            ...(images.length ? { image: images } : {}),
            ...(trip.duration ? { itinerary: trip.duration } : {}),
            ...(trip.price_label
              ? {
                  offers: {
                    "@type": "Offer",
                    name: trip.price_label,
                    priceCurrency: "IDR",
                    url: absoluteUrl(path),
                    availability: "https://schema.org/InStock",
                    ...(tripPrice != null ? { price: tripPrice } : {}),
                  },
                }
              : {}),
          },
          breadcrumbJsonLd([
            { name: "Beranda", path: "/" },
            { name: "Wisata", path: "/wisata" },
            { name: trip.title, path },
          ]),
          ...imageObjectsJsonLd(images, trip.title, path),
        ]}
      />
      <div className="apage-body detail">
        <p className="detail__crumb">
          <Link href="/wisata">Wisata</Link>
          <span>/</span>
          <span>{trip.title}</span>
        </p>

        {images.length ? (
          <ItemGallery images={images} alt={trip.title} />
        ) : (
          <div className={`detail__media detail__media--trip tr-card--${extra?.tone ?? "sky"}`}>
            <div className="detail__art">
              <span>{trip.tag ?? "Trip"}</span>
              <strong>{trip.title}</strong>
            </div>
          </div>
        )}

        <div className="detail__info">
          <div className="detail__tags">
            {trip.tag ? <span>{trip.tag}</span> : null}
            {trip.duration ? <span>{trip.duration}</span> : null}
          </div>
          <h1>{trip.title}</h1>
          <p className="detail__price">{trip.price_label ?? "Custom quote via WA"}</p>
          <RichHtml html={trip.summary} className="rich-html detail__lead" />
          {extra?.ideal ? <p className="detail__ideal">Cocok untuk: {extra.ideal}</p> : null}

          <h2 className="detail__sub">Yang biasanya termasuk</h2>
          <ul className="detail__list">
            {includes.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <div className="detail__actions">
            <a
              className="btn btn-teal"
              href={waLink(
                `Halo, saya tertarik paket wisata: ${trip.title}. Mohon info detail & ketersediaan.`
              )}
              target="_blank"
              rel="noopener noreferrer"
            >
              Tanya paket via WA
            </a>
            <Link className="btn btn-outline" href="/wisata">
              Semua paket
            </Link>
            <ShareBar
              title={trip.title}
              path={path}
              text={`Cek paket wisata ${trip.title} dari Mas'ud El-Tamamy`}
            />
          </div>
        </div>

        {others.length ? (
          <section className="detail__related">
            <h2>Paket lain</h2>
            <div className="tr-grid tr-grid--compact">
              {others.map((t) => (
                <Link key={t.id} href={`/wisata/${t.id}`} className="tr-card tr-card--mini">
                  <div className="tr-card__body">
                    {t.tag ? <span className="tr-card__tag">{t.tag}</span> : null}
                    <h3>{t.title}</h3>
                    <span>{t.duration ?? "Fleksibel"}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </AppPage>
  );
}
