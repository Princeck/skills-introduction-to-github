# Run Zero on your laptop — the complete guide

Everything Zero does, running on your own machine. Private, free, full-featured.
When you're ready, the last section puts it online.

---

## 1 · Install Python (once)

Download from **https://python.org/downloads** → on the first install screen
**tick “Add Python to PATH”** → Install. That's the only requirement for the
core app and all the live data (markets, flights, space, maps, news).

*(Optional, for the native C++ recall core: a C++ compiler — see step 5.)*

---

## 2 · Get the Zero files

- On the GitHub repo: green **Code ▸ Download ZIP**, unzip it, open the **`zero`**
  folder. (Or `git clone` the repo and `cd` into `zero`.)
- Open that folder in **VS Code** if you like: *File ▸ Open Folder ▸ zero*.

---

## 3 · Start Zero

**Windows:** double-click **`start-zero.bat`**. A window opens and your browser
lands on Zero.

**Or type it** (VS Code *Terminal ▸ New Terminal*, or Windows Terminal in the
folder):

```powershell
py server.py        # mac/linux: python3 server.py
```

Then open **http://localhost:8080**. Leave the terminal window open while you
use Zero; close it to stop.

> Running through `server.py` (not just double-clicking the HTML) is what turns
> on the **flight radar**, the **AI bridge**, and the **C++ core** — they need a
> local server. Everything else works either way.

---

## 4 · Give Zero a brain (AI)

**API Center** (or Settings → Zero Core → Any AI):

- Pick a provider — **OpenAI**, **Anthropic**, or any **OpenAI-compatible**
  host (OpenRouter, Groq, Together, DeepSeek…).
- Paste your **API key**, set the **model** (e.g. `gpt-4o-mini`,
  `claude-3-5-sonnet-latest`), **Save & test**.
- Your key stays on this device. Turn on the **vault** (Settings) to encrypt it.

Fully private alternative: install **Ollama**, run `OLLAMA_ORIGINS=* ollama serve`,
and point Zero Core at `http://localhost:11434`.

---

## 5 · Turn on the extras (optional)

- **Native C++ recall core** — build it once so `recall <query>` runs in native
  code. Needs a compiler (Windows: “Build Tools for Visual Studio”, or MinGW).
  Then: double-click **`build-core.bat`** (mac/linux: `./build-core.sh`) and
  restart `server.py`. The banner shows `C++ core → built ✓`.

- **Operator — run commands on your PC** — double-click **`start-agent.bat`**
  (or `py zero-agent.py`). Copy the **token** it prints into Zero → **Operator**
  → **Connect**. Now Zero can run commands you approve.

- **Flight radar (Sky)** — just works once `server.py` is running. Click
  **📍 Use my location** to centre it on you.

- **Space** — orrery, ISS, and NASA Earth photo work with no setup at all.

- **Zero's voice** — Settings → Zero's Voice → play the sample, or add your
  **ElevenLabs** key + voice id to have Zero speak everything in its own voice.

---

## 6 · Make it feel like an app (optional)

In Chrome/Edge, click the **install icon** in the address bar (or Settings →
**Install Zero**). It gets its own window and icon. Add it to **Windows Startup
apps** and it greets you every time you open your laptop.

---

## 7 · Make it public — later, when you're ready

Keep Zero on your laptop but give it a public URL (free, ~5 min), so you can
reach it from your phone or anywhere — with **all** features still working,
whenever your laptop is on.

**Cloudflare Tunnel (free, no server to buy):**

1. Install `cloudflared` (https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/).
2. Start Zero as usual: `py server.py`
3. In a second terminal:
   ```powershell
   cloudflared tunnel --url http://localhost:8080
   ```
4. It prints a public `https://…trycloudflare.com` URL. That's Zero, live.
   (A fixed custom domain is a few more steps — ask me when you want it.)

When you'd rather it run 24/7 even with your laptop off, that's the moment to
rent a small VPS (~$5/mo) and run the same `server.py` there. Same app, same
steps — just on an always-on machine.

---

## The one button that matters

Top-right **STOP** (or double-tap **Esc**) halts everything Zero is doing —
network, voice, the lot — instantly. You're always in control.
