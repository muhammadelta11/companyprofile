const ITEMS = [
  "Jasa digital",
  "Sistem informasi",
  "Aplikasi bisnis",
  "Market produk",
  "Etalase mitra",
  "Order via WhatsApp",
  "Paket wisata",
  "Studi tour",
  "Kunjungan industri",
  "Delta AI bisnis",
];

export function Marquee() {
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee__track">
        {[...ITEMS, ...ITEMS].map((item, i) => (
          <span key={i}>
            {item}
            <i>✦</i>
          </span>
        ))}
      </div>
    </div>
  );
}
