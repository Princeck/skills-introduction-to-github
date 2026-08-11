# ZERO

A private, local-first personal assistant with live market readings, tasks, notes,
and a master control panel with an always-visible kill switch.

**Theme:** red · blue · black · white

---

## Run it

No build step, no install, no server:

```bash
open zero/index.html          # macOS
# or just double-click index.html
```

That's it. Everything runs in your browser.

---

## The Control Panel (read this first)

Zero is built so **you** are always in charge.

| Control | What it does |
|---|---|
| **■ STOP** (top-right, always visible) | Instantly halts everything — aborts in-flight requests, cancels timers, freezes activity |
| **Esc Esc** or **Ctrl/Cmd + .** | Same kill switch, from the keyboard, anywhere |
| **Cut all network access** | Zero can no longer reach the internet at all |
| **Panic** | Halts Zero *and* deletes every stored API key |
| **Capability switches** | Turn network / market polling / AI / storage off individually |
| **Activity log** | Every action and every blocked action, timestamped |

**Design rule:** every network request in Zero routes through one guarded
function (`guardedFetch` in `js/app.js`). If Zero is halted, or a capability is
off, the request never leaves your machine. Nothing in Zero's own logic can flip
these switches — only a direct click from you.

---

## What's in it

- **Dashboard** — open tasks, live BTC, quick capture
- **Markets** — live crypto prices (BTC, ETH, SOL, BNB, XRP, DOGE), auto-refresh every 60s
- **Assistant** — offline command engine (`help`, `task …`, `note …`, `price btc`, `tasks`, `time`), plus full conversational AI when you add a key
- **Tasks / Notes** — saved locally, export to JSON anytime
- **Settings** — API keys, data export, full wipe

---

## Privacy — what's true and what isn't

**What's genuinely true:**
- No server, no accounts, no analytics, no telemetry, no cookies, no tracking pixels
- All your tasks and notes live in *your browser's* localStorage, on your device
- API keys are stored locally and sent only to the provider you pick
- You can export or wipe everything with one click
- Open source — every line is in this folder, auditable

**What is NOT true, and I won't pretend otherwise:**
Zero cannot make you invisible to governments or ISPs. When it fetches market
prices or calls an AI API, that traffic is visible to your network, your ISP, and
the API provider. No app can change that. If you need stronger network privacy,
that's a job for tools built for it (a reputable VPN, Tor) — and even those have
real limits.

What Zero *does* give you is **data minimisation**: it collects nothing, stores
nothing remotely, and phones home to nobody. That part is real and verifiable in
the source.

---

## Adding live stocks

Crypto works out of the box (CoinGecko's free public API, no key).
For stocks and indices, get a free key from [Finnhub](https://finnhub.io) and
paste it into **Settings → Market Data Key**.

---

## ⚠️ Not financial advice

Market data in Zero is **information only**. It may be delayed, aggregated, or
wrong. Nothing here is a recommendation to buy or sell anything. Trading carries
real risk of loss. Do your own research and consider talking to a licensed
professional.

---

## Roadmap

- [ ] Live stocks & indices via Finnhub
- [ ] Price alerts and watchlist
- [ ] Plugin system so new capabilities drop in without touching core
- [ ] Local-model support (Ollama) so the assistant runs fully offline
- [ ] PWA install so Zero works as a desktop/mobile app
