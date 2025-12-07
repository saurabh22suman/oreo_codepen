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
    adduser -S oreo -u 1001

# Copy production dependencies from build stage
COPY --from=production-build /app/node_modules ./node_modules

# Copy application code
COPY --chown=oreo:oreo . .

# Create necessary directories with proper permissions
RUN mkdir -p projects data && chown -R oreo:oreo projects data

# Switch to non-root user
USER oreo

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/auth/check', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Start the application
CMD ["node", "server.js"]
