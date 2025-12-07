/**
 * Hash Generator Utility
 * Generates secure random hashes for project IDs and public URLs
 */

const crypto = require('crypto');

class HashGenerator {
    /**
     * Generate a random hex hash
     * @param {number} length - Number of bytes (default 8 = 16 hex characters)
     */
    static generate(length = 8) {
        return crypto.randomBytes(length).toString('hex');
    }

    /**
     * Generate a URL-safe hash
     * @param {number} length - Number of bytes
     */
    static generateUrlSafe(length = 8) {
        return crypto.randomBytes(length)
            .toString('base64')
            .replace(/[+/=]/g, '')
            .substring(0, length * 2);
    }

    /**
     * Generate a short hash for public URLs
     */
    static generatePublicHash() {
        return this.generate(6); // 12 character hex string
    }

    /**
     * Validate hash format
     */
    static isValidHash(hash) {
        return typeof hash === 'string' && /^[a-f0-9]{12,16}$/i.test(hash);
    }
}

module.exports = HashGenerator;
