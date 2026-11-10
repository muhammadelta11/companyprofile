"use client";

import Link from "next/link";
import { useRef } from "react";
import { SITE, waLink } from "@/data/site";
import { HeroVectors } from "./HeroVectors";

const GIANT = "MARKET".split("");
const TITLE = ["Satu ekosistem", "untuk bisnis."];

/** Delay animasi CSS masuk (kelas vh-*). */
const delay = (d: number, y?: number) =>
  ({ "--d": `${d}s`, ...(y === undefined ? {} : { "--y": `${y}px` }) }) as React.CSSProperties;

type Layer = { el: HTMLElement | null; ax: number; ay: number };

/**
 * Hero beranda: fokus ekosistem bisnis (Digital · Market · Wisata).
 * Profil pribadi dialihkan ke /tentang — tidak dihapus.
 */
export function HeroImmersive() {
  const spot = useRef<HTMLDivElement>(null);
  const layers = useRef<Layer[]>([
    { el: null, ax: -34, ay: -22 },
    { el: null, ax: -26, ay: -12 },
    { el: null, ax: 18, ay: 10 },
    { el: null, ax: 30, ay: 18 },
  ]);

  function setLayer(i: number) {
    return (node: HTMLDivElement | HTMLParagraphElement | null) => {
      layers.current[i].el = node;
    };
  }

  function onMove(e: React.PointerEvent<HTMLElement>) {
    if (e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    if (spot.current) {
      spot.current.style.transform = `translate3d(${x - r.width * 0.6}px, ${y - r.height * 0.4}px, 0)`;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const nx = (x / r.width) * 2 - 1;
    const ny = (y / r.height) * 2 - 1;
    for (const layer of layers.current) {
      if (!layer.el) continue;
      layer.el.style.transform = `translate3d(${(nx * layer.ax).toFixed(1)}px, ${(ny * layer.ay).toFixed(1)}px, 0)`;
    }
  }

  function onLeave() {
    for (const layer of layers.current) {
      if (layer.el) layer.el.style.transform = "translate3d(0,0,0)";
    }
  }

  return (
    <section className="vhero vhero--biz" aria-label="Pembuka">
      <div className="container">
        <div className="vhero__card" onPointerMove={onMove} onPointerLeave={onLeave}>
          <div className="vhero__spot" ref={spot} aria-hidden="true" />

          <div className="vhero__vectors" ref={setLayer(0)} aria-hidden="true">
            <HeroVectors />
          </div>

          <p className="vhero__giant" aria-hidden="true" ref={setLayer(1)}>
            {GIANT.map((ch, i) => (
              <span className="vhero__giant-mask" key={i}>
                <span style={delay(0.05 + i * 0.07)}>{ch}</span>
              </span>
            ))}
          </p>

          <div className="vhero__top">
            <p className="vhero__kicker vh-rise" style={delay(0.2, 10)}>
              <span className="vhero__live" aria-hidden="true" />
              Digital · Market · Wisata
            </p>
            <div className="vh-rise" style={delay(0.25, 10)}>
              <Link className="vhero__corner" href="/tentang">
                <span>
                  <strong>Tentang brand</strong>
                  <small>Profil &amp; founder →</small>
                </span>
                <span className="vhero__corner-arrow" aria-hidden="true">↗</span>
              </Link>
            </div>
          </div>

          <div className="vhero__showcase" ref={setLayer(2)} aria-hidden="true">
            <div className="vhero__panel vhero__panel--a">
              <span>Market</span>
              <strong>Etalase produk</strong>
              <small>Official &amp; mitra</small>
            </div>
            <div className="vhero__panel vhero__panel--b">
              <span>Layanan</span>
              <strong>Web &amp; sistem</strong>
              <small>Siap pakai</small>
            </div>
            <div className="vhero__panel vhero__panel--c">
              <span>Wisata</span>
              <strong>Paket trip</strong>
              <small>Mbarep Tour</small>
            </div>
          </div>

          <div className="vhero__chips" ref={setLayer(3)} aria-hidden="true">
            <div className="vhero__chip vhero__chip--a" style={delay(0.55, 14)}>
              <span className="vhero__pulse" />
              <span>
                <strong>Delta AI online</strong>
                <small>Asisten bisnis 24/7</small>
              </span>
            </div>
            <div className="vhero__chip vhero__chip--b" style={delay(0.65, 14)}>
              <span className="vhero__chip-icon">✦</span>
              <span>
                <strong>Order via WA</strong>
                <small>Konfirmasi jelas</small>
              </span>
            </div>
            <div className="vhero__chip vhero__chip--c" style={delay(0.75, 14)}>
              <span className="vhero__chip-icon">↗</span>
              <span>
                <strong>Mitra bisa jual</strong>
                <small>Gabung etalase</small>
              </span>
            </div>
          </div>

          <div className="vhero__copy">
            <p className="vhero__eyebrow vh-rise" style={delay(0.2, 10)}>
              {SITE.brand}
            </p>
            <h1 className="vhero__title">
              {TITLE.map((line, i) => (
                <span className="vhero__line" key={line}>
                  <span style={delay(0.25 + i * 0.08)}>{line}</span>
                </span>
              ))}
            </h1>
            <p className="vhero__lead vh-rise" style={delay(0.4)}>
              Satu ekosistem untuk jasa digital, market produk, dan paket wisata —
              dibantu <strong>Delta</strong>, asisten AI bisnis.
            </p>
            <div className="vhero__actions vh-rise" style={delay(0.5)}>
              <Link className="vbtn" href="/market">
                Buka Market
                <span className="vbtn__icon" aria-hidden="true">→</span>
              </Link>
              <Link className="vplay" href="/layanan">
                <span className="vplay__ring" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="14" height="14">
                    <path d="M8 5.5v13l10.5-6.5z" fill="currentColor" />
                  </svg>
                </span>
                Lihat layanan
              </Link>
              <a
                className="vhero__wa-link"
                href={waLink("Halo, saya ingin tanya layanan/produk dari Mas'ud El-Tamamy.")}
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp bisnis
              </a>
            </div>
          </div>

          <a className="vhero__scroll" href="#jelajah" aria-label="Gulir ke bawah">
            <span />
          </a>
        </div>
      </div>
    </section>
  );
}
