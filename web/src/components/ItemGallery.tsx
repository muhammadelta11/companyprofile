"use client";

import Image from "next/image";
import { useState } from "react";

type Props = {
  images: string[];
  alt: string;
  className?: string;
};

/** Galeri detail: foto besar + thumb pilih. */
export function ItemGallery({ images, alt, className = "" }: Props) {
  const list = images.filter(Boolean);
  const [active, setActive] = useState(0);
  if (!list.length) return null;

  const current = list[Math.min(active, list.length - 1)]!;

  return (
    <div className={`item-gallery ${className}`.trim()}>
      <div className="item-gallery__main">
        <Image
          src={current}
          alt={alt}
          width={960}
          height={720}
          priority
          sizes="(max-width:719px) 100vw, (max-width:959px) 42rem, (max-width:1199px) 32vw, 28vw"
        />
      </div>
      {list.length > 1 ? (
        <ul className="item-gallery__thumbs">
          {list.map((src, i) => (
            <li key={src}>
              <button
                type="button"
                className={i === active ? "is-active" : undefined}
                onClick={() => setActive(i)}
                aria-label={`Foto ${i + 1}`}
              >
                <Image src={src} alt="" width={120} height={90} sizes="72px" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
