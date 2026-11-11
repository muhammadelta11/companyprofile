const STATUS_LABEL: Record<string, string> = {
  pending: "Menunggu cek",
  approved: "Tayang / diterima",
  rejected: "Ditolak",
  active: "Aktif",
  suspended: "Diblokir",
  new: "Baru",
  contacted: "Sudah dihubungi",
  processing: "Sedang diproses",
  done: "Selesai",
  cancelled: "Dibatalkan",
  read: "Sudah dibaca",
  admin: "Admin",
  mitra: "Mitra penjual",
  member: "Member",
  partner: "Partner",
  bug: "Bug",
  idea: "Usulan",
  complaint: "Keluhan",
  other: "Lainnya",
};

export function Badge({ value, label }: { value: string; label?: string }) {
  return (
    <span className={`badge badge--${value}`}>{label ?? STATUS_LABEL[value] ?? value}</span>
  );
}

export function DashHead({ title, text }: { title: string; text?: string }) {
  return (
    <header className="dash-head">
      <h1>{title}</h1>
      {text ? <p className="dash-head__help">{text}</p> : null}
    </header>
  );
}

export function DashLoading() {
  return (
    <div className="dash-loading" aria-busy="true">
      <span />
      <span />
      <span />
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="dash-empty">{children}</p>;
}

export async function daysAgoIso(days: number) {
  const { connection } = await import("next/server");
  await connection(); // izinkan Date.now() di request-time
  return new Date(Date.now() - days * 864e5).toISOString();
}

export function formatDate(iso: string) {
  // Format tetap dari string ISO (bukan "sekarang") — aman untuk RSC.
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const months = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
    "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
  ];
  // Asia/Jakarta = UTC+7 (tanpa DST)
  const j = new Date(d.getTime() + 7 * 60 * 60 * 1000);
  const day = j.getUTCDate();
  const month = months[j.getUTCMonth()];
  const hh = String(j.getUTCHours()).padStart(2, "0");
  const mm = String(j.getUTCMinutes()).padStart(2, "0");
  return `${day} ${month}, ${hh}.${mm}`;
}
