/**
 * Express Application Configuration
 * Sets up middleware, routes, and error handling
 */

const express = require('express');
const session = require('express-session');
const path = require('path');
const config = require('./config');
const { authRoutes, projectRoutes, publicRoutes } = require('./routes');
const publicController = require('./controllers/publicController');
const { notFoundHandler, errorHandler, asyncHandler } = require('./middleware/errorHandler');

const app = express();

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
    secret: config.auth.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: config.nodeEnv === 'production',
        httpOnly: true,
        maxAge: config.auth.sessionMaxAge,
        sameSite: 'lax',
    },
    name: 'oreo.sid', // Custom session cookie name
}));

// Serve static files
app.use(express.static(path.join(process.cwd(), config.paths.public)));

// API Routes
app.use('/api', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/public', publicRoutes);

// Public project access routes - handle all methods and paths (Express 5 syntax)
app.all('/p/:hash', asyncHandler(publicController.accessProject.bind(publicController)));
app.all('/p/:hash/{*splat}', asyncHandler(publicController.accessProject.bind(publicController)));

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
