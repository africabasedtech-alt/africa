#!/bin/bash
set -e
# AfricaBased post-merge setup
# - npm dependencies are managed by Replit's package tooling (no install needed here)
# - server.js runs migrations on startup (see startupMigrations)
# - workflow reconciliation will restart "Start application" automatically

if [ -f package.json ] && [ -d node_modules ]; then
  echo "node_modules present, skipping install"
elif [ -f package.json ]; then
  echo "Installing npm dependencies..."
  npm install --no-audit --no-fund --loglevel=error
fi

echo "Post-merge setup complete."
