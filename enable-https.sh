#!/usr/bin/env bash
# Active HTTPS (Let's Encrypt) pour MédiSahel. Prérequis : un nom de domaine dont l'enregistrement A
# pointe déjà vers l'IP publique du serveur, et les ports 80/443 ouverts.
# Usage : ./enable-https.sh clinique.exemple.ml admin@exemple.ml
set -euo pipefail
DOMAIN="${1:?Usage: ./enable-https.sh DOMAINE EMAIL}"
EMAIL="${2:?Usage: ./enable-https.sh DOMAINE EMAIL}"
cd "$(dirname "$0")"

sudo apt-get install -y certbot
sudo mkdir -p /var/www/certbot
cp -n nginx.conf nginx.http.conf.bak || true

echo "==> Démarrage de Nginx (HTTP) pour la validation"
sudo docker compose up -d nginx-proxy

echo "==> Demande du certificat pour ${DOMAIN}"
sudo certbot certonly --webroot -w /var/www/certbot -d "${DOMAIN}" --email "${EMAIL}" --agree-tos --no-eff-email -n

echo "==> Bascule de Nginx en HTTPS"
sed "s/__DOMAIN__/${DOMAIN}/g" nginx-https.conf.template > nginx.conf
sed -i "s#^APP_URL=.*#APP_URL=\"https://${DOMAIN}\"#" .env
sudo docker compose up -d
sudo docker compose exec nginx-proxy nginx -t
sudo docker compose restart nginx-proxy

echo "==> Renouvellement automatique (rechargement de Nginx après renouvellement)"
sudo mkdir -p /etc/letsencrypt/renewal-hooks/deploy
sudo tee /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh >/dev/null <<HOOK
#!/bin/sh
cd "$(pwd)" && docker compose exec -T nginx-proxy nginx -s reload
HOOK
sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh

echo "Terminé : https://${DOMAIN}"
