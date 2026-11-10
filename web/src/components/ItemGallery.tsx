"use client";

import Image from "next/image";
import { useCallback, useEffect, useId, useState } from "react";

type Props = {
  images: string[];
  alt: string;
  className?: string;
};

/** Galeri detail: foto besar + thumb + lightbox slider full. */
export function ItemGallery({ images, alt, className = "" }: Props) {
  const list = images.filter(Boolean);
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const titleId = useId();

  const total = list.length;
  const index = total ? Math.min(active, total - 1) : 0;
  const current = total ? list[index]! : "";

  const go = useCallback(
    (delta: number) => {
      if (total < 2) return;
      setActive((i) => (i + delta + total) % total);
    },
    [total]
  );

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close, go]);

  if (!total) return null;

  return (
    <div className={`item-gallery ${className}`.trim()}>
      <button
        type="button"
        className="item-gallery__main"
        onClick={() => setOpen(true)}
        aria-label={`Perbesar foto ${index + 1} dari ${total}`}
      >
        <Image
          src={current}
          alt={alt}
          width={960}
          height={720}
          priority
          sizes="(max-width:719px) 100vw, (max-width:959px) 42rem, (max-width:1199px) 32vw, 28vw"
        />
        <span className="item-gallery__zoom" aria-hidden="true">
          Perbesar
        </span>
      </button>

      {total > 1 ? (
        <ul className="item-gallery__thumbs">
          {list.map((src, i) => (
            <li key={src}>
              <button
                type="button"
                className={i === index ? "is-active" : undefined}
                onClick={() => setActive(i)}
                aria-label={`Foto ${i + 1}`}
              >
                <Image src={src} alt="" width={120} height={90} sizes="72px" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {open ? (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onClick={close}
        >
          <div
            className="lightbox__panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="lightbox__bar">
              <p id={titleId} className="lightbox__title">
                {alt}
              </p>
              <span className="lightbox__count">
                {index + 1} / {total}
              </span>
              <button
                type="button"
                className="lightbox__close"
                onClick={close}
                aria-label="Tutup"
              >
                ×
              </button>
            </div>

            <div className="lightbox__stage">
              {total > 1 ? (
                <button
                  type="button"
                  className="lightbox__nav lightbox__nav--prev"
                  onClick={() => go(-1)}
                  aria-label="Foto sebelumnya"
                >
                  ‹
                </button>
              ) : null}

              <div className="lightbox__frame">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={current} alt={`${alt} — foto ${index + 1}`} />
              </div>

              {total > 1 ? (
                <button
                  type="button"
                  className="lightbox__nav lightbox__nav--next"
                  onClick={() => go(1)}
                  aria-label="Foto berikutnya"
                >
                  ›
                </button>
              ) : null}
            </div>

            {total > 1 ? (
              <ul className="lightbox__dots">
                {list.map((src, i) => (
                  <li key={src}>
                    <button
                      type="button"
                      className={i === index ? "is-active" : undefined}
                      onClick={() => setActive(i)}
                      aria-label={`Ke foto ${i + 1}`}
                    />
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
