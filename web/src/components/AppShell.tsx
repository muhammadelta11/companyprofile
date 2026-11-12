"use client";

import dynamic from "next/dynamic";
import { Suspense, useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { BottomNav } from "./BottomNav";
import { IntroShow } from "./intro/IntroShow";
import { IntroContext } from "./intro/intro-context";

/** Panel/banner berat: di-load belakangan supaya first paint tidak menunggu. */
const DeltaPanel = dynamic(() => import("./DeltaPanel").then((m) => m.DeltaPanel), {
  ssr: false,
});
const SellerChatPanel = dynamic(
  () => import("./market/SellerChatPanel").then((m) => m.SellerChatPanel),
  { ssr: false }
);
const InstallBanner = dynamic(() => import("./pwa/InstallBanner").then((m) => m.InstallBanner), {
  ssr: false,
});

function isAccountMode(path: string) {
  return path === "/dashboard" || path.startsWith("/dashboard/");
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname() || "/";
  const accountMode = isAccountMode(path);
  const [deltaOpen, setDeltaOpen] = useState(false);
  const [introDone, setIntroDone] = useState(false);
  const openDelta = useCallback(() => setDeltaOpen(true), []);
  const closeDelta = useCallback(() => setDeltaOpen(false), []);
  const finishIntro = useCallback(() => setIntroDone(true), []);
  const [fabCompact, setFabCompact] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("is-account-mode", accountMode);
    return () => {
      document.documentElement.classList.remove("is-account-mode");
    };
  }, [accountMode]);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const run = () => {
      if (process.env.NODE_ENV === "production") {
        navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" }).catch(() => {});
      } else {
        navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister()));
      }
    };
    const ric = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1800));
    const id = ric(run);
    return () => {
      if (window.cancelIdleCallback) window.cancelIdleCallback(id as number);
      else window.clearTimeout(id as number);
    };
  }, []);

  useEffect(() => {
    if (document.documentElement.getAttribute("data-intro") !== "on") {
      setIntroDone(true);
    }
  }, []);

  useEffect(() => {
    if (accountMode) return;
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (y > lastY + 6 && y > 120) setFabCompact(true);
      else if (y < lastY - 6 || y < 120) setFabCompact(false);
      lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [accountMode]);

  useEffect(() => {
    if (accountMode) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setDeltaOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("delta:open", openDelta);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("delta:open", openDelta);
    };
  }, [accountMode, openDelta]);

  return (
    <IntroContext.Provider value={introDone}>
      {!accountMode ? <IntroShow onDone={finishIntro} /> : null}
      {!accountMode ? (
        <Suspense fallback={<header className="site-header" aria-hidden="true" />}>
          <SiteHeader onOpenDelta={openDelta} />
        </Suspense>
      ) : null}
      <main className={`main-shell${accountMode ? " main-shell--account" : ""}`}>{children}</main>
      {!accountMode ? <SiteFooter /> : null}
      {!accountMode ? (
        <Suspense fallback={null}>
          <BottomNav onOpenDelta={openDelta} />
        </Suspense>
      ) : null}
      {!accountMode ? (
        <button
          type="button"
          className={`delta-fab${fabCompact ? " is-compact" : ""}`}
          onClick={openDelta}
          aria-label="Tanya Delta"
        >
          <img className="delta-fab__mark" src="/icon.svg" alt="" width={22} height={22} />
          <span>Delta</span>
        </button>
      ) : null}
      {!accountMode ? <InstallBanner /> : null}
      {!accountMode ? <DeltaPanel open={deltaOpen} onClose={closeDelta} /> : null}
      {!accountMode ? <SellerChatPanel /> : null}
    </IntroContext.Provider>
  );
}
