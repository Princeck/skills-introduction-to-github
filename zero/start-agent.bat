@echo off
REM ============================================================
REM  ZERO OPERATOR AGENT — one-click launcher for Windows
REM  Double-click this file. It starts the local agent that can
REM  run commands on THIS machine. It prints a pairing TOKEN —
REM  copy that into Zero: Operator panel -> paste -> Connect.
REM  Close this window to stop the agent.
REM ============================================================
title ZERO AGENT
cd /d "%~dp0"

set "PY="
where py >nul 2>nul && set "PY=py"
if not defined PY ( where python >nul 2>nul && set "PY=python" )

if not defined PY (
  echo.
  echo   Python is not installed. Get it from https://python.org
  echo   ^(tick "Add Python to PATH"^), then run this again.
  echo.
  pause
  exit /b 1
)

echo.
echo   Starting the ZERO operator agent...
echo   Copy the TOKEN below into Zero -^> Operator -^> Connect.
echo.
%PY% zero-agent.py 8770
