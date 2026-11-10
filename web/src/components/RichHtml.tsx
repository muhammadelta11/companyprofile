import { sanitizeRichHtml } from "@/lib/html";

/** Tampilkan HTML kaya dari dashboard dengan sanitasi XSS. */
export function RichHtml({
  html,
  className = "rich-html",
}: {
  html: string | null | undefined;
  className?: string;
}) {
  if (!html?.trim()) return null;
  const clean = sanitizeRichHtml(html);
  if (!clean) return null;
  return <div className={className} dangerouslySetInnerHTML={{ __html: clean }} />;
}
