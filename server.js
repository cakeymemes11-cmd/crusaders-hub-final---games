// Serves the site + Scramjet files + a Wisp websocket for proxy traffic.
import express from "express";
import { createServer } from "node:http";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const PORT = Number(process.env.PORT) || 8080;

// Find a package's dist folder. Tries the package's own exported helper first,
// then common folder layouts, so small version changes don't break startup.
async function findDir(label, helper, fallbacks) {
  try {
    const p = await helper();
    if (p && existsSync(p)) return p;
  } catch {}
  for (const rel of fallbacks) {
    const abs = path.join(__dirname, "node_modules", rel);
    if (existsSync(abs)) return abs;
  }
  console.error(`\n[server] Could not find ${label}. Did you run:\n  npm install express @mercuryworkshop/scramjet @mercuryworkshop/bare-mux @mercuryworkshop/libcurl-transport @mercuryworkshop/wisp-js\n`);
  process.exit(1);
}

const scramjetDir = await findDir(
  "Scramjet",
  async () => (await import("@mercuryworkshop/scramjet/path")).scramjetPath,
  ["@mercuryworkshop/scramjet/dist"]
);
const baremuxDir = await findDir(
  "bare-mux",
  async () => (await import("@mercuryworkshop/bare-mux/node")).baremuxPath,
  ["@mercuryworkshop/bare-mux/dist"]
);
const libcurlDir = await findDir(
  "libcurl-transport",
  async () => (await import("@mercuryworkshop/libcurl-transport")).libcurlPath,
  ["@mercuryworkshop/libcurl-transport/dist"]
);

const { server: wisp } = await import("@mercuryworkshop/wisp-js/server");
Object.assign(wisp.options, {
  allow_udp_streams: false,
  allow_private_ips: false,
  allow_loopback_ips: false
});

const app = express();

// Never serve server code / deps / git data as static files
app.use((req, res, next) => {
  if (/^\/(node_modules|\.git|server\.js|package(-lock)?\.json|tools)(\/|$)/i.test(req.path)) {
    return res.status(404).end();
  }
  next();
});

app.use("/scram", express.static(scramjetDir));
app.use("/baremux", express.static(baremuxDir));
app.use("/libcurl", express.static(libcurlDir));

// The service worker must be served from "/" so its scope covers the site
app.get("/sw.js", (req, res) => {
  res.set("Service-Worker-Allowed", "/");
  res.set("Cache-Control", "no-cache");
  res.type("application/javascript").sendFile(path.join(__dirname, "sw.js"));
});

app.use(express.static(__dirname, { extensions: ["html"], dotfiles: "ignore" }));

const server = createServer(app);
server.on("upgrade", (req, socket, head) => {
  if (req.url && req.url.startsWith("/wisp/")) wisp.routeRequest(req, socket, head);
  else socket.destroy();
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`\nCrusaders Hub running on port ${PORT}`);
  console.log("In a Codespace: open the Ports tab, set this port to Public, then open the forwarded URL.\n");
});
