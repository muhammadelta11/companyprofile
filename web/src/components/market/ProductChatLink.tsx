"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { productChatHref } from "@/lib/access-policy";

/** Link Chat yang scroll ke #chat-produk (Next kadang mengabaikan hash). */
export function ProductChatLink({
  productId,
  loggedIn,
  className,
  children = "Chat",
}: {
  productId: string;
  loggedIn: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const href = productChatHref(productId, loggedIn);

  return (
    <Link
      href={href}
      className={className}
      onClick={(e) => {
        e.stopPropagation();
        if (!loggedIn) return;

        const path = `/market/${productId}`;
        const onPage = window.location.pathname === path;
        if (onPage) {
          e.preventDefault();
          const el = document.getElementById("chat-produk");
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
            history.replaceState(null, "", `${path}#chat-produk`);
          } else {
            router.push(`${path}#chat-produk`);
          }
          return;
        }

        // Navigasi ke detail + paksa scroll setelah mount
        try {
          sessionStorage.setItem("scroll-chat-produk", productId);
        } catch {
          /* ignore */
        }
      }}
    >
      {children}
    </Link>
  );
}
