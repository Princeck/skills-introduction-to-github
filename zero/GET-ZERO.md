# Get Zero on your laptop — the simple way

Two setups. **Basic** takes 2 minutes and gives you everything except open-ended
AI chat. **Full** adds the local AI brain.

---

## 🪟 Windows — one click (fastest)

1. Install **[Python](https://python.org/downloads)** — on the first screen tick
   **“Add Python to PATH”**, then Install.
2. Get this repo: green **Code ▸ Download ZIP**, unzip it, open the `zero` folder.
3. **Double-click `start-zero.bat`.** A black window opens and your browser lands
   on Zero. Leave that window open while you use it; close it to stop Zero.

Prefer to type it yourself? Open the `zero` folder in **VS Code**, then
**Terminal ▸ New Terminal** (or Windows Terminal in the folder) and run:

```powershell
py server.py 8080
```

Then open **http://localhost:8080**. To give Zero any AI, go to **Settings →
Zero Core — Any AI**, pick your provider, paste your API key, set the model,
**Save & test**.

---

## ⚡ Basic — Zero running as an installed app (2 min)

You need [Python](https://python.org) (already on most Macs/Linux) **or**
[Node](https://nodejs.org). Either works.

1. **Get the folder.** Download the repo (green **Code ▸ Download ZIP** on GitHub),
   unzip it, and find the `zero` folder inside.

2. **Start it.** Open a terminal *in the `zero` folder* and run one line:

   ```bash
   python3 -m http.server 8080
   ```
   (No Python? Use Node: `npx serve -l 8080`)

3. **Open it.** Go to **http://localhost:8080** in Chrome or Edge.

4. **Install it.** Click the **install icon** in the address bar (or Settings →
   **Install Zero**). Now it has its own icon and window — launch it like any app.

That's it. Markets, news, cooking, security, files, voice, the daily briefing —
all working.

> **Why not just double-click `index.html`?** That opens as a `file://` page, where
> browsers block installing, the microphone, and file access. Serving on
> `localhost` (step 2) is what unlocks the full app. It's one line.

---

## 🧠 Full — add Zero's AI brain (10 min, optional)

This lets Zero hold open conversations. The model runs on your machine — no
account, no company, nothing leaves your laptop.

1. Install **[Ollama](https://ollama.com)** (one download).

2. Pull a model and start it so Zero can reach it:

   ```bash
   ollama pull llama3.2
   OLLAMA_ORIGINS=* ollama serve
   ```
   (`OLLAMA_ORIGINS=*` matters — without it the browser blocks Zero.)

3. In Zero: **Settings → Zero Core**, leave the address as
   `http://localhost:11434`, hit **Save & test**. It should say *Core online*.

Now talking to Zero uses your local model. Turn it off any time — everything
else keeps working without it.

---

## ⌘ Operator — let Zero run commands on your machine (advanced)

This turns Zero into a hands-on assistant that can run commands, open apps and
drive your laptop. It is deliberately separate and opt-in, and **you approve
every command** — nothing runs on its own.

1. In the `zero` folder, start the agent (double-click **`start-agent.bat`** on
   Windows, or run it):

   ```bash
   python3 zero-agent.py
   ```

2. It prints a **pairing token**. In Zero go to the **Operator** panel, paste the
   token, and click **Connect**.

3. Now you can:
   - type a command and press **▶ Run**, or
   - describe a task in plain English and let the AI **propose** a command —
     which you review and run.

**Safety by design:** the agent listens on `127.0.0.1` only (nothing off your
machine can reach it), needs the token on every request, obeys Zero's **STOP**
switch, refuses catastrophic commands (disk format, mass delete) unless you
start it with `ZERO_AGENT_ALLOW_DANGEROUS=1`, and writes every command to
`zero-agent.log`.

---

## 🚀 Make it open on its own (optional)

- **Launch at startup:** after installing, add it to Windows *Startup apps* or
  macOS *Login Items*. With the daily briefing on, it greets you with the market
  the moment your laptop opens.
- **Put it online / in an app store:** host the `zero` folder on GitHub Pages
  (this repo has a workflow — Settings → Pages → Source: *GitHub Actions*) or drag
  it into [Netlify](https://netlify.com). Then wrap that URL with
  [PWABuilder](https://pwabuilder.com) for the Microsoft Store or Google Play.

---

## The one button that matters

Top-right corner, the small **■**. One tap stops everything Zero is doing —
network, voice, the lot. Double-tap **Esc** does the same from anywhere. You are
always in control.
