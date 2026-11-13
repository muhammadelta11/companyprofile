"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import type { Role } from "@/lib/auth";
import { signOut } from "../masuk/actions";
import { AdminNotify } from "@/components/dashboard/AdminNotify";
import { ChatNotify } from "@/components/dashboard/ChatNotify";
import { DashToast } from "@/components/dashboard/DashToast";
import { Icon, type IconName } from "@/components/Icon";

type NavItem = { href: string; label: string; icon: IconName; roles: Role[] };
type NavGroup = { title: string; items: NavItem[] };

const GROUPS: NavGroup[] = [
  {
    title: "Utama",
    items: [
      { href: "/dashboard", label: "Ringkasan", icon: "dashboard", roles: ["admin", "mitra", "member"] },
      { href: "/dashboard/pesanan", label: "Pesanan", icon: "bag", roles: ["admin", "mitra", "member"] },
      { href: "/dashboard/chat", label: "Chat", icon: "chat", roles: ["admin", "mitra", "member"] },
    ],
  },
  {
    title: "Operasional",
    items: [
      { href: "/dashboard/produk?sumber=sendiri", label: "Produk sendiri", icon: "grid", roles: ["admin"] },
      { href: "/dashboard/produk?sumber=mitra", label: "Produk mitra", icon: "bag", roles: ["admin"] },
      { href: "/dashboard/produk", label: "Produk", icon: "grid", roles: ["mitra"] },
      { href: "/dashboard/pendaftar", label: "Pendaftar", icon: "userPlus", roles: ["admin"] },
      { href: "/dashboard/masukan", label: "Masukan", icon: "mail", roles: ["admin"] },
      { href: "/dashboard/jadi-mitra", label: "Jadi mitra", icon: "userPlus", roles: ["member"] },
    ],
  },
  {
    title: "Konten situs",
    items: [
      { href: "/dashboard/layanan", label: "Layanan", icon: "code", roles: ["admin"] },
      { href: "/dashboard/wisata", label: "Wisata", icon: "compass", roles: ["admin"] },
      { href: "/dashboard/proyek", label: "Proyek", icon: "folder", roles: ["admin"] },
      { href: "/dashboard/anggota", label: "Anggota", icon: "user", roles: ["admin"] },
      { href: "/dashboard/tampilan", label: "Tampilan", icon: "spark", roles: ["admin"] },
      { href: "/dashboard/delta", label: "Delta", icon: "spark", roles: ["admin"] },
    ],
  },
  {
    title: "Akun",
    items: [{ href: "/dashboard/profil", label: "Profil", icon: "user", roles: ["admin", "mitra", "member"] }],
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
  chatUnread = 0,
}: {
  name: string;
  role: Role;
  city?: string | null;
  storeHref?: string | null;
  chatUnread?: number;
}) {
  const path = usePathname();
  const searchParams = useSearchParams();
  const [unread, setUnread] = useState(chatUnread);
  const flat = GROUPS.flatMap((g) => g.items.filter((i) => i.roles.includes(role)));
  const subtitle = [ROLE_LABEL[role], city?.trim() || null].filter(Boolean).join(" · ");

  useEffect(() => {
    setUnread(chatUnread);
  }, [chatUnread]);

  useEffect(() => {
    const onUnread = (e: Event) => {
      const count = (e as CustomEvent<{ count?: number }>).detail?.count;
      if (typeof count === "number") setUnread(count);
    };
    window.addEventListener("chat-unread", onUnread);
    return () => window.removeEventListener("chat-unread", onUnread);
  }, []);

  function labelFor(href: string, label: string) {
    if (href !== "/dashboard/chat" || unread <= 0) return label;
    return (
      <>
        {label}
        <em className="dash-nav__badge">{unread > 9 ? "9+" : unread}</em>
      </>
    );
  }

  return (
    <aside className={`dash-side${role === "mitra" ? " dash-side--mitra" : ""}`}>
      <div className="dash-brand">
        <span className="dash-brand__mark" aria-hidden="true">
          M
        </span>
        <div>
          <strong>Konsol</strong>
          <small>Mas&apos;ud El-Tamamy</small>
        </div>
      </div>

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
        <div className="dash-user__tools">
          <ChatNotify initialCount={chatUnread} />
          {role === "admin" ? <AdminNotify /> : null}
        </div>
      </div>

      <nav className="dash-nav dash-nav--chips" aria-label="Menu cepat">
        {flat.map((l) => (
          <Link
            key={`m-${l.href}`}
            href={l.href}
            className={isNavActive(l.href, path, searchParams) ? "is-active" : undefined}
          >
            <Icon name={l.icon} size={16} />
            {labelFor(l.href, l.label)}
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
                    <Icon name={l.icon} size={16} />
                    {labelFor(l.href, l.label)}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="dash-side__foot">
        <Link href="/" className="dash-side__site">
          ← Ke situs publik
        </Link>
        <form action={signOut}>
          <button className="dash-logout" type="submit">
            Keluar
          </button>
        </form>
      </div>

      <DashToast />
    </aside>
  );
}
