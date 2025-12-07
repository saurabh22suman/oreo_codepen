# 🐳 Docker Setup Guide

> Complete guide for running Oreo CodePen with Docker Compose

---

## 📋 Quick Reference

| Environment | Command | Description |
|-------------|---------|-------------|
| **Development** | `docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build` | Hot-reload, debug port |
| **Production** | `docker-compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d` | Optimized, secure |

Or using **Makefile** shortcuts:

```bash
make dev      # Start development
make prod     # Start production
make stop     # Stop all containers
make clean    # Remove everything
```

---

## 🏗 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Host Machine                                 │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                  oreo-codepen container                      │   │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────────┐  │   │
│  │  │  Node.js    │───▶│  Express    │───▶│  Static Files   │  │   │
│  │  │  Runtime    │    │  Server     │    │  Serving        │  │   │
│  │  └─────────────┘    └─────────────┘    └─────────────────┘  │   │
│  │                                                              │   │
│  │  Volumes:                                                    │   │
│  │  • /app/projects ──────▶ ./projects (static files)         │   │
│  │  • /app/metadata.json ─▶ ./metadata.json                    │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  Public URLs:                                                        │
│  • http://localhost:3000        → Dashboard                         │
│  • http://localhost:3000/p/:hash → Project static files             │
└─────────────────────────────────────────────────────────────────────┘
```

**Note:** Projects are served as static files directly by Express. No separate
containers are created for individual projects.

---

## 📁 File Structure

```
oreo_codepen/
├── 🐳 Dockerfile              # Multi-stage build (dev & prod)
├── 🐳 docker-compose.yml      # Base configuration
├── 🐳 docker-compose.dev.yml  # Development overrides
├── 🐳 docker-compose.prod.yml # Production overrides
├── 🐳 .dockerignore           # Build context exclusions
├── 📋 Makefile                # Convenient shortcuts
├── 📄 .env                    # Environment variables
└── ...
```

---

## 🚀 Getting Started

### Prerequisites

- Docker Engine 20.10+
- Docker Compose v2.0+

### Step 1: Initial Setup

```bash
# Clone the repository
git clone https://github.com/saurabh22suman/oreo_codepen.git
cd oreo_codepen

# Create environment file
cp .env.example .env

# Edit .env with your settings
nano .env
```

### Step 2: Configure Environment

Edit `.env` file:

```env
APP_USERNAME=admin
APP_PASSWORD=your_secure_password
PORT=3000
SESSION_SECRET=your-very-long-random-secret-key
```

---

## 💻 Development Environment

### Features
- ✅ Hot-reload with nodemon
- ✅ Source code volume mounting
- ✅ Debug port (9229) exposed
- ✅ All dependencies included
- ✅ Verbose logging

### Start Development

```bash
# Using docker-compose directly
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build

# Or using Makefile
make dev

# Run in background
make dev-detached
```

### Access Points
| Service | URL |
|---------|-----|
| Application | http://localhost:3000 |
| Node.js Debugger | localhost:9229 |

### Development Commands

```bash
# View logs
make logs-dev

# Open shell in container
make shell-dev

# Restart after changes (if not using hot-reload)
docker-compose -f docker-compose.yml -f docker-compose.dev.yml restart
```

---

## 🏭 Production Environment

### Features
- ✅ Optimized multi-stage build
- ✅ Non-root user execution
- ✅ Health checks enabled
- ✅ Resource limits (CPU & Memory)
- ✅ JSON logging with rotation
- ✅ Read-only filesystem
- ✅ Named volumes for persistence

### Start Production

```bash
# Using docker-compose directly
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d

# Or using Makefile
make prod
```

### Production Commands

```bash
# View logs
make logs-prod

# Check status
make status

# Open shell in container
make shell-prod
```

### Resource Limits

| Resource | Limit | Reservation |
|----------|-------|-------------|
| CPU | 1.0 core | 0.25 core |
| Memory | 512 MB | 128 MB |

---

## 🔧 Makefile Commands

| Command | Description |
|---------|-------------|
| `make help` | Show all available commands |
| `make dev` | Start development environment |
| `make dev-detached` | Start dev in background |
| `make prod` | Start production environment |
| `make build-dev` | Build development image only |
| `make build-prod` | Build production image only |
| `make logs-dev` | Follow development logs |
| `make logs-prod` | Follow production logs |
| `make shell-dev` | Open shell in dev container |
| `make shell-prod` | Open shell in prod container |
| `make stop` | Stop all containers |
| `make clean` | Remove containers, volumes, and images |
| `make status` | Show container status |
| `make setup` | Initial project setup |

---

## 🔐 Security Considerations

### Development
- ⚠️ Debug port exposed (disable in sensitive environments)
- ⚠️ Source code mounted (convenient but less secure)

### Production
- ✅ Non-root user
- ✅ Read-only root filesystem
- ✅ Resource limits prevent DoS
- ✅ Health checks for reliability
- ✅ Log rotation prevents disk fill
- ✅ `no-new-privileges` security option

---

## 🐛 Troubleshooting

### Container won't start

```bash
# Check logs
docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs

# Verify environment
cat .env
```

### Port already in use

```bash
# Change port in .env
PORT=3001

# Or find and kill the process
netstat -nlp | grep 3000
```

### Clear everything and start fresh

```bash
make clean
make setup
make dev
```

---

## 📊 Image Sizes

| Image | Approximate Size |
|-------|------------------|
| Development | ~300 MB |
| Production | ~150 MB |

---

*Documentation updated: December 2025*
