/** Legalitas & kredensial etalase mitra (publik, tanpa data sensitif penuh). */

export type BrandCertificate = {
  title: string;
  issuer?: string | null;
  year?: string | null;
};

export type SellerCredentials = {
  legal_name: string | null;
  legal_form: string | null;
  business_reg_no: string | null;
  issued_by: string | null;
  tax_status: string | null;
  brand_certs: BrandCertificate[];
};

export const EMPTY_CREDENTIALS: SellerCredentials = {
  legal_name: null,
  legal_form: null,
  business_reg_no: null,
  issued_by: null,
  tax_status: null,
  brand_certs: [],
};

export function hasSellerCredentials(c: SellerCredentials | null | undefined) {
  if (!c) return false;
  return Boolean(
    c.legal_name ||
      c.legal_form ||
      c.business_reg_no ||
      c.issued_by ||
      c.tax_status ||
      c.brand_certs.length
  );
}

/** Parse textarea: satu baris = "Judul | Penerbit | Tahun" (penerbit/tahun opsional). */
export function parseBrandCertsText(raw: string, max = 12): BrandCertificate[] {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, max)
    .map((line) => {
      const [title, issuer, year] = line.split("|").map((p) => p.trim());
      return {
        title: title.slice(0, 80),
        issuer: issuer ? issuer.slice(0, 80) : null,
        year: year ? year.slice(0, 12) : null,
      };
    })
    .filter((c) => c.title.length > 0);
}

export function formatBrandCertsText(certs: BrandCertificate[]) {
  return certs
    .map((c) => [c.title, c.issuer, c.year].filter(Boolean).join(" | "))
    .join("\n");
}

export function normalizeBrandCerts(raw: unknown): BrandCertificate[] {
  if (!Array.isArray(raw)) return [];
  const out: BrandCertificate[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const title = typeof row.title === "string" ? row.title.trim() : "";
    if (!title) continue;
    out.push({
      title: title.slice(0, 80),
      issuer: typeof row.issuer === "string" ? row.issuer.trim().slice(0, 80) : null,
      year: typeof row.year === "string" ? row.year.trim().slice(0, 12) : null,
    });
    if (out.length >= 12) break;
  }
  return out;
}
