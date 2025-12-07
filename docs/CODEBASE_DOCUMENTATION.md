# 🍪 Oreo CodePen - Codebase Documentation

> **Last Updated:** December 7, 2025  
> **Version:** 1.0.0  
> **License:** ISC

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Architecture](#architecture)
4. [Project Structure](#project-structure)
5. [Backend API Reference](#backend-api-reference)
6. [Frontend Architecture](#frontend-architecture)
7. [Authentication Flow](#authentication-flow)
8. [Docker Integration](#docker-integration)
9. [Configuration](#configuration)
10. [Development Guide](#development-guide)
11. [Security Considerations](#security-considerations)

---

## 📖 Overview

**Oreo CodePen** is a lightweight web application designed to park UI pages and mock designs. It allows users to create projects, upload HTML/CSS/JS files, and deploy them as individual Docker containers with unique URLs.

### Key Features

| Feature | Description |
|---------|-------------|
| **Simple Authentication** | Environment variable-based login using session management |
| **Project Management** | Full CRUD operations for projects |
| **File Upload** | Support for HTML, CSS, JavaScript, TXT, and JSON files |
| **Docker Integration** | Each project runs in its own isolated Nginx Alpine container |
| **Unique URLs** | Each project gets a hash-based identifier and dynamic port assignment |
| **Container Control** | Start, stop, and remove Docker containers directly from the UI |
| **Dashboard UI** | Clean and intuitive interface for managing all projects |

---

## 🛠 Technology Stack

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | v14+ | Runtime environment |
| **Express** | ^5.2.1 | Web framework |
| **express-session** | ^1.18.2 | Session management |
| **body-parser** | ^2.2.1 | Request body parsing |
| **multer** | ^2.0.2 | File upload handling |
| **dockerode** | ^4.0.9 | Docker API integration |
| **dotenv** | ^17.2.3 | Environment variable management |

### Frontend
| Technology | Purpose |
|------------|---------|
| **HTML5** | Page structure |
| **CSS3** | Styling with modern features |
| **Vanilla JavaScript** | Interactive functionality (no framework) |

### Infrastructure
| Technology | Purpose |
|------------|---------|
| **Docker** | Container runtime |
| **Nginx Alpine** | Web server for serving project files |

---

## 🏗 Architecture

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│    Browser      │◄────►│   Express.js     │◄────►│    Docker       │
│   (Frontend)    │      │    Server        │      │    Engine       │
└─────────────────┘      └──────────────────┘      └─────────────────┘
                                   │                        │
                                   ▼                        ▼
                         ┌──────────────────┐      ┌─────────────────┐
                         │  metadata.json   │      │ Nginx Containers│
                         │  (Project Data)  │      │ (Per Project)   │
                         └──────────────────┘      └─────────────────┘
                                   │
                                   ▼
                         ┌──────────────────┐
                         │  /projects/      │
                         │  (File Storage)  │
                         └──────────────────┘
```

### Data Flow

1. **User Authentication**: Browser → Express (Session-based auth)
2. **Project Operations**: Browser → Express → File System + metadata.json
3. **Container Management**: Express → Docker Engine via dockerode
4. **File Serving**: Browser → Nginx Container (individual project URLs)

---

## 📁 Project Structure

```
oreo_codepen/
├── 📄 server.js               # Main Express.js backend server (381 lines)
├── 📄 package.json            # Dependencies and scripts
├── 📄 .env.example            # Environment configuration template
├── 📄 .gitignore              # Git ignore rules
├── 📄 README.md               # Project documentation
├── 📄 metadata.json           # Project metadata (auto-created)
│
├── 📁 public/                 # Frontend static files
│   ├── 📄 index.html          # Main HTML file (102 lines)
│   ├── 📄 styles.css          # Styling (5.8KB)
│   └── 📄 app.js              # Frontend JavaScript (325 lines)
│
├── 📁 projects/               # Project directories (auto-created)
│   └── 📁 {project-hash}/     # Individual project files
│       ├── 📄 index.html
│       ├── 📄 style.css
│       └── 📄 script.js
│
└── 📁 docs/                   # Documentation
    └── 📄 CODEBASE_DOCUMENTATION.md
```

---

## 🔌 Backend API Reference

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/login` | Authenticate user | ❌ |
| `POST` | `/api/logout` | End user session | ❌ |
| `GET` | `/api/auth/check` | Check authentication status | ❌ |

#### Login Request
```json
POST /api/login
{
  "username": "string",
  "password": "string"
}
```

### Project Management Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/projects` | List all projects | ✅ |
| `POST` | `/api/projects` | Create new project | ✅ |
| `DELETE` | `/api/projects/:id` | Delete a project | ✅ |
| `POST` | `/api/projects/:id/upload` | Upload files | ✅ |
| `POST` | `/api/projects/:id/start` | Start container | ✅ |
| `POST` | `/api/projects/:id/stop` | Stop container | ✅ |
| `GET` | `/api/projects/:id/files` | Get project files | ✅ |

#### Create Project Request
```json
POST /api/projects
{
  "name": "string"
}
```

#### Project Response Schema
```json
{
  "name": "My Project",
  "hash": "a1b2c3d4e5f6g7h8",
  "createdAt": "2025-12-07T10:00:00.000Z",
  "containerStatus": "running" | "stopped",
  "port": 32768,
  "url": "http://localhost:32768"
}
```

---

## 🎨 Frontend Architecture

### Page Structure

1. **Login Page** (`#login-page`)
   - Simple form with username/password fields
   - Error message display

2. **Dashboard Page** (`#dashboard-page`)
   - Navigation bar with logout
   - Project grid view
   - Empty state display

3. **Modals**
   - **New Project Modal** (`#new-project-modal`) - Create project form
   - **Upload Modal** (`#upload-modal`) - File upload interface

### Key JavaScript Functions

| Function | Purpose |
|----------|---------|
| `checkAuth()` | Verify session on page load |
| `handleLogin(e)` | Process login form submission |
| `handleLogout()` | End session and redirect |
| `loadProjects()` | Fetch and render project list |
| `createProjectCard(id, project)` | Generate project card HTML |
| `handleCreateProject(e)` | Submit new project creation |
| `handleUploadFiles(e)` | Handle file upload process |
| `startProject(id)` | Start Docker container |
| `stopProject(id)` | Stop Docker container |
| `deleteProject(id, name)` | Remove project and container |

---

## 🔐 Authentication Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    User     │     │   Express   │     │   Session   │
│   Browser   │     │   Server    │     │   Store     │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       │  POST /api/login  │                   │
       │──────────────────►│                   │
       │                   │                   │
       │                   │  Verify Creds     │
       │                   │  (env vars)       │
       │                   │                   │
       │                   │  Create Session   │
       │                   │──────────────────►│
       │                   │                   │
       │  Set-Cookie       │                   │
       │◄──────────────────│                   │
       │                   │                   │
       │  API Request      │                   │
       │  + Cookie         │                   │
       │──────────────────►│                   │
       │                   │  Check Session    │
       │                   │──────────────────►│
       │                   │                   │
       │  Protected Data   │                   │
       │◄──────────────────│                   │
       │                   │                   │
```

### Session Configuration
- **Cookie Duration:** 24 hours
- **Secure:** false (development mode)
- **Secret:** Configurable via `SESSION_SECRET` env variable

---

## 🐳 Docker Integration

### Container Configuration

Each project is deployed as an independent Nginx Alpine container with the following configuration:

```javascript
{
  Image: 'nginx:alpine',
  name: `oreo-project-${projectId}`,
  HostConfig: {
    Binds: [`${projectPath}:/usr/share/nginx/html:ro`],
    PortBindings: {
      '80/tcp': [{ HostPort: '0' }]  // Dynamic port
    },
    RestartPolicy: {
      Name: 'unless-stopped'
    }
  }
}
```

### Container Lifecycle

| Action | Description |
|--------|-------------|
| **Create** | Container created on first "Start" action |
| **Start** | Reuses existing container if available |
| **Stop** | Gracefully stops the container |
| **Delete** | Stops and removes container + project files |

### Container Naming Convention
```
oreo-project-{16-character-hex-hash}
```

---

## ⚙️ Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `APP_USERNAME` | `admin` | Login username |
| `APP_PASSWORD` | `admin123` | Login password |
| `PORT` | `3000` | Server port |
| `SESSION_SECRET` | `default-secret` | Session encryption key |

### Setup Instructions

```bash
# 1. Create .env file
cp .env.example .env

# 2. Edit configuration
APP_USERNAME=your_username
APP_PASSWORD=your_strong_password
PORT=3000
SESSION_SECRET=your-random-secret-key
```

---

## 💻 Development Guide

### Quick Start

```bash
# Install dependencies
npm install

# Start the server
npm start

# For development with auto-restart
npm install -g nodemon
nodemon server.js
```

### File Upload Constraints

| Setting | Value |
|---------|-------|
| **Allowed Extensions** | `.html`, `.css`, `.js`, `.txt`, `.json` |
| **Max File Size** | 5MB per file |
| **Max Files** | 10 files per upload |

### Adding New File Types

Edit the `fileFilter` function in `server.js`:
```javascript
const allowedExtensions = ['.html', '.css', '.js', '.txt', '.json', '.svg'];
```

---

## 🔒 Security Considerations

### Current Security Features

- ✅ Session-based authentication
- ✅ File type validation
- ✅ File size limits
- ✅ Isolated Docker containers
- ✅ Read-only file mounts
- ✅ Environment variable credentials
- ✅ .env excluded from git

### Production Recommendations

| Recommendation | Priority |
|----------------|----------|
| Enable HTTPS | 🔴 Critical |
| Use strong SESSION_SECRET | 🔴 Critical |
| Set `cookie: { secure: true }` | 🔴 Critical |
| Add rate limiting | 🟡 High |
| Implement CSRF protection | 🟡 High |
| Add input sanitization | 🟡 High |
| Use database for metadata | 🟢 Medium |
| Add user management system | 🟢 Medium |

---

## 📊 Key Metrics

| Metric | Value |
|--------|-------|
| **Total Backend LOC** | ~381 lines |
| **Total Frontend JS LOC** | ~325 lines |
| **Dependencies** | 6 packages |
| **API Endpoints** | 10 routes |

---

## 🚀 Future Enhancements

1. **Multi-user support** with database-backed authentication
2. **Real-time collaboration** features
3. **Version control** for project files
4. **Custom domains** for deployed projects
5. **SSL/TLS** support for containers
6. **Template marketplace** for quick project creation
7. **Code editor** integration within the dashboard
8. **Build tools** integration (Vite, webpack, etc.)

---

*Documentation generated by Code Analysis | Last reviewed: December 2025*
