"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useIntroDone } from "../intro/intro-context";
import { Icon } from "../Icon";
import { useInstall } from "./useInstall";

const SNOOZE_KEY = "install-snoozed";
const SNOOZE_MS = 14 * 24 * 60 * 60 * 1000;
const DELAY_MS = 5000;

function snoozed() {
  try {
    return Date.now() - Number(localStorage.getItem(SNOOZE_KEY) || 0) < SNOOZE_MS;
  } catch {
    return false;
  }
}

/** Ajakan pasang aplikasi; muncul sekali, lalu diam 14 hari bila ditutup. */
export function InstallBanner() {
  const { mode, install } = useInstall();
  const introDone = useIntroDone();
  const reduce = useReducedMotion();
  const [ready, setReady] = useState(false);
  const [hidden, setHidden] = useState(false);
  const visible = ready && !hidden && mode !== "none";

  useEffect(() => {
    if (mode === "none" || !introDone || snoozed()) return;
    const t = window.setTimeout(() => setReady(true), DELAY_MS);
    return () => window.clearTimeout(t);
  }, [mode, introDone]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("install-open", visible);
    return () => root.classList.remove("install-open");
  }, [visible]);

  const dismiss = () => {
    setHidden(true);
    try {
      localStorage.setItem(SNOOZE_KEY, String(Date.now()));
    } catch {}
  };

  return (
    <AnimatePresence>
      {visible ? (
        <motion.aside
          key="install"
          className={`install install--${mode}`}
          aria-label="Pasang aplikasi"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
        >
          <Image src="/icons/icon-192.png" alt="" width={48} height={48} className="install__icon" />
          <div className="install__text">
            <strong>Pasang aplikasi</strong>
            {mode === "ios" ? (
              <small>
                Ketuk <Icon name="share" size={14} /> <b>Bagikan</b>, lalu <b>Tambah ke Layar Utama</b>.
              </small>
            ) : (
              <small>Buka langsung dari layar utama HP.</small>
            )}
          </div>
          {mode === "prompt" ? (
            <button
              type="button"
              className="install__btn"
              onClick={async () => {
                if (!(await install())) dismiss();
              }}
            >
              Pasang
            </button>
          ) : null}
          <button type="button" className="install__close" onClick={dismiss} aria-label="Nanti saja">
            <Icon name="close" size={18} />
          </button>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}
