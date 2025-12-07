/**
 * Application Configuration
 * Centralized configuration management with validation
 * Simplified for static file hosting
 */

require('dotenv').config();

const config = {
    // Server Configuration
    port: parseInt(process.env.PORT, 10) || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',

    // Authentication
    auth: {
        username: process.env.APP_USERNAME || 'admin',
        password: process.env.APP_PASSWORD || 'admin123',
        sessionSecret: process.env.SESSION_SECRET || 'default-secret-change-in-production',
        sessionMaxAge: 24 * 60 * 60 * 1000, // 24 hours
    },

    // File Upload Configuration
    upload: {
        maxFileSize: 5 * 1024 * 1024, // 5MB
        maxFiles: 10,
        allowedExtensions: ['.html', '.css', '.js', '.txt', '.json', '.svg', '.png', '.jpg', '.jpeg', '.gif', '.ico', '.woff', '.woff2', '.ttf', '.eot'],
    },

    // Paths
    paths: {
        projects: 'projects',
        metadata: process.env.METADATA_PATH || 'metadata.json',
        public: 'public',
    },

    // Base URL for public access
    baseUrl: process.env.APP_BASE_URL || 'http://localhost:3000',

    // Rate Limiting
    rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxAttempts: 5, // 5 attempts per window for login
    },

    // Validation
    validation: {
        maxTitleLength: 100,
        maxDescriptionLength: 500,
        maxUrlLength: 2048,
    },
};

// Validate critical configuration
function validateConfig() {
    const warnings = [];

    if (config.auth.sessionSecret === 'default-secret-change-in-production') {
        warnings.push('⚠️  SESSION_SECRET is using default value. Set a strong secret in production!');
    }

    if (config.auth.sessionSecret.length < 32) {
        warnings.push('⚠️  SESSION_SECRET should be at least 32 characters for security.');
    }

    if (config.auth.password === 'admin123') {
        warnings.push('⚠️  APP_PASSWORD is using default value. Change it in production!');
    }

    if (warnings.length > 0 && config.nodeEnv === 'production') {
        warnings.forEach(w => console.warn(w));
    }

    return warnings;
}

// Run validation on load
validateConfig();

module.exports = config;
