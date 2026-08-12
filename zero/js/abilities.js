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
  let recog = null, listening = false, voice = null;

  const canSpeak = () => 'speechSynthesis' in window;
  const canHear = () => !!SR;

  function pickVoice() {
    if (!canSpeak()) return null;
    const all = speechSynthesis.getVoices();
    if (!all.length) return null;
    // Prefer a local (on-device) voice so speech stays offline.
    return all.find(v => v.localService && /en[-_]/i.test(v.lang))
        || all.find(v => v.localService)
        || all.find(v => /en[-_]/i.test(v.lang))
        || all[0];
  }
  if (canSpeak()) {
    speechSynthesis.onvoiceschanged = () => { voice = pickVoice(); };
    voice = pickVoice();
  }

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
    u.rate = opts.rate ?? 1.02;
    u.pitch = opts.pitch ?? 0.95;
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

  return { canSpeak, canHear, speak, stop, listen, stopListening, isListening, startWake, stopWake, isAwake };
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

  return { strength, breachCount, CHECKLIST };
})();
