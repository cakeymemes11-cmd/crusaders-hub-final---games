/* Scramjet service worker. Must live at the site root. */
importScripts("/scram/scramjet.all.js");

const { ScramjetServiceWorker } = $scramjetLoadWorker();
const scramjet = new ScramjetServiceWorker();

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

async function handleRequest(event) {
  try {
    await scramjet.loadConfig();
    // config is undefined until the page has run controller.init() once.
    // Without this guard, route() throws "reading 'prefix'" on every request.
    if (scramjet.config && scramjet.route(event)) {
      return await scramjet.fetch(event);
    }
  } catch (err) {
    console.error("[sw] scramjet error:", err);
  }
  return fetch(event.request);
}

self.addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event));
});