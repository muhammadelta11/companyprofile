import Link from "next/link";
import { Icon, type IconName } from "@/components/Icon";

const ACTIONS: { href: string; label: string; icon: IconName; tone: "a" | "b" | "c" | "d" }[] = [
  { href: "/market", label: "Market", icon: "bag", tone: "a" },
  { href: "/layanan", label: "Layanan", icon: "code", tone: "b" },
  { href: "/wisata", label: "Wisata", icon: "compass", tone: "c" },
  { href: "/gabung", label: "Gabung", icon: "userPlus", tone: "d" },
];

/** Empat aksi cepat — grid tetap, tanpa overlap. */
export function QuickActions() {
  return (
    <nav className="mhome-actions" aria-label="Menu cepat">
      <ul className="mhome-actions__grid">
        {ACTIONS.map((a) => (
          <li key={a.href}>
            <Link className={`mhome-tile mhome-tile--${a.tone}`} href={a.href}>
              <span className="mhome-tile__icon" aria-hidden="true">
                <Icon name={a.icon} size={20} />
              </span>
              <strong>{a.label}</strong>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
