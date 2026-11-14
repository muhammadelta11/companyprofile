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
  const active = id ? threads.find((t) => t.id === id) ?? null : threads[0] ?? null;
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
      <DashHead title="Chat" text="Kotak masuk Market — gaya WhatsApp." />
      {!threads.length ? (
        <Empty>Belum ada chat. Pembeli memulai dari tombol Chat penjual di Market.</Empty>
      ) : (
        <div className={`dash-chat${active ? " has-thread" : ""}`}>
          <aside className="dash-chat__list" aria-label="Daftar percakapan">
            {threads.map((t) => (
              <ThreadLink key={t.id} thread={t} activeId={active?.id} />
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
                <p>Pilih chat di kiri untuk mulai membalas.</p>
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
}: {
  thread: ProductChatThread;
  activeId?: string;
}) {
  const active = thread.id === activeId;
  const unread = thread.unread ?? 0;
  const name = thread.buyer_name || "Pembeli";
  return (
    <Link
      href={`/dashboard/chat?id=${thread.id}`}
      className={`dash-chat__item${active ? " is-active" : ""}${unread > 0 ? " is-unread" : ""}`}
    >
      <span className="dash-chat__avatar" aria-hidden="true">
        {name.slice(0, 1).toUpperCase()}
      </span>
      <span className="dash-chat__item-body">
        <strong>
          {name}
          {unread > 0 ? <em>{unread > 9 ? "9+" : unread}</em> : null}
        </strong>
        <span>{thread.product_title}</span>
        <p>{thread.preview || "—"}</p>
      </span>
      <time>{formatDate(thread.last_message_at)}</time>
    </Link>
  );
}
