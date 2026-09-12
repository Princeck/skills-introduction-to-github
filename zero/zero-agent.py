#!/usr/bin/env python3
"""
ZERO AGENT — the local operator that can run commands on THIS machine.

This is the powerful part, so it is deliberately separate, opt-in, and
built to keep you in control:

  • It listens on 127.0.0.1 only — nothing off your machine can reach it.
  • Every request needs a one-time TOKEN printed below when it starts.
    Paste that token into Zero once (Operator panel). A random web page
    cannot guess it, so it cannot drive this agent.
  • Nothing runs on its own. Zero (or the AI you gave Zero) can *propose*
    a command, but it only executes when YOU click Run in the Operator
    panel. This process just carries out an approved command and reports
    what happened.
  • A small denylist blocks obviously catastrophic commands (disk format,
    rm -rf /, etc.) unless you start it with ZERO_AGENT_ALLOW_DANGEROUS=1.
  • Every command and its output is appended to zero-agent.log next to
    this file, so there is always a record.

Run:  python3 zero-agent.py            (defaults to port 8770)
      python3 zero-agent.py 8771       (custom port)

Then in Zero: Operator panel → paste the token → Connect.

Stop it any time with Ctrl+C. Closing this window ends the agent.
"""

import json
import os
import platform
import re
import secrets
import subprocess
import sys
import time
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

HERE = os.path.dirname(os.path.abspath(__file__))
LOG = os.path.join(HERE, "zero-agent.log")
TOKEN = secrets.token_urlsafe(18)
IS_WINDOWS = platform.system() == "Windows"
MAX_OUTPUT = 200_000          # bytes of stdout/stderr kept per command
DEFAULT_TIMEOUT = 120         # seconds a command may run
ALLOW_DANGEROUS = os.environ.get("ZERO_AGENT_ALLOW_DANGEROUS") == "1"

# Commands that are almost never what you meant and can wreck a machine.
# Blocked by default; set ZERO_AGENT_ALLOW_DANGEROUS=1 to lift the guard.
DANGER = [
    r"\brm\s+-rf?\s+[/~]\s*$", r"\brm\s+-rf?\s+/\s", r":\(\)\s*\{.*\};:",  # fork bomb
    r"\bmkfs\b", r"\bformat\s+[a-zA-Z]:", r"\bdiskpart\b",
    r"\bdel\s+/[fsq].*\\", r"format-volume", r"clear-disk",
    r"\bshutdown\b", r"\breboot\b", r">\s*/dev/sd[a-z]",
    r"\bdd\b.*of=/dev/", r"remove-item.*-recurse.*[cC]:\\",
]


def log_line(text):
    stamp = datetime.now(timezone.utc).isoformat(timespec="seconds")
    try:
        with open(LOG, "a", encoding="utf-8") as f:
            f.write(f"[{stamp}] {text}\n")
    except Exception:
        pass


def is_dangerous(cmd):
    low = cmd.lower()
    return any(re.search(p, low) for p in DANGER)


def build_argv(cmd, shell):
    """Wrap the user's command string for the chosen shell."""
    if IS_WINDOWS:
        if shell == "cmd":
            return ["cmd", "/c", cmd]
        return ["powershell", "-NoProfile", "-NonInteractive", "-Command", cmd]
    return [shell or "/bin/sh", "-lc", cmd]


class Handler(BaseHTTPRequestHandler):
    server_version = "ZeroAgent/1.0"

    # ---- helpers --------------------------------------------------------
    def _cors(self):
        origin = self.headers.get("Origin", "*")
        self.send_header("Access-Control-Allow-Origin", origin)
        self.send_header("Vary", "Origin")
        self.send_header("Access-Control-Allow-Headers", "content-type, x-zero-token")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")

    def _json(self, code, obj):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self._cors()
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        try:
            self.wfile.write(body)
        except Exception:
            pass

    def _authed(self):
        return secrets.compare_digest(self.headers.get("X-Zero-Token", ""), TOKEN)

    def log_message(self, *a):
        pass  # our own audit log is the record; keep the console clean

    # ---- routes ---------------------------------------------------------
    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_GET(self):
        if self.path.rstrip("/") == "/api/agent/ping":
            return self._json(200, {
                "ok": True, "agent": "zero", "version": "1.0",
                "os": platform.system(), "release": platform.release(),
                "cwd": os.getcwd(), "shell": "powershell" if IS_WINDOWS else "sh",
                "dangerous_allowed": ALLOW_DANGEROUS,
            })
        return self._json(404, {"error": "unknown endpoint"})

    def do_POST(self):
        if self.path.rstrip("/") != "/api/agent/exec":
            return self._json(404, {"error": "unknown endpoint"})
        if not self._authed():
            return self._json(401, {"error": "Bad or missing token. Paste the token printed by the agent into Zero's Operator panel."})

        try:
            length = int(self.headers.get("Content-Length", 0))
            req = json.loads(self.rfile.read(length) or b"{}")
        except Exception:
            return self._json(400, {"error": "bad request body"})

        cmd = (req.get("cmd") or "").strip()
        if not cmd:
            return self._json(400, {"error": "no command"})
        shell = req.get("shell") or ""
        cwd = req.get("cwd") or os.getcwd()
        timeout = min(int(req.get("timeout") or DEFAULT_TIMEOUT), 600)

        if is_dangerous(cmd) and not ALLOW_DANGEROUS:
            log_line(f"BLOCKED (dangerous): {cmd}")
            return self._json(200, {
                "blocked": True, "code": None,
                "stdout": "", "stderr": "",
                "error": "Refused: this looks destructive (disk/format/mass-delete). "
                         "If you really mean it, restart the agent with "
                         "ZERO_AGENT_ALLOW_DANGEROUS=1.",
            })

        log_line(f"RUN ({cwd}): {cmd}")
        started = time.time()
        try:
            argv = build_argv(cmd, shell)
            proc = subprocess.run(
                argv, cwd=cwd, capture_output=True, text=True,
                timeout=timeout, encoding="utf-8", errors="replace",
            )
            out = (proc.stdout or "")[:MAX_OUTPUT]
            err = (proc.stderr or "")[:MAX_OUTPUT]
            dur = round(time.time() - started, 2)
            log_line(f"DONE code={proc.returncode} in {dur}s")
            return self._json(200, {
                "blocked": False, "code": proc.returncode,
                "stdout": out, "stderr": err, "duration": dur, "cwd": cwd,
            })
        except subprocess.TimeoutExpired:
            log_line(f"TIMEOUT after {timeout}s: {cmd}")
            return self._json(200, {"blocked": False, "code": None, "stdout": "",
                                    "stderr": f"Command timed out after {timeout}s.", "cwd": cwd})
        except FileNotFoundError as e:
            return self._json(200, {"blocked": False, "code": None, "stdout": "",
                                    "stderr": f"Shell not found: {e}", "cwd": cwd})
        except Exception as e:
            log_line(f"ERROR: {e}")
            return self._json(200, {"blocked": False, "code": None, "stdout": "",
                                    "stderr": f"Could not run: {e}", "cwd": cwd})


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8770
    httpd = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    bar = "─" * 52
    print("┌" + bar)
    print(f"│  ZERO AGENT  →  http://127.0.0.1:{port}   ({platform.system()})")
    print(f"│  Working dir →  {os.getcwd()}")
    print("│")
    print("│  PAIRING TOKEN (paste into Zero → Operator → Connect):")
    print(f"│      {TOKEN}")
    print("│")
    print(f"│  Dangerous commands: {'ALLOWED' if ALLOW_DANGEROUS else 'blocked (default)'}")
    print(f"│  Audit log         : {LOG}")
    print("│  Every command needs your approval in Zero. Ctrl+C to stop.")
    print("└" + bar)
    log_line(f"AGENT START port={port} cwd={os.getcwd()} dangerous={ALLOW_DANGEROUS}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nAgent stopped.")
        log_line("AGENT STOP")


if __name__ == "__main__":
    main()
