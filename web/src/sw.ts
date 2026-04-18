/// <reference lib="webworker" />
import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { NetworkFirst, CacheFirst } from "workbox-strategies";

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>;
};

precacheAndRoute(self.__WB_MANIFEST);

registerRoute(
  ({ url }) => url.pathname.startsWith("/api/"),
  new NetworkFirst({ cacheName: "api-cache" }),
);
registerRoute(
  ({ request }) => ["style", "script", "image", "font"].includes(request.destination),
  new CacheFirst({ cacheName: "assets" }),
);

self.addEventListener("push", (event) => {
  const data = (() => {
    try {
      return (event as PushEvent).data?.json() ?? {};
    } catch {
      return { body: (event as PushEvent).data?.text() ?? "" };
    }
  })();
  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      // Suppress when the PWA is focused, unless the sender asked to force
      // display (e.g. the Settings "Send test notification" button).
      if (!data.force && clients.some((c) => (c as WindowClient).focused)) return;
      await self.registration.showNotification(data.title ?? "Voyager", {
        body: data.body,
        icon: "/icons/icon-192x192.svg",
        badge: "/icons/icon-192x192.svg",
        tag: data.tag,
        data: { url: data.url ?? "/" },
      });
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data as { url?: string })?.url ?? "/";
  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const c of clients) {
        if ("focus" in c) {
          await (c as WindowClient).focus();
          (c as WindowClient).navigate?.(url);
          return;
        }
      }
      await self.clients.openWindow(url);
    })(),
  );
});
