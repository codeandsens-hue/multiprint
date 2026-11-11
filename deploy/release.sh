#!/usr/bin/env bash
# Build locally and push a release to the VPS. Usage: deploy/release.sh [ssh-host]
# The host defaults to "multiprint" (an entry in ~/.ssh/config).
set -euo pipefail
host="${1:-multiprint}"
cd "$(dirname "$0")/.."

npm run build
rsync -azR --delete \
  --exclude node_modules --exclude .env \
  dist server src/data package.json package-lock.json "$host:/var/www/multiprint/"
ssh "$host" 'cd /var/www/multiprint && npm ci --omit=dev --no-audit --no-fund && sudo systemctl restart multiprint && sleep 2 && systemctl is-active multiprint'
echo "Released to $host"
