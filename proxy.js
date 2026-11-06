/* Boots Scramjet in the page and exposes window.ArcadeProxy for app.js */
(function () {
  "use strict";

  var secure =
    location.protocol === "https:" ||
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1";
  var supported = "serviceWorker" in navigator && secure && location.protocol !== "file:";

  var api = { supported: supported, ready: null, encode: null, error: null };
  window.ArcadeProxy = api;
  if (!supported) {
    console.warn("[proxy] Scramjet needs service workers over https (or localhost).");
    return;
  }

  var loaded = {};
  function loadScript(src) {
    if (loaded[src]) return loaded[src];
    loaded[src] = new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
      s.onerror = function () { reject(new Error("Failed to load " + src)); };
      document.head.appendChild(s);
    });
    return loaded[src];
  }

  var controller = null;

  async function boot() {
    await loadScript("/scram/scramjet.all.js");
    await loadScript("/baremux/index.js");

    var mod = await $scramjetLoadController();
    controller = new mod.ScramjetController({
      prefix: "/service/",
      files: {
        wasm: "/scram/scramjet.wasm.wasm",
        all: "/scram/scramjet.all.js",
        sync: "/scram/scramjet.sync.js"
      },
      flags: { rewriterLogs: false, naiiveRewriter: false, scramitize: false },
      siteFlags: {
        "https://www.google.com/(search|sorry).*": { naiiveRewriter: true }
      }
    });

    await controller.init();
    await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    await navigator.serviceWorker.ready;

    var conn = new BareMux.BareMuxConnection("/baremux/worker.js");
    var wisp = (location.protocol === "https:" ? "wss://" : "ws://") + location.host + "/wisp/";
    await conn.setTransport("/libcurl/index.mjs", [{ wisp: wisp }]);
    console.log("[proxy] Scramjet ready");
  }

  // Old/mismatched Scramjet storage causes "object stores was not found".
  // Wipe it and start clean.
  async function resetStorage() {
    try {
      var regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(function (r) { return r.unregister(); }));
    } catch (e) {}
    try {
      var dbs = indexedDB.databases ? await indexedDB.databases() : [{ name: "$scramjet" }];
      await Promise.all(
        dbs
          .filter(function (d) { return d.name && /scramjet/i.test(d.name); })
          .map(function (d) {
            return new Promise(function (res) {
              var q = indexedDB.deleteDatabase(d.name);
              q.onsuccess = q.onerror = q.onblocked = function () { res(); };
              setTimeout(res, 1500);
            });
          })
      );
    } catch (e) {}
  }

  api.ready = boot()
    .catch(async function (err) {
      if (/object store|IDBDatabase|transaction/i.test(String(err && err.message))) {
        console.warn("[proxy] Resetting stale Scramjet storage and retrying…");
        await resetStorage();
        return boot();
      }
      throw err;
    })
    .catch(function (err) {
      api.error = err;
      console.error("[proxy] Scramjet failed to start:", err);
      throw err;
    });
  api.ready.catch(function () {});

  api.encode = async function (url) {
    await api.ready;
    return controller.encodeUrl(url);
  };
})();