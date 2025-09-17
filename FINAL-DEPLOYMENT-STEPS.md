# 🚀 CSV to JSON Converter - Final Deployment Steps

## ✅ What We've Completed

1. **Created production-server.js** - Express server with static file serving
2. **Created ecosystem.config.js** - PM2 configuration for clustering
3. **Built production application** - Optimized Angular build 
4. **Created deployment package** - `csvtojson-deployment.tar.gz` (1.2M)
5. **Tested locally** - All endpoints working correctly

## 📦 Deployment Package Contents

- `dist/` - Production Angular build
- `production-server.js` - Express server
- `ecosystem.config.js` - PM2 configuration  
- `package.json` - Dependencies and scripts

## 🚀 Server Deployment Steps

### Step 1: Upload to Server
```bash
scp csvtojson-deployment.tar.gz user@your-server:/tmp/
```

### Step 2: Extract on Server
```bash
# Navigate to your site directory
cd /var/www/csvtojson.faizakram.com

# Extract the deployment package
sudo tar -xzf /tmp/csvtojson-deployment.tar.gz

# Set proper ownership
sudo chown -R www-data:www-data .
```

### Step 3: Install Dependencies
```bash
# Install Node.js dependencies (production only)
sudo -u www-data npm install --production --no-optional
```

### Step 4: Start with PM2
```bash
# Start the application with PM2
sudo -u www-data pm2 start ecosystem.config.js --env production

# Save PM2 configuration
sudo -u www-data pm2 save

# Set up PM2 startup (if not already done)
sudo -u www-data pm2 startup
```

### Step 5: Update Nginx Configuration

Update your existing Nginx configuration to proxy to Node.js:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name csvtojson.faizakram.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name csvtojson.faizakram.com;

    # Your existing SSL configuration
    ssl_certificate /path/to/your/cert.pem;
    ssl_certificate_key /path/to/your/private.key;

    # Proxy to Node.js application
    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_buffering off;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:4000/health;
        access_log off;
    }

    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        proxy_pass http://localhost:4000;
        expires 1y;
        add_header Cache-Control "public, immutable";
        proxy_set_header Host $host;
    }
}
```

### Step 6: Reload Nginx
```bash
# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

## 🔍 Verification Commands

### Check PM2 Status
```bash
sudo -u www-data pm2 status
sudo -u www-data pm2 logs csv-to-json-app
```

### Test Health Endpoint
```bash
curl http://localhost:4000/health
curl https://csvtojson.faizakram.com/health
```

### Check Application
```bash
curl -I https://csvtojson.faizakram.com/
```

## 📊 Monitoring & Management

### PM2 Commands
```bash
# Restart application
sudo -u www-data pm2 restart csv-to-json-app

# Stop application
sudo -u www-data pm2 stop csv-to-json-app

# View logs
sudo -u www-data pm2 logs csv-to-json-app --lines 50

# Monitor resources
sudo -u www-data pm2 monit
```

### Update Deployment
```bash
# Stop current application
sudo -u www-data pm2 stop csv-to-json-app

# Extract new deployment package
sudo tar -xzf /tmp/csvtojson-deployment.tar.gz

# Set ownership
sudo chown -R www-data:www-data .

# Install dependencies (if package.json changed)
sudo -u www-data npm install --production --no-optional

# Restart application
sudo -u www-data pm2 restart csv-to-json-app
```

## 🚨 Troubleshooting

### Port Already in Use
```bash
# Find process using port 4000
sudo lsof -i :4000

# Kill process if needed
sudo kill -9 <PID>
```

### Permission Issues
```bash
# Fix ownership
sudo chown -R www-data:www-data /var/www/csvtojson.faizakram.com

# Check PM2 process owner
ps aux | grep PM2
```

### Application Not Starting
```bash
# Check logs
sudo -u www-data pm2 logs csv-to-json-app --lines 100

# Test server directly
cd /var/www/csvtojson.faizakram.com
sudo -u www-data node production-server.js
```

## ✅ Success Criteria

Your deployment is successful when:

1. ✅ PM2 shows application as "online"
2. ✅ Health endpoint returns 200: `curl https://csvtojson.faizakram.com/health`
3. ✅ Main page loads: `curl -I https://csvtojson.faizakram.com/`
4. ✅ Website accessible via browser with HTTPS
5. ✅ Dark/light mode toggle works
6. ✅ CSV upload and conversion works

## 🎯 Performance Benefits

- **Node.js Static Serving**: Fast direct serving of static files
- **PM2 Clustering**: Multiple worker processes for better performance  
- **Nginx Proxy**: SSL termination and additional caching
- **Production Build**: Optimized, minified Angular application
- **Health Monitoring**: Built-in health checks and monitoring

Your hybrid Nginx + Node.js deployment is now ready! 🚀
