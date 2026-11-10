import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { RichTextEditor } from "@/components/RichTextEditor";
import { deleteService, saveService } from "../actions";
import { SubmitButton } from "../SubmitButton";
import { SafeForm } from "../SafeForm";
import { SafeAction } from "../SafeAction";
import { Badge, DashHead, DashLoading, Empty } from "../ui";

export default function LayananDashPage() {
  return (
    <Suspense fallback={<DashLoading />}>
      <Services />
    </Suspense>
  );
}

type ServiceRow = {
  id: string;
  title: string;
  blurb: string | null;
  items: string[] | null;
  accent: string;
  published: boolean;
  sort: number;
};

async function Services() {
  await requireUser(["admin"]);
  const supabase = await createClient();
  const { data } = await supabase
    .from("services")
    .select("id, title, blurb, items, accent, published, sort")
    .order("sort")
    .order("created_at", { ascending: false });
  const services = (data ?? []) as ServiceRow[];

  return (
    <>
      <DashHead
        title="Layanan"
        text="Kelola jalur layanan di website. Deskripsi memakai editor teks kaya (TinyMCE)."
      />

      <details className="dash-create">
        <summary>+ Tambah layanan</summary>
        <ServiceForm />
      </details>

      {services.length ? (
        <ul className="dash-list">
          {services.map((s) => (
            <li key={s.id} className="dash-row dash-row--product">
              <div className="dash-row__top dash-row__top--text">
                <div className="dash-row__main">
                  <strong>{s.title}</strong>
                  <small>
                    {[s.accent, `${(s.items ?? []).length} poin`].join(" · ")}
                  </small>
                </div>
              </div>
              <div className="dash-row__foot">
                <Badge value={s.published ? "approved" : "pending"} />
                <div className="dash-row__actions">
                  <SafeAction
                    className="btn btn-danger btn-sm dash-row__danger"
                    confirm={`Hapus "${s.title}"?`}
                    action={deleteService.bind(null, s.id)}
                  >
                    Hapus
                  </SafeAction>
                </div>
              </div>
              <details className="dash-edit">
                <summary>Edit</summary>
                <ServiceForm service={s} />
              </details>
            </li>
          ))}
        </ul>
      ) : (
        <Empty>
          Belum ada layanan di database. Jalankan SQL seed di schema.sql, atau tambah manual.
        </Empty>
      )}
    </>
  );
}

function ServiceForm({ service }: { service?: ServiceRow }) {
  return (
    <SafeForm
      action={saveService}
      className="form-stack"
      persistKey={service ? `service-${service.id}` : "service-new"}
    >
      {service ? <input type="hidden" name="id" value={service.id} /> : null}
      <label>
        Nama layanan
        <input name="title" defaultValue={service?.title} required />
      </label>
      <div className="form-row">
        <label>
          Aksen warna
          <select name="accent" defaultValue={service?.accent ?? "teal"}>
            <option value="teal">Biru</option>
            <option value="orange">Sky</option>
            <option value="ink">Indigo</option>
          </select>
        </label>
        <label>
          Urutan tampil
          <input name="sort" type="number" defaultValue={service?.sort ?? 100} />
        </label>
      </div>
      <RichTextEditor
        key={service ? `blurb-${service.id}` : "blurb-new"}
        name="blurb"
        label="Deskripsi"
        defaultValue={service?.blurb ?? ""}
      />
      <label>
        Poin layanan (satu baris per poin)
        <textarea
          name="items"
          rows={5}
          defaultValue={(service?.items ?? []).join("\n")}
          placeholder={"Website & company profile\nSistem informasi"}
        />
      </label>
      <label className="form-check">
        <input name="published" type="checkbox" defaultChecked={service?.published ?? true} />
        Tampilkan di website
      </label>
      <SubmitButton>{service ? "Simpan perubahan" : "Tambah layanan"}</SubmitButton>
    </SafeForm>
  );
}
