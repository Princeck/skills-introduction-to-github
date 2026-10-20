#!/usr/bin/env bash
# Build the native C++ core. Needs g++ or clang++ (any recent version).
set -e
cd "$(dirname "$0")"
CXX="${CXX:-$(command -v g++ || command -v clang++)}"
if [ -z "$CXX" ]; then
  echo "No C++ compiler found. Install g++ (Linux: sudo apt install g++, macOS: xcode-select --install)."
  exit 1
fi
echo "Building zero-core with $CXX ..."
"$CXX" -O2 -std=c++17 -o zero-core zero-core.cpp
echo "✓ built ./zero-core"
echo "  The Python server will pick it up automatically on its next start."
