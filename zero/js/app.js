/* ============================================================
   ZERO — app logic
   Private by design: all state lives in localStorage on THIS
   device. No server, no analytics, no accounts. Your keys are
   only ever sent to the AI/market provider you explicitly pick.
   ============================================================ */

const Zero = (() => {
  const LS = {
    tasks: 'zero.tasks',
    notes: 'zero.notes',
    engineUrl: 'zero.engineUrl',
    engineModel: 'zero.engineModel',
    engineMode: 'zero.engineMode',
    stockKey: 'zero.stockKey',
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
    },
    raw(k) { return localStorage.getItem(k) || ''; },
    rawSet(k, v) { localStorage.setItem(k, v); },
  };

  // Vault-off: read straight from localStorage. Vault-on: these stay
  // empty until unlock() decrypts them, so a locked Zero holds nothing.
  let tasks = Vault.isEnabled() ? [] : store.get(LS.tasks, []);
  let notes = Vault.isEnabled() ? [] : store.get(LS.notes, []);

  /* Encrypt the in-memory model and write it. Fire-and-forget: callers
     stay synchronous, and a locked vault simply declines to write. */
  async function persist() {
    if (!Vault.isEnabled() || !Vault.isUnlocked()) return;
    if (!Control.caps.storage) return;
    try {
      localStorage.setItem(LS.tasks, await Vault.encrypt(JSON.stringify(tasks)));
      localStorage.setItem(LS.notes, await Vault.encrypt(JSON.stringify(notes)));
    } catch (e) {
      log('Could not save: ' + e.message, true);
    }
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
    led('ledAi', (!Control.halted && Control.caps.ai && store.raw(LS.aiKey)) ? 'on' : 'off');
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
    dashboard: ['Dashboard', 'Your day at a glance.'],
    markets:   ['Markets', 'Live readings — information, not advice.'],
    assistant: ['Assistant', 'Ask Zero anything.'],
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
    if (view === 'markets') loadMarkets();
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

  async function loadMarkets() {
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
        const chg = p.usd_24h_change ?? 0;
        const cls = chg >= 0 ? 'up' : 'down';
        const arrow = chg >= 0 ? '▲' : '▼';
        return `<div class="mkt-row">
          <div class="sym">${sym}<small>${name}</small></div>
          <div>$${fmt(p.usd)}</div>
          <div class="${cls}">${arrow} ${Math.abs(chg).toFixed(2)}%</div>
        </div>`;
      }).join('');
      if (table) table.innerHTML = rows;
      if (mini) mini.innerHTML = `<div class="mkt-row mkt-head"><div>Asset</div><div>Price</div><div>24h</div></div>` + rows;
      document.getElementById('marketUpdated').textContent =
        'Updated ' + new Date().toLocaleTimeString();
      const btc = data.bitcoin?.usd;
      if (btc) document.getElementById('statBtc').textContent = '$' + fmt(btc);
    } catch (e) {
      const msg = `<div class="spinner">⚠ Couldn't reach live market feed (${e.message}). Check your connection and hit refresh.</div>`;
      if (table) table.innerHTML = msg;
      if (mini) mini.innerHTML = msg;
    }
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
    document.getElementById('statTasks').textContent = tasks.filter(t => !t.done).length;
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
    document.getElementById('statNotes').textContent = notes.length;
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
  function captureAsTask() {
    const el = document.getElementById('quickCapture');
    if (el.value.trim()) { addTask(el.value.trim()); el.value = ''; nav('tasks'); }
  }
  function captureAsNote() {
    const el = document.getElementById('quickCapture');
    if (el.value.trim()) { addNote(el.value.trim()); el.value = ''; nav('notes'); }
  }

  /* ---------------- Assistant ---------------- */
  function bubble(text, who) {
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
    const handled = offlineCommand(q);
    if (handled !== null) { bubble(handled, 'zero'); return; }

    // Otherwise hand it to the local engine, streaming the reply in.
    const thinking = bubble('…', 'zero');
    try {
      const reply = await callEngine(q, partial => { thinking.textContent = partial; });
      thinking.textContent = reply;
      chatHistory.push({ role: 'user', content: q }, { role: 'assistant', content: reply });
      if (chatHistory.length > 16) chatHistory = chatHistory.slice(-16);
    } catch (e) {
      thinking.textContent = '⚠ ' + e.message;
    }
  }

  function offlineCommand(q) {
    const s = q.trim();
    const low = s.toLowerCase();
    if (low === 'help') {
      return [
        'Zero offline commands:',
        '• help            — this list',
        '• task <text>     — add a task',
        '• note <text>     — save a note',
        '• tasks           — list open tasks',
        '• price btc|eth|sol — live crypto price',
        '• time            — current time',
        '',
        'Add an AI key in Settings for full conversation.'
      ].join('\n');
    }
    if (low === 'time') return new Date().toLocaleString();
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
     LOCAL ENGINE

     Zero talks to a model running on this machine — Ollama,
     llama.cpp, LM Studio, Jan. There is no hosted provider and no
     API key: the request goes to localhost and the prompt never
     leaves the device.

     "OpenAI-compatible" below names a request *format* that local
     servers implement. Nothing is sent to OpenAI; the URL is
     whatever local address you point Zero at.
     ============================================================ */
  const SYSTEM_PROMPT =
    "You are Zero, a private personal assistant running locally on the user's own machine. " +
    "The user builds websites and games. Be direct, concrete and brief. " +
    "For market or trading questions, give information and analysis, and note that it is not financial advice.";

  const engineCfg = () => ({
    url: (store.raw(LS.engineUrl) || 'http://localhost:11434').replace(/\/+$/, ''),
    model: store.raw(LS.engineModel) || 'llama3.2',
    mode: store.raw(LS.engineMode) || 'ollama',
  });

  async function callEngine(q, onToken) {
    const { url, model, mode } = engineCfg();
    const history = chatHistory.slice(-8);

    const [endpoint, body, pluck] = mode === 'openai'
      ? [url + '/v1/chat/completions',
         { model, stream: true, messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...history, { role: 'user', content: q }] },
         d => d.choices?.[0]?.delta?.content]
      : [url + '/api/chat',
         { model, stream: true, messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...history, { role: 'user', content: q }] },
         d => d.message?.content];

    let r;
    try {
      r = await guardedFetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      }, 'ai');
    } catch (e) {
      // A blocked request carries its own explanation; a dead socket does not.
      if (/halted|switched off/i.test(e.message)) throw e;
      throw new Error(`Can't reach the engine at ${url}. Is it running? (${e.message})`);
    }

    if (!r.ok) {
      const detail = await r.text().catch(() => '');
      if (r.status === 404) throw new Error(`Engine reached, but model "${model}" was not found. Pull it first, or change the model name in Settings.`);
      throw new Error(`Engine returned ${r.status}. ${detail.slice(0, 180)}`);
    }

    // Local models are slow enough that streaming is the difference
    // between "thinking" and "frozen".
    let full = '';
    const reader = r.body?.getReader();
    if (!reader) { full = await r.text(); onToken?.(full); return full; }

    const take = line => {
      line = line.trim();
      if (!line) return;
      if (line.startsWith('data:')) line = line.slice(5).trim();     // SSE framing
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
      buf = lines.pop() || '';                 // last item may be a partial line
      lines.forEach(take);
    }
    // A stream that ends without a trailing newline leaves its final —
    // and often longest — chunk sitting in the buffer. Flush it.
    take(buf);
    return full || '(the engine returned nothing)';
  }

  async function testEngine() {
    const out = document.getElementById('engineStatus');
    const { url, model, mode } = engineCfg();
    out.textContent = 'Checking ' + url + ' …';
    out.className = 'hint';
    try {
      const r = await guardedFetch(mode === 'openai' ? url + '/v1/models' : url + '/api/tags', {}, 'ai');
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const d = await r.json();
      const names = (d.models || d.data || []).map(m => m.name || m.id).filter(Boolean);
      const has = names.some(n => n === model || n.startsWith(model + ':'));
      out.innerHTML = names.length
        ? `<b style="color:var(--green)">Connected.</b> ${names.length} model(s) available.` +
          (has ? ` "${esc(model)}" is ready.` : ` <span style="color:var(--red)">"${esc(model)}" not among them:</span> ${esc(names.slice(0, 6).join(', '))}`)
        : `<b style="color:var(--green)">Connected</b>, but no models are installed yet.`;
      refreshAiStatus();
    } catch (e) {
      out.innerHTML = `<b style="color:var(--red)">No engine at ${esc(url)}.</b> ${esc(e.message)}<br>` +
        `Start one, then try again. With Ollama: <code>ollama serve</code>, then <code>ollama pull ${esc(model)}</code>.`;
    }
  }

  /* ---------------- Settings ---------------- */
  function saveEngine() {
    store.rawSet(LS.engineUrl, document.getElementById('engineUrl').value.trim());
    store.rawSet(LS.engineModel, document.getElementById('engineModel').value.trim());
    store.rawSet(LS.engineMode, document.getElementById('engineMode').value);
    refreshAiStatus();
    testEngine();
  }
  function saveStockKey() { store.rawSet(LS.stockKey, document.getElementById('stockKey').value.trim()); alert('Market key saved locally.'); }

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
      const t = localStorage.getItem(LS.tasks), n = localStorage.getItem(LS.notes);
      tasks = t ? JSON.parse(await Vault.decrypt(t)) : [];
      notes = n ? JSON.parse(await Vault.decrypt(n)) : [];
    } catch (e) {
      err.textContent = 'Unlocked, but stored data could not be read: ' + e.message;
      tasks = []; notes = [];
    }
    renderTasks(); renderNotes(); updateStatus();
    log('Vault unlocked.');
    vaultUi();
  }

  function lockVault() {
    Vault.lock();
    tasks = []; notes = [];               // drop plaintext from memory too
    chatHistory = [];
    renderTasks(); renderNotes(); updateStatus();
    log('Vault locked.');
    vaultUi();
  }

  async function disableVault() {
    if (!Vault.isUnlocked()) return alert('Unlock the vault first.');
    if (!confirm('Turn encryption OFF?\n\nTasks and notes will be written back as readable text on this device.')) return;
    Vault.disable();
    localStorage.setItem(LS.tasks, JSON.stringify(tasks));
    localStorage.setItem(LS.notes, JSON.stringify(notes));
    log('Vault disabled — data is stored unencrypted.', true);
    vaultUi();
  }

  function exportData() {
    const blob = new Blob([JSON.stringify({ tasks, notes }, null, 2)], { type: 'application/json' });
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
    document.getElementById('lockPass')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') unlockVault();
    });
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
    renderTasks(); renderNotes(); refreshAiStatus(); updateStatus();
    log('Zero started. All capabilities on. Press STOP anytime.');
    loadMarkets(); startTimers();
    bubble("I'm Zero, running on your machine. Type `help` for what I do without any model at all, " +
           "or point me at a local engine in Settings to talk properly. Nothing you type here leaves this device.", 'zero');
  }

  return {
    nav, loadMarkets, addTask, toggleTask, delTask, addNote, delNote,
    captureAsTask, captureAsNote, send, saveEngine, testEngine, saveStockKey,
    exportData, wipeData, init,
    toggleHalt, killNetwork, panic, setCap, clearLog,
    enableVault, unlockVault, lockVault, disableVault,
  };
})();

document.addEventListener('DOMContentLoaded', Zero.init);
