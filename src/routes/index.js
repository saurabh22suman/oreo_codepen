/**
 * Routes Index
 * Aggregates all route modules
 */

const authRoutes = require('./authRoutes');
const projectRoutes = require('./projectRoutes');
const publicRoutes = require('./publicRoutes');

module.exports = {
    authRoutes,
    projectRoutes,
    publicRoutes,
};
