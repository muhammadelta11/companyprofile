"use client";

import { useEffect, useRef, useState } from "react";
import { submitApplication } from "@/app/actions";
import { TurnstileField } from "@/components/TurnstileField";
import { waLink } from "@/data/site";

const ROLES = [
  {
    id: "member",
    label: "Member",
    desc: "Promo, update produk & trip, prioritas konsultasi.",
    detailLabel: "Minat kamu",
    detailHint: "Contoh: website usaha, produk digital, paket studi tour",
  },
  {
    id: "mitra",
    label: "Mitra Penjual",
    desc: "Etalase produk fisik/digital di Market.",
    detailLabel: "Produk yang dijual",
    detailHint: "Contoh: keripik tempe, template undangan digital",
  },
  {
    id: "partner",
    label: "Partner Kolaborasi",
    desc: "Freelancer, agency, atau travel agent — co-project & referral.",
    detailLabel: "Keahlian / bidang",
    detailHint: "Contoh: desain UI, videografer, agen travel",
  },
] as const;

type RoleId = (typeof ROLES)[number]["id"];

export function JoinForm() {
  const [role, setRole] = useState<RoleId>("member");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [kind, setKind] = useState("fisik");
  const [detail, setDetail] = useState("");
  const [website, setWebsite] = useState("");
  const startedAt = useRef(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [tsKey, setTsKey] = useState(0);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  const selected = ROLES.find((r) => r.id === role) ?? ROLES[0];

  const message = [
    `Halo Mas'ud, saya ingin gabung sebagai *${selected.label}* di masudeltamamy.com.`,
    `Nama: ${name || "-"}`,
    `Kota: ${city || "-"}`,
    role === "mitra" ? `Jenis produk: ${kind}` : null,
    `${selected.detailLabel}: ${detail || "-"}`,
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <form
      className="join-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setPending(true);
        setError(null);
        const fd = new FormData(e.currentTarget);
        const result = await submitApplication({
          role,
          name,
          city,
          productKind: kind,
          detail,
          website,
          startedAt: startedAt.current,
          turnstileToken: String(fd.get("cf-turnstile-response") ?? ""),
        });
        setPending(false);
        if (result.error) {
          setError(result.error);
          setTsKey((k) => k + 1);
          return;
        }
        window.open(waLink(message), "_blank", "noopener,noreferrer");
      }}
    >
      {/* Honeypot — disembunyikan dari manusia */}
      <label className="hp" aria-hidden="true">
        Website
        <input
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </label>

      <div className="join-roles" role="radiogroup" aria-label="Pilih peran">
        {ROLES.map((r) => (
          <button
            key={r.id}
            type="button"
            role="radio"
            aria-checked={role === r.id}
            className={`join-role${role === r.id ? " is-active" : ""}`}
            onClick={() => setRole(r.id)}
          >
            <strong>{r.label}</strong>
            <span>{r.desc}</span>
          </button>
        ))}
      </div>

      <div className="join-fields">
        <label>
          Nama
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nama lengkap"
            required
          />
        </label>
        <label>
          Kota
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Domisili"
          />
        </label>
        {role === "mitra" ? (
          <label className="full">
            Jenis produk
            <select value={kind} onChange={(e) => setKind(e.target.value)}>
              <option value="fisik">Fisik</option>
              <option value="digital">Digital</option>
              <option value="fisik & digital">Fisik &amp; digital</option>
            </select>
          </label>
        ) : null}
        <label className="full">
          {selected.detailLabel}
          <textarea
            rows={3}
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder={selected.detailHint}
          />
        </label>
      </div>

      <div className="join-preview">
        <p className="eyebrow">Preview pesan WhatsApp</p>
        <pre>{message}</pre>
      </div>

      <TurnstileField action="join" resetKey={tsKey} />

      {error ? <p className="form-msg form-msg--error">{error}</p> : null}

      <button className="btn btn-teal" type="submit" disabled={pending}>
        {pending ? "Menyimpan…" : "Kirim via WhatsApp"}
      </button>
    </form>
  );
}
