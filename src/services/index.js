/**
 * Services Index
 * Export all services for easy importing
 */

const projectService = require('./projectService');
const metadataService = require('./metadataService');
const authService = require('./authService');

module.exports = {
    projectService,
    metadataService,
    authService,
};
