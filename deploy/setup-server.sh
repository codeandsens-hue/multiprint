#!/usr/bin/env bash
# One-time setup of an OVH VPS (Ubuntu). Run with sudo on the server:
#   sudo DOMAIN=example.com DEPLOY_USER=ubuntu bash setup-server.sh
# Add EMAIL=you@example.com to also get an HTTPS certificate (DOMAIN and www.DOMAIN must point here).
set -euo pipefail
: "${DOMAIN:?set DOMAIN}" "${DEPLOY_USER:?set DEPLOY_USER (the SSH user that runs release.sh)}"
here="$(cd "$(dirname "$0")" && pwd)"

apt-get update
apt-get install -y nginx certbot python3-certbot-nginx ufw rsync

# Node.js 22.13+ (the server uses the built-in node:sqlite)
if ! node -e 'const [a,b]=process.versions.node.split(".").map(Number);process.exit(a>22||(a===22&&b>=13)?0:1)' 2>/dev/null; then
  apt-get install -y nodejs npm
fi

id multiprint >/dev/null 2>&1 || useradd --system --no-create-home --shell /usr/sbin/nologin multiprint
# Code is owned by the deploy user (release.sh writes it); data only by the app
mkdir -p /var/www/multiprint /var/lib/multiprint
chown "$DEPLOY_USER:$DEPLOY_USER" /var/www/multiprint
chown multiprint:multiprint /var/lib/multiprint
chmod 750 /var/lib/multiprint

# ADMIN_PASSWORD is added by hand (first start only); keep the file root-only
touch /etc/multiprint.env
chmod 600 /etc/multiprint.env

install -m 644 "$here/multiprint.service" /etc/systemd/system/multiprint.service
systemctl daemon-reload
systemctl enable multiprint

sed "s/__DOMAIN__/$DOMAIN/g" "$here/nginx.conf" > /etc/nginx/sites-available/multiprint
ln -sf /etc/nginx/sites-available/multiprint /etc/nginx/sites-enabled/multiprint
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

if [ -n "${EMAIL:-}" ]; then
  domains=(-d "$DOMAIN")
  [ "${NO_WWW:-}" ] || domains+=(-d "www.$DOMAIN")
  certbot --nginx --non-interactive --agree-tos -m "$EMAIL" "${domains[@]}" --redirect
fi

echo "Server ready. Now run deploy/release.sh from your computer."
