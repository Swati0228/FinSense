# 🚀 FinSense — VM Deployment Guide

This guide covers deploying FinSense on a Linux VM using Docker and Nginx.

---

## ⚡ Quick Redeploy (Already Set Up? Start Here)

> **Use this every time you push new code and want to redeploy on the VM.**

```bash
# SSH into your VM first
ssh user@your-vm-ip
cd ~/aman/FinSense/FinSense   # adjust path if different
```

```bash
# 1. Pull latest code from GitHub
git pull origin main

# 2. ⚠️  Verify .env has correct values (--env-file overrides Dockerfile defaults!)
grep -E "^PORT|^NODE_ENV" .env
# Must show:
#   PORT=3001
#   NODE_ENV=production
# If wrong, fix it:
#   sed -i 's/PORT=.*/PORT=3001/' .env
#   sed -i 's/NODE_ENV=.*/NODE_ENV=production/' .env

# 3. Stop and remove the old container
docker stop finsense-app
docker rm finsense-app

# 4. Rebuild the Docker image with latest code
docker build -t finsense .

# 5. Start the new container
docker run -d \
  --name finsense-app \
  --restart unless-stopped \
  --network host \
  --env-file .env \
  finsense

# 6. Verify it's running on port 3001
docker logs finsense-app
curl -I http://localhost:3001
```

> If the build seems to use old cached code, force a full rebuild:
> ```bash
> docker build --no-cache -t finsense .
> ```

✅ Done. Visit **https://finsense.akt9802.in** — your new code is live.

---

## Prerequisites

- Docker installed on your server
- Nginx installed on your server
- SSL certificate (Let's Encrypt)
- Domain DNS configured to point to your server IP

| Requirement | Minimum Version |
|---|---|
| OS | Ubuntu 22.04 LTS (recommended) |
| Docker | 24.x+ |
| RAM | 1 GB (2 GB recommended) |
| Disk | 5 GB free |
| Open Ports | 80, 443, 3001 |

---

## 1️⃣ VM Setup — Install Docker

SSH into your VM and run the following commands:

```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install -y ca-certificates curl gnupg

# Add Docker's official GPG key
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
  sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Add Docker repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin

# Allow running Docker without sudo (log out and back in after this)
sudo usermod -aG docker $USER
```

Verify installation:

```bash
docker --version
```

---

## 2️⃣ Clone the Repository

```bash
git clone https://github.com/akt9802/FinSense.git
cd FinSense/FinSense
```

---

## 3️⃣ Configure Environment Variables

Copy the sample env file and fill in your values:

```bash
cp .env.sample .env
nano .env   # or use vim / any editor
```

Fill in **all** the following variables:

```env
# App
PORT=3001
NODE_ENV=production

# Database
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/finsense?retryWrites=true&w=majority

# JWT
JWT_SECRET=<your_strong_jwt_secret>
JWT_REFRESH_SECRET=<your_strong_refresh_secret>

# Brevo SMTP
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=<your_brevo_smtp_user>
SMTP_PASS=<your_brevo_smtp_password>
SMTP_FROM_EMAIL=<your_verified_sender_email>
SMTP_FROM_NAME=Finsense Team

# Cloudinary
CLOUDINARY_CLOUD_NAME=<your_cloud_name>
CLOUDINARY_API_KEY=<your_api_key>
CLOUDINARY_API_SECRET=<your_api_secret>
CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>

# Frontend (public vars — baked at build time)
NEXT_PUBLIC_BACKEND_URL=https://finsense.akt9802.in
NEXT_PUBLIC_API_BASE_URL=https://finsense.akt9802.in
```

> ⚠️ **Never commit your `.env` file to Git.** It is already in `.gitignore`.

---

## 4️⃣ Build Docker Image

```bash
docker build -t finsense .
```

> If code changes are not being picked up (cached layers), force a fresh build:
> ```bash
> docker build --no-cache -t finsense .
> ```

---

## 5️⃣ Run Docker Container

```bash
docker run -d \
  --name finsense-app \
  --restart unless-stopped \
  --network host \
  --env-file .env \
  finsense
```

> **Important:** `--network host` shares the host's network stack with the container.
> The app exposes itself directly on port **3001** (from `PORT=3001` in `.env`).
> Do **not** use `-p 3001:3001` with `--network host` — the port is shared automatically.

---

## 6️⃣ Verify Deployment

```bash
# Check container is running
docker ps

# Check app logs
docker logs finsense-app

# Test app is responding
curl -I http://localhost:3001
```

---

## 7️⃣ Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/finsense
```

Paste this config:

```nginx
upstream finsense_app {
    server localhost:3001;
    keepalive 64;
}

server {
    server_name finsense.akt9802.in www.finsense.akt9802.in;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss font/truetype font/opentype image/svg+xml;

    client_max_body_size 10M;

    location / {
        proxy_pass http://finsense_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 90;
    }

    location /_next/static {
        proxy_pass http://finsense_app;
        proxy_set_header Host $host;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location /_next/image {
        proxy_pass http://finsense_app;
        proxy_set_header Host $host;
        add_header Cache-Control "public, max-age=3600";
    }

    location = /favicon.ico {
        proxy_pass http://finsense_app;
        access_log off;
        log_not_found off;
    }

    location = /robots.txt {
        proxy_pass http://finsense_app;
        access_log off;
        log_not_found off;
    }

    error_page 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }

    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/finsense.akt9802.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/finsense.akt9802.in/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

server {
    if ($host = www.finsense.akt9802.in) {
        return 301 https://$host$request_uri;
    }
    if ($host = finsense.akt9802.in) {
        return 301 https://$host$request_uri;
    }

    listen 80;
    server_name finsense.akt9802.in www.finsense.akt9802.in;
    return 404;
}
```

Enable the site and reload:

```bash
sudo ln -s /etc/nginx/sites-available/finsense /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 8️⃣ Enable HTTPS with Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d finsense.akt9802.in -d www.finsense.akt9802.in
```

Certbot will auto-configure HTTPS and set up auto-renewal.

Visit **https://finsense.akt9802.in** in your browser.

---

## 🔄 Updating the App

```bash
# 1. Pull latest code
git pull origin main

# 2. Stop and remove old container
docker stop finsense-app
docker rm finsense-app

# 3. Rebuild image (use --no-cache if changes aren't picked up)
docker build -t finsense .

# 4. Run new container
docker run -d \
  --name finsense-app \
  --restart unless-stopped \
  --network host \
  --env-file .env \
  finsense

# 5. Verify
docker logs finsense-app
curl -I http://localhost:3001
```

---

## 🛑 Stopping the App

```bash
docker stop finsense-app
docker rm finsense-app
```

To also remove the built image:

```bash
docker rmi finsense
```

---

## 🧹 Useful Commands

### Docker
```bash
docker logs -f finsense-app         # live logs
docker logs finsense-app            # all logs
docker restart finsense-app         # restart container
docker stop finsense-app            # stop container
docker rm finsense-app              # remove container
docker rmi finsense                 # remove image
docker exec -it finsense-app sh     # open shell inside container
docker system prune -f              # free unused Docker resources
```

### Nginx
```bash
sudo nginx -t                           # test config
sudo systemctl reload nginx             # reload config
sudo tail -f /var/log/nginx/error.log   # error logs
sudo tail -f /var/log/nginx/access.log  # access logs
```

---

## 🐛 Troubleshooting

### Container keeps restarting
```bash
docker logs finsense-app
```
Check for missing env variables or failed DB connections.

### Port 3001 already in use
```bash
sudo lsof -i :3001
# Kill the conflicting process
```

### Build fails (bcrypt native module)
```bash
docker build --no-cache -t finsense .
```

### `.env` file not found
```bash
ls -la .env
# Must exist in the same directory where you run docker run
```

### Nginx 502 Bad Gateway
```bash
docker ps                           # is container running?
curl -I http://localhost:3001       # is app responding?
sudo tail -f /var/log/nginx/error.log
```

### SSL Certificate
```bash
sudo certbot certificates           # check expiry and domains
sudo certbot renew                  # renew certificate
```
