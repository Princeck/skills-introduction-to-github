/* Generates copy-zero.html — a delivery page with one-click copy of the
   full standalone source. Run: node make-copy-page.js */
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, 'zero-standalone.html'), 'utf8');

// Escaping & and < is enough to make the source safe as textarea RCDATA:
// with no literal "<", the parser can never see a closing tag, and the
// textarea decodes the entities back to the exact original on read.
const escaped = src.replace(/&/g, '&amp;').replace(/</g, '&lt;');

const lines = src.split('\n').length;
const kb = (src.length / 1024).toFixed(1);

const page = `<title>Zero — Source</title>
<style>
  :root {
    --ground:  #0a0b0f;
    --panel:   #12141c;
    --panel-2: #171a24;
    --line:    #232838;
    --ink:     #f4f6fb;
    --muted:   #9aa3bd;
    --red:     #ff3b47;
    --blue:    #2f7bff;
    --green:   #21d07a;
    --mono: ui-monospace, "SF Mono", "JetBrains Mono", Menlo, Consolas, monospace;
    --sans: system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  }
  /* Single committed visual world — Zero's own. Every color is painted
     explicitly so the page holds on any host ground, light or dark. */
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background:
      radial-gradient(900px 480px at 12% -8%, rgba(47,123,255,.12), transparent 60%),
      radial-gradient(760px 400px at 100% 0%, rgba(255,59,71,.10), transparent 55%),
      var(--ground);
    color: var(--ink);
    font-family: var(--sans);
    line-height: 1.6;
    min-height: 100vh;
  }
  .wrap { max-width: 940px; margin: 0 auto; padding: 48px 24px 80px; }

  header { display: flex; align-items: center; gap: 14px; margin-bottom: 8px; }
  .mark {
    width: 44px; height: 44px; border-radius: 11px; display: grid; place-items: center;
    font-family: var(--mono); font-weight: 800; font-size: 21px; color: #fff;
    background: linear-gradient(135deg, var(--red), var(--blue));
    box-shadow: 0 0 26px rgba(47,123,255,.35);
  }
  h1 { font-size: 27px; margin: 0; font-weight: 800; letter-spacing: .5px; }
  h1 b { color: var(--red); }
  .meta {
    font-family: var(--mono); font-size: 12.5px; color: var(--muted);
    margin: 0 0 30px 58px; font-variant-numeric: tabular-nums;
  }

  .actions { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 14px; }
  button {
    font-family: var(--sans); font-size: 15px; font-weight: 700;
    border: none; border-radius: 11px; padding: 15px 26px; cursor: pointer;
    color: #fff; background: linear-gradient(135deg, var(--red), #b31f28);
    transition: filter .15s, transform .08s;
  }
  button:hover { filter: brightness(1.12); }
  button:active { transform: scale(.97); }
  button:focus-visible { outline: 3px solid var(--blue); outline-offset: 3px; }
  button.alt { background: transparent; border: 1px solid var(--line); color: var(--muted); }
  button.alt:hover { color: var(--ink); border-color: var(--blue); }
  button.done { background: linear-gradient(135deg, var(--green), #14663a); }

  .note {
    font-size: 13.5px; color: var(--muted); margin: 0 0 30px;
  }
  .note b { color: var(--ink); font-weight: 600; }

  .steps {
    background: var(--panel); border: 1px solid var(--line); border-radius: 13px;
    padding: 20px 24px; margin-bottom: 26px;
  }
  .steps h2 {
    font-size: 11.5px; text-transform: uppercase; letter-spacing: 1.6px;
    color: var(--blue); margin: 0 0 12px; font-family: var(--mono);
  }
  .steps ol { margin: 0; padding-left: 20px; font-size: 14.5px; }
  .steps li { margin-bottom: 7px; }
  .steps li:last-child { margin: 0; }
  .steps code {
    font-family: var(--mono); font-size: 12.5px; background: var(--ground);
    border: 1px solid var(--line); border-radius: 5px; padding: 2px 7px; color: var(--red);
  }

  .warn {
    border-left: 3px solid var(--red); background: rgba(255,59,71,.07);
    border-radius: 0 10px 10px 0; padding: 15px 20px; margin-bottom: 32px; font-size: 14px;
  }
  .warn b { color: var(--red); }
  .warn ul { margin: 9px 0 0; padding-left: 20px; color: var(--muted); }
  .warn code { font-family: var(--mono); font-size: 12.5px; color: var(--ink); }

  .codehead {
    display: flex; justify-content: space-between; align-items: center;
    background: var(--panel-2); border: 1px solid var(--line); border-bottom: none;
    border-radius: 12px 12px 0 0; padding: 11px 18px;
    font-family: var(--mono); font-size: 12px; color: var(--muted);
  }
  pre {
    margin: 0; background: var(--panel); border: 1px solid var(--line);
    border-radius: 0 0 12px 12px; padding: 20px;
    overflow: auto; max-height: 460px;
    font-family: var(--mono); font-size: 12px; line-height: 1.65;
    color: #c9d3ea; tab-size: 2;
  }
  textarea.src { position: absolute; left: -9999px; top: 0; opacity: 0; }

  @media (prefers-reduced-motion: reduce) {
    * { transition: none !important; animation: none !important; }
  }
  @media (max-width: 560px) {
    .meta { margin-left: 0; }
    button { width: 100%; }
  }
</style>

<div class="wrap">
  <header>
    <div class="mark">0</div>
    <h1>ZER<b>0</b> — source</h1>
  </header>
  <p class="meta">zero-standalone.html · ${kb} KB · ${lines} lines · self-contained</p>

  <div class="actions">
    <button id="copy">Copy all code</button>
    <button class="alt" id="dl">Download .html</button>
  </div>
  <p class="note">One file, everything inlined — no external CSS, JS, or fonts. Paste it anywhere, or save it and double-click to run.</p>

  <div class="steps">
    <h2>Using it with Claude</h2>
    <ol>
      <li>Hit <b>Copy all code</b> above.</li>
      <li>Paste into a new Claude conversation.</li>
      <li>Tell it what to change — <code>restyle this, keep every id and function name</code>.</li>
      <li>Save what comes back as <code>zero.html</code> and open it.</li>
    </ol>
  </div>

  <div class="warn">
    <b>Keep these intact through a redesign</b> — they're what makes the stop button work:
    <ul>
      <li><code>#killSwitch</code> and <code>#haltBanner</code> — the stop control and its overlay</li>
      <li><code>guardedFetch()</code> — every network call routes through it; swap it for plain <code>fetch</code> and STOP stops working</li>
      <li>All <code>id</code> attributes — the script targets 26 of them</li>
    </ul>
  </div>

  <div class="codehead"><span>zero-standalone.html</span><span>scroll to read</span></div>
  <pre id="view"></pre>

  <textarea class="src" id="src" readonly>${escaped}</textarea>
</div>

<script>
  var src = document.getElementById('src');
  var code = src.value;                 // entities decoded back to the exact original
  document.getElementById('view').textContent = code;

  var btn = document.getElementById('copy');
  btn.addEventListener('click', function () {
    function ok() {
      btn.textContent = 'Copied \\u2713';
      btn.classList.add('done');
      setTimeout(function () { btn.textContent = 'Copy all code'; btn.classList.remove('done'); }, 2200);
    }
    // execCommand fallback matters: the async clipboard API is blocked in
    // some sandboxed frames, and this page is likely to run inside one.
    function legacy() {
      src.style.cssText = 'position:fixed;left:0;top:0;opacity:0';
      src.select();
      try { document.execCommand('copy'); ok(); }
      catch (e) { btn.textContent = 'Press Ctrl/Cmd+C'; }
      src.style.cssText = 'position:absolute;left:-9999px;top:0;opacity:0';
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code).then(ok, legacy);
    } else { legacy(); }
  });

  document.getElementById('dl').addEventListener('click', function () {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([code], { type: 'text/html' }));
    a.download = 'zero.html';
    a.click();
    URL.revokeObjectURL(a.href);
  });
</script>
`;

fs.writeFileSync(path.join(__dirname, 'copy-zero.html'), page);
console.log(`✓ copy-zero.html written (${(page.length / 1024).toFixed(1)} KB)`);
