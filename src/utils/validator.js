/**
 * Input Validator Utility
 * Validates and sanitizes user input
 */

const config = require('../config');

class Validator {
    /**
     * Validate project title
     */
    static validateTitle(title) {
        const errors = [];

        if (!title || typeof title !== 'string') {
            errors.push('Title is required');
            return { isValid: false, errors, sanitized: '' };
        }

        const sanitized = title.trim();

        if (sanitized.length === 0) {
            errors.push('Title cannot be empty');
        }

        if (sanitized.length > config.validation.maxTitleLength) {
            errors.push(`Title must be less than ${config.validation.maxTitleLength} characters`);
        }

        // Check for potentially dangerous characters
        if (/<script|javascript:|on\w+=/i.test(sanitized)) {
            errors.push('Title contains invalid characters');
        }

        return {
            isValid: errors.length === 0,
            errors,
            sanitized: this.sanitizeText(sanitized),
        };
    }

    /**
     * Validate project description
     */
    static validateDescription(description) {
        if (!description) {
            return { isValid: true, errors: [], sanitized: '' };
        }

        const errors = [];
        const sanitized = description.trim();

        if (sanitized.length > config.validation.maxDescriptionLength) {
            errors.push(`Description must be less than ${config.validation.maxDescriptionLength} characters`);
        }

        // Check for potentially dangerous characters
        if (/<script|javascript:|on\w+=/i.test(sanitized)) {
            errors.push('Description contains invalid characters');
        }

        return {
            isValid: errors.length === 0,
            errors,
            sanitized: this.sanitizeText(sanitized),
        };
    }

    /**
     * Validate external URL
     */
    static validateUrl(url) {
        const errors = [];

        if (!url || typeof url !== 'string') {
            errors.push('URL is required for external projects');
            return { isValid: false, errors, sanitized: '' };
        }

        const sanitized = url.trim();

        if (sanitized.length > config.validation.maxUrlLength) {
            errors.push(`URL must be less than ${config.validation.maxUrlLength} characters`);
        }

        // Validate URL format
        try {
            const urlObj = new URL(sanitized);

            // Only allow http and https protocols
            if (!['http:', 'https:'].includes(urlObj.protocol)) {
                errors.push('URL must use http or https protocol');
            }
        } catch (e) {
            errors.push('Invalid URL format');
        }

        return {
            isValid: errors.length === 0,
            errors,
            sanitized,
        };
    }

    /**
     * Validate project type
     */
    static validateProjectType(type) {
        const validTypes = ['external', 'hosted'];

        if (!type || !validTypes.includes(type)) {
            return {
                isValid: false,
                errors: [`Project type must be one of: ${validTypes.join(', ')}`],
                sanitized: 'hosted', // Default to hosted
            };
        }

        return { isValid: true, errors: [], sanitized: type };
    }

    /**
     * Validate file extension
     */
    static isAllowedFileExtension(filename) {
        const ext = '.' + filename.split('.').pop().toLowerCase();
        return config.upload.allowedExtensions.includes(ext);
    }

    /**
     * Sanitize text to prevent XSS
     */
    static sanitizeText(text) {
        if (!text) return '';
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;');
    }

    /**
     * Validate complete project input
     */
    static validateProjectInput(data) {
        const errors = [];
        const sanitized = {};

        // Validate title
        const titleResult = this.validateTitle(data.name);
        if (!titleResult.isValid) {
            errors.push(...titleResult.errors);
        }
        sanitized.name = titleResult.sanitized;

        // Validate description
        const descResult = this.validateDescription(data.description);
        if (!descResult.isValid) {
            errors.push(...descResult.errors);
        }
        sanitized.description = descResult.sanitized;

        // Validate type
        const typeResult = this.validateProjectType(data.type);
        if (!typeResult.isValid) {
            errors.push(...typeResult.errors);
        }
        sanitized.type = typeResult.sanitized;

        // Validate URL for external projects
        if (sanitized.type === 'external') {
            const urlResult = this.validateUrl(data.externalUrl);
            if (!urlResult.isValid) {
                errors.push(...urlResult.errors);
            }
            sanitized.externalUrl = urlResult.sanitized;
        }

        return {
            isValid: errors.length === 0,
            errors,
            sanitized,
        };
    }
}

module.exports = Validator;
