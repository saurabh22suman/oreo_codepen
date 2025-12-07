/**
 * Middleware Index
 * Aggregates all middleware modules
 */

const { requireAuth, optionalAuth } = require('./authMiddleware');
const { loginRateLimiter, resetRateLimitOnSuccess, apiRateLimiter } = require('./rateLimiter');
const { notFoundHandler, errorHandler, asyncHandler } = require('./errorHandler');

module.exports = {
    requireAuth,
    optionalAuth,
    loginRateLimiter,
    resetRateLimitOnSuccess,
    apiRateLimiter,
    notFoundHandler,
    errorHandler,
    asyncHandler,
};
