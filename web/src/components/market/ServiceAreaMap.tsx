"use client";

import { useEffect, useRef } from "react";

type Props = {
  lat: number;
  lng: number;
  radiusKm: number;
  label?: string | null;
};

export function ServiceAreaMap({ lat, lng, radiusKm, label }: Props) {
  const el = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let map: import("leaflet").Map | null = null;

    async function boot() {
      const L = await import("leaflet");
      if (cancelled || !el.current) return;

      const pin = L.divIcon({
        className: "area-map__pin",
        html: "<span></span>",
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      map = L.map(el.current, {
        center: [lat, lng],
        zoom: 13,
        scrollWheelZoom: false,
        dragging: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
        maxZoom: 19,
      }).addTo(map);

      L.marker([lat, lng], { icon: pin }).addTo(map);
      const circle = L.circle([lat, lng], {
        radius: Math.max(0.5, radiusKm) * 1000,
        color: "#1d4ed8",
        weight: 2,
        fillColor: "#1d4ed8",
        fillOpacity: 0.14,
      }).addTo(map);

      map.fitBounds(circle.getBounds(), { padding: [20, 20] });
    }

    boot();
    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [lat, lng, radiusKm]);

  return (
    <div className="service-area">
      <div className="service-area__map" ref={el} />
      <p className="service-area__caption">
        {label?.trim() ? `${label.trim()} · ` : ""}
        Radius ±{radiusKm} km
      </p>
    </div>
  );
}
