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
    micOk: 'zero.micOk',
    speak: 'zero.speak',
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
    news:      ['News', 'What is happening right now.'],
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
  async function loadNews(alsoSay) {
    const box = document.getElementById('newsList');
    if (box) box.innerHTML = '<div class="spinner">Loading stories</div>';
    try {
      const r = await guardedFetch('https://hacker-news.firebaseio.com/v0/topstories.json', {}, 'market');
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const ids = (await r.json()).slice(0, 12);
      const items = [];
      for (const id of ids) {
        try {
          const ir = await guardedFetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, {}, 'market');
          const it = await ir.json();
          if (it?.title) items.push(it);
        } catch { /* one dud story shouldn't sink the feed */ }
      }
      if (!items.length) throw new Error('no stories returned');
      if (box) {
        box.innerHTML = items.map(it => {
          const host = it.url ? (() => { try { return new URL(it.url).hostname.replace(/^www\./, ''); } catch { return ''; } })() : '';
          const when = it.time ? new Date(it.time * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
          return `<div class="news-item">
            <a href="${esc(it.url || 'https://news.ycombinator.com/item?id=' + it.id)}" target="_blank" rel="noopener noreferrer">${esc(it.title)}</a>
            <div class="news-meta">${esc(host)}${host && when ? ' · ' : ''}${esc(when)} · ${it.score ?? 0} points</div>
          </div>`;
        }).join('');
      }
      setText('newsUpdated', 'Live · updated ' + new Date().toLocaleTimeString());
      if (alsoSay) {
        const top = items.slice(0, 5).map((it, i) => `${i + 1}. ${it.title}`).join('\n');
        bubble('Top stories right now:\n\n' + top, 'zero');
      }
      return items;
    } catch (e) {
      if (box) box.innerHTML = `<div class="spinner">No live news (${esc(e.message)}).</div>`;
      if (alsoSay) bubble('Could not reach the news feed: ' + e.message, 'zero');
      return [];
    }
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
    if (who === 'zero' && speakReplies && text && text !== '…') Voice.speak(text);
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
    if (handled === HANDLED) return;                 // already answered itself
    if (handled !== null) { bubble(handled, 'zero'); return; }

    // Otherwise hand it to the local engine, streaming the reply in.
    const thinking = bubble('…', 'zero');
    try {
      const reply = await callEngine(q, partial => renderReply(thinking, partial, false));
      renderReply(thinking, reply, true);
      if (speakReplies) Voice.speak(splitThinking(reply).answer || reply);
      chatHistory.push({ role: 'user', content: q }, { role: 'assistant', content: reply });
      if (chatHistory.length > 16) chatHistory = chatHistory.slice(-16);
    } catch (e) {
      thinking.textContent = '⚠ ' + e.message;
    }
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
    const system = CORE_PROMPT + (think ? THINK_PROMPT : '');
    const messages = [{ role: 'system', content: system }, ...chatHistory.slice(-8), { role: 'user', content: q }];

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
  function setSpeak(on) { store.rawSet(LS.speak, on ? '1' : ''); toggleSpeak(on); }

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
      document.getElementById('vaultPass').value = '';
      document.getElementById('vaultPass2').value = '';
      log('Vault enabled — stored data is now encrypted.');
      const speakEl = document.getElementById('speakToggle');
    if (speakEl) { speakEl.checked = store.raw(LS.speak) === '1'; speakReplies = speakEl.checked; }
    if (!Voice.canSpeak()) document.getElementById('speakOpt')?.style.setProperty('display', 'none');
    if (!Voice.canHear()) document.getElementById('micBtn')?.style.setProperty('display', 'none');
    const thinkEl = document.getElementById('thinkToggle');
    if (thinkEl) thinkEl.checked = engineCfg().think;
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
    loadMarkets(); loadStocks(); startTimers();
    bubble("I'm Zero, running on your machine. Type `help` for what I do without any model at all, " +
           "or point me at a local engine in Settings to talk properly. Nothing you type here leaves this device.", 'zero');
  }

  return {
    nav, loadMarkets, addTask, toggleTask, delTask, addNote, delNote,
    send, saveEngine, testEngine, saveStockKey, setThink, updateNow, loadStocks,
    loadRates, loadNews, setSpeak, micToggle, stopSpeaking: () => Voice.stop(),
    exportData, wipeData, init,
    toggleHalt, killNetwork, panic, setCap, clearLog,
    enableVault, unlockVault, lockVault, disableVault,
  };
})();

document.addEventListener('DOMContentLoaded', Zero.init);
