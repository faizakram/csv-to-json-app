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
