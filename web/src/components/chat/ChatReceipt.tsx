import type { ProductChatReceipt } from "@/lib/product-chat-shared";

/** Centang status pesan sendiri: mengirim / terkirim / dibaca. */
export function ChatReceipt({ receipt }: { receipt?: ProductChatReceipt }) {
  if (!receipt) return null;
  const label =
    receipt === "read" ? "Dibaca" : receipt === "sent" ? "Terkirim" : "Mengirim";
  return (
    <span
      className={`chat-receipt chat-receipt--${receipt}`}
      title={label}
      aria-label={label}
    >
      {receipt === "sending" ? "·" : receipt === "sent" ? "✓" : "✓✓"}
    </span>
  );
}
