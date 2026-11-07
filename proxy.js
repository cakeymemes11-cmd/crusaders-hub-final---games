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

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
      s.onerror = function () { reject(new Error("Failed to load " + src)); };
      document.head.appendChild(s);
    });
  }

  var controller = null;

  async function boot() {
    await loadScript("/scram/scramjet.all.js");
    await loadScript("/baremux/index.js");

    var loaded = await $scramjetLoadController();
    controller = new loaded.ScramjetController({
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

    // Save the config FIRST so the service worker can read it, then register.
    await controller.init();
    await navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
    await navigator.serviceWorker.ready;

    var conn = new BareMux.BareMuxConnection("/baremux/worker.js");
    var wisp = (location.protocol === "https:" ? "wss://" : "ws://") + location.host + "/wisp/";
    await conn.setTransport("/libcurl/index.mjs", [{ wisp: wisp }]);
    console.log("[proxy] Scramjet ready");
  }

  api.ready = boot().catch(function (err) {
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
