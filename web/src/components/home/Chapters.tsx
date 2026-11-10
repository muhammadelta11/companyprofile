"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
  useSpring,
} from "framer-motion";

type Chapter = {
  id: string;
  kicker: string;
  headline: string;
  text: string;
  title: string;
  points: string[];
  href: string;
  cta: string;
  tone: "teal" | "orange" | "sun" | "ink";
};

const CHAPTERS: Chapter[] = [
  {
    id: "digital",
    kicker: "01 — Digital",
    headline: "Sistem & aplikasi yang beres, bukan setengah jadi.",
    text: "Website, sistem informasi, inventory, sampai aplikasi mobile — dibangun untuk operasional bisnis yang rapi.",
    title: "Web & Sistem",
    points: ["Situs bisnis", "Sistem informasi", "Mobile app", "Riset & data"],
    href: "/layanan",
    cta: "Lihat layanan",
    tone: "teal",
  },
  {
    id: "market",
    kicker: "02 — Market",
    headline: "Belanja produk, atau jual produkmu di sini.",
    text: "Produk fisik & digital dari brand resmi dan mitra. Order dikonfirmasi langsung via WhatsApp — simpel dan aman.",
    title: "Market",
    points: ["Produk reseller", "Produk digital", "Listing mitra", "Order via WA"],
    href: "/market",
    cta: "Buka Market",
    tone: "orange",
  },
  {
    id: "wisata",
    kicker: "03 — Wisata",
    headline: "Perjalanan berkesan bersama Mbarep Tour.",
    text: "Liburan rombongan, studi tour, kunjungan industri, gathering, sampai wisata religi — jadwal dan rute bisa disesuaikan.",
    title: "Wisata",
    points: ["Studi tour", "Kunjungan industri", "Gathering", "Ziarah"],
    href: "/wisata",
    cta: "Lihat paket",
    tone: "sun",
  },
  {
    id: "ekosistem",
    kicker: "04 — Ekosistem",
    headline: "Tumbuh bareng sebagai member, mitra, atau partner.",
    text: "Member dapat promo & prioritas. Mitra penjual dapat etalase. Partner kolaborasi bisa ikut proyek dan referral.",
    title: "Gabung",
    points: ["Member", "Mitra penjual", "Partner kolaborasi"],
    href: "/gabung",
    cta: "Gabung sekarang",
    tone: "ink",
  },
];

export function Chapters() {
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start center", "end center"],
  });
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 24 });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const idx = Math.min(
      CHAPTERS.length - 1,
      Math.max(0, Math.floor(v * CHAPTERS.length))
    );
    setActive(idx);
  });

  const current = CHAPTERS[active];

  return (
    <section ref={ref} className="chapters" aria-label="Lini bisnis Digital, Market, Wisata">
      <div className="container chapters__grid">
        <div className="chapters__stage">
          <div className={`chapters__panel chapters__panel--${current.tone}`}>
            <motion.div className="chapters__bar" style={{ scaleX: progress }} />
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                className="chapters__panel-inner"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -24 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              >
                <span className="chapters__num">
                  {String(active + 1).padStart(2, "0")}
                </span>
                <h3>{current.title}</h3>
                <ul>
                  {current.points.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="chapters__list">
          {CHAPTERS.map((c, i) => (
            <article
              key={c.id}
              className={`chapter chapter--${c.tone}${i === active ? " is-active" : ""}`}
            >
              <p className="eyebrow">{c.kicker}</p>
              <h2>{c.headline}</h2>
              <p>{c.text}</p>
              <Link className="btn btn-outline" href={c.href}>
                {c.cta} →
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
