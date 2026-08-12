# ZERO

A private, local-first personal assistant with live market readings, tasks, notes,
and a master control panel with an always-visible kill switch. Its reasoning
engine, Zero Core, runs on your own hardware — no vendor, no account, no key.

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

Zero opens straight into the assistant — there is no dashboard. Talking to it is
the home screen; everything else is a side panel you visit when you need it.

- **Overview** — a live command screen: reactive orb, markets, headlines, system state
- **Wake word** — say “Zero, …” and it acts on what follows (read the warning below)
- **Security** — password strength, breach exposure, and a hardening checklist for your own sites
- **Memory** — say `remember …` and Zero carries it into every future conversation
- **Apps** — launch your tools by name: `open figma`
- **Voice** — Zero speaks replies aloud and takes dictation from the mic
- **Built-in skills** — maths, unit and currency conversion, code scaffolds, hashes, slugs, passwords: all with no model
- **Charts** — real price history drawn on canvas, with indicators computed from it
- **News** — live top stories, no key
- **Markets** — live crypto prices (BTC, ETH, SOL, BNB, XRP, DOGE), auto-refresh every 60s
- **Assistant** — built-in commands (`help`, `task …`, `note …`, `price btc`, `tasks`, `time`) that need no model at all, plus open conversation through a local engine
- **Tasks / Notes** — saved locally, export to JSON anytime
- **Settings** — local engine, vault passphrase, data export, full wipe

---

## Zero Core

Core is Zero's reasoning engine. It is not a front-end for anyone's hosted AI —
there is no vendor, no account, no API key and no telemetry. Core drives a model
on your own hardware and speaks two wire formats, so the runtime underneath is
yours to choose and swap:

| Format | Endpoint |
|---|---|
| Native | `/api/chat` |
| Compatible | `/v1/chat/completions` |

Point Settings → Zero Core at your engine's address and hit **Save & test**.
Leave the model blank and Core adopts whichever model your engine actually has,
rather than assuming one is installed.

**Reasoning.** Tick *Show reasoning* and Core asks the model to work through the
problem in `<think>` tags. Zero renders that working in its own panel, separate
from the answer, so you can see how it got there — and so reasoning is never
mistaken for a conclusion.

**Update on command.** Type `update` (or hit *Update now*) and Zero pulls fresh
market readings and re-checks Core. Nothing rewrites its own code behind your
back; updates happen when you say so, and every one is logged.

### Running an engine

Core works with any local runtime speaking one of those formats. These are
open-source runtimes you install and run yourself, not hosted services — which
is why they are named here: you cannot install software you cannot name.

```bash
ollama pull <a-model>
OLLAMA_ORIGINS=* ollama serve
```

That environment variable matters. Serving Zero from a file means the runtime
must be told to accept it; without it the browser blocks the request and a
perfectly healthy engine looks dead.

---

## Memory and storage

Zero keeps everything in IndexedDB on this device — typically hundreds of
megabytes to gigabytes, against the ~5 MB a browser allows the simpler store it
used before. Records written by the old version migrate automatically on first
run, and the old copy is only deleted once the new one is confirmed written.

`remember I trade XAUUSD on Fridays` stores a fact Zero brings into every later
conversation. `memories` lists them, `forget 2` drops one. They live with your
tasks and notes: encrypted when the vault is on, gone from memory when it locks.

Working context also grew — Zero now carries 24 recent messages into each turn
rather than 8.

---

## Always-listening

The Overview screen has a wake-word mode: say “Zero, …” and it acts on what
follows. A reactive orb shows what it is doing — idle, hearing, thinking,
speaking.

**Understand the trade before arming it.** Browsers do speech recognition in the
cloud. While the wake word is armed, audio from your microphone streams
continuously to the browser's speech service — not only when you address Zero,
but whatever else is said near the machine. Zero cannot change that; it is how
browser dictation works.

So it is off by default, it asks once in plain words, a red bar sits across the
top of the screen the entire time it is live, and the Control Panel's network
switch kills it like anything else. The press-to-talk mic button sends far less
and is the better default.

---

## Security

Zero's security tooling is **defensive**. It hardens what you own.

- **Password strength** — entropy from the character space actually used, with penalties for the patterns that make a long password weak anyway, and an offline-guessing estimate at a pessimistic 100 billion tries/second.
- **Breach exposure** — checks whether a password appears in public breach data. It is hashed on your device and **only the first five characters of that hash are sent**; the service returns every suffix sharing that prefix and the match happens locally. The service never learns which password you asked about.
- **Hardening checklist** — the controls that matter for the sites and games you ship, ordered by how often each one is what actually went wrong.

There is no scanner, no exploit and no payload, and I won't add them. A tool
built to break into other people's systems is a liability to whoever owns it
first, and legitimate security work happens inside written authorisation with a
toolchain that does not live in a browser tab.

---

## Apps

Add a name and a link, then say `open figma`. Anything the operating system can
open works: `https://…`, `vscode://`, `figma://`, `spotify:`.

Being precise about what this is: **a web page cannot reach inside other
programs.** That boundary is exactly why opening a browser is safe. What Zero
can do is hand a link to your OS and let it pick the app — which is how every
deep link works. Launching, yes. Controlling, no; anything claiming otherwise
from a browser tab is misleading you.

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

## Market data — real, or absent

Every figure Zero displays is fetched from a live feed. Nothing is simulated,
sampled or filled in.

- **Crypto** — CoinGecko's public API, no key, refreshed every 60s
- **Stocks & indices** — live quotes via a free [Finnhub](https://finnhub.io) key in Settings, with your own symbol list

Where a feed returns no value, Zero prints **—**. It will not render a missing
24h change as `0.00%`, and it will not print `$0.00` for a symbol the feed
doesn't recognise — both are numbers nobody reported. When a fetch fails the
table empties rather than leaving stale prices on screen looking current.

---

## Charts and market analysis

`chart btc 90` pulls real price history and draws it, then prints indicators
computed from that history: change, range, position in range, moving averages,
RSI(14) and annualised volatility.

Every one of those is arithmetic over prices that have **already happened**.
They describe the past. Zero deliberately exposes no function that returns "up"
or "down", because no honest one exists — if a 99%-accurate market predictor
were possible, it would not be a feature in a personal assistant.

What actually separates traders who survive from those who don't is position
sizing and risk limits, which is why the chart footer says so every time.

---

## Voice

- **Speaking** uses the browser's own speech engine and prefers an on-device voice. Nothing is transmitted.
- **Listening** is not equivalent: browser dictation uploads your audio to the browser vendor's speech service to transcribe it. Zero treats the mic as a network capability — off by default, warned on first use, and cut by the network switch like anything else.

---

## ⚠️ Not financial advice

Market data in Zero is **information only**. It may be delayed, aggregated, or
wrong. Nothing here is a recommendation to buy or sell anything. Trading carries
real risk of loss. Do your own research and consider talking to a licensed
professional.

---

## Roadmap

- [x] Live stocks & indices via Finnhub
- [ ] Price alerts and watchlist
- [ ] Vault-backed encrypted export
- [ ] Plugin system so new capabilities drop in without touching core
- [x] Local engine so the assistant runs fully offline
- [x] Reasoning mode and update-on-command
- [ ] PWA install so Zero works as a desktop/mobile app
