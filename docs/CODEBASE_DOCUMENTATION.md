# Oreo CodePen - Codebase Documentation

## Overview

**Oreo CodePen** is a personal UI showcase engine for hosting static HTML/CSS/JS pages. It allows you to parking UI mockups, demo pages, or any static web content with unique public URLs.

## Key Features

- **Simple Authentication** - Protected admin dashboard
- **Project Management** - Create, edit, delete projects
- **File Upload** - Drag & drop HTML/CSS/JS files
- **Static File Hosting** - Files served directly via Express
- **Unique URLs** - Each project gets a unique `/p/:hash` URL
- **Two Project Types**:
  - **Hosted**: Upload static files, served directly
  - **External**: Redirect to external URL

## Technology Stack

| Layer | Technology |
|-------|------------|
| Backend | Node.js, Express 5 |
| Frontend | Vanilla HTML/CSS/JS |
| Session | express-session |
| File Upload | multer |
| Data Storage | JSON file (metadata.json) |

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Browser                          │
├─────────────────────────────────────────────────────┤
│                 Express Server (:3000)              │
│  ┌─────────────┬─────────────┬─────────────┐       │
│  │   /api/*    │   /p/:hash  │   Static    │       │
│  │   Routes    │   Projects  │   Files     │       │
│  └─────────────┴─────────────┴─────────────┘       │
├─────────────────────────────────────────────────────┤
│                  File System                        │
│  ┌─────────────┬─────────────────────────────┐     │
│  │ metadata.json │      projects/            │     │
│  │ (project db) │  └── {projectId}/         │     │
│  │              │       ├── index.html       │     │
│  │              │       ├── style.css        │     │
│  │              │       └── script.js        │     │
│  └─────────────┴─────────────────────────────┘     │
└─────────────────────────────────────────────────────┘
```

## Project Structure

```
oreo_codepen/
├── src/
│   ├── config/          # Configuration
│   │   └── index.js     # Centralized config
│   ├── controllers/     # Route handlers
│   │   ├── authController.js
│   │   ├── projectController.js
│   │   └── publicController.js
│   ├── middleware/      # Express middleware
│   │   ├── authMiddleware.js
│   │   ├── errorHandler.js
│   │   └── rateLimiter.js
│   ├── routes/          # API routes
│   │   ├── authRoutes.js
│   │   ├── projectRoutes.js
│   │   └── publicRoutes.js
│   ├── services/        # Business logic
│   │   ├── authService.js
│   │   ├── metadataService.js
│   │   └── projectService.js
│   ├── utils/           # Utilities
│   │   ├── hashGenerator.js
│   │   ├── responseHelper.js
│   │   └── validator.js
│   └── app.js           # Express app setup
├── public/              # Frontend files
│   ├── index.html       # Main HTML
│   ├── app.js           # Frontend JS
│   └── styles.css       # Styling
├── projects/            # Hosted project files
├── server.js            # Entry point
├── metadata.json        # Project database
├── Dockerfile           # Docker config
├── docker-compose.yml   # Docker compose
└── package.json
```

## API Reference

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/login` | Login with credentials |
| POST | `/api/logout` | Logout and clear session |
| GET | `/api/auth/check` | Check authentication status |

### Projects (Admin)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List all projects |
| GET | `/api/projects/:id` | Get single project |
| POST | `/api/projects` | Create new project |
| PUT | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project |
| POST | `/api/projects/:id/upload` | Upload files |
| GET | `/api/projects/:id/files` | Get project files |

### Public

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/public/projects` | List public projects |
| GET | `/p/:hash` | Access hosted project |

## Project Types

### Hosted Projects
- Upload HTML/CSS/JS files
- Served directly via Express static middleware
- Access via `/p/:publicHash`
- Default files created on project creation

### External Projects
- Store external URL reference
- Redirects to external URL when accessed
- No file upload needed

## Configuration

Environment variables (in `.env`):

```env
# Server
PORT=3000
NODE_ENV=development

# Auth
APP_USERNAME=admin
APP_PASSWORD=your-secure-password
SESSION_SECRET=your-very-long-secret-key-here

# Base URL
APP_BASE_URL=http://localhost:3000
```

## Development

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm start
```

### Docker Development

```bash
# Start with Docker Compose
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs -f

# Rebuild
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build -d
```

## Security Features

1. **Rate Limiting** - Login attempts limited to prevent brute force
2. **Session Security** - HTTP-only cookies, secure in production
3. **Input Validation** - All inputs sanitized
4. **Path Traversal Prevention** - File paths validated
5. **XSS Prevention** - HTML escaped in frontend

## How It Works

1. **Create Project**: Admin creates a new project (hosted or external)
2. **Upload Files**: For hosted projects, upload HTML/CSS/JS files
3. **Access Project**: Visit `/p/:publicHash` to view the project
4. **Instant Live**: No startup delay - files served directly!

## Migration from Docker-based Hosting

The application was simplified from Docker container-based hosting to direct static file serving:

### Before (Docker)
- Each project = Nginx container
- Start/Stop buttons needed
- Container startup delay
- Complex volume mounting
- Docker dependency

### After (Direct Serving)
- Each project = Folder with files
- Always live (no start/stop)
- Instant access
- Simple file paths
- No Docker needed for projects

