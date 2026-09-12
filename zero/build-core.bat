@echo off
REM Build the native C++ core on Windows.
REM Works with MSVC (cl) if you opened a "Developer Command Prompt",
REM or with g++ from MinGW-w64 / MSYS2 if it is on your PATH.
cd /d "%~dp0"

where cl >nul 2>nul
if %errorlevel%==0 (
  echo Building zero-core.exe with MSVC cl ...
  cl /O2 /EHsc /std:c++17 zero-core.cpp /Fe:zero-core.exe >nul
  if exist zero-core.exe ( echo ^> built zero-core.exe & goto done )
)

where g++ >nul 2>nul
if %errorlevel%==0 (
  echo Building zero-core.exe with g++ ...
  g++ -O2 -std=c++17 -o zero-core.exe zero-core.cpp
  if exist zero-core.exe ( echo ^> built zero-core.exe & goto done )
)

echo.
echo No C++ compiler found.
echo   Option A: install "Build Tools for Visual Studio" (gives you cl),
echo             then run this from the Developer Command Prompt.
echo   Option B: install MSYS2 / MinGW-w64 and make sure g++ is on PATH.
echo   Zero still works without the native core - it just falls back to
echo   the built-in search.
echo.
pause
exit /b 1

:done
echo   The Python server picks it up automatically on its next start.
