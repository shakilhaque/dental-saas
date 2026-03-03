#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
#   DentalSaaS – AWS Ubuntu Server Deployment Script
#   Run this on a fresh Ubuntu 22.04 LTS EC2 instance
#   Usage: chmod +x deploy-aws.sh && sudo ./deploy-aws.sh
# ═══════════════════════════════════════════════════════════════════

set -e  # Exit on any error

DOMAIN="dentalsaas.com"
EMAIL="your@email.com"       # Change this
APP_DIR="/opt/dental-saas"

echo "══════════════════════════════════════════"
echo "  🦷 DentalSaaS AWS Deployment Script"
echo "══════════════════════════════════════════"

# ── 1. System Update ────────────────────────────────────────────
echo "▶ Updating system..."
apt-get update -y && apt-get upgrade -y
apt-get install -y curl git wget unzip ufw fail2ban

# ── 2. Install Docker ───────────────────────────────────────────
echo "▶ Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
    usermod -aG docker ubuntu
fi

# ── 3. Install Docker Compose ───────────────────────────────────
echo "▶ Installing Docker Compose..."
if ! command -v docker compose &> /dev/null; then
    curl -SL "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-linux-x86_64" \
        -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
fi

echo "Docker version: $(docker --version)"
echo "Compose version: $(docker compose version)"

# ── 4. Configure Firewall ────────────────────────────────────────
echo "▶ Configuring firewall..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
# Only allow MongoDB from localhost
ufw deny 27017/tcp
ufw --force enable

# ── 5. Configure Fail2ban ────────────────────────────────────────
echo "▶ Configuring Fail2ban..."
cat > /etc/fail2ban/jail.local << 'FAIL2BAN'
[DEFAULT]
bantime  = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port    = ssh
logpath = /var/log/auth.log

[nginx-http-auth]
enabled = true
FAIL2BAN
systemctl restart fail2ban

# ── 6. Create App Directory ─────────────────────────────────────
echo "▶ Setting up application directory..."
mkdir -p $APP_DIR
cd $APP_DIR

# ── 7. Clone / Copy App ─────────────────────────────────────────
echo "▶ Setting up application files..."
# If using git:
# git clone https://github.com/yourorg/dental-saas.git .
# If copying from local:
echo "⚠ Copy your application files to $APP_DIR before continuing"
echo "  scp -r ./dental-saas/* ubuntu@YOUR_IP:$APP_DIR/"

# ── 8. Environment Setup ─────────────────────────────────────────
echo "▶ Setting up environment..."
if [ ! -f "$APP_DIR/.env" ]; then
    cp $APP_DIR/.env.example $APP_DIR/.env
    echo "⚠ IMPORTANT: Edit $APP_DIR/.env with your actual values!"
    echo "  nano $APP_DIR/.env"
    echo ""
    echo "Required values:"
    echo "  - MONGO_ROOT_PASSWORD"
    echo "  - JWT_SECRET (generate: openssl rand -hex 64)"
    echo "  - OPENAI_API_KEY"
    echo "  - SMTP_* credentials"
    exit 1
fi

# ── 9. Build and Start (without SSL first) ───────────────────────
echo "▶ Starting application (HTTP mode)..."
cd $APP_DIR
docker compose up -d --build mongo backend frontend

echo "▶ Waiting for services to be healthy..."
sleep 30
docker compose ps

# ── 10. SSL Certificate (Let's Encrypt) ─────────────────────────
echo "▶ Obtaining SSL certificate..."
if [ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    docker run --rm \
        -v $APP_DIR/certbot_www:/var/www/certbot \
        -v $APP_DIR/certbot_conf:/etc/letsencrypt \
        -p 80:80 \
        certbot/certbot certonly \
        --standalone \
        --email $EMAIL \
        --agree-tos \
        --no-eff-email \
        -d $DOMAIN \
        -d www.$DOMAIN \
        -d *.$DOMAIN
    echo "✅ SSL certificate obtained!"
fi

# ── 11. Start with SSL/Production profile ───────────────────────
echo "▶ Starting full production stack with Nginx..."
docker compose --profile production up -d

# ── 12. Setup SSL Auto-renewal (Cron) ───────────────────────────
echo "▶ Setting up SSL auto-renewal..."
(crontab -l 2>/dev/null; echo "0 12 * * * cd $APP_DIR && docker run --rm -v $APP_DIR/certbot_www:/var/www/certbot -v $APP_DIR/certbot_conf:/etc/letsencrypt certbot/certbot renew --quiet && docker compose restart nginx") | crontab -

# ── 13. Setup Log Rotation ───────────────────────────────────────
cat > /etc/logrotate.d/dental-saas << 'LOGROTATE'
/var/lib/docker/containers/*/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    copytruncate
}
LOGROTATE

# ── 14. System Monitoring ────────────────────────────────────────
echo "▶ Installing monitoring..."
apt-get install -y htop iotop nethogs

# ── 15. Done! ────────────────────────────────────────────────────
echo ""
echo "══════════════════════════════════════════════════════"
echo "  ✅ DentalSaaS Deployment Complete!"
echo "══════════════════════════════════════════════════════"
echo ""
echo "  🌐 App URL:      https://$DOMAIN"
echo "  🔧 Backend API:  https://$DOMAIN/api/v1"
echo "  🔍 Health Check: https://$DOMAIN/health"
echo ""
echo "  📦 Docker status:"
docker compose ps
echo ""
echo "  📝 Useful commands:"
echo "  docker compose logs -f backend   # View backend logs"
echo "  docker compose logs -f frontend  # View frontend logs"
echo "  docker compose restart backend   # Restart backend"
echo "  docker compose down              # Stop all services"
echo "  docker compose up -d --build     # Rebuild and start"
echo ""
echo "  🗄️  MongoDB shell:"
echo "  docker exec -it dental_mongo mongosh -u admin -p"
echo ""
