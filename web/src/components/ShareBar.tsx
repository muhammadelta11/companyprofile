"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { absoluteUrl } from "@/lib/seo";

type Props = {
  title: string;
  path: string;
  text?: string;
  className?: string;
};

function buildLinks(url: string, title: string, text: string) {
  const shareText = text || title;
  return {
    wa: `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${url}`)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(shareText)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    x: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(shareText)}`,
  };
}

/** Bagikan item: Web Share API + fallback WA / Telegram / FB / X / salin link. */
export function ShareBar({ title, path, text, className = "" }: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const url = absoluteUrl(path);
  const links = buildLinks(url, title, text ?? title);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  async function onShare() {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title,
          text: text ?? title,
          url,
        });
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
      }
    }
    setOpen((v) => !v);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("Salin tautan:", url);
    }
  }

  return (
    <div className={`share-bar ${className}`.trim()} ref={rootRef}>
      <button
        type="button"
        className="btn btn-outline share-bar__trigger"
        onClick={onShare}
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
      >
        <Icon name="share" size={16} />
        <span>Bagikan</span>
      </button>

      {open ? (
        <div className="share-bar__menu" id={menuId} role="menu">
          <button type="button" role="menuitem" onClick={copyLink}>
            {copied ? "Tersalin ✓" : "Salin tautan"}
          </button>
          <a role="menuitem" href={links.wa} target="_blank" rel="noopener noreferrer">
            WhatsApp
          </a>
          <a role="menuitem" href={links.telegram} target="_blank" rel="noopener noreferrer">
            Telegram
          </a>
          <a role="menuitem" href={links.facebook} target="_blank" rel="noopener noreferrer">
            Facebook
          </a>
          <a role="menuitem" href={links.x} target="_blank" rel="noopener noreferrer">
            X / Twitter
          </a>
        </div>
      ) : null}
    </div>
  );
}
