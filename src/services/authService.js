/**
 * Auth Service
 * Handles authentication logic
 */

const config = require('../config');

class AuthService {
    /**
     * Validate credentials
     */
    validateCredentials(username, password) {
        return username === config.auth.username && password === config.auth.password;
    }

    /**
     * Create session
     */
    createSession(req) {
        req.session.authenticated = true;
        req.session.loginTime = new Date().toISOString();
    }

    /**
     * Destroy session
     */
    async destroySession(req) {
        return new Promise((resolve, reject) => {
            req.session.destroy((err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    /**
     * Check if session is authenticated
     */
    isAuthenticated(req) {
        return req.session && req.session.authenticated === true;
    }
}

// Export singleton instance
module.exports = new AuthService();
