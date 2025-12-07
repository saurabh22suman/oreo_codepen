/**
 * Auth Controller
 * Handles authentication endpoints
 */

const authService = require('../services/authService');
const ResponseHelper = require('../utils/responseHelper');
const { resetRateLimitOnSuccess } = require('../middleware/rateLimiter');

class AuthController {
    /**
     * POST /api/login
     * Authenticate user
     */
    async login(req, res) {
        const { username, password } = req.body;

        if (!username || !password) {
            return ResponseHelper.badRequest(res, 'Username and password are required');
        }

        if (authService.validateCredentials(username, password)) {
            authService.createSession(req);
            resetRateLimitOnSuccess(req);
            return ResponseHelper.success(res, { authenticated: true }, 'Login successful');
        }

        return ResponseHelper.unauthorized(res, 'Invalid credentials');
    }

    /**
     * POST /api/logout
     * End user session
     */
    async logout(req, res) {
        try {
            await authService.destroySession(req);
            return ResponseHelper.success(res, null, 'Logged out successfully');
        } catch (error) {
            return ResponseHelper.serverError(res, 'Logout failed');
        }
    }

    /**
     * GET /api/auth/check
     * Check authentication status
     */
    async checkAuth(req, res) {
        const authenticated = authService.isAuthenticated(req);
        return ResponseHelper.success(res, { authenticated });
    }
}

module.exports = new AuthController();
