"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { SITE } from "@/data/site";
import { INTRO_KEY, INTRO_SKIP_PATH, STANDALONE_QUERY } from "./intro-config";

/** Hold singkat + tirai. Visual sudah di SSR/first paint lewat html[data-intro=on]. */
const PLAY_MS = 520;
const EXIT_MS = 360;

function shouldPlay() {
  try {
    const conn = (
      navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }
    ).connection;
    const slow = !!(conn && (conn.saveData || /2g/i.test(conn.effectiveType || "")));
    return (
      !localStorage.getItem(INTRO_KEY) &&
      !INTRO_SKIP_PATH.test(window.location.pathname) &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
      !window.matchMedia(STANDALONE_QUERY).matches &&
      !navigator.standalone &&
      !slow
    );
  } catch {
    return false;
  }
}

/**
 * Intro ringan: mark M + brand + tirai. Tidak pakai Framer / ring / meter.
 * Markup ikut SSR; head script yang mengontrol tampil/tidak sebelum JS siap.
 */
export function IntroShow({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<"play" | "exit" | "done">("play");
  const done = useRef(false);

  const finish = (next: "exit" | "done") => {
    if (next === "exit" && !done.current) {
      done.current = true;
      try {
        localStorage.setItem(INTRO_KEY, "1");
      } catch {}
      document.documentElement.setAttribute("data-intro", "off");
      onDone();
    }
    setPhase(next);
  };

  useLayoutEffect(() => {
    if (!shouldPlay()) {
      document.documentElement.setAttribute("data-intro", "off");
      onDone();
      setPhase("done");
    }
  }, [onDone]);

  useEffect(() => {
    if (phase !== "play") return;
    if (document.documentElement.getAttribute("data-intro") !== "on") return;

    const skip = () => finish("exit");
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter") skip();
    };
    const timer = window.setTimeout(skip, PLAY_MS);
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
    };
  }, [phase, onDone]);

  useEffect(() => {
    if (phase !== "exit") return;
    const timer = window.setTimeout(() => setPhase("done"), EXIT_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  if (phase === "done") return null;

  return (
    <div className="intro" data-phase={phase} aria-hidden={phase === "exit"}>
      <div className="intro__panel intro__panel--top" />
      <div className="intro__panel intro__panel--bottom" />

      <div className="intro__stage">
        <div className="intro__mark" aria-hidden="true">
          <svg viewBox="0 0 120 120" className="intro__mark-svg">
            <defs>
              <linearGradient id="intro-m" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#bae6fd" />
                <stop offset="1" stopColor="#fff" />
              </linearGradient>
            </defs>
            <circle cx="60" cy="60" r="54" className="intro__mark-ring" />
            <path
              d="M38 82 V48 L60 72 L82 48 V82"
              fill="none"
              stroke="url(#intro-m)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div className="intro__brand">
          <p className="intro__word">{SITE.brand.toUpperCase()}</p>
          <p className="intro__tag">{SITE.tagline}</p>
        </div>
      </div>

      <button type="button" className="intro__skip" onClick={() => finish("exit")}>
        Lewati <span aria-hidden="true">→</span>
      </button>
    </div>
  );
}
