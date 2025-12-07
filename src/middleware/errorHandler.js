/**
 * Error Handler Middleware
 * Centralized error handling
 */

const ResponseHelper = require('../utils/responseHelper');
const config = require('../config');

/**
 * Not Found Handler
 */
function notFoundHandler(req, res, next) {
    ResponseHelper.notFound(res, `Route ${req.method} ${req.path} not found`);
}

/**
 * Global Error Handler
 */
function errorHandler(err, req, res, next) {
    console.error('Error:', err);

    // Multer errors
    if (err.code === 'LIMIT_FILE_SIZE') {
        return ResponseHelper.badRequest(res, 'File too large. Maximum size is 5MB per file.');
    }

    if (err.code === 'LIMIT_FILE_COUNT') {
        return ResponseHelper.badRequest(res, `Too many files. Maximum is ${config.upload.maxFiles} files.`);
    }

    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return ResponseHelper.badRequest(res, 'Unexpected file field.');
    }

    // Validation errors
    if (err.name === 'ValidationError') {
        return ResponseHelper.badRequest(res, err.message, err.errors);
    }

    // File type error
    if (err.message && err.message.includes('Invalid file type')) {
        return ResponseHelper.badRequest(res, err.message);
    }

    // Docker errors
    if (err.message && err.message.includes('Docker')) {
        return ResponseHelper.serverError(res, 'Docker operation failed. Please try again.');
    }

    // Default server error
    const message = config.nodeEnv === 'development'
        ? err.message
        : 'An unexpected error occurred';

    ResponseHelper.serverError(res, message);
}

/**
 * Async handler wrapper
 * Catches async errors and passes to error handler
 */
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

module.exports = {
    notFoundHandler,
    errorHandler,
    asyncHandler,
};
