"use client";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const detail =
    error.message &&
    !/digest|omitted|server components/i.test(error.message)
      ? error.message
      : null;

  return (
    <div className="dash-error">
      <h2>Ada yang gagal</h2>
      <p>
        {detail ??
          "Perubahan tidak tersimpan. Coba lagi, atau refresh halaman. Jika berulang, cek koneksi dan apakah kamu masih login."}
      </p>
      <ul className="dash-error__tips">
        <li>Gambar: pilih lewat “Tambah foto” (unggah per file, maks. 5 MB) lalu simpan form</li>
        <li>Jangan kirim banyak foto besar sekaligus lewat tombol Simpan saja</li>
        <li>Field wajib (nama produk, paket, dll.) sudah terisi</li>
        <li>Akun mitra harus berstatus aktif untuk mengunggah produk</li>
      </ul>
      <button className="btn btn-teal btn-sm" onClick={reset}>
        Coba lagi
      </button>
    </div>
  );
}
