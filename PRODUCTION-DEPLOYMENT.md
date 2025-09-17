# 🚀 Production Deployment Guide

## 📁 Files Created

### 1. **production-server.js**
- Express.js server for production
- SSR support with fallback to static files
- Health check endpoints
- Security headers
- Error handling

### 2. **ecosystem.config.js** 
- PM2 process manager configuration
- 2 clustered instances for load balancing
- Auto-restart on crashes
- Memory limits and monitoring
- Logging configuration

### 3. **Updated package.json**
- Production scripts added
- PM2 management commands
- Health check command
- Deployment packaging script

### 4. **create-deployment.sh**
- Automated deployment package creation
- Build verification
- Package contents validation

## 🔧 Local Testing

```bash
# Test production build
npm run build:prod

# Test production server locally
npm run serve:prod

# Check health endpoint
npm run health
```

## 📦 Create Deployment Package

```bash
# Run the deployment script
./create-deployment.sh

# This creates: csvtojson-hybrid.tar.gz
```

## 🚀 Server Deployment Steps

1. **Upload package to server:**
   ```bash
   scp csvtojson-hybrid.tar.gz user@your-server:/tmp/
   ```

2. **Extract and setup on server:**
   ```bash
   cd /var/www/csvtojson.faizakram.com
   sudo tar -xzf /tmp/csvtojson-hybrid.tar.gz
   sudo chown -R www-data:www-data .
   sudo -u www-data npm install --production
   ```

3. **Start with PM2:**
   ```bash
   sudo -u www-data pm2 start ecosystem.config.js --env production
   sudo -u www-data pm2 save
   sudo -u www-data pm2 startup
   ```

4. **Update Nginx configuration** (as provided in migration guide)

5. **Test deployment:**
   ```bash
   curl http://localhost:4000/health
   curl https://csvtojson.faizakram.com/health
   ```

## 📊 Monitoring Commands

```bash
# Check PM2 status
sudo -u www-data pm2 status

# View logs
sudo -u www-data pm2 logs csvtojson-app

# Restart application
sudo -u www-data pm2 restart csvtojson-app

# Real-time monitoring
sudo -u www-data pm2 monit
```

Your production files are now ready for deployment! 🎉
