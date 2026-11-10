import Link from "next/link";
import { Reveal } from "@/components/Reveal";

type Item = {
  kicker: string;
  title: string;
  text: string;
  href: string;
  art: React.ReactNode;
};

const ITEMS: Item[] = [
  {
    kicker: "Digital",
    title: "Website & Sistem",
    text: "Situs bisnis, sistem informasi, inventory.",
    href: "/layanan",
    art: (
      <>
        <rect x="14" y="16" width="92" height="62" rx="9" fill="#fff" />
        <path d="M14 25a9 9 0 0 1 9-9h74a9 9 0 0 1 9 9v3H14Z" fill="#bfdbfe" />
        <circle cx="23" cy="22" r="2.2" fill="#1d4ed8" />
        <circle cx="30" cy="22" r="2.2" fill="#60a5fa" />
        <circle cx="37" cy="22" r="2.2" fill="#93c5fd" />
        <rect x="23" y="37" width="40" height="7" rx="3.5" fill="#1d4ed8" />
        <rect x="23" y="49" width="30" height="4" rx="2" fill="#93c5fd" />
        <rect className="xart-pop" x="23" y="59" width="24" height="10" rx="5" fill="#0ea5e9" />
        <rect className="xart-float" x="70" y="36" width="28" height="33" rx="6" fill="#dbeafe" />
      </>
    ),
  },
  {
    kicker: "Digital",
    title: "Aplikasi Mobile",
    text: "Aplikasi untuk bisnis, layanan, dan komunitas.",
    href: "/layanan",
    art: (
      <>
        <rect x="40" y="8" width="40" height="76" rx="10" fill="#fff" />
        <rect x="46" y="19" width="28" height="52" rx="5" fill="#dbeafe" />
        <rect x="53" y="12.5" width="14" height="3" rx="1.5" fill="#93c5fd" />
        <circle cx="60" cy="36" r="8" fill="#1d4ed8" />
        <rect x="50" y="50" width="20" height="4" rx="2" fill="#60a5fa" />
        <rect x="50" y="58" width="13" height="4" rx="2" fill="#93c5fd" />
        <g className="xart-float">
          <rect x="80" y="22" width="30" height="16" rx="8" fill="#0ea5e9" />
          <circle cx="89" cy="30" r="1.8" fill="#fff" />
          <circle cx="95" cy="30" r="1.8" fill="#fff" />
          <circle cx="101" cy="30" r="1.8" fill="#fff" />
        </g>
      </>
    ),
  },
  {
    kicker: "Digital",
    title: "Riset & Data",
    text: "Analisis data, riset teknis, dan dukungan proyek.",
    href: "/layanan",
    art: (
      <>
        <rect x="14" y="14" width="92" height="64" rx="9" fill="#fff" />
        <rect className="xart-bar" x="26" y="50" width="11" height="18" rx="2.5" fill="#93c5fd" />
        <rect className="xart-bar" x="43" y="40" width="11" height="28" rx="2.5" fill="#60a5fa" />
        <rect className="xart-bar" x="60" y="30" width="11" height="38" rx="2.5" fill="#1d4ed8" />
        <rect className="xart-bar" x="77" y="44" width="11" height="24" rx="2.5" fill="#60a5fa" />
        <polyline
          points="26,42 43,33 60,23 77,35 95,22"
          fill="none"
          stroke="#0ea5e9"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle className="xart-pop" cx="95" cy="22" r="4" fill="#0ea5e9" />
      </>
    ),
  },
  {
    kicker: "Market",
    title: "Belanja & Jual",
    text: "Produk fisik & digital, order via WhatsApp.",
    href: "/market",
    art: (
      <>
        <path d="M46 32v-5a14 14 0 0 1 28 0v5" fill="none" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" />
        <path d="M28 32h64l-6 48H34Z" fill="#fff" />
        <rect x="43" y="46" width="34" height="18" rx="9" fill="#1d4ed8" />
        <circle cx="60" cy="55" r="3.2" fill="#fff" />
        <g className="xart-float">
          <rect x="82" y="12" width="28" height="15" rx="7.5" fill="#0ea5e9" />
          <rect x="88" y="18" width="16" height="3" rx="1.5" fill="#fff" />
        </g>
      </>
    ),
  },
  {
    kicker: "Wisata",
    title: "Mbarep Tour",
    text: "Studi tour, gathering, dan wisata religi.",
    href: "/wisata",
    art: (
      <>
        <circle className="xart-pop" cx="88" cy="26" r="10" fill="#e0f2fe" />
        <path d="M14 30 C30 10 56 10 70 22" fill="none" stroke="#fff" strokeWidth="2" strokeDasharray="3 5" strokeLinecap="round" />
        <circle className="xart-float" cx="72" cy="23" r="3.5" fill="#fff" />
        <path d="M6 80 L42 34 L60 56 L76 42 L114 80Z" fill="#fff" />
        <path d="M42 34 L51 46 L45 48 L37 41 Z" fill="#bfdbfe" />
        <path d="M76 42 L84 50 L79 52 L71 48 Z" fill="#bfdbfe" />
      </>
    ),
  },
  {
    kicker: "Ekosistem",
    title: "Gabung",
    text: "Jadi member, mitra penjual, atau partner.",
    href: "/gabung",
    art: (
      <>
        <circle cx="32" cy="42" r="9" fill="#bfdbfe" />
        <path d="M14 78c0-11 8-18 18-18s18 7 18 18Z" fill="#bfdbfe" />
        <circle cx="88" cy="42" r="9" fill="#bfdbfe" />
        <path d="M70 78c0-11 8-18 18-18s18 7 18 18Z" fill="#bfdbfe" />
        <circle cx="60" cy="34" r="12" fill="#fff" />
        <path d="M36 80c0-15 11-24 24-24s24 9 24 24Z" fill="#fff" />
        <g className="xart-pop">
          <circle cx="98" cy="20" r="9" fill="#0ea5e9" />
          <path d="M98 15.5v9M93.5 20h9" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
        </g>
      </>
    ),
  },
];

export function ExploreGrid() {
  return (
    <section className="section" id="jelajah">
      <div className="container">
        <Reveal className="section-head">
          <p className="eyebrow">Lini bisnis</p>
          <h2>Mulai dari kebutuhanmu</h2>
          <p>Digital, market, atau wisata — pilih jalur yang paling relevan.</p>
        </Reveal>
        <div className="xgrid">
          {ITEMS.map((item, i) => (
            <Reveal key={item.title} delay={(i % 3) * 0.06}>
              <Link className="xcard" href={item.href}>
                <span className="xcard__art" aria-hidden="true">
                  <svg viewBox="0 0 120 92">{item.art}</svg>
                </span>
                <span className="xcard__body">
                  <span className="xcard__kicker">{item.kicker}</span>
                  <strong>{item.title}</strong>
                  <span className="xcard__text">{item.text}</span>
                </span>
                <span className="xcard__go" aria-hidden="true">→</span>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
