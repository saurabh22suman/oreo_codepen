const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const multer = require('multer');
const Docker = require('dockerode');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const crypto = require('crypto');

require('dotenv').config();

const app = express();
const docker = new Docker();
const PORT = process.env.PORT || 3000;
const APP_USERNAME = process.env.APP_USERNAME || 'admin';
const APP_PASSWORD = process.env.APP_PASSWORD || 'admin123';
const SESSION_SECRET = process.env.SESSION_SECRET || 'default-secret';

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Serve static files
app.use(express.static('public'));

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const projectPath = path.join(__dirname, 'projects', req.params.id);
    cb(null, projectPath);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});
const upload = multer({ storage });

// Metadata file path
const METADATA_FILE = path.join(__dirname, 'metadata.json');

// Helper functions
async function loadMetadata() {
  try {
    const data = await fs.readFile(METADATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return { projects: {} };
  }
}

async function saveMetadata(metadata) {
  await fs.writeFile(METADATA_FILE, JSON.stringify(metadata, null, 2));
}

function generateHash() {
  return crypto.randomBytes(8).toString('hex');
}

// Authentication middleware
function requireAuth(req, res, next) {
  if (req.session && req.session.authenticated) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized' });
}

// Routes

// Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === APP_USERNAME && password === APP_PASSWORD) {
    req.session.authenticated = true;
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Logout
app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// Check auth status
app.get('/api/auth/check', (req, res) => {
  res.json({ authenticated: req.session && req.session.authenticated });
});

// Get all projects
app.get('/api/projects', requireAuth, async (req, res) => {
  try {
    const metadata = await loadMetadata();
    res.json(metadata.projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new project
app.post('/api/projects', requireAuth, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    const projectId = generateHash();
    const projectPath = path.join(__dirname, 'projects', projectId);

    // Create project directory
    await fs.mkdir(projectPath, { recursive: true });

    // Create default index.html
    const defaultHtml = `<!DOCTYPE html>
<html>
<head>
  <title>${name}</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <h1>Welcome to ${name}</h1>
  <p>Upload your HTML, CSS, and JS files to get started!</p>
  <script src="script.js"></script>
</body>
</html>`;

    const defaultCss = `body {
  font-family: Arial, sans-serif;
  max-width: 800px;
  margin: 50px auto;
  padding: 20px;
  background-color: #f5f5f5;
}

h1 {
  color: #333;
}`;

    const defaultJs = `console.log('Project ${name} loaded!');`;

    await fs.writeFile(path.join(projectPath, 'index.html'), defaultHtml);
    await fs.writeFile(path.join(projectPath, 'style.css'), defaultCss);
    await fs.writeFile(path.join(projectPath, 'script.js'), defaultJs);

    // Save metadata
    const metadata = await loadMetadata();
    metadata.projects[projectId] = {
      name,
      hash: projectId,
      createdAt: new Date().toISOString(),
      containerStatus: 'stopped'
    };
    await saveMetadata(metadata);

    res.json({ projectId, ...metadata.projects[projectId] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload files to project
app.post('/api/projects/:id/upload', requireAuth, upload.array('files', 10), async (req, res) => {
  try {
    const { id } = req.params;
    const metadata = await loadMetadata();

    if (!metadata.projects[id]) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ success: true, filesUploaded: req.files.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start project container
app.post('/api/projects/:id/start', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const metadata = await loadMetadata();

    if (!metadata.projects[id]) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const projectPath = path.join(__dirname, 'projects', id);
    const containerName = `oreo-project-${id}`;

    // Check if container already exists
    const containers = await docker.listContainers({ all: true });
    let container = containers.find(c => c.Names.includes(`/${containerName}`));

    if (container) {
      // Start existing container
      const containerObj = docker.getContainer(container.Id);
      if (container.State !== 'running') {
        await containerObj.start();
      }
    } else {
      // Create new container
      const absolutePath = path.resolve(projectPath);
      container = await docker.createContainer({
        Image: 'nginx:alpine',
        name: containerName,
        HostConfig: {
          Binds: [`${absolutePath}:/usr/share/nginx/html:ro`],
          PortBindings: {
            '80/tcp': [{ HostPort: '0' }] // Dynamic port
          },
          RestartPolicy: {
            Name: 'unless-stopped'
          }
        }
      });
      await container.start();
    }

    // Get container info for port
    const containerInfo = await docker.getContainer(containerName).inspect();
    const port = containerInfo.NetworkSettings.Ports['80/tcp'][0].HostPort;

    metadata.projects[id].containerStatus = 'running';
    metadata.projects[id].port = port;
    metadata.projects[id].url = `http://localhost:${port}`;
    await saveMetadata(metadata);

    res.json(metadata.projects[id]);
  } catch (error) {
    console.error('Error starting container:', error);
    res.status(500).json({ error: error.message });
  }
});

// Stop project container
app.post('/api/projects/:id/stop', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const metadata = await loadMetadata();

    if (!metadata.projects[id]) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const containerName = `oreo-project-${id}`;
    const container = docker.getContainer(containerName);

    try {
      await container.stop();
      metadata.projects[id].containerStatus = 'stopped';
      delete metadata.projects[id].port;
      delete metadata.projects[id].url;
      await saveMetadata(metadata);
    } catch (error) {
      if (error.statusCode === 304) {
        // Container already stopped
        metadata.projects[id].containerStatus = 'stopped';
        await saveMetadata(metadata);
      } else {
        throw error;
      }
    }

    res.json(metadata.projects[id]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete project
app.delete('/api/projects/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const metadata = await loadMetadata();

    if (!metadata.projects[id]) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Stop and remove container
    const containerName = `oreo-project-${id}`;
    try {
      const container = docker.getContainer(containerName);
      await container.stop();
      await container.remove();
    } catch (error) {
      // Container might not exist, continue
      console.log('Container cleanup:', error.message);
    }

    // Remove project directory
    const projectPath = path.join(__dirname, 'projects', id);
    await fs.rm(projectPath, { recursive: true, force: true });

    // Remove from metadata
    delete metadata.projects[id];
    await saveMetadata(metadata);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get project files
app.get('/api/projects/:id/files', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const metadata = await loadMetadata();

    if (!metadata.projects[id]) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const projectPath = path.join(__dirname, 'projects', id);
    const files = await fs.readdir(projectPath);

    const fileContents = {};
    for (const file of files) {
      const filePath = path.join(projectPath, file);
      const stat = await fs.stat(filePath);
      if (stat.isFile()) {
        fileContents[file] = await fs.readFile(filePath, 'utf8');
      }
    }

    res.json(fileContents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Login with username: ${APP_USERNAME}`);

  // Ensure projects directory exists
  const projectsDir = path.join(__dirname, 'projects');
  if (!fsSync.existsSync(projectsDir)) {
    fsSync.mkdirSync(projectsDir, { recursive: true });
  }
});
