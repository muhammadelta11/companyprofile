import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { AppPage } from "@/components/AppPage";
import { ItemGallery } from "@/components/ItemGallery";
import { JsonLd } from "@/components/JsonLd";
import { RichHtml } from "@/components/RichHtml";
import { ShareBar } from "@/components/ShareBar";
import { mergeGallery } from "@/lib/gallery";
import { getProject, getProjects } from "@/lib/content";
import {
  breadcrumbJsonLd,
  imageObjectsJsonLd,
  pageMetadata,
  plainText,
} from "@/lib/seo";
import { waLink } from "@/data/site";

type Props = { params: Promise<{ id: string }> };

const CATEGORY_LABEL: Record<string, string> = {
  web: "Web",
  mobile: "Mobile",
  research: "Riset",
};

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) return { title: "Proyek" };
  const gallery = mergeGallery(project.cover_url, project.gallery);
  return pageMetadata({
    title: project.title,
    description:
      project.summary ||
      `Proyek ${project.title} — portfolio Mas'ud El-Tamamy.`,
    path: `/proyek/${project.id}`,
    image: project.cover_url,
    images: gallery,
  });
}

export async function generateStaticParams() {
  const projects = await getProjects();
  return projects.map((p) => ({ id: p.id }));
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

export default function ProyekDetailPage({ params }: Props) {
  return (
    <Suspense fallback={<DetailFallback />}>
      <ProyekDetail params={params} />
    </Suspense>
  );
}

async function ProyekDetail({ params }: Props) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  const all = await getProjects();
  const related = all
    .filter((p) => p.id !== project.id && p.category === project.category)
    .slice(0, 4);
  const relatedFallback =
    related.length > 0
      ? related
      : all.filter((p) => p.id !== project.id).slice(0, 4);

  const images = mergeGallery(project.cover_url, project.gallery);
  const category = CATEGORY_LABEL[project.category] ?? project.category;
  const path = `/proyek/${project.id}`;

  return (
    <AppPage>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "CreativeWork",
            name: project.title,
            description: plainText(project.summary, 300) || project.title,
            ...(images.length ? { image: images } : {}),
            ...(project.link ? { url: project.link } : {}),
            genre: category,
          },
          breadcrumbJsonLd([
            { name: "Beranda", path: "/" },
            { name: "Proyek", path: "/proyek" },
            { name: project.title, path },
          ]),
          ...imageObjectsJsonLd(images, project.title, path),
        ]}
      />

      <div className="apage-body detail">
        <p className="detail__crumb">
          <Link href="/proyek">Proyek</Link>
          <span>/</span>
          <span>{project.title}</span>
        </p>

        {images.length ? (
          <ItemGallery images={images} alt={project.title} />
        ) : (
          <div className="detail__media detail__media--fisik">
            <div className="detail__art">
              <span>{project.tag ?? category}</span>
              <strong>{project.title}</strong>
            </div>
          </div>
        )}

        <div className="detail__info">
          <div className="detail__tags">
            <span>{category}</span>
            {project.tag ? <span>{project.tag}</span> : null}
          </div>
          <h1>{project.title}</h1>

          <RichHtml html={project.summary} className="rich-html detail__lead" />

          <ul className="detail__list">
            <li>Kategori: {category}</li>
            {project.tag ? <li>Fokus: {project.tag}</li> : null}
            {project.link ? <li>Demo / situs live tersedia</li> : <li>Dokumentasi portfolio internal</li>}
            <li>Konsultasi proyek serupa via WhatsApp</li>
          </ul>

          <div className="detail__actions">
            {project.link ? (
              <a
                className="btn btn-teal"
                href={project.link}
                target="_blank"
                rel="noopener noreferrer"
              >
                Buka proyek live
              </a>
            ) : (
              <a
                className="btn btn-teal"
                href={waLink(
                  `Halo Mas'ud, saya tertarik proyek mirip: ${project.title}. Bisa diskusi?`
                )}
                target="_blank"
                rel="noopener noreferrer"
              >
                Diskusi via WA
              </a>
            )}
            <Link className="btn btn-outline" href="/proyek">
              Semua proyek
            </Link>
            <ShareBar
              title={project.title}
              path={path}
              text={`Lihat proyek ${project.title} di portfolio Mas'ud El-Tamamy`}
            />
          </div>
        </div>

        {relatedFallback.length ? (
          <section className="detail__related">
            <h2>Proyek terkait</h2>
            <div className="pj__grid">
              {relatedFallback.map((p) => (
                <Link
                  key={p.id}
                  href={`/proyek/${p.id}`}
                  className="pj-card pj-card--compact"
                >
                  <div className="pj-card__media">
                    {p.cover_url ? (
                      <Image
                        src={p.cover_url}
                        alt={p.title}
                        width={400}
                        height={280}
                        sizes="160px"
                      />
                    ) : (
                      <span className="pj-card__fallback">
                        {p.title.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                    <span className="pj-card__cat">{p.category}</span>
                  </div>
                  <div className="pj-card__body">
                    {p.tag ? <span className="pj-card__tag">{p.tag}</span> : null}
                    <h3>{p.title}</h3>
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
