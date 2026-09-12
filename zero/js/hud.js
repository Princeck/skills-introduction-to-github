/* ============================================================
   ZERO — HUD
   The face of the machine: a reactive orb, a boot sequence, and
   the live overview. Purely presentational; it reads state and
   draws it, and holds no authority over anything.
   ============================================================ */

const Orb = (() => {
  let canvas = null, ctx = null, raf = null;
  let state = 'idle';              // idle | listening | thinking | speaking
  let energy = 0;                  // 0..1, eased toward the state's target
  let t = 0;
  const particles = [];

  const PALETTE = {
    idle:      ['#8a8a8a', '#ffffff'],
    listening: ['#ffffff', '#bcbcbc'],
    thinking:  ['#bcbcbc', '#ffffff'],
    speaking:  ['#ffffff', '#d8d8d8'],
  };
  const TARGET = { idle: 0.18, listening: 0.85, thinking: 0.55, speaking: 0.7 };

  function attach(el) {
    canvas = el;
    ctx = canvas.getContext('2d');
    if (!particles.length) {
      for (let i = 0; i < 54; i++) {
        particles.push({ a: (i / 54) * Math.PI * 2, r: 0.72 + Math.random() * 0.1, s: 0.4 + Math.random() * 0.9 });
      }
    }
    start();
  }

  function set(next) { if (next !== state) state = next; }

  function start() {
    if (raf) return;
    const loop = () => { draw(); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
  }
  function stop() { if (raf) cancelAnimationFrame(raf); raf = null; }

  function draw() {
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth || 220, h = canvas.clientHeight || 220;
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr; canvas.height = h * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    t += 0.016;
    energy += (TARGET[state] - energy) * 0.07;      // ease, never snap

    const cx = w / 2, cy = h / 2;
    const base = Math.min(w, h) * 0.30;
    const [c1, c2] = PALETTE[state] || PALETTE.idle;

    // core glow
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, base * (1.5 + energy));
    glow.addColorStop(0, hexA(c1, 0.42 + energy * 0.3));
    glow.addColorStop(0.55, hexA(c2, 0.14));
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(cx, cy, base * (1.5 + energy), 0, Math.PI * 2); ctx.fill();

    // breathing rings
    for (let i = 0; i < 3; i++) {
      const phase = t * (0.5 + i * 0.22) + i * 1.7;
      const r = base * (0.82 + i * 0.16) + Math.sin(phase) * (3 + energy * 11);
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = hexA(i % 2 ? c2 : c1, 0.30 - i * 0.07 + energy * 0.28);
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    // reactive particle ring — the part that reads as "hearing"
    particles.forEach(p => {
      const wobble = Math.sin(t * p.s * 2.2 + p.a * 3) * energy * 15;
      const r = base * p.r + wobble + 12;
      const x = cx + Math.cos(p.a + t * 0.16) * r;
      const y = cy + Math.sin(p.a + t * 0.16) * r;
      ctx.beginPath();
      ctx.arc(x, y, 0.9 + energy * 1.7, 0, Math.PI * 2);
      ctx.fillStyle = hexA(c2, 0.35 + energy * 0.5);
      ctx.fill();
    });

    // solid core
    const core = ctx.createLinearGradient(cx - base, cy - base, cx + base, cy + base);
    core.addColorStop(0, c1); core.addColorStop(1, c2);
    ctx.beginPath();
    ctx.arc(cx, cy, base * (0.42 + energy * 0.1), 0, Math.PI * 2);
    ctx.fillStyle = core;
    ctx.shadowColor = c1; ctx.shadowBlur = 22 + energy * 30;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  function hexA(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${Math.max(0, Math.min(1, a))})`;
  }

  return { attach, set, start, stop, get state() { return state; } };
})();


/* Boot sequence. Cosmetic, and deliberately brief — a machine that
   makes you wait to admire itself is a machine you stop opening. */
const Boot = (() => {
  const LINES = [
    'ZERO — local core',
    'no vendor · no account · no telemetry',
    'storage … local database',
    'controls … armed',
    'ready',
  ];

  function run(el, done) {
    if (!el) { done?.(); return; }
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { el.remove(); done?.(); return; }
    const feed = el.querySelector('.boot-feed');
    let i = 0;
    const tick = () => {
      if (i >= LINES.length) {
        setTimeout(() => {
          el.classList.add('gone');
          setTimeout(() => { el.remove(); done?.(); }, 420);
        }, 260);
        return;
      }
      const d = document.createElement('div');
      d.textContent = LINES[i++];
      feed.appendChild(d);
      setTimeout(tick, 150);
    };
    setTimeout(tick, 120);
  }

  return { run };
})();
