"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { Map as LeafletMap, Marker, Circle } from "leaflet";
import { DEFAULT_MAP_CENTER, searchPlaces } from "@/lib/maps";

type Props = {
  defaultLat?: number | null;
  defaultLng?: number | null;
  defaultRadiusKm?: number | null;
  defaultLabel?: string | null;
};

export function AreaMapField({
  defaultLat,
  defaultLng,
  defaultRadiusKm,
  defaultLabel,
}: Props) {
  const uid = useId();
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const circleRef = useRef<Circle | null>(null);
  const zoomRef = useRef<number>(12);

  const [lat, setLat] = useState<number | "">(
    typeof defaultLat === "number" ? defaultLat : ""
  );
  const [lng, setLng] = useState<number | "">(
    typeof defaultLng === "number" ? defaultLng : ""
  );
  const [radiusKm, setRadiusKm] = useState(
    typeof defaultRadiusKm === "number" && defaultRadiusKm > 0 ? defaultRadiusKm : 5
  );
  const [label, setLabel] = useState(defaultLabel ?? "");
  const [query, setQuery] = useState(defaultLabel ?? "");
  const [results, setResults] = useState<Array<{ label: string; lat: number; lng: number }>>(
    []
  );
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      const L = await import("leaflet");
      if (cancelled || !mapEl.current) return;

      const pin = L.divIcon({
        className: "area-map__pin leaflet-interactive",
        html: "<span></span>",
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const hasPoint = typeof defaultLat === "number" && typeof defaultLng === "number";
      const center = hasPoint
        ? { lat: defaultLat, lng: defaultLng }
        : DEFAULT_MAP_CENTER;
      const startZoom = hasPoint ? 14 : 12;
      zoomRef.current = startZoom;

      const map = L.map(mapEl.current, {
        center,
        zoom: startZoom,
        scrollWheelZoom: true,
        zoomControl: true,
      });
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
        maxZoom: 19,
      }).addTo(map);

      map.on("zoomend", () => {
        zoomRef.current = map.getZoom();
      });

      const marker = L.marker(center, {
        icon: pin,
        draggable: true,
        autoPan: false,
      });
      markerRef.current = marker;
      marker.dragging?.enable();

      const circle = L.circle(center, {
        radius: radiusKm * 1000,
        color: "#1d4ed8",
        weight: 2,
        fillColor: "#1d4ed8",
        fillOpacity: 0.12,
        interactive: false,
      });
      circleRef.current = circle;

      if (hasPoint) {
        marker.addTo(map);
        circle.addTo(map);
      }

      const keepZoom = () => {
        const z = zoomRef.current;
        if (map.getZoom() !== z) {
          map.setZoom(z, { animate: false });
        }
      };

      const place = (next: { lat: number; lng: number }, address?: string) => {
        const z = map.getZoom();
        zoomRef.current = z;

        setLat(next.lat);
        setLng(next.lng);
        if (address) {
          setLabel(address);
          setQuery(address);
        }

        marker.setLatLng(next);
        circle.setLatLng(next);
        if (!map.hasLayer(marker)) marker.addTo(map);
        if (!map.hasLayer(circle)) circle.addTo(map);
        marker.dragging?.enable();

        // Pastikan zoom tidak berubah sama sekali.
        map.setView(next, z, { animate: false });
        keepZoom();
      };

      map.on("click", (e) => {
        place({ lat: e.latlng.lat, lng: e.latlng.lng });
        setResults([]);
      });

      marker.on("drag", () => {
        circle.setLatLng(marker.getLatLng());
      });
      marker.on("dragend", () => {
        const p = marker.getLatLng();
        place({ lat: p.lat, lng: p.lng });
      });
    }

    boot();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
      circleRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    circleRef.current?.setRadius(radiusKm * 1000);
  }, [radiusKm]);

  async function onSearch() {
    setSearching(true);
    try {
      setResults(await searchPlaces(query));
    } finally {
      setSearching(false);
    }
  }

  function pickResult(item: { label: string; lat: number; lng: number }) {
    const marker = markerRef.current;
    const circle = circleRef.current;
    const map = mapRef.current;
    const z = map?.getZoom() ?? zoomRef.current;

    setLat(item.lat);
    setLng(item.lng);
    setLabel(item.label);
    setQuery(item.label);
    setResults([]);

    if (!marker || !circle || !map) return;

    marker.setLatLng([item.lat, item.lng]);
    circle.setLatLng([item.lat, item.lng]);
    if (!map.hasLayer(marker)) marker.addTo(map);
    if (!map.hasLayer(circle)) circle.addTo(map);
    marker.dragging?.enable();
    zoomRef.current = z;
    map.setView([item.lat, item.lng], z, { animate: true });
  }

  function clearPoint() {
    setLat("");
    setLng("");
    setLabel("");
    setQuery("");
    setResults([]);
    const map = mapRef.current;
    if (markerRef.current && map) map.removeLayer(markerRef.current);
    if (circleRef.current && map) map.removeLayer(circleRef.current);
  }

  return (
    <div className="area-map">
      <input type="hidden" name="area_lat" value={lat === "" ? "" : String(lat)} />
      <input type="hidden" name="area_lng" value={lng === "" ? "" : String(lng)} />
      <input type="hidden" name="area_radius_km" value={String(radiusKm)} />
      <input type="hidden" name="service_area" value={label} />

      <div className="area-map__search">
        <label htmlFor={`${uid}-search`}>Cari lokasi / alamat</label>
        <div className="area-map__search-row">
          <input
            id={`${uid}-search`}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Contoh: Semarang, Ngawi…"
            autoComplete="off"
          />
          <button
            type="button"
            className="btn btn-outline btn-sm"
            disabled={searching || query.trim().length < 2}
            onClick={() => onSearch()}
          >
            {searching ? "…" : "Cari"}
          </button>
        </div>
        {results.length ? (
          <ul className="area-map__results">
            {results.map((r) => (
              <li key={`${r.lat}-${r.lng}-${r.label}`}>
                <button type="button" onClick={() => pickResult(r)}>
                  {r.label}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="area-map__canvas" ref={mapEl} />

      <div className="area-map__tools">
        <label className="area-map__radius">
          Radius {radiusKm} km
          <input
            type="range"
            min={1}
            max={50}
            step={1}
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
          />
        </label>
        <button type="button" className="btn btn-outline btn-sm" onClick={clearPoint}>
          Hapus titik
        </button>
      </div>
      <p className="area-map__hint">
        Zoom bebas, klik untuk pasang titik — level zoom tidak diubah.
        {lat !== "" && lng !== ""
          ? ` Titik: ${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}.`
          : " Belum ada titik."}
      </p>
    </div>
  );
}
