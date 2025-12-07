/**
 * Authentication Middleware
 * Protects routes that require admin access
 */

const authService = require('../services/authService');
const ResponseHelper = require('../utils/responseHelper');

/**
 * Require authentication middleware
 */
function requireAuth(req, res, next) {
    if (authService.isAuthenticated(req)) {
        return next();
    }
    return ResponseHelper.unauthorized(res, 'Authentication required');
}

/**
 * Optional auth middleware - sets isAdmin flag
 */
function optionalAuth(req, res, next) {
    req.isAdmin = authService.isAuthenticated(req);
    next();
}

module.exports = {
    requireAuth,
    optionalAuth,
};
