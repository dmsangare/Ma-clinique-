#!/usr/bin/env bash
# Installation MédiSahel HIS sur Ubuntu 26.04 LTS (Docker Compose : PostgreSQL + application + Nginx)
# Usage : depuis le dossier du projet, en utilisateur normal avec sudo :  ./install-ubuntu.sh
set -euo pipefail

if [ "$(id -u)" -eq 0 ]; then echo "Lancez ce script avec un utilisateur normal (sudo sera demandé)."; exit 1; fi
cd "$(dirname "$0")"

echo "==> 1/5 Paquets système"
sudo apt-get update
sudo apt-get install -y docker-compose-v2 ufw openssl curl
sudo systemctl enable --now docker
sudo usermod -aG docker "$USER" || true

echo "==> 2/5 Pare-feu (SSH, HTTP, HTTPS uniquement)"
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

echo "==> 3/5 Fichier .env (secrets générés automatiquement)"
if [ ! -f .env ]; then
  IP=$(hostname -I | awk '{print $1}')
  ADMIN_PW=$(openssl rand -base64 18 | tr -d '/+=' | cut -c1-16)Aa1
  cat > .env <<ENV
APP_URL="http://${IP}"
POSTGRES_USER="medisahel_user"
POSTGRES_DB="medisahel_db"
POSTGRES_PASSWORD="$(openssl rand -hex 24)"
JWT_SECRET="$(openssl rand -hex 48)"
ADMIN_EMAIL="admin@medisahel.local"
ADMIN_PASSWORD="${ADMIN_PW}"
ADMIN_NAME="Administrateur"
CLINIC_NAME="MédiSahel Clinique (test)"
ENV
  chmod 600 .env
  echo "    .env créé. Compte administrateur : admin@medisahel.local / ${ADMIN_PW}"
  echo "    (à noter maintenant ; changement obligatoire à la première connexion)"
else
  echo "    .env existant conservé."
fi

echo "==> 4/5 Construction et démarrage"
sudo mkdir -p /var/www/certbot /etc/letsencrypt
sudo docker compose up -d --build

echo "==> 5/5 Sauvegarde quotidienne (02:30) + purge à 20 jours"
sudo mkdir -p /var/medishahel/backups /var/www/certbot /etc/letsencrypt
chmod +x scripts/backup.sh
( sudo crontab -l 2>/dev/null | grep -v 'medishahel.*backup.sh' ; echo "30 2 * * * cd $(pwd) && set -a && . ./.env && set +a && $(pwd)/scripts/backup.sh >> /var/log/medishahel-backup.log 2>&1" ) | sudo crontab -

echo
echo "Terminé. Suivi des logs :  sudo docker compose logs -f medishahel-app"
echo "Ouvrez :  $(grep ^APP_URL .env | cut -d'"' -f2)"
