import Link from "next/link";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import {
  getInboxThreads,
  getThreadMessages,
  type ProductChatMessage,
  type ProductChatThread,
} from "@/lib/product-chat";
import { ChatReadMarker } from "@/components/dashboard/ChatReadMarker";
import { DashChatThread } from "@/components/dashboard/DashChatThread";
import { DashHead, DashLoading, Empty, formatDate } from "../ui";

type Props = { searchParams: Promise<{ id?: string }> };

export default function ChatInboxPage({ searchParams }: Props) {
  return (
    <Suspense fallback={<DashLoading />}>
      <Inbox searchParams={searchParams} />
    </Suspense>
  );
}

async function Inbox({ searchParams }: Props) {
  const user = await requireUser();
  const { id } = await searchParams;
  const threads = await getInboxThreads(user);
  // Jangan auto-buka thread pertama — list harus terlihat dulu (terutama di HP).
  const active = id ? threads.find((t) => t.id === id) ?? null : null;
  let messages: ProductChatMessage[] = [];
  if (active) {
    messages = await getThreadMessages(active.id, user.id);
  }

  const buyerLabel = active
    ? active.buyer_id === user.id
      ? "Kamu sebagai pembeli"
      : `Pembeli: ${active.buyer_name}`
    : "";

  return (
    <>
      <DashHead
        title="Chat"
        text="Satu thread per produk + pembeli. User yang sama di 3 produk = 3 chat terpisah."
      />
      {!threads.length ? (
        <Empty>Belum ada chat. Pembeli memulai dari tombol Chat penjual di Market.</Empty>
      ) : (
        <div className={`dash-chat${active ? " has-thread" : ""}`}>
          <aside className="dash-chat__list" aria-label="Daftar percakapan">
            <p className="dash-chat__list-head">
              {threads.length} percakapan
            </p>
            {threads.map((t) => (
              <ThreadLink
                key={t.id}
                thread={t}
                activeId={active?.id}
                viewerId={user.id}
              />
            ))}
          </aside>
          <section className="dash-chat__pane">
            {active ? (
              <>
                <ChatReadMarker threadId={active.id} />
                <DashChatThread
                  key={active.id}
                  productId={active.product_id}
                  productTitle={active.product_title || "Produk"}
                  threadId={active.id}
                  userId={user.id}
                  buyerLabel={buyerLabel}
                  initialMessages={messages}
                />
              </>
            ) : (
              <div className="dash-chat__idle">
                <p>
                  Pilih percakapan di daftar.
                  <br />
                  <small>Produk berbeda = chat terpisah, meski pembelinya sama.</small>
                </p>
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}

function ThreadLink({
  thread,
  activeId,
  viewerId,
}: {
  thread: ProductChatThread;
  activeId?: string;
  viewerId: string;
}) {
  const active = thread.id === activeId;
  const unread = thread.unread ?? 0;
  const iAmBuyer = thread.buyer_id === viewerId;
  const title = thread.product_title || "Produk";
  const subtitle = iAmBuyer
    ? "Kamu · pembeli"
    : thread.buyer_name || "Pembeli";
  const initial = (iAmBuyer ? title : subtitle).slice(0, 1).toUpperCase();

  return (
    <Link
      href={`/dashboard/chat?id=${thread.id}`}
      className={`dash-chat__item${active ? " is-active" : ""}${unread > 0 ? " is-unread" : ""}`}
    >
      <span className="dash-chat__avatar" aria-hidden="true">
        {initial}
      </span>
      <span className="dash-chat__item-body">
        <strong>
          {title}
          {unread > 0 ? <em>{unread > 9 ? "9+" : unread}</em> : null}
        </strong>
        <span>{subtitle}</span>
        <p>{thread.preview || "Belum ada pesan"}</p>
      </span>
      <time>{formatDate(thread.last_message_at)}</time>
    </Link>
  );
}
