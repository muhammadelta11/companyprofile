/**
 * Next.js 16 / React RSC (Turbopack) — bug dev-only:
 * Performance.measure dipanggil dengan end time negatif saat prerender
 * di-abort (redirect/notFound/connection). Overlay error palsu.
 * @see https://github.com/vercel/next.js/issues/86060
 */
if (process.env.NODE_ENV === "development" && typeof performance !== "undefined") {
  const original = performance.measure.bind(performance);
  performance.measure = ((...args: Parameters<typeof performance.measure>) => {
    try {
      return original(...args);
    } catch (err) {
      if (
        err instanceof TypeError &&
        /negative time stamp/i.test(String((err as Error).message))
      ) {
        return undefined as unknown as PerformanceMeasure;
      }
      throw err;
    }
  }) as typeof performance.measure;
}
