export const INTRO_KEY = "intro-seen";

/** Halaman yang tidak perlu intro (area kerja/akun). */
export const INTRO_SKIP_PATH = /^\/(dashboard|masuk|auth)/;

/** Saat dibuka sebagai aplikasi terpasang, Android/iOS sudah menampilkan splash sendiri. */
export const STANDALONE_QUERY = "(display-mode: standalone)";

/**
 * Dijalankan di <head> sebelum paint: tandai <html data-intro="on|off">.
 * Pakai localStorage (sekali seumur browser), lewati di koneksi hemat/lambat.
 */
export const INTRO_HEAD_SCRIPT = `(function(){var d=document.documentElement;try{var c=navigator.connection||navigator.mozConnection||navigator.webkitConnection;var slow=!!(c&&(c.saveData||/2g/i.test(c.effectiveType||"")));var on=!localStorage.getItem("${INTRO_KEY}")&&!${INTRO_SKIP_PATH.toString()}.test(location.pathname)&&!matchMedia("(prefers-reduced-motion: reduce)").matches&&!matchMedia("${STANDALONE_QUERY}").matches&&!navigator.standalone&&!slow;d.setAttribute("data-intro",on?"on":"off")}catch(e){d.setAttribute("data-intro","off")}})();`;
