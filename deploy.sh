#!/bin/bash
set -e

echo "🚀 Building and Packaging CSV to JSON Deployment"
echo "=================================================="

# Colors for better output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -f "angular.json" ]; then
    echo -e "${RED}❌ Error: Not in Angular project root directory${NC}"
    echo "Please run this script from the csv-to-json-app directory"
    exit 1
fi

echo -e "${BLUE}🔍 Checking required files...${NC}"

# Check for required files
REQUIRED_FILES=("production-server.js" "ecosystem.config.js" "package.json")
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}❌ Missing required file: $file${NC}"
        exit 1
    else
        echo -e "${GREEN}✅ Found: $file${NC}"
    fi
done

# Clean previous builds
echo -e "${YELLOW}🧹 Cleaning previous builds...${NC}"
rm -rf dist logs csvtojson-deployment.tar.gz

# Create logs directory
mkdir -p logs

# Build the application
echo -e "${YELLOW}📦 Building production application...${NC}"
npm run build:prod

# Verify build success
if [ ! -d "dist/csv-to-json-app/browser" ]; then
    echo -e "${RED}❌ Build failed - browser directory not found${NC}"
    exit 1
fi

if [ ! -f "dist/csv-to-json-app/browser/index.html" ]; then
    echo -e "${RED}❌ Build failed - index.html not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build successful${NC}"

# Test production server locally
echo -e "${YELLOW}🧪 Testing production server locally...${NC}"
timeout 10s node production-server.js > /tmp/server-test.log 2>&1 &
SERVER_PID=$!

# Wait a moment for server to start
sleep 3

# Test health endpoint
if curl -f -s http://localhost:4000/health > /dev/null; then
    echo -e "${GREEN}✅ Local server test passed${NC}"
    kill $SERVER_PID 2>/dev/null || true
else
    echo -e "${RED}❌ Local server test failed${NC}"
    kill $SERVER_PID 2>/dev/null || true
    echo "Server logs:"
    cat /tmp/server-test.log
    exit 1
fi

# Create deployment package
echo -e "${YELLOW}📋 Creating deployment package...${NC}"
npm run deploy:package

# Verify package was created
if [ ! -f "csvtojson-deployment.tar.gz" ]; then
    echo -e "${RED}❌ Failed to create deployment package${NC}"
    exit 1
fi

PACKAGE_SIZE=$(du -h csvtojson-deployment.tar.gz | cut -f1)
echo -e "${GREEN}✅ Deployment package created: csvtojson-deployment.tar.gz (${PACKAGE_SIZE})${NC}"

# Show package contents
echo -e "${BLUE}📁 Package contents:${NC}"
tar -tzf csvtojson-deployment.tar.gz | head -15
TOTAL_FILES=$(tar -tzf csvtojson-deployment.tar.gz | wc -l)
if [ $TOTAL_FILES -gt 15 ]; then
    echo "... and $((TOTAL_FILES - 15)) more files"
fi

# Show bundle information
echo -e "${BLUE}📊 Build Information:${NC}"
if [ -f "dist/csv-to-json-app/browser/main.js" ]; then
    MAIN_SIZE=$(du -h dist/csv-to-json-app/browser/main*.js | cut -f1 | head -1)
    echo "  Main bundle: ${MAIN_SIZE}"
fi
if [ -f "dist/csv-to-json-app/browser/styles.css" ]; then
    STYLE_SIZE=$(du -h dist/csv-to-json-app/browser/styles*.css | cut -f1 | head -1)
    echo "  Styles: ${STYLE_SIZE}"
fi

echo ""
echo -e "${GREEN}🎉 Deployment package ready!${NC}"
echo ""
echo -e "${YELLOW}📋 Next Steps for Server Deployment:${NC}"
echo ""
echo "1. Upload to server:"
echo "   scp csvtojson-deployment.tar.gz user@server:/tmp/"
echo ""
echo "2. On server, extract:"
echo "   cd /var/www/csvtojson.faizakram.com"
echo "   sudo tar -xzf /tmp/csvtojson-deployment.tar.gz"
echo "   sudo chown -R www-data:www-data ."
echo ""
echo "3. Install dependencies:"
echo "   sudo -u www-data npm install --production"
echo ""
echo "4. Start with PM2:"
echo "   sudo -u www-data pm2 start ecosystem.config.js --env production"
echo ""
echo "5. Update Nginx to proxy to localhost:4000"
echo ""
echo -e "${BLUE}🔧 Local testing commands:${NC}"
echo "  npm run test:local    # Test locally"
echo "  npm run serve:prod    # Run production server"
echo "  npm run health        # Check health endpoint"
