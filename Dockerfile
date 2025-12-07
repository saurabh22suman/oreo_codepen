# ==================================
# Oreo CodePen - Multi-stage Dockerfile
# ==================================

# ---- Base Stage ----
FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies for node-gyp (if needed for native modules)
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# ---- Development Stage ----
FROM base AS development
ENV NODE_ENV=development

# Install all dependencies (including devDependencies)
RUN npm install

# Install nodemon globally for hot-reload
RUN npm install -g nodemon

# Copy source code
COPY . .

# Create necessary directories
RUN mkdir -p projects

# Expose port
EXPOSE 3000

# Start with nodemon for hot-reload
CMD ["nodemon", "--watch", ".", "--ext", "js,json", "server.js"]

# ---- Production Build Stage ----
FROM base AS production-build
ENV NODE_ENV=production

# Install only production dependencies
RUN npm ci --only=production

# ---- Production Stage ----
FROM node:20-alpine AS production
ENV NODE_ENV=production
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S oreo && \
    adduser -S oreo -u 1001 -G oreo

# Copy production dependencies from build stage
COPY --from=production-build /app/node_modules ./node_modules

# Copy application code
COPY --chown=oreo:oreo . .

# Create necessary directories
RUN mkdir -p projects data

# Create entrypoint script to handle volume permissions
RUN echo '#!/bin/sh' > /entrypoint.sh && \
    echo 'chown -R oreo:oreo /app/data /app/projects 2>/dev/null || true' >> /entrypoint.sh && \
    echo '[ ! -f /app/data/metadata.json ] && echo "{\"projects\":{}}" > /app/data/metadata.json' >> /entrypoint.sh && \
    echo 'chown oreo:oreo /app/data/metadata.json 2>/dev/null || true' >> /entrypoint.sh && \
    echo 'exec su-exec oreo node server.js' >> /entrypoint.sh && \
    chmod +x /entrypoint.sh

# Install su-exec for dropping privileges
RUN apk add --no-cache su-exec

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Run as root initially, entrypoint drops to oreo user
USER root

# Start via entrypoint
ENTRYPOINT ["/entrypoint.sh"]