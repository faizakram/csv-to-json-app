# 🚀 CSV to JSON Converter - Complete Production Deployment Guide

## 📋 Overview

This guide covers the complete deployment of a **CSV to JSON Converter** Angular application using a **hybrid Nginx + Node.js** approach for optimal performance, security, and scalability.

### 🎯 Deployment Architecture
- **Frontend**: Angular 20.3.1 SPA with SSR capability
- **Backend**: Node.js 20.x + Express 5.x server
- **Proxy**: Nginx with SSL (Let's Encrypt)
- **Process Manager**: PM2 or Systemd
- **Performance**: Static files served by Nginx, dynamic content by Node.js

---

## 📁 Required Files

### 1. production-server.js
```javascript
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 4000;
const DIST_FOLDER = path.join(__dirname, 'dist', 'csv-to-json-app');
const BROWSER_FOLDER = path.join(DIST_FOLDER, 'browser');

console.log('🚀 Starting CSV to JSON Converter Server...');
console.log(`📁 Serving from: ${BROWSER_FOLDER}`);
console.log(`📁 Index file: ${path.join(BROWSER_FOLDER, 'index.html')}`);
console.log(`📁 Index exists: ${fs.existsSync(path.join(BROWSER_FOLDER, 'index.html'))}`);

// Basic security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Health check endpoint (before static files)
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    app: 'CSV to JSON Converter',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    nodeVersion: process.version,
    uptime: Math.floor(process.uptime()),
    pid: process.pid,
    environment: process.env.NODE_ENV || 'production',
    staticPath: BROWSER_FOLDER,
    indexExists: fs.existsSync(path.join(BROWSER_FOLDER, 'index.html'))
  });
});

// API status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    message: 'CSV to JSON Converter API is running',
    features: ['CSV Processing', 'Excel Processing', 'Dark Mode', 'Responsive Design'],
    timestamp: new Date().toISOString(),
    server: 'Node.js + Express'
  });
});

// Serve static files with caching
if (fs.existsSync(BROWSER_FOLDER)) {
  app.use(express.static(BROWSER_FOLDER, {
    maxAge: '1y',
    etag: true,
    lastModified: true
  }));
  console.log('✅ Static files middleware configured');
} else {
  console.error('❌ Browser folder not found:', BROWSER_FOLDER);
}

// Fallback for SPA routes - SIMPLIFIED FOR EXPRESS 5.x
app.use((req, res) => {
  const indexPath = path.join(BROWSER_FOLDER, 'index.html');
  
  console.log(`📝 Serving ${req.url} -> ${indexPath}`);
  
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({
      error: 'Application not found',
      message: 'index.html not found',
      indexPath: indexPath,
      browserFolder: BROWSER_FOLDER,
      timestamp: new Date().toISOString()
    });
  }
});

// Start the server
const server = app.listen(PORT, (err) => {
  if (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
  
  console.log('✅ Server started successfully!');
  console.log(`🌐 Server running on: http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API status: http://localhost:${PORT}/api/status`);
  console.log(`📁 Static files: ${BROWSER_FOLDER}`);
  console.log('🚀 Ready to serve CSV to JSON Converter!');
});

// Error handling
server.on('error', (err) => {
  console.error('❌ Server error:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n🛑 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed successfully');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n🛑 SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed successfully');
    process.exit(0);
  });
});
```

### 2. ecosystem.config.js (PM2 Configuration)
```javascript
module.exports = {
  apps: [{
    // Application configuration
    name: 'csvtojson-app',
    script: 'production-server.js',
    
    // Process management
    instances: 2, // Run 2 instances for load balancing
    exec_mode: 'cluster',
    
    // Environment variables
    env: {
      NODE_ENV: 'development',
      PORT: 4000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 4000,
      npm_package_version: '1.0.0'
    },
    
    // Process behavior
    autorestart: true,
    watch: false, // Disable watch in production
    max_memory_restart: '500M',
    
    // Error handling
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 4000,
    
    // Logging configuration
    log_file: './logs/app.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    
    // Performance optimization
    node_args: [
      '--max-old-space-size=400'
    ],
    
    // Health monitoring
    kill_timeout: 5000,
    listen_timeout: 3000,
    
    // Additional metadata
    vizion: false, // Disable git metadata
    
    // Custom environment for the app
    env_vars: {
      APP_NAME: 'CSV to JSON Converter',
      APP_VERSION: '1.0.0',
      APP_DESCRIPTION: 'Professional CSV and Excel to JSON converter'
    }
  }]
};
```

### 3. Updated package.json Scripts
```json
{
  "scripts": {
    "build:prod": "ng build --configuration production",
    "serve:prod": "node production-server.js",
    "deploy:package": "tar -czf csvtojson-deployment.tar.gz dist/ production-server.js ecosystem.config.js package.json",
    "pm2:start": "pm2 start ecosystem.config.js --env production",
    "pm2:restart": "pm2 restart csvtojson-app",
    "pm2:stop": "pm2 stop csvtojson-app",
    "pm2:logs": "pm2 logs csvtojson-app",
    "pm2:status": "pm2 status",
    "health": "curl http://localhost:4000/health",
    "test:local": "npm run serve:prod & sleep 5 && npm run health && pkill -f production-server.js"
  }
}
```

### 4. Nginx Configuration
```nginx
server {
    server_name csvtojson.faizakram.com;

    # --- Static Files Served Directly by Nginx (Fastest) ---
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|map)$ {
        root /var/www/csvtojson.faizakram.com/dist/csv-to-json-app/browser;
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header X-Served-By "Nginx-Static";
        
        # Enable gzip for these files
        gzip_static on;
    }
    
    # --- Special Files (favicon, robots.txt, sitemap.xml, etc.) ---
    location ~ ^/(favicon\.ico|manifest\.json|robots\.txt|sitemap\.xml|apple-touch-icon\.png)$ {
        root /var/www/csvtojson.faizakram.com/dist/csv-to-json-app/browser;
        expires 1d;
        add_header Cache-Control "public";
    }
    
    # --- Health Check Endpoint (Direct to Node.js) ---
    location /health {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Quick timeouts for health checks
        proxy_connect_timeout 5s;
        proxy_send_timeout 5s;
        proxy_read_timeout 5s;
    }
    
    # --- API Status Endpoint ---
    location /api/status {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # --- All Other Requests to Node.js (SPA + Future SSR) ---
    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Reasonable timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffer settings for better performance
        proxy_buffering on;
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
    }

    # --- Security Headers (Enabled) ---
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; object-src 'none'; frame-ancestors 'none'; base-uri 'self';" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # --- Gzip Compression for Better Performance ---
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+rss
        image/svg+xml;

    # --- SSL Configuration (Keep Your Existing Settings) ---
    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/csvtojson.faizakram.com/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/csvtojson.faizakram.com/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}

# --- HTTP to HTTPS Redirect ---
server {
    if ($host = csvtojson.faizakram.com) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    server_name csvtojson.faizakram.com;
    listen 80;
    return 404; # managed by Certbot
}
```

### 5. Systemd Service Alternative (if not using PM2)
```ini
[Unit]
Description=CSV to JSON Converter App
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/csvtojson.faizakram.com
ExecStart=/usr/bin/node production-server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=4000
StandardOutput=syslog
StandardError=syslog

[Install]
WantedBy=multi-user.target
```

---

## 🚀 Complete Deployment Steps

### Step 1: Local Preparation
```bash
# Build production version
npm run build:prod

# Create deployment package
npm run deploy:package

# Upload to server
scp csvtojson-deployment.tar.gz root@your-server:/tmp/
```

### Step 2: Server Prerequisites
```bash
# Install Node.js 20.x LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Verify installations
node --version    # Should show v20.x.x
pm2 --version     # Should show 5.x.x
```

### Step 3: Backup Current Setup
```bash
# Backup current static deployment
sudo mv /var/www/csvtojson.faizakram.com /var/www/csvtojson.faizakram.com.static.backup

# Create fresh directory
sudo mkdir -p /var/www/csvtojson.faizakram.com
```

### Step 4: Extract and Setup Application
```bash
# Extract deployment package
cd /var/www/csvtojson.faizakram.com
sudo tar -xzf /tmp/csvtojson-deployment.tar.gz

# Set proper ownership
sudo chown -R www-data:www-data /var/www/csvtojson.faizakram.com

# Install dependencies
sudo -u www-data npm install --production --cache /tmp/npm-cache-clean

# Create logs directory
sudo -u www-data mkdir -p logs
```

### Step 5: Test Application
```bash
# Quick test
cd /var/www/csvtojson.faizakram.com
sudo -u www-data node production-server.js

# Should show successful startup messages
# Test in another terminal: curl http://localhost:4000/health
# Stop with Ctrl+C
```

### Step 6: Start with Process Manager

#### Option A: Using PM2 (Recommended)
```bash
# Start with PM2
sudo -u www-data pm2 start ecosystem.config.js --env production

# Check status
sudo -u www-data pm2 status

# Save configuration
sudo -u www-data pm2 save

# Setup auto-startup
sudo -u www-data pm2 startup
# Follow the command shown
```

#### Option B: Using Systemd Service
```bash
# Create service file
sudo tee /etc/systemd/system/csvtojson-app.service > /dev/null <<'EOF'
[Unit]
Description=CSV to JSON Converter App
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/csvtojson.faizakram.com
ExecStart=/usr/bin/node production-server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=4000
StandardOutput=syslog
StandardError=syslog

[Install]
WantedBy=multi-user.target
EOF

# Enable and start
sudo systemctl enable csvtojson-app.service
sudo systemctl start csvtojson-app.service

# Check status
sudo systemctl status csvtojson-app.service
```

### Step 7: Update Nginx Configuration
```bash
# Backup current config
sudo cp /etc/nginx/sites-available/csvtojson.faizakram.com /etc/nginx/sites-available/csvtojson.faizakram.com.backup

# Edit configuration
sudo nano /etc/nginx/sites-available/csvtojson.faizakram.com
# Paste the Nginx configuration from above

# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### Step 8: Final Testing
```bash
# Test all endpoints
echo "=== Testing Health Endpoint ==="
curl https://csvtojson.faizakram.com/health

echo "=== Testing API Status ==="
curl https://csvtojson.faizakram.com/api/status

echo "=== Testing Main Site ==="
curl -I https://csvtojson.faizakram.com/

echo "=== Testing Static File ==="
curl -I https://csvtojson.faizakram.com/favicon.ico

# Check application status
if command -v pm2 &> /dev/null; then
    sudo -u www-data pm2 status
else
    sudo systemctl status csvtojson-app
fi
```

---

## 🔧 Troubleshooting & Solutions

### Common Issues and Fixes

#### 1. PM2 Permission Errors
```bash
# Create PM2 directories with proper ownership
sudo mkdir -p /var/www/.pm2/logs /var/www/.pm2/pids
sudo chown -R www-data:www-data /var/www/.pm2

# Or use custom PM2_HOME
sudo mkdir -p /home/pm2-csvtojson
sudo chown -R www-data:www-data /home/pm2-csvtojson
sudo -u www-data PM2_HOME=/home/pm2-csvtojson pm2 start ecosystem.config.js --env production
```

#### 2. npm Permission Issues
```bash
# Clean npm cache and fix permissions
sudo npm cache clean --force
sudo chown -R www-data:www-data ~/.npm
sudo -u www-data npm install --production
```

#### 3. Express 5.x Route Pattern Issues
- ✅ **Solution**: Use `app.use()` instead of `app.get('*')` for SPA fallback
- ✅ **Fixed in production-server.js** with simplified route handling

#### 4. Static Files Not Loading
```bash
# Verify dist folder structure
ls -la /var/www/csvtojson.faizakram.com/dist/csv-to-json-app/browser/

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

#### 5. Port Already in Use
```bash
# Find process using port 4000
sudo lsof -i :4000

# Kill if necessary
sudo kill -9 <PID>
```

### Monitoring Commands

#### PM2 Monitoring
```bash
# Status and logs
sudo -u www-data pm2 status
sudo -u www-data pm2 logs csvtojson-app --lines 50
sudo -u www-data pm2 monit

# Restart application
sudo -u www-data pm2 restart csvtojson-app

# Delete and recreate
sudo -u www-data pm2 delete csvtojson-app
sudo -u www-data pm2 start ecosystem.config.js --env production
```

#### Systemd Monitoring
```bash
# Status and logs
sudo systemctl status csvtojson-app
sudo journalctl -u csvtojson-app -f --lines 50

# Restart application
sudo systemctl restart csvtojson-app

# Stop/start
sudo systemctl stop csvtojson-app
sudo systemctl start csvtojson-app
```

---

## 🎯 Performance & Security Features

### ✅ Performance Optimizations
- **Static File Serving**: JS, CSS, images served directly by Nginx
- **Clustering**: Multiple Node.js worker processes via PM2
- **Caching**: Long-term caching for static assets (1 year)
- **Gzip Compression**: Reduced bandwidth usage
- **Connection Pooling**: Efficient proxy buffering

### ✅ Security Features
- **HTTPS Only**: SSL/TLS encryption via Let's Encrypt
- **Security Headers**: XSS protection, content type options, frame options
- **CSP Policy**: Content Security Policy for XSS prevention
- **HSTS**: HTTP Strict Transport Security
- **Process Isolation**: Non-root user execution (www-data)

### ✅ Reliability Features
- **Health Monitoring**: Built-in health check endpoints
- **Auto Restart**: PM2 or systemd automatic restart on crashes
- **Graceful Shutdown**: Proper SIGTERM/SIGINT handling
- **Error Logging**: Comprehensive logging for debugging
- **Memory Management**: Automatic restart on memory leaks

---

## 🚨 Quick Rollback Plan

If anything goes wrong, quickly rollback to static hosting:

```bash
# Stop Node.js application
if command -v pm2 &> /dev/null; then
    sudo -u www-data pm2 delete csvtojson-app
else
    sudo systemctl stop csvtojson-app
    sudo systemctl disable csvtojson-app
fi

# Restore static files
sudo rm -rf /var/www/csvtojson.faizakram.com
sudo mv /var/www/csvtojson.faizakram.com.static.backup /var/www/csvtojson.faizakram.com

# Restore nginx config
sudo cp /etc/nginx/sites-available/csvtojson.faizakram.com.backup /etc/nginx/sites-available/csvtojson.faizakram.com
sudo systemctl reload nginx
```

---

## 📊 Success Criteria

Your deployment is successful when:

1. ✅ **Health Check**: `curl https://csvtojson.faizakram.com/health` returns 200 OK
2. ✅ **API Status**: `curl https://csvtojson.faizakram.com/api/status` returns proper JSON
3. ✅ **Main Site**: `curl -I https://csvtojson.faizakram.com/` returns 200 OK
4. ✅ **Static Files**: Served directly by Nginx with proper caching headers
5. ✅ **Process Management**: PM2 or systemd shows application as "online"/"active"
6. ✅ **Browser Test**: Website loads correctly with all features working
7. ✅ **SSL Certificate**: HTTPS working without errors
8. ✅ **Auto-restart**: Application survives server reboots

---

## 🎉 Benefits of This Deployment

### vs. Pure Static Hosting
- ✅ **Future SSR Ready**: Easy to add server-side rendering
- ✅ **API Endpoints**: Can add backend functionality
- ✅ **Dynamic Content**: Generate dynamic sitemaps, meta tags
- ✅ **Better SEO**: Server-side processing capability
- ✅ **Health Monitoring**: Built-in application health checks

### vs. Pure Node.js Hosting
- ✅ **Better Performance**: Static assets served by Nginx
- ✅ **SSL Termination**: Nginx handles SSL/TLS
- ✅ **Load Balancing**: Nginx can distribute load
- ✅ **Caching**: Advanced caching strategies
- ✅ **Security**: Nginx provides additional security layer

---

## 📞 Support

For issues or questions:
1. Check logs: `sudo -u www-data pm2 logs csvtojson-app`
2. Verify configuration: `sudo nginx -t`
3. Test endpoints: `curl https://csvtojson.faizakram.com/health`
4. Review this document for troubleshooting steps

**Your CSV to JSON Converter is now running with enterprise-grade deployment! 🚀**

---

*Last Updated: September 17, 2025*
*Version: 1.0.0*
*Deployment Type: Hybrid Nginx + Node.js*
