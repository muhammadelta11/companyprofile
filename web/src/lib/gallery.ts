/** Gabungkan cover + gallery jadi daftar unik (aman untuk Server & Client). */
export function mergeGallery(cover: string | null | undefined, gallery?: string[] | null) {
  const out: string[] = [];
  const push = (u?: string | null) => {
    if (u && !out.includes(u)) out.push(u);
  };
  if (Array.isArray(gallery)) gallery.forEach(push);
  push(cover);
  return out.slice(0, 8);
}
