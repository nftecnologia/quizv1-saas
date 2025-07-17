# Multi-stage Dockerfile for Quiz Platform
# Optimized for production deployment

# Build stage for frontend
FROM node:18-alpine AS frontend-builder

# Set working directory
WORKDIR /app/frontend

# Install dependencies first (for better caching)
COPY frontend/package*.json ./
RUN npm ci --only=production=false --no-audit --no-fund

# Copy frontend source
COPY frontend/ ./

# Build frontend
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_API_URL
ARG VITE_SENTRY_DSN
ARG VITE_ENVIRONMENT=production

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SENTRY_DSN=$VITE_SENTRY_DSN
ENV VITE_ENVIRONMENT=$VITE_ENVIRONMENT

RUN npm run build

# Build stage for backend
FROM node:18-alpine AS backend-builder

# Set working directory
WORKDIR /app/backend

# Install dependencies
COPY backend/package*.json ./
RUN npm ci --only=production=false --no-audit --no-fund

# Copy backend source
COPY backend/ ./

# Build backend
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install security updates and required packages
RUN apk update && apk upgrade && \
    apk add --no-cache \
    dumb-init \
    curl \
    ca-certificates && \
    rm -rf /var/cache/apk/*

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY backend/package*.json ./

# Install production dependencies only
RUN npm ci --only=production --no-audit --no-fund && \
    npm cache clean --force

# Copy built backend
COPY --from=backend-builder --chown=nextjs:nodejs /app/backend/dist ./dist

# Copy built frontend to serve static files
COPY --from=frontend-builder --chown=nextjs:nodejs /app/frontend/dist ./public

# Create necessary directories
RUN mkdir -p /app/logs && \
    chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/v1/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/server.js"]

# Labels for metadata
LABEL name="quiz-platform" \
      version="1.0.0" \
      description="Quiz Platform - Full Stack Application" \
      maintainer="your-email@example.com"