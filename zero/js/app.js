/* ============================================================
   ZERO — app logic
   Private by design: all state lives on THIS device, encrypted
   at rest once the vault is on. No server, no analytics, no
   accounts, no AI provider — the model runs on your machine.
   ============================================================ */

const Zero = (() => {
  const LS = {
    tasks: 'zero.tasks',
    notes: 'zero.notes',
    engineUrl: 'zero.engineUrl',
    engineModel: 'zero.engineModel',
    engineMode: 'zero.engineMode',
    think: 'zero.think',
    stockKey: 'zero.stockKey',
    stockSymbols: 'zero.stockSymbols',
    memories: 'zero.memories',
    apps: 'zero.apps',
    tvOk: 'zero.tvOk',
    tvSymbol: 'zero.tvSymbol',
    micOk: 'zero.micOk',
    wakeOk: 'zero.wakeOk',
    speak: 'zero.speak',
    voice: 'zero.voice',
  };

  // Short rolling context so the assistant remembers the current thread.
  // Memory only — never written to disk in any form.
  let chatHistory = [];

  const store = {
    get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
    set(k, v) {
      // Storage writes respect the Control Panel switch.
      if (typeof Control !== 'undefined' && !Control.caps.storage) return;
      // With the vault on, nothing readable is written: persist() owns
      // these keys and writes ciphertext instead.
      if (Vault.isEnabled()) { persist(); return; }
      localStorage.setItem(k, JSON.stringify(v));
      persistPlain();
    },
    raw(k) { return localStorage.getItem(k) || ''; },
    rawSet(k, v) { localStorage.setItem(k, v); },
  };

  // Vault-off: read straight from localStorage. Vault-on: these stay
  // empty until unlock() decrypts them, so a locked Zero holds nothing.
  let tasks = Vault.isEnabled() ? [] : store.get(LS.tasks, []);
  let notes = Vault.isEnabled() ? [] : store.get(LS.notes, []);
  // Things Zero should still know next time you open it.
  let memories = Vault.isEnabled() ? [] : store.get(LS.memories, []);
  let apps = store.get(LS.apps, []);

  // Keys that hold user content and must never survive as plaintext
  // once the vault is on.
  const PLAINTEXT_KEYS = ['zero.tasks', 'zero.notes', 'zero.memories'];

  /* Encrypt the in-memory model and write it. Fire-and-forget: callers
     stay synchronous, and a locked vault simply declines to write. */
  async function persist() {
    if (!Vault.isEnabled() || !Vault.isUnlocked()) return;
    if (!Control.caps.storage) return;
    try {
      await Store.set(LS.tasks, await Vault.encrypt(JSON.stringify(tasks)));
      await Store.set(LS.notes, await Vault.encrypt(JSON.stringify(notes)));
      await Store.set(LS.memories, await Vault.encrypt(JSON.stringify(memories)));
      // Anything written before the vault existed is still readable where it
      // was left. Encrypting the new copy is only half the job; the old
      // plaintext has to go, or "encrypted" is a claim the disk contradicts.
      PLAINTEXT_KEYS.forEach(k => localStorage.removeItem(k));
    } catch (e) {
      log('Could not save: ' + e.message, true);
    }
  }

  /* Vault off: still use IndexedDB, just without encryption. */
  async function persistPlain() {
    if (Vault.isEnabled() || !Control.caps.storage) return;
    try {
      await Store.set(LS.tasks, JSON.stringify(tasks));
      await Store.set(LS.notes, JSON.stringify(notes));
      await Store.set(LS.memories, JSON.stringify(memories));
      await Store.set(LS.apps, JSON.stringify(apps));
    } catch (e) { log('Could not save: ' + e.message, true); }
  }

  /* ============================================================
     CONTROL LAYER — the user's kill switch.

     Design rule: this layer is the ONLY path to the network, and
     nothing in Zero's own logic is allowed to flip these flags.
     Only a direct user click changes them. If HALTED is true,
     every capability is denied regardless of individual switches.
     ============================================================ */
  const Control = {
    halted: false,
    caps: { network: true, market: true, ai: true, storage: true },
    calls: 0,
    inflight: new Set(),   // AbortControllers for live requests
    timers: new Set(),     // interval IDs we can cancel
  };

  function log(msg, warn) {
    const feed = document.getElementById('logFeed');
    if (!feed) return;
    const d = document.createElement('div');
    d.innerHTML = `<span class="t">${new Date().toLocaleTimeString()}</span> ` +
                  `<span class="${warn ? 'warn' : ''}">${esc(msg)}</span>`;
    feed.prepend(d);
    while (feed.children.length > 200) feed.lastChild.remove();
  }

  /* Every network request in Zero goes through here. No exceptions. */
  async function guardedFetch(url, opts = {}, capability = 'network') {
    if (Control.halted) { log('BLOCKED (halted): ' + shortUrl(url), true); throw new Error('Zero is halted — press Resume to allow activity.'); }
    if (!Control.caps.network) { log('BLOCKED (network off): ' + shortUrl(url), true); throw new Error('Network access is switched off in the Control Panel.'); }
    if (!Control.caps[capability]) { log(`BLOCKED (${capability} off): ` + shortUrl(url), true); throw new Error(`${capability} is switched off in the Control Panel.`); }

    const ac = new AbortController();
    Control.inflight.add(ac);
    Control.calls++;
    updateStatus();
    log('→ ' + shortUrl(url));
    try {
      return await fetch(url, { ...opts, signal: ac.signal });
    } finally {
      Control.inflight.delete(ac);
    }
  }

  const shortUrl = u => { try { return new URL(u).hostname; } catch { return String(u).slice(0, 40); } };

  /* Hard stop: abort in-flight requests, cancel timers, freeze UI. */
  function toggleHalt() {
    Control.halted = !Control.halted;
    const btn = document.getElementById('killSwitch');
    const banner = document.getElementById('haltBanner');

    if (Control.halted) {
      Control.inflight.forEach(ac => ac.abort());
      Control.inflight.clear();
      Control.timers.forEach(id => clearInterval(id));
      Control.timers.clear();
      btn.textContent = '▶ RESUME';
      btn.classList.add('halted');
      banner.classList.add('on');
      log('EMERGENCY STOP — all activity halted by user.', true);
    } else {
      btn.textContent = '■ STOP';
      btn.classList.remove('halted');
      banner.classList.remove('on');
      log('Resumed by user.');
      startTimers();
      loadMarkets();
    }
    updateStatus();
  }

  function killNetwork() {
    Control.caps.network = false;
    document.getElementById('capNetwork').checked = false;
    Control.inflight.forEach(ac => ac.abort());
    Control.inflight.clear();
    log('Network access cut by user.', true);
    updateStatus();
  }

  function panic() {
    if (!confirm('PANIC: stop everything, lock the vault and clear this session?\n\nEncrypted data stays on disk and needs your passphrase to open again.')) return;
    if (!Control.halted) toggleHalt();
    localStorage.removeItem(LS.stockKey);
    const sk = document.getElementById('stockKey'); if (sk) sk.value = '';
    chatHistory = [];
    const cl = document.getElementById('chatLog'); if (cl) cl.innerHTML = '';
    // Locking drops the key and the plaintext model in one move.
    if (Vault.isEnabled()) lockVault(); else { refreshAiStatus(); }
    log('PANIC — halted, vault locked, session cleared.', true);
    alert('Zero halted and locked. Your data is sealed on this device.');
  }

  function setCap(name, on) {
    Control.caps[name] = on;
    log(`Capability "${name}" turned ${on ? 'ON' : 'OFF'} by user.`, !on);
    if (!on) { Control.inflight.forEach(ac => ac.abort()); Control.inflight.clear(); }
    if (name === 'market') {
      if (on) { startTimers(); loadMarkets(); } else { stopMarketTimer(); }
    }
    // Re-enabling the network clears any stale "blocked" message on screen.
    if (name === 'network' && on && Control.caps.market) loadMarkets();
    updateStatus();
  }

  function updateStatus() {
    const set = (id, txt, color) => {
      const el = document.getElementById(id);
      if (el) { el.textContent = txt; if (color) el.style.color = color; }
    };
    set('sysState', Control.halted ? 'HALTED' : 'RUNNING', Control.halted ? 'var(--red)' : 'var(--green)');
    set('sysCalls', Control.calls);
    const on = Object.values(Control.caps).filter(Boolean).length;
    set('sysCaps', `${on}/4`);

    const led = (id, state) => { const e = document.getElementById(id); if (e) e.className = 'led ' + state; };
    const live = k => (!Control.halted && Control.caps[k]) ? 'on' : 'off';
    led('ledNet', Control.halted ? 'hot' : live('network'));
    led('ledMkt', live('market'));
    led('ledAi', live('ai'));
    led('ledStore', Control.caps.storage ? 'on' : 'off');
  }

  function clearLog() { document.getElementById('logFeed').innerHTML = ''; }

  let marketTimer = null;
  function startTimers() {
    stopMarketTimer();
    if (Control.caps.market && !Control.halted) {
      marketTimer = setInterval(loadMarkets, 60000);
      Control.timers.add(marketTimer);
    }
  }
  function stopMarketTimer() {
    if (marketTimer) { clearInterval(marketTimer); Control.timers.delete(marketTimer); marketTimer = null; }
  }

  /* ---------------- Navigation ---------------- */
  const titles = {
    control:   ['Control Panel', 'You are in charge. Stop anything, anytime.'],
    markets:   ['Markets', 'Live readings — information, not advice.'],
    overview:  ['Overview', 'Everything at a glance, live.'],
    security:  ['Security', 'Harden what is yours.'],
    files:     ['Files', 'Your disk, connected on your terms.'],
    news:      ['News', 'What is happening right now.'],
    trading:   ['Trading', 'Live professional charts — every market.'],
    apps:      ['Apps', 'Your things, one keystroke away.'],
    memory:    ['Memory', 'What Zero carries between conversations.'],
    assistant: ['Assistant', 'Ask Zero anything. Nothing leaves this device.'],
    tasks:     ['Tasks', 'What needs doing.'],
    notes:     ['Notes', 'Your second brain.'],
    settings:  ['Settings', 'Keys & privacy — all local.'],
  };

  function nav(view) {
    document.querySelectorAll('.nav li').forEach(li =>
      li.classList.toggle('active', li.dataset.view === view));
    document.querySelectorAll('.view').forEach(v =>
      v.classList.toggle('active', v.id === 'view-' + view));
    const [t, s] = titles[view] || ['', ''];
    document.getElementById('viewTitle').textContent = t;
    document.getElementById('viewSub').textContent = s;
    if (view === 'markets') { loadMarkets(); loadStocks(); loadRates(); }
    if (view === 'news') loadNews();
    if (view === 'trading') { renderTvChips(); openTradingView(); }
    if (view === 'overview') renderOverview();
    if (view === 'security') { renderChecklist(); showPayloads(); }
    if (view === 'files') { filesUi(); listFolder(); }
    if (view === 'apps') renderPresets();
  }

  /* ---------------- Clock ---------------- */
  function tick() {
    const d = new Date();
    document.getElementById('clock').textContent = d.toLocaleTimeString();
    document.getElementById('date').textContent = d.toLocaleDateString(undefined,
      { weekday: 'short', month: 'short', day: 'numeric' });
  }

  /* ---------------- Markets (live crypto) ---------------- */
  const COINS = [
    ['bitcoin', 'BTC', 'Bitcoin'],
    ['ethereum', 'ETH', 'Ethereum'],
    ['solana', 'SOL', 'Solana'],
    ['binancecoin', 'BNB', 'BNB'],
    ['ripple', 'XRP', 'XRP'],
    ['dogecoin', 'DOGE', 'Dogecoin'],
  ];

  async function fetchMarkets() {
    const table = document.getElementById('marketTable');
    const mini = document.getElementById('miniMarket');
    const ids = COINS.map(c => c[0]).join(',');
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}` +
                `&vs_currencies=usd&include_24hr_change=true`;
    try {
      const res = await guardedFetch(url, {}, 'market');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      const rows = COINS.map(([id, sym, name]) => {
        const p = data[id];
        if (!p) return '';
        const chg = p.usd_24h_change;
        const known = typeof chg === 'number' && isFinite(chg);
        // A missing 24h figure is reported as missing. Showing 0.00%
        // would be a number the feed never gave us.
        const cell = known
          ? `<div class="${chg >= 0 ? 'up' : 'down'}">${chg >= 0 ? '▲' : '▼'} ${Math.abs(chg).toFixed(2)}%</div>`
          : `<div class="nodata">—</div>`;
        return `<div class="mkt-row">
          <div class="sym">${sym}<small>${name}</small></div>
          <div>$${fmt(p.usd)}</div>
          ${cell}
        </div>`;
      }).join('');
      if (table) table.innerHTML = rows;
      if (mini) mini.innerHTML = `<div class="mkt-row mkt-head"><div>Asset</div><div>Price</div><div>24h</div></div>` + rows;
      setText('marketUpdated', 'Live · updated ' + new Date().toLocaleTimeString());
    } catch (e) {
      const msg = `<div class="spinner">⚠ No live feed (${esc(e.message)}). Nothing is shown rather than showing you stale prices.</div>`;
      if (table) table.innerHTML = msg;
      if (mini) mini.innerHTML = msg;
      setText('marketUpdated', 'No live data');
      throw e;
    }
  }

  /* fetchMarkets throws so callers like updateNow can report failure.
     Everything user-facing goes through this wrapper, so a click while
     halted surfaces in the log rather than as an unhandled rejection. */
  function loadMarkets() { return fetchMarkets().catch(() => {}); }

  /* ---------------- Knowledge ----------------
     Zero cannot contain the world's knowledge — that takes a trained
     model of many gigabytes. What it can do is look things up, live,
     from open sources that need no key and belong to no AI company.
     Wikipedia first, then DuckDuckGo's instant answers. */
  async function lookUp(query, quiet) {
    const q = query.trim();
    if (!q) return false;
    try {
      const sr = await guardedFetch(
        'https://en.wikipedia.org/w/api.php?action=query&list=search&format=json&origin=*' +
        '&srlimit=1&srsearch=' + encodeURIComponent(q), {}, 'network');
      if (sr.ok) {
        const sd = await sr.json();
        const hit = sd.query?.search?.[0];
        if (hit) {
          const pr = await guardedFetch(
            'https://en.wikipedia.org/api/rest_v1/page/summary/' +
            encodeURIComponent(hit.title.replace(/ /g, '_')), {}, 'network');
          if (pr.ok) {
            const pd = await pr.json();
            const text = pd.extract;
            if (text) {
              const holder = document.createElement('div');
              holder.className = 'msg zero';
              const body = document.createElement('div');
              body.textContent = text;
              const src = document.createElement('div');
              src.className = 'src-line';
              const a = document.createElement('a');
              a.href = pd.content_urls?.desktop?.page || 'https://en.wikipedia.org/wiki/' + encodeURIComponent(hit.title);
              a.target = '_blank'; a.rel = 'noopener noreferrer';
              a.textContent = 'Wikipedia · ' + pd.title;
              src.appendChild(a);
              holder.append(body, src);
              document.getElementById('chatLog').appendChild(holder);
              document.getElementById('chatLog').scrollTop = 1e9;
              if (speakReplies) Voice.speak(text);
              return true;
            }
          }
        }
      }
    } catch (e) {
      if (/halted|switched off/i.test(e.message)) { bubble(e.message, 'zero'); return true; }
    }

    // Second source: instant answers cover definitions and calculations
    // that do not have an encyclopaedia article.
    try {
      const r = await guardedFetch(
        'https://api.duckduckgo.com/?format=json&no_html=1&skip_disambig=1&q=' + encodeURIComponent(q),
        {}, 'network');
      if (r.ok) {
        const d = await r.json();
        const text = d.AbstractText || d.Answer || d.Definition;
        if (text) {
          bubble(text + (d.AbstractSource ? '\n\n— ' + d.AbstractSource : ''), 'zero');
          return true;
        }
      }
    } catch { /* fall through to the honest answer */ }

    if (!quiet) {
      bubble(`I could not find anything solid on "${q}". I would rather say that than make something up.\n\n` +
             `I can still do: maths, conversions, live rates, charts, news, tasks, notes and passwords — type help.`, 'zero');
    }
    return false;
  }

  /* ---------------- Security ---------------- */
  async function checkPassword() {
    const inp = document.getElementById('secPass');
    const out = document.getElementById('secResult');
    const pw = inp.value;
    if (!pw) { out.innerHTML = '<p class="hint">Type a password above.</p>'; return; }

    const st = Sec.strength(pw);
    const tone = { bad: 'var(--red)', warn: '#ffb020', ok: 'var(--green)' }[st.tone];
    out.innerHTML =
      `<div class="sec-verdict" style="color:${tone}">${st.verdict}</div>` +
      `<div class="sec-line"><b>${st.bits} bits</b> of entropy · offline guessing would take <b>${esc(st.crackTime)}</b></div>` +
      (st.notes.length ? '<ul class="sec-notes">' + st.notes.map(n => `<li>${esc(n)}</li>`).join('') + '</ul>' : '') +
      `<div class="sec-line" id="secBreach">Checking public breach corpus…</div>`;

    const bl = document.getElementById('secBreach');
    try {
      const n = await Sec.breachCount(pw, url => guardedFetch(url, {}, 'network'));
      bl.innerHTML = n > 0
        ? `<span style="color:var(--red)"><b>Found in ${n.toLocaleString()} known breaches.</b></span> ` +
          `Treat it as public and stop using it anywhere.`
        : `<span style="color:var(--green)"><b>Not in the public breach corpus.</b></span> ` +
          `That is not proof it is safe — only that it has not turned up yet.`;
    } catch (e) {
      bl.innerHTML = `<span class="nodata">Breach check unavailable (${esc(e.message)}).</span>`;
    }
  }

  async function cryptoTool() {
    const inp = document.getElementById('cryptoIn').value;
    const key = document.getElementById('cryptoKey').value;
    const op = document.getElementById('cryptoOp').value;
    const out = document.getElementById('cryptoOut');
    if (!inp) { out.textContent = ''; return; }
    try {
      let r;
      switch (op) {
        case 'sha256': r = await Sec.digest('SHA-256', inp); break;
        case 'sha512': r = await Sec.digest('SHA-512', inp); break;
        case 'sha1':   r = await Sec.digest('SHA-1', inp); break;
        case 'hmac':   r = key ? await Sec.hmac(inp, key) : 'Enter a key for HMAC.'; break;
        case 'b64enc': r = Sec.b64.enc(inp); break;
        case 'b64dec': r = Sec.b64.dec(inp); break;
        case 'jwt':    r = JSON.stringify(Sec.jwtDecode(inp), null, 2); break;
        case 'idhash': r = Sec.idHash(inp); break;
        case 'entropy': {
          const h = Sec.shannon(inp);
          r = `${h.toFixed(3)} bits/char · ${(h * inp.length).toFixed(1)} bits total over ${inp.length} chars`;
          break;
        }
      }
      out.textContent = r;
    } catch (e) { out.textContent = '⚠ ' + e.message; }
  }

  function showPayloads() {
    const kind = document.getElementById('payloadKind').value;
    const out = document.getElementById('payloadOut');
    const list = Sec.PAYLOADS[kind] || [];
    out.innerHTML = list.map(pl =>
      `<div class="payload-row"><code>${esc(pl)}</code>` +
      `<button class="btn ghost" onclick="Zero.copyText(this.previousElementSibling.textContent, this)">copy</button></div>`).join('');
  }
  function copyText(text, btn) {
    navigator.clipboard?.writeText(text).then(() => {
      const old = btn.textContent; btn.textContent = '✓'; setTimeout(() => btn.textContent = old, 1200);
    });
  }

  async function reconDomain() {
    const name = document.getElementById('reconIn').value.trim();
    const out = document.getElementById('reconOut');
    if (!name) return;
    out.innerHTML = '<div class="spinner">Querying DNS</div>';
    try {
      const { records } = await Recon.dns(name, (u, o) => guardedFetch(u, o, 'network'));
      const keys = Object.keys(records);
      if (!keys.length) { out.innerHTML = '<p class="hint">No records returned. Check the domain name.</p>'; return; }
      const notes = Recon.notes(records);
      out.innerHTML = keys.map(t =>
        `<div class="recon-row"><b>${t}</b><div>${records[t].map(v => esc(v)).join('<br>')}</div></div>`).join('') +
        (notes.length ? '<div class="notice">' + notes.map(esc).join('<br>') + '</div>' : '');
    } catch (e) { out.innerHTML = `<p class="hint">DNS lookup failed: ${esc(e.message)}</p>`; }
  }

  function renderChecklist() {
    const el = document.getElementById('secChecklist');
    if (!el) return;
    el.innerHTML = Sec.CHECKLIST.map(([t, d]) =>
      `<div class="sec-item"><b>${esc(t)}</b><span>${esc(d)}</span></div>`).join('');
  }

  /* ---------------- Files ---------------- */
  let openHandle = null;

  function filesUi() {
    const el = document.getElementById('fsSupport');
    if (el) el.textContent = Files.supported()
      ? 'This browser can read and write real files on your disk.'
      : 'This browser can open and download files, but not write back in place. Chrome, Edge, Brave or Arc can.';
    const fn = Files.folderName();
    setText('folderName', fn ? 'Connected: ' + fn : 'No folder connected.');
    const fl = document.getElementById('folderList');
    if (fl && !fn) fl.innerHTML = '';
  }

  async function openAFile() {
    try {
      const f = await Files.openFile();
      openHandle = f.handle;
      document.getElementById('fileEditor').value = f.text;
      setText('fileName', f.name + ' · ' + Files.fmtSize(f.size));
      document.getElementById('fileSaveBack').style.display = openHandle ? '' : 'none';
      log('Opened ' + f.name + ' from disk (' + Files.fmtSize(f.size) + ').');
    } catch (e) { if (e.name !== 'AbortError') bubble('Could not open the file: ' + e.message, 'zero'); }
  }
  async function saveBack() {
    if (!openHandle) return;
    try { await Files.writeFile(openHandle, document.getElementById('fileEditor').value); log('Saved changes back to disk.'); alert('Saved.'); }
    catch (e) { alert('Could not save: ' + e.message); }
  }
  async function saveNew() {
    try { const n = await Files.saveAs('zero-note.txt', document.getElementById('fileEditor').value); log('Wrote ' + n + ' to disk.'); }
    catch (e) { if (e.name !== 'AbortError') alert('Could not save: ' + e.message); }
  }
  async function connectFolder() {
    try { const n = await Files.connectFolder(); log('Connected folder "' + n + '" — Zero can read and write inside it.'); filesUi(); listFolder(); }
    catch (e) { if (e.name !== 'AbortError') bubble('Could not connect a folder: ' + e.message, 'zero'); }
  }
  async function listFolder() {
    const el = document.getElementById('folderList');
    if (!el || !Files.folderName()) return;
    try {
      const items = await Files.list();
      el.innerHTML = items.length
        ? items.map(it => it.kind === 'directory'
            ? `<div class="fs-item"><span>📁 ${esc(it.name)}</span></div>`
            : `<div class="fs-item" onclick="Zero.openFromFolder('${esc(it.name).replace(/'/g, "\\'")}')">
                 <span>📄 ${esc(it.name)}</span><span class="fs-size">${Files.fmtSize(it.size)}</span></div>`).join('')
        : '<p class="hint">Folder is empty.</p>';
    } catch (e) { el.innerHTML = `<p class="hint">${esc(e.message)}</p>`; }
  }
  async function openFromFolder(name) {
    try {
      const f = await Files.readFrom(name);
      openHandle = f.handle;
      document.getElementById('fileEditor').value = f.text;
      setText('fileName', f.name + ' · ' + Files.fmtSize(f.size));
      document.getElementById('fileSaveBack').style.display = '';
    } catch (e) { bubble('Could not read ' + name + ': ' + e.message, 'zero'); }
  }
  function disconnectFolder() { Files.disconnectFolder(); filesUi(); }

  /* ---------------- Wake word ---------------- */
  function orbState(st) { if (typeof Orb !== 'undefined') Orb.set(st); }

  function toggleWake() {
    const btn = document.getElementById('wakeBtn');
    const bar = document.getElementById('wakeBar');
    if (Voice.isAwake()) {
      Voice.stopWake();
      btn.textContent = '◎ Wake word off';
      btn.classList.remove('live');
      bar?.classList.remove('on');
      orbState('idle');
      log('Always-listening turned OFF by user.');
      return;
    }
    if (!Voice.canHear()) { bubble('This browser has no speech recognition. Chrome and Edge do.', 'zero'); return; }
    if (Control.halted || !Control.caps.network) {
      bubble('Always-listening needs the network, and Zero is blocking it right now.', 'zero');
      return;
    }
    if (!store.raw(LS.wakeOk)) {
      if (!confirm(
        'Turn on always-listening?\n\n' +
        'Zero will wait for the word "Zero" and act on whatever follows.\n\n' +
        'READ THIS FIRST: your browser does speech recognition in the cloud. While this is ' +
        'armed it streams audio from your microphone CONTINUOUSLY — not only when you are ' +
        'talking to Zero, but whatever else is said near this machine.\n\n' +
        'That is how browser dictation works and Zero cannot change it. The mic button ' +
        '(press to talk) sends far less. Only turn this on if that trade is one you want.\n\n' +
        'Arm always-listening?')) return;
      store.rawSet(LS.wakeOk, '1');
    }
    log('ALWAYS-LISTENING ARMED — audio streams to the browser speech service until turned off.', true);
    btn.textContent = '◉ Listening';
    btn.classList.add('live');
    bar?.classList.add('on');
    orbState('listening');
    Voice.startWake('zero',
      cmd => {                                    // heard "zero <something>"
        setText('wakeHeard', '“' + cmd + '”');
        orbState('thinking');
        document.getElementById('chatInput').value = cmd;
        send();
      },
      partial => setText('wakeHeard', partial.slice(-70)),
      st => { if (st === 'off') { btn.textContent = '◎ Wake word off'; btn.classList.remove('live'); bar?.classList.remove('on'); orbState('idle'); } },
      err => bubble(err, 'zero')
    );
  }

  /* ---------------- Live overview ---------------- */
  async function renderOverview() {
    const set = (id, v) => setText(id, v);
    set('ovTasks', tasks.filter(t => !t.done).length);
    set('ovNotes', notes.length);
    set('ovMem', memories.length);
    set('ovState', Control.halted ? 'HALTED' : 'RUNNING');
    const el = document.getElementById('ovState');
    if (el) el.style.color = Control.halted ? 'var(--red)' : 'var(--green)';

    const box = document.getElementById('ovMarket');
    if (box) {
      try {
        const r = await guardedFetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true', {}, 'market');
        if (!r.ok) throw new Error('HTTP ' + r.status);
        const d = await r.json();
        box.innerHTML = [['bitcoin','BTC'],['ethereum','ETH'],['solana','SOL']].map(([id, sym]) => {
          const p = d[id]; if (!p) return '';
          const c = p.usd_24h_change;
          const known = typeof c === 'number' && isFinite(c);
          return `<div class="ov-row"><span class="sym">${sym}</span><span>$${fmt(p.usd)}</span>` +
                 (known ? `<span class="${c >= 0 ? 'up' : 'down'}">${c >= 0 ? '▲' : '▼'} ${Math.abs(c).toFixed(2)}%</span>`
                        : `<span class="nodata">—</span>`) + `</div>`;
        }).join('');
      } catch (e) { box.innerHTML = `<div class="nodata" style="font-size:12px">no live feed</div>`; }
    }

    const nb = document.getElementById('ovNews');
    if (nb && !nb.dataset.loaded) {
      try {
        const items = await loadNews();
        if (items.length) {
          nb.innerHTML = items.slice(0, 4).map(i => `<div class="ov-news">${esc(i.title)}</div>`).join('');
          nb.dataset.loaded = '1';
        } else nb.innerHTML = '<div class="nodata" style="font-size:12px">no feed</div>';
      } catch { nb.innerHTML = '<div class="nodata" style="font-size:12px">no feed</div>'; }
    }
  }

  /* ---------------- Memory ---------------- */
  function renderMemories() {
    const list = document.getElementById('memoryList');
    if (!list) return;
    list.innerHTML = memories.length
      ? memories.map((m, i) => `<div class="task">
          <span>${esc(m.text)}</span>
          <button class="del" onclick="Zero.forgetMemory(${i})" title="Forget">×</button>
        </div>`).join('')
      : '<p class="hint">Nothing yet. Say <b>remember I trade gold on Fridays</b> in chat, and Zero carries it into every future conversation.</p>';
  }
  function forgetMemory(i) {
    memories.splice(i, 1);
    store.set(LS.memories, memories);
    renderMemories();
  }

  /* ---------------- App launcher ----------------
     A browser page cannot reach into other programs — that boundary is
     the whole reason a web page is safe to open. What it CAN do is hand
     the operating system a link and let it decide, which is how
     vscode://, spotify:, figma:// and every https:// app open. */
  const APP_PRESETS = [
    ['GitHub', 'https://github.com'], ['Figma', 'https://figma.com'],
    ['VS Code', 'vscode://'], ['Gmail', 'https://mail.google.com'],
    ['Drive', 'https://drive.google.com'], ['Notion', 'https://notion.so'],
    ['YouTube', 'https://youtube.com'],
    ['Spotify', 'https://open.spotify.com'], ['Discord', 'https://discord.com/app'],
    ['TradingView', 'https://tradingview.com'], ['Vercel', 'https://vercel.com'],
    ['Itch.io', 'https://itch.io'], ['Steam', 'steam://open/main'],
  ];
  function renderPresets() {
    const el = document.getElementById('appPresets');
    if (!el) return;
    el.innerHTML = APP_PRESETS
      .filter(([n]) => !apps.some(a => a.name.toLowerCase() === n.toLowerCase()))
      .map(([n, u]) => `<button class="chip" onclick="Zero.addPreset('${esc(n)}','${esc(u)}')">+ ${esc(n)}</button>`).join('');
  }
  function addPreset(name, url) { apps.push({ name, url }); store.set(LS.apps, apps); persistPlain(); renderApps(); renderPresets(); }

  function renderApps() {
    const list = document.getElementById('appList');
    if (!list) return;
    list.innerHTML = apps.length
      ? apps.map((a, i) => `<div class="app-tile" onclick="Zero.launchApp(${i})" title="${esc(a.url)}">
          <span class="app-name">${esc(a.name)}</span>
          <span class="app-url">${esc(a.url.replace(/^https?:\/\//, '').slice(0, 34))}</span>
          <button class="del" onclick="event.stopPropagation();Zero.removeApp(${i})">×</button>
        </div>`).join('')
      : '<p class="hint">No apps yet. Add one below, then say <b>open figma</b> in chat.</p>';
  }
  function addApp() {
    const n = document.getElementById('appName'), u = document.getElementById('appUrl');
    const name = n.value.trim(), url = u.value.trim();
    if (!name || !url) return alert('Both a name and a link are needed.');
    apps.push({ name, url });
    store.set(LS.apps, apps); persistPlain();
    n.value = ''; u.value = '';
    renderApps();
  }
  function removeApp(i) { apps.splice(i, 1); store.set(LS.apps, apps); persistPlain(); renderApps(); renderPresets(); }
  function launchApp(i) {
    const a = apps[i];
    if (!a) return;
    log('Opening ' + a.name + ' (' + a.url + ') — handed to the operating system.');
    window.open(a.url, '_blank', 'noopener,noreferrer');
  }

  /* ---------------- TradingView ----------------
     The one feature that reaches a third party. TradingView's official
     widget script is loaded from their servers, so it is gated: it loads
     only after you open this view AND consent once, and never if the
     network is halted or switched off. Everything else in Zero stays
     first-party; this is the deliberate, labelled exception. */
  let tvLoaded = false;

  function tvSymbols() {
    return [
      ['OANDA:XAUUSD', 'Gold / USD'], ['NASDAQ:AAPL', 'Apple'], ['NASDAQ:TSLA', 'Tesla'],
      ['BINANCE:BTCUSDT', 'Bitcoin'], ['BINANCE:ETHUSDT', 'Ethereum'], ['FX:EURUSD', 'EUR / USD'],
      ['NASDAQ:NVDA', 'Nvidia'], ['SP:SPX', 'S&P 500'], ['TVC:USOIL', 'Crude Oil'],
    ];
  }

  function openTradingView(symbol) {
    const host = document.getElementById('tvContainer');
    const gate = document.getElementById('tvGate');
    if (!host) return;

    if (Control.halted || !Control.caps.network) {
      host.innerHTML = '<div class="spinner">Charts need the network, and Zero is blocking it right now.</div>';
      return;
    }
    if (!store.raw(LS.tvOk)) { if (gate) gate.style.display = ''; return; }
    if (gate) gate.style.display = 'none';

    const sym = symbol || store.raw(LS.tvSymbol) || 'OANDA:XAUUSD';
    store.rawSet(LS.tvSymbol, sym);
    setText('tvNow', sym);

    const build = () => {
      host.innerHTML = '<div id="tvWidget" style="height:520px"></div>';
      /* eslint-disable no-undef */
      new TradingView.widget({
        container_id: 'tvWidget', symbol: sym, autosize: true,
        interval: 'D', timezone: 'Etc/UTC', theme: 'dark', style: '1',
        locale: 'en', enable_publishing: false, hide_side_toolbar: false,
        allow_symbol_change: true, studies: ['RSI@tv-basicstudies'],
      });
    };

    if (tvLoaded && window.TradingView) { build(); return; }
    host.innerHTML = '<div class="spinner">Loading TradingView</div>';
    log('Loading TradingView widget from s3.tradingview.com (third-party) — user opened Trading.', true);
    const sc = document.createElement('script');
    sc.src = 'https://s3.tradingview.com/tv.js';
    sc.onload = () => { tvLoaded = true; build(); };
    sc.onerror = () => { host.innerHTML = '<div class="spinner">Could not reach TradingView. Check your connection.</div>'; };
    document.head.appendChild(sc);
  }

  function allowTradingView() {
    store.rawSet(LS.tvOk, '1');
    log('TradingView enabled by user.');
    openTradingView();
  }

  function tvSearch() {
    const raw = document.getElementById('tvInput').value.trim();
    if (raw) openTradingView(raw.toUpperCase());
  }

  function renderTvChips() {
    const el = document.getElementById('tvChips');
    if (!el) return;
    el.innerHTML = tvSymbols().map(([sym, name]) =>
      `<button class="chip" onclick="Zero.openTradingView('${sym}')">${esc(name)}</button>`).join('');
  }

  /* ---------------- Charts & analysis ---------------- */
  const CHART_IDS = { btc:'bitcoin', eth:'ethereum', sol:'solana', bnb:'binancecoin',
    xrp:'ripple', doge:'dogecoin', ada:'cardano', link:'chainlink', avax:'avalanche-2',
    dot:'polkadot', matic:'matic-network', ltc:'litecoin' };

  async function showChart(symRaw, days = 30) {
    const sym = symRaw.toLowerCase().replace(/[^a-z0-9-]/g, '');
    const id = CHART_IDS[sym] || sym;
    bubble(`Pulling ${days} days of ${sym.toUpperCase()} history…`, 'zero');
    try {
      const r = await guardedFetch(
        `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(id)}/market_chart?vs_currency=usd&days=${days}`,
        {}, 'market');
      if (r.status === 404) throw new Error(`I have no history for "${symRaw}". Zero charts crypto; for stocks and metals it would need a data feed that publishes them.`);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const d = await r.json();
      const values = (d.prices || []).map(pt => pt[1]).filter(v => typeof v === 'number');
      if (values.length < 5) throw new Error('the feed returned too little history to chart');

      const holder = document.createElement('div');
      holder.className = 'msg zero chart-msg';
      const head = document.createElement('div');
      head.className = 'chart-head';
      head.textContent = `${sym.toUpperCase()} / USD · ${days}d · ${values.length} points`;
      const cv = document.createElement('canvas');
      cv.className = 'chart-canvas';
      holder.append(head, cv);
      document.getElementById('chatLog').appendChild(holder);
      Chart.draw(cv, values, { ma: Math.min(7, Math.floor(values.length / 3)) });

      const a = Chart.describe(values);
      const body = document.createElement('div');
      body.className = 'chart-read';
      const f = n => n >= 1000 ? n.toLocaleString(undefined,{maximumFractionDigits:0}) : n.toPrecision(5);
      body.textContent = [
        `Last            $${f(a.last)}`,
        `${days}d change      ${a.change >= 0 ? '+' : ''}${a.change.toFixed(2)}%`,
        `${days}d range       $${f(a.lo)} – $${f(a.hi)}`,
        `Position in range   ${a.pos.toFixed(0)}% (0 = low, 100 = high)`,
        a.ma7  != null ? `7-period average    $${f(a.ma7)}` : '',
        a.ma30 != null ? `30-period average   $${f(a.ma30)}` : '',
        a.rsi  != null ? `RSI(14)             ${a.rsi.toFixed(1)}` : '',
        a.vol  != null ? `Volatility (ann.)   ${a.vol.toFixed(1)}%` : '',
      ].filter(Boolean).join('\n');
      holder.appendChild(body);

      const note = document.createElement('div');
      note.className = 'chart-note';
      note.textContent =
        'Every figure above is arithmetic over prices that already happened. ' +
        'None of it forecasts the next move, and Zero will not pretend otherwise — ' +
        'nothing predicts markets reliably. Position sizing and risk limits are what you actually control.';
      holder.appendChild(note);
      document.getElementById('chatLog').scrollTop = 1e9;
      if (speakReplies) Voice.speak(
        `${sym.toUpperCase()} is at ${f(a.last)}, ${a.change >= 0 ? 'up' : 'down'} ${Math.abs(a.change).toFixed(1)} percent over ${days} days.`);
    } catch (e) {
      bubble('Could not chart that: ' + e.message, 'zero');
    }
  }

  /* ---------------- Daily briefing ----------------
     A factual digest of live conditions across a basket. It reports what
     the market DID — moves, RSI, volatility, position in range — and
     deliberately issues no buy/sell call, because an honest one does not
     exist. The reader decides; Zero informs. */
  const BRIEF_BASKET = [['bitcoin', 'BTC'], ['ethereum', 'ETH'], ['solana', 'SOL']];

  function rsiWord(r) {
    if (r == null) return '';
    if (r >= 70) return `RSI ${r.toFixed(0)} (in the band conventionally called overbought — a note on recent momentum, not a sell signal)`;
    if (r <= 30) return `RSI ${r.toFixed(0)} (conventionally called oversold — not a buy signal)`;
    return `RSI ${r.toFixed(0)} (mid-range)`;
  }

  async function dailyBriefing(speak) {
    const holder = bubble('Reading the market…', 'zero');
    const lines = [];
    const f = n => n >= 1000 ? n.toLocaleString(undefined, { maximumFractionDigits: 0 }) : n.toPrecision(5);
    for (const [id, sym] of BRIEF_BASKET) {
      try {
        const r = await guardedFetch(
          `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=30`, {}, 'market');
        if (!r.ok) throw new Error('HTTP ' + r.status);
        const values = (await r.json()).prices?.map(p => p[1]).filter(v => typeof v === 'number') || [];
        if (values.length < 5) { lines.push(`${sym}: not enough data returned.`); continue; }
        const a = Chart.describe(values);
        const trend = a.ma7 != null && a.ma30 != null
          ? (a.ma7 > a.ma30 ? 'short-term average above the longer one' : 'short-term average below the longer one')
          : '';
        lines.push(
          `${sym}  $${f(a.last)}\n` +
          `   30d ${a.change >= 0 ? '+' : ''}${a.change.toFixed(1)}% · ${a.pos.toFixed(0)}% of its 30d range · ` +
          `${a.vol != null ? a.vol.toFixed(0) + '% annualised vol' : ''}\n` +
          `   ${rsiWord(a.rsi)}${trend ? ' · ' + trend : ''}`);
      } catch (e) {
        if (/halted|switched off/i.test(e.message)) { holder.textContent = e.message; return; }
        lines.push(`${sym}: could not read (${e.message}).`);
      }
    }
    const now = new Date().toLocaleString(undefined, { weekday: 'long', hour: '2-digit', minute: '2-digit' });
    const body =
      `MARKET BRIEFING · ${now}\n\n` +
      lines.join('\n\n') +
      `\n\nThese are readings of what has already happened, not forecasts. ` +
      `Zero does not tell you what to trade — no tool reliably predicts the next move. ` +
      `What you control is position size and risk. Gold, stocks and forex charts are in the Trading tab.`;
    holder.textContent = body;
    if (speak && speakReplies) Voice.speak('Market briefing ready. ' +
      lines.map(l => l.split('\n')[0]).join('. '));
    log('Daily briefing generated.');
  }

  /* ---------------- Currency (live ECB rates, keyless) ---------------- */
  const CURRENCIES = new Set(('USD EUR GBP JPY CHF CAD AUD NZD CNY HKD SGD SEK NOK DKK PLN ' +
    'CZK HUF RON BGN TRY ILS INR KRW MXN BRL ZAR THB MYR PHP IDR ISK').split(' '));

  async function convertMoney(n, from, to) {
    try {
      const r = await guardedFetch(
        `https://api.frankfurter.app/latest?amount=${n}&from=${from}&to=${to}`, {}, 'market');
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const d = await r.json();
      const v = d.rates?.[to];
      if (typeof v !== 'number') throw new Error('no rate published for that pair');
      bubble(`${n} ${from} = ${v.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${to}` +
             `  (ECB, ${d.date})`, 'zero');
    } catch (e) {
      bubble('Could not get that rate: ' + e.message, 'zero');
    }
  }

  async function loadRates() {
    const box = document.getElementById('fxTable');
    if (!box) return;
    const base = 'USD', against = ['EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD'];
    try {
      const r = await guardedFetch(
        `https://api.frankfurter.app/latest?from=${base}&to=${against.join(',')}`, {}, 'market');
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const d = await r.json();
      box.innerHTML = against.map(c => {
        const v = d.rates?.[c];
        return `<div class="mkt-row"><div class="sym">${base}/${c}</div>` +
               (typeof v === 'number'
                 ? `<div>${v.toFixed(4)}</div>` : `<div class="nodata">&mdash;</div>`) +
               `<div class="nodata">${esc(d.date || '')}</div></div>`;
      }).join('');
    } catch (e) {
      box.innerHTML = `<div class="spinner">No live rates (${esc(e.message)}).</div>`;
    }
  }

  /* ---------------- News (live, keyless) ---------------- */
  let newsMode = 'world';   // world | tech

  function setNewsMode(m) {
    newsMode = m;
    document.querySelectorAll('#newsTabs .chip').forEach(c =>
      c.classList.toggle('on', c.dataset.mode === m));
    document.getElementById('newsList').dataset.loaded = '';
    loadNews();
  }

  async function loadNews(alsoSay) {
    const box = document.getElementById('newsList');
    if (box) box.innerHTML = '<div class="spinner">Loading stories</div>';
    try {
      const items = newsMode === 'tech' ? await fetchTechNews() : await fetchWorldNews();
      if (!items.length) throw new Error('no stories returned');
      if (box) {
        box.innerHTML = items.map(it =>
          `<div class="news-item">
             <a href="${esc(it.url)}" target="_blank" rel="noopener noreferrer">${esc(it.title)}</a>
             <div class="news-meta">${esc(it.source || '')}${it.source && it.when ? ' · ' : ''}${esc(it.when || '')}</div>
           </div>`).join('');
        box.dataset.loaded = '1';
      }
      setText('newsUpdated', 'Live · ' + (newsMode === 'tech' ? 'tech' : 'world') + ' · ' + new Date().toLocaleTimeString());
      if (alsoSay) bubble(`Top ${newsMode} stories right now:\n\n` +
        items.slice(0, 5).map((it, i) => `${i + 1}. ${it.title}`).join('\n'), 'zero');
      return items;
    } catch (e) {
      if (box) box.innerHTML = `<div class="spinner">No live news (${esc(e.message)}).</div>`;
      if (alsoSay) bubble('Could not reach the news feed: ' + e.message, 'zero');
      return [];
    }
  }

  /* World news: GDELT's global news database — keyless, worldwide, and
     CORS-open. It monitors news in many languages from across the world. */
  async function fetchWorldNews() {
    const r = await guardedFetch(
      'https://api.gdeltproject.org/api/v2/doc/doc?query=sourcelang:english&mode=artlist&maxrecords=15&sort=datedesc&format=json',
      {}, 'market');
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const d = await r.json();
    return (d.articles || []).filter(a => a.title).map(a => ({
      title: a.title,
      url: a.url,
      source: a.domain || '',
      when: a.seendate ? tidyGdeltDate(a.seendate) : '',
    })).slice(0, 15);
  }

  function tidyGdeltDate(s) {
    // GDELT stamps are like 20260812T143000Z
    const m = /^(\d{4})(\d\d)(\d\d)T(\d\d)(\d\d)/.exec(s);
    if (!m) return '';
    const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]));
    return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  /* Tech news: Hacker News. */
  async function fetchTechNews() {
    const r = await guardedFetch('https://hacker-news.firebaseio.com/v0/topstories.json', {}, 'market');
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const ids = (await r.json()).slice(0, 12);
    const items = [];
    for (const id of ids) {
      try {
        const ir = await guardedFetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, {}, 'market');
        const it = await ir.json();
        if (it?.title) items.push({
          title: it.title,
          url: it.url || 'https://news.ycombinator.com/item?id=' + it.id,
          source: it.url ? (() => { try { return new URL(it.url).hostname.replace(/^www\./, ''); } catch { return 'news.ycombinator.com'; } })() : 'news.ycombinator.com',
          when: (it.score ?? 0) + ' points',
        });
      } catch { /* one dud story shouldn't sink the feed */ }
    }
    return items;
  }

  /* ---------------- Voice ---------------- */
  let speakReplies = false;

  function toggleSpeak(on) {
    speakReplies = on;
    if (!on) Voice.stop();
    log('Spoken replies turned ' + (on ? 'ON' : 'OFF') + ' by user.');
  }

  function micToggle() {
    if (Voice.isListening()) { Voice.stopListening(); return; }
    if (!Voice.canHear()) {
      bubble('This browser has no speech recognition. Chrome and Edge do; Firefox does not.', 'zero');
      return;
    }
    // Dictation is not local, so it is gated like any other network use.
    if (Control.halted || !Control.caps.network) {
      bubble('Dictation needs the network, and Zero is currently blocking it. Typing still works.', 'zero');
      return;
    }
    if (!store.raw(LS.micOk)) {
      if (!confirm(
        'Turn on the microphone?\n\n' +
        "Speaking is done on your device. LISTENING IS NOT: your browser uploads the audio " +
        "to its speech service to transcribe it — for Chrome that means Google.\n\n" +
        'Zero cannot change that; it is how browser dictation works. Type instead if you would rather nothing left this machine.\n\n' +
        'Enable dictation?')) return;
      store.rawSet(LS.micOk, '1');
    }
    const btn = document.getElementById('micBtn');
    const inp = document.getElementById('chatInput');
    log('Microphone opened by user — audio goes to the browser speech service.', true);
    Voice.listen(
      (text, final) => { inp.value = text; if (final && text) send(); },
      on => { btn?.classList.toggle('live', on); if (btn) btn.textContent = on ? '● listening' : '🎤'; },
      err => { bubble(err, 'zero'); btn?.classList.remove('live'); if (btn) btn.textContent = '🎤'; }
    );
  }

  /* ---------------- Stocks (real quotes, or nothing) ---------------- */
  async function loadStocks() {
    const box = document.getElementById('stockTable');
    if (!box) return;
    const key = store.raw(LS.stockKey);
    if (!key) {
      box.innerHTML = '<p class="hint">No stock feed connected. Add a free Finnhub key in Settings and Zero will pull live quotes here.</p>';
      return;
    }
    const syms = (store.raw(LS.stockSymbols) || 'AAPL,MSFT,NVDA,TSLA,SPY')
      .split(',').map(x => x.trim().toUpperCase()).filter(Boolean).slice(0, 12);
    box.innerHTML = '<div class="spinner">Loading live quotes</div>';
    const rows = [];
    for (const sym of syms) {
      let row = `<div class="mkt-row"><div class="sym">${esc(sym)}</div><div class="nodata">—</div><div class="nodata">no data</div></div>`;
      try {
        const r = await guardedFetch(
          `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(sym)}&token=${encodeURIComponent(key)}`, {}, 'market');
        const d = await r.json();
        // Finnhub answers 0 for symbols it doesn't know. Zero is never
        // going to print $0.00 and call it a quote.
        if (typeof d.c === 'number' && d.c > 0) {
          const chg = typeof d.dp === 'number' && isFinite(d.dp) ? d.dp : null;
          const cell = chg === null
            ? `<div class="nodata">—</div>`
            : `<div class="${chg >= 0 ? 'up' : 'down'}">${chg >= 0 ? '▲' : '▼'} ${Math.abs(chg).toFixed(2)}%</div>`;
          row = `<div class="mkt-row"><div class="sym">${esc(sym)}</div><div>$${fmt(d.c)}</div>${cell}</div>`;
        }
      } catch (e) {
        if (/halted|switched off/i.test(e.message)) { box.innerHTML = `<div class="spinner">${esc(e.message)}</div>`; return; }
      }
      rows.push(row);
    }
    box.innerHTML = rows.join('');
    setText('stockUpdated', 'Live · updated ' + new Date().toLocaleTimeString());
  }

  const fmt = n => n >= 1
    ? n.toLocaleString(undefined, { maximumFractionDigits: 2 })
    : n.toPrecision(4);

  /* ---------------- Tasks ---------------- */
  function renderTasks() {
    const list = document.getElementById('taskList');
    if (!tasks.length) { list.innerHTML = '<p class="hint">No tasks yet. Add one above.</p>'; }
    else {
      list.innerHTML = tasks.map((t, i) => `
        <div class="task ${t.done ? 'done' : ''}">
          <input type="checkbox" ${t.done ? 'checked' : ''} onchange="Zero.toggleTask(${i})" />
          <span>${esc(t.text)}</span>
          <button class="del" onclick="Zero.delTask(${i})">×</button>
        </div>`).join('');
    }
    setText('statTasks', tasks.filter(t => !t.done).length);
    store.set(LS.tasks, tasks);
  }
  function addTask(text) {
    const inp = document.getElementById('taskInput');
    const val = (text ?? inp.value).trim();
    if (!val) return;
    tasks.unshift({ text: val, done: false, ts: Date.now() });
    if (!text) inp.value = '';
    renderTasks();
  }
  function toggleTask(i) { tasks[i].done = !tasks[i].done; renderTasks(); }
  function delTask(i) { tasks.splice(i, 1); renderTasks(); }

  /* ---------------- Notes ---------------- */
  function renderNotes() {
    const list = document.getElementById('noteList');
    if (!notes.length) { list.innerHTML = '<p class="hint">No notes yet.</p>'; }
    else {
      list.innerHTML = notes.map((n, i) => `
        <div class="card" style="margin-bottom:10px">
          <div style="display:flex;justify-content:space-between;align-items:start">
            <div style="white-space:pre-wrap">${esc(n.text)}</div>
            <button class="del" style="color:var(--muted);background:none;border:none;cursor:pointer;font-size:16px" onclick="Zero.delNote(${i})">×</button>
          </div>
          <div class="hint" style="margin-top:8px">${new Date(n.ts).toLocaleString()}</div>
        </div>`).join('');
    }
    setText('statNotes', notes.length);
    store.set(LS.notes, notes);
  }
  function addNote(text) {
    const inp = document.getElementById('noteInput');
    const val = (text ?? inp.value).trim();
    if (!val) return;
    notes.unshift({ text: val, ts: Date.now() });
    if (!text) inp.value = '';
    renderNotes();
  }
  function delNote(i) { notes.splice(i, 1); renderNotes(); }

  /* ---------------- Quick capture ---------------- */
  /* ---------------- Assistant ---------------- */
  function bubble(text, who) {
    if (who === 'zero' && speakReplies && text && text !== '…') {
      orbState('speaking');
      Voice.speak(text, { onend: () => orbState(Voice.isAwake() ? 'listening' : 'idle') });
    }
    const log = document.getElementById('chatLog');
    const d = document.createElement('div');
    d.className = 'msg ' + who;
    d.textContent = text;
    log.appendChild(d);
    log.scrollTop = log.scrollHeight;
    return d;
  }

  async function send() {
    const inp = document.getElementById('chatInput');
    const q = inp.value.trim();
    if (!q) return;
    inp.value = '';
    bubble(q, 'user');

    // Try built-in offline commands first — always works, no key, no network.
    // 1. Exact commands.
    const handled = offlineCommand(q);
    if (handled === HANDLED) return;                 // already answered itself
    if (handled !== null) { bubble(handled, 'zero'); return; }

    // 2. Ordinary conversation — instant, no model, no network.
    const chat = Converse.reply(q, {
      tasks: tasks.filter(t => !t.done).length,
      memories: memories.length,
      hasEngine: !!store.raw(LS.engineModel),
      name: userName(),
    });
    if (chat) { bubble(chat, 'zero'); return; }

    if (/\bmy name is\s+(.+)$/i.test(q)) {
      const n = q.match(/\bmy name is\s+(.+)$/i)[1].replace(/[.!]$/, '').trim();
      memories.push({ text: 'The user is called ' + n, ts: Date.now() });
      store.set(LS.memories, memories); renderMemories();
      bubble(`Good to meet you, ${n}. I will remember that.`, 'zero');
      return;
    }

    // 3. A configured engine gets first refusal on open questions.
    if (store.raw(LS.engineUrl) || store.raw(LS.engineModel)) {
      const thinking = bubble('…', 'zero');
      try {
        const reply = await callEngine(q, partial => renderReply(thinking, partial, false));
        renderReply(thinking, reply, true);
        if (speakReplies) Voice.speak(splitThinking(reply).answer || reply);
        chatHistory.push({ role: 'user', content: q }, { role: 'assistant', content: reply });
        if (chatHistory.length > 40) chatHistory = chatHistory.slice(-40);
        return;
      } catch (e) {
        // An unreachable engine is not a reason to give the user nothing.
        thinking.remove();
        log('Core unavailable, answering from live sources instead: ' + e.message);
      }
    }

    // 4. A near-miss on a command is almost always a typo, not a research
    //    question — catch it before spending a network round trip on it.
    const looksLikeQuestion = /^(what|who|where|when|why|how|which|is|are|can|does|do|tell|explain|define)\b/i.test(q) || q.includes('?');
    if (!looksLikeQuestion) {
      const near = Converse.suggest(q, COMMAND_WORDS);
      if (near && near !== q.split(/\s+/)[0].toLowerCase()) {
        bubble(`Did you mean \`${near}\`? ` +
               `Say \`${[near, ...q.split(/\s+/).slice(1)].join(' ')}\` and I will run it.`, 'zero');
        return;
      }
    }

    // 5. Look it up rather than complain.
    orbState('thinking');
    const found = await lookUp(stripQuestion(q), true);
    orbState(Voice.isAwake() ? 'listening' : 'idle');
    if (found) return;

    // 6. Nothing matched anywhere. Say so plainly.
    bubble(`I could not find an answer for that on my own. Type \`help\` to see everything I do without a model, ` +
           `or connect one in Settings for open-ended conversation.`, 'zero');
  }

  const COMMAND_WORDS = ['help','task','tasks','note','price','chart','news','update','time',
    'remember','memories','forget','open','scaffold','slug','uuid','password','hash'];

  const stripQuestion = q => q.replace(
    /^(what|who|where|when|why|how)\s+(is|are|was|were|does|do|did)\s+/i, '')
    .replace(/^(tell me about|explain|define|search for|look up|google)\s+/i, '')
    .replace(/\?+$/, '').trim();

  function userName() {
    const m = memories.find(x => /^The user is called /.test(x.text));
    return m ? m.text.replace('The user is called ', '') : '';
  }

  // Returned when a command handled itself and has nothing to say back —
  // distinct from null, which means "not mine, try the engine".
  const HANDLED = Symbol('handled');

  function offlineCommand(q) {
    const s = q.trim();
    const low = s.toLowerCase();
    if (low === 'help') {
      return [
        'Zero works with no AI model at all. Try:',
        '',
        'MATH & UNITS',
        '  = 12*(3+4)^2        arithmetic, sqrt/sin/log, pi, e',
        '  20 km to miles      length, mass, data, time, temperature',
        '  100 usd to eur      live exchange rates',
        '',
        'MARKETS & NEWS',
        '  price btc           live crypto price',
        '  chart btc 90        price chart + indicators',
        '  briefing            daily read of live market conditions',
        '  news                top stories right now',
        '  update              refresh everything',
        '',
        'BUILDING',
        '  scaffold page       starter HTML page',
        '  scaffold game       canvas game loop, fixed timestep',
        '  scaffold fetch      fetch with timeout + cleanup',
        '  slug <text>         url-safe slug',
        '  uuid / password     generate one',
        '  hash <text>         SHA-256',
        '  password            generate a strong one',
        '',
        'SECURITY',
        '  Security tab        password strength, breach check, site checklist',
        '',
        'ORGANISING',
        '  task <text>         add a task        tasks   list them',
        '  note <text>         save a note       time    date & time',
        '',
        'Say it out loud with the mic button — Zero can talk back.',
      ].join('\n');
    }
    if (low === 'time') return new Date().toLocaleString();

    // --- arithmetic: "= expr" or a bare expression ---
    if (s.startsWith('=') || /^[-+(]?[\d.]+[\d\s+\-*/%^().a-z]*$/i.test(s) && /[+\-*/%^]/.test(s)) {
      try { return Skills.calc(s.replace(/^=/, '')).toLocaleString(undefined, { maximumFractionDigits: 10 }); }
      catch (err) { if (s.startsWith('=')) return "I couldn't work that out: " + err.message; }
    }

    // --- unit and currency conversion: "20 km to miles" ---
    const conv = s.match(/^([-+]?[\d.]+)\s*([a-z°]+)\s*(?:to|in|as)\s*([a-z°]+)$/i);
    if (conv) {
      const [, rawN, from, to] = conv;
      const n = parseFloat(rawN);
      const f = from.toLowerCase().replace('°', ''), t = to.toLowerCase().replace('°', '');
      if (CURRENCIES.has(f.toUpperCase()) && CURRENCIES.has(t.toUpperCase())) {
        convertMoney(n, f.toUpperCase(), t.toUpperCase());
        return `Fetching the live ${f.toUpperCase()}→${t.toUpperCase()} rate…`;
      }
      try {
        const r = Skills.convert(n, f, t);
        const out = Math.abs(r.value) >= 1000 || Math.abs(r.value) < 0.001
          ? r.value.toPrecision(6) : r.value.toFixed(4).replace(/\.?0+$/, '');
        return `${rawN} ${from} = ${out} ${to}`;
      } catch (err) { return err.message; }
    }

    if (low === 'news') { loadNews(true); return 'Pulling the latest stories…'; }
    if (low === 'briefing' || low === 'daily' || low === 'brief' || low === 'market' || low === 'markets today') {
      dailyBriefing(true); return HANDLED;
    }

    if (low.startsWith('remember ')) {
      const text = s.slice(9).trim();
      if (!text) return 'Remember what?';
      memories.push({ text, ts: Date.now() });
      store.set(LS.memories, memories); renderMemories();
      return '✓ Noted. I will bring that to future conversations.';
    }
    if (low === 'memories' || low === 'memory') {
      return memories.length
        ? 'I am carrying:\n' + memories.map((m, i) => `${i + 1}. ${m.text}`).join('\n')
        : 'I am not carrying anything yet. Say "remember <something>".';
    }
    if (low.startsWith('forget ')) {
      const n = parseInt(low.slice(7), 10);
      if (!n || n < 1 || n > memories.length) return `Say "forget 1" through "forget ${memories.length}". "memories" lists them.`;
      const [gone] = memories.splice(n - 1, 1);
      store.set(LS.memories, memories); renderMemories();
      return '✓ Forgotten: ' + gone.text;
    }
    if (low.startsWith('open ') && apps.length) {
      const want = low.slice(5).trim();
      const hit = apps.find(a => a.name.toLowerCase().includes(want));
      if (hit) { launchApp(apps.indexOf(hit)); return 'Opening ' + hit.name + '…'; }
    }

    // chart / analyse:  "chart btc",  "chart eth 90",  "analyse sol"
    const ch = low.match(/^(?:chart|analyse|analyze|open)\s+([a-z0-9-]+)(?:\s+(\d{1,3}))?$/);
    if (ch) { showChart(ch[1], Math.min(parseInt(ch[2] || '30', 10), 365)); return HANDLED; }

    if (low.startsWith('scaffold')) {
      const which = low.split(/\s+/)[1];
      const code = Skills.SCAFFOLDS[which];
      if (!code) return 'I have scaffolds for: ' + Object.keys(Skills.SCAFFOLDS).join(', ') + '.';
      return code;
    }
    if (low.startsWith('slug ')) return Skills.slug(s.slice(5));
    if (low === 'uuid') return Skills.uuid();
    if (low === 'password') return Skills.password();
    if (low.startsWith('hash ')) { Skills.sha256(s.slice(5)).then(h => bubble(h, 'zero')); return 'Hashing…'; }
    if (low === 'update' || low === 'refresh' || low === 'sync') {
      updateNow(true);
      return 'Updating — pulling fresh market data and re-checking Core…';
    }
    if (low === 'tasks') {
      const open = tasks.filter(t => !t.done);
      return open.length ? open.map((t, i) => `${i + 1}. ${t.text}`).join('\n') : 'No open tasks. 🎉';
    }
    if (low.startsWith('task ')) { addTask(s.slice(5)); renderTasks(); return '✓ Task added.'; }
    if (low.startsWith('note ')) { addNote(s.slice(5)); renderNotes(); return '✓ Note saved.'; }
    if (low.startsWith('price ')) {
      const sym = low.slice(6).trim();
      const map = { btc: 'bitcoin', eth: 'ethereum', sol: 'solana', bnb: 'binancecoin', xrp: 'ripple', doge: 'dogecoin' };
      const id = map[sym];
      if (!id) return `I can price: ${Object.keys(map).join(', ')}.`;
      livePrice(id, sym.toUpperCase());
      return `Fetching live ${sym.toUpperCase()} price…`;
    }
    return null; // not an offline command
  }

  async function livePrice(id, sym) {
    try {
      const r = await guardedFetch(`https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd&include_24hr_change=true`, {}, 'market');
      const d = await r.json();
      const chg = d[id].usd_24h_change;
      bubble(`${sym}: $${fmt(d[id].usd)}  (${chg >= 0 ? '+' : ''}${chg.toFixed(2)}% 24h)`, 'zero');
    } catch (e) { bubble('Could not fetch price: ' + e.message, 'zero'); }
  }

  /* ============================================================
     ZERO CORE — the reasoning engine

     Zero is not a front-end for anyone's hosted AI. Core drives a
     model running on your own hardware, and speaks two wire
     formats so you can swap the underlying runtime without Zero
     caring which one you chose:

       native     — the /api/chat protocol
       compatible — the /v1/chat/completions protocol

     No vendor, no account, no key, no telemetry. Requests go to
     the address you set and nowhere else.
     ============================================================ */
  const CORE_PROMPT =
    "You are Zero, a private assistant running on the user's own machine. " +
    "The user builds websites and games and follows the markets. " +
    "Be direct, concrete and brief. " +
    "For market questions, give information and analysis, and note that it is not financial advice. " +
    "Never invent numbers: if you do not have a real figure, say so.";

  const THINK_PROMPT =
    "\n\nWork through the problem step by step inside <think></think> tags first, " +
    "then give your final answer after the closing tag.";

  const engineCfg = () => {
    // Wire format, by what it is rather than who ships it. Anything
    // unrecognised falls back to native and shows as such in Settings.
    const raw = store.raw(LS.engineMode);
    const mode = raw === 'compatible' ? 'compatible' : 'native';
    return {
      url: (store.raw(LS.engineUrl) || 'http://localhost:11434').replace(/\/+$/, ''),
      model: store.raw(LS.engineModel),
      mode,
      think: store.raw(LS.think) === '1',
    };
  };

  /* Ask the engine what it has. Used for auto-selection and for Test. */
  async function listModels() {
    const { url, mode } = engineCfg();
    const r = await guardedFetch(mode === 'compatible' ? url + '/v1/models' : url + '/api/tags', {}, 'ai');
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const d = await r.json();
    return (d.models || d.data || []).map(m => m.name || m.id).filter(Boolean);
  }

  /* No model configured? Adopt whatever the engine actually has rather
     than shipping a hardcoded default that may not be installed. */
  async function resolveModel() {
    const { model } = engineCfg();
    if (model) return model;
    const names = await listModels();
    if (!names.length) throw new Error('Your engine is running but has no models installed yet.');
    store.rawSet(LS.engineModel, names[0]);
    const el = document.getElementById('engineModel');
    if (el) el.value = names[0];
    log('Core adopted model "' + names[0] + '".');
    return names[0];
  }

  /* Reasoning models wrap their working in <think> tags. Split it out so
     the thinking is visible but never mistaken for the answer. */
  function splitThinking(text) {
    const closed = text.match(/^\s*<think>([\s\S]*?)<\/think>\s*([\s\S]*)$/i);
    if (closed) return { thought: closed[1].trim(), answer: closed[2].trim() };
    const open = text.match(/^\s*<think>([\s\S]*)$/i);
    if (open) return { thought: open[1].trim(), answer: '' };
    return { thought: '', answer: text };
  }

  function renderReply(el, text, done) {
    const { thought, answer } = splitThinking(text);
    el.innerHTML = '';
    if (thought) {
      const d = document.createElement('details');
      d.className = 'think';
      d.open = !done;                    // follow along live, collapse once answered
      const sum = document.createElement('summary');
      sum.textContent = done ? 'reasoning' : 'thinking…';
      const body = document.createElement('div');
      body.textContent = thought;
      d.append(sum, body);
      el.appendChild(d);
    }
    const out = document.createElement('div');
    out.textContent = answer || (thought ? '' : text);
    el.appendChild(out);
  }

  async function callEngine(q, onToken) {
    const { url, mode, think } = engineCfg();
    const model = await resolveModel();
    let system = CORE_PROMPT + (think ? THINK_PROMPT : '');
    if (memories.length) {
      system += '\n\nThings the user has told you to remember:\n' +
        memories.map(m => '- ' + m.text).join('\n');
    }
    const messages = [{ role: 'system', content: system }, ...chatHistory.slice(-24), { role: 'user', content: q }];

    const [endpoint, body, pluck] = mode === 'compatible'
      ? [url + '/v1/chat/completions', { model, stream: true, messages }, d => d.choices?.[0]?.delta?.content]
      : [url + '/api/chat',            { model, stream: true, messages }, d => d.message?.content];

    let r;
    try {
      r = await guardedFetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      }, 'ai');
    } catch (e) {
      if (/halted|switched off/i.test(e.message)) throw e;
      throw new Error(`Core can't reach the engine at ${url}. Is it running? (${e.message})`);
    }

    if (!r.ok) {
      const detail = await r.text().catch(() => '');
      if (r.status === 404) throw new Error(`Engine reached, but model "${model}" was not found. Install it, or change the model in Settings.`);
      throw new Error(`Engine returned ${r.status}. ${detail.slice(0, 180)}`);
    }

    let full = '';
    const reader = r.body?.getReader();
    if (!reader) { full = await r.text(); onToken?.(full); return full; }

    const take = line => {
      line = line.trim();
      if (!line) return;
      if (line.startsWith('data:')) line = line.slice(5).trim();
      if (line === '[DONE]') return;
      try {
        const piece = pluck(JSON.parse(line));
        if (piece) { full += piece; onToken?.(full); }
      } catch { /* keepalives and non-JSON frames are expected */ }
    };

    const decoder = new TextDecoder();
    let buf = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split('\n');
      buf = lines.pop() || '';
      lines.forEach(take);
    }
    // A stream that ends without a trailing newline leaves its final —
    // and often longest — chunk sitting in the buffer. Flush it.
    take(buf);
    return full || '(the engine returned nothing)';
  }

  async function testEngine() {
    const out = document.getElementById('engineStatus');
    const { url, model } = engineCfg();
    out.textContent = 'Checking ' + url + ' …';
    try {
      const names = await listModels();
      if (!names.length) {
        out.innerHTML = `<b style="color:var(--green)">Core connected</b>, but no models are installed in your engine yet.`;
      } else {
        const active = model || names[0];
        const has = names.some(n => n === active || n.startsWith(active + ':'));
        out.innerHTML = `<b style="color:var(--green)">Core online.</b> ${names.length} model(s) available. ` +
          (has ? `Running "${esc(active)}".`
               : `<span style="color:var(--red)">"${esc(active)}" is not installed.</span> Available: ${esc(names.slice(0, 6).join(', '))}`);
      }
      refreshAiStatus();
    } catch (e) {
      out.innerHTML = `<b style="color:var(--red)">No engine at ${esc(url)}.</b> ${esc(e.message)}<br>` +
        `Start your local runtime and try again — see the setup note below.`;
    }
  }

  /* ---------------- Update on command ---------------- */
  /* "update" pulls fresh readings and re-checks Core. Nothing in Zero
     rewrites its own code; this refreshes live state on your say-so. */
  async function updateNow(announce) {
    log('Update requested by user.');
    const results = [];
    try { await fetchMarkets(); results.push('market data refreshed'); }
    catch (e) { results.push('market refresh failed (' + e.message + ')'); }
    try { await loadStocks(); } catch { /* reported in its own panel */ }
    try { await loadRates(); } catch { /* reported in its own panel */ }
    try { const n = await loadNews(); if (n.length) results.push(n.length + ' stories'); } catch { /* reported in its own panel */ }
    try {
      const names = await listModels();
      results.push(`Core online, ${names.length} model(s)`);
    } catch (e) { results.push('Core unreachable (' + e.message + ')'); }
    const line = 'Update complete — ' + results.join('; ') + '.';
    log(line);
    if (announce) bubble(line, 'zero');
    return line;
  }

  /* ---------------- Settings ---------------- */
  function saveEngine() {
    store.rawSet(LS.engineUrl, document.getElementById('engineUrl').value.trim());
    store.rawSet(LS.engineModel, document.getElementById('engineModel').value.trim());
    store.rawSet(LS.engineMode, document.getElementById('engineMode').value);
    refreshAiStatus();
    testEngine();
  }
  async function storageInfo() {
    const el = document.getElementById('storageInfo');
    if (!el) return;
    const q = await Store.quota();
    const persisted = await Store.persistRequest();
    el.innerHTML = q
      ? `Using <b>${Store.fmtBytes(q.usage)}</b> of roughly <b>${Store.fmtBytes(q.quota)}</b> available ` +
        `(${q.pct < 0.1 ? '<0.1' : q.pct.toFixed(1)}%).<br>` +
        `Eviction protection: <b>${persisted === true ? 'on' : persisted === false ? 'not granted' : 'unavailable'}</b>.`
      : 'This browser will not report a storage estimate.';
  }

  function setSpeak(on) { store.rawSet(LS.speak, on ? '1' : ''); toggleSpeak(on); }

  /* Fill the voice picker once the browser has loaded its catalogue. */
  function populateVoices() {
    const sel = document.getElementById('voiceSel');
    if (!sel || !Voice.canSpeak()) return;
    const list = Voice.listVoices();
    if (!list.length) return;                 // catalogue not ready yet
    const saved = store.raw(LS.voice);
    if (saved) Voice.setVoice(saved);
    const current = Voice.currentVoiceName();
    sel.innerHTML = list.map(v =>
      `<option value="${esc(v.name)}"${v.name === current ? ' selected' : ''}>${esc(v.name.replace(/^(Microsoft|Google)\s+/, ''))}</option>`
    ).join('');
  }
  function setVoice(name) {
    Voice.setVoice(name);
    store.rawSet(LS.voice, name);
    log('Voice set to ' + name + '.');
    previewVoice();
  }
  function previewVoice() {
    Voice.stop();
    Voice.speak("Zero online. Systems nominal. I'm listening.");
  }

  function setThink(on) {
    store.rawSet(LS.think, on ? '1' : '');
    log('Reasoning mode turned ' + (on ? 'ON' : 'OFF') + ' by user.');
  }

  function saveStockKey() {
    store.rawSet(LS.stockKey, document.getElementById('stockKey').value.trim());
    store.rawSet(LS.stockSymbols, document.getElementById('stockSymbols').value.trim());
    loadStocks();
  }

  function refreshAiStatus() {
    const el = document.getElementById('aiStatus');
    if (!el) return;
    const { model } = engineCfg();
    el.textContent = 'local · ' + model;
    el.className = 'pill';
  }

  /* ---------------- Vault ---------------- */
  function vaultUi() {
    const enabled = Vault.isEnabled(), unlocked = Vault.isUnlocked();
    const badge = document.getElementById('vaultState');
    const setup = document.getElementById('vaultSetup');
    const manage = document.getElementById('vaultManage');
    if (!badge) return;

    badge.textContent = !enabled ? 'off' : unlocked ? 'unlocked' : 'locked';
    badge.className = 'pill' + (enabled ? '' : ' red');
    if (setup) setup.style.display = enabled ? 'none' : '';
    if (manage) manage.style.display = enabled ? '' : 'none';

    const lockEl = document.getElementById('lockScreen');
    if (lockEl) lockEl.classList.toggle('on', enabled && !unlocked);
  }

  async function enableVault() {
    const a = document.getElementById('vaultPass').value;
    const b = document.getElementById('vaultPass2').value;
    if (a !== b) return alert('The two passphrases do not match.');
    if (!confirm(
      'Encrypt all Zero data on this device?\n\n' +
      'Your passphrase is never stored, so it cannot be reset or recovered. ' +
      'If you forget it, your tasks and notes are permanently unreadable.\n\n' +
      'Continue?')) return;
    try {
      await Vault.enable(a);
      await persist();                       // write the current data back, encrypted
      // persist() clears localStorage; confirm before telling the user it worked.
      const leaked = PLAINTEXT_KEYS.filter(k => localStorage.getItem(k) !== null);
      if (leaked.length) throw new Error('Could not remove the unencrypted copy of: ' + leaked.join(', '));
      document.getElementById('vaultPass').value = '';
      document.getElementById('vaultPass2').value = '';
      log('Vault enabled — stored data is now encrypted.');
      vaultUi();
      alert('Vault on. Your data is encrypted on this device.');
    } catch (e) { alert(e.message); }
  }

  async function unlockVault() {
    const el = document.getElementById('lockPass');
    const err = document.getElementById('lockErr');
    err.textContent = '';
    try {
      if (!await Vault.unlock(el.value)) { err.textContent = 'Wrong passphrase.'; el.select(); return; }
    } catch (e) { err.textContent = e.message; return; }

    el.value = '';
    try {
      const t = await Store.get(LS.tasks), n = await Store.get(LS.notes), m = await Store.get(LS.memories);
      tasks = t ? JSON.parse(await Vault.decrypt(t)) : [];
      notes = n ? JSON.parse(await Vault.decrypt(n)) : [];
      memories = m ? JSON.parse(await Vault.decrypt(m)) : [];
    } catch (e) {
      err.textContent = 'Unlocked, but stored data could not be read: ' + e.message;
      tasks = []; notes = []; memories = [];
    }
    renderTasks(); renderNotes(); renderMemories(); updateStatus();
    log('Vault unlocked.');
    vaultUi();
  }

  function lockVault() {
    Vault.lock();
    tasks = []; notes = []; memories = [];   // drop plaintext from memory too
    chatHistory = [];
    renderTasks(); renderNotes(); renderMemories(); updateStatus();
    log('Vault locked.');
    vaultUi();
  }

  async function disableVault() {
    if (!Vault.isUnlocked()) return alert('Unlock the vault first.');
    if (!confirm('Turn encryption OFF?\n\nTasks and notes will be written back as readable text on this device.')) return;
    Vault.disable();
    await persistPlain();
    log('Vault disabled — data is stored unencrypted.', true);
    vaultUi();
  }

  function exportData() {
    const blob = new Blob([JSON.stringify({ tasks, notes, memories, apps }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'zero-data.json';
    a.click();
  }
  function wipeData() {
    if (!confirm('Wipe ALL Zero data on this device? This cannot be undone.')) return;
    Object.values(LS).forEach(k => localStorage.removeItem(k));
    Vault.disable();                       // also clears the salt and check token
    tasks = []; notes = []; chatHistory = [];
    renderTasks(); renderNotes(); refreshAiStatus(); vaultUi();
    alert('All local data wiped.');
  }

  /* ---------------- Helpers ---------------- */
  /* Views come and go; a missing element is not an error. */
  function setText(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }

  function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  /* ---------------- Init ---------------- */
  function init() {
    document.getElementById('nav').addEventListener('click', e => {
      const li = e.target.closest('li'); if (li) nav(li.dataset.view);
    });
    const cfg = engineCfg();
    document.getElementById('engineUrl').value = cfg.url;
    document.getElementById('engineModel').value = cfg.model;
    document.getElementById('engineMode').value = cfg.mode;
    document.getElementById('stockKey').value = store.raw(LS.stockKey);
    document.getElementById('stockSymbols').value = store.raw(LS.stockSymbols);
    document.getElementById('lockPass')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') unlockVault();
    });

    const speakEl = document.getElementById('speakToggle');
    if (speakEl) { speakEl.checked = store.raw(LS.speak) === '1'; speakReplies = speakEl.checked; }
    if (store.raw(LS.voice)) Voice.setVoice(store.raw(LS.voice));
    populateVoices();
    // Chrome loads its voice catalogue asynchronously; refill when it lands.
    if (Voice.canSpeak()) window.speechSynthesis.addEventListener('voiceschanged', populateVoices);
    if (!Voice.canSpeak()) document.getElementById('speakOpt')?.style.setProperty('display', 'none');
    if (!Voice.canHear()) document.getElementById('micBtn')?.style.setProperty('display', 'none');
    const thinkEl = document.getElementById('thinkToggle');
    if (thinkEl) thinkEl.checked = engineCfg().think;
    vaultUi();

    // Keyboard kill switch: Esc twice, or Ctrl/Cmd + . — works from anywhere.
    let lastEsc = 0;
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        const now = Date.now();
        if (now - lastEsc < 600) { toggleHalt(); lastEsc = 0; } else { lastEsc = now; }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '.') { e.preventDefault(); toggleHalt(); }
    });

    tick(); setInterval(tick, 1000);
    renderTasks(); renderNotes(); renderMemories(); renderApps(); renderPresets(); refreshAiStatus(); updateStatus();
    // Move any records left behind by the localStorage era.
    Store.migrate([LS.tasks, LS.notes, LS.memories, LS.apps])
      .then(n => { if (n) log(`Moved ${n} record(s) into the larger local database.`); })
      .catch(e => log('Storage upgrade unavailable: ' + e.message, true));
    storageInfo();
    if (typeof Orb !== 'undefined') { Orb.attach(document.getElementById('orb')); Orb.set('idle'); }
    if (typeof Boot !== 'undefined') Boot.run(document.getElementById('boot'));
    setInterval(() => { if (document.getElementById('view-overview')?.classList.contains('active')) renderOverview(); }, 30000);
    log('Zero started. All capabilities on. Press STOP anytime.');
    loadMarkets(); loadStocks(); startTimers();
    bubble(Converse.reply('hello', {
      tasks: tasks.filter(t => !t.done).length, memories: memories.length,
      hasEngine: !!store.raw(LS.engineModel), name: userName(),
    }) + "\n\nAsk me anything — I look things up live. Type `help` for the full list.", 'zero');
  }

  return {
    nav, loadMarkets, addTask, toggleTask, delTask, addNote, delNote,
    send, saveEngine, testEngine, saveStockKey, setThink, updateNow, loadStocks,
    loadRates, loadNews, setNewsMode, setSpeak, setVoice, previewVoice, micToggle, stopSpeaking: () => Voice.stop(),
    toggleWake, renderOverview, checkPassword, cryptoTool, showPayloads, copyText, reconDomain,
    openAFile, saveBack, saveNew, connectFolder, listFolder, openFromFolder, disconnectFolder,
    addApp, removeApp, launchApp, forgetMemory, storageInfo, addPreset,
    openTradingView, allowTradingView, tvSearch, dailyBriefing,
    exportData, wipeData, init,
    toggleHalt, killNetwork, panic, setCap, clearLog,
    enableVault, unlockVault, lockVault, disableVault,
  };
})();

document.addEventListener('DOMContentLoaded', Zero.init);
