/**
 * Response Helper
 * Standardized API response formatting
 */

class ResponseHelper {
    /**
     * Success response
     */
    static success(res, data = null, message = 'Success', statusCode = 200) {
        return res.status(statusCode).json({
            success: true,
            message,
            data,
            timestamp: new Date().toISOString(),
        });
    }

    /**
     * Created response (201)
     */
    static created(res, data, message = 'Resource created successfully') {
        return this.success(res, data, message, 201);
    }

    /**
     * Error response
     */
    static error(res, message = 'An error occurred', statusCode = 500, errors = null) {
        const response = {
            success: false,
            message,
            timestamp: new Date().toISOString(),
        };

        if (errors) {
            response.errors = errors;
        }

        return res.status(statusCode).json(response);
    }

    /**
     * Bad Request (400)
     */
    static badRequest(res, message = 'Bad request', errors = null) {
        return this.error(res, message, 400, errors);
    }

    /**
     * Unauthorized (401)
     */
    static unauthorized(res, message = 'Unauthorized') {
        return this.error(res, message, 401);
    }

    /**
     * Forbidden (403)
     */
    static forbidden(res, message = 'Forbidden') {
        return this.error(res, message, 403);
    }

    /**
     * Not Found (404)
     */
    static notFound(res, message = 'Resource not found') {
        return this.error(res, message, 404);
    }

    /**
     * Too Many Requests (429)
     */
    static tooManyRequests(res, message = 'Too many requests, please try again later') {
        return this.error(res, message, 429);
    }

    /**
     * Internal Server Error (500)
     */
    static serverError(res, message = 'Internal server error') {
        return this.error(res, message, 500);
    }
}

module.exports = ResponseHelper;
