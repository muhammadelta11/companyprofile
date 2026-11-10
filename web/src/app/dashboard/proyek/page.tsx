import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { RichTextEditor } from "@/components/RichTextEditor";
import { deleteProject, saveProject } from "../actions";
import { SubmitButton } from "../SubmitButton";
import { SafeForm } from "../SafeForm";
import { SafeAction } from "../SafeAction";
import { GalleryField } from "@/components/dashboard/GalleryField";
import { DashHead, DashLoading, Empty } from "../ui";

export default function ProyekAdminPage() {
  return (
    <Suspense fallback={<DashLoading />}>
      <Projects />
    </Suspense>
  );
}

type ProjectRow = {
  id: string;
  title: string;
  category: string;
  tag: string | null;
  summary: string | null;
  link: string | null;
  cover_url: string | null;
  gallery: string[] | null;
  published: boolean;
  sort: number;
};

async function Projects() {
  await requireUser(["admin"]);
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("id, title, category, tag, summary, link, cover_url, gallery, published, sort")
    .order("sort");
  const projects = (data ?? []) as ProjectRow[];

  return (
    <>
      <DashHead title="Proyek" text="Portofolio di halaman Proyek dan 3 teratas (yang bergambar) di Home." />
      <details className="dash-create">
        <summary>+ Tambah proyek</summary>
        <ProjectForm />
      </details>
      {projects.length ? (
        <ul className="dash-list">
          {projects.map((p) => (
            <li key={p.id} className="dash-row dash-row--wrap">
              {p.cover_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="dash-thumb" src={p.cover_url} alt="" />
              ) : (
                <span className="dash-thumb dash-thumb--empty">{p.title.slice(0, 2)}</span>
              )}
              <div className="dash-row__main">
                <strong>{p.title}</strong>
                <small>{[p.category, p.tag, p.link].filter(Boolean).join(" · ")}</small>
              </div>
              {p.published ? null : <span className="badge badge--pending">Disembunyikan</span>}
              <div className="dash-row__actions">
                <SafeAction
                  className="btn btn-danger btn-sm"
                  confirm={`Hapus proyek "${p.title}"?`}
                  action={deleteProject.bind(null, p.id)}
                >
                  Hapus
                </SafeAction>
              </div>
              <details className="dash-edit">
                <summary>Edit</summary>
                <ProjectForm project={p} />
              </details>
            </li>
          ))}
        </ul>
      ) : (
        <Empty>Belum ada proyek.</Empty>
      )}
    </>
  );
}

function ProjectForm({ project }: { project?: ProjectRow }) {
  const persistKey = project ? `project-${project.id}` : "project-new";
  return (
    <SafeForm action={saveProject} className="form-stack" persistKey={persistKey}>
      {project ? <input type="hidden" name="id" value={project.id} /> : null}
      <label>
        Nama proyek
        <input name="title" defaultValue={project?.title} required />
      </label>
      <div className="form-row">
        <label>
          Kategori
          <select name="category" defaultValue={project?.category ?? "web"}>
            <option value="web">Web</option>
            <option value="mobile">Mobile</option>
            <option value="research">Riset</option>
          </select>
        </label>
        <label>
          Label
          <input name="tag" defaultValue={project?.tag ?? ""} placeholder="Company Profile" />
        </label>
      </div>
      <div className="form-row">
        <label>
          Link situs
          <input name="link" type="url" defaultValue={project?.link ?? ""} placeholder="https://" />
        </label>
        <label>
          Urutan tampil
          <input name="sort" type="number" defaultValue={project?.sort ?? 100} />
        </label>
      </div>
      <RichTextEditor
        key={project ? `psum-${project.id}` : "psum-new"}
        name="summary"
        label="Ringkasan / deskripsi"
        defaultValue={project?.summary ?? ""}
      />
      <GalleryField
        persistKey={persistKey}
        label="Galeri / sampul"
        initial={
          project?.gallery?.length
            ? project.gallery
            : project?.cover_url
              ? [project.cover_url]
              : []
        }
      />
      <label className="form-check">
        <input name="published" type="checkbox" defaultChecked={project?.published ?? true} />
        Tampilkan di website
      </label>
      <SubmitButton>{project ? "Simpan perubahan" : "Tambah proyek"}</SubmitButton>
    </SafeForm>
  );
}
