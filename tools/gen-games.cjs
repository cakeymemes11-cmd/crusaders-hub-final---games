// Rebuilds games.js from the real files in games/ so nothing is missing or dead.
// Keeps the names you already have, keeps CAMPUS_APPS, and drops entries whose file is gone.
//   npm run games
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const gamesDir = path.join(root, "games");
const outFile = path.join(root, "games.js");

const win = {};
if (fs.existsSync(outFile)) {
  try { new Function("window", fs.readFileSync(outFile, "utf8"))(win); } catch (e) { console.warn("Could not read old games.js:", e.message); }
}
const oldGames = win.CAMPUS_GAMES || [];
const apps = win.CAMPUS_APPS || [];

if (!fs.existsSync(gamesDir)) {
  console.error("No games/ folder found at " + gamesDir);
  process.exit(1);
}

const files = fs.readdirSync(gamesDir, { withFileTypes: true })
  .filter((d) => d.isFile() && /\.html?$/i.test(d.name))
  .map((d) => d.name.normalize("NFC"));

const oldByFile = new Map(oldGames.map((g) => [String(g.file).normalize("NFC"), g.name]));

function prettify(file) {
  let n = file.replace(/\.html?$/i, "").replace(/\s*\(\d+\)$/, "");
  n = n.replace(/^cl(?=[A-Za-z0-9])/, ""); // strip "cl" prefix used by the pack
  n = n.replace(/[_-]+/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").trim();
  return n ? n.charAt(0).toUpperCase() + n.slice(1) : file;
}

const list = files.map((file) => ({ name: oldByFile.get(file) || prettify(file), file }));

// Make names unique so two different files never look identical
const seen = new Map();
list.forEach((g) => {
  const k = g.name.toLowerCase();
  seen.set(k, (seen.get(k) || 0) + 1);
});
const counter = new Map();
list.forEach((g) => {
  const k = g.name.toLowerCase();
  if (seen.get(k) > 1) {
    const c = (counter.get(k) || 0) + 1;
    counter.set(k, c);
    if (c > 1) g.name = g.name + " " + c;
  }
});

list.sort((a, b) => a.name.localeCompare(b.name));

const missing = oldGames.filter((g) => !files.includes(String(g.file).normalize("NFC")));
const added = list.filter((g) => !oldByFile.has(g.file));

const out =
  "window.CAMPUS_GAMES = [\n" +
  list.map((g) => "  { name: " + JSON.stringify(g.name) + ", file: " + JSON.stringify(g.file) + " }").join(",\n") +
  "\n];\n\nwindow.CAMPUS_APPS = [\n" +
  apps.map((a) => "  " + JSON.stringify(a)).join(",\n") +
  "\n];\n";

fs.writeFileSync(outFile, out);
console.log("Wrote " + list.length + " games to games.js");
console.log("  new files added: " + added.length);
console.log("  dead entries removed (file not in games/): " + missing.length);
missing.slice(0, 20).forEach((g) => console.log("    - " + g.file));
