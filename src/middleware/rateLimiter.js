/**
 * Rate Limiter Middleware
 * Prevents brute force attacks on login
 */

const config = require('../config');
const ResponseHelper = require('../utils/responseHelper');

// In-memory store for rate limiting
// In production, use Redis or similar
const attempts = new Map();

/**
 * Clean up old entries periodically
 */
setInterval(() => {
    const now = Date.now();
    for (const [key, data] of attempts.entries()) {
        if (now - data.firstAttempt > config.rateLimit.windowMs) {
            attempts.delete(key);
        }
    }
}, 60000); // Clean up every minute

/**
 * Get client identifier (IP + User-Agent hash)
 */
function getClientKey(req) {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    return ip;
}

/**
 * Rate limiter for login attempts
 */
function loginRateLimiter(req, res, next) {
    const key = getClientKey(req);
    const now = Date.now();

    let clientData = attempts.get(key);

    if (!clientData) {
        clientData = {
            count: 0,
            firstAttempt: now,
        };
        attempts.set(key, clientData);
    }

    // Reset if window has passed
    if (now - clientData.firstAttempt > config.rateLimit.windowMs) {
        clientData.count = 0;
        clientData.firstAttempt = now;
    }

    clientData.count++;

    if (clientData.count > config.rateLimit.maxAttempts) {
        const retryAfter = Math.ceil((config.rateLimit.windowMs - (now - clientData.firstAttempt)) / 1000);
        res.set('Retry-After', retryAfter);
        return ResponseHelper.tooManyRequests(
            res,
            `Too many login attempts. Please try again in ${Math.ceil(retryAfter / 60)} minutes.`
        );
    }

    next();
}

/**
 * Reset rate limit on successful login
 */
function resetRateLimitOnSuccess(req) {
    const key = getClientKey(req);
    attempts.delete(key);
}

/**
 * General API rate limiter
 */
function apiRateLimiter(maxRequests = 100, windowMs = 60000) {
    const apiAttempts = new Map();

    return (req, res, next) => {
        const key = getClientKey(req);
        const now = Date.now();

        let clientData = apiAttempts.get(key);

        if (!clientData) {
            clientData = { count: 0, firstAttempt: now };
            apiAttempts.set(key, clientData);
        }

        if (now - clientData.firstAttempt > windowMs) {
            clientData.count = 0;
            clientData.firstAttempt = now;
        }

        clientData.count++;

        if (clientData.count > maxRequests) {
            return ResponseHelper.tooManyRequests(res);
        }

        next();
    };
}

module.exports = {
    loginRateLimiter,
    resetRateLimitOnSuccess,
    apiRateLimiter,
};
