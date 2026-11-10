const CX = 672;
const CY = 430;

const STARS = [
  { x: 980, y: 150, s: 1.1, d: "0s" },
  { x: 250, y: 210, s: 0.7, d: "1.2s" },
  { x: 1090, y: 470, s: 0.6, d: "2.1s" },
  { x: 470, y: 120, s: 0.5, d: "0.6s" },
  { x: 840, y: 640, s: 0.8, d: "1.7s" },
];

const PLUS = [
  { x: 120, y: 120 },
  { x: 1120, y: 90 },
  { x: 560, y: 690 },
  { x: 1150, y: 660 },
];

const VIEW = { viewBox: "0 0 1200 760", preserveAspectRatio: "xMidYMid slice" } as const;

/** Titik viewBox → posisi CSS di dalam `.vhero__vectors` (lihat --u di globals.css). */
const at = (x: number, y: number) => ({ "--vx": x - 600, "--vy": y - 380 }) as React.CSSProperties;

/**
 * Animasi di dalam SVG selalu digambar ulang di main thread. Karena itu bagian yang bergerak
 * dipisah jadi elemen sendiri (lapisan berputar, glow, bintang) yang dianimasikan GPU.
 */
export function HeroVectors() {
  return (
    <>
      <span className="vvec-glow" style={at(CX, CY)} />

      <svg className="vvec" {...VIEW} aria-hidden="true">
        <defs>
          <pattern id="vvec-grid" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M48 0H0V48" fill="none" stroke="rgba(255,255,255,0.08)" />
          </pattern>
          <linearGradient id="vvec-wave" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#fff" stopOpacity="0" />
            <stop offset="0.5" stopColor="#fff" stopOpacity="0.45" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="vvec-fade" cx="0.56" cy="0.55" r="0.65">
            <stop offset="0.35" stopColor="#fff" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
          <mask id="vvec-mask">
            <rect width="1200" height="760" fill="url(#vvec-fade)" />
          </mask>
        </defs>

        <rect width="1200" height="760" fill="url(#vvec-grid)" mask="url(#vvec-mask)" />

        <circle className="vvec__ring" cx={CX} cy={CY} r="200" />
        <circle className="vvec__ring vvec__ring--faint" cx={CX} cy={CY} r="370" />
        <circle className="vvec__ring vvec__ring--fainter" cx={CX} cy={CY} r="480" />
        <path className="vvec__arc vvec__arc--thin" d={`M ${CX + 370} ${CY} A 370 370 0 0 1 ${CX} ${CY + 370}`} />

        <path className="vvec__wave" d="M-40 600 C 180 548, 360 690, 600 622 S 1000 540, 1240 600" />
        <path
          className="vvec__wave vvec__wave--2"
          d="M-40 655 C 220 612, 430 726, 650 664 S 1030 600, 1240 652"
        />

        {PLUS.map((p) => (
          <path
            key={`${p.x}-${p.y}`}
            className="vvec__plus"
            d={`M${p.x - 7} ${p.y}H${p.x + 7}M${p.x} ${p.y - 7}V${p.y + 7}`}
          />
        ))}
      </svg>

      <svg className="vvec vvec-spin" {...VIEW} aria-hidden="true">
        <circle className="vvec__ring vvec__ring--dash" cx={CX} cy={CY} r="285" />
        <circle className="vvec__orbit" cx={CX + 285} cy={CY} r="7" />
        <circle className="vvec__orbit vvec__orbit--white" cx={CX - 285} cy={CY} r="4" />
      </svg>
      <svg className="vvec vvec-spin vvec-spin--rev" {...VIEW} aria-hidden="true">
        <path className="vvec__arc" d={`M ${CX - 200} ${CY} A 200 200 0 0 1 ${CX} ${CY - 200}`} />
        <circle className="vvec__orbit vvec__orbit--white" cx={CX} cy={CY - 370} r="5" />
      </svg>

      {STARS.map((s) => (
        <span
          key={`${s.x}-${s.y}`}
          className="vvec-star"
          style={{ ...at(s.x, s.y), "--s": s.s, animationDelay: s.d } as React.CSSProperties}
        >
          <svg viewBox="-16 -16 32 32" aria-hidden="true">
            <path d="M0 -16 C2 -5 5 -2 16 0 C5 2 2 5 0 16 C-2 5 -5 2 -16 0 C-5 -2 -2 -5 0 -16Z" />
          </svg>
        </span>
      ))}
    </>
  );
}

export function HeroSeat({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 280 214" aria-hidden="true">
      <defs>
        <linearGradient id="seat-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3b82f6" />
          <stop offset="0.6" stopColor="#1d4ed8" />
          <stop offset="1" stopColor="#0b2a6f" />
        </linearGradient>
        <radialGradient id="seat-top" cx="0.42" cy="0.3" r="0.75">
          <stop offset="0" stopColor="#bfdbfe" />
          <stop offset="0.5" stopColor="#60a5fa" />
          <stop offset="1" stopColor="#2563eb" />
        </radialGradient>
        <radialGradient id="seat-shadow">
          <stop offset="0" stopColor="#020617" stopOpacity="0.55" />
          <stop offset="1" stopColor="#020617" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="146" cy="202" rx="150" ry="12" fill="url(#seat-shadow)" />
      <path
        d="M16 40 C16 20 70 10 140 10 C210 10 264 20 264 40 L256 172 C254 192 206 202 140 202 C74 202 26 192 24 172 Z"
        fill="url(#seat-body)"
      />
      <ellipse cx="140" cy="38" rx="124" ry="28" fill="url(#seat-top)" />
      <ellipse cx="108" cy="29" rx="58" ry="8" fill="#fff" opacity="0.28" />
      <path
        d="M34 64 C29 104 32 142 40 170"
        fill="none"
        stroke="rgba(255,255,255,0.28)"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path
        d="M28 120 C80 134 200 134 252 120"
        fill="none"
        stroke="rgba(255,255,255,0.16)"
        strokeWidth="2"
      />
    </svg>
  );
}
