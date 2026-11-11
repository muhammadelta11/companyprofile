"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { Role } from "@/lib/auth";
import { signOut } from "../masuk/actions";
import { AdminNotify } from "@/components/dashboard/AdminNotify";
import { DashToast } from "@/components/dashboard/DashToast";

type NavItem = { href: string; label: string; hint?: string; roles: Role[] };
type NavGroup = { title: string; items: NavItem[] };

const GROUPS: NavGroup[] = [
  {
    title: "Utama",
    items: [
      { href: "/dashboard", label: "Beranda", roles: ["admin", "mitra", "member"] },
      { href: "/dashboard/pesanan", label: "Pesanan", roles: ["admin", "mitra", "member"] },
      { href: "/dashboard/chat", label: "Chat", roles: ["admin", "mitra", "member"] },
    ],
  },
  {
    title: "Cek dulu",
    items: [
      { href: "/dashboard/produk?sumber=sendiri", label: "Produk sendiri", roles: ["admin"] },
      { href: "/dashboard/produk?sumber=mitra", label: "Produk mitra", roles: ["admin"] },
      { href: "/dashboard/produk", label: "Produk", roles: ["mitra"] },
      { href: "/dashboard/pendaftar", label: "Pendaftar", roles: ["admin"] },
      { href: "/dashboard/masukan", label: "Masukan", roles: ["admin"] },
      { href: "/dashboard/jadi-mitra", label: "Jadi mitra", roles: ["member"] },
    ],
  },
  {
    title: "Website",
    items: [
      { href: "/dashboard/layanan", label: "Layanan", roles: ["admin"] },
      { href: "/dashboard/wisata", label: "Wisata", roles: ["admin"] },
      { href: "/dashboard/proyek", label: "Proyek", roles: ["admin"] },
      { href: "/dashboard/anggota", label: "Anggota", roles: ["admin"] },
      { href: "/dashboard/tampilan", label: "Tampilan", roles: ["admin"] },
      { href: "/dashboard/delta", label: "Delta", roles: ["admin"] },
    ],
  },
  {
    title: "Akun",
    items: [{ href: "/dashboard/profil", label: "Profil", roles: ["admin", "mitra", "member"] }],
  },
];

const ROLE_LABEL: Record<Role, string> = {
  admin: "Admin",
  mitra: "Penjual",
  member: "Member",
};

function isNavActive(href: string, path: string, searchParams: URLSearchParams) {
  const qIndex = href.indexOf("?");
  const hrefPath = qIndex >= 0 ? href.slice(0, qIndex) : href;
  const hrefQuery = qIndex >= 0 ? href.slice(qIndex + 1) : "";

  if (hrefPath === "/dashboard") return path === "/dashboard";
  if (path !== hrefPath) return false;

  if (!hrefQuery) return true;

  const want = new URLSearchParams(hrefQuery);
  const wantSumber = want.get("sumber");
  if (wantSumber) {
    const current = searchParams.get("sumber") ?? "sendiri";
    return current === wantSumber;
  }
  return true;
}

export function DashNav({
  name,
  role,
  city,
  storeHref,
}: {
  name: string;
  role: Role;
  city?: string | null;
  storeHref?: string | null;
}) {
  const path = usePathname();
  const searchParams = useSearchParams();
  const flat = GROUPS.flatMap((g) => g.items.filter((i) => i.roles.includes(role)));
  const subtitle = [ROLE_LABEL[role], city?.trim() || null].filter(Boolean).join(" · ");

  return (
    <aside className={`dash-side${role === "mitra" ? " dash-side--mitra" : ""}`}>
      <div className="dash-user">
        <span className="dash-avatar">{name.slice(0, 1).toUpperCase()}</span>
        <div>
          <strong>{name}</strong>
          <small>{subtitle}</small>
          {storeHref ? (
            <Link href={storeHref} className="dash-user__store">
              Etalase publik
            </Link>
          ) : null}
        </div>
        {role === "admin" ? <AdminNotify /> : null}
        <form action={signOut} className="dash-side__logout">
          <button className="dash-logout" type="submit">
            Keluar
          </button>
        </form>
      </div>

      {/* Mobile: satu baris chip; Desktop: grup */}
      <nav className="dash-nav dash-nav--chips" aria-label="Menu cepat">
        {flat.map((l) => (
          <Link
            key={`m-${l.href}`}
            href={l.href}
            className={isNavActive(l.href, path, searchParams) ? "is-active" : undefined}
          >
            {l.label}
          </Link>
        ))}
      </nav>

      <nav className="dash-nav dash-nav--groups" aria-label="Menu dashboard">
        {GROUPS.map((group) => {
          const items = group.items.filter((i) => i.roles.includes(role));
          if (!items.length) return null;
          return (
            <div key={group.title} className="dash-nav__group">
              <p className="dash-nav__title" aria-hidden="true">
                {group.title}
              </p>
              <div className="dash-nav__links" role="group" aria-label={group.title}>
                {items.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={isNavActive(l.href, path, searchParams) ? "is-active" : undefined}
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      <form action={signOut} className="dash-side__logout-desk">
        <button className="dash-logout" type="submit">
          Keluar
        </button>
      </form>

      <DashToast />
    </aside>
  );
}
