/**
 * Project Controller
 * Handles admin project management endpoints
 */

const projectService = require('../services/projectService');
const ResponseHelper = require('../utils/responseHelper');
const Validator = require('../utils/validator');
const config = require('../config');

class ProjectController {
    /**
     * GET /api/projects
     * Get all projects (admin view)
     */
    async getAllProjects(req, res) {
        try {
            const projects = await projectService.getAllProjects();
            return ResponseHelper.success(res, projects);
        } catch (error) {
            return ResponseHelper.serverError(res, error.message);
        }
    }

    /**
     * GET /api/projects/:id
     * Get a single project
     */
    async getProject(req, res) {
        try {
            const { id } = req.params;
            const project = await projectService.getProject(id);

            if (!project) {
                return ResponseHelper.notFound(res, 'Project not found');
            }

            return ResponseHelper.success(res, project);
        } catch (error) {
            return ResponseHelper.serverError(res, error.message);
        }
    }

    /**
     * POST /api/projects
     * Create a new project
     */
    async createProject(req, res) {
        try {
            const { name, description, type, externalUrl } = req.body;

            // Validate input
            const validation = Validator.validateProjectInput({
                name,
                description,
                type,
                externalUrl,
            });

            if (!validation.isValid) {
                return ResponseHelper.badRequest(res, validation.errors.join(', '));
            }

            const project = await projectService.createProject({
                name: Validator.sanitizeText(name),
                description: Validator.sanitizeText(description || ''),
                type: type || 'hosted',
                externalUrl: type === 'external' ? externalUrl : null,
            });

            return ResponseHelper.created(res, project, 'Project created successfully');
        } catch (error) {
            return ResponseHelper.serverError(res, error.message);
        }
    }

    /**
     * PUT /api/projects/:id
     * Update a project
     */
    async updateProject(req, res) {
        try {
            const { id } = req.params;
            const { name, description, externalUrl, visible } = req.body;

            const project = await projectService.updateProject(id, {
                name: name ? Validator.sanitizeText(name) : undefined,
                description: description !== undefined ? Validator.sanitizeText(description) : undefined,
                externalUrl,
                visible,
            });

            return ResponseHelper.success(res, project, 'Project updated successfully');
        } catch (error) {
            if (error.message === 'Project not found') {
                return ResponseHelper.notFound(res, error.message);
            }
            return ResponseHelper.serverError(res, error.message);
        }
    }

    /**
     * DELETE /api/projects/:id
     * Delete a project
     */
    async deleteProject(req, res) {
        try {
            const { id } = req.params;
            await projectService.deleteProject(id);
            return ResponseHelper.success(res, null, 'Project deleted successfully');
        } catch (error) {
            if (error.message === 'Project not found') {
                return ResponseHelper.notFound(res, error.message);
            }
            return ResponseHelper.serverError(res, error.message);
        }
    }

    /**
     * POST /api/projects/:id/upload
     * Upload files to a project
     */
    async uploadFiles(req, res) {
        try {
            const { id } = req.params;
            const files = req.files;

            if (!files || files.length === 0) {
                return ResponseHelper.badRequest(res, 'No files uploaded');
            }

            const result = await projectService.uploadFiles(id, files);
            return ResponseHelper.success(res, result, 'Files uploaded successfully');
        } catch (error) {
            if (error.message === 'Project not found') {
                return ResponseHelper.notFound(res, error.message);
            }
            return ResponseHelper.serverError(res, error.message);
        }
    }

    /**
     * GET /api/projects/:id/files
     * Get project files list
     */
    async getProjectFiles(req, res) {
        try {
            const { id } = req.params;
            const files = await projectService.listProjectFiles(id);
            return ResponseHelper.success(res, files);
        } catch (error) {
            if (error.message === 'Project not found') {
                return ResponseHelper.notFound(res, error.message);
            }
            return ResponseHelper.serverError(res, error.message);
        }
    }

    /**
     * PUT /api/projects/:id/files/:filename
     * Rename a file
     */
    async renameFile(req, res) {
        try {
            const { id, filename } = req.params;
            const { newName } = req.body;

            if (!newName) {
                return ResponseHelper.badRequest(res, 'New filename is required');
            }

            const result = await projectService.renameFile(id, filename, newName);
            return ResponseHelper.success(res, result, 'File renamed successfully');
        } catch (error) {
            if (error.message === 'Project not found' || error.message === 'File not found') {
                return ResponseHelper.notFound(res, error.message);
            }
            return ResponseHelper.serverError(res, error.message);
        }
    }

    /**
     * DELETE /api/projects/:id/files/:filename
     * Delete a file
     */
    async deleteFile(req, res) {
        try {
            const { id, filename } = req.params;
            await projectService.deleteFile(id, filename);
            return ResponseHelper.success(res, null, 'File deleted successfully');
        } catch (error) {
            if (error.message === 'Project not found' || error.message === 'File not found') {
                return ResponseHelper.notFound(res, error.message);
            }
            return ResponseHelper.serverError(res, error.message);
        }
    }
}

module.exports = new ProjectController();

