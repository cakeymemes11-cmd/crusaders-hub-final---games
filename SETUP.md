# Setup (GitHub Codespace)

1. Copy these into the **root** of your repo (overwrite `app.js` and `index.html`):
   `app.js  index.html  proxy.js  sw.js  server.js  package.json  tools/gen-games.cjs`

2. In the codespace terminal:
   ```bash
   npm install express @mercuryworkshop/scramjet @mercuryworkshop/bare-mux @mercuryworkshop/libcurl-transport @mercuryworkshop/wisp-js
   echo "node_modules" >> .gitignore
   npm run games     # rebuilds games.js from what's actually in games/
   npm start
   ```

3. Open the **Ports** tab -> right-click port 8080 -> **Port Visibility -> Public**.
   Open the forwarded URL (https://<name>-8080.app.github.dev). Don't use Live Server or python http.server; they can't run Scramjet.

4. First load only: DevTools -> Application -> Storage -> **Clear site data**, then refresh (clears the old broken service worker/settings).

5. Settings: Proxy type = Scramjet, leave "Custom proxy URL" blank, click **Test proxy** (should load example.com in the player).

If something fails, send me: the red errors from the browser console, the terminal output of `npm start`,
and `npm ls @mercuryworkshop/scramjet`.
