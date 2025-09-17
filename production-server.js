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

// Fallback for SPA routes - SIMPLIFIED
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
