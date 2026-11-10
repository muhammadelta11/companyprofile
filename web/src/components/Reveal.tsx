/**
 * Muncul halus saat masuk layar memakai CSS scroll-driven animation (lihat `.reveal`):
 * tanpa JavaScript, jalan di GPU, dan konten tetap terlihat di browser yang belum mendukung.
 * `delay` menggeser titik mulai animasi supaya item dalam grid muncul berurutan.
 */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <div
      className={className ? `reveal ${className}` : "reveal"}
      style={delay ? ({ "--reveal-delay": delay } as React.CSSProperties) : undefined}
    >
      {children}
    </div>
  );
}
