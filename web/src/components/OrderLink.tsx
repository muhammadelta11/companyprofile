"use client";

import { useEffect, useId, useState, useTransition } from "react";
import { placeOrder } from "@/app/actions";
import { TurnstileField } from "@/components/TurnstileField";
import { shippingLabel, type ShippingMode } from "@/lib/product";

type Props = {
  productId: string;
  title: string;
  priceLabel: string | null;
  shippingMode?: ShippingMode | null;
  serviceArea?: string | null;
  kind?: "fisik" | "digital";
  className?: string;
  children?: React.ReactNode;
};

/**
 * Order: isi data singkat → simpan ke DB → buka WA penjual (mitra) / official.
 */
export function OrderLink({
  productId,
  title,
  priceLabel,
  shippingMode,
  serviceArea,
  kind,
  className,
  children,
}: Props) {
  const dialogId = useId();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [startedAt] = useState(() => Date.now());
  const [tsKey, setTsKey] = useState(0);
  const ship = shippingLabel(shippingMode, serviceArea, kind);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(null);
    start(async () => {
      const result = await placeOrder({
        productId,
        name: String(fd.get("name") ?? ""),
        phone: String(fd.get("phone") ?? ""),
        city: String(fd.get("city") ?? ""),
        note: String(fd.get("note") ?? ""),
        website: String(fd.get("website") ?? ""),
        startedAt,
        turnstileToken: String(fd.get("cf-turnstile-response") ?? ""),
      });
      if (result.error) {
        setError(result.error);
        setTsKey((k) => k + 1);
        return;
      }
      if (result.waUrl) {
        setOpen(false);
        window.open(result.waUrl, "_blank", "noopener,noreferrer");
      }
    });
  }

  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        {children ?? "Order WA →"}
      </button>

      {open ? (
        <div
          className="order-sheet"
          role="dialog"
          aria-modal="true"
          aria-labelledby={dialogId}
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <form className="order-sheet__panel form-stack" onSubmit={onSubmit}>
            <div className="order-sheet__head">
              <h2 id={dialogId}>Order via WhatsApp</h2>
              <button type="button" className="order-sheet__close" onClick={() => setOpen(false)}>
                ×
              </button>
            </div>
            <p className="order-sheet__product">
              <strong>{title}</strong>
              {priceLabel ? <span> · {priceLabel}</span> : null}
              <br />
              <small>{ship} · Data dicatat, lalu lanjut chat WhatsApp (tanpa wajib login).</small>
            </p>

            {/* honeypot */}
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="order-sheet__hp"
            />

            <label>
              Nama
              <input name="name" required maxLength={120} autoComplete="name" />
            </label>
            <label>
              WhatsApp aktif
              <input
                name="phone"
                required
                inputMode="tel"
                placeholder="08xxxxxxxxxx"
                maxLength={20}
                autoComplete="tel"
              />
            </label>
            <label>
              Kota / kecamatan
              <input
                name="city"
                required
                maxLength={120}
                placeholder="Cek cocok dengan area kirim"
                autoComplete="address-level2"
              />
            </label>
            <label>
              Catatan (opsional)
              <textarea name="note" rows={2} maxLength={500} placeholder="Varian, alamat, dll." />
            </label>

            <TurnstileField action="order" resetKey={tsKey} />

            {error ? <p className="form-msg form-msg--error">{error}</p> : null}

            <div className="order-sheet__actions">
              <button type="submit" className="btn btn-teal" disabled={pending}>
                {pending ? "Menyiapkan…" : "Lanjut ke WhatsApp"}
              </button>
              <button
                type="button"
                className="btn btn-outline"
                disabled={pending}
                onClick={() => setOpen(false)}
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
