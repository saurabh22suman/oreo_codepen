/**
 * Public Controller
 * Handles public-facing endpoints (no auth required)
 * Static file serving for hosted projects
 */

const path = require('path');
const fs = require('fs');
const projectService = require('../services/projectService');
const ResponseHelper = require('../utils/responseHelper');
const config = require('../config');

class PublicController {
    constructor() {
        this.projectsPath = path.join(process.cwd(), config.paths.projects);
    }

    /**
     * GET /api/public/projects
     * Get all projects for public gallery (limited details)
     */
    async getPublicProjects(req, res) {
        try {
            const projects = await projectService.getPublicProjects();
            return ResponseHelper.success(res, projects);
        } catch (error) {
            return ResponseHelper.serverError(res, error.message);
        }
    }

    /**
     * GET /p/:hash or /p/:hash/*
     * Serve static files for hosted project
     */
    async accessProject(req, res) {
        try {
            const { hash } = req.params;
            const project = await projectService.getProjectByPublicHash(hash);

            if (!project) {
                return this._render404Page(res, 'Project not found');
            }

            if (project.type === 'external') {
                // Redirect to external URL
                return res.redirect(project.externalUrl);
            }

            // Get the requested file path
            const requestedPath = req.params.splat || req.params[0] || 'index.html';
            const filePath = path.join(this.projectsPath, project.id, requestedPath);

            // Security: Ensure we're not escaping the project directory
            const normalizedPath = path.normalize(filePath);
            const projectDir = path.join(this.projectsPath, project.id);

            if (!normalizedPath.startsWith(projectDir)) {
                return this._render404Page(res, 'Invalid path');
            }

            // Check if file exists
            if (!fs.existsSync(normalizedPath)) {
                // Try with index.html if it's a directory or no extension
                if (!path.extname(requestedPath)) {
                    const indexPath = path.join(normalizedPath, 'index.html');
                    if (fs.existsSync(indexPath)) {
                        return res.sendFile(indexPath);
                    }
                }
                return this._render404Page(res, 'File not found');
            }

            // Serve the file
            res.sendFile(normalizedPath);
        } catch (error) {
            console.error('Access project error:', error);
            return ResponseHelper.serverError(res, error.message);
        }
    }

    /**
     * Render 404 page
     */
    _render404Page(res, message) {
        const html = `<!DOCTYPE html>
<html>
<head>
    <title>Not Found</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            color: white;
        }
        .container {
            text-align: center;
            padding: 40px;
            background: rgba(255,255,255,0.05);
            border-radius: 16px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.1);
        }
        .icon { font-size: 64px; margin-bottom: 20px; }
        h1 { margin: 0 0 10px; font-size: 2rem; }
        p { margin: 0; opacity: 0.8; }
        a {
            display: inline-block;
            margin-top: 20px;
            padding: 12px 24px;
            background: rgba(255,255,255,0.1);
            color: white;
            text-decoration: none;
            border-radius: 8px;
            transition: background 0.3s;
        }
        a:hover { background: rgba(255,255,255,0.2); }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">🔍</div>
        <h1>404</h1>
        <p>${message}</p>
        <a href="/">← Back to Gallery</a>
    </div>
</body>
</html>`;
        res.status(404).type('text/html').send(html);
    }

    /**
     * GET /api/public/projects/:hash
     * Get public project details by hash
     */
    async getProjectByHash(req, res) {
        try {
            const { hash } = req.params;
            const project = await projectService.getProjectByPublicHash(hash);

            if (!project) {
                return ResponseHelper.notFound(res, 'Project not found');
            }

            // Return only public-safe information
            const publicInfo = {
                name: project.name,
                description: project.description,
                type: project.type,
                isLive: project.type === 'external' ? !!project.externalUrl : true,
            };

            return ResponseHelper.success(res, publicInfo);
        } catch (error) {
            return ResponseHelper.serverError(res, error.message);
        }
    }
}

module.exports = new PublicController();
