"use client";

import { useEffect } from "react";
import { markProductChatRead } from "@/app/actions";

/** Saat thread dibuka, tandai sudah dibaca + clear badge. */
export function ChatReadMarker({ threadId }: { threadId: string }) {
  useEffect(() => {
    if (!threadId) return;
    void markProductChatRead(threadId).then(() => {
      try {
        if ("clearAppBadge" in navigator) {
          void (navigator as Navigator & { clearAppBadge: () => Promise<void> }).clearAppBadge();
        }
      } catch {
        // ignore
      }
    });
  }, [threadId]);
  return null;
}
