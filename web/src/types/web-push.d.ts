declare module "web-push" {
  export type PushSubscription = {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  };

  export function setVapidDetails(
    subject: string,
    publicKey: string,
    privateKey: string
  ): void;

  export function sendNotification(
    subscription: PushSubscription,
    payload?: string | Buffer,
    options?: object
  ): Promise<unknown>;

  export function generateVAPIDKeys(): { publicKey: string; privateKey: string };
}
