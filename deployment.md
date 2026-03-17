# SH Underground — Production Deployment Guide

This guide covers deploying SH Underground on the DamageLabs GCP VM.

## Production Details

| Setting | Value |
|---------|-------|
| Domain | sh-underground.com |
| Port | 3002 |
| Directory | `/var/www/sh-underground.com` |
| User | `fusion94` |
| Process Manager | systemd (`sh-underground.service`) |
| Database | SQLite (`server/data/sh-underground.db`) |
| Node Binary | `/usr/local/bin/node` |

---

## Deploy Application

### Initial Deploy

```bash
cd /var/www
sudo git clone https://github.com/DamageLabs/sh-underground.git sh-underground.com
sudo chown -R fusion94:fusion94 sh-underground.com
cd sh-underground.com

# Install frontend dependencies and build
npm install
npm run build

# Install server dependencies
cd server
npm install
cd ..
```

### Update Deploy

```bash
cd /var/www/sh-underground.com
git pull origin main
npm install
npm run build
cd server && npm install && cd ..
sudo systemctl restart sh-underground
```

---

## Configure Environment

```bash
cat > /var/www/sh-underground.com/.env << 'EOF'
VITE_GOOGLE_MAPS_API_KEY=<your-key>
EOF

chmod 600 /var/www/sh-underground.com/.env
```

---

## systemd Service

### Create the Service

```bash
sudo tee /etc/systemd/system/sh-underground.service > /dev/null << 'EOF'
[Unit]
Description=SH Underground (sh-underground.com)
After=network.target
StartLimitIntervalSec=60
StartLimitBurst=5

[Service]
Type=simple
User=fusion94
Group=fusion94
WorkingDirectory=/var/www/sh-underground.com
ExecStart=/usr/local/bin/node server/index.js
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal
Environment=NODE_ENV=production
Environment=PORT=3002

NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
EOF
```

### Enable and Start

```bash
sudo systemctl daemon-reload
sudo systemctl enable sh-underground
sudo systemctl start sh-underground
```

### Common Commands

```bash
sudo systemctl status sh-underground      # Check status
sudo systemctl restart sh-underground     # Restart
sudo systemctl stop sh-underground        # Stop
sudo journalctl -u sh-underground -f      # Follow logs
sudo journalctl -u sh-underground -n 50   # Last 50 lines
```

---

## Nginx Configuration

The Nginx config is version-controlled in `DamageLabs/brain` at `infra/nginx/sites-available/sh-underground`.

Key points:
- Frontend static files served from `/var/www/sh-underground.com/dist`
- API requests proxied to `localhost:3002`
- Upload requests proxied to `localhost:3002`
- Shared snippets: `security-headers.conf`, `static-cache.conf`

```bash
sudo ln -sf /etc/nginx/sites-available/sh-underground /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

---

## SSL with Let's Encrypt

```bash
sudo certbot --nginx -d sh-underground.com -d www.sh-underground.com \
  --non-interactive --agree-tos -m fusion94@gmail.com
```

Auto-renewal test:
```bash
sudo certbot renew --dry-run
```

---

## Maintenance

### Database Backup

```bash
cp /var/www/sh-underground.com/server/data/sh-underground.db ~/backups/sh-underground-$(date +%Y%m%d-%H%M%S).db
```

### View Logs

```bash
sudo journalctl -u sh-underground -f
sudo tail -f /var/log/nginx/access.log
```

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Exit code 203 | Node binary not accessible | Verify `/usr/local/bin/node` exists |
| Port conflict | Another process on 3002 | `sudo ss -tlnp \| grep :3002` |
| 502 Bad Gateway | Service not running | `sudo systemctl start sh-underground` |

---

*Last updated: March 17, 2026*
