import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { AppPage } from "@/components/AppPage";
import { ProductChat } from "@/components/market/ProductChat";
import { getCurrentUser } from "@/lib/auth";
import { getProduct } from "@/lib/content";
import {
  getBuyerThreadForProduct,
  getSellerThreadsForProduct,
  getThreadMessages,
  isChatSellerInbox,
} from "@/lib/product-chat";
import { sellerLabel } from "@/lib/product";
import { pageMetadata } from "@/lib/seo";
import ChatLoading from "./loading";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ chat?: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) return { title: "Chat produk" };
  return pageMetadata({
    title: `Chat · ${product.title}`,
    description: `Chat realtime dengan penjual tentang ${product.title}.`,
    path: `/market/${product.id}/chat`,
  });
}

/** Sync shell — hindari measure error Turbopack pada async page root. */
export default function ProductChatPage(props: Props) {
  return (
    <Suspense fallback={<ChatLoading />}>
      <ChatContent {...props} />
    </Suspense>
  );
}

async function ChatContent({ params, searchParams }: Props) {
  const [{ id }, { chat: chatParam }] = await Promise.all([params, searchParams]);
  const [product, user] = await Promise.all([getProduct(id), getCurrentUser()]);

  // getProduct() sudah hanya mengembalikan produk approved — jangan cek .status
  // (field itu tidak ada di ProductItem, jadi selalu "belum tayang").
  // Hindari notFound()/redirect() — memicu bug Performance.measure di Next 16 dev.
  if (!product) {
    return (
      <AppPage>
        <div className="apage-body mk-chat-page">
          <p className="mk-chat-page__loading">Produk tidak ditemukan atau belum tayang.</p>
          <p style={{ textAlign: "center" }}>
            <Link href="/market" className="btn btn-outline btn-sm">
              Kembali ke Market
            </Link>
          </p>
        </div>
      </AppPage>
    );
  }

  const canChat = Boolean(user && user.status !== "suspended");
  const sellerView = Boolean(user && isChatSellerInbox(user, product.owner_id));
  const sellerName = sellerLabel(product);

  let chatThread = null;
  let chatMessages: Awaited<ReturnType<typeof getThreadMessages>> = [];
  let sellerThreads: Awaited<ReturnType<typeof getSellerThreadsForProduct>> = [];

  if (user && canChat) {
    if (sellerView) {
      sellerThreads = await getSellerThreadsForProduct(product.id);
      const selected =
        (chatParam && sellerThreads.find((t) => t.id === chatParam)) ||
        sellerThreads[0] ||
        null;
      chatThread = selected;
      if (selected) {
        chatMessages = await getThreadMessages(selected.id, user.id);
      }
    } else {
      const buyerChat = await getBuyerThreadForProduct(product.id, user.id);
      chatThread = buyerChat.thread;
      chatMessages = buyerChat.messages;
    }
  }

  return (
    <AppPage>
      <div className="apage-body mk-chat-page">
        <header className="mk-chat-page__top">
          <Link href={`/market/${product.id}`} className="mk-chat-page__back">
            ← Produk
          </Link>
          <div className="mk-chat-page__product">
            {product.image_url ? (
              <Image
                src={product.image_url}
                alt=""
                width={56}
                height={56}
                className="mk-chat-page__thumb"
                priority
              />
            ) : (
              <span className="mk-chat-page__thumb mk-chat-page__thumb--empty" aria-hidden="true">
                {product.kind === "fisik" ? "F" : "D"}
              </span>
            )}
            <div>
              <p className="mk-chat-page__eyebrow">
                {sellerView ? "Chat pembeli · produk ini" : `Chat dengan ${sellerName}`}
              </p>
              <h1>{product.title}</h1>
              <p className="mk-chat-page__meta">
                {[product.price_label, sellerName, "Realtime di app"]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
          </div>
        </header>

        <ProductChat
          variant="page"
          productId={product.id}
          productTitle={product.title}
          productHref={`/market/${product.id}`}
          sellerName={sellerName}
          canChat={canChat}
          isSellerView={sellerView}
          userId={user?.id}
          userName={user?.name}
          thread={chatThread}
          messages={chatMessages}
          sellerThreads={sellerThreads}
        />
      </div>
    </AppPage>
  );
}
