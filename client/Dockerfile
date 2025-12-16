# ============================================
# Multi-Stage Build for React + Vite Frontend
# ============================================
# Stage 1: Build the application
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build arguments for all environment variables (set by deployment platform)
ARG VITE_API

# Set environment variables for Vite build
ENV VITE_API=${VITE_API}

# Build the application
RUN npm run build

# ============================================
# Stage 2: Serve with Nginx
FROM nginx:alpine

# Install gettext for envsubst command
RUN apk add --no-cache gettext

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx template (not the final config)
COPY nginx.conf.template /etc/nginx/conf.d/default.conf.template

# Copy entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Set default SERVER_NAME environment variable
ENV SERVER_NAME=_

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

# Use custom entrypoint that runs envsubst before nginx
ENTRYPOINT ["/docker-entrypoint.sh"]
