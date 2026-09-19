@echo off
REM ============================================================
REM  ZERO — one-click launcher for Windows
REM  Double-click this file. It starts Zero's local server and
REM  opens it in your browser. Close the window to stop Zero.
REM ============================================================
title ZERO
cd /d "%~dp0"

REM Find Python (py launcher first, then python on PATH).
set "PY="
where py >nul 2>nul && set "PY=py"
if not defined PY ( where python >nul 2>nul && set "PY=python" )

if not defined PY (
  echo.
  echo   Python is not installed.
  echo   Get it from https://python.org  ^(tick "Add Python to PATH"^), then
  echo   double-click this file again.
  echo.
  pause
  exit /b 1
)

echo.
echo   Starting ZERO ...  http://localhost:8080
echo   Leave this window open. Close it to stop Zero.
echo.

REM Open the browser a moment after the server comes up.
start "" /b cmd /c "timeout /t 2 >nul & start http://localhost:8080"

%PY% server.py 8080
