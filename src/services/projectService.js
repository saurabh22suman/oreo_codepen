/**
 * Project Service
 * Business logic for project management (Static File Hosting)
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const config = require('../config');
const metadataService = require('./metadataService');
const HashGenerator = require('../utils/hashGenerator');

class ProjectService {
    constructor() {
        this.projectsPath = path.join(process.cwd(), config.paths.projects);
    }

    /**
     * Get project directory path
     */
    getProjectPath(projectId) {
        return path.join(this.projectsPath, projectId);
    }

    /**
     * Get all projects (admin view)
     */
    async getAllProjects() {
        const projects = await metadataService.getAllProjects();

        // Add file info for each hosted project
        for (const [id, project] of Object.entries(projects)) {
            if (project.type !== 'external') {
                const projectPath = this.getProjectPath(id);
                project.hasFiles = await this._hasFiles(projectPath);
                project.isLive = project.hasFiles;
            } else {
                project.isLive = !!project.externalUrl;
            }
        }

        return projects;
    }

    /**
     * Get all projects (public view)
     */
    async getPublicProjects() {
        return await metadataService.getPublicProjects();
    }

    /**
     * Get a single project
     */
    async getProject(projectId) {
        const project = await metadataService.getProject(projectId);
        if (project && project.type !== 'external') {
            const projectPath = this.getProjectPath(projectId);
            project.hasFiles = await this._hasFiles(projectPath);
            project.isLive = project.hasFiles;
        }
        return project;
    }

    /**
     * Get project by public hash
     */
    async getProjectByPublicHash(publicHash) {
        return await metadataService.getProjectByPublicHash(publicHash);
    }

    /**
     * Create a new project
     */
    async createProject(projectData) {
        const projectId = HashGenerator.generate();
        const publicHash = HashGenerator.generatePublicHash();
        const projectPath = this.getProjectPath(projectId);

        // Create project directory for hosted projects
        if (projectData.type !== 'external') {
            await fs.mkdir(projectPath, { recursive: true });
            await this._createDefaultFiles(projectPath, projectData.name);
        }

        // Create project metadata
        const project = await metadataService.createProject(projectId, {
            name: projectData.name,
            description: projectData.description || '',
            type: projectData.type || 'hosted',
            externalUrl: projectData.type === 'external' ? projectData.externalUrl : null,
            publicHash: projectData.type !== 'external' ? publicHash : null,
        });

        return { projectId, ...project };
    }

    /**
     * Update a project
     */
    async updateProject(projectId, updates) {
        const project = await metadataService.getProject(projectId);
        if (!project) {
            throw new Error('Project not found');
        }

        // Prepare update object
        const updateData = {};

        if (updates.name !== undefined) {
            updateData.name = updates.name;
        }

        if (updates.description !== undefined) {
            updateData.description = updates.description;
        }

        if (updates.externalUrl !== undefined && project.type === 'external') {
            updateData.externalUrl = updates.externalUrl;
        }

        return await metadataService.updateProject(projectId, updateData);
    }

    /**
     * Delete a project
     */
    async deleteProject(projectId) {
        const project = await metadataService.getProject(projectId);
        if (!project) {
            throw new Error('Project not found');
        }

        // Remove project directory for hosted projects
        if (project.type !== 'external') {
            const projectPath = this.getProjectPath(projectId);
            await fs.rm(projectPath, { recursive: true, force: true });
        }

        // Remove from metadata
        await metadataService.deleteProject(projectId);

        return { success: true };
    }

    /**
     * Upload files to a project
     */
    async uploadFiles(projectId, files) {
        const project = await metadataService.getProject(projectId);
        if (!project) {
            throw new Error('Project not found');
        }

        if (project.type === 'external') {
            throw new Error('Cannot upload files to an external URL project');
        }

        return {
            success: true,
            filesUploaded: files.length,
            files: files.map(f => f.originalname),
        };
    }

    /**
     * Get project files
     */
    async getProjectFiles(projectId) {
        const project = await metadataService.getProject(projectId);
        if (!project) {
            throw new Error('Project not found');
        }

        if (project.type === 'external') {
            return {};
        }

        const projectPath = this.getProjectPath(projectId);

        try {
            const files = await fs.readdir(projectPath);
            const fileContents = {};

            for (const file of files) {
                const filePath = path.join(projectPath, file);
                const stat = await fs.stat(filePath);
                if (stat.isFile()) {
                    // Only read text-based files
                    const ext = path.extname(file).toLowerCase();
                    if (['.html', '.css', '.js', '.json', '.txt', '.svg'].includes(ext)) {
                        fileContents[file] = await fs.readFile(filePath, 'utf8');
                    } else {
                        fileContents[file] = `[Binary file: ${stat.size} bytes]`;
                    }
                }
            }

            return fileContents;
        } catch (error) {
            return {};
        }
    }

    /**
     * Get list of files in project directory
     */
    async listProjectFiles(projectId) {
        const projectPath = this.getProjectPath(projectId);

        try {
            const files = await fs.readdir(projectPath);
            const fileList = [];

            for (const file of files) {
                const filePath = path.join(projectPath, file);
                const stat = await fs.stat(filePath);
                if (stat.isFile()) {
                    fileList.push({
                        name: file,
                        size: stat.size,
                        modified: stat.mtime,
                    });
                }
            }

            return fileList;
        } catch (error) {
            return [];
        }
    }

    /**
     * Check if project directory has files
     */
    async _hasFiles(projectPath) {
        try {
            const files = await fs.readdir(projectPath);
            return files.length > 0;
        } catch (error) {
            return false;
        }
    }

    /**
     * Create default project files
     */
    async _createDefaultFiles(projectPath, projectName) {
        const defaultHtml = `<!DOCTYPE html>
<html>
<head>
  <title>${projectName}</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <h1>Welcome to ${projectName}</h1>
  <p>Upload your HTML, CSS, and JS files to get started!</p>
  <script src="script.js"></script>
</body>
</html>`;

        const defaultCss = `body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  max-width: 800px;
  margin: 50px auto;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  color: white;
}

h1 {
  text-align: center;
  font-size: 2.5rem;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
}

p {
  text-align: center;
  font-size: 1.2rem;
  opacity: 0.9;
}`;

        const defaultJs = `console.log('Project ${projectName} loaded!');

// Add some interactivity
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM fully loaded');
});`;

        await fs.writeFile(path.join(projectPath, 'index.html'), defaultHtml);
        await fs.writeFile(path.join(projectPath, 'style.css'), defaultCss);
        await fs.writeFile(path.join(projectPath, 'script.js'), defaultJs);
    }

    /**
     * Rename a file in a project
     */
    async renameFile(projectId, oldName, newName) {
        const project = await metadataService.getProject(projectId);
        if (!project) {
            throw new Error('Project not found');
        }

        if (project.type === 'external') {
            throw new Error('Cannot manage files for external URL projects');
        }

        const projectPath = this.getProjectPath(projectId);
        const oldPath = path.join(projectPath, oldName);
        const newPath = path.join(projectPath, newName);

        // Security: Ensure paths are within project directory
        const normalizedOld = path.normalize(oldPath);
        const normalizedNew = path.normalize(newPath);

        if (!normalizedOld.startsWith(projectPath) || !normalizedNew.startsWith(projectPath)) {
            throw new Error('Invalid file path');
        }

        // Check if old file exists
        try {
            await fs.access(oldPath);
        } catch {
            throw new Error('File not found');
        }

        // Check if new name already exists
        try {
            await fs.access(newPath);
            throw new Error('A file with that name already exists');
        } catch (e) {
            if (e.message === 'A file with that name already exists') {
                throw e;
            }
            // File doesn't exist, which is what we want
        }

        await fs.rename(oldPath, newPath);

        return {
            oldName,
            newName,
        };
    }

    /**
     * Delete a file from a project
     */
    async deleteFile(projectId, filename) {
        const project = await metadataService.getProject(projectId);
        if (!project) {
            throw new Error('Project not found');
        }

        if (project.type === 'external') {
            throw new Error('Cannot manage files for external URL projects');
        }

        const projectPath = this.getProjectPath(projectId);
        const filePath = path.join(projectPath, filename);

        // Security: Ensure path is within project directory
        const normalizedPath = path.normalize(filePath);
        if (!normalizedPath.startsWith(projectPath)) {
            throw new Error('Invalid file path');
        }

        // Check if file exists
        try {
            await fs.access(filePath);
        } catch {
            throw new Error('File not found');
        }

        await fs.unlink(filePath);

        return { deleted: filename };
    }
}

// Export singleton instance
module.exports = new ProjectService();

