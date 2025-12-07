/**
 * Public Routes
 * Public-facing endpoints (no authentication required)
 */

const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');
const { asyncHandler } = require('../middleware/errorHandler');

// GET /api/public/projects - Public gallery listing
router.get('/projects', asyncHandler(publicController.getPublicProjects.bind(publicController)));

// GET /api/public/projects/:hash - Get project by public hash
router.get('/projects/:hash', asyncHandler(publicController.getProjectByHash.bind(publicController)));

module.exports = router;
