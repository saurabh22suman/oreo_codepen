# 🍪 Oreo CodePen

A lightweight web application to park UI pages and mock designs. Create projects, upload HTML/CSS/JS files, and deploy them as Docker containers with unique URLs.

## Features

- **Simple Authentication**: Login using environment variables (APP_USERNAME, APP_PASSWORD)
- **Project Management**: Create, view, and delete projects
- **File Upload**: Upload HTML, CSS, and JavaScript files
- **Docker Integration**: Each project runs in its own Nginx container
- **Unique URLs**: Each project gets a unique hash-based URL
- **Container Control**: Start, stop, and remove Docker containers
- **Dashboard UI**: Simple and intuitive interface to manage all projects

## Prerequisites

- Node.js (v14 or higher)
- Docker
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone https://github.com/saurabh22suman/oreo_codepen.git
cd oreo_codepen
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file from the example:
```bash
cp .env.example .env
```

4. Edit the `.env` file with your credentials:
```env
APP_USERNAME=your_username
APP_PASSWORD=your_password
PORT=3000
SESSION_SECRET=your-secret-key-here
```

5. Ensure Docker is running:
```bash
docker --version
```

## Usage

1. Start the server:
```bash
npm start
```

2. Open your browser and navigate to:
```
http://localhost:3000
```

3. Login with the credentials you set in `.env`

4. Create a new project:
   - Click "New Project"
   - Enter a project name
   - Default files (index.html, style.css, script.js) are created

5. Upload your files:
   - Click "Upload" on any project
   - Select your HTML, CSS, and JS files
   - Upload them

6. Start the project:
   - Click "Start" to deploy the project in a Docker container
   - Your project will be accessible at the displayed URL

7. Manage projects:
   - Stop: Stop the Docker container
   - Delete: Remove the project and its container

## Project Structure

```
oreo_codepen/
├── public/              # Frontend files
│   ├── index.html      # Main HTML file
│   ├── styles.css      # Styling
│   └── app.js          # Frontend JavaScript
├── projects/           # Project directories (auto-created)
├── server.js           # Backend server
├── metadata.json       # Project metadata (auto-created)
├── package.json        # Dependencies
├── .env.example        # Environment variables template
├── .gitignore          # Git ignore file
└── README.md           # This file
```

## API Endpoints

### Authentication
- `POST /api/login` - Login with username and password
- `POST /api/logout` - Logout
- `GET /api/auth/check` - Check authentication status

### Projects
- `GET /api/projects` - Get all projects
- `POST /api/projects` - Create a new project
- `DELETE /api/projects/:id` - Delete a project
- `POST /api/projects/:id/upload` - Upload files to a project
- `POST /api/projects/:id/start` - Start project container
- `POST /api/projects/:id/stop` - Stop project container
- `GET /api/projects/:id/files` - Get project files

## Docker

Each project runs in an Nginx Alpine container with:
- Auto-restart policy (unless-stopped)
- Dynamic port assignment
- Read-only mount of project files
- Automatic cleanup on project deletion

## Security Notes

- Always use strong passwords in production
- Change the SESSION_SECRET to a random string
- Consider using HTTPS in production
- The `.env` file is ignored by git to protect credentials
- Projects run in isolated Docker containers

## Development

For development with auto-restart, you can use nodemon:
```bash
npm install -g nodemon
nodemon server.js
```

## Troubleshooting

### Docker Permission Issues
If you get Docker permission errors:
```bash
sudo usermod -aG docker $USER
newgrp docker
```

### Port Already in Use
If port 3000 is already in use, change the PORT in `.env`:
```env
PORT=3001
```

### Container Won't Start
Ensure Docker daemon is running:
```bash
sudo systemctl start docker
```

## License

ISC

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
