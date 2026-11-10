import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { processUploadImage } from "@/lib/image";
import { createClient } from "@/lib/supabase/server";

/**
 * Upload gambar untuk TinyMCE (deskripsi produk/layanan/wisata/proyek).
 * Hanya admin & mitra aktif. Hasil: URL publik Supabase Storage.
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "mitra")) {
    return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });
  }
  if (user.role === "mitra" && user.status !== "active") {
    return NextResponse.json({ error: "Akun mitra belum diverifikasi." }, { status: 403 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Body tidak valid." }, { status: 400 });
  }

  const file = form.get("file") ?? form.get("image");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "File gambar wajib." }, { status: 400 });
  }

  try {
    const processed = await processUploadImage(file);
    const supabase = await createClient();
    const path = `${user.id}/rte/${crypto.randomUUID()}.${processed.ext}`;
    const { error } = await supabase.storage.from("media").upload(path, processed.buffer, {
      contentType: processed.contentType,
      upsert: false,
      cacheControl: "31536000",
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    const location = supabase.storage.from("media").getPublicUrl(path).data.publicUrl;
    // Format yang diharapkan TinyMCE images_upload_url / handler
    return NextResponse.json({ location });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Upload gagal.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
