export const SITE = {
  brand: "Mas'ud El-Tamamy",
  domain: "masudeltamamy.com",
  tagline: "Digital · Market · Wisata",
  slogan: "BEBAS REPOT, HASIL TOP!",
  wa: "6285647121046",
  waDisplay: "0856-4712-1046",
  email: "muhammadsmas998@gmail.com",
  github: "https://github.com/muhammadelta11",
  saweria: "https://saweria.co/masudeltamamy",
  location: "Ngawi · Semarang",
  nick: "masudel-tamamy",
} as const;

export const WA_BASE = `https://wa.me/${SITE.wa}`;

export function waLink(text: string) {
  return `${WA_BASE}?text=${encodeURIComponent(text)}`;
}

/** Link WA ke nomor lain (format 08xx atau 62xx). */
export function waTo(phone: string, text: string) {
  const number = phone.replace(/\D/g, "").replace(/^0/, "62");
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}
