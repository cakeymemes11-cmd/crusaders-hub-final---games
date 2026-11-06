/* Scramjet service worker. Must live at the site root. */
importScripts("/scram/scramjet.all.js");

const PREFIX = "/service/"; // must match proxy.js
const { ScramjetServiceWorker } = $scramjetLoadWorker();
const scramjet = new ScramjetServiceWorker();

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Only proxied traffic goes through Scramjet. Games, scripts, CSS and
  // everything else on this site is left alone so it always loads normally.
  if (url.origin !== self.location.origin || !url.pathname.startsWith(PREFIX)) return;

  event.respondWith(
    (async () => {
      try {
        await scramjet.loadConfig();
        if (scramjet.route(event)) return await scramjet.fetch(event);
      } catch (err) {
        console.error("[sw] Scramjet error:", err);
        return new Response("Proxy error: " + (err && err.message ? err.message : err), {
          status: 502,
          headers: { "content-type": "text/plain" }
        });
      }
      return fetch(event.request);
    })()
  );
});