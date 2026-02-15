#!/bin/bash

# cleanup-e2e.sh - Ensure a clean environment for Playwright tests

echo "🧹 Starting E2E cleanup..."

# 1. Kill any process on port 3000 (Next.js)
if lsof -t -i:3000 >/dev/null; then
  echo "🔫 Killing process on port 3000..."
  fuser -k 3000/tcp || true
fi

# 2. Kill lingering Playwright/Browser processes
echo "🔫 Killing Playwright and browser processes..."
pkill -f playwright || true
pkill -f "next-dev" || true
pkill -f "chromium" || true

# 3. Small wait to ensure ports are released
sleep 2

echo "✅ Environment is clean. Ready for tests."
