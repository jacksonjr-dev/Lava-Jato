// Service worker da área do cliente: só recebe e mostra os avisos (web push).
// Não guarda páginas em cache.

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let message = { title: "LavaPro", body: "Seu atendimento foi atualizado.", url: "/cliente" };
  try {
    message = { ...message, ...event.data.json() };
  } catch {
    // Sem conteúdo ou fora do formato: mostra o aviso genérico.
  }
  event.waitUntil(
    self.registration.showNotification(message.title, {
      body: message.body,
      tag: message.tag,
      renotify: Boolean(message.tag),
      icon: "/favicon.svg",
      badge: "/favicon.svg",
      vibrate: [200, 100, 200],
      data: { url: message.url },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || "/cliente", self.location.origin);
  event.waitUntil(
    (async () => {
      // Se a área do cliente já está aberta, só traz a aba para frente.
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const open = windows.find((client) => new URL(client.url).pathname === url.pathname);
      if (open) return open.focus();
      return self.clients.openWindow(url.href);
    })(),
  );
});
