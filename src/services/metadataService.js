/**
 * Metadata Service
 * Handles all metadata operations (CRUD for projects)
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const config = require('../config');

class MetadataService {
    constructor() {
        this.metadataPath = path.join(process.cwd(), config.paths.metadata);
        this.projectsPath = path.join(process.cwd(), config.paths.projects);
        this._ensureDirectories();
    }

    /**
     * Ensure required directories exist
     */
    _ensureDirectories() {
        // Ensure projects directory exists
        if (!fsSync.existsSync(this.projectsPath)) {
            fsSync.mkdirSync(this.projectsPath, { recursive: true });
        }

        // Ensure metadata parent directory exists (for /app/data/metadata.json)
        const metadataDir = path.dirname(this.metadataPath);
        if (metadataDir !== '.' && !fsSync.existsSync(metadataDir)) {
            fsSync.mkdirSync(metadataDir, { recursive: true });
        }
    }

    /**
     * Load metadata from file
     */
    async load() {
        try {
            const data = await fs.readFile(this.metadataPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            // Return default structure if file doesn't exist
            return { projects: {} };
        }
    }

    /**
     * Save metadata to file
     */
    async save(metadata) {
        await fs.writeFile(this.metadataPath, JSON.stringify(metadata, null, 2));
    }

    /**
     * Get all projects
     */
    async getAllProjects() {
        const metadata = await this.load();
        return metadata.projects || {};
    }

    /**
     * Get a single project by ID
     */
    async getProject(projectId) {
        const metadata = await this.load();
        return metadata.projects[projectId] || null;
    }

    /**
     * Get project by public hash
     */
    async getProjectByPublicHash(publicHash) {
        const metadata = await this.load();
        const projects = Object.entries(metadata.projects);

        for (const [id, project] of projects) {
            if (project.publicHash === publicHash) {
                return { id, ...project };
            }
        }

        return null;
    }

    /**
     * Create a new project
     */
    async createProject(projectId, projectData) {
        const metadata = await this.load();

        metadata.projects[projectId] = {
            ...projectData,
            hash: projectId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        await this.save(metadata);
        return metadata.projects[projectId];
    }

    /**
     * Update an existing project
     */
    async updateProject(projectId, updates) {
        const metadata = await this.load();

        if (!metadata.projects[projectId]) {
            throw new Error('Project not found');
        }

        metadata.projects[projectId] = {
            ...metadata.projects[projectId],
            ...updates,
            updatedAt: new Date().toISOString(),
        };

        await this.save(metadata);
        return metadata.projects[projectId];
    }

    /**
     * Delete a project
     */
    async deleteProject(projectId) {
        const metadata = await this.load();

        if (!metadata.projects[projectId]) {
            throw new Error('Project not found');
        }

        const project = metadata.projects[projectId];
        delete metadata.projects[projectId];

        await this.save(metadata);
        return project;
    }

    /**
     * Check if project exists
     */
    async projectExists(projectId) {
        const metadata = await this.load();
        return !!metadata.projects[projectId];
    }

    /**
     * Get public projects (for gallery view)
     */
    async getPublicProjects() {
        const metadata = await this.load();
        const publicProjects = {};

        for (const [id, project] of Object.entries(metadata.projects)) {
            publicProjects[id] = {
                name: project.name,
                description: project.description || '',
                type: project.type || 'hosted',
                containerStatus: project.containerStatus,
                externalUrl: project.type === 'external' ? project.externalUrl : null,
                publicHash: project.publicHash || null,
                url: project.url || null,
            };
        }

        return publicProjects;
    }
}

// Export singleton instance
module.exports = new MetadataService();
