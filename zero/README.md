# ZERO

A private, local-first personal assistant with live market readings, tasks, notes,
and a master control panel with an always-visible kill switch.

**Theme:** holographic — red · blue · black · white

The interface is built as glass plates floating over a scanlined field. The
hologram comes from the brand's own red and blue rather than the usual rainbow
iridescence: panels carry a prismatic edge, headings carry a red/blue chromatic
split, and the halt overlay glitches. Running text stays solid white, so the
effect lives in edges and glow and never costs readability.

The kill switch is the deliberate exception — opaque, solid, no glass. It reads
as physical hardware because it is the one control that must never look like a
projection.

All motion is disabled under `prefers-reduced-motion`.

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
| **Panic** | Halts Zero, locks the vault, and clears the session from memory |
| **Capability switches** | Turn network / market polling / engine / storage off individually |
| **Activity log** | Every action and every blocked action, timestamped |

**Design rule:** every network request in Zero routes through one guarded
function (`guardedFetch` in `js/app.js`). If Zero is halted, or a capability is
off, the request never leaves your machine. Nothing in Zero's own logic can flip
these switches — only a direct click from you.

---

## What's in it

- **Dashboard** — open tasks, live BTC, quick capture
- **Markets** — live crypto prices (BTC, ETH, SOL, BNB, XRP, DOGE), auto-refresh every 60s
- **Assistant** — built-in commands (`help`, `task …`, `note …`, `price btc`, `tasks`, `time`) that need no model at all, plus open conversation through a local engine
- **Tasks / Notes** — saved locally, export to JSON anytime
- **Settings** — local engine, vault passphrase, data export, full wipe

---

## The engine is yours

Zero has no AI provider. No Anthropic, no OpenAI, no account, no API key, no
hosted service of any kind. It talks to a model running on your own machine:

```bash
# one-time setup
brew install ollama          # or download from ollama.com
ollama pull llama3.2

# start it so Zero (running from a file) is allowed to reach it
OLLAMA_ORIGINS=* ollama serve
```

Then point Settings → Local Engine at `http://localhost:11434` and hit
**Save & test**. LM Studio, llama.cpp's server and Jan work too — switch the
request format to *Local server*.

`OLLAMA_ORIGINS=*` matters: without it the browser's origin check blocks the
request and the engine looks dead when it is actually running fine.

Your prompts go to localhost and stop there. Turn off the network entirely from
the Control Panel and the assistant keeps working, because the model is local.

---

## The vault

Tasks and notes are encrypted at rest with a passphrase:

- **PBKDF2-SHA256**, 310,000 iterations, random 16-byte salt per vault
- **AES-GCM 256**, random 12-byte IV per record, authenticated so tampering fails loudly
- The key is derived in memory and marked non-extractable; the passphrase is never stored

Locked, Zero holds nothing: localStorage contains only ciphertext and the
in-memory copy is dropped. **Panic** locks it instantly.

**There is no reset.** Nobody can recover your data without the passphrase —
not you, not me, not anyone with the device. That is the property that makes it
worth having. Write it down somewhere safe.

---

## Privacy — what's true and what isn't

**What's genuinely true:**
- No server, no accounts, no analytics, no telemetry, no cookies, no tracking pixels
- No third-party requests at all: no CDNs, no web fonts, no remote scripts
- Your prompts never leave the machine — the model runs locally
- Tasks and notes are encrypted at rest; locked, they are unreadable without your passphrase
- You can export or wipe everything with one click
- Every line is in this folder, auditable

**What is NOT true, and I won't pretend otherwise:**
Zero cannot make you untraceable. While the network switch is on it fetches
crypto prices, and that traffic is visible to your network and your ISP — they
see *that* you contacted a price API, though not your data or prompts. Beyond
that: your device itself, your browser profile, your operating system and anyone
with physical access remain outside what an app can defend. Full-disk encryption
and a locked OS account are the layer beneath this one, and network-level privacy
is a job for tools built for it — each with real limits of its own.

Switch the network off and Zero goes fully offline: assistant, tasks, notes and
vault all keep working with zero outbound traffic. That is the strongest honest
claim available, and it is verifiable in the activity log.

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
- [ ] Vault-backed encrypted export
- [ ] Plugin system so new capabilities drop in without touching core
- [x] Local-model support (Ollama) so the assistant runs fully offline
- [ ] PWA install so Zero works as a desktop/mobile app
