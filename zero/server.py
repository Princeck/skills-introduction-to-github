#!/usr/bin/env python3
"""
ZERO — Python server + AI bridge

Runs Zero as a proper local web app AND bridges it to any AI provider you
give an API key to. Standard library only — no pip install.

What it does
------------
1. Serves the Zero app (this folder) over http://localhost:8080 — which is
   what unlocks Install, the microphone and file access (a file:// page can't).
2. Exposes a tiny local API that looks to Zero exactly like a local engine
   (the same /api/tags and /api/chat Ollama speaks), but forwards your prompt
   to the hosted provider you configured, streaming the reply back.

So Zero stays Zero — you're just choosing whose model answers.

Your key
--------
The key lives HERE, on your machine, in an environment variable or a small
config file next to this script. It is never put in the browser and never
logged. Zero (the page) never sees it — it only talks to this local server,
which holds the key and talks to the provider.

Configure it one of two ways:

  A) Environment variables (nothing written to disk):
       export ZERO_PROVIDER=openai            # openai | anthropic | compatible
       export ZERO_API_KEY=sk-...
       export ZERO_MODEL=gpt-4o-mini
       # for 'compatible' (OpenRouter, Groq, Together, Mistral, DeepSeek, ...):
       export ZERO_BASE_URL=https://openrouter.ai/api/v1
       python3 server.py

  B) A file 'zero.config.json' next to this script:
       { "provider": "openai", "api_key": "sk-...", "model": "gpt-4o-mini" }

Then in Zero: Settings -> Zero Core, set the address to this server
(click "Use bundled bridge", or type http://localhost:8080), and Save & test.

Provider quick reference
------------------------
  openai      base defaults to https://api.openai.com/v1
  anthropic   base defaults to https://api.anthropic.com   (Claude models)
  compatible  you set ZERO_BASE_URL; works for OpenRouter, Groq, Together,
              Mistral, DeepSeek, Perplexity, local vLLM/LM Studio, etc.

Run:  python3 server.py            (defaults to port 8080)
      python3 server.py 9000       (custom port)
"""

import json
import os
import sys
import urllib.request
import urllib.error
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from functools import partial

HERE = os.path.dirname(os.path.abspath(__file__))

DEFAULT_BASES = {
    "openai": "https://api.openai.com/v1",
    "anthropic": "https://api.anthropic.com",
    "compatible": "",  # user must supply ZERO_BASE_URL
}


def load_config():
    """Env vars win; then zero.config.json; then harmless defaults."""
    cfg = {}
    path = os.path.join(HERE, "zero.config.json")
    if os.path.exists(path):
        try:
            with open(path) as f:
                cfg = json.load(f)
        except Exception as e:
            print(f"! could not read zero.config.json: {e}", file=sys.stderr)
    provider = os.environ.get("ZERO_PROVIDER", cfg.get("provider", "compatible")).lower()
    return {
        "provider": provider,
        "api_key": os.environ.get("ZERO_API_KEY", cfg.get("api_key", "")),
        "model": os.environ.get("ZERO_MODEL", cfg.get("model", "")),
        "base_url": (os.environ.get("ZERO_BASE_URL", cfg.get("base_url", ""))
                     or DEFAULT_BASES.get(provider, "")).rstrip("/"),
    }


def _ndjson(content):
    """One streaming line in the Ollama-native shape Zero already reads."""
    return (json.dumps({"message": {"content": content}, "done": False}) + "\n").encode()


class Handler(SimpleHTTPRequestHandler):
    # ---- shared helpers -------------------------------------------------
    def _cors(self):
        # Local dev server; allow the app to reach it however it was opened.
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "content-type")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def log_message(self, fmt, *args):
        # Quiet, and NEVER print request bodies (which could carry prompts).
        sys.stderr.write("· %s\n" % (fmt % args))

    # ---- routing --------------------------------------------------------
    def do_GET(self):
        if self.path.rstrip("/") == "/api/tags":
            return self._tags()
        return super().do_GET()

    def do_POST(self):
        if self.path.rstrip("/") == "/api/chat":
            return self._chat()
        self.send_error(404, "Zero server: unknown endpoint")

    # ---- /api/tags : lets Zero's "Save & test" see a model --------------
    def _tags(self):
        cfg = load_config()
        name = cfg["model"] or "(set ZERO_MODEL)"
        body = json.dumps({"models": [{"name": name}]}).encode()
        self.send_response(200)
        self._cors()
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    # ---- /api/chat : proxy to the provider, stream the reply back -------
    def _chat(self):
        cfg = load_config()
        try:
            length = int(self.headers.get("Content-Length", 0))
            req = json.loads(self.rfile.read(length) or b"{}")
        except Exception:
            return self._fail(400, "Bad request body.")

        # Request may override config per-call (a future UI could pass these).
        provider = (req.get("provider") or cfg["provider"]).lower()
        api_key = req.get("key") or cfg["api_key"]
        model = req.get("model") or cfg["model"]
        base = (req.get("base_url") or cfg["base_url"]).rstrip("/") or DEFAULT_BASES.get(provider, "")
        messages = req.get("messages", [])

        if not api_key:
            return self._stream_error("No API key set. Give the server one — see server.py header (ZERO_API_KEY or zero.config.json).")
        if not model:
            return self._stream_error("No model set. Set ZERO_MODEL (e.g. gpt-4o-mini or claude-3-5-sonnet-latest).")
        if provider == "compatible" and not base:
            return self._stream_error("Provider 'compatible' needs ZERO_BASE_URL (e.g. https://openrouter.ai/api/v1).")

        try:
            upstream = self._build_upstream(provider, base, api_key, model, messages)
        except Exception as e:
            return self._stream_error(f"Could not build the request: {e}")

        # Begin the streamed NDJSON response to Zero.
        self.send_response(200)
        self._cors()
        self.send_header("Content-Type", "application/x-ndjson")
        self.end_headers()

        try:
            with urllib.request.urlopen(upstream, timeout=120) as resp:
                self._pump(provider, resp)
            self.wfile.write((json.dumps({"done": True}) + "\n").encode())
        except urllib.error.HTTPError as e:
            detail = e.read().decode("utf-8", "ignore")[:300]
            self._stream_tail(f"Provider returned {e.code}. {detail}")
        except Exception as e:
            self._stream_tail(f"Could not reach the provider: {e}")

    # ---- build the outbound request per provider ------------------------
    def _build_upstream(self, provider, base, api_key, model, messages):
        if provider == "anthropic":
            # Anthropic wants the system prompt separate from the turns.
            system = "\n".join(m["content"] for m in messages if m.get("role") == "system")
            turns = [{"role": m["role"], "content": m["content"]}
                     for m in messages if m.get("role") in ("user", "assistant")]
            payload = {"model": model, "max_tokens": 1024, "stream": True, "messages": turns}
            if system:
                payload["system"] = system
            url = (base or DEFAULT_BASES["anthropic"]) + "/v1/messages"
            headers = {
                "content-type": "application/json",
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01",
            }
        else:
            # openai / compatible : the OpenAI Chat Completions shape.
            payload = {"model": model, "stream": True, "messages": messages}
            url = (base or DEFAULT_BASES["openai"]) + "/chat/completions"
            headers = {"content-type": "application/json",
                       "authorization": "Bearer " + api_key}
        data = json.dumps(payload).encode()
        return urllib.request.Request(url, data=data, headers=headers, method="POST")

    # ---- read the provider's SSE stream, re-emit as NDJSON --------------
    def _pump(self, provider, resp):
        for raw in resp:
            line = raw.decode("utf-8", "ignore").strip()
            if not line or not line.startswith("data:"):
                continue
            data = line[5:].strip()
            if data == "[DONE]":
                break
            try:
                obj = json.loads(data)
            except Exception:
                continue
            piece = ""
            if provider == "anthropic":
                if obj.get("type") == "content_block_delta":
                    piece = obj.get("delta", {}).get("text", "")
            else:
                piece = (obj.get("choices", [{}])[0].get("delta", {}) or {}).get("content", "")
            if piece:
                self.wfile.write(_ndjson(piece))
                self.wfile.flush()

    # ---- error helpers --------------------------------------------------
    def _fail(self, code, msg):
        body = msg.encode()
        self.send_response(code)
        self._cors()
        self.send_header("Content-Type", "text/plain")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _stream_error(self, msg):
        """A clean 200 stream carrying just the message, so Zero shows it."""
        self.send_response(200)
        self._cors()
        self.send_header("Content-Type", "application/x-ndjson")
        self.end_headers()
        self._stream_tail("⚠ " + msg)

    def _stream_tail(self, msg):
        try:
            self.wfile.write(_ndjson(msg))
            self.wfile.write((json.dumps({"done": True}) + "\n").encode())
        except Exception:
            pass


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    cfg = load_config()
    handler = partial(Handler, directory=HERE)
    httpd = ThreadingHTTPServer(("127.0.0.1", port), handler)
    print("┌───────────────────────────────────────────────")
    print(f"│  ZERO server  →  http://localhost:{port}")
    print(f"│  AI bridge    →  provider: {cfg['provider']}"
          + (f", model: {cfg['model']}" if cfg["model"] else " (no model set)"))
    print(f"│  API key      →  {'set ✓' if cfg['api_key'] else 'NOT set — see server.py header'}")
    print("│  In Zero: Settings → Zero Core → Use bundled bridge → Save & test")
    print("│  Ctrl+C to stop.")
    print("└───────────────────────────────────────────────")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")


if __name__ == "__main__":
    main()
