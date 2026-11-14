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
      { href: "/dashboard/belajar", label: "Belajar", icon: "code", roles: ["admin"] },
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

const PAGE_TITLE: Record<string, string> = {
  "/dashboard": "Ringkasan",
  "/dashboard/pesanan": "Pesanan",
  "/dashboard/chat": "Chat",
  "/dashboard/produk": "Produk",
  "/dashboard/pendaftar": "Pendaftar",
  "/dashboard/masukan": "Masukan",
  "/dashboard/jadi-mitra": "Jadi mitra",
  "/dashboard/layanan": "Layanan",
  "/dashboard/wisata": "Wisata",
  "/dashboard/proyek": "Proyek",
  "/dashboard/anggota": "Anggota",
  "/dashboard/tampilan": "Tampilan",
  "/dashboard/belajar": "Belajar",
  "/dashboard/delta": "Delta",
  "/dashboard/profil": "Profil",
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

function titleForPath(path: string) {
  if (PAGE_TITLE[path]) return PAGE_TITLE[path];
  const hit = Object.keys(PAGE_TITLE).find((k) => k !== "/dashboard" && path.startsWith(k));
  return hit ? PAGE_TITLE[hit] : "Konsol";
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
  const [menuOpen, setMenuOpen] = useState(false);
  const subtitle = [ROLE_LABEL[role], city?.trim() || null].filter(Boolean).join(" · ");
  const pageTitle = titleForPath(path);

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

  useEffect(() => {
    setMenuOpen(false);
  }, [path, searchParams]);

  useEffect(() => {
    document.documentElement.classList.toggle("dash-menu-open", menuOpen);
    return () => document.documentElement.classList.remove("dash-menu-open");
  }, [menuOpen]);

  function labelFor(href: string, label: string) {
    if (href !== "/dashboard/chat" || unread <= 0) return label;
    return (
      <>
        {label}
        <em className="dash-nav__badge">{unread > 9 ? "9+" : unread}</em>
      </>
    );
  }

  const bottomTabs: { href: string; label: string; icon: IconName }[] = [
    { href: "/dashboard", label: "Ringkasan", icon: "dashboard" },
    { href: "/dashboard/pesanan", label: "Pesanan", icon: "bag" },
    { href: "/dashboard/chat", label: "Chat", icon: "chat" },
    role === "member"
      ? { href: "/dashboard/profil", label: "Profil", icon: "user" }
      : {
          href: role === "admin" ? "/dashboard/produk?sumber=sendiri" : "/dashboard/produk",
          label: "Produk",
          icon: "grid",
        },
  ];

  const bottomActive = bottomTabs.some((t) => isNavActive(t.href, path, searchParams));

  const nav = (
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
                  onClick={() => setMenuOpen(false)}
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
  );

  return (
    <>
      <header className="dash-top">
        <button
          type="button"
          className="dash-top__menu"
          aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
        <div className="dash-top__title">
          <strong>{pageTitle}</strong>
          <small>{subtitle}</small>
        </div>
        <div className="dash-top__actions">
          <ChatNotify initialCount={chatUnread} />
          {role === "admin" ? <AdminNotify /> : null}
          <Link href="/" className="dash-top__site" title="Ke situs publik">
            Situs
          </Link>
          <form action={signOut}>
            <button className="dash-top__out" type="submit">
              Keluar
            </button>
          </form>
        </div>
      </header>

      <button
        type="button"
        className="dash-side__backdrop"
        aria-label="Tutup menu"
        hidden={!menuOpen}
        onClick={() => setMenuOpen(false)}
      />

      <aside className={`dash-side${role === "mitra" ? " dash-side--mitra" : ""}${menuOpen ? " is-open" : ""}`}>
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
              <Link href={storeHref} className="dash-user__store" onClick={() => setMenuOpen(false)}>
                Etalase publik
              </Link>
            ) : null}
          </div>
        </div>

        {nav}

        <div className="dash-side__foot">
          <Link href="/" className="dash-side__site" onClick={() => setMenuOpen(false)}>
            ← Ke situs publik
          </Link>
          <form action={signOut}>
            <button className="dash-logout" type="submit">
              Keluar
            </button>
          </form>
        </div>
      </aside>

      <nav className="dash-bnav" aria-label="Menu bawah konsol">
        {bottomTabs.map((t) => {
          const active = isNavActive(t.href, path, searchParams);
          const chatBadge = t.href === "/dashboard/chat" && unread > 0;
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`dash-bnav__item${active ? " is-active" : ""}`}
              aria-current={active ? "page" : undefined}
            >
              <span className="dash-bnav__pill">
                <Icon name={t.icon} size={18} />
                {chatBadge ? <em className="dash-bnav__badge">{unread > 9 ? "9+" : unread}</em> : null}
              </span>
              <span className="dash-bnav__label">{t.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          className={`dash-bnav__item${!bottomActive || menuOpen ? " is-active" : ""}`}
          aria-label="Menu lainnya"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span className="dash-bnav__pill">
            <Icon name="grid" size={18} />
          </span>
          <span className="dash-bnav__label">Lainnya</span>
        </button>
      </nav>

      <DashToast />
    </>
  );
}
