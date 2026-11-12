import { sendNotification, setVapidDetails } from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  badge?: number;
  tag?: string;
};

function vapidReady() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  const subject = process.env.VAPID_SUBJECT?.trim() || "mailto:admin@masudeltamamy.com";
  if (!publicKey || !privateKey) return null;
  return { publicKey, privateKey, subject };
}

export function getVapidPublicKey() {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() || "";
}

/** Kirim Web Push ke semua perangkat user. Gagal diam-diam. */
export async function sendPushToUser(userId: string, payload: PushPayload) {
  const vapid = vapidReady();
  if (!vapid || !userId) return;

  setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return;
  }

  const { data: rows } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (!rows?.length) return;

  const body = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url || "/dashboard/chat",
    badge: payload.badge ?? 1,
    tag: payload.tag || "chat",
  });

  await Promise.all(
    rows.map(async (row) => {
      try {
        await sendNotification(
          {
            endpoint: String(row.endpoint),
            keys: {
              p256dh: String(row.p256dh),
              auth: String(row.auth),
            },
          },
          body
        );
      } catch (err) {
        const status = (err as { statusCode?: number })?.statusCode;
        if (status === 404 || status === 410) {
          await admin.from("push_subscriptions").delete().eq("id", row.id);
        }
      }
    })
  );
}

/** Push ke semua akun admin (lonceng HP untuk masukan, pendaftar, dll.). */
export async function sendPushToAdmins(payload: PushPayload) {
  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return;
  }
  const { data: admins } = await admin
    .from("profiles")
    .select("id")
    .eq("role", "admin")
    .limit(12);
  await Promise.all(
    (admins || []).map((row) =>
      sendPushToUser(String(row.id), {
        ...payload,
        tag: payload.tag || "admin",
        url: payload.url || "/dashboard",
      })
    )
  );
}

/** Fire-and-forget helper — jangan gagalkan aksi utama. */
export function notifyAdmins(payload: PushPayload) {
  void sendPushToAdmins(payload).catch(() => {});
}

export function notifyUser(userId: string | null | undefined, payload: PushPayload) {
  if (!userId) return;
  void sendPushToUser(userId, payload).catch(() => {});
}
