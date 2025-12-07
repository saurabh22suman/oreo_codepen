/**
 * Project Routes
 * Admin routes for project management
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const projectController = require('../controllers/projectController');
const { requireAuth } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');
const config = require('../config');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const projectPath = path.join(process.cwd(), config.paths.projects, req.params.id);
        cb(null, projectPath);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    },
});

const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (config.upload.allowedExtensions.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error(`File type ${ext} not allowed`), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: config.upload.maxFileSize,
        files: config.upload.maxFiles,
    },
});

// Apply auth middleware to all routes
router.use(requireAuth);

// Project CRUD routes
router.get('/', asyncHandler(projectController.getAllProjects.bind(projectController)));
router.get('/:id', asyncHandler(projectController.getProject.bind(projectController)));
router.post('/', asyncHandler(projectController.createProject.bind(projectController)));
router.put('/:id', asyncHandler(projectController.updateProject.bind(projectController)));
router.delete('/:id', asyncHandler(projectController.deleteProject.bind(projectController)));

// File management routes
router.post('/:id/upload', upload.array('files', config.upload.maxFiles), asyncHandler(projectController.uploadFiles.bind(projectController)));
router.get('/:id/files', asyncHandler(projectController.getProjectFiles.bind(projectController)));
router.put('/:id/files/:filename', asyncHandler(projectController.renameFile.bind(projectController)));
router.delete('/:id/files/:filename', asyncHandler(projectController.deleteFile.bind(projectController)));

module.exports = router;
