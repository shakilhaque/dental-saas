# 🦷 DentalSaaS – Complete Setup Guide

## ─────────────────────────────────────────────
## PART 1: RUN LOCALLY (Development)
## ─────────────────────────────────────────────

### Prerequisites
Install these before starting:

| Tool | Version | Download |
|------|---------|----------|
| Node.js | ≥ 18 | https://nodejs.org |
| MongoDB | ≥ 6 | https://www.mongodb.com/try/download/community |
| Git | any | https://git-scm.com |

---

### Step 1 – Clone / Extract the Project

```bash
# Extract the zip or clone from git
unzip dental-saas.zip
cd dental-saas
```

---

### Step 2 – Backend Setup

```bash
cd backend
npm install
```

Create your environment file:
```bash
cp .env.example .env
```

Open `.env` and fill in the **minimum required values** to run locally:

```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000

# Local MongoDB (no password needed)
MONGODB_URI=mongodb://localhost:27017/dental_saas

# Generate a secret: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=your_generated_secret_here
JWT_EXPIRE=7d

# Use Mailtrap.io for local email testing (free)
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_EMAIL=your_mailtrap_user
SMTP_PASSWORD=your_mailtrap_password
FROM_NAME=DentalSaaS
FROM_EMAIL=noreply@dentalsaas.local

# Get from https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-your_openai_key

# Optional for local (skip if not using file uploads)
CLOUDINARY_CLOUD_NAME=optional
CLOUDINARY_API_KEY=optional
CLOUDINARY_API_SECRET=optional

# Optional for local (skip if not using payments)
STRIPE_SECRET_KEY=sk_test_optional
STRIPE_WEBHOOK_SECRET=whsec_optional
```

Start the backend:
```bash
# Development mode with auto-reload
npm run dev

# Expected output:
# Server running in development mode on port 5000
# MongoDB Connected: localhost
```

✅ Verify: Open http://localhost:5000/health → should return `{"status":"OK"}`

---

### Step 3 – Frontend Setup

Open a **new terminal**:

```bash
cd frontend
npm install
```

Create your frontend env:
```bash
cp .env.example .env
```

Contents of `frontend/.env`:
```env
REACT_APP_API_URL=http://localhost:5000/api/v1
```

Start the frontend:
```bash
npm start
# Browser opens automatically at http://localhost:3000
```

---

### Step 4 – Register Your First Clinic

1. Open http://localhost:3000/register
2. Fill in clinic name → e.g. **"SmileCare Dental"**
3. Pick a subdomain → e.g. **"smilecare"**
4. Fill in admin name + email + password
5. Click **"Launch My Clinic"**
6. You'll be redirected to http://localhost:3000/admin/dashboard

---

### Step 5 – Add Staff Members

Login as clinic admin → go to **Settings → Staff**

Or use the API directly:
```bash
# First login and get your token
TOKEN=$(curl -s -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@smilecare.com","password":"yourpassword","subdomain":"smilecare"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

# Add a dentist
curl -X POST http://localhost:5000/api/v1/auth/register-staff \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "firstName": "Dr. Ahmed",
    "lastName": "Khan",
    "email": "dr.ahmed@smilecare.com",
    "password": "password123",
    "role": "dentist",
    "specialization": "General Dentistry",
    "consultationFee": 500
  }'
```

---

### Step 6 – Test the AI Chatbot

The floating chat bubble (💬) appears for patients.
Login as a patient role user, or test via API:

```bash
curl -X POST http://localhost:5000/api/v1/chat/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I have tooth pain, what should I do?",
    "sessionId": "test-session-001"
  }'
```

---

### Troubleshooting (Local)

| Problem | Solution |
|---------|----------|
| `MongoDB connection failed` | Start MongoDB: `mongod` or `brew services start mongodb-community` |
| `npm install` fails | Delete `node_modules/` and run again |
| Port 3000 busy | Kill it: `lsof -ti:3000 \| xargs kill` |
| Port 5000 busy | Kill it: `lsof -ti:5000 \| xargs kill` |
| CORS errors | Ensure `CLIENT_URL=http://localhost:3000` in backend `.env` |
| OpenAI errors | Check your API key has credits at https://platform.openai.com/usage |

---

## ─────────────────────────────────────────────
## PART 2: DOCKER (Local with Docker)
## ─────────────────────────────────────────────

If you have Docker installed, you can skip installing Node/MongoDB separately.

### One-Command Start

```bash
# 1. Copy and fill .env
cp .env.example .env
nano .env   # Fill in JWT_SECRET, OPENAI_API_KEY at minimum

# 2. Start everything (development mode)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build

# 3. Open in browser
# Frontend: http://localhost:3000
# Backend:  http://localhost:5000
# MongoDB:  localhost:27017
```

### Useful Docker Commands

```bash
# View logs
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f mongo

# Rebuild after code changes
docker compose up -d --build backend

# Stop everything
docker compose down

# Stop and delete volumes (wipes database!)
docker compose down -v

# Access MongoDB shell
docker exec -it dental_mongo mongosh -u admin -p yourpassword --authenticationDatabase admin

# Access backend container shell
docker exec -it dental_backend sh
```

---

## ─────────────────────────────────────────────
## PART 3: AWS UBUNTU SERVER (Production)
## ─────────────────────────────────────────────

### Recommended AWS Setup

| Resource | Recommendation |
|----------|---------------|
| EC2 Instance | t3.medium (2 vCPU, 4GB RAM) |
| Storage | 30GB gp3 SSD |
| OS | Ubuntu 22.04 LTS |
| Security Groups | Port 22 (SSH), 80 (HTTP), 443 (HTTPS) |
| Elastic IP | Yes – assign a static IP |
| Domain | Point your domain's A record to the Elastic IP |

---

### Step 1 – Launch EC2 Instance

```
AWS Console → EC2 → Launch Instance
→ Ubuntu Server 22.04 LTS (HVM), SSD
→ t3.medium
→ Security Group:
    Inbound: SSH (22), HTTP (80), HTTPS (443) from 0.0.0.0/0
→ Create/select key pair
→ Launch
```

Assign an **Elastic IP** and **point your domain** to it:
```
Route 53 or your DNS provider:
A record:  dentalsaas.com    → YOUR_ELASTIC_IP
A record:  *.dentalsaas.com  → YOUR_ELASTIC_IP  (wildcard for subdomains)
```

---

### Step 2 – Connect to Server

```bash
ssh -i your-key.pem ubuntu@YOUR_ELASTIC_IP
```

---

### Step 3 – Copy Files to Server

From your local machine:
```bash
# Copy entire project
scp -i your-key.pem -r ./dental-saas ubuntu@YOUR_ELASTIC_IP:/opt/

# Or using rsync (faster for large projects)
rsync -avz --exclude='node_modules' --exclude='.git' \
  -e "ssh -i your-key.pem" \
  ./dental-saas/ ubuntu@YOUR_ELASTIC_IP:/opt/dental-saas/
```

---

### Step 4 – Configure Environment

On the server:
```bash
cd /opt/dental-saas
cp .env.example .env
nano .env
```

**Required production values:**
```env
NODE_ENV=production
CLIENT_URL=https://dentalsaas.com

MONGO_ROOT_USER=admin
MONGO_ROOT_PASSWORD=VeryStrongPassword123!  # Change this!

# Generate: openssl rand -hex 64
JWT_SECRET=your_64_byte_hex_string_here

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=your@gmail.com
SMTP_PASSWORD=your_gmail_app_password  # Google App Password

OPENAI_API_KEY=sk-your_real_openai_key

# Cloudinary (for X-ray/file uploads)
CLOUDINARY_CLOUD_NAME=your_cloud
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret

# Stripe (for subscription payments)
STRIPE_SECRET_KEY=sk_live_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret

REACT_APP_API_URL=https://dentalsaas.com/api/v1
```

---

### Step 5 – Run the Deployment Script

```bash
cd /opt/dental-saas
chmod +x deploy-aws.sh

# Edit the script to set your domain and email
nano deploy-aws.sh
# Change: DOMAIN="dentalsaas.com"
# Change: EMAIL="your@email.com"

sudo ./deploy-aws.sh
```

**What the script does:**
1. Updates Ubuntu system
2. Installs Docker + Docker Compose
3. Configures UFW firewall (only ports 22, 80, 443)
4. Configures Fail2ban (blocks brute force)
5. Builds and starts all containers
6. Obtains Let's Encrypt SSL certificate
7. Starts Nginx reverse proxy with SSL
8. Sets up SSL auto-renewal cron job
9. Configures log rotation

---

### Step 6 – Manual Deployment (if script fails)

```bash
cd /opt/dental-saas

# Install Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu
newgrp docker

# Build and start (without SSL first)
docker compose up -d --build

# Wait and check
sleep 30
docker compose ps
curl http://localhost:5000/health

# Get SSL certificate
docker compose run --rm certbot certonly \
  --webroot \
  --webroot-path /var/www/certbot \
  --email your@email.com \
  --agree-tos \
  -d dentalsaas.com \
  -d www.dentalsaas.com

# Start with Nginx + SSL
docker compose --profile production up -d
```

---

### Step 7 – Verify Deployment

```bash
# All containers running?
docker compose ps

# Backend healthy?
curl https://dentalsaas.com/health

# Check logs
docker compose logs --tail=50 backend
docker compose logs --tail=50 nginx

# Test registration
curl -X POST https://dentalsaas.com/api/v1/auth/register-clinic \
  -H "Content-Type: application/json" \
  -d '{"clinicName":"Test Clinic","subdomain":"testclinic","adminFirstName":"John","adminLastName":"Doe","email":"test@test.com","password":"password123"}'
```

---

### Production Operations

#### Update the Application
```bash
cd /opt/dental-saas

# Pull latest code (if using git)
git pull origin main

# Rebuild and restart
docker compose up -d --build

# Zero-downtime for backend only
docker compose up -d --build --no-deps backend
```

#### Database Backup
```bash
# Manual backup
docker exec dental_mongo mongodump \
  --authenticationDatabase admin \
  -u admin -p yourpassword \
  --db dental_saas \
  --out /backup/$(date +%Y%m%d)

# Copy backup to local
scp -i key.pem -r ubuntu@YOUR_IP:/backup ./backups/

# Restore
docker exec -it dental_mongo mongorestore \
  --authenticationDatabase admin \
  -u admin -p yourpassword \
  --db dental_saas /backup/20241201/dental_saas
```

#### Automated Daily Backups (add to crontab)
```bash
sudo crontab -e
# Add this line:
0 2 * * * docker exec dental_mongo mongodump -u admin -p pass --authenticationDatabase admin --db dental_saas --archive | gzip > /backups/dental_$(date +\%Y\%m\%d).gz && find /backups -name "*.gz" -mtime +30 -delete
```

#### Monitor Resources
```bash
# Container stats
docker stats

# Logs (follow)
docker compose logs -f

# Disk usage
df -h
docker system df

# Clean up unused Docker resources
docker system prune -a
```

---

## ─────────────────────────────────────────────
## QUICK REFERENCE CARD
## ─────────────────────────────────────────────

```
LOCAL DEVELOPMENT:
  cd backend  && npm run dev     → API at :5000
  cd frontend && npm start       → App at :3000

DOCKER LOCAL:
  docker compose up --build      → Everything at once

AWS PRODUCTION:
  sudo ./deploy-aws.sh           → Full auto-deploy
  docker compose ps              → Check status
  docker compose logs -f backend → Watch logs

TEST ENDPOINTS:
  GET  /health                          → Health check
  POST /api/v1/auth/register-clinic     → Register clinic
  POST /api/v1/auth/login               → Login
  GET  /api/v1/tenants/check-subdomain/:sub → Check availability
  POST /api/v1/chat/message             → AI Chatbot

DEFAULT PORTS:
  3000 → React Frontend
  5000 → Node.js API
  27017 → MongoDB
  80   → Nginx HTTP  (production)
  443  → Nginx HTTPS (production)
```

---

## Environment Checklist Before Go-Live

- [ ] Strong `MONGO_ROOT_PASSWORD` (min 16 chars, mixed case + symbols)
- [ ] `JWT_SECRET` is 64 random bytes (`openssl rand -hex 64`)
- [ ] `OPENAI_API_KEY` is valid and has billing set up
- [ ] SMTP credentials tested (send a test email)
- [ ] Domain A record + wildcard pointing to server IP
- [ ] SSL certificate obtained (Let's Encrypt)
- [ ] Firewall rules applied (only 22, 80, 443 open)
- [ ] MongoDB port 27017 NOT exposed publicly
- [ ] Daily backup cron job configured
- [ ] `NODE_ENV=production` in `.env`
