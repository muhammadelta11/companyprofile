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
  type ProductItem,
  type ProjectItem,
  type ServiceItem,
  type TripItem,
} from "@/lib/content";
import { sellerLabel } from "@/lib/product";

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
    "Konteks berisi katalog LIVE dari database (produk, layanan, wisata, proyek, FAQ). Pakai itu dulu — termasuk item baru.",
    "Kalau user tanya produk/jasa spesifik, sebutkan nama + harga label + link jika ada di konteks. Jangan bilang 'tidak ada' kalau item ada di daftar.",
    "Kalau kurang yakin: bilang jujur singkat, lalu tawarkan WA atau halaman yang pas.",
    "Jangan ngarang harga pasti, stok, atau janji yang tidak ada di konteks.",
    who,
  ].join("\n");
}

function stripHtml(html: string | null | undefined) {
  if (!html) return "";
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokensOf(message: string) {
  return message
    .toLowerCase()
    .split(/[^a-z0-9à-ÿ]+/i)
    .filter((w) => w.length > 2);
}

function scoreHaystack(hay: string, tokens: string[], boost = 0) {
  const h = hay.toLowerCase();
  let s = boost;
  for (const t of tokens) {
    if (h.includes(t)) s += t.length > 4 ? 3 : 2;
  }
  return s;
}

function pageBoost(page: string, section: "market" | "layanan" | "wisata" | "proyek" | "other") {
  const p = page.toLowerCase();
  if (section === "market" && (p.includes("/market") || p.includes("produk"))) return 4;
  if (section === "layanan" && (p.includes("/layanan") || p === "/" || p.includes("jasa"))) return 4;
  if (section === "wisata" && p.includes("/wisata")) return 4;
  if (section === "proyek" && (p.includes("/proyek") || p.includes("portfolio"))) return 4;
  return 0;
}

function pickRanked<T>(
  items: T[],
  scoreOf: (item: T) => number,
  limit: number,
  newest: T[] = []
) {
  const scored = items
    .map((item, index) => ({ item, index, score: scoreOf(item) }))
    .sort((a, b) => b.score - a.score || a.index - b.index);

  const chosen = new Set<T>();
  const out: T[] = [];

  for (const row of scored) {
    if (out.length >= limit) break;
    if (row.score <= 0 && out.length >= Math.min(6, limit)) continue;
    chosen.add(row.item);
    out.push(row.item);
  }

  for (const item of newest) {
    if (out.length >= limit) break;
    if (chosen.has(item)) continue;
    chosen.add(item);
    out.push(item);
  }

  if (!out.length) return items.slice(0, Math.min(limit, items.length));
  return out;
}

function productLine(p: ProductItem) {
  const seller = sellerLabel(p);
  const desc = stripHtml(p.description).slice(0, 140);
  const area = p.service_area ? ` · area ${p.service_area}` : "";
  return `- ${p.title} (${p.kind}) · ${p.price_label || "harga via WA"} · ${seller}${area}${desc ? ` — ${desc}` : ""} · /market/${p.id}`;
}

function serviceLine(s: ServiceItem) {
  const blurb = stripHtml(s.blurb).slice(0, 140);
  const extras = (s.items || []).slice(0, 4).join("; ");
  return `- ${s.title}${blurb ? `: ${blurb}` : ""}${extras ? ` · cakupan: ${extras}` : ""} · /layanan`;
}

function tripLine(t: TripItem) {
  const summary = stripHtml(t.summary).slice(0, 120);
  return `- ${t.title}${t.tag ? ` · ${t.tag}` : ""}${t.duration ? ` · ${t.duration}` : ""}${t.price_label ? ` · ${t.price_label}` : ""}${summary ? ` — ${summary}` : ""} · /wisata/${t.id}`;
}

function projectLine(p: ProjectItem) {
  const summary = stripHtml(p.summary).slice(0, 120);
  return `- ${p.title} (${p.category})${p.tag ? ` · ${p.tag}` : ""}${summary ? ` — ${summary}` : ""}${p.link ? ` · ${p.link}` : ""} · /proyek`;
}

export async function buildDeltaContext(message: string, page: string) {
  const [extraFaqs, products, trips, projects, services] = await Promise.all([
    getExtraFaqs(),
    getProducts(),
    getTrips(),
    getProjects(),
    getServices(),
  ]);

  const tokens = tokensOf(message);
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
    .slice(0, 5)
    .map(({ f }) => `Q: ${f.q}\nA: ${f.a}`);

  if (!topFaqs.length && score >= 1) {
    topFaqs.push(`Q: ${faq.q}\nA: ${faq.a}`);
  }

  const newestProducts = [...products]
    .sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")))
    .slice(0, 5);

  const pickedProducts = pickRanked(
    products,
    (p) =>
      scoreHaystack(
        `${p.title} ${p.kind} ${p.price_label || ""} ${stripHtml(p.description)} ${p.service_area || ""} ${sellerLabel(p)}`,
        tokens,
        pageBoost(page, "market")
      ),
    18,
    newestProducts
  );

  const pickedServices = pickRanked(
    services,
    (s) =>
      scoreHaystack(
        `${s.title} ${stripHtml(s.blurb)} ${(s.items || []).join(" ")}`,
        tokens,
        pageBoost(page, "layanan")
      ),
    12,
    services.slice(0, 4)
  );

  const pickedTrips = pickRanked(
    trips,
    (t) =>
      scoreHaystack(
        `${t.title} ${t.tag || ""} ${t.duration || ""} ${t.price_label || ""} ${stripHtml(t.summary)}`,
        tokens,
        pageBoost(page, "wisata")
      ),
    10,
    trips.slice(0, 3)
  );

  const pickedProjects = pickRanked(
    projects,
    (p) =>
      scoreHaystack(
        `${p.title} ${p.category} ${p.tag || ""} ${stripHtml(p.summary)}`,
        tokens,
        pageBoost(page, "proyek")
      ),
    10,
    projects.slice(0, 3)
  );

  const context = [
    `Halaman user sekarang: ${page}`,
    `Profil: ${DELTA_PROFILE.name} — ${DELTA_PROFILE.roles.join("; ")}. Lokasi: ${DELTA_PROFILE.location}. Slogan: ${DELTA_PROFILE.slogan}.`,
    `Katalog live: ${products.length} produk · ${services.length} layanan · ${trips.length} wisata · ${projects.length} proyek · ${extraFaqs.length} FAQ tambahan.`,
    "",
    "FAQ relevan:",
    topFaqs.length ? topFaqs.join("\n\n") : "(tidak ada FAQ cocok)",
    "",
    "Layanan (pilih relevan + terbaru):",
    pickedServices.map(serviceLine).join("\n") || "(kosong)",
    "",
    "Produk Market (pilih relevan + terbaru):",
    pickedProducts.map(productLine).join("\n") || "(kosong)",
    "",
    "Paket wisata (pilih relevan + terbaru):",
    pickedTrips.map(tripLine).join("\n") || "(kosong)",
    "",
    "Proyek portfolio (pilih relevan + terbaru):",
    pickedProjects.map(projectLine).join("\n") || "(kosong)",
  ].join("\n");

  return { context, faq, score, extraFaqs };
}
