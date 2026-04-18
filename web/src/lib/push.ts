import { apiFetch } from "@/lib/api";

export function urlBase64ToUint8Array(b64: string): Uint8Array {
  const padding = "=".repeat((4 - (b64.length % 4)) % 4);
  const base64 = (b64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    out[i] = raw.charCodeAt(i);
  }
  return out;
}

export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

export async function getSubscription(): Promise<PushSubscription | null> {
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.getSubscription();
}

export async function subscribeUserToPush(): Promise<void> {
  if (!isPushSupported()) {
    throw new Error("Push notifications are not supported in this browser.");
  }

  const { key } = await apiFetch<{ key: string }>(
    "/notifications/vapid-public-key",
  );
  if (!key) {
    throw new Error("VAPID public key unavailable.");
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Notification permission denied.");
  }

  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(key).buffer as ArrayBuffer,
    });
  }

  const raw = sub.toJSON() as {
    endpoint?: string;
    keys?: { p256dh?: string; auth?: string };
  };
  if (!raw.endpoint || !raw.keys?.p256dh || !raw.keys?.auth) {
    throw new Error("Subscription is missing required fields.");
  }

  await apiFetch<unknown>("/notifications/subscribe", {
    method: "POST",
    body: JSON.stringify({
      endpoint: raw.endpoint,
      keys: { p256dh: raw.keys.p256dh, auth: raw.keys.auth },
    }),
  });
}

export async function unsubscribeUserFromPush(): Promise<void> {
  const sub = await getSubscription();
  if (!sub) return;

  try {
    await apiFetch<unknown>("/notifications/subscribe", {
      method: "DELETE",
      body: JSON.stringify({ endpoint: sub.endpoint }),
    });
  } catch {
    // still try to drop the local subscription even if server call fails
  }

  await sub.unsubscribe();
}

export async function sendTestPush(): Promise<{ sent: number }> {
  return apiFetch<{ sent: number }>("/notifications/test", {
    method: "POST",
  });
}
