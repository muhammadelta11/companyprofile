const FEATURES = [
  {
    title: "Chat bisnis",
    text: "WhatsApp resmi brand",
    icon: <path d="M20.5 12a8.5 8.5 0 0 1-12.3 7.6L3.5 20.5l1-4.4A8.5 8.5 0 1 1 20.5 12Z" />,
  },
  {
    title: "Delta AI 24/7",
    text: "Asisten bisnis kapan saja",
    icon: (
      <>
        <path d="M11 3.5l1.9 5.1 5.1 1.9-5.1 1.9L11 17.5l-1.9-5.1L4 10.5l5.1-1.9Z" />
        <path d="M18.5 15.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8Z" />
      </>
    ),
  },
  {
    title: "Order dikonfirmasi",
    text: "Detail & bayar jelas via WA",
    icon: (
      <>
        <path d="M12 3l7.5 2.8v5.7c0 4.4-3.2 8.1-7.5 9-4.3-.9-7.5-4.6-7.5-9V5.8Z" />
        <path d="M8.6 12.1l2.3 2.3 4.5-4.8" />
      </>
    ),
  },
  {
    title: "Market + wisata",
    text: "Etalase & paket trip",
    icon: (
      <>
        <path d="M5 8h14l-1.2 12H6.2Z" />
        <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
      </>
    ),
  },
];

export function FeatureStrip() {
  return (
    <div className="container">
      <ul className="vfeat">
        {FEATURES.map((f) => (
          <li key={f.title} className="vfeat__item">
            <span className="vfeat__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                {f.icon}
              </svg>
            </span>
            <span>
              <strong>{f.title}</strong>
              <small>{f.text}</small>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
