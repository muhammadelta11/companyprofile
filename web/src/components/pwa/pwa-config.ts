export const INSTALL_EVENT = "pwa:change";

/**
 * Dipasang di <head>: `beforeinstallprompt` bisa muncul sebelum React selesai hydrate,
 * jadi event disimpan di window. preventDefault menahan mini-infobar bawaan Chrome
 * karena kita menampilkan tombol pasang sendiri.
 */
export const PWA_HEAD_SCRIPT = `(function(){function c(){dispatchEvent(new Event("${INSTALL_EVENT}"))}addEventListener("beforeinstallprompt",function(e){e.preventDefault();window.__installPrompt=e;c()});addEventListener("appinstalled",function(){window.__installPrompt=null;c()})})();`;
