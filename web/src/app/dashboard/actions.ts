"use server";

import { refresh, updateTag } from "next/cache";
import { requireUser } from "@/lib/auth";
import { sanitizeRichHtml } from "@/lib/html";
import { createClient } from "@/lib/supabase/server";
import { processUploadImage } from "@/lib/image";

export type ActionResult = { error?: string };

type Supa = Awaited<ReturnType<typeof createClient>>;

function friendlyError(e: unknown) {
  const msg = e instanceof Error ? e.message : "Terjadi kesalahan.";
  if (/NEXT_REDIRECT|NEXT_HTTP_ERROR_FALLBACK/.test(msg)) throw e;
  if (/JWT|RLS|policy|permission denied|row-level|duplicate key|violates/i.test(msg)) {
    return "Aksi ditolak. Periksa hak akses atau data yang diisi.";
  }
  return msg;
}

async function act(work: () => Promise<void>): Promise<ActionResult> {
  try {
    await work();
    return {};
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e;
    return { error: friendlyError(e) };
  }
}

function text(fd: FormData, key: string, max = 500) {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function orNull(value: string) {
  return value === "" ? null : value;
}

/** Deskripsi/ringkasan dari TinyMCE — sanitasi + batas aman. */
function richText(fd: FormData, key: string, max = 20000) {
  const raw = text(fd, key, max);
  if (!raw) return null;
  const clean = sanitizeRichHtml(raw).slice(0, max);
  return clean === "" ? null : clean;
}

function pick<T extends string>(value: string, allowed: readonly T[], fallback: T): T {
  return (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

function check(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

const GALLERY_MAX = 8;

async function uploadOne(supabase: Supa, userId: string, file: File) {
  if (!(file instanceof File) || file.size === 0) return null;
  const processed = await processUploadImage(file);
  const path = `${userId}/${crypto.randomUUID()}.${processed.ext}`;
  const { error } = await supabase.storage.from("media").upload(path, processed.buffer, {
    contentType: processed.contentType,
    upsert: false,
    cacheControl: "31536000",
  });
  check(error);
  return supabase.storage.from("media").getPublicUrl(path).data.publicUrl;
}

/** Satu file cover lama (name=image) — tetap didukung. */
async function uploadImage(supabase: Supa, userId: string, fd: FormData) {
  const file = fd.get("image");
  if (!(file instanceof File) || file.size === 0) return null;
  return uploadOne(supabase, userId, file);
}

/** Galeri: URL yang dipertahankan (gallery_keep) + file baru (gallery). */
async function resolveGallery(supabase: Supa, userId: string, fd: FormData) {
  let kept: string[] = [];
  try {
    const raw = text(fd, "gallery_keep", 8000);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    if (Array.isArray(parsed)) {
      kept = parsed.filter((u): u is string => typeof u === "string" && /^https?:\/\//.test(u));
    }
  } catch {
    kept = [];
  }

  const incoming = fd.getAll("gallery").filter((f): f is File => f instanceof File && f.size > 0);
  const room = Math.max(0, GALLERY_MAX - kept.length);
  const uploaded: string[] = [];
  for (const file of incoming.slice(0, room)) {
    const url = await uploadOne(supabase, userId, file);
    if (url) uploaded.push(url);
  }

  return [...kept, ...uploaded].slice(0, GALLERY_MAX);
}

// ── Produk ────────────────────────────────────────────────────

export async function saveProduct(fd: FormData): Promise<ActionResult> {
  return act(async () => {
      const user = await requireUser(["admin", "mitra"]);
      if (user.status !== "active") throw new Error("Akun mitra belum diverifikasi.");
      const supabase = await createClient();
      const id = text(fd, "id");
      const gallery = await resolveGallery(supabase, user.id, fd);
      const cover = (await uploadImage(supabase, user.id, fd)) ?? gallery[0] ?? null;

      const kind = pick(text(fd, "kind"), ["fisik", "digital"] as const, "fisik");
      const shipping_mode = pick(
        text(fd, "shipping_mode"),
        ["pickup", "area", "nationwide", "digital"] as const,
        kind === "digital" ? "digital" : "area"
      );
      const row: Record<string, unknown> = {
        title: text(fd, "title", 160),
        kind,
        badge: orNull(text(fd, "badge", 40)),
        price_label: orNull(text(fd, "price_label", 80)),
        description: richText(fd, "description"),
        gallery,
        image_url: cover,
        shipping_mode,
        service_area: orNull(text(fd, "service_area", 160)),
      };
      if (!row.title) throw new Error("Nama produk wajib diisi.");
      if (user.role === "admin") {
        row.sort = Number(text(fd, "sort")) || 100;
        row.reject_reason = null;
      } else {
        // Edit mitra → antre lagi, hapus alasan tolak lama
        row.reject_reason = null;
      }

      if (id) {
        check((await supabase.from("products").update(row).eq("id", id)).error);
      } else {
        row.owner_id = user.role === "admin" ? null : user.id;
        row.status = user.role === "admin" ? "approved" : "pending";
        check((await supabase.from("products").insert(row)).error);
      }
      updateTag("products");
      refresh();
  });
}

export async function setProductStatus(id: string, status: string): Promise<ActionResult> {
  return act(async () => {
      await requireUser(["admin"]);
      const supabase = await createClient();
      const value = pick(status, ["pending", "approved", "rejected"] as const, "pending");
      const patch: Record<string, unknown> = { status: value };
      if (value === "approved") patch.reject_reason = null;
      check((await supabase.from("products").update(patch).eq("id", id)).error);
      updateTag("products");
      refresh();
  });
}

/** Tolak produk dengan alasan (ditampilkan ke mitra). */
export async function rejectProduct(fd: FormData): Promise<ActionResult> {
  return act(async () => {
    await requireUser(["admin"]);
    const id = text(fd, "id");
    const reason = text(fd, "reject_reason", 500);
    if (!id) throw new Error("Produk tidak valid.");
    if (!reason) throw new Error("Isi alasan penolakan.");
    const supabase = await createClient();
    check(
      (
        await supabase
          .from("products")
          .update({ status: "rejected", reject_reason: reason })
          .eq("id", id)
      ).error
    );
    updateTag("products");
    refresh();
  });
}

export async function setFeedbackStatus(id: string, status: string): Promise<ActionResult> {
  return act(async () => {
    await requireUser(["admin"]);
    const value = pick(status, ["new", "read", "done"] as const, "read");
    const supabase = await createClient();
    check((await supabase.from("feedback").update({ status: value }).eq("id", id)).error);
    refresh();
  });
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  return act(async () => {
      await requireUser(["admin", "mitra"]);
      const supabase = await createClient();
      check((await supabase.from("products").delete().eq("id", id)).error);
      updateTag("products");
      refresh();
  });
}

// ── Pesanan ───────────────────────────────────────────────────

export async function setOrderStatus(id: string, status: string): Promise<ActionResult> {
  return act(async () => {
      await requireUser(["admin", "mitra"]);
      const supabase = await createClient();
      const value = pick(status, ["new", "processing", "done", "cancelled"] as const, "new");
      check((await supabase.from("orders").update({ status: value }).eq("id", id)).error);
      refresh();
  });
}

// ── Pendaftar & anggota ───────────────────────────────────────

export async function setApplicationStatus(id: string, status: string): Promise<ActionResult> {
  return act(async () => {
      await requireUser(["admin"]);
      const supabase = await createClient();
      const value = pick(status, ["new", "contacted", "approved", "rejected"] as const, "new");
      const { data: app, error: readErr } = await supabase
        .from("applications")
        .select("id, role, applicant_id")
        .eq("id", id)
        .maybeSingle();
      check(readErr);
      check((await supabase.from("applications").update({ status: value }).eq("id", id)).error);

      // Terima pengajuan mitra dari member → aktifkan akun mitra
      if (value === "approved" && app?.role === "mitra" && app.applicant_id) {
        check(
          (
            await supabase
              .from("profiles")
              .update({ role: "mitra", status: "active" })
              .eq("id", app.applicant_id)
          ).error
        );
      }
      refresh();
  });
}

const MITRA_CATEGORIES = [
  "Makanan & minuman",
  "Fashion",
  "Digital / jasa",
  "Kerajinan",
  "Kesehatan & kecantikan",
  "Lainnya",
] as const;

/** Member mengajukan jadi mitra penjual (data validasi sederhana). */
export async function applyMitra(fd: FormData): Promise<ActionResult> {
  return act(async () => {
      const user = await requireUser(["member"]);
      const supabase = await createClient();

      const category = text(fd, "category", 60);
      const product = text(fd, "product", 160);
      const note = text(fd, "note", 500);
      const phone = text(fd, "phone", 30);
      const city = text(fd, "city", 120);

      if (!MITRA_CATEGORIES.includes(category as (typeof MITRA_CATEGORIES)[number])) {
        throw new Error("Pilih kategori yang tersedia.");
      }
      if (product.length < 3) throw new Error("Tulis singkat mau jualan apa.");
      if (!phone) throw new Error("Nomor WhatsApp wajib diisi.");

      const { data: existing } = await supabase
        .from("applications")
        .select("id")
        .eq("applicant_id", user.id)
        .eq("role", "mitra")
        .in("status", ["new", "contacted"])
        .limit(1)
        .maybeSingle();
      if (existing) throw new Error("Pengajuan mitra kamu masih menunggu review admin.");

      const detail = [
        "Sumber: dashboard jadi-mitra",
        `Produk: ${product}`,
        note ? `Catatan: ${note}` : null,
        `Email: ${user.email}`,
        `WA: ${phone}`,
      ]
        .filter(Boolean)
        .join("\n");

      check(
        (
          await supabase.from("applications").insert({
            role: "mitra",
            name: user.name,
            city: city || user.city || null,
            product_kind: category,
            detail,
            status: "new",
            applicant_id: user.id,
          })
        ).error
      );

      check(
        (
          await supabase
            .from("profiles")
            .update({
              phone,
              city: city || user.city || null,
              mitra_apply_category: category,
              mitra_apply_product: product,
              mitra_apply_note: orNull(note),
              mitra_apply_at: new Date().toISOString(),
            })
            .eq("id", user.id)
        ).error
      );
      refresh();
  });
}

export async function deleteApplication(id: string): Promise<ActionResult> {
  return act(async () => {
      await requireUser(["admin"]);
      const supabase = await createClient();
      check((await supabase.from("applications").delete().eq("id", id)).error);
      refresh();
  });
}

export async function updateMember(id: string, fd: FormData): Promise<ActionResult> {
  return act(async () => {
      const admin = await requireUser(["admin"]);
      if (id === admin.id) throw new Error("Peran akun sendiri tidak bisa diubah dari sini.");
      const supabase = await createClient();
      const role = pick(text(fd, "role"), ["admin", "mitra", "member"] as const, "member");
      const status = pick(text(fd, "status"), ["pending", "active", "suspended"] as const, "active");
      check((await supabase.from("profiles").update({ role, status }).eq("id", id)).error);
      refresh();
  });
}

export async function updateProfile(fd: FormData): Promise<ActionResult> {
  return act(async () => {
      const user = await requireUser();
      const supabase = await createClient();
      check(
        (
          await supabase
            .from("profiles")
            .update({
              full_name: orNull(text(fd, "full_name", 120)),
              phone: orNull(text(fd, "phone", 30)),
              city: orNull(text(fd, "city", 120)),
            })
            .eq("id", user.id)
        ).error
      );
      refresh();
  });
}

// ── Wisata ────────────────────────────────────────────────────

export async function saveTrip(fd: FormData): Promise<ActionResult> {
  return act(async () => {
      const user = await requireUser(["admin"]);
      const supabase = await createClient();
      const id = text(fd, "id");
      const gallery = await resolveGallery(supabase, user.id, fd);
      const cover = (await uploadImage(supabase, user.id, fd)) ?? gallery[0] ?? null;
      const row: Record<string, unknown> = {
        title: text(fd, "title", 160),
        tag: orNull(text(fd, "tag", 40)),
        duration: orNull(text(fd, "duration", 60)),
        price_label: orNull(text(fd, "price_label", 80)),
        summary: richText(fd, "summary"),
        published: fd.get("published") === "on",
        sort: Number(text(fd, "sort")) || 100,
        gallery,
        image_url: cover,
      };
      if (!row.title) throw new Error("Nama paket wajib diisi.");
      check(
        (id
          ? await supabase.from("trips").update(row).eq("id", id)
          : await supabase.from("trips").insert(row)
        ).error
      );
      updateTag("trips");
      refresh();
  });
}

export async function deleteTrip(id: string): Promise<ActionResult> {
  return act(async () => {
      await requireUser(["admin"]);
      const supabase = await createClient();
      check((await supabase.from("trips").delete().eq("id", id)).error);
      updateTag("trips");
      refresh();
  });
}

// ── Proyek ────────────────────────────────────────────────────

export async function saveProject(fd: FormData): Promise<ActionResult> {
  return act(async () => {
      const user = await requireUser(["admin"]);
      const supabase = await createClient();
      const id = text(fd, "id");
      const gallery = await resolveGallery(supabase, user.id, fd);
      const cover = (await uploadImage(supabase, user.id, fd)) ?? gallery[0] ?? null;
      const row: Record<string, unknown> = {
        title: text(fd, "title", 160),
        category: pick(text(fd, "category"), ["web", "mobile", "research"] as const, "web"),
        tag: orNull(text(fd, "tag", 60)),
        summary: richText(fd, "summary"),
        link: orNull(text(fd, "link", 300)),
        published: fd.get("published") === "on",
        sort: Number(text(fd, "sort")) || 100,
        gallery,
        cover_url: cover,
      };
      if (!row.title) throw new Error("Nama proyek wajib diisi.");
      if (row.link && !/^https?:\/\//.test(String(row.link))) {
        throw new Error("Link harus diawali http:// atau https://");
      }
      check(
        (id
          ? await supabase.from("projects").update(row).eq("id", id)
          : await supabase.from("projects").insert(row)
        ).error
      );
      updateTag("projects");
      refresh();
  });
}

export async function deleteProject(id: string): Promise<ActionResult> {
  return act(async () => {
      await requireUser(["admin"]);
      const supabase = await createClient();
      check((await supabase.from("projects").delete().eq("id", id)).error);
      updateTag("projects");
      refresh();
  });
}

// ── Layanan ───────────────────────────────────────────────────

export async function saveService(fd: FormData): Promise<ActionResult> {
  return act(async () => {
      await requireUser(["admin"]);
      const supabase = await createClient();
      const id = text(fd, "id");
      const items = text(fd, "items", 2000)
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .slice(0, 20);
      const row: Record<string, unknown> = {
        title: text(fd, "title", 160),
        blurb: richText(fd, "blurb"),
        items,
        accent: pick(text(fd, "accent"), ["teal", "orange", "ink"] as const, "teal"),
        published: fd.get("published") === "on",
        sort: Number(text(fd, "sort")) || 100,
      };
      if (!row.title) throw new Error("Nama layanan wajib diisi.");
      check(
        (id
          ? await supabase.from("services").update(row).eq("id", id)
          : await supabase.from("services").insert(row)
        ).error
      );
      updateTag("services");
      refresh();
  });
}

export async function deleteService(id: string): Promise<ActionResult> {
  return act(async () => {
      await requireUser(["admin"]);
      const supabase = await createClient();
      check((await supabase.from("services").delete().eq("id", id)).error);
      updateTag("services");
      refresh();
  });
}

// ── Delta ─────────────────────────────────────────────────────

export async function saveFaq(fd: FormData): Promise<ActionResult> {
  return act(async () => {
      await requireUser(["admin"]);
      const supabase = await createClient();
      const id = text(fd, "id");
      const row = {
        question: text(fd, "question", 300),
        answer: text(fd, "answer", 2000),
        tags: text(fd, "tags", 300)
          .toLowerCase()
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        published: fd.get("published") === "on",
      };
      if (!row.question || !row.answer) throw new Error("Pertanyaan dan jawaban wajib diisi.");
      check(
        (id
          ? await supabase.from("faqs").update(row).eq("id", id)
          : await supabase.from("faqs").insert(row)
        ).error
      );
      updateTag("faqs");
      refresh();
  });
}

export async function deleteFaq(id: string): Promise<ActionResult> {
  return act(async () => {
      await requireUser(["admin"]);
      const supabase = await createClient();
      check((await supabase.from("faqs").delete().eq("id", id)).error);
      updateTag("faqs");
      refresh();
  });
}

export async function deleteDeltaLog(id: string): Promise<ActionResult> {
  return act(async () => {
      await requireUser(["admin"]);
      const supabase = await createClient();
      check((await supabase.from("delta_logs").delete().eq("id", id)).error);
      refresh();
  });
}

const HERO_KEYS = [
  "hero_layanan",
  "hero_market",
  "hero_wisata",
  "hero_proyek",
  "hero_tentang",
  "hero_gabung",
  "portrait_tentang",
] as const;

/** Simpan URL gambar header tiap menu (kosong = pakai gradient default). */
export async function saveHeroSettings(fd: FormData): Promise<ActionResult> {
  return act(async () => {
    await requireUser(["admin"]);
    const supabase = await createClient();
    for (const key of HERO_KEYS) {
      const value = orNull(text(fd, key, 2000));
      if (value === null) {
        check((await supabase.from("site_settings").delete().eq("key", key)).error);
      } else {
        check(
          (
            await supabase.from("site_settings").upsert(
              { key, value, updated_at: new Date().toISOString() },
              { onConflict: "key" }
            )
          ).error
        );
      }
    }
    updateTag("site-settings");
    refresh();
  });
}

/** Mode routing WA order: admin (aman) | seller (langsung mitra). */
export async function saveOrderWaMode(fd: FormData): Promise<ActionResult> {
  return act(async () => {
    await requireUser(["admin"]);
    const mode = text(fd, "order_wa_mode", 20) === "seller" ? "seller" : "admin";
    const supabase = await createClient();
    check(
      (
        await supabase.from("site_settings").upsert(
          { key: "order_wa_mode", value: mode, updated_at: new Date().toISOString() },
          { onConflict: "key" }
        )
      ).error
    );
    updateTag("site-settings");
    refresh();
  });
}
