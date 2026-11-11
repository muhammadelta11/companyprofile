import {
  DELTA_FAQS,
  DELTA_PROFILE,
  retrieveFaq,
} from "@/data/delta-knowledge";
import { SITE } from "@/data/site";
import type { CurrentUser } from "@/lib/auth";
import {
  getExtraFaqs,
  getProducts,
  getProjects,
  getServices,
  getTrips,
} from "@/lib/content";

export function buildDeltaSystemPrompt(user: CurrentUser | null) {
  const who = user
    ? `Pengunjung login sebagai ${user.name} (${user.role}${user.city ? `, ${user.city}` : ""}). Boleh nyapa pakai nama depan sekali-sekali, santai aja.`
    : "Pengunjung belum login. Kalau cocok, boleh ajak daftar/gabung — tapi jangan maksa.";

  return [
    `Kamu Delta, asisten chat brand ${DELTA_PROFILE.brand} (Muhammad Mas'ud / ${DELTA_PROFILE.nick}).`,
    "Bicara seperti admin WA yang ramah: santai, to the point, bahasa sehari-hari Indonesia.",
    "Pakai 'aku/kamu' atau 'saya/kamu' yang ringan. Boleh singkat kayak chat, bukan artikel.",
    "Hindari: kalimat kaku, basa-basi panjang, poin 1. 2. 3. kecuali diminta, frasa robotik ('dengan senang hati', 'tentu saja', 'berikut informasi', 'jangan ragu').",
    "Max ~90 kata. Satu ide utama dulu. Kalau perlu, tutup dengan pertanyaan ringan atau ajakan WA.",
    "Kamu AI — jangan pura-pura manusia. Untuk harga final / deal / jadwal pasti → arahkan ke WhatsApp.",
    `WA Mas'ud: ${SITE.waDisplay}. Situs: ${SITE.domain}.`,
    "Hanya jawab soal Mas'ud, jasa digital, Market, mitra, wisata/Mbarep Tour, dan isi situs ini.",
    "Kalau kurang yakin: bilang jujur singkat, lalu tawarkan WA atau halaman yang pas.",
    "Jangan ngarang harga pasti, stok, atau janji yang tidak ada di konteks.",
    who,
  ].join("\n");
}

export async function buildDeltaContext(message: string, page: string) {
  const [extraFaqs, products, trips, projects, services] = await Promise.all([
    getExtraFaqs(),
    getProducts(),
    getTrips(),
    getProjects(),
    getServices(),
  ]);

  const { faq, score } = retrieveFaq(message, extraFaqs);
  const topFaqs = [...extraFaqs, ...DELTA_FAQS]
    .map((f) => {
      const m = message.toLowerCase();
      let s = 0;
      for (const tag of f.tags) if (m.includes(tag)) s += 2;
      for (const w of f.q.toLowerCase().split(/\W+/)) {
        if (w.length > 3 && m.includes(w)) s += 1;
      }
      return { f, s };
    })
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, 4)
    .map(({ f }) => `Q: ${f.q}\nA: ${f.a}`);

  if (!topFaqs.length && score >= 1) {
    topFaqs.push(`Q: ${faq.q}\nA: ${faq.a}`);
  }

  const productLines = products.slice(0, 12).map((p) => {
    const seller = p.owner?.full_name || (p.owner_id ? "mitra" : "official");
    return `- ${p.title} (${p.kind}) · ${p.price_label || "harga via WA"} · ${seller}`;
  });

  const tripLines = trips
    .slice(0, 8)
    .map((t) => `- ${t.title}${t.tag ? ` · ${t.tag}` : ""}${t.duration ? ` · ${t.duration}` : ""}${t.price_label ? ` · ${t.price_label}` : ""}`);

  const projectLines = projects
    .slice(0, 10)
    .map((p) => `- ${p.title} (${p.category})${p.tag ? ` · ${p.tag}` : ""}`);

  const serviceLines = services
    .slice(0, 8)
    .map((s) => `- ${s.title}${s.blurb ? `: ${s.blurb.slice(0, 120)}` : ""}`);

  const context = [
    `Halaman user sekarang: ${page}`,
    `Profil: ${DELTA_PROFILE.name} — ${DELTA_PROFILE.roles.join("; ")}. Lokasi: ${DELTA_PROFILE.location}. Slogan: ${DELTA_PROFILE.slogan}.`,
    "",
    "FAQ relevan:",
    topFaqs.length ? topFaqs.join("\n\n") : "(tidak ada FAQ cocok)",
    "",
    "Layanan:",
    serviceLines.join("\n") || "(kosong)",
    "",
    "Produk Market (cuplikan):",
    productLines.join("\n") || "(kosong)",
    "",
    "Paket wisata (cuplikan):",
    tripLines.join("\n") || "(kosong)",
    "",
    "Proyek portfolio (cuplikan):",
    projectLines.join("\n") || "(kosong)",
  ].join("\n");

  return { context, faq, score, extraFaqs };
}
