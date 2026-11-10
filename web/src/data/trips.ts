export type Trip = {
  id: string;
  title: string;
  tag: string;
  duration: string;
  summary: string;
};

export const TRIPS: Trip[] = [
  {
    id: "wisata",
    title: "Paket Wisata",
    tag: "Rombongan",
    duration: "Fleksibel",
    summary: "Paket wisata siap jalan untuk rombongan umum.",
  },
  {
    id: "study-tour",
    title: "Studi Tour",
    tag: "Edukasi",
    duration: "1–3 hari",
    summary: "Program terstruktur untuk sekolah & kampus.",
  },
  {
    id: "kunjungan-industri",
    title: "Kunjungan Industri",
    tag: "Edukasi",
    duration: "1 hari+",
    summary: "Koordinasi lokasi, safety brief, dan pendamping.",
  },
  {
    id: "family-gathering",
    title: "Family Gathering",
    tag: "Keluarga",
    duration: "Half / full day",
    summary: "Gathering keluarga atau komunitas.",
  },
  {
    id: "outbound",
    title: "Corporate Outbound",
    tag: "Korporasi",
    duration: "1–2 hari",
    summary: "Outbound & team building sekolah, kampus, atau perusahaan.",
  },
  {
    id: "ziarah",
    title: "Wisata Religi / Ziarah",
    tag: "Religi",
    duration: "Fleksibel",
    summary: "Paket ziarah dengan transport & pendamping rombongan.",
  },
];
