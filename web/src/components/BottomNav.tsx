"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { SITE, waLink } from "@/data/site";
import { AccountLink } from "./AccountLink";
import { Icon, type IconName } from "./Icon";
import { useInstall } from "./pwa/useInstall";

const TABS: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Beranda", icon: "home" },
  { href: "/layanan", label: "Layanan", icon: "code" },
  { href: "/market", label: "Market", icon: "bag" },
  { href: "/wisata", label: "Wisata", icon: "compass" },
];

const MORE: { href: string; label: string; text: string; icon: IconName }[] = [
  { href: "/belajar", label: "Belajar", text: "Kimia · kedokteran · farmasi", icon: "code" },
  { href: "/game", label: "Game", text: "Puzzle geser · ranking", icon: "spark" },
  { href: "/proyek", label: "Proyek", text: "Portofolio karya", icon: "folder" },
  { href: "/gabung", label: "Gabung", text: "Member · mitra · partner", icon: "userPlus" },
  { href: "/tentang", label: "Tentang", text: "Kenalan dengan Mas'ud", icon: "user" },
  { href: "/masukan", label: "Masukan", text: "Lapor bug · usulan · keluhan", icon: "mail" },
];

function isActive(path: string, href: string) {
  return href === "/" ? path === "/" : path === href || path.startsWith(`${href}/`);
}

/** Navigasi bawah ala aplikasi Android — hanya tampil di layar HP/tablet. */
export function BottomNav({ onOpenDelta }: { onOpenDelta: () => void }) {
  const path = usePathname();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const { mode: installMode, install } = useInstall();
  const inTabs = TABS.some((t) => isActive(path, t.href));
  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    root.classList.add("sheet-open");
    window.addEventListener("keydown", onKey);
    return () => {
      root.classList.remove("sheet-open");
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <nav className="bnav" aria-label="Navigasi bawah">
        {TABS.map((t) => {
          const active = isActive(path, t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`bnav__item${active ? " is-active" : ""}`}
              aria-current={active ? "page" : undefined}
            >
              <span className="bnav__pill">
                <Icon name={t.icon} />
              </span>
              <span className="bnav__label">{t.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          className={`bnav__item${!inTabs || open ? " is-active" : ""}`}
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          <span className="bnav__pill">
            <Icon name="grid" />
          </span>
          <span className="bnav__label">Menu</span>
        </button>
      </nav>

      <AnimatePresence>
        {open ? (
          <motion.div
            key="sheet"
            className="sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
          >
            <motion.button
              type="button"
              className="sheet__backdrop"
              aria-label="Tutup menu"
              onClick={close}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              className="sheet__panel"
              initial={reduce ? { opacity: 0 } : { y: "100%" }}
              animate={reduce ? { opacity: 1 } : { y: 0 }}
              exit={reduce ? { opacity: 0 } : { y: "100%" }}
              transition={{ type: "spring", stiffness: 420, damping: 40 }}
              drag={reduce ? false : "y"}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.7 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 90 || info.velocity.y > 500) close();
              }}
            >
              <span className="sheet__handle" aria-hidden="true" />
              <div className="sheet__head">
                <strong>Menu</strong>
                <button type="button" className="sheet__close" onClick={close} aria-label="Tutup">
                  <Icon name="close" size={20} />
                </button>
              </div>

              <div className="sheet__grid">
                {MORE.map((m) => (
                  <Link
                    key={m.href}
                    href={m.href}
                    className={`sheet__tile${isActive(path, m.href) ? " is-active" : ""}`}
                    onClick={close}
                  >
                    <span className="sheet__icon">
                      <Icon name={m.icon} />
                    </span>
                    <strong>{m.label}</strong>
                    <small>{m.text}</small>
                  </Link>
                ))}
              </div>

              <div className="sheet__actions">
                <AccountLink variant="sheet" onNavigate={close} />
                <button
                  type="button"
                  className="sheet__action sheet__action--primary"
                  onClick={() => {
                    close();
                    onOpenDelta();
                  }}
                >
                  <Icon name="spark" size={20} />
                  Tanya Delta
                </button>
                <a
                  className="sheet__action"
                  href={waLink("Halo Mas'ud, saya dari masudeltamamy.com")}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Icon name="chat" size={20} />
                  WhatsApp
                </a>
                <Link
                  href="/masukan"
                  className="sheet__action sheet__action--feedback"
                  onClick={close}
                >
                  <Icon name="mail" size={20} />
                  Kirim masukan
                </Link>
              </div>

              {installMode === "prompt" ? (
                <button
                  type="button"
                  className="sheet__install"
                  onClick={() => {
                    close();
                    void install();
                  }}
                >
                  <Image src="/icons/icon-192.png" alt="" width={40} height={40} />
                  <span>
                    <strong>Pasang aplikasi</strong>
                    <small>Akses cepat dari layar utama HP</small>
                  </span>
                  <Icon name="download" size={20} />
                </button>
              ) : installMode === "ios" ? (
                <div className="sheet__install">
                  <Image src="/icons/icon-192.png" alt="" width={40} height={40} />
                  <span>
                    <strong>Pasang aplikasi</strong>
                    <small>Ketuk Bagikan, lalu “Tambah ke Layar Utama”</small>
                  </span>
                  <Icon name="share" size={20} />
                </div>
              ) : null}

              <p className="sheet__foot">
                {SITE.waDisplay} · {SITE.email}
              </p>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
