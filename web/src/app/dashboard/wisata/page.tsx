import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { RichTextEditor } from "@/components/RichTextEditor";
import { deleteTrip, saveTrip } from "../actions";
import { SubmitButton } from "../SubmitButton";
import { SafeForm } from "../SafeForm";
import { SafeAction } from "../SafeAction";
import { GalleryField } from "@/components/dashboard/GalleryField";
import { DashHead, DashLoading, Empty } from "../ui";

export default function WisataAdminPage() {
  return (
    <Suspense fallback={<DashLoading />}>
      <Trips />
    </Suspense>
  );
}

type TripRow = {
  id: string;
  title: string;
  tag: string | null;
  duration: string | null;
  price_label: string | null;
  summary: string | null;
  image_url: string | null;
  gallery: string[] | null;
  published: boolean;
  sort: number;
};

async function Trips() {
  await requireUser(["admin"]);
  const supabase = await createClient();
  const { data } = await supabase
    .from("trips")
    .select("id, title, tag, duration, price_label, summary, image_url, gallery, published, sort")
    .order("sort");
  const trips = (data ?? []) as TripRow[];

  return (
    <>
      <DashHead title="Paket wisata" text="Tampil di halaman Wisata sesuai urutan." />
      <details className="dash-create">
        <summary>+ Tambah paket</summary>
        <TripForm />
      </details>
      {trips.length ? (
        <ul className="dash-list">
          {trips.map((t) => (
            <li key={t.id} className="dash-row dash-row--wrap">
              {t.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="dash-thumb" src={t.image_url} alt="" />
              ) : (
                <span className="dash-thumb dash-thumb--empty">{t.sort}</span>
              )}
              <div className="dash-row__main">
                <strong>{t.title}</strong>
                <small>{[t.tag, t.duration, t.price_label].filter(Boolean).join(" · ")}</small>
              </div>
              {t.published ? null : <span className="badge badge--pending">Disembunyikan</span>}
              <div className="dash-row__actions">
                <SafeAction
                  className="btn btn-danger btn-sm"
                  confirm={`Hapus paket "${t.title}"?`}
                  action={deleteTrip.bind(null, t.id)}
                >
                  Hapus
                </SafeAction>
              </div>
              <details className="dash-edit">
                <summary>Edit</summary>
                <TripForm trip={t} />
              </details>
            </li>
          ))}
        </ul>
      ) : (
        <Empty>Belum ada paket wisata.</Empty>
      )}
    </>
  );
}

function TripForm({ trip }: { trip?: TripRow }) {
  const persistKey = trip ? `trip-${trip.id}` : "trip-new";
  return (
    <SafeForm action={saveTrip} className="form-stack" persistKey={persistKey}>
      {trip ? <input type="hidden" name="id" value={trip.id} /> : null}
      <label>
        Nama paket
        <input name="title" defaultValue={trip?.title} required />
      </label>
      <div className="form-row">
        <label>
          Kategori
          <input name="tag" defaultValue={trip?.tag ?? ""} placeholder="Edukasi" />
        </label>
        <label>
          Durasi
          <input name="duration" defaultValue={trip?.duration ?? ""} placeholder="1–3 hari" />
        </label>
      </div>
      <div className="form-row">
        <label>
          Harga
          <input name="price_label" defaultValue={trip?.price_label ?? ""} placeholder="Mulai Rp 350rb/orang" />
        </label>
        <label>
          Urutan tampil
          <input name="sort" type="number" defaultValue={trip?.sort ?? 100} />
        </label>
      </div>
      <RichTextEditor
        key={trip ? `sum-${trip.id}` : "sum-new"}
        name="summary"
        label="Ringkasan / deskripsi"
        defaultValue={trip?.summary ?? ""}
      />
      <GalleryField
        persistKey={persistKey}
        initial={
          trip?.gallery?.length ? trip.gallery : trip?.image_url ? [trip.image_url] : []
        }
      />
      <label className="form-check">
        <input name="published" type="checkbox" defaultChecked={trip?.published ?? true} />
        Tampilkan di website
      </label>
      <SubmitButton>{trip ? "Simpan perubahan" : "Tambah paket"}</SubmitButton>
    </SafeForm>
  );
}
