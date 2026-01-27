# Deploying SH Underground to GCP VM

## 1. Create a GCP VM Instance

```bash
# Using gcloud CLI
gcloud compute instances create sh-underground \
  --zone=us-central1-a \
  --machine-type=e2-micro \
  --image-family=ubuntu-2204-lts \
  --image-project=ubuntu-os-cloud \
  --tags=http-server,https-server
```

Or create via GCP Console: Compute Engine → VM Instances → Create Instance

## 2. Configure Firewall Rules

```bash
# Allow HTTP traffic
gcloud compute firewall-rules create allow-http \
  --allow tcp:80 \
  --target-tags=http-server

# Allow HTTPS traffic
gcloud compute firewall-rules create allow-https \
  --allow tcp:443 \
  --target-tags=https-server
```

## 3. SSH into the VM

```bash
gcloud compute ssh sh-underground --zone=us-central1-a
```

## 4. Install Dependencies on VM

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install nginx
sudo apt install -y nginx

# Verify installations
node --version
npm --version
nginx -v
```

## 5. Deploy Application

### Option A: Clone from Git

```bash
cd /var/www
sudo git clone <your-repo-url> sh-underground
cd sh-underground
sudo chown -R $USER:$USER .
```

### Option B: Upload files via SCP

From your local machine:
```bash
# Build locally first
npm run build

# Upload dist folder
gcloud compute scp --recurse ./dist sh-underground:/tmp/dist --zone=us-central1-a
```

On the VM:
```bash
sudo mkdir -p /var/www/sh-underground
sudo mv /tmp/dist/* /var/www/sh-underground/
```

### If building on the VM:

```bash
cd /var/www/sh-underground

# Create .env file
sudo nano .env
# Add: VITE_GOOGLE_MAPS_API_KEY=your_api_key_here

# Install dependencies and build
npm install
npm run build

# Move build output to serve directory
sudo mkdir -p /var/www/html/sh-underground
sudo cp -r dist/* /var/www/html/sh-underground/
```

## 6. Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/sh-underground
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;  # Or use VM's external IP
    root /var/www/html/sh-underground;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # Handle SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/sh-underground /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default  # Remove default site
sudo nginx -t  # Test configuration
sudo systemctl restart nginx
```

## 7. Set Up SSL with Let's Encrypt (Optional but Recommended)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate (replace with your domain)
sudo certbot --nginx -d your-domain.com

# Auto-renewal is configured automatically
# Test renewal with:
sudo certbot renew --dry-run
```

## 8. Verify Deployment

Visit your VM's external IP or domain in a browser:
- http://YOUR_EXTERNAL_IP
- https://your-domain.com (if SSL configured)

Find external IP:
```bash
gcloud compute instances describe sh-underground \
  --zone=us-central1-a \
  --format='get(networkInterfaces[0].accessConfigs[0].natIP)'
```

## Updating the Application

```bash
# SSH into VM
gcloud compute ssh sh-underground --zone=us-central1-a

# If using git
cd /var/www/sh-underground
git pull
npm install
npm run build
sudo cp -r dist/* /var/www/html/sh-underground/
sudo systemctl restart nginx
```

Or rebuild locally and re-upload via SCP.

## Troubleshooting

```bash
# Check nginx status
sudo systemctl status nginx

# View nginx error logs
sudo tail -f /var/log/nginx/error.log

# View nginx access logs
sudo tail -f /var/log/nginx/access.log

# Test nginx configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
```
