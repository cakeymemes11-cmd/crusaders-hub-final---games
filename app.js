(() => {
  "use strict";

  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  const store = {
    get(k, fb) {
      try {
        const v = localStorage.getItem("arcade_" + k);
        return v === null ? fb : JSON.parse(v);
      } catch (e) {
        return fb;
      }
    },
    set(k, v) {
      try {
        localStorage.setItem("arcade_" + k, JSON.stringify(v));
      } catch (e) {}
    }
  };

  const engines = {
    google: (q) => "https://www.google.com/search?q=" + encodeURIComponent(q),
    bing: (q) => "https://www.bing.com/search?q=" + encodeURIComponent(q),
    duckduckgo: (q) => "https://duckduckgo.com/?q=" + encodeURIComponent(q),
    startpage: (q) => "https://www.startpage.com/sp/search?query=" + encodeURIComponent(q),
    brave: (q) => "https://search.brave.com/search?q=" + encodeURIComponent(q),
    youtube: (q) => "https://www.youtube.com/results?search_query=" + encodeURIComponent(q)
  };

  const cloaks = {
    none: { title: "Arcade", icon: null },
    google: { title: "Google", icon: "https://www.google.com/favicon.ico" },
    classroom: { title: "Classes", icon: "https://ssl.gstatic.com/classroom/favicon.ico" },
    drive: {
      title: "My Drive - Google Drive",
      icon: "https://ssl.gstatic.com/docs/doclist/images/drive_2022q3_32dp.png"
    },
    docs: {
      title: "Document",
      icon: "https://ssl.gstatic.com/docs/documents/images/kix-favicon7.ico"
    }
  };

  const facts = [
    "Octopuses have three hearts and blue blood.",
    "Bananas are berries; strawberries are not.",
    "Honey never spoils.",
    "A day on Venus is longer than its year.",
    "Wombat poop is cube-shaped.",
    "Sharks are older than trees.",
    "There are more chess games than atoms in the observable universe."
  ];
  const jokes = [
    "Why did the scarecrow get promoted? He was outstanding in his field.",
    "I told my computer I needed a break… it froze.",
    "Why don't skeletons fight? They don't have the guts.",
    "Parallel lines have so much in common — a shame they'll never meet."
  ];

  const state = {
    letter: "all",
    sort: "az",
    query: "",
    currentUrl: "",
    currentName: "",
    isLocalGame: false,
    favs: store.get("favs", []),
    recent: store.get("recent", []),
    searches: store.get("searches", []),
    chat: store.get("chat", []),
    aiLog: store.get("aiLog", []),
    name: store.get("name", "arcade"),
    nick: store.get("nick", "guest"),
    bg: store.get("bg", "mountain"),
    cloak: store.get("cloak", "none"),
    panic: store.get("panic", "https://classroom.google.com"),
    proxyBase: store.get(
      "proxyBase",
      "https://starizcool.github.io/crusaders-hub-final---games/scramjet/"
    ),
    proxyType: store.get("proxyType", "scramjet"),
    gamesPath: store.get("gamesPath", "games/"),
    engine: store.get("engine", "google"),
    motion: store.get("motion", true)
  };

  function games() {
    return window.CAMPUS_GAMES || [];
  }
  function apps() {
    return window.CAMPUS_APPS || [];
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function setCloak(key) {
    state.cloak = key;
    store.set("cloak", key);
    const c = cloaks[key] || cloaks.none;
    document.title = c.title;
    let link = document.querySelector("link[rel*='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href =
      c.icon ||
      "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🎮</text></svg>";
    $$("#cloak-options .opt").forEach((b) =>
      b.classList.toggle("active", b.dataset.cloak === key)
    );
  }

  function setBg(name) {
    state.bg = name;
    store.set("bg", name);
    document.body.dataset.bg = name;
    $$("#bg-options .opt").forEach((b) =>
      b.classList.toggle("active", b.dataset.bg === name)
    );
  }

  function setMotion(on) {
    state.motion = on;
    store.set("motion", on);
    document.body.classList.toggle("no-motion", !on);
    const el = $("#set-motion");
    if (el) el.checked = on;
  }

  function setEngine(name) {
    if (!engines[name]) return;
    state.engine = name;
    store.set("engine", name);
    $$("#engine-options .opt, #set-engine-options .opt").forEach((b) =>
      b.classList.toggle("active", b.dataset.engine === name)
    );
  }

  function setProxyType(t) {
    state.proxyType = t || "uv";
    store.set("proxyType", state.proxyType);
    $$("#proxy-type-options .opt").forEach((b) =>
      b.classList.toggle("active", b.dataset.proxyType === state.proxyType)
    );
  }

  function updateClock() {
    const clock = $("#clock");
    const greeting = $("#greeting");
    if (!clock || !greeting) return;
    const now = new Date();
    clock.textContent =
      String(now.getHours()).padStart(2, "0") +
      ":" +
      String(now.getMinutes()).padStart(2, "0");
    const hour = now.getHours();
    let greet = "good evening";
    if (hour < 12) greet = "good morning";
    else if (hour < 18) greet = "good afternoon";
    const days = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
    const months = ["january","february","march","april","may","june","july","august","september","october","november","december"];
    greeting.textContent =
      greet + " · " + days[now.getDay()] + " " + now.getDate() + " " + months[now.getMonth()];
  }

  function showPage(id) {
    if (!id) return;
    $$(".page").forEach((p) => p.classList.toggle("active", p.id === id));
    $$(".nav-btn").forEach((b) => b.classList.toggle("active", b.dataset.page === id));
  }

  function gameUrl(file) {
    const base = state.gamesPath.endsWith("/") ? state.gamesPath : state.gamesPath + "/";
    return base + file;
  }

  function proxied(url) {
    if (!url) return url;
    let target = String(url).trim();
    if (!/^https?:\/\//i.test(target)) target = "https://" + target;
    const base = (state.proxyBase || "").trim();
    if (!base) return target;
    const prefix = base.endsWith("/") ? base : base + "/";
    const type = state.proxyType || "uv";
    if (type === "raw") return prefix + target.replace(/^https?:\/\//i, "");
    return prefix + encodeURIComponent(target);
  }

  function showFallback(title, msg, path) {
    const frame = $("#frame");
    const fb = $("#player-fallback");
    if (frame) {
      frame.classList.add("hidden");
      frame.src = "about:blank";
    }
    if (fb) {
      fb.classList.remove("hidden");
      const t = $("#fallback-title");
      const m = $("#fallback-msg");
      const p = $("#fallback-path");
      if (t) t.textContent = title;
      if (m) m.textContent = msg;
      if (p) p.textContent = path || state.currentUrl || "";
    }
  }

  function hideFallback() {
    const frame = $("#frame");
    const fb = $("#player-fallback");
    if (fb) fb.classList.add("hidden");
    if (frame) frame.classList.remove("hidden");
  }

  function closePlayer() {
    const ply = $("#player");
    if (ply) {
      ply.classList.add("hidden");
      ply.style.display = "none";
      ply.style.pointerEvents = "none";
      ply.setAttribute("aria-hidden", "true");
    }
    const frame = $("#frame");
    if (frame) frame.src = "about:blank";
    hideFallback();
  }

  function openPlayer(url, title, favKey, opts) {
    opts = opts || {};
    const local = !!opts.local;
    state.currentUrl = url;
    state.currentName = title || url;
    state.isLocalGame = local;

    const ply = $("#player");
    const titleEl = $("#player-title");
    const favBtn = $("#player-fav");
    if (titleEl) titleEl.textContent = state.currentName;
    if (ply) {
      ply.classList.remove("hidden");
      ply.style.display = "flex";
      ply.style.pointerEvents = "auto";
      ply.setAttribute("aria-hidden", "false");
    }
    const key = favKey || title || "";
    if (favBtn) {
      favBtn.textContent = state.favs.indexOf(key) >= 0 ? "★" : "☆";
      favBtn.dataset.key = key;
    }
    if (title) {
      state.recent = [title].concat(state.recent.filter((x) => x !== title)).slice(0, 24);
      store.set("recent", state.recent);
    }

    if (!local && !(state.proxyBase || "").trim() && /^https?:\/\//i.test(url) && !opts.forceFrame) {
      showFallback(
        "Opens in a new tab",
        "Sites block embeds. Set a proxy in Settings, or open in a new tab.",
        url
      );
      return;
    }

    hideFallback();
    const frame = $("#frame");
    if (frame) frame.src = url;

    if (local) {
      // soft check
      fetch(url, { method: "HEAD", cache: "no-store" }).then((res) => {
        if (!res.ok) {
          showFallback("Game file not found", "Upload this file into games/ then refresh.", url);
        }
      }).catch(() => {
        // may still work if HEAD blocked
      });
    }
  }

  function openExternal(url, title) {
    const finalUrl = proxied(url);
    if ((state.proxyBase || "").trim()) {
      openPlayer(finalUrl, title || url, title || url, { forceFrame: true });
    } else {
      window.open(finalUrl, "_blank", "noopener,noreferrer");
    }
  }

  function toggleFav(key) {
    if (!key) return;
    if (state.favs.indexOf(key) >= 0) state.favs = state.favs.filter((x) => x !== key);
    else state.favs = [key].concat(state.favs);
    store.set("favs", state.favs);
    const favBtn = $("#player-fav");
    if (favBtn) favBtn.textContent = state.favs.indexOf(key) >= 0 ? "★" : "☆";
    refreshStats();
    renderGames();
  }

  function filteredGames() {
    let list = games().slice();
    if (state.query) {
      const q = state.query.toLowerCase();
      list = list.filter((g) => (g.name || "").toLowerCase().indexOf(q) >= 0);
    }
    if (state.letter !== "all") {
      list = list.filter((g) => (g.name || "")[0] && g.name[0].toUpperCase() === state.letter);
    }
    if (state.sort === "az") list.sort((a, b) => a.name.localeCompare(b.name));
    if (state.sort === "za") list.sort((a, b) => b.name.localeCompare(a.name));
    if (state.sort === "recent") {
      list.sort((a, b) => {
        const ia = state.recent.indexOf(a.name);
        const ib = state.recent.indexOf(b.name);
        if (ia === -1 && ib === -1) return a.name.localeCompare(b.name);
        if (ia === -1) return 1;
        if (ib === -1) return -1;
        return ia - ib;
      });
    }
    if (state.sort === "fav") {
      list.sort((a, b) => {
        const fa = state.favs.indexOf(a.name) >= 0 ? 0 : 1;
        const fb = state.favs.indexOf(b.name) >= 0 ? 0 : 1;
        return fa - fb || a.name.localeCompare(b.name);
      });
    }
    return list;
  }

  function renderLetterChips() {
    const host = $("#letter-chips");
    if (!host) return;
    const letters = ["all"].concat("ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""));
    host.innerHTML = letters
      .map(
        (l) =>
          '<button type="button" class="chip' +
          (state.letter === l ? " active" : "") +
          '" data-letter="' +
          l +
          '">' +
          (l === "all" ? "All" : l) +
          "</button>"
      )
      .join("");
  }

  function renderGames() {
    const grid = $("#games-grid");
    if (!grid) return;
    const list = filteredGames();
    const count = $("#game-count");
    const empty = $("#games-empty");
    if (count) count.textContent = String(list.length);
    if (empty) empty.classList.toggle("hidden", list.length > 0);
    grid.innerHTML = list
      .map((g) => {
        const fav = state.favs.indexOf(g.name) >= 0;
        return (
          '<button type="button" class="game-card" data-file="' +
          String(g.file).replace(/"/g, "") +
          '" data-name="' +
          escapeHtml(g.name) +
          '"><div class="thumb">▶<span class="fav-dot" data-fav="' +
          escapeHtml(g.name) +
          '">' +
          (fav ? "★" : "☆") +
          '</span></div><div class="name">' +
          escapeHtml(g.name) +
          "</div></button>"
        );
      })
      .join("");
  }

  function renderApps() {
    const list = apps();
    const grid = $("#apps-grid");
    const quick = $("#quick-apps");
    if (grid) {
      grid.innerHTML = list
        .map(
          (a) =>
            '<button type="button" class="app-card" data-url="' +
            a.url +
            '" data-name="' +
            escapeHtml(a.name) +
            '"><div class="thumb">' +
            (a.icon || "◎") +
            '</div><div class="name">' +
            escapeHtml(a.name) +
            '</div><div class="desc">' +
            escapeHtml(a.tag || "") +
            "</div></button>"
        )
        .join("");
    }
    if (quick) {
      quick.innerHTML = list
        .slice(0, 6)
        .map(
          (a) =>
            '<button type="button" class="quick" data-url="' +
            a.url +
            '" data-name="' +
            escapeHtml(a.name) +
            '" title="' +
            escapeHtml(a.name) +
            '">' +
            (a.icon || "◎") +
            "</button>"
        )
        .join("");
    }
  }

  function refreshStats() {
    const g = $("#stat-games");
    const f = $("#stat-favs");
    const m = $("#stat-msgs");
    if (g) g.textContent = String(games().length);
    if (f) f.textContent = String(state.favs.length);
    if (m) m.textContent = String(state.chat.length);
  }

  function doWebSearch(q) {
    const query = (q || "").trim();
    if (!query) return;
    state.searches = [query].concat(state.searches.filter((x) => x !== query)).slice(0, 12);
    store.set("searches", state.searches);
    renderRecentSearches();
    openExternal(engines[state.engine](query), query + " · " + state.engine);
  }

  function renderRecentSearches() {
    const el = $("#recent-searches");
    if (!el) return;
    if (!state.searches.length) {
      el.innerHTML = '<span class="muted small">Nothing yet</span>';
      return;
    }
    el.innerHTML = state.searches
      .map(
        (s) =>
          '<button type="button" class="chip" data-q="' +
          escapeHtml(s) +
          '">' +
          escapeHtml(s) +
          "</button>"
      )
      .join("");
  }

  function handleOmni(raw) {
    const val = (raw || "").trim();
    if (!val) return;
    if (/^https?:\/\//i.test(val) || (/^[^\s]+\.[^\s]+/.test(val) && val.indexOf(" ") === -1)) {
      openExternal(val, val);
      return;
    }
    const hit = games().find((g) => (g.name || "").toLowerCase() === val.toLowerCase());
    if (hit) {
      openPlayer(gameUrl(hit.file), hit.name, hit.name, { local: true });
      return;
    }
    doWebSearch(val);
  }

  /* ---- Local AI ---- */
  function trySolveMath(text) {
    let expr = text.trim();
    expr = expr.replace(/^(solve|calculate|what is|what's|compute|eval)\s+/i, "");
    expr = expr.replace(/\?+$/, "").trim();
    expr = expr.replace(/×/g, "*").replace(/÷/g, "/").replace(/\^/g, "**");
    if (!/^[\d\s+\-*/().,%*]+$/.test(expr)) {
      const m = text.match(/(-?\d+(?:\.\d+)?(?:\s*[\+\-\*\/xX×÷\^]\s*-?\d+(?:\.\d+)?)+)/);
      if (!m) return null;
      expr = m[1].replace(/x/gi, "*").replace(/×/g, "*").replace(/÷/g, "/").replace(/\^/g, "**");
    }
    expr = expr.replace(/(\d+(?:\.\d+)?)%/g, "($1/100)");
    try {
      const result = Function('"use strict"; return (' + expr + ");")();
      if (typeof result !== "number" || !isFinite(result)) return null;
      return expr.replace(/\*\*/g, "^") + " = " + result;
    } catch (e) {
      return null;
    }
  }

  function writeEssay(topic) {
    let tpc = topic.trim();
    tpc = tpc.replace(/^(write\s+)?(an?\s+)?(short\s+)?essay\s+(about|on|regarding)\s+/i, "");
    tpc = tpc.replace(/^essay\s*:\s*/i, "").trim() || "this topic";
    const title = tpc.charAt(0).toUpperCase() + tpc.slice(1);
    return (
      "Title: " + title + "\n\nIntroduction\n" + title +
      " shows up in school and daily life. This essay covers what it is, why it matters, and what to do next.\n\nWhat it is\n" +
      tpc + " is best learned by splitting it into definition, examples, and common mistakes.\n\nWhy it matters\nUnderstanding " +
      tpc + " helps with clearer thinking and better decisions.\n\nConclusion\n" + title +
      " is worth learning carefully. Add your own facts if this is for a grade."
    );
  }

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function localAiReply(text) {
    const raw = (text || "").trim();
    if (!raw) return "Say something and I’ll reply.";
    const t = raw.toLowerCase();

    const math = trySolveMath(raw);
    if (math) return math;

    if (/\b(essay|write about|paragraph about)\b/.test(t)) return writeEssay(raw);
    if (/^(hi|hello|hey|yo|sup)\b/.test(t))
      return "Hey! Try: solve 12*(5+3) · essay about space · suggest a game · help";
    if (/who are you|what are you/.test(t))
      return "I’m Arcade AI — fully local on this site. No sign-in.";
    if (/thank|thanks/.test(t)) return "You’re welcome.";
    if (/^(help|commands|what can you do)\b/.test(t) || t === "help")
      return "I can do math, short essays, study tips, game ideas, jokes, and simple explanations. Ask specifically.";
    if (/\b(joke|funny)\b/.test(t)) return pick(jokes);
    if (/\b(fun fact|random fact)\b/.test(t)) return pick(facts);
    if (/\b(game|bored|play)\b/.test(t)) {
      const list = games();
      if (!list.length) return "Upload games into games/ first.";
      return "Try " + list[Math.floor(Math.random() * list.length)].name + " from the Games tab.";
    }
    if (/\b(study|homework|test|exam)\b/.test(t))
      return "Study tip: 25 min focus + 5 min break. Use active recall (close notes, write what you remember). Sleep helps more than cramming.";
    if (/\b(gravity)\b/.test(t))
      return "Gravity is the attraction between masses. On Earth it’s about 9.8 m/s² downward.";
    if (/\b(photosynthesis)\b/.test(t))
      return "Photosynthesis: plants use light, water, and CO₂ to make sugar and oxygen.";
    if (/\b(time)\b/.test(t) && /\b(what|is it)\b/.test(t))
      return "Device time: " + new Date().toLocaleTimeString();

    return (
      "Got it: \"" + raw.slice(0, 100) + (raw.length > 100 ? "…" : "") + "\"\n\n" +
      "I’m local, so specific asks work best — math, essay, explain, game idea, joke, or help."
    );
  }

  function renderAi() {
    const log = $("#ai-log");
    if (!log) return;
    log.innerHTML = state.aiLog
      .map(function (m) {
        return (
          '<div class="bubble ' +
          (m.role === "me" ? "me" : "bot") +
          '"><span class="who">' +
          (m.role === "me" ? "You" : "AI") +
          "</span>" +
          escapeHtml(m.text) +
          "</div>"
        );
      })
      .join("");
    log.scrollTop = log.scrollHeight;
  }

  function pushAi(role, text) {
    state.aiLog.push({ role: role, text: String(text == null ? "" : text) });
    state.aiLog = state.aiLog.slice(-40);
    store.set("aiLog", state.aiLog);
    renderAi();
  }

  var aiBusy = false;

  function sendAi() {
    const input = $("#ai-input");
    if (!input) {
      console.warn("[arcade] #ai-input missing");
      return;
    }
    if (aiBusy) return;
    const text = String(input.value || "").trim();
    if (!text) return;

    input.value = "";
    pushAi("me", text);
    aiBusy = true;

    const sendBtn = $("#ai-send");
    if (sendBtn) sendBtn.disabled = true;

    // immediate placeholder
    pushAi("bot", "…");

    // sync local reply (no await issues)
    setTimeout(function () {
      try {
        const reply = localAiReply(text);
        if (state.aiLog.length && state.aiLog[state.aiLog.length - 1].text === "…") {
          state.aiLog.pop();
        }
        pushAi("bot", reply || "No response.");
      } catch (err) {
        if (state.aiLog.length && state.aiLog[state.aiLog.length - 1].text === "…") {
          state.aiLog.pop();
        }
        pushAi("bot", "Error: " + (err && err.message ? err.message : String(err)));
      }
      aiBusy = false;
      if (sendBtn) sendBtn.disabled = false;
      try {
        input.focus();
      } catch (e) {}
    }, 60);
  }

  // expose for debugging
  window.arcadeSendAi = sendAi;

  function renderChat() {
    const log = $("#chat-log");
    if (!log) return;
    log.innerHTML = state.chat
      .map(function (m) {
        return (
          '<div class="bubble ' +
          (m.nick === state.nick ? "me" : "them") +
          '"><span class="who">' +
          escapeHtml(m.nick) +
          " · " +
          m.time +
          "</span>" +
          escapeHtml(m.text) +
          "</div>"
        );
      })
      .join("");
    log.scrollTop = log.scrollHeight;
    const c = $("#chat-count");
    if (c) c.textContent = state.chat.length + " messages";
    refreshStats();
  }

  function sendChat() {
    const input = $("#chat-input");
    if (!input) return;
    const text = String(input.value || "").trim();
    if (!text) return;
    input.value = "";
    const nick = (state.nick || "guest").slice(0, 16);
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    state.chat.push({ nick: nick, text: text, time: time });
    state.chat = state.chat.slice(-100);
    store.set("chat", state.chat);
    renderChat();
  }

  function bindSettings() {
    const nameEl = $("#set-name");
    const panicEl = $("#set-panic");
    const proxyEl = $("#set-proxy");
    const pathEl = $("#set-games-path");
    const motionEl = $("#set-motion");
    const nickEl = $("#chat-nick");
    const userEl = $("#username");
    const avEl = $("#avatar");

    if (nameEl) nameEl.value = state.name;
    if (panicEl) panicEl.value = state.panic;
    if (proxyEl) proxyEl.value = state.proxyBase;
    if (pathEl) pathEl.value = state.gamesPath;
    if (motionEl) motionEl.checked = state.motion;
    if (nickEl) nickEl.value = state.nick;
    if (userEl) userEl.textContent = state.name;
    if (avEl) avEl.textContent = (state.name[0] || "A").toUpperCase();

    if (nameEl)
      nameEl.addEventListener("change", function () {
        state.name = nameEl.value.trim() || "arcade";
        store.set("name", state.name);
        if (userEl) userEl.textContent = state.name;
        if (avEl) avEl.textContent = state.name[0].toUpperCase();
      });
    if (panicEl)
      panicEl.addEventListener("change", function () {
        state.panic = panicEl.value.trim() || "https://classroom.google.com";
        store.set("panic", state.panic);
      });
    if (proxyEl)
      proxyEl.addEventListener("change", function () {
        state.proxyBase = proxyEl.value.trim();
        store.set("proxyBase", state.proxyBase);
      });
    if (pathEl)
      pathEl.addEventListener("change", function () {
        state.gamesPath = pathEl.value.trim() || "games/";
        store.set("gamesPath", state.gamesPath);
      });
    if (motionEl)
      motionEl.addEventListener("change", function () {
        setMotion(motionEl.checked);
      });
    if (nickEl)
      nickEl.addEventListener("change", function () {
        state.nick = nickEl.value.trim() || "guest";
        store.set("nick", state.nick);
      });

    const reset = $("#reset-data");
    if (reset)
      reset.addEventListener("click", function () {
        if (!confirm("Clear favorites, chat, AI history, and settings?")) return;
        Object.keys(localStorage)
          .filter(function (k) {
            return k.indexOf("arcade_") === 0;
          })
          .forEach(function (k) {
            localStorage.removeItem(k);
          });
        location.reload();
      });

    setProxyType(state.proxyType);
  }

  function bindCore() {
    document.addEventListener("click", function (e) {
      const t = e.target;
      if (!t || !t.closest) return;

      const nav = t.closest(".nav-btn");
      if (nav && nav.dataset.page) {
        showPage(nav.dataset.page);
        return;
      }

      const bg = t.closest("#bg-options [data-bg]");
      if (bg) {
        setBg(bg.dataset.bg);
        return;
      }
      const cloak = t.closest("#cloak-options [data-cloak]");
      if (cloak) {
        setCloak(cloak.dataset.cloak);
        return;
      }
      const eng = t.closest("#engine-options [data-engine], #set-engine-options [data-engine]");
      if (eng) {
        setEngine(eng.dataset.engine);
        return;
      }
      const pt = t.closest("#proxy-type-options [data-proxy-type]");
      if (pt) {
        setProxyType(pt.dataset.proxyType);
        return;
      }

      const letter = t.closest("#letter-chips [data-letter]");
      if (letter) {
        state.letter = letter.dataset.letter;
        renderLetterChips();
        renderGames();
        return;
      }

      const fav = t.closest("[data-fav]");
      if (fav) {
        e.preventDefault();
        e.stopPropagation();
        toggleFav(fav.dataset.fav);
        return;
      }

      const game = t.closest(".game-card");
      if (game && game.dataset.file) {
        openPlayer(gameUrl(game.dataset.file), game.dataset.name, game.dataset.name, {
          local: true
        });
        return;
      }

      const app = t.closest(".app-card, .quick");
      if (app && app.dataset.url) {
        openExternal(app.dataset.url, app.dataset.name || app.dataset.url);
        return;
      }

      const rq = t.closest("#recent-searches [data-q]");
      if (rq) {
        doWebSearch(rq.dataset.q);
        return;
      }

      const prompt = t.closest("#ai-prompts [data-prompt]");
      if (prompt) {
        const input = $("#ai-input");
        if (input) input.value = prompt.dataset.prompt;
        sendAi();
        return;
      }

      if (t.closest("#player-back") || t.closest("#fallback-back")) {
        closePlayer();
        return;
      }
      if (t.closest("#player-reload")) {
        if (state.currentUrl) {
          openPlayer(state.currentUrl, state.currentName, state.currentName, {
            local: state.isLocalGame,
            forceFrame: !state.isLocalGame
          });
        }
        return;
      }
      if (t.closest("#player-newtab") || t.closest("#fallback-newtab")) {
        if (state.currentUrl) window.open(state.currentUrl, "_blank", "noopener,noreferrer");
        return;
      }
      if (t.closest("#player-fav")) {
        const btn = $("#player-fav");
        toggleFav(btn && btn.dataset.key);
        return;
      }
      if (t.closest("#ai-clear")) {
        state.aiLog = [];
        store.set("aiLog", []);
        renderAi();
        return;
      }
      if (t.closest("#chat-clear")) {
        state.chat = [];
        store.set("chat", []);
        renderChat();
        return;
      }
      if (t.closest("#ai-send")) {
        e.preventDefault();
        sendAi();
        return;
      }
      if (t.closest("#chat-send")) {
        e.preventDefault();
        sendChat();
        return;
      }
      if (t.closest("#proxy-test")) {
        const proxyEl = $("#set-proxy");
        if (proxyEl) {
          state.proxyBase = proxyEl.value.trim();
          store.set("proxyBase", state.proxyBase);
        }
        if (!(state.proxyBase || "").trim()) {
          alert("Paste a proxy URL in Settings first.");
          return;
        }
        openExternal("https://example.com", "Proxy test");
        return;
      }
    });

    const homeForm = $("#home-search-form");
    if (homeForm)
      homeForm.addEventListener("submit", function (e) {
        e.preventDefault();
        handleOmni(($("#home-search") || {}).value || "");
      });
    const webForm = $("#web-search-form");
    if (webForm)
      webForm.addEventListener("submit", function (e) {
        e.preventDefault();
        doWebSearch(($("#web-search") || {}).value || "");
      });

    const gameSearch = $("#game-search");
    if (gameSearch)
      gameSearch.addEventListener("input", function () {
        state.query = gameSearch.value;
        renderGames();
      });
    const gameSort = $("#game-sort");
    if (gameSort)
      gameSort.addEventListener("change", function () {
        state.sort = gameSort.value;
        renderGames();
      });

    const aiInput = $("#ai-input");
    if (aiInput)
      aiInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          sendAi();
        }
      });
    const chatInput = $("#chat-input");
    if (chatInput)
      chatInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          sendChat();
        }
      });

    document.addEventListener("keydown", function (e) {
      if (e.key === "]") {
        window.location.href = state.panic || "https://classroom.google.com";
      }
      if (e.key === "Escape") closePlayer();
    });
  }

  function init() {
    try {
      closePlayer();
      setBg(state.bg);
      setCloak(state.cloak);
      setMotion(state.motion);
      setEngine(state.engine);
      updateClock();
      setInterval(updateClock, 1000);
      bindCore();
      bindSettings();
      renderLetterChips();
      renderGames();
      renderApps();
      renderRecentSearches();
      renderAi();
      renderChat();
      refreshStats();
      if (!state.aiLog.length) {
        pushAi(
          "bot",
          "Hey! Fully local AI. Try: solve 12*(5+3) · essay about space · suggest a game · help"
        );
      }
      console.log("[arcade] ready · games:", games().length);
    } catch (err) {
      console.error("[arcade] init error", err);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
