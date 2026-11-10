import { useCallback, useSyncExternalStore } from "react";
import { STANDALONE_QUERY } from "../intro/intro-config";
import { INSTALL_EVENT } from "./pwa-config";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

declare global {
  interface Window {
    __installPrompt?: InstallPromptEvent | null;
  }
  interface Navigator {
    /** Safari iOS: true saat dibuka dari ikon di layar utama. */
    standalone?: boolean;
  }
}

/** "prompt": Chrome/Edge bisa langsung memasang. "ios": hanya lewat menu Bagikan di Safari. */
export type InstallMode = "none" | "prompt" | "ios";

function subscribe(onChange: () => void) {
  const standalone = window.matchMedia(STANDALONE_QUERY);
  window.addEventListener(INSTALL_EVENT, onChange);
  standalone.addEventListener("change", onChange);
  return () => {
    window.removeEventListener(INSTALL_EVENT, onChange);
    standalone.removeEventListener("change", onChange);
  };
}

function getMode(): InstallMode {
  if (window.matchMedia(STANDALONE_QUERY).matches || navigator.standalone) return "none";
  if (window.__installPrompt) return "prompt";
  const ua = navigator.userAgent;
  const ios = /iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
  return ios ? "ios" : "none";
}

const getServerMode = (): InstallMode => "none";

export function useInstall() {
  const mode = useSyncExternalStore(subscribe, getMode, getServerMode);

  const install = useCallback(async () => {
    const prompt = window.__installPrompt;
    if (!prompt) return false;
    window.__installPrompt = null;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    window.dispatchEvent(new Event(INSTALL_EVENT));
    return outcome === "accepted";
  }, []);

  return { mode, install };
}
