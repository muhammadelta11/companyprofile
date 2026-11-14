import type { ReactNode } from "react";
import type { HeroTone } from "@/lib/site-settings";

type Tone = HeroTone | "detail" | "teal" | "blue";

type HeroProps = {
  eyebrow: string;
  title: ReactNode;
  lead?: ReactNode;
  tone: Tone;
  /** URL gambar latar (dari setting admin). */
  imageUrl?: string | null;
  children?: ReactNode;
};

/** Hero kartu — gradient default, atau foto dari dashboard Tampilan. */
export function AppPageHero({ eyebrow, title, lead, tone, imageUrl, children }: HeroProps) {
  const hasImage = Boolean(imageUrl);
  return (
    <header
      className={`apage-hero apage-hero--${tone}${hasImage ? " apage-hero--has-image" : ""}`}
      style={hasImage ? { backgroundImage: `url(${imageUrl})` } : undefined}
    >
      <p className="apage-hero__eyebrow">{eyebrow}</p>
      <h1 className="apage-hero__title">{title}</h1>
      {lead ? <p className="apage-hero__lead">{lead}</p> : null}
      {children}
    </header>
  );
}

/** Shell kolom aplikasi untuk halaman menu. */
export function AppPage({ children }: { children: ReactNode }) {
  return (
    <div className="apage">
      <div className="apage__shell">{children}</div>
    </div>
  );
}
