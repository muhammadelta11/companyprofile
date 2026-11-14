import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { getInboxThreads, getThreadMessages } from "@/lib/product-chat";
import { DashChatInbox } from "@/components/dashboard/DashChatInbox";
import { DashLoading } from "../ui";

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
  const initial = id ? threads.find((t) => t.id === id) ?? null : null;
  const initialMessages = initial ? await getThreadMessages(initial.id, user.id) : [];

  return (
    <DashChatInbox
      userId={user.id}
      threads={threads}
      initialId={initial?.id ?? null}
      initialMessages={initialMessages}
    />
  );
}
