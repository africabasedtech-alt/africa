#!/bin/bash
set -e

if [ -z "$GITHUB_PERSONAL_ACCESS_TOKEN" ]; then
  echo "ERROR: GITHUB_PERSONAL_ACCESS_TOKEN is not set"
  exit 1
fi

# Disable Replit's git credential interceptor so the token in the URL is used directly
unset GIT_ASKPASS
unset SSH_ASKPASS
export GIT_TERMINAL_PROMPT=0

REPO="https://oauth2:${GITHUB_PERSONAL_ACCESS_TOKEN}@github.com/africabasedtech-alt/africa.git"

echo "==> Removing stale lock file (if any)..."
rm -f .git/index.lock

echo "==> Setting authenticated remote URL..."
git remote set-url origin "$REPO"

echo "==> Configuring credential helper to use token..."
git config credential.helper ""

echo "==> Pulling latest remote changes (rebase)..."
git pull --rebase origin main

echo "==> Pushing to GitHub..."
git push origin main

echo ""
echo "Done! GitHub push successful."
echo "Your deploy workflow will now trigger automatically on GitHub Actions."
