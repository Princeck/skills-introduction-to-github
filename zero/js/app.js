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
    aiKey: 'zero.aiKey',
    aiProvider: 'zero.aiProvider',
    stockKey: 'zero.stockKey',
  };

  const store = {
    get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
    set(k, v) {
      // Storage writes respect the Control Panel switch.
      if (typeof Control !== 'undefined' && !Control.caps.storage) return;
      localStorage.setItem(k, JSON.stringify(v));
    },
    raw(k) { return localStorage.getItem(k) || ''; },
    rawSet(k, v) { localStorage.setItem(k, v); },
  };

  let tasks = store.get(LS.tasks, []);
  let notes = store.get(LS.notes, []);

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
    if (!confirm('PANIC: stop everything and delete all stored API keys?\n\nYour tasks and notes are kept.')) return;
    if (!Control.halted) toggleHalt();
    [LS.aiKey, LS.stockKey].forEach(k => localStorage.removeItem(k));
    const ak = document.getElementById('aiKey'); if (ak) ak.value = '';
    const sk = document.getElementById('stockKey'); if (sk) sk.value = '';
    refreshAiStatus();
    log('PANIC — halted and all API keys wiped.', true);
    alert('Zero halted. All API keys deleted from this device.');
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

    // Otherwise, use the AI provider if a key is configured.
    const key = store.raw(LS.aiKey);
    if (!key) {
      bubble("I don't have an AI key yet, so I'm running in offline mode. " +
             "Type `help` to see what I can do right now, or add a key in Settings to unlock full conversation.", 'zero');
      return;
    }
    const thinking = bubble('…', 'zero');
    try {
      const reply = await callAI(q);
      thinking.textContent = reply;
    } catch (e) {
      thinking.textContent = '⚠ AI request failed: ' + e.message;
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

  async function callAI(q) {
    const provider = store.raw(LS.aiProvider) || 'anthropic';
    const key = store.raw(LS.aiKey);
    const sys = "You are Zero, a concise, capable personal assistant. The user builds websites and games. Be direct and useful. When asked about trading, give information and analysis but always note it is not financial advice.";
    if (provider === 'anthropic') {
      const r = await guardedFetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-5',
          max_tokens: 1024,
          system: sys,
          messages: [{ role: 'user', content: q }],
        }),
      }, 'ai');
      const d = await r.json();
      if (d.error) throw new Error(d.error.message);
      return d.content?.map(c => c.text).join('') || '(no reply)';
    } else {
      const r = await guardedFetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'authorization': 'Bearer ' + key },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'system', content: sys }, { role: 'user', content: q }],
        }),
      }, 'ai');
      const d = await r.json();
      if (d.error) throw new Error(d.error.message);
      return d.choices?.[0]?.message?.content || '(no reply)';
    }
  }

  /* ---------------- Settings ---------------- */
  function saveAiKey() {
    store.rawSet(LS.aiKey, document.getElementById('aiKey').value.trim());
    store.rawSet(LS.aiProvider, document.getElementById('aiProvider').value);
    refreshAiStatus();
    alert('AI key saved locally.');
  }
  function clearAiKey() { localStorage.removeItem(LS.aiKey); document.getElementById('aiKey').value = ''; refreshAiStatus(); }
  function saveStockKey() { store.rawSet(LS.stockKey, document.getElementById('stockKey').value.trim()); alert('Market key saved locally.'); }

  function refreshAiStatus() {
    const on = !!store.raw(LS.aiKey);
    const el = document.getElementById('aiStatus');
    el.textContent = on ? 'online' : 'offline';
    el.className = 'pill' + (on ? '' : ' red');
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
    tasks = []; notes = [];
    renderTasks(); renderNotes(); refreshAiStatus();
    alert('All local data wiped.');
  }

  /* ---------------- Helpers ---------------- */
  function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  /* ---------------- Init ---------------- */
  function init() {
    document.getElementById('nav').addEventListener('click', e => {
      const li = e.target.closest('li'); if (li) nav(li.dataset.view);
    });
    document.getElementById('aiProvider').value = store.raw(LS.aiProvider) || 'anthropic';

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
    bubble("I'm Zero. Type `help` to see what I can do offline, or add an AI key in Settings for full conversation.", 'zero');
  }

  return {
    nav, loadMarkets, addTask, toggleTask, delTask, addNote, delNote,
    captureAsTask, captureAsNote, send, saveAiKey, clearAiKey, saveStockKey,
    exportData, wipeData, init,
    toggleHalt, killNetwork, panic, setCap, clearLog,
  };
})();

document.addEventListener('DOMContentLoaded', Zero.init);
