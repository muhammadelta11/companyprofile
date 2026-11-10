const ALLOWED = new Set([
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "ul",
  "ol",
  "li",
  "a",
  "img",
  "h2",
  "h3",
  "h4",
  "blockquote",
  "span",
]);

function attr(raw: string, name: string) {
  const m = String(raw).match(new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  return (m?.[1] ?? m?.[2] ?? m?.[3] ?? "").trim();
}

/**
 * Sanitasi HTML TinyMCE tanpa DOMPurify (agar aman dipakai saat prerender Next.js).
 * Hanya tag allowlist; link/gambar http(s) saja.
 */
export function sanitizeRichHtml(html: string) {
  let out = html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "");

  out = out.replace(/<\/?([a-z0-9]+)(\s[^>]*)?>/gi, (full, rawTag: string, rawAttrs = "") => {
    const tag = rawTag.toLowerCase();
    const closing = full.startsWith("</");
    if (!ALLOWED.has(tag)) return "";
    if (closing) return tag === "img" ? "" : `</${tag}>`;
    if (tag === "br") return "<br />";
    if (tag === "img") {
      const src = attr(rawAttrs, "src");
      if (!/^https?:\/\//i.test(src)) return "";
      const alt = attr(rawAttrs, "alt").replace(/"/g, "&quot;");
      const safe = src.replace(/"/g, "&quot;");
      return `<img src="${safe}" alt="${alt}" loading="lazy" />`;
    }
    if (tag === "a") {
      const href = attr(rawAttrs, "href");
      if (!/^(https?:\/\/|mailto:)/i.test(href)) return "<span>";
      const safe = href.replace(/"/g, "&quot;");
      return `<a href="${safe}" target="_blank" rel="noopener noreferrer">`;
    }
    return `<${tag}>`;
  });

  out = out.replace(/<span>([\s\S]*?)<\/a>/gi, "<span>$1</span>");

  return out.trim();
}

/** Ambil teks polos untuk cuplikan kartu katalog. */
export function htmlToPlain(html: string | null | undefined, max = 160) {
  if (!html) return "";
  const plain = html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/p>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
  if (plain.length <= max) return plain;
  return `${plain.slice(0, max).trimEnd()}…`;
}
