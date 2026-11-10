"use client";

import { useEffect } from "react";
import { trackProductView } from "@/app/actions";

/** Sekali per sesi browser: hitung buka detail produk. */
export function ProductViewBeacon({ productId }: { productId: string }) {
  useEffect(() => {
    if (!productId || typeof window === "undefined") return;
    const key = `mk-view:${productId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // private mode / blocked storage — tetap coba track
    }
    void trackProductView(productId);
  }, [productId]);

  return null;
}
