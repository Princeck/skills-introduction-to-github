/* ============================================================
   ZERO — ABILITIES
   Everything here works with no AI model, no key and no setup.
   This is the part of Zero that is simply always on.
   ============================================================ */

/* ------------------------------------------------------------
   VOICE

   Speaking is done by the browser's own speech engine: fully
   offline, nothing transmitted.

   Listening is NOT equivalent. Chrome's dictation uploads your
   audio to Google to transcribe it. Zero therefore treats the
   microphone as a network capability: it is off until you turn
   it on, it warns you the first time, and the Control Panel's
   network switch cuts it like anything else.
   ------------------------------------------------------------ */
const Voice = (() => {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recog = null, listening = false, voice = null, chosenName = null;

  const canSpeak = () => 'speechSynthesis' in window;
  const canHear = () => !!SR;

  /* ---- Voice character ----
     Zero's delivery: measured, a touch below neutral pitch, a hair
     slower than default. Calm and deliberate rather than chirpy — the
     cadence is as much of the identity as the voice itself, and it is
     the part that carries across every machine regardless of which
     voices happen to be installed. */
  const PROSODY = { rate: 0.96, pitch: 0.88 };

  /* Curated shortlist, best first. These are the higher-fidelity or
     more characterful voices that ship with common systems; the browser
     installs decide which actually exist, so this only ranks — it never
     assumes. Neural/"Online"/"Premium"/"Enhanced" voices sound markedly
     better than the default robotic fallback, so they win. */
  const PREFERRED = [
    'Google UK English Male', 'Microsoft Guy Online', 'Microsoft Ryan Online',
    'Daniel', 'Arthur', 'Oliver', 'Microsoft George',
    'Google US English', 'Alex', 'Microsoft David',
    'Rishi', 'Microsoft Mark',
  ];
  const NICE_HINT = /(neural|online|natural|premium|enhanced|siri|eloquence)/i;

  function score(v) {
    let s = 0;
    const idx = PREFERRED.findIndex(n => v.name === n || v.name.startsWith(n));
    if (idx >= 0) s += 1000 - idx * 10;         // exact curated rank
    if (NICE_HINT.test(v.name)) s += 400;        // premium engine markers
    if (/^en[-_]?GB/i.test(v.lang)) s += 60;     // a British cadence reads as composed
    else if (/^en[-_]/i.test(v.lang)) s += 40;
    if (v.localService) s += 20;                 // on-device keeps speech offline
    if (/\b(male|guy|david|george|mark|daniel|arthur|oliver|alex)\b/i.test(v.name)) s += 15;
    return s;
  }

  function catalogue() {
    if (!canSpeak()) return [];
    return speechSynthesis.getVoices().filter(v => /^en[-_]/i.test(v.lang) || !/[-_]/.test(v.lang));
  }

  function pickVoice() {
    const all = speechSynthesis.getVoices();
    if (!all.length) return null;
    if (chosenName) { const c = all.find(v => v.name === chosenName); if (c) return c; }
    const en = all.filter(v => /^en[-_]/i.test(v.lang));
    const pool = en.length ? en : all;
    return pool.slice().sort((a, b) => score(b) - score(a))[0];
  }
  if (canSpeak()) {
    speechSynthesis.onvoiceschanged = () => { voice = pickVoice(); };
    voice = pickVoice();
  }

  function setVoice(name) { chosenName = name || null; voice = pickVoice(); }
  function currentVoiceName() { return (voice || pickVoice())?.name || null; }
  function listVoices() { return catalogue().map(v => ({ name: v.name, lang: v.lang, local: v.localService })); }

  function speak(text, opts = {}) {
    if (!canSpeak() || !text) return false;
    speechSynthesis.cancel();
    // Strip markup and code fences — reading punctuation aloud is noise.
    const clean = String(text)
      .replace(/```[\s\S]*?```/g, ' (code block) ')
      .replace(/[*_`#>|]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (!clean) return false;
    const u = new SpeechSynthesisUtterance(clean.slice(0, 600));
    if (!voice) voice = pickVoice();
    if (voice) u.voice = voice;
    u.rate = opts.rate ?? PROSODY.rate;
    u.pitch = opts.pitch ?? PROSODY.pitch;
    u.onend = opts.onend || null;
    speechSynthesis.speak(u);
    return true;
  }

  function stop() { if (canSpeak()) speechSynthesis.cancel(); }

  /* onResult(text, isFinal) fires as you speak. */
  function listen(onResult, onState, onError) {
    if (!canHear()) { onError?.('This browser has no speech recognition.'); return false; }
    if (listening) { stopListening(); return false; }

    recog = new SR();
    recog.continuous = false;
    recog.interimResults = true;
    recog.lang = navigator.language || 'en-US';

    recog.onstart = () => { listening = true; onState?.(true); };
    recog.onend = () => { listening = false; onState?.(false); };
    recog.onerror = e => {
      listening = false; onState?.(false);
      onError?.(e.error === 'not-allowed'
        ? 'Microphone permission was refused.'
        : 'Could not hear anything (' + e.error + ').');
    };
    recog.onresult = ev => {
      let text = '', done = false;
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        text += ev.results[i][0].transcript;
        if (ev.results[i].isFinal) done = true;
      }
      onResult?.(text.trim(), done);
    };
    try { recog.start(); } catch { /* already running */ }
    return true;
  }

  /* Always-on wake-word loop.

     This is a real escalation and is named as such: continuous
     recognition streams audio to the browser's speech service the whole
     time it is armed, not just while you are talking to Zero. It exists
     because it was asked for; it is off by default, announces itself,
     and stops the moment anything asks it to. */
  let awake = false, wakeRestart = null;

  function startWake(word, onWake, onHeard, onState, onError) {
    if (!canHear()) { onError?.('This browser has no speech recognition.'); return false; }
    awake = true;
    const spin = () => {
      if (!awake) return;
      const r = new SR();
      recog = r;
      r.continuous = true;
      r.interimResults = true;
      r.lang = navigator.language || 'en-US';
      r.onstart = () => onState?.('armed');
      r.onerror = e => {
        if (e.error === 'not-allowed') { awake = false; onState?.('off'); onError?.('Microphone permission was refused.'); }
      };
      r.onend = () => {
        // Browsers cut long sessions; re-arm unless we were told to stop.
        if (awake) { clearTimeout(wakeRestart); wakeRestart = setTimeout(spin, 350); }
        else onState?.('off');
      };
      r.onresult = ev => {
        let text = '', final = false;
        for (let i = ev.resultIndex; i < ev.results.length; i++) {
          text += ev.results[i][0].transcript;
          if (ev.results[i].isFinal) final = true;
        }
        text = text.trim();
        if (!text) return;
        onHeard?.(text);
        const low = text.toLowerCase();
        const at = low.lastIndexOf(word.toLowerCase());
        if (at >= 0 && final) {
          const after = text.slice(at + word.length).replace(/^[\s,.:;!?-]+/, '').trim();
          if (after) onWake?.(after);
        }
      };
      try { r.start(); } catch { /* a spin already in flight */ }
    };
    spin();
    return true;
  }

  function stopWake() {
    awake = false;
    clearTimeout(wakeRestart);
    try { recog?.stop(); } catch {}
  }
  const isAwake = () => awake;

  function stopListening() { try { recog?.stop(); } catch {} listening = false; }
  const isListening = () => listening;

  return { canSpeak, canHear, speak, stop, listen, stopListening, isListening, startWake, stopWake, isAwake,
           setVoice, currentVoiceName, listVoices };
})();


/* ------------------------------------------------------------
   SKILLS — what Zero can do on its own

   Each skill takes the raw text and returns a string, a promise
   of a string, or null if it does not apply. No model involved.
   ------------------------------------------------------------ */
const Skills = (() => {

  /* ---- Safe arithmetic ----------------------------------------
     A hand-written parser, not eval(): user text should never be
     executed as code, and eval on a page holding your data is the
     kind of shortcut that turns a typo into an exploit. */
  function calc(src) {
    let i = 0;
    const s = src.replace(/\s+/g, '').replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
    const CONST = { pi: Math.PI, e: Math.E };
    const FN = {
      sqrt: Math.sqrt, abs: Math.abs, round: Math.round, floor: Math.floor,
      ceil: Math.ceil, sin: Math.sin, cos: Math.cos, tan: Math.tan,
      log: Math.log10, ln: Math.log, exp: Math.exp,
    };

    const peek = () => s[i];
    const eat = c => { if (s[i] === c) { i++; return true; } return false; };

    function expr() {                       // + and -
      let v = term();
      for (;;) {
        if (eat('+')) v += term();
        else if (eat('-')) v -= term();
        else return v;
      }
    }
    function term() {                       // * / %
      let v = power();
      for (;;) {
        if (eat('*')) v *= power();
        else if (eat('/')) { const d = power(); if (d === 0) throw new Error('division by zero'); v /= d; }
        else if (eat('%')) { const d = power(); if (d === 0) throw new Error('division by zero'); v %= d; }
        else return v;
      }
    }
    function power() {                      // ^ (right-associative)
      const base = unary();
      if (eat('^')) return Math.pow(base, power());
      return base;
    }
    function unary() {
      if (eat('-')) return -unary();
      if (eat('+')) return unary();
      return atom();
    }
    function atom() {
      if (eat('(')) {
        const v = expr();
        if (!eat(')')) throw new Error('missing )');
        return v;
      }
      const word = /^[a-z]+/i.exec(s.slice(i))?.[0];
      if (word) {
        i += word.length;
        const k = word.toLowerCase();
        if (k in CONST) return CONST[k];
        if (k in FN) {
          if (!eat('(')) throw new Error(`${k} needs ( )`);
          const a = expr();
          if (!eat(')')) throw new Error('missing )');
          return FN[k](a);
        }
        throw new Error(`don't know "${word}"`);
      }
      const num = /^\d+(\.\d+)?/.exec(s.slice(i))?.[0];
      if (!num) throw new Error('expected a number at "' + (peek() || 'end') + '"');
      i += num.length;
      return parseFloat(num);
    }

    const val = expr();
    if (i < s.length) throw new Error('unexpected "' + s[i] + '"');
    if (!isFinite(val)) throw new Error('result is not a finite number');
    return val;
  }

  /* ---- Unit conversion ---- */
  const UNITS = {
    // length (metres)
    mm: ['length', .001], cm: ['length', .01], m: ['length', 1], km: ['length', 1000],
    in: ['length', .0254], inch: ['length', .0254], ft: ['length', .3048],
    foot: ['length', .3048], feet: ['length', .3048], yd: ['length', .9144],
    mi: ['length', 1609.344], mile: ['length', 1609.344], miles: ['length', 1609.344],
    // mass (grams)
    mg: ['mass', .001], g: ['mass', 1], kg: ['mass', 1000], t: ['mass', 1e6],
    oz: ['mass', 28.349523125], lb: ['mass', 453.59237], lbs: ['mass', 453.59237],
    // data (bytes)
    b: ['data', 1], kb: ['data', 1024], mb: ['data', 1024 ** 2],
    gb: ['data', 1024 ** 3], tb: ['data', 1024 ** 4],
    // time (seconds)
    ms: ['time', .001], s: ['time', 1], sec: ['time', 1], min: ['time', 60],
    h: ['time', 3600], hr: ['time', 3600], day: ['time', 86400],
    days: ['time', 86400], week: ['time', 604800], year: ['time', 31557600],
  };
  const TEMP = ['c', 'f', 'k', 'celsius', 'fahrenheit', 'kelvin'];

  function convert(n, from, to) {
    from = from.toLowerCase(); to = to.toLowerCase();
    if (TEMP.includes(from) && TEMP.includes(to)) {
      const f = from[0], t = to[0];
      const c = f === 'c' ? n : f === 'f' ? (n - 32) * 5 / 9 : n - 273.15;
      const out = t === 'c' ? c : t === 'f' ? c * 9 / 5 + 32 : c + 273.15;
      return { value: out, unit: to };
    }
    const a = UNITS[from], b = UNITS[to];
    if (!a || !b) throw new Error(`I don't know "${!a ? from : to}".`);
    if (a[0] !== b[0]) throw new Error(`${from} is ${a[0]}, ${to} is ${b[0]} — those don't convert.`);
    return { value: n * a[1] / b[1], unit: to };
  }

  /* ---- Code scaffolds — the user builds sites and games ---- */
  const SCAFFOLDS = {
    page: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>New page</title>
  <style>
    :root { --ink:#111; --bg:#fff; --accent:#2f7bff; }
    * { box-sizing:border-box; }
    body { margin:0; font:16px/1.6 system-ui,sans-serif; color:var(--ink); background:var(--bg); }
    .wrap { max-width:64ch; margin:0 auto; padding:48px 24px; }
  </style>
</head>
<body>
  <div class="wrap">
    <h1>New page</h1>
    <p>Replace me.</p>
  </div>
</body>
</html>`,

    game: `<canvas id="c" width="800" height="450"></canvas>
<script>
const ctx = document.getElementById('c').getContext('2d');
const player = { x: 400, y: 225, vx: 0, vy: 0, r: 14 };
const keys = {};
addEventListener('keydown', e => keys[e.key] = true);
addEventListener('keyup',   e => keys[e.key] = false);

// Fixed timestep: physics stays identical whatever the frame rate does.
const STEP = 1 / 60;
let acc = 0, last = performance.now();

function update(dt) {
  const a = 900;
  if (keys.ArrowLeft)  player.vx -= a * dt;
  if (keys.ArrowRight) player.vx += a * dt;
  if (keys.ArrowUp)    player.vy -= a * dt;
  if (keys.ArrowDown)  player.vy += a * dt;
  player.vx *= 0.92; player.vy *= 0.92;
  player.x += player.vx * dt; player.y += player.vy * dt;
}

function draw() {
  ctx.fillStyle = '#0a0b0f'; ctx.fillRect(0, 0, 800, 450);
  ctx.fillStyle = '#ff2d55';
  ctx.beginPath(); ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2); ctx.fill();
}

function frame(now) {
  acc += Math.min((now - last) / 1000, 0.25);   // clamp: no spiral of death
  last = now;
  while (acc >= STEP) { update(STEP); acc -= STEP; }
  draw();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
<\/script>`,

    fetch: `async function load(url, { timeout = 8000, ...opts } = {}) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeout);
  try {
    const res = await fetch(url, { ...opts, signal: ac.signal });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } finally {
    clearTimeout(timer);        // runs on success, failure and abort alike
  }
}`,
  };

  /* ---- Text utilities ---- */
  const slug = t => t.toLowerCase().trim()
    .replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/^-+|-+$/g, '');

  const uuid = () => (crypto.randomUUID
    ? crypto.randomUUID()
    : ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)));

  async function sha256(text) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
  }

  const password = (len = 20) => {
    const set = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%^&*-_';
    return [...crypto.getRandomValues(new Uint32Array(len))]
      .map(n => set[n % set.length]).join('');
  };

  return { calc, convert, SCAFFOLDS, slug, uuid, sha256, password, UNITS };
})();


/* ------------------------------------------------------------
   CHART — real price history, drawn on canvas

   And ANALYSIS: indicators are arithmetic over prices that have
   already happened. They describe the past. They are not
   forecasts, and this module deliberately exposes no function
   that returns "up" or "down", because no honest one exists.
   ------------------------------------------------------------ */
const Chart = (() => {

  function sma(values, n) {
    if (values.length < n) return null;
    let sum = 0;
    for (let i = values.length - n; i < values.length; i++) sum += values[i];
    return sum / n;
  }

  /* Wilder's RSI. >70 is conventionally called overbought, <30 oversold —
     conventions about the past, not statements about the next candle. */
  function rsi(values, n = 14) {
    if (values.length < n + 1) return null;
    let gain = 0, loss = 0;
    for (let i = values.length - n; i < values.length; i++) {
      const d = values[i] - values[i - 1];
      if (d >= 0) gain += d; else loss -= d;
    }
    if (loss === 0) return 100;
    const rs = (gain / n) / (loss / n);
    return 100 - 100 / (1 + rs);
  }

  /* Annualised standard deviation of log returns. */
  function volatility(values) {
    if (values.length < 3) return null;
    const rets = [];
    for (let i = 1; i < values.length; i++) {
      if (values[i - 1] > 0) rets.push(Math.log(values[i] / values[i - 1]));
    }
    if (rets.length < 2) return null;
    const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
    const varr = rets.reduce((a, b) => a + (b - mean) ** 2, 0) / (rets.length - 1);
    return Math.sqrt(varr) * Math.sqrt(365) * 100;
  }

  /* Facts about a series, phrased as facts. */
  function describe(values) {
    const last = values[values.length - 1];
    const first = values[0];
    const hi = Math.max(...values), lo = Math.min(...values);
    const change = ((last - first) / first) * 100;
    const ma7 = sma(values, 7), ma30 = sma(values, 30);
    const r = rsi(values);
    const vol = volatility(values);
    const range = hi - lo;
    const pos = range > 0 ? ((last - lo) / range) * 100 : 50;
    return { last, first, hi, lo, change, ma7, ma30, rsi: r, vol, pos };
  }

  function draw(canvas, values, opts = {}) {
    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.clientWidth || 600, cssH = canvas.clientHeight || 260;
    canvas.width = cssW * dpr; canvas.height = cssH * dpr;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);
    if (!values || values.length < 2) return;

    const pad = { l: 58, r: 12, t: 12, b: 22 };
    const w = cssW - pad.l - pad.r, h = cssH - pad.t - pad.b;
    let hi = Math.max(...values), lo = Math.min(...values);
    if (hi === lo) { hi += 1; lo -= 1; }
    const headroom = (hi - lo) * 0.08;
    hi += headroom; lo -= headroom;

    const x = i => pad.l + (i / (values.length - 1)) * w;
    const y = v => pad.t + h - ((v - lo) / (hi - lo)) * h;

    // grid + price axis
    ctx.strokeStyle = 'rgba(120,165,255,.13)';
    ctx.fillStyle = '#64769c';
    ctx.font = '10px ui-monospace, monospace';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const gy = pad.t + (h / 4) * i;
      ctx.beginPath(); ctx.moveTo(pad.l, gy); ctx.lineTo(cssW - pad.r, gy); ctx.stroke();
      const val = hi - ((hi - lo) / 4) * i;
      ctx.textAlign = 'right';
      ctx.fillText(val >= 1000 ? val.toFixed(0) : val.toPrecision(4), pad.l - 7, gy + 3);
    }

    const rising = values[values.length - 1] >= values[0];
    const line = rising ? '#23e7a0' : '#ff2d55';

    // area fill under the line
    const grad = ctx.createLinearGradient(0, pad.t, 0, pad.t + h);
    grad.addColorStop(0, rising ? 'rgba(35,231,160,.28)' : 'rgba(255,45,85,.28)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.beginPath();
    ctx.moveTo(x(0), y(values[0]));
    values.forEach((v, i) => ctx.lineTo(x(i), y(v)));
    ctx.lineTo(x(values.length - 1), pad.t + h);
    ctx.lineTo(x(0), pad.t + h);
    ctx.closePath(); ctx.fillStyle = grad; ctx.fill();

    // moving average, drawn under the price line
    if (opts.ma && values.length > opts.ma) {
      ctx.beginPath();
      let started = false;
      for (let i = opts.ma - 1; i < values.length; i++) {
        const m = values.slice(i - opts.ma + 1, i + 1).reduce((a, b) => a + b, 0) / opts.ma;
        started ? ctx.lineTo(x(i), y(m)) : (ctx.moveTo(x(i), y(m)), started = true);
      }
      ctx.strokeStyle = 'rgba(139,92,246,.85)';
      ctx.lineWidth = 1.4; ctx.setLineDash([4, 4]); ctx.stroke(); ctx.setLineDash([]);
    }

    // price line
    ctx.beginPath();
    ctx.moveTo(x(0), y(values[0]));
    values.forEach((v, i) => ctx.lineTo(x(i), y(v)));
    ctx.strokeStyle = line; ctx.lineWidth = 2;
    ctx.shadowColor = line; ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // emphasised endpoint
    const lx = x(values.length - 1), ly = y(values[values.length - 1]);
    ctx.beginPath(); ctx.arc(lx, ly, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = line; ctx.fill();
  }

  return { draw, describe, sma, rsi, volatility };
})();


/* ------------------------------------------------------------
   SECURITY — defensive tooling

   Scope, stated plainly: this hardens things you own. Password
   strength, breach exposure, and a review checklist for your own
   sites. There is no scanner, no exploit and no payload here,
   because a tool that attacks other people's systems is a
   liability to its owner first.
   ------------------------------------------------------------ */
const Sec = (() => {

  const COMMON = new Set(['password','123456','12345678','qwerty','abc123','letmein',
    'monkey','dragon','111111','iloveyou','admin','welcome','login','princess',
    'football','baseball','master','sunshine','shadow','superman','trustno1',
    'passw0rd','zaq12wsx','qwerty123','000000','password1','1q2w3e4r']);

  /* Entropy from the character space actually used, then penalties for
     the patterns that make a long password weak anyway. */
  function strength(pw) {
    if (!pw) return null;
    let space = 0;
    if (/[a-z]/.test(pw)) space += 26;
    if (/[A-Z]/.test(pw)) space += 26;
    if (/\d/.test(pw)) space += 10;
    if (/[^a-zA-Z0-9]/.test(pw)) space += 33;
    let bits = pw.length * Math.log2(space || 1);

    const notes = [];
    const low = pw.toLowerCase();
    if (COMMON.has(low)) { bits = Math.min(bits, 8); notes.push('This is on every attacker’s first-guess list.'); }
    if (/^(.)\1+$/.test(pw)) { bits = Math.min(bits, 10); notes.push('One repeated character.'); }
    if (/^\d+$/.test(pw)) { bits = Math.min(bits, pw.length * 3.3); notes.push('Digits only — a tiny search space.'); }
    if (/(abc|bcd|cde|123|234|345|456|567|678|789|qwe|wer|ert|asd)/i.test(pw)) {
      bits *= 0.75; notes.push('Contains a keyboard or alphabet run.');
    }
    if (/(19|20)\d\d/.test(pw)) { bits *= 0.85; notes.push('Contains something shaped like a year.'); }
    if (pw.length < 12) notes.push('Under 12 characters — length beats complexity, every time.');

    // Offline guessing at a deliberately pessimistic 100 billion tries/sec.
    const seconds = Math.pow(2, bits - 1) / 1e11;
    let verdict, tone;
    if (bits < 40) { verdict = 'Weak'; tone = 'bad'; }
    else if (bits < 60) { verdict = 'Fair'; tone = 'warn'; }
    else if (bits < 80) { verdict = 'Strong'; tone = 'ok'; }
    else { verdict = 'Very strong'; tone = 'ok'; }

    return { bits: Math.round(bits), verdict, tone, notes, crackTime: humanTime(seconds) };
  }

  function humanTime(sec) {
    if (sec < 1) return 'instantly';
    const u = [['second',60],['minute',60],['hour',24],['day',365],['year',1e3],
               ['thousand years',1e3],['million years',1e3],['billion years',1e9]];
    let v = sec;
    for (const [name, step] of u) {
      if (v < step) return `about ${v < 10 ? v.toFixed(1) : Math.round(v)} ${name}${v >= 2 ? (name.endsWith('s') ? '' : 's') : ''}`;
      v /= step;
    }
    return 'longer than the universe has existed';
  }

  /* Breach lookup by k-anonymity.

     The password is hashed locally, and only the FIRST FIVE characters
     of that hash are sent. The service returns every suffix under that
     prefix and the match is found here. Your password, and the full
     hash of it, never leave this machine — which is the only reason
     this feature is acceptable at all. */
  async function breachCount(pw, fetcher) {
    const buf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(pw));
    const hash = [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    const prefix = hash.slice(0, 5), suffix = hash.slice(5);
    const res = await fetcher('https://api.pwnedpasswords.com/range/' + prefix);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const body = await res.text();
    for (const line of body.split('\n')) {
      const [suf, count] = line.trim().split(':');
      if (suf === suffix) return parseInt(count, 10) || 0;
    }
    return 0;
  }

  /* Review checklist for a site you run. */
  const CHECKLIST = [
    ['Serve everything over HTTPS', 'Redirect http→https and set HSTS. Anything less means the page can be rewritten in transit.'],
    ['Set a Content-Security-Policy', 'The single most effective defence against cross-site scripting. Start with default-src \'self\'.'],
    ['Never build HTML from user input with innerHTML', 'Use textContent, or escape. Most site compromises start here.'],
    ['Parameterise every database query', 'String-concatenated SQL is how databases get emptied.'],
    ['Hash passwords with argon2id or bcrypt', 'Never SHA-256 alone, never unsalted, never reversible.'],
    ['Set cookies HttpOnly, Secure, SameSite=Lax', 'Stops script theft and most cross-site request forgery.'],
    ['Keep secrets out of the repository', 'Rotate anything ever committed — git history keeps it forever.'],
    ['Rate-limit login and reset endpoints', 'Unlimited guesses makes every other password control decorative.'],
    ['Patch dependencies on a schedule', 'Most real breaches use a known bug with a published fix.'],
    ['Turn on 2FA everywhere you can', 'It defeats credential stuffing even when a password is already leaked.'],
  ];

  /* ---- Crypto & encoding toolkit (all local) ---- */
  const te = new TextEncoder();
  const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');

  async function digest(algo, text) { return hex(await crypto.subtle.digest(algo, te.encode(text))); }

  async function hmac(text, key) {
    const k = await crypto.subtle.importKey('raw', te.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    return hex(await crypto.subtle.sign('HMAC', k, te.encode(text)));
  }

  const b64 = {
    enc: t => btoa(unescape(encodeURIComponent(t))),
    dec: t => decodeURIComponent(escape(atob(t.replace(/-/g, '+').replace(/_/g, '/')))),
  };

  /* Decode a JWT without verifying it — useful for reading what a token
     claims. Verifying the signature needs the server's secret, which is
     the whole point of a signature and not something a client should hold. */
  function jwtDecode(token) {
    const parts = token.trim().split('.');
    if (parts.length !== 3) throw new Error('A JWT has three dot-separated parts.');
    const head = JSON.parse(b64.dec(parts[0]));
    const body = JSON.parse(b64.dec(parts[1]));
    const out = { header: head, payload: body };
    if (body.exp) out.expires = new Date(body.exp * 1000).toLocaleString() +
      (body.exp * 1000 < Date.now() ? ' (EXPIRED)' : '');
    return out;
  }

  /* Guess what a hash is from its shape. */
  function idHash(h) {
    h = h.trim();
    const byLen = { 32: 'MD5 or NTLM', 40: 'SHA-1', 56: 'SHA-224', 64: 'SHA-256', 96: 'SHA-384', 128: 'SHA-512' };
    if (/^[a-f0-9]+$/i.test(h) && byLen[h.length]) return byLen[h.length];
    if (/^\$2[aby]\$/.test(h)) return 'bcrypt';
    if (/^\$argon2/.test(h)) return 'argon2';
    if (/^\$6\$/.test(h)) return 'sha512crypt';
    if (/^[A-Za-z0-9+/]+={0,2}$/.test(h) && h.length % 4 === 0) return 'possibly base64-encoded';
    return 'unrecognised';
  }

  /* Shannon entropy — how random a string is, in bits per character.
     A secret should be high; a "random" token that scores low isn't. */
  function shannon(str) {
    if (!str) return 0;
    const freq = {};
    for (const c of str) freq[c] = (freq[c] || 0) + 1;
    let h = 0;
    for (const c in freq) { const pr = freq[c] / str.length; h -= pr * Math.log2(pr); }
    return h;
  }

  /* ---- Test payloads, for probing YOUR OWN input handling ----
     These are the exact strings attackers try. You paste them into your
     own forms to confirm they are escaped, parameterised and rejected —
     the standard way to verify a fix actually holds. */
  const PAYLOADS = {
    xss: [
      `<script>alert(1)</scr` + `ipt>`,
      `"><img src=x onerror=alert(1)>`,
      `javascript:alert(document.domain)`,
      `<svg/onload=alert(1)>`,
      `'"><body onload=alert(1)>`,
    ],
    sqli: [
      `' OR '1'='1`,
      `'; DROP TABLE users;--`,
      `" OR 1=1--`,
      `admin'--`,
      `1' UNION SELECT null,version()--`,
    ],
    traversal: [
      `../../../../etc/passwd`,
      `..\\..\\..\\windows\\win.ini`,
      `%2e%2e%2f%2e%2e%2fetc%2fpasswd`,
    ],
    cmdi: [
      `; ls -la`,
      `| whoami`,
      `$(id)`,
      '`id`',
    ],
  };

  return { strength, breachCount, CHECKLIST, digest, hmac, b64, jwtDecode, idHash, shannon, PAYLOADS };
})();


/* ------------------------------------------------------------
   RECON — for domains you control

   DNS lookups over DNS-over-HTTPS (Cloudflare's JSON endpoint).
   This reads public records that anyone can query; it is how you
   map your own attack surface before an audit. It does not touch
   the target host directly and carries no exploit.
   ------------------------------------------------------------ */
const Recon = (() => {
  const TYPES = ['A', 'AAAA', 'MX', 'NS', 'TXT', 'CNAME', 'SOA', 'CAA'];

  async function dns(name, fetcher) {
    const clean = name.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    const out = {};
    for (const type of TYPES) {
      try {
        const r = await fetcher(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(clean)}&type=${type}`,
          { headers: { accept: 'application/dns-json' } });
        if (!r.ok) continue;
        const d = await r.json();
        if (d.Answer?.length) out[type] = d.Answer.map(a => a.data);
      } catch { /* one record type failing should not sink the rest */ }
    }
    return { name: clean, records: out };
  }

  /* Notable findings a checklist would flag. */
  function notes(records) {
    const n = [];
    const txt = (records.TXT || []).join(' ');
    if (!/v=spf1/i.test(txt)) n.push('No SPF record found — email spoofing is easier without one.');
    if (!(records.CAA)) n.push('No CAA record — any CA may issue certificates for this domain.');
    if ((records.NS || []).length < 2) n.push('Fewer than two nameservers — a single point of failure.');
    if (/dmarc/i.test(txt) === false) n.push('No DMARC seen at this level (check _dmarc subdomain).');
    return n;
  }

  return { dns, notes };
})();



/* ------------------------------------------------------------
   CONVERSE — talking, with no model involved

   A person opening Zero types "hello" before they type anything
   else. Falling through to a connection error at that moment
   makes the whole thing feel broken, so the ordinary human
   openings are answered here, instantly and offline.
   ------------------------------------------------------------ */
const Converse = (() => {

  const pick = a => a[Math.floor(Math.random() * a.length)];

  function partOfDay(d = new Date()) {
    const h = d.getHours();
    return h < 5 ? 'night' : h < 12 ? 'morning' : h < 18 ? 'afternoon' : h < 22 ? 'evening' : 'night';
  }

  function greeting(ctx) {
    const part = partOfDay();
    const hi = pick(['Hey', 'Hello', 'Hi']);
    const who = ctx.name ? `, ${ctx.name}` : '';
    const open = part === 'night'
      ? `${hi}${who}. Late one.`
      : `Good ${part}${who}.`;
    const open_ = ctx.tasks > 0
      ? ` You have ${ctx.tasks} open task${ctx.tasks === 1 ? '' : 's'}.`
      : '';
    return open + open_ + ' ' + pick([
      'What are we doing?',
      'What do you need?',
      'Where do you want to start?',
    ]);
  }

  /* Each rule: [test, responder]. First match wins. */
  const RULES = [
    [/^(hi|hey|hello|yo|hiya|sup|howdy|heya)\b/i, ctx => greeting(ctx)],
    [/^good\s*(morning|afternoon|evening|day)\b/i, ctx => greeting(ctx)],
    [/^good\s*(night|nite)\b/i, () => pick(['Night. I will be here.', 'Goodnight — everything is saved.'])],

    [/\b(how are you|how'?s it going|how you doing|you (ok|good|alright))\b/i, ctx =>
      `Running fine. ${ctx.hasEngine ? 'Core is connected' : 'No model connected, so I am on built-in skills'}, ` +
      `${ctx.memories} memor${ctx.memories === 1 ? 'y' : 'ies'} carried, ${ctx.tasks} open task${ctx.tasks === 1 ? '' : 's'}. You?`],

    [/\b(who are you|what are you|your name|introduce yourself)\b/i, () =>
      "I am Zero. I run entirely on this machine — no account, no company behind me, nothing sent anywhere you " +
      "did not point me at. I handle maths, conversions, markets, charts, news, tasks, notes, passwords and " +
      "lookups on my own. Connect a local model in Settings and I can hold an open conversation too."],

    [/\b(what can you do|what do you do|your (features|abilities|skills)|capabilities|how do (i|you) (use|work))\b/i, () =>
      "Ask me things like:\n" +
      "  what is quantum tunnelling      look it up\n" +
      "  = 12*(3+4)^2                    maths\n" +
      "  20 km to miles                  conversions\n" +
      "  100 usd to eur                  live rates\n" +
      "  chart btc 90                    price chart + indicators\n" +
      "  news                            what is happening\n" +
      "  remember I ship on Fridays      I keep it forever\n" +
      "  task fix the checkout bug       add a task\n" +
      "  scaffold game                   starter code\n" +
      "  open figma                      launch an app\n" +
      "Type help for the full list."],

    [/^(thanks|thank you|ty|cheers|nice one|appreciate it|thx)\b/i, () =>
      pick(['Any time.', 'Sure thing.', 'No problem.'])],

    [/^(bye|goodbye|see ya|see you|later|cya)\b/i, () =>
      pick(['See you.', 'Later. Everything is saved.'])],

    [/^(ok|okay|cool|nice|great|awesome|sweet|got it|k)\b\.?$/i, () =>
      pick(['👍', 'Right.', 'What next?'])],

    [/^(yes|yeah|yep|no|nope|nah)\b\.?$/i, () =>
      'What would you like me to do?'],

    [/\b(are you (an? )?(ai|robot|human|real|conscious|alive))\b/i, () =>
      "I am a program running in your browser — no more, no less. When a model is connected I pass your words " +
      "to it; otherwise everything I say comes from code you can read. I would rather you know that than " +
      "wonder."],

    [/\b(i love you|marry me|you'?re (amazing|the best|great))\b/i, () =>
      "Appreciated. Let us get something built."],

    [/\b(you'?re (useless|stupid|rubbish|trash|dumb)|you suck|hate you)\b/i, () =>
      "Fair enough — tell me what failed and I will look at it. If something is genuinely broken, that is worth fixing."],

    [/\b(what time|the time)\b/i, () => new Date().toLocaleTimeString()],
    [/\b(what|which) (day|date)\b/i, () => new Date().toLocaleDateString(undefined,
      { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })],

    [/\b(are you (there|awake|listening)|you there)\b/i, () => "Here. Go ahead."],
  ];

  function reply(text, ctx) {
    const t = text.trim();
    if (!t) return null;
    for (const [re, fn] of RULES) if (re.test(t)) return fn(ctx);
    return null;
  }

  /* Nearest known command, for "did you mean". */
  function suggest(text, commands) {
    const first = text.trim().toLowerCase().split(/\s+/)[0];
    if (!first) return null;
    let best = null, bestD = Infinity;
    for (const c of commands) {
      const d = distance(first, c);
      if (d < bestD) { bestD = d; best = c; }
    }
    // Only offer it when it is genuinely close, or a suggestion becomes noise.
    return bestD <= Math.max(1, Math.floor(first.length / 3)) ? best : null;
  }

  function distance(a, b) {
    const m = a.length, n = b.length;
    let prev = Array.from({ length: n + 1 }, (_, j) => j);
    for (let i = 1; i <= m; i++) {
      const cur = [i];
      for (let j = 1; j <= n; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      }
      prev = cur;
    }
    return prev[n];
  }

  return { reply, suggest, partOfDay };
})();


/* ------------------------------------------------------------
   COOK — a chef in Zero

   Real technique, ratios and temperatures, offline. This is the
   craft that separates good cooking from guesswork: why things
   work, not just what to do.
   ------------------------------------------------------------ */
const Cook = (() => {

  /* Load-bearing ratios — memorise these and you can cook without a recipe. */
  const RATIOS = {
    'vinaigrette': '3 parts oil : 1 part acid. Salt the acid first so it dissolves, then whisk the oil in slowly to emulsify.',
    'rice': 'White rice 1 : 1.5 water by volume; simmer covered 18 min, then rest 10 off heat, lid on. Never stir.',
    'pasta water': 'Salt pasta water to 1% — about 10 g salt per litre. It should taste of mild seawater.',
    'bread': 'Baker\'s percentage: flour 100%, water 65–75%, salt 2%, yeast ~1%. Everything else is measured against flour weight.',
    'roux': 'Equal weights fat and flour. Cook 2 min for blond, longer for darker; 30 g of each thickens ~250 ml.',
    'brine': '6% salt by weight of water (60 g/L) for a quick brine; 1 hour per 500 g of meat.',
    'cookies': 'Chewy: more brown sugar and an extra yolk. Crisp: more white sugar, melted butter. Cakey: more flour, a whole extra egg.',
    'pancakes': 'Flour 200 g, milk 300 ml, 1 egg, 1 tsp baking powder, pinch salt. Rest the batter 10 min.',
    'custard': 'Roughly 1 egg yolk per 100 ml of dairy for a pourable custard; whole eggs set firmer.',
  };

  /* Temperatures that actually matter — pull point, °C then °F. */
  const TEMPS = {
    'steak': 'Rare 52 / medium-rare 55 / medium 60 / well 68 °C. Pull 2–3° early and rest 5–10 min — it climbs while resting.',
    'chicken': 'Safe at 74 °C (165 °F) in the thickest part. Breast dries past that; brine or pull right at temp.',
    'pork': '63 °C (145 °F) then a 3-min rest — a faint blush is fine and juicy. 71 °C for shredding cuts.',
    'fish': '52–55 °C for most fish — just-flaking. Salmon is lovely at 50 °C, translucent centre.',
    'bread': 'Lean loaves are done at 96–99 °C internal; enriched doughs ~88–90 °C.',
    'oil': 'Shallow-fry 175–185 °C. No thermometer: a cube of bread browns in ~40 s at 180 °C.',
    'caramel': 'Amber caramel is 170–180 °C. It carries over, so pull it a touch light.',
    'sugar': 'Soft-ball 115 °C, hard-crack 150 °C.',
  };

  /* Substitutions — real 1:1 or near-1:1 swaps. */
  const SUBS = {
    'buttermilk': '1 cup milk + 1 tbsp lemon juice or vinegar; rest 5 min until it curdles.',
    'egg': 'Binding: 1 tbsp ground flax + 3 tbsp water, rested. Leavening: ¼ tsp baking soda + ½ tsp vinegar. Richness: ¼ cup yoghurt or aquafaba (3 tbsp) whips like whites.',
    'baking powder': '¼ tsp baking soda + ½ tsp cream of tartar = 1 tsp baking powder.',
    'butter': 'Neutral oil at ~80% of the butter weight for frying; in baking it changes texture (less structure).',
    'cream': 'Evaporated milk 1:1 for cooking; for whipping there is no true substitute for the fat.',
    'wine': 'Stock + a splash of vinegar or lemon, or a little verjus, for the acidity a recipe leans on.',
    'cornstarch': 'Twice the weight of flour, or 1:1 with arrowroot (which stays clearer and sets glossier).',
    'garlic': '⅛ tsp garlic powder ≈ 1 clove, but add it earlier so it hydrates.',
    'self-raising flour': 'Plain flour + 2 tsp baking powder per 150 g.',
  };

  /* Techniques — the "why". */
  const TECH = {
    'sear': 'Dry the surface hard (pat + optionally salt and air-dry). Hot pan, then oil, then meat — and leave it alone. It releases from the pan when the crust forms; forcing it early tears it. That browning is the Maillard reaction and it is most of the flavour.',
    'rest': 'Resting lets the muscle fibres relax and reabsorb juices that heat pushed to the centre. Cut too soon and it bleeds onto the board. 5 min for a steak, 15–20 for a roast, tented loosely.',
    'salt': 'Salt early. On meat, salt 40+ min ahead (or the night before) so it dissolves, draws out moisture, then gets reabsorbed as a light brine — seasoning all the way through, not just the surface.',
    'emulsion': 'Oil and water do not mix until an emulsifier (mustard, egg yolk, a little of the sauce already made) holds them. Add the oil slowly while whisking; if it breaks, start a new yolk/teaspoon of water and whisk the broken sauce into it drop by drop.',
    'deglaze': 'After searing, the browned stuck bits (fond) are pure flavour. Pour in wine or stock, scrape while it bubbles, reduce, then finish off heat with a knob of cold butter for a glossy pan sauce.',
    'blanch': 'Boil hard and salted, cook briefly, then plunge into ice water to lock colour and stop cooking. The shock keeps greens vivid.',
    'bloom': 'Toast whole or ground spices in dry heat or oil for 30–60 s until fragrant — it wakes up the fat-soluble aromatics. Do not let them smoke.',
    'reduce': 'Simmering evaporates water and concentrates flavour and body. Reducing by half roughly doubles intensity; taste before you salt, since salt concentrates too.',
    'knead': 'Kneading develops gluten into an elastic web that traps gas. It is done when the dough passes the windowpane test — stretch a piece thin enough to see light through without tearing.',
    'caramelise onions': 'Low and slow, 30–45 min, a pinch of salt to pull water, stirring occasionally. High heat browns fast but tastes of scorch, not sweetness. Deglaze the pan when it sticks.',
  };

  const norm = s => s.toLowerCase().replace(/[^a-z ]/g, '').trim();

  function answer(q) {
    const n = norm(q);
    // direct table hits
    for (const [k, v] of Object.entries(TECH))  if (n.includes(k) || n.includes(k.split(' ')[0])) return cap('Technique — ' + k, v);
    for (const [k, v] of Object.entries(TEMPS)) if (n.includes(k)) return cap(k + ' — temperature', v);
    for (const [k, v] of Object.entries(RATIOS)) if (n.includes(k)) return cap(k + ' — ratio', v);
    for (const [k, v] of Object.entries(SUBS)) {
      if (n.includes('substitut') || n.includes('instead of') || n.includes('replace')) {
        for (const [k2, v2] of Object.entries(SUBS)) if (n.includes(k2)) return cap('Substitute for ' + k2, v2);
      }
      if (n.includes(k)) return cap(k, v);
    }
    return null;
  }

  function cap(title, body) { return `🍳 ${title}\n${body}`; }

  function index() {
    return 'I can talk technique, temperatures, ratios and substitutions. Try:\n' +
      '  cook sear a steak · cook pan sauce · cook caramelise onions\n' +
      '  temp for chicken · rice ratio · vinaigrette ratio\n' +
      '  substitute for buttermilk · egg substitute\n' +
      'Or just ask a cooking question in plain words.';
  }

  /* Full recipes — real, tested proportions and method. */
  const RECIPES = {
    'carbonara': {
      title: 'Spaghetti Carbonara (serves 2)',
      ingredients: ['200 g spaghetti', '100 g guanciale or pancetta, diced', '2 whole eggs + 1 yolk',
        '50 g Pecorino Romano, grated', 'Black pepper, lots', 'Salt for the pasta water'],
      steps: [
        'Boil the pasta in well-salted water (1%). Reserve a mug of pasta water before draining.',
        'Render the guanciale in a cold, dry pan over medium heat until crisp; kill the heat.',
        'Whisk eggs, yolk, pecorino and a heavy grind of pepper into a paste.',
        'Drain pasta, add to the pan off the heat, toss with the fat. Wait 30 s so it is not scalding.',
        'Add the egg mix, tossing hard, loosening with pasta water until it is a glossy sauce. Never let it scramble.',
        'Serve at once with more pecorino and pepper.'],
    },
    'omelette': {
      title: 'French Omelette (serves 1)',
      ingredients: ['3 eggs', '1 tbsp butter', 'Salt', 'Chives or cheese (optional)'],
      steps: [
        'Beat the eggs with a pinch of salt until fully uniform.',
        'Melt butter in a non-stick pan over medium heat until it foams but does not brown.',
        'Pour in the eggs; stir constantly with a spatula, shaking the pan, 20–30 s.',
        'When just-set but still glossy on top, stop stirring, let it sit 10 s.',
        'Tilt the pan, fold a third over, roll it out onto the plate seam-down. Soft, pale, no colour.'],
    },
    'pancakes': {
      title: 'Fluffy Pancakes (makes ~8)',
      ingredients: ['200 g flour', '2 tsp baking powder', '1 tbsp sugar', 'pinch salt',
        '300 ml milk', '1 egg', '2 tbsp melted butter'],
      steps: [
        'Whisk the dry ingredients. Separately whisk milk, egg and butter.',
        'Combine, stirring just until no dry flour remains — lumps are fine; overmixing makes them tough.',
        'Rest 10 min. Cook on a medium, lightly buttered pan.',
        'Flip when bubbles rise and the edges look set, ~2 min; ~1 min on the second side.'],
    },
    'roast chicken': {
      title: 'Roast Chicken',
      ingredients: ['1 whole chicken (~1.5 kg)', 'Salt', 'Butter or oil', 'Pepper', 'Optional: lemon, herbs'],
      steps: [
        'Salt it all over, ideally the day before, uncovered in the fridge — dry skin crisps best.',
        'Bring to room temp ~1 h out. Heat oven to 220 °C.',
        'Rub with fat, pepper; put lemon/herbs in the cavity. Truss or tuck the wings.',
        'Roast ~20 min, drop to 190 °C, continue until the thickest thigh reads 74 °C — about 1 h total.',
        'Rest 15–20 min tented before carving, or the juices run out onto the board.'],
    },
    'tomato sauce': {
      title: 'Simple Tomato Sauce',
      ingredients: ['1 tin (400 g) whole tomatoes', '2 cloves garlic, sliced', '3 tbsp olive oil',
        'Salt', 'Basil', 'Pinch sugar if needed'],
      steps: [
        'Warm the oil, add garlic, cook gently until pale gold — do not brown or it turns bitter.',
        'Add the tomatoes, crushing by hand. Season. Simmer 20–30 min until it no longer tastes raw.',
        'Adjust salt; a pinch of sugar if sharp. Tear in basil at the end.'],
    },
    'vinaigrette': {
      title: 'House Vinaigrette',
      ingredients: ['3 tbsp oil', '1 tbsp vinegar or lemon', '1 tsp mustard', 'Salt, pepper', 'Optional: honey'],
      steps: [
        'Dissolve salt in the acid, whisk in the mustard.',
        'Drizzle the oil in slowly while whisking so it emulsifies.',
        'Taste on a leaf, not the spoon — it should be brighter than you expect.'],
    },
  };

  function recipe(name) {
    const n = norm(name);
    let key = Object.keys(RECIPES).find(k => n.includes(k) || k.includes(n));
    if (!key) key = Object.keys(RECIPES).find(k => k.split(' ').some(w => n.includes(w)));
    if (!key) return null;
    const r = RECIPES[key];
    return `🍳 ${r.title}\n\nIngredients\n` + r.ingredients.map(i => '  • ' + i).join('\n') +
      '\n\nMethod\n' + r.steps.map((s, i) => `  ${i + 1}. ${s}`).join('\n');
  }
  function recipeList() {
    return 'Recipes I can walk you through:\n' +
      Object.values(RECIPES).map(r => '  • ' + r.title.replace(/ \(.*/, '')).join('\n') +
      '\nSay e.g. `recipe carbonara`.';
  }

  return { answer, index, recipe, recipeList, RATIOS, TEMPS, SUBS, TECH, RECIPES };
})();
