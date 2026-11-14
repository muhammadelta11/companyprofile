"use client";

import Link from "next/link";
import { productChatHref } from "@/lib/access-policy";
import { openSellerChat } from "@/components/market/SellerChatPanel";

/** Tombol Chat penjual → panel overlay (bukan WA, bukan komentar). */
export function ProductChatLink({
  productId,
  loggedIn,
  className,
  children = "Chat penjual",
}: {
  productId: string;
  loggedIn: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  const href = productChatHref(productId, loggedIn);

  return (
    <Link
      href={href}
      className={className}
      onClick={(e) => {
        e.stopPropagation();
        if (!loggedIn) return; // biarkan ke /masuk?next=.../chat
        e.preventDefault();
        openSellerChat(productId);
      }}
    >
      {children}
    </Link>
  );
}
